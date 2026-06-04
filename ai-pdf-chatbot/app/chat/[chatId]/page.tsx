'use client';

import { use, useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ChatInput } from '@/components/chat-input';
import { ChatMessage } from '@/components/chat-message';
import { ShareChatButton } from '@/components/share-chat-button';
import { useChatStream } from '@/lib/stream/use-chat-stream';
import { useSetRailCitations } from '@/lib/chat/rail-context';
import type { ChatMessageRow } from '@/lib/types';

type Citation = ChatMessageRow['citations'][number];
type Message = Pick<ChatMessageRow, 'id' | 'role' | 'content' | 'sort_order' | 'citations'>;

export default function ChatDetailPage({ params }: { params: Promise<{ chatId: string }> }) {
  const { chatId } = use(params);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeCitations, setActiveCitations] = useState<Citation[]>([]);
  const [chatTitle, setChatTitle] = useState<string>('');
  const [shareToken, setShareToken] = useState<string | null>(null);
  const { state, send } = useChatStream();
  const setRailCitations = useSetRailCitations();

  const load = useCallback(async () => {
    const res = await fetch(`/api/chats/${chatId}`);
    const data = await res.json();
    const msgs: Message[] = data.messages ?? [];
    setMessages(msgs);
    const lastAssistant = [...msgs].reverse().find((m) => m.role === 'assistant');
    setActiveCitations(lastAssistant?.citations ?? []);
    if (data.chat) {
      setChatTitle(data.chat.title ?? '');
      setShareToken(data.chat.share_token ?? null);
    }
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

  // Sync the right-rail with whatever this page considers the live
  // citation set. The layout-hosted ChatShell renders the rail from
  // this context, so we don't return one here.
  useEffect(() => {
    setRailCitations(streamingCitations);
  }, [setRailCitations, streamingCitations]);

  return (
    <>
      <div className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border px-4">
        <h2 className="min-w-0 flex-1 truncate text-sm font-medium">{chatTitle || 'Chat'}</h2>
        <ShareChatButton
          chatId={chatId}
          initialShareToken={shareToken}
          onShareTokenChange={setShareToken}
        />
      </div>
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
    </>
  );
}
