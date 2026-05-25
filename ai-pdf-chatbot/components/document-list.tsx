'use client';

import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { DocumentStatusBadge } from './document-status-badge';

type DocRow = {
  id: string;
  file_name: string;
  file_size: number;
  status: 'processing' | 'ready' | 'failed';
  error: string | null;
  page_count: number | null;
  created_at: string;
};

export function DocumentList({ documents, onChanged }: { documents: DocRow[]; onChanged: () => void }) {
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
    <ul className="divide-y divide-border rounded-2xl border border-border bg-card/40">
      {documents.map((d) => (
        <li key={d.id} className="flex items-center justify-between gap-4 px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{d.file_name}</p>
            <p className="text-xs text-muted-foreground">
              {Math.round(d.file_size / 1024)} KB · {d.page_count ?? '—'} pages
            </p>
            {d.error ? <p className="mt-1 text-xs text-red-700">{d.error}</p> : null}
          </div>
          <div className="flex items-center gap-2">
            <DocumentStatusBadge status={d.status} />
            <Button variant="ghost" size="sm" onClick={() => handleDelete(d.id, d.file_name)}>
              <Trash2 className="size-4" />
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
