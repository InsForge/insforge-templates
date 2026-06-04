'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, FolderOpen, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

type WorkspaceRow = {
  id: string;
  name: string;
  description: string | null;
  mindmap_generated_at: string | null;
  audio_url: string | null;
  audio_generated_at: string | null;
  updated_at: string;
};

export default function WorkspacesPage() {
  const [workspaces, setWorkspaces] = useState<WorkspaceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/workspaces');
      if (res.ok) {
        const data = (await res.json()) as { workspaces: WorkspaceRow[] };
        setWorkspaces(data.workspaces ?? []);
      } else {
        toast.error('Could not load workspaces');
      }
    } catch {
      toast.error('Could not load workspaces');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed, description: description.trim() || undefined }),
      });
      if (!res.ok) throw new Error(await res.text());
      setName('');
      setDescription('');
      setCreating(false);
      await refresh();
    } catch {
      toast.error('Could not create workspace');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <Button asChild variant="ghost">
          <Link href="/chat">
            <ArrowLeft className="mr-1 size-4" />
            Back to chat
          </Link>
        </Button>
        <Button onClick={() => setCreating((v) => !v)}>
          <Plus className="mr-1 size-4" />
          New workspace
        </Button>
      </div>
      <h1 className="font-display text-3xl mb-2">Workspaces</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Group related PDFs, chats, and study tools together. Like a NotebookLM notebook.
      </p>

      {creating ? (
        <form onSubmit={handleCreate} className="mb-6 space-y-3 rounded-2xl border border-border bg-card/40 p-4">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Workspace name (e.g. Organic Chemistry Final)"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            rows={2}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setCreating(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || !name.trim()}>
              {submitting ? 'Creating…' : 'Create'}
            </Button>
          </div>
        </form>
      ) : null}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : workspaces.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/40 p-8 text-center">
          <FolderOpen className="mx-auto mb-3 size-8 text-muted-foreground" />
          <p className="mb-3 text-sm text-muted-foreground">
            No workspaces yet. Create one to start organizing your PDFs.
          </p>
          {!creating ? (
            <Button onClick={() => setCreating(true)}>
              <Plus className="mr-1 size-4" />
              Create your first workspace
            </Button>
          ) : null}
        </div>
      ) : (
        <ul className="space-y-3">
          {workspaces.map((w) => (
            <li key={w.id}>
              <Link
                href={`/workspaces/${w.id}`}
                className="flex items-start justify-between gap-4 rounded-2xl border border-border bg-card/40 px-4 py-3 transition hover:bg-card/70"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{w.name}</p>
                  {w.description ? (
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{w.description}</p>
                  ) : null}
                </div>
                <div className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                  {w.mindmap_generated_at ? <span title="Mindmap ready">Map</span> : null}
                  {w.audio_url ? <span title="Audio overview ready">Audio</span> : null}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
