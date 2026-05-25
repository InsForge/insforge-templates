import { NextResponse } from 'next/server';
import { createInsforgeServerClient } from '@/lib/insforge';
import { getCurrentAuthState } from '@/lib/auth-state';
import { retrieveForQuestion, toCitations } from '@/lib/rag/retrieve';
import { RAG_SYSTEM_PROMPT, buildUserPrompt } from '@/lib/ai/prompts';
import { CHAT_MODEL } from '@/lib/ai/constants';
import { encodeNdjson } from '@/lib/stream/ndjson';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Body = {
  chatId?: string;
  input: string;
  documentIds?: string[];
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
  if (!chatId) {
    const ins = await client.database
      .from('chat_sessions')
      .insert({
        user_id: ownerId,
        title: body.input.trim().slice(0, 60) || 'New chat',
        document_ids: body.documentIds ?? [],
      })
      .select('id')
      .single();
    if (ins.error || !ins.data) {
      return NextResponse.json({ error: ins.error?.message ?? 'Failed to create chat' }, { status: 500 });
    }
    chatId = (ins.data as { id: string }).id;
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

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (obj: unknown) => controller.enqueue(encodeNdjson(obj));
      try {
        const chunks = await retrieveForQuestion(client, ownerId, inputText, docIds);
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
