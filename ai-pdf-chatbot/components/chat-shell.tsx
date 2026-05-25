'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { FileText, MessageSquare, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SidebarAccountBar } from '@/components/sidebar-account-bar';
import type { AuthViewer } from '@/lib/types';
import { cn } from '@/lib/utils';

type ChatRow = { id: string; title: string; last_message_at: string };

export function ChatShell({
  activeChatId,
  children,
  rail,
}: {
  activeChatId?: string;
  children: React.ReactNode;
  rail: React.ReactNode;
}) {
  const [chats, setChats] = useState<ChatRow[]>([]);
  const [viewer, setViewer] = useState<AuthViewer | null>(null);

  useEffect(() => {
    void fetch('/api/chats').then(async (res) => {
      const data = await res.json();
      setChats(data.chats ?? []);
    });
  }, [activeChatId]);

  useEffect(() => {
    void fetch('/api/me').then(async (res) => {
      const data = await res.json();
      setViewer(data.viewer ?? null);
    });
  }, []);

  return (
    <div className="flex h-dvh overflow-hidden">
      <nav className="hidden w-64 shrink-0 flex-col border-r border-border bg-card/30 md:flex">
        <div className="flex flex-1 flex-col p-3">
          <Button asChild variant="default" className="mb-3 w-full">
            <Link href="/chat">
              <Plus className="mr-1 size-4" />
              New chat
            </Link>
          </Button>
          <Button asChild variant="ghost" className="mb-4 justify-start">
            <Link href="/documents">
              <FileText className="mr-2 size-4" />
              Documents
            </Link>
          </Button>
          <p className="px-2 pb-1 text-xs font-medium uppercase text-muted-foreground">Recent</p>
          <ul className="flex-1 space-y-1 overflow-y-auto">
            {chats.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/chat/${c.id}`}
                  className={cn(
                    'flex items-center gap-2 truncate rounded-lg px-2 py-1.5 text-sm hover:bg-muted/70',
                    c.id === activeChatId && 'bg-muted',
                  )}
                >
                  <MessageSquare className="size-4 text-muted-foreground" />
                  <span className="truncate">{c.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="border-t border-border">
          <SidebarAccountBar viewer={viewer} />
        </div>
      </nav>
      <main className="flex min-w-0 flex-1">
        <section className="flex min-w-0 flex-1 flex-col">{children}</section>
        {rail}
      </main>
    </div>
  );
}
