import Link from 'next/link';
import { FileText } from 'lucide-react';
import { ChatMessage } from '@/components/chat-message';
import type { ChatMessageRow } from '@/lib/types';

export const dynamic = 'force-dynamic';

type SharedPayload = {
  chat: {
    id: string;
    title: string;
    created_at: string;
    last_message_at: string;
  };
  messages: Pick<ChatMessageRow, 'id' | 'role' | 'content' | 'sort_order' | 'citations'>[];
};

async function fetchShared(token: string, origin: string): Promise<SharedPayload | null> {
  try {
    const res = await fetch(`${origin}/api/share/${token}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return (await res.json()) as SharedPayload;
  } catch {
    // Network failure → render the same "unavailable" state as a missing
    // / revoked token rather than throwing into the Next.js error page.
    return null;
  }
}

export default async function SharedChatPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const baseUrl =
    process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_BETTER_AUTH_URL ?? 'http://localhost:3000';
  const shared = await fetchShared(token, baseUrl);

  if (!shared) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center px-4 text-center">
        <FileText className="mb-3 size-8 text-muted-foreground" />
        <h1 className="text-xl font-semibold">Shared chat unavailable</h1>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          This link has been revoked or never existed. Ask the chat owner for a fresh link.
        </p>
        <Link href="/" className="mt-6 text-sm text-foreground underline-offset-4 hover:underline">
          Back to home
        </Link>
      </main>
    );
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-3xl flex-col px-4 py-8">
      <header className="mb-6 flex items-center justify-between border-b border-border pb-4">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Shared chat</p>
          <h1 className="mt-1 truncate text-xl font-semibold">{shared.chat.title}</h1>
        </div>
        <Link
          href="/"
          className="shrink-0 rounded-md border border-border px-3 py-1.5 text-xs hover:bg-muted"
        >
          Open AI PDF Chatbot →
        </Link>
      </header>

      <ol className="flex-1 space-y-6">
        {shared.messages
          .filter((m) => m.role !== 'system')
          .map((m) => (
            <li key={m.id}>
              <ChatMessage
                role={m.role as 'user' | 'assistant'}
                content={m.content}
                citations={m.citations}
              />
            </li>
          ))}
      </ol>

      <footer className="mt-8 border-t border-border pt-4 text-center text-xs text-muted-foreground">
        Read-only view · {shared.messages.length} message{shared.messages.length === 1 ? '' : 's'}
      </footer>
    </div>
  );
}
