import type { ChatMessageRow } from '@/lib/types';
import { cn } from '@/lib/utils';

type Citation = ChatMessageRow['citations'][number];

function renderWithCitations(text: string, citations: Citation[]) {
  if (citations.length === 0) return text;
  const parts: Array<string | { marker: number; key: string }> = [];
  const regex = /\[(\d+)\]/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    parts.push({ marker: Number(m[1]), key: `cite-${m.index}` });
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));

  return parts.map((p, i) => {
    if (typeof p === 'string') return <span key={`t-${i}`}>{p}</span>;
    const cite = citations.find((c) => c.marker === p.marker);
    return (
      <a
        key={p.key}
        href={`#citation-${p.marker}`}
        title={cite ? `${cite.file_name}${cite.page_number ? `, page ${cite.page_number}` : ''}` : undefined}
        className="mx-0.5 inline-flex items-center rounded-md bg-accent/15 px-1.5 py-0.5 text-xs font-medium text-accent hover:bg-accent/25"
      >
        [{p.marker}]
      </a>
    );
  });
}

export function ChatMessage({
  role,
  content,
  citations = [],
  isStreaming = false,
}: {
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  isStreaming?: boolean;
}) {
  return (
    <div className={cn('flex w-full gap-3', role === 'user' ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed',
          role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-card/70 text-foreground',
        )}
      >
        {role === 'assistant' ? renderWithCitations(content, citations) : content}
        {isStreaming ? <span className="ml-1 inline-block size-2 animate-pulse rounded-full bg-current align-baseline" /> : null}
      </div>
    </div>
  );
}
