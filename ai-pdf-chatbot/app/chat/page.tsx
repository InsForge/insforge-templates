'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ChatShell } from '@/components/chat-shell';
import { ChatInput } from '@/components/chat-input';
import { ChatMessage } from '@/components/chat-message';
import { CitationRail } from '@/components/citation-rail';
import { useChatStream } from '@/lib/stream/use-chat-stream';
import type { ChatMessageRow } from '@/lib/types';

type Citation = ChatMessageRow['citations'][number];

export default function ChatHomePage() {
  const router = useRouter();
  const { state, send } = useChatStream();
  const [pendingInput, setPendingInput] = useState<string | null>(null);
  const [citations] = useState<Citation[]>([]);

  async function handleSubmit(input: string) {
    setPendingInput(input);
    const result = await send({ input });
    if (!result) {
      if (state.phase === 'error') toast.error(state.message);
      return;
    }
    if (result.chatId) router.push(`/chat/${result.chatId}`);
  }

  const streamingText = state.phase === 'streaming' ? state.text : '';
  const streamingCitations = state.phase === 'streaming' ? state.citations : citations;

  return (
    <ChatShell rail={<CitationRail citations={streamingCitations} />}>
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {pendingInput ? (
          <div className="mx-auto flex max-w-2xl flex-col gap-4">
            <ChatMessage role="user" content={pendingInput} />
            {streamingText ? (
              <ChatMessage role="assistant" content={streamingText} citations={streamingCitations} isStreaming />
            ) : (
              <p className="text-sm text-muted-foreground">Thinking…</p>
            )}
          </div>
        ) : (
          <div className="mx-auto flex max-w-md flex-col items-center justify-center gap-4 py-16 text-center">
            <h1 className="font-display text-4xl">Chat with your PDFs</h1>
            <p className="text-sm text-muted-foreground">
              Upload a PDF on the <a className="underline" href="/documents">documents page</a>, then ask a question here.
            </p>
          </div>
        )}
      </div>
      <ChatInput disabled={state.phase === 'streaming'} onSubmit={handleSubmit} />
    </ChatShell>
  );
}
