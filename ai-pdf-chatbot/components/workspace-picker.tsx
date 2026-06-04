'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, FolderOpen, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type WorkspaceLite = { id: string; name: string };

// Compact dropdown that lets a user reassign a document to a workspace
// (or to "Unsorted"). Renders inline so it fits in the documents list
// row. Closes on outside click and escape.
export function WorkspacePicker({
  currentId,
  onChanged,
}: {
  currentId: string | null;
  onChanged: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [workspaces, setWorkspaces] = useState<WorkspaceLite[] | null>(null);
  const [loading, setLoading] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch('/api/workspaces');
        if (!res.ok) {
          // Surface as "no workspaces" rather than infinite loader
          if (!cancelled) setWorkspaces([]);
          return;
        }
        const data = (await res.json()) as { workspaces: WorkspaceLite[] };
        if (!cancelled) setWorkspaces(data.workspaces ?? []);
      } catch {
        if (!cancelled) setWorkspaces([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-xs text-muted-foreground hover:bg-muted',
          loading && 'opacity-60',
        )}
        disabled={loading}
      >
        <FolderOpen className="size-3" />
        <span className="max-w-24 truncate">
          {currentId ? 'Workspace' : 'Unsorted'}
        </span>
        {loading ? <Loader2 className="size-3 animate-spin" /> : <ChevronDown className="size-3" />}
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-1 max-h-72 w-56 overflow-y-auto rounded-lg border border-border bg-popover p-1 text-sm shadow-md"
        >
          <PickerRow
            label="Unsorted"
            active={currentId === null}
            onPick={() => pick(null)}
          />
          {workspaces === null ? (
            <p className="px-2 py-2 text-xs text-muted-foreground">Loading…</p>
          ) : workspaces.length === 0 ? (
            <p className="px-2 py-2 text-xs text-muted-foreground">No workspaces yet. Create one on the Workspaces page.</p>
          ) : (
            workspaces.map((ws) => (
              <PickerRow
                key={ws.id}
                label={ws.name}
                active={currentId === ws.id}
                onPick={() => pick(ws.id)}
              />
            ))
          )}
        </div>
      ) : null}
    </div>
  );

  async function pick(nextId: string | null) {
    setOpen(false);
    setLoading(true);
    try {
      const res = await fetch(`/api/documents/${documentIdFromButton(rootRef.current)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspace_id: nextId }),
      });
      if (!res.ok) throw new Error(await res.text());
      onChanged();
    } catch {
      toast.error('Could not move document');
    } finally {
      setLoading(false);
    }
  }
}

// The picker reads its parent <li>'s data-doc-id so we don't have to
// thread the document id through every render path. The list row already
// sets data-doc-id on the wrapper.
function documentIdFromButton(el: HTMLElement | null): string | undefined {
  const wrapper = el?.closest('[data-doc-id]') as HTMLElement | null;
  return wrapper?.dataset.docId;
}

function PickerRow({
  label,
  active,
  onPick,
}: {
  label: string;
  active: boolean;
  onPick: () => void;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onPick}
      className={cn(
        'flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-xs hover:bg-muted',
        active && 'bg-muted/70 font-medium',
      )}
    >
      <span className="truncate">{label}</span>
      {active ? <Check className="size-3" /> : null}
    </button>
  );
}
