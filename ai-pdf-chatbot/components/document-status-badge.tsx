import { cn } from '@/lib/utils';

const STYLES = {
  processing: 'bg-amber-100 text-amber-900',
  ready: 'bg-emerald-100 text-emerald-900',
  failed: 'bg-red-100 text-red-900',
} as const;

const LABELS = {
  processing: 'Processing',
  ready: 'Ready',
  failed: 'Failed',
} as const;

export function DocumentStatusBadge({ status }: { status: 'processing' | 'ready' | 'failed' }) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', STYLES[status])}>
      {LABELS[status]}
    </span>
  );
}
