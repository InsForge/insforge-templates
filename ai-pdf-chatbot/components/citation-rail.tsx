import type { ChatMessageRow } from '@/lib/types';

type Citation = ChatMessageRow['citations'][number];

export function CitationRail({ citations }: { citations: Citation[] }) {
  if (citations.length === 0) {
    return (
      <aside className="hidden w-80 shrink-0 overflow-y-auto border-l border-border bg-card/30 p-4 text-sm text-muted-foreground lg:block">
        Sources cited in the assistant&apos;s answer will appear here.
      </aside>
    );
  }
  return (
    <aside className="hidden w-80 shrink-0 overflow-y-auto border-l border-border bg-card/30 p-4 lg:block">
      <h2 className="mb-3 text-sm font-semibold">Sources</h2>
      <ol className="space-y-3">
        {citations.map((c) => (
          <li key={c.chunk_id} id={`citation-${c.marker}`} className="rounded-xl border border-border bg-card/60 p-3">
            <div className="mb-1 text-xs font-medium text-muted-foreground">
              [{c.marker}] {c.file_name}
              {c.page_number != null ? <> · page {c.page_number}</> : null}
            </div>
            <p className="text-xs text-foreground/80">{c.snippet}</p>
          </li>
        ))}
      </ol>
    </aside>
  );
}
