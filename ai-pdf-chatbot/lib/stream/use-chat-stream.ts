'use client';

import { useCallback, useRef, useState } from 'react';
import { parseNdjsonStream } from './ndjson';
import type { ChatMessageRow } from '@/lib/types';

type Citation = ChatMessageRow['citations'][number];

type StreamState =
  | { phase: 'idle' }
  | { phase: 'streaming'; citations: Citation[]; text: string }
  | { phase: 'error'; message: string };

type StreamEvent =
  | { type: 'chat'; chatId: string }
  | { type: 'citations'; data: Citation[] }
  | { type: 'delta'; text: string }
  | { type: 'done' }
  | { type: 'error'; message: string };

export function useChatStream() {
  const [state, setState] = useState<StreamState>({ phase: 'idle' });
  const abortRef = useRef<AbortController | null>(null);

  const send = useCallback(
    async (params: {
      input: string;
      chatId?: string;
      documentIds?: string[];
      workspaceId?: string | null;
    }) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setState({ phase: 'streaming', citations: [], text: '' });

      let resolvedChatId = params.chatId ?? null;

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          const errorText = await res.text().catch(() => 'Request failed');
          setState({ phase: 'error', message: errorText });
          return null;
        }

        let citations: Citation[] = [];
        let text = '';

        for await (const event of parseNdjsonStream(res.body) as AsyncIterable<StreamEvent>) {
          if (event.type === 'chat') resolvedChatId = event.chatId;
          else if (event.type === 'citations') {
            citations = event.data;
            setState({ phase: 'streaming', citations, text });
          } else if (event.type === 'delta') {
            text += event.text;
            setState({ phase: 'streaming', citations, text });
          } else if (event.type === 'error') {
            setState({ phase: 'error', message: event.message });
            return null;
          } else if (event.type === 'done') {
            setState({ phase: 'idle' });
            // Tell the sidebar to refresh ONLY when a brand new chat was
            // created. Continuing a conversation already on the list
            // intentionally does NOT trigger a refetch even though the
            // chat would re-sort to the top by last_message_at. Re-sorting
            // on every assistant turn is the visual jitter the
            // layout-hoisted sidebar (chat/layout.tsx) was introduced to
            // fix. The trade-off is mild list staleness for a still UI,
            // recoverable on next mount.
            if (!params.chatId && resolvedChatId && typeof window !== 'undefined') {
              window.dispatchEvent(new Event('chats:changed'));
            }
            return { chatId: resolvedChatId, content: text, citations };
          }
        }
        setState({ phase: 'idle' });
        if (!params.chatId && resolvedChatId && typeof window !== 'undefined') {
          window.dispatchEvent(new Event('chats:changed'));
        }
        return { chatId: resolvedChatId, content: text, citations };
      } catch (err) {
        if (controller.signal.aborted) {
          setState({ phase: 'idle' });
          return null;
        }
        const message = err instanceof Error ? err.message : 'Stream failed.';
        setState({ phase: 'error', message });
        return null;
      }
    },
    [],
  );

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setState({ phase: 'idle' });
  }, []);

  return { state, send, reset };
}
