import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function EmptyState({
  eyebrow,
  title,
  description,
  actionHref,
  actionLabel,
  className,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
  className?: string;
}) {
  return (
    <div className={cn('glass-panel flex flex-col items-center justify-center gap-4 px-6 py-10 text-center sm:px-10', className)}>
      {eyebrow ? (
        <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">{eyebrow}</p>
      ) : null}
      <div className="space-y-2">
        <h2 className="font-display text-4xl leading-none sm:text-5xl">{title}</h2>
        <p className="mx-auto max-w-2xl text-sm text-muted-foreground sm:text-base">{description}</p>
      </div>
      {actionHref && actionLabel ? (
        <Button asChild className="rounded-full px-6">
          <Link href={actionHref}>{actionLabel}</Link>
        </Button>
      ) : null}
    </div>
  );
}
