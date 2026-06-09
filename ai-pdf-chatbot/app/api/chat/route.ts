import { NextResponse } from 'next/server';
import { createInsforgeServerClient } from '@/lib/insforge';
import { getCurrentAuthState } from '@/lib/auth-state';
import { retrieveForQuestion, toCitations } from '@/lib/rag/retrieve';
import { RAG_SYSTEM_PROMPT, buildUserPrompt } from '@/lib/ai/prompts';
import { CHAT_MODEL } from '@/lib/ai/constants';
import { encodeNdjson } from '@/lib/stream/ndjson';
import { getPostHogClient } from '@/lib/posthog-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Body = {
  chatId?: string;
  input: string;
  documentIds?: string[];
  // If set when chatId is absent, the new chat is created under that
  // workspace and RAG retrieval is scoped to that workspace's documents.
  workspaceId?: string | null;
};

function extractDeltaText(content: unknown): string {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .map((part) =>
        part && typeof part === 'object' && 'text' in part && typeof part.text === 'string'
          ? part.text
          : '',
      )
      .join('');
  }
  return '';
}

export async function POST(req: Request) {
  const auth = await getCurrentAuthState();
  if (!auth.viewer.isAuthenticated || !auth.viewer.id || !auth.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body || typeof body.input !== 'string' || body.input.trim() === '') {
    return NextResponse.json({ error: 'input is required' }, { status: 400 });
  }

  const ownerId = auth.viewer.id;
  const client = createInsforgeServerClient({ accessToken: auth.accessToken });

  let chatId = body.chatId;
  let workspaceId: string | null = body.workspaceId ?? null;
  if (!chatId) {
    const ins = await client.database
      .from('chat_sessions')
      .insert({
        user_id: ownerId,
        workspace_id: workspaceId,
        title: body.input.trim().slice(0, 60) || 'New chat',
        document_ids: body.documentIds ?? [],
      })
      .select('id, workspace_id')
      .single();
    if (ins.error || !ins.data) {
      return NextResponse.json({ error: ins.error?.message ?? 'Failed to create chat' }, { status: 500 });
    }
    chatId = (ins.data as { id: string; workspace_id: string | null }).id;
    workspaceId = (ins.data as { id: string; workspace_id: string | null }).workspace_id;
  } else {
    // For existing chats, read the workspace_id off the row so a stale
    // client-side cache can't widen retrieval scope.
    const lookup = await client.database
      .from('chat_sessions')
      .select('workspace_id')
      .eq('id', chatId)
      .single();
    workspaceId = (lookup.data as { workspace_id: string | null } | null)?.workspace_id ?? null;
  }

  const lastMsg = await client.database
    .from('chat_messages')
    .select('sort_order')
    .eq('chat_id', chatId)
    .order('sort_order', { ascending: false })
    .limit(1);
  const nextOrder = ((lastMsg.data?.[0]?.sort_order as number | undefined) ?? -1) + 1;

  const userInsert = await client.database
    .from('chat_messages')
    .insert({
      chat_id: chatId,
      role: 'user',
      content: body.input.trim(),
      sort_order: nextOrder,
      citations: [],
    });
  if (userInsert.error) {
    return NextResponse.json({ error: userInsert.error.message }, { status: 500 });
  }

  const resolvedChatId = chatId;
  const inputText = body.input.trim();
  const docIds = body.documentIds;
  const isNewChat = !body.chatId;

  const posthog = getPostHogClient();
  posthog.capture({
    distinctId: ownerId,
    event: 'chat_message_sent',
    properties: {
      chat_id: resolvedChatId,
      workspace_id: workspaceId,
      is_new_chat: isNewChat,
    },
  });
  // Analytics flush failure must not surface as a 500 for the user;
  // the write above already succeeded. Swallow the error.
  await posthog.shutdown().catch(() => undefined);

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (obj: unknown) => controller.enqueue(encodeNdjson(obj));
      try {
        const chunks = await retrieveForQuestion(client, ownerId, inputText, docIds, workspaceId);
        const citations = toCitations(chunks);
        send({ type: 'chat', chatId: resolvedChatId });
        send({ type: 'citations', data: citations });

        const contextString = chunks
          .map((c, i) => {
            const where =
              c.page_number != null
                ? `(${c.file_name}, page ${c.page_number})`
                : `(${c.file_name})`;
            return `[${i + 1}] ${where} ${c.content}`;
          })
          .join('\n\n');

        const raw = await client.ai.chat.completions.create({
          model: CHAT_MODEL,
          stream: true,
          messages: [
            { role: 'system', content: RAG_SYSTEM_PROMPT },
            { role: 'user', content: buildUserPrompt(inputText, contextString) },
          ],
        });

        let full = '';
        for await (const part of raw as AsyncIterable<{
          choices?: Array<{ delta?: { content?: unknown } }>;
        }>) {
          const text = extractDeltaText(part.choices?.[0]?.delta?.content);
          if (text) {
            full += text;
            send({ type: 'delta', text });
          }
        }

        await client.database.from('chat_messages').insert({
          chat_id: resolvedChatId,
          role: 'assistant',
          content: full,
          sort_order: nextOrder + 1,
          citations,
        });

        send({ type: 'done' });
        controller.close();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Stream failed.';
        controller.enqueue(encodeNdjson({ type: 'error', message }));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
