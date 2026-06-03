'use client';

import { Sparkles, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { DocumentStatusBadge } from './document-status-badge';
import { FlashcardsModal } from './flashcards-modal';
import { WorkspacePicker } from './workspace-picker';

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

// showWorkspacePicker toggles the per-row "move to workspace" affordance.
// The global /documents page shows it; the workspace detail page hides it
// since every row is already known to belong to that workspace.
export function DocumentList({
  documents,
  onChanged,
  showWorkspacePicker = true,
}: {
  documents: DocRow[];
  onChanged: () => void;
  showWorkspacePicker?: boolean;
}) {
  const [flashcardsFor, setFlashcardsFor] = useState<DocRow | null>(null);

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}" and its chunks?`)) return;
    const res = await fetch(`/api/documents/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      toast.error('Delete failed');
      return;
    }
    onChanged();
  }

  if (documents.length === 0) {
    return <p className="text-sm text-muted-foreground">No documents yet.</p>;
  }

  return (
    <>
      <ul className="divide-y divide-border rounded-2xl border border-border bg-card/40">
        {documents.map((d) => (
          <li
            key={d.id}
            data-doc-id={d.id}
            className="flex items-start justify-between gap-4 px-4 py-3"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{d.file_name}</p>
              <p className="text-xs text-muted-foreground">
                {Math.round(d.file_size / 1024)} KB · {d.page_count ?? '—'} pages
              </p>
              {d.summary ? (
                <p className="mt-1.5 line-clamp-2 text-xs text-foreground/70">{d.summary}</p>
              ) : null}
              {d.error ? <p className="mt-1 text-xs text-red-700">{d.error}</p> : null}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <DocumentStatusBadge status={d.status} />
              {showWorkspacePicker ? (
                <WorkspacePicker currentId={d.workspace_id} onChanged={onChanged} />
              ) : null}
              {d.status === 'ready' ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFlashcardsFor(d)}
                  title="Study with flashcards"
                >
                  <Sparkles className="size-4" />
                </Button>
              ) : null}
              <Button variant="ghost" size="sm" onClick={() => handleDelete(d.id, d.file_name)}>
                <Trash2 className="size-4" />
              </Button>
            </div>
          </li>
        ))}
      </ul>

      {flashcardsFor ? (
        <FlashcardsModal
          documentId={flashcardsFor.id}
          documentName={flashcardsFor.file_name}
          onClose={() => setFlashcardsFor(null)}
        />
      ) : null}
    </>
  );
}
