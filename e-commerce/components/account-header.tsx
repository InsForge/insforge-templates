import Link from 'next/link';
import { cn } from '@/lib/utils';

const accountTabs = [
  { href: '/account/orders', label: 'Orders', key: 'orders' },
  { href: '/account/profile', label: 'Profile', key: 'profile' },
] as const;

export function AccountHeader({
  title,
  description,
  activeTab,
  eyebrow,
}: {
  title: string;
  description?: string;
  activeTab: 'orders' | 'profile';
  eyebrow?: string;
}) {
  return (
    <section className="space-y-5">
      <div className="space-y-3">
        {eyebrow ? (
          <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">{eyebrow}</p>
        ) : null}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <h1 className="font-display text-5xl leading-none sm:text-6xl">{title}</h1>
            {description ? (
              <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">{description}</p>
            ) : null}
          </div>

          <nav className="inline-flex w-fit flex-wrap gap-2 rounded-full border border-border bg-white/45 p-1">
            {accountTabs.map((tab) => (
              <Link
                key={tab.key}
                className={cn(
                  'rounded-full px-4 py-2 text-sm transition',
                  activeTab === tab.key
                    ? 'bg-foreground text-background'
                    : 'text-muted-foreground hover:bg-white/70 hover:text-foreground',
                )}
                href={tab.href}
              >
                {tab.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </section>
  );
}
