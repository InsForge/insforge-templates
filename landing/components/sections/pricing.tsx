'use client';

import Link from 'next/link';
import { Check } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { BorderBeam } from '@/components/magicui/border-beam';
import { pricing } from '@/lib/content';
import { cn } from '@/lib/utils';

export function Pricing() {
  const [yearly, setYearly] = useState(true);

  return (
    <section id="pricing" className="border-b border-border py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            {pricing.heading}
          </h2>
          <p className="mt-3 text-muted-foreground">{pricing.subhead}</p>
        </div>

        <div className="mt-8 flex items-center justify-center gap-3 text-sm">
          <span className={cn('transition', !yearly && 'text-foreground', yearly && 'text-muted-foreground')}>
            Monthly
          </span>
          <Switch checked={yearly} onCheckedChange={setYearly} aria-label="Toggle yearly pricing" />
          <span className={cn('transition', yearly && 'text-foreground', !yearly && 'text-muted-foreground')}>
            Yearly
          </span>
          <Badge variant="outline" className="ml-1 rounded-full border-emerald-500/30 bg-emerald-500/10 text-emerald-500">
            Save 20%
          </Badge>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {pricing.tiers.map((t) => {
            const price = yearly ? t.yearly : t.monthly;
            const period = price === 0 ? '' : '/mo';
            return (
              <div
                key={t.id}
                className={cn(
                  'relative flex flex-col rounded-2xl border bg-card p-6',
                  t.highlighted
                    ? 'border-foreground/30 lg:-translate-y-2 lg:shadow-xl'
                    : 'border-border',
                )}
              >
                {t.highlighted && (
                  <>
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-medium text-primary-foreground">
                      Most popular
                    </span>
                    <BorderBeam size={80} duration={8} />
                  </>
                )}
                <div className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                  {t.name}
                </div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-4xl font-semibold tracking-tight">${price}</span>
                  <span className="text-sm text-muted-foreground">{period}</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{t.pitch}</p>
                <ul className="mt-6 space-y-2 text-sm">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button asChild className="mt-8 w-full" variant={t.highlighted ? 'default' : 'outline'}>
                  <Link href={t.cta.href}>{t.cta.label}</Link>
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
