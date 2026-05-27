'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FileText, Menu, MessageSquare, Pencil, Plus, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { SidebarAccountBar } from '@/components/sidebar-account-bar';
import { authClient } from '@/lib/auth-client';
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
  const router = useRouter();
  const [chats, setChats] = useState<ChatRow[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const session = authClient.useSession();
  const viewer = useMemo<AuthViewer | null>(() => {
    if (session.isPending) return null;
    if (!session.data?.user) {
      return { isAuthenticated: false, id: null, email: null, name: null };
    }
    return {
      isAuthenticated: true,
      id: session.data.user.id,
      email: session.data.user.email ?? null,
      name: session.data.user.name ?? null,
    };
  }, [session.isPending, session.data?.user]);

  const loadChats = useCallback(async () => {
    const res = await fetch('/api/chats');
    const data = await res.json();
    setChats(data.chats ?? []);
  }, []);

  useEffect(() => {
    void loadChats();
  }, [loadChats, activeChatId]);

  // Close the mobile drawer whenever the user navigates to a new chat.
  useEffect(() => {
    setDrawerOpen(false);
  }, [activeChatId]);

  async function handleDelete(chatId: string, title: string) {
    const snapshot = chats;
    setChats((prev) => prev.filter((c) => c.id !== chatId));

    let ok = false;
    try {
      const res = await fetch(`/api/chats/${chatId}`, { method: 'DELETE' });
      ok = res.ok;
    } catch {
      ok = false;
    }
    if (!ok) {
      setChats(snapshot);
      toast.error(`Failed to delete "${title}"`);
      return;
    }

    if (chatId === activeChatId) router.push('/chat');
  }

  async function commitRename(chatId: string, raw: string) {
    setEditingId(null);
    const next = raw.trim();
    const current = chats.find((c) => c.id === chatId);
    if (!current || !next || next === current.title) return;

    const snapshot = chats;
    setChats((prev) => prev.map((c) => (c.id === chatId ? { ...c, title: next } : c)));

    let ok = false;
    try {
      const res = await fetch(`/api/chats/${chatId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: next }),
      });
      ok = res.ok;
    } catch {
      ok = false;
    }
    if (!ok) {
      setChats(snapshot);
      toast.error('Failed to rename chat');
    }
  }

  const sidebarBody = (
    <>
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
            <li
              key={c.id}
              className={cn(
                'group flex items-center gap-1 rounded-lg pr-1 hover:bg-muted/70',
                c.id === activeChatId && 'bg-muted',
              )}
            >
              {editingId === c.id ? (
                <input
                  autoFocus
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={() => void commitRename(c.id, editValue)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      (e.currentTarget as HTMLInputElement).blur();
                    } else if (e.key === 'Escape') {
                      e.preventDefault();
                      setEditingId(null);
                    }
                  }}
                  className="min-w-0 flex-1 rounded bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              ) : (
                <Link
                  href={`/chat/${c.id}`}
                  className="flex min-w-0 flex-1 items-center gap-2 truncate px-2 py-1.5 text-sm"
                >
                  <MessageSquare className="size-4 shrink-0 text-muted-foreground" />
                  <span className="truncate">{c.title}</span>
                </Link>
              )}
              {editingId !== c.id ? (
                <>
                  <button
                    type="button"
                    aria-label={`Rename chat ${c.title}`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setEditValue(c.title);
                      setEditingId(c.id);
                    }}
                    className="shrink-0 rounded p-1 text-muted-foreground opacity-0 transition hover:bg-background hover:text-foreground group-hover:opacity-100 focus-visible:opacity-100"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Delete chat ${c.title}`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      void handleDelete(c.id, c.title);
                    }}
                    className="shrink-0 rounded p-1 text-muted-foreground opacity-0 transition hover:bg-background hover:text-destructive group-hover:opacity-100 focus-visible:opacity-100"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
      <div className="border-t border-border">
        <SidebarAccountBar viewer={viewer} />
      </div>
    </>
  );

  return (
    <div className="flex h-dvh overflow-hidden">
      {/* Desktop sidebar */}
      <nav className="hidden w-64 shrink-0 flex-col border-r border-border bg-card/30 md:flex">
        {sidebarBody}
      </nav>

      {/* Mobile drawer */}
      {drawerOpen ? (
        <div className="fixed inset-0 z-40 md:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 bg-black/40"
          />
          <nav className="absolute inset-y-0 left-0 flex w-64 flex-col border-r border-border bg-card shadow-xl">
            <div className="flex items-center justify-end p-2">
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setDrawerOpen(false)}
                className="rounded p-2 text-muted-foreground hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            </div>
            {sidebarBody}
          </nav>
        </div>
      ) : null}

      {/* min-h-0 is required on this column wrapper and on <main> below.
          Without it, flex items default to min-height: auto, which lets
          the citation rail (or any tall child) push the column past the
          h-dvh box and bury the chat input below the viewport. */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {/* Mobile header */}
        <header className="flex shrink-0 items-center gap-2 border-b border-border bg-card/30 px-3 py-2 md:hidden">
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setDrawerOpen(true)}
            className="rounded p-2 hover:bg-muted"
          >
            <Menu className="size-5" />
          </button>
          <span className="truncate text-sm font-medium">AI PDF Chatbot</span>
        </header>

        <main className="flex min-h-0 min-w-0 flex-1">
          <section className="flex min-h-0 min-w-0 flex-1 flex-col">{children}</section>
          {rail}
        </main>
      </div>
    </div>
  );
}
