import { UPLOAD_BUCKET } from '@/lib/constants';
import type {
  Attachment,
  ChatDetailResponse,
  ChatMessage,
  ChatOwner,
  ChatSummary,
  SendMessageResponse,
} from '@/lib/types';
import { DEFAULT_SYSTEM_PROMPT, getConfiguredModel, getInsforgeServerClient, createInsforgeServerClient } from '@/lib/insforge';
import { createAIProvider, getAIProviderName } from '@/lib/ai';
import type { UserContentPart, FileParserOptions } from '@/lib/ai';

type ChatSessionRow = ChatSummary & {
  visitor_id: string | null;
  user_id: string | null;
};

type ChatMessageRow = ChatMessage & {
  sort_order: number;
};

type AttachmentRow = {
  message_id: string;
  key: string;
  url: string;
  file_name: string;
  file_size: number;
  mime_type: string;
};


const INLINE_TEXT_MIME_TYPES = new Set([
  'text/plain',
  'text/csv',
  'text/markdown',
  'text/x-markdown',
]);
const INLINE_TEXT_CHAR_LIMIT = 12_000;

function ensureOwner(owner: ChatOwner): ChatOwner {
  const userId = owner.userId?.trim();
  const visitorId = owner.visitorId?.trim();

  if (!userId && !visitorId) {
    throw new Error('Missing owner identifier.');
  }

  if (userId && visitorId) {
    throw new Error('Only one of userId or visitorId may be provided.');
  }

  return userId ? { userId } : { visitorId };
}

function applyOwnerFilter<T extends { eq: (col: string, val: string) => T }>(
  query: T,
  owner: ChatOwner,
): T {
  if (owner.userId) {
    return query.eq('user_id', owner.userId);
  }
  return query.eq('visitor_id', owner.visitorId!);
}

function ownerInsertFields(owner: ChatOwner) {
  if (owner.userId) {
    return { user_id: owner.userId, visitor_id: null };
  }
  return { visitor_id: owner.visitorId!, user_id: null };
}

type InsforgeClient = ReturnType<typeof createInsforgeServerClient>;

function getClient(accessToken?: string | null): InsforgeClient {
  if (accessToken) {
    return createInsforgeServerClient({ accessToken });
  }
  return getInsforgeServerClient();
}

function buildTitle(input: string) {
  const compact = input.replace(/\s+/g, ' ').trim();
  if (!compact) {
    return 'New chat';
  }

  return compact.length > 60 ? `${compact.slice(0, 57)}...` : compact;
}

function assertNoDatabaseError(
  error: { message?: string } | null,
  fallbackMessage: string,
) {
  if (error) {
    throw new Error(error.message ?? fallbackMessage);
  }
}

async function getChatRow(owner: ChatOwner, chatId: string, accessToken?: string | null) {
  const insforge = getClient(accessToken);
  let query = insforge.database
    .from('chat_sessions')
    .select('id, visitor_id, user_id, title, created_at, last_message_at')
    .eq('id', chatId);

  query = applyOwnerFilter(query, owner);
  const { data, error } = await query.maybeSingle();

  assertNoDatabaseError(error, 'Unable to load the requested chat.');

  return (data as ChatSessionRow | null) ?? null;
}

async function getMessageRows(chatId: string, accessToken?: string | null) {
  const insforge = getClient(accessToken);
  const { data, error } = await insforge.database
    .from('chat_messages')
    .select('id, chat_id, role, content, created_at, sort_order')
    .eq('chat_id', chatId)
    .order('sort_order', { ascending: true });

  assertNoDatabaseError(error, 'Unable to load the requested messages.');

  const rows = (data as ChatMessageRow[] | null) ?? [];

  if (rows.length === 0) return rows;

  const messageIds = rows.map((row) => row.id);
  const { data: attachmentData, error: attachmentError } = await insforge.database
    .from('chat_attachments')
    .select('message_id, key, url, file_name, file_size, mime_type')
    .in('message_id', messageIds);

  assertNoDatabaseError(attachmentError, 'Unable to load attachments.');

  const attachmentsByMessage = new Map<string, Attachment[]>();
  for (const att of (attachmentData as AttachmentRow[] | null) ?? []) {
    const list = attachmentsByMessage.get(att.message_id) ?? [];
    list.push({
      key: att.key,
      url: att.url,
      fileName: att.file_name,
      fileSize: att.file_size,
      mimeType: att.mime_type,
    });
    attachmentsByMessage.set(att.message_id, list);
  }

  for (const row of rows) {
    const atts = attachmentsByMessage.get(row.id);
    if (atts) {
      (row as ChatMessageRow & { attachments?: Attachment[] }).attachments = atts;
    }
  }

  return rows;
}

async function createChat(owner: ChatOwner, input: string, accessToken?: string | null) {
  const insforge = getClient(accessToken);
  const { data, error } = await insforge.database
    .from('chat_sessions')
    .insert([
      {
        ...ownerInsertFields(owner),
        title: buildTitle(input),
      },
    ])
    .select('id, visitor_id, user_id, title, created_at, last_message_at');

  assertNoDatabaseError(error, 'Unable to create a new chat.');

  const createdChat = (data as ChatSessionRow[] | null)?.[0];
  if (!createdChat) {
    throw new Error('The chat session was not created.');
  }

  return createdChat;
}

async function createMessages(
  records: Array<{
    chat_id: string;
    role: 'assistant' | 'system' | 'user';
    content: string;
    sort_order: number;
  }>,
  accessToken?: string | null,
) {
  const insforge = getClient(accessToken);
  const { data, error } = await insforge.database
    .from('chat_messages')
    .insert(records)
    .select('id, chat_id, role, content, created_at');

  assertNoDatabaseError(error, 'Unable to save the chat messages.');

  const createdMessages = (data as ChatMessage[] | null) ?? [];
  if (createdMessages.length !== records.length) {
    throw new Error('The chat messages were not saved.');
  }

  return createdMessages;
}

export async function listChats(owner: ChatOwner, accessToken?: string | null) {
  const safeOwner = ensureOwner(owner);
  const insforge = getClient(accessToken);
  let query = insforge.database
    .from('chat_sessions')
    .select('id, title, created_at, last_message_at');

  query = applyOwnerFilter(query, safeOwner);
  const { data, error } = await query.order('last_message_at', { ascending: false });

  assertNoDatabaseError(error, 'Unable to load saved chats.');

  return (data as ChatSummary[] | null) ?? [];
}

export async function getChatDetail(
  owner: ChatOwner,
  chatId: string,
  accessToken?: string | null,
): Promise<ChatDetailResponse> {
  const safeOwner = ensureOwner(owner);
  const chat = await getChatRow(safeOwner, chatId, accessToken);

  if (!chat) {
    throw new Error('Chat not found.');
  }

  const messages = await getMessageRows(chatId, accessToken);
  return { chat, messages };
}

async function saveAttachments(messageId: string, attachments: Attachment[], accessToken?: string | null) {
  if (attachments.length === 0) return;

  const insforge = getClient(accessToken);
  const records = attachments.map((att) => ({
    message_id: messageId,
    bucket: UPLOAD_BUCKET,
    key: att.key,
    url: att.url,
    file_name: att.fileName,
    file_size: att.fileSize,
    mime_type: att.mimeType,
  }));

  const { error } = await insforge.database
    .from('chat_attachments')
    .insert(records);

  assertNoDatabaseError(error, 'Unable to save attachments.');
}

async function downloadAttachment(att: Attachment, accessToken?: string | null) {
  const insforge = getClient(accessToken);
  const { data, error } = await insforge.storage
    .from(UPLOAD_BUCKET)
    .download(att.key);

  if (error || !data) {
    throw new Error(`Unable to load attachment "${att.fileName}" for AI processing.`);
  }

  return data;
}

async function blobToDataUrl(blob: Blob, mimeType: string) {
  const bytes = Buffer.from(await blob.arrayBuffer());
  return `data:${mimeType};base64,${bytes.toString('base64')}`;
}

function inlineAttachmentText(att: Attachment, content: string) {
  const truncated =
    content.length > INLINE_TEXT_CHAR_LIMIT
      ? `${content.slice(0, INLINE_TEXT_CHAR_LIMIT)}\n\n[Truncated for chat context.]`
      : content;

  return `Attached file: ${att.fileName} (${att.mimeType})\n\n${truncated}`;
}

async function buildUserContent(text: string, attachments: Attachment[], accessToken?: string | null) {
  if (attachments.length === 0) return text;

  const parts: UserContentPart[] = [{ type: 'text', text }];

  for (const att of attachments) {
    if (att.mimeType.startsWith('image/')) {
      parts.push({ type: 'image_url', image_url: { url: att.url } });
      continue;
    }

    const blob = await downloadAttachment(att, accessToken);

    if (INLINE_TEXT_MIME_TYPES.has(att.mimeType)) {
      parts.push({
        type: 'text',
        text: inlineAttachmentText(att, await blob.text()),
      });
      continue;
    }

    parts.push({
      type: 'file',
      file: {
        filename: att.fileName,
        file_data: await blobToDataUrl(blob, att.mimeType),
      },
    });
  }

  return parts;
}

function buildFileParserOptions(attachments: Attachment[]): FileParserOptions {
  if (!attachments.some((att) => att.mimeType === 'application/pdf')) {
    return undefined;
  }

  return {
    enabled: true as const,
    pdf: {
      engine: 'pdf-text' as const,
    },
  };
}

type PreparedMessageRequest = {
  safeOwner: ChatOwner;
  text: string;
  requestedModel: string;
  token?: string | null;
  insforgeClient: InsforgeClient;
  chat: ChatSessionRow;
  attachments: Attachment[];
  nextSortOrder: number;
  historyMessages: Array<{
    role: ChatMessage['role'];
    content: string | UserContentPart[];
  }>;
  nextUserContent: string | UserContentPart[];
  fileParser: FileParserOptions;
};

async function prepareMessageRequest(input: {
  owner: ChatOwner;
  chatId?: string | null;
  text: string;
  model?: string;
  attachments?: Attachment[];
  accessToken?: string | null;
}): Promise<PreparedMessageRequest> {
  const safeOwner = ensureOwner(input.owner);
  const text = input.text.trim();

  if (!text) {
    throw new Error('Message text is required.');
  }

  const requestedModel = input.model?.trim() || getConfiguredModel();
  const token = input.accessToken;
  const insforge = getClient(token);

  let chat =
    input.chatId?.trim() && input.chatId
      ? await getChatRow(safeOwner, input.chatId, token)
      : null;

  if (input.chatId && !chat) {
    throw new Error('The selected chat no longer exists.');
  }

  if (!chat) {
    chat = await createChat(safeOwner, text, token);
  }

  const attachments = input.attachments ?? [];
  const existingMessages = await getMessageRows(chat.id, token);
  const nextSortOrder = existingMessages.at(-1)?.sort_order ?? -1;
  const historyMessages = await Promise.all(
    existingMessages.map(async (message) => ({
      role: message.role,
      content:
        message.role === 'user'
          ? await buildUserContent(message.content, message.attachments ?? [], token)
          : message.content,
    })),
  );
  const nextUserContent = await buildUserContent(text, attachments, token);
  const fileParser = buildFileParserOptions([
    ...existingMessages.flatMap((message) => message.attachments ?? []),
    ...attachments,
  ]);

  return {
    safeOwner,
    text,
    requestedModel,
    token,
    insforgeClient: insforge,
    chat,
    attachments,
    nextSortOrder,
    historyMessages,
    nextUserContent,
    fileParser,
  };
}

async function persistCompletedMessage(input: {
  safeOwner: ChatOwner;
  chat: ChatSessionRow;
  text: string;
  attachments: Attachment[];
  assistantText: string;
  nextSortOrder: number;
  token?: string | null;
}): Promise<SendMessageResponse> {
  const createdMessages = await createMessages([
    {
      chat_id: input.chat.id,
      role: 'user',
      content: input.text,
      sort_order: input.nextSortOrder + 1,
    },
    {
      chat_id: input.chat.id,
      role: 'assistant',
      content: input.assistantText,
      sort_order: input.nextSortOrder + 2,
    },
  ], input.token);

  const [userMessage, assistantMessage] = createdMessages;
  if (!userMessage || !assistantMessage) {
    throw new Error('The completed response could not be stored.');
  }

  if (input.attachments.length > 0) {
    await saveAttachments(userMessage.id, input.attachments, input.token);
  }

  const nextChat = await getChatRow(input.safeOwner, input.chat.id, input.token);
  if (!nextChat) {
    throw new Error('The updated chat could not be reloaded.');
  }

  return {
    chat: nextChat,
    userMessage: {
      ...userMessage,
      attachments: input.attachments.length > 0 ? input.attachments : undefined,
    },
    assistantMessage,
  };
}

export async function streamMessage(input: {
  owner: ChatOwner;
  chatId?: string | null;
  text: string;
  model?: string;
  attachments?: Attachment[];
  accessToken?: string | null;
}) {
  const prepared = await prepareMessageRequest(input);
  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    start(controller) {
      const writeEvent = (event: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      };

      return (async () => {
        let assistantText = '';

        try {
          writeEvent({ type: 'chat', chat: prepared.chat });

          const providerName = getAIProviderName();
          const provider = await createAIProvider(prepared.insforgeClient);

          if (providerName !== 'insforge' && prepared.fileParser) {
            writeEvent({
              type: 'warning',
              message:
                'PDF file parsing is only supported with the InsForge AI provider. ' +
                'Attached PDFs may not be fully processed by the current provider.',
            });
          }

          const stream = await provider.streamCompletion({
            model: prepared.requestedModel,
            messages: [
              {
                role: 'system',
                content: DEFAULT_SYSTEM_PROMPT,
              },
              ...prepared.historyMessages,
              {
                role: 'user',
                content: prepared.nextUserContent,
              },
            ],
            fileParser: prepared.fileParser,
          });

          for await (const deltaText of stream) {
            assistantText += deltaText;
            writeEvent({ type: 'delta', content: deltaText });
          }

          if (!assistantText.trim()) {
            throw new Error(
              'The AI provider returned an empty response. Verify the configured model is available.',
            );
          }

          const payload = await persistCompletedMessage({
            safeOwner: prepared.safeOwner,
            chat: prepared.chat,
            text: prepared.text,
            attachments: prepared.attachments,
            assistantText,
            nextSortOrder: prepared.nextSortOrder,
            token: prepared.token,
          });

          writeEvent({ type: 'done', payload });
          controller.close();
        } catch (error) {
          writeEvent({
            type: 'error',
            error:
              error instanceof Error
                ? error.message
                : 'The AI provider could not complete the request.',
          });
          controller.close();
        }
      })();
    },
  });
}
