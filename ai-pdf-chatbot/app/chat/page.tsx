'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { ChatInput } from '@/components/chat-input';
import { ChatMessage } from '@/components/chat-message';
import { useChatStream } from '@/lib/stream/use-chat-stream';
import { useSetRailCitations } from '@/lib/chat/rail-context';
import type { ChatMessageRow } from '@/lib/types';

type Citation = ChatMessageRow['citations'][number];

type DocSummaryRow = {
  id: string;
  file_name: string;
  status: 'processing' | 'ready' | 'failed';
  summary: string | null;
  suggested_questions: string[];
};

// useSearchParams() requires a Suspense boundary in Next 16 so the page
// can pre-render. We wrap the inner component instead of marking the
// whole page dynamic.
export default function ChatHomePage() {
  return (
    <Suspense fallback={null}>
      <ChatHomePageInner />
    </Suspense>
  );
}

function ChatHomePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // `/chat?workspace=<id>` scopes new chats to that workspace. Empty when
  // the user lands on /chat directly (Unsorted chats).
  const workspaceId = searchParams?.get('workspace') ?? null;
  const { state, send } = useChatStream();
  const [pendingInput, setPendingInput] = useState<string | null>(null);
  const [citations] = useState<Citation[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  // null = still loading. NotebookLM-style gating: with no ready docs the
  // chat input is disabled and the empty state points at upload instead.
  const [hasReadyDocs, setHasReadyDocs] = useState<boolean | null>(null);
  const setRailCitations = useSetRailCitations();

  // Pull a few suggested questions from the most recently uploaded, ready
  // document. When a workspace is set, only consider docs in that
  // workspace so suggestions stay relevant.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const url = workspaceId ? `/api/documents?workspace=${workspaceId}` : '/api/documents';
      const res = await fetch(url);
      if (!res.ok) return;
      const data = (await res.json()) as { documents: DocSummaryRow[] };
      if (cancelled) return;
      const ready = (data.documents ?? []).filter((d) => d.status === 'ready');
      setHasReadyDocs(ready.length > 0);
      const newest = ready.find(
        (d) => Array.isArray(d.suggested_questions) && d.suggested_questions.length > 0,
      );
      setSuggestions(newest?.suggested_questions ?? []);
    })();
    return () => {
      cancelled = true;
    };
  }, [workspaceId]);

  async function handleSubmit(input: string) {
    setPendingInput(input);
    const result = await send({ input, workspaceId });
    if (!result) {
      if (state.phase === 'error') toast.error(state.message);
      return;
    }
    if (result.chatId) router.push(`/chat/${result.chatId}`);
  }

  const streamingText = state.phase === 'streaming' ? state.text : '';
  const streamingCitations = state.phase === 'streaming' ? state.citations : citations;

  useEffect(() => {
    setRailCitations(streamingCitations);
  }, [setRailCitations, streamingCitations]);

  return (
    <>
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
          <div className="mx-auto flex max-w-xl flex-col items-center justify-center gap-6 py-12 text-center">
            <h1 className="font-display text-4xl">Chat with your PDFs</h1>
            {hasReadyDocs === false ? (
              <p className="text-sm text-muted-foreground">
                No PDFs yet. <a className="font-medium underline" href="/documents">Upload one on the documents page</a> to
                start asking questions; chat unlocks as soon as a document finishes indexing.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Upload a PDF on the <a className="underline" href="/documents">documents page</a>, then ask a question here.
              </p>
            )}

            {suggestions.length > 0 ? (
              <div className="w-full space-y-3">
                <div className="flex items-center justify-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground">
                  <Sparkles className="size-3" />
                  Try one of these
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {suggestions.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => void handleSubmit(q)}
                      className="rounded-xl border border-border bg-card/60 px-4 py-3 text-left text-sm transition hover:bg-muted/60"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
      <ChatInput
        disabled={state.phase === 'streaming' || hasReadyDocs === false}
        onSubmit={handleSubmit}
      />
    </>
  );
}
