'use client';

import { use, useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ChatShell } from '@/components/chat-shell';
import { ChatInput } from '@/components/chat-input';
import { ChatMessage } from '@/components/chat-message';
import { CitationRail } from '@/components/citation-rail';
import { useChatStream } from '@/lib/stream/use-chat-stream';
import type { ChatMessageRow } from '@/lib/types';

type Citation = ChatMessageRow['citations'][number];
type Message = Pick<ChatMessageRow, 'id' | 'role' | 'content' | 'sort_order' | 'citations'>;

export default function ChatDetailPage({ params }: { params: Promise<{ chatId: string }> }) {
  const { chatId } = use(params);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeCitations, setActiveCitations] = useState<Citation[]>([]);
  const { state, send } = useChatStream();

  const load = useCallback(async () => {
    const res = await fetch(`/api/chats/${chatId}`);
    const data = await res.json();
    const msgs: Message[] = data.messages ?? [];
    setMessages(msgs);
    const lastAssistant = [...msgs].reverse().find((m) => m.role === 'assistant');
    setActiveCitations(lastAssistant?.citations ?? []);
  }, [chatId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSubmit(input: string) {
    const optimisticUser: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: input,
      sort_order: (messages.at(-1)?.sort_order ?? -1) + 1,
      citations: [],
    };
    setMessages((m) => [...m, optimisticUser]);
    const result = await send({ input, chatId });
    if (!result) {
      if (state.phase === 'error') toast.error(state.message);
      return;
    }
    setActiveCitations(result.citations);
    await load();
  }

  const streamingText = state.phase === 'streaming' ? state.text : '';
  const streamingCitations = state.phase === 'streaming' ? state.citations : activeCitations;

  return (
    <ChatShell activeChatId={chatId} rail={<CitationRail citations={streamingCitations} />}>
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto flex max-w-2xl flex-col gap-4">
          {messages
            .filter((m) => m.role !== 'system')
            .map((m) => (
              <ChatMessage key={m.id} role={m.role as 'user' | 'assistant'} content={m.content} citations={m.citations} />
            ))}
          {state.phase === 'streaming' ? (
            <ChatMessage role="assistant" content={streamingText} citations={streamingCitations} isStreaming />
          ) : null}
        </div>
      </div>
      <ChatInput disabled={state.phase === 'streaming'} onSubmit={handleSubmit} />
    </ChatShell>
  );
}
