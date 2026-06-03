'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { usePdfViewer } from '@/lib/pdf/viewer-context';
import { cn } from '@/lib/utils';

// react-pdf pulls in the pdfjs worker on import and crashes during the
// Next 16 server-side bundle phase. Loading it through next/dynamic with
// ssr:false makes sure the whole subtree only ever renders on the client.
const PdfViewer = dynamic(() => import('./pdf-viewer').then((m) => m.PdfViewer), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center p-6 text-sm text-muted-foreground">
      <Loader2 className="mr-2 size-4 animate-spin" />
      Loading viewer…
    </div>
  ),
});

export function PdfDrawer() {
  const ctx = usePdfViewer();
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const target = ctx?.current ?? null;
  const documentId = target?.documentId ?? null;

  const close = ctx?.close;

  // Fetch a fresh presigned URL whenever the target document changes.
  // Re-using a URL across documents would 403 on the second open. We
  // depend on `documentId` + `close` (a stable useCallback inside the
  // context provider) rather than on the whole `ctx` object so the
  // effect doesn't re-run on every viewer-state change that produces a
  // new context value (e.g. opening the same document a second time).
  useEffect(() => {
    if (!documentId) {
      setUrl(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void (async () => {
      try {
        const res = await fetch(`/api/documents/${documentId}/url`);
        if (!res.ok) throw new Error(`status ${res.status}`);
        const data = (await res.json()) as { url: string };
        if (!cancelled) setUrl(data.url);
      } catch {
        if (!cancelled) {
          toast.error('Could not open source PDF');
          close?.();
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [documentId, close]);

  // Esc closes the drawer. Scoped to mount so we don't intercept Esc
  // when the drawer is hidden.
  useEffect(() => {
    if (!target) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') ctx?.close();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [target, ctx]);

  if (!ctx) return null;

  return (
    <>
      {/* Backdrop (mobile only — desktop drawer leaves chat readable). */}
      {target ? (
        <button
          type="button"
          aria-label="Close PDF viewer"
          onClick={() => ctx.close()}
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
        />
      ) : null}
      <aside
        aria-hidden={!target}
        className={cn(
          'fixed inset-y-0 right-0 z-40 flex w-full max-w-md flex-col border-l border-border bg-background shadow-xl transition-transform md:max-w-lg',
          target ? 'translate-x-0' : 'pointer-events-none translate-x-full',
        )}
      >
        <header className="flex items-center justify-between gap-2 border-b border-border bg-card/50 px-3 py-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{target?.fileName ?? 'PDF'}</p>
            {target?.pageNumber != null ? (
              <p className="text-xs text-muted-foreground">Jumped to page {target.pageNumber}</p>
            ) : null}
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={() => ctx.close()}
            className="rounded p-1 text-muted-foreground hover:bg-muted"
          >
            <X className="size-4" />
          </button>
        </header>
        <div className="min-h-0 flex-1">
          {!target ? null : loading || !url ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              <Loader2 className="mr-2 size-4 animate-spin" />
              Loading…
            </div>
          ) : (
            <PdfViewer
              fileUrl={url}
              initialPage={target.pageNumber ?? 1}
              highlightPrefix={target.highlightPrefix}
            />
          )}
        </div>
      </aside>
    </>
  );
}
