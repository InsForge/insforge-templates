'use client';

import { use, useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  AudioLines,
  Brain,
  FileText,
  GraduationCap,
  Loader2,
  MessageSquare,
  Pencil,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { AudioOverview } from '@/components/audio-overview';
import { DocumentList } from '@/components/document-list';
import { DocumentUploader } from '@/components/document-uploader';
import type { AudioScriptTurn } from '@/lib/types';
import { cn } from '@/lib/utils';

// markmap-view depends on d3 + a browser-only SVG mount, so it can't run
// during the server-side render pass for this client page.
const MindmapView = dynamic(
  () => import('@/components/mindmap-view').then((m) => m.MindmapView),
  { ssr: false, loading: () => <p className="text-sm text-muted-foreground">Loading mindmap…</p> },
);

type WorkspaceDetail = {
  workspace: {
    id: string;
    name: string;
    description: string | null;
    mindmap_markdown: string | null;
    mindmap_generated_at: string | null;
    audio_url: string | null;
    audio_script: AudioScriptTurn[] | null;
    audio_generated_at: string | null;
  };
  counts: {
    documents: number;
    chats: number;
    due_flashcards: number;
  };
};

type DocRow = {
  id: string;
  workspace_id: string | null;
  file_name: string;
  file_size: number;
  status: 'processing' | 'ready' | 'failed';
  error: string | null;
  page_count: number | null;
  summary: string | null;
  created_at: string;
};

type ChatRow = {
  id: string;
  title: string;
  last_message_at: string;
};

type Tab = 'documents' | 'chats' | 'mindmap' | 'review' | 'audio';

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'chats', label: 'Chats', icon: MessageSquare },
  { id: 'mindmap', label: 'Mindmap', icon: Brain },
  { id: 'review', label: 'Review', icon: GraduationCap },
  { id: 'audio', label: 'Audio', icon: AudioLines },
];

export default function WorkspaceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [detail, setDetail] = useState<WorkspaceDetail | null>(null);
  const [tab, setTab] = useState<Tab>('documents');
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/workspaces/${id}`);
      if (res.ok) {
        const data = (await res.json()) as WorkspaceDetail;
        setDetail(data);
        setEditName(data.workspace.name);
        setEditDescription(data.workspace.description ?? '');
        return;
      }
      if (res.status === 404) {
        toast.error('Workspace not found');
        router.push('/workspaces');
        return;
      }
      toast.error('Could not load workspace');
    } catch {
      toast.error('Could not load workspace');
    }
  }, [id, router]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function handleSaveMeta() {
    const trimmed = editName.trim();
    if (!trimmed) return;
    const res = await fetch(`/api/workspaces/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: trimmed, description: editDescription.trim() }),
    });
    if (!res.ok) {
      toast.error('Could not save changes');
      return;
    }
    setEditing(false);
    await refresh();
  }

  async function handleDelete() {
    if (!confirm('Delete this workspace? Its PDFs and chats will move to Unsorted.')) return;
    const res = await fetch(`/api/workspaces/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      toast.error('Could not delete workspace');
      return;
    }
    router.push('/workspaces');
  }

  if (!detail) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  const ws = detail.workspace;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <Button asChild variant="ghost">
          <Link href="/workspaces">
            <ArrowLeft className="mr-1 size-4" />
            All workspaces
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setEditing((v) => !v)}>
            <Pencil className="size-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleDelete}>
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      {editing ? (
        <div className="mb-6 space-y-3 rounded-2xl border border-border bg-card/40 p-4">
          <input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <textarea
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
            <Button onClick={handleSaveMeta}>Save</Button>
          </div>
        </div>
      ) : (
        <div className="mb-6">
          <h1 className="font-display text-3xl">{ws.name}</h1>
          {ws.description ? (
            <p className="mt-2 text-sm text-muted-foreground">{ws.description}</p>
          ) : null}
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-center gap-1 border-b border-border">
        {TABS.map(({ id: tabId, label, icon: Icon }) => (
          <button
            key={tabId}
            type="button"
            onClick={() => setTab(tabId)}
            className={cn(
              'inline-flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm transition',
              tab === tabId
                ? 'border-foreground text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon className="size-4" />
            {label}
            {tabId === 'documents' ? <Badge>{detail.counts.documents}</Badge> : null}
            {tabId === 'chats' ? <Badge>{detail.counts.chats}</Badge> : null}
            {tabId === 'review' && detail.counts.due_flashcards > 0 ? (
              <Badge tone="due">{detail.counts.due_flashcards}</Badge>
            ) : null}
          </button>
        ))}
      </div>

      {tab === 'documents' ? (
        <DocumentsTab workspaceId={id} onChanged={refresh} />
      ) : tab === 'chats' ? (
        <ChatsTab workspaceId={id} />
      ) : tab === 'mindmap' ? (
        <MindmapTab
          workspaceId={id}
          initialMarkdown={ws.mindmap_markdown}
          initialGeneratedAt={ws.mindmap_generated_at}
          onChanged={refresh}
        />
      ) : tab === 'review' ? (
        <ReviewTab workspaceId={id} dueCount={detail.counts.due_flashcards} />
      ) : (
        <AudioOverview
          workspaceId={id}
          initialAudioUrl={ws.audio_url}
          initialScript={ws.audio_script}
          initialGeneratedAt={ws.audio_generated_at}
          onChanged={refresh}
        />
      )}
    </div>
  );
}

function Badge({ children, tone = 'default' }: { children: React.ReactNode; tone?: 'default' | 'due' }) {
  return (
    <span
      className={cn(
        'ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs',
        tone === 'due'
          ? 'bg-orange-100 text-orange-900 dark:bg-orange-900/40 dark:text-orange-100'
          : 'bg-muted text-muted-foreground',
      )}
    >
      {children}
    </span>
  );
}

function DocumentsTab({ workspaceId, onChanged }: { workspaceId: string; onChanged: () => void }) {
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const res = await fetch(`/api/documents?workspace=${workspaceId}`);
    if (res.ok) {
      const data = (await res.json()) as { documents: DocRow[] };
      setDocs(data.documents ?? []);
    }
    setLoading(false);
  }, [workspaceId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Mirror the polling from the global /documents page so newly-uploaded
  // PDFs flip from processing → ready without a manual reload.
  useEffect(() => {
    if (!docs.some((d) => d.status === 'processing')) return;
    const handle = setInterval(() => void refresh(), 3000);
    return () => clearInterval(handle);
  }, [docs, refresh]);

  return (
    <div className="space-y-6">
      <DocumentUploader
        workspaceId={workspaceId}
        onUploaded={() => {
          void refresh();
          onChanged();
        }}
      />
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <DocumentList
          documents={docs}
          showWorkspacePicker={false}
          onChanged={() => {
            void refresh();
            onChanged();
          }}
        />
      )}
    </div>
  );
}

function MindmapTab({
  workspaceId,
  initialMarkdown,
  initialGeneratedAt,
  onChanged,
}: {
  workspaceId: string;
  initialMarkdown: string | null;
  initialGeneratedAt: string | null;
  onChanged: () => void;
}) {
  const [markdown, setMarkdown] = useState<string | null>(initialMarkdown);
  const [generatedAt, setGeneratedAt] = useState<string | null>(initialGeneratedAt);
  const [generating, setGenerating] = useState(false);

  async function generate() {
    setGenerating(true);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/mindmap`, { method: 'POST' });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error(data.error ?? 'Mindmap generation failed');
        return;
      }
      const data = (await res.json()) as { markdown: string; generated_at: string };
      setMarkdown(data.markdown);
      setGeneratedAt(data.generated_at);
      onChanged();
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {generatedAt
            ? `Last generated ${new Date(generatedAt).toLocaleString()}`
            : 'Mindmap not generated yet. Add a few PDFs and click Generate to build one.'}
        </p>
        <Button onClick={generate} disabled={generating}>
          {generating ? (
            <Loader2 className="mr-1 size-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-1 size-4" />
          )}
          {markdown ? 'Regenerate' : 'Generate mindmap'}
        </Button>
      </div>
      {markdown ? (
        <MindmapView markdown={markdown} />
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-card/40 p-8 text-center text-sm text-muted-foreground">
          No mindmap yet.
        </div>
      )}
    </div>
  );
}

function ReviewTab({ workspaceId, dueCount }: { workspaceId: string; dueCount: number }) {
  return (
    <div className="rounded-2xl border border-border bg-card/40 p-8 text-center">
      <GraduationCap className="mx-auto mb-3 size-8 text-muted-foreground" />
      <p className="text-base font-medium">
        {dueCount === 0 ? 'No cards due right now' : `${dueCount} card${dueCount === 1 ? '' : 's'} due`}
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        Flashcards generated from any PDF in this workspace land here on a
        spaced-repetition schedule. Three grades reschedule the card, &quot;Again&quot; brings it back in 5 minutes.
      </p>
      {dueCount === 0 ? (
        <Button className="mt-6" disabled>
          Start reviewing
        </Button>
      ) : (
        <Button asChild className="mt-6">
          <Link href={`/workspaces/${workspaceId}/review`}>
            Start reviewing
          </Link>
        </Button>
      )}
    </div>
  );
}

function ChatsTab({ workspaceId }: { workspaceId: string }) {
  const [chats, setChats] = useState<ChatRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const res = await fetch(`/api/chats?workspace=${workspaceId}`);
      if (res.ok && !cancelled) {
        const data = (await res.json()) as { chats: ChatRow[] };
        setChats(data.chats ?? []);
      }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [workspaceId]);

  const newChatHref = useMemo(() => `/chat?workspace=${workspaceId}`, [workspaceId]);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button asChild>
          <Link href={newChatHref}>
            <MessageSquare className="mr-1 size-4" />
            New chat in this workspace
          </Link>
        </Button>
      </div>
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : chats.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border bg-card/40 p-8 text-center text-sm text-muted-foreground">
          No chats yet. Start one and it will be scoped to this workspace&apos;s PDFs.
        </p>
      ) : (
        <ul className="space-y-2">
          {chats.map((c) => (
            <li key={c.id}>
              <Link
                href={`/chat/${c.id}`}
                className="flex items-center justify-between rounded-xl border border-border bg-card/40 px-4 py-3 text-sm transition hover:bg-card/70"
              >
                <span className="truncate">{c.title}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {new Date(c.last_message_at).toLocaleDateString()}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
