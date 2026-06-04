'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { NumberTicker } from '@/components/magicui/number-ticker';
import { cn } from '@/lib/utils';

type Kpi = { label: string; value: number; prefix?: string; suffix?: string; delta: string };

const kpis: Kpi[] = [
  { label: 'Active users', value: 12438, delta: '+12.4%' },
  { label: 'Conversion', value: 4.7, suffix: '%', delta: '+0.6 pp' },
  { label: 'Revenue', value: 89420, prefix: '$', delta: '+18.1%' },
  { label: 'Retention (D30)', value: 68, suffix: '%', delta: '+3.2 pp' },
];

const linePoints = [
  20, 28, 24, 36, 42, 38, 50, 58, 54, 62, 68, 72, 70, 78, 82, 76, 84, 90, 86, 94,
  88, 96, 102, 110, 106, 116, 124, 120, 132, 138,
];
const maxY = Math.max(...linePoints);
const path = linePoints
  .map((y, i) => {
    const x = (i / (linePoints.length - 1)) * 100;
    const ny = 100 - (y / maxY) * 100;
    return `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${ny.toFixed(2)}`;
  })
  .join(' ');
const areaPath = `${path} L 100 100 L 0 100 Z`;

const funnel = [
  { label: 'Visited', value: 100 },
  { label: 'Signed up', value: 62 },
  { label: 'Activated', value: 41 },
  { label: 'Paid', value: 18 },
];

// 8 weekly cohorts × 8 week buckets retention heatmap (synthetic but plausible)
const retention: number[][] = Array.from({ length: 8 }, (_, row) =>
  Array.from({ length: 8 }, (_, col) => {
    if (col === 0) return 100;
    if (col > 7 - row) return -1; // not yet observed for newer cohorts
    const base = 92 - col * 8 - row * 1.4;
    return Math.max(18, Math.round(base));
  }),
);

const tabs = [
  { id: 'trends', label: 'Trends' },
  { id: 'funnel', label: 'Funnel' },
  { id: 'retention', label: 'Retention' },
] as const;

type TabId = (typeof tabs)[number]['id'];

export function DashboardMockup() {
  const [active, setActive] = useState<TabId>('trends');

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card/80 shadow-2xl backdrop-blur">
      {/* macOS-style chrome */}
      <div className="flex items-center gap-3 border-b border-border bg-secondary/40 px-4 py-2.5">
        <div className="flex gap-1.5">
          <span className="size-2.5 rounded-full bg-red-400/80" />
          <span className="size-2.5 rounded-full bg-yellow-400/80" />
          <span className="size-2.5 rounded-full bg-emerald-400/80" />
        </div>
        <div className="mx-auto flex h-6 max-w-xs flex-1 items-center justify-center rounded-md border border-border bg-background/60 px-3 text-[10px] text-muted-foreground">
          app.acme.io/dashboard
        </div>
        <div className="w-9" aria-hidden />
      </div>

      <div className="p-4">
        {/* KPI strip (always visible) */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {kpis.map((k) => (
            <div key={k.label} className="rounded-xl border border-border bg-background/60 p-3">
              <div className="text-xs text-muted-foreground">{k.label}</div>
              <div className="mt-1 flex items-baseline gap-1 text-xl font-semibold tracking-tight">
                {k.prefix}
                <NumberTicker value={k.value} decimalPlaces={k.suffix === '%' && k.value < 10 ? 1 : 0} />
                {k.suffix}
              </div>
              <div className="mt-1 text-xs text-emerald-500">{k.delta}</div>
            </div>
          ))}
        </div>

        {/* Tab nav */}
        <div className="mt-4 flex gap-1 rounded-lg border border-border bg-background/40 p-1 text-xs">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActive(t.id)}
              className={cn(
                'flex-1 rounded-md px-3 py-1.5 font-medium transition',
                active === t.id
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="mt-3 min-h-[180px] rounded-xl border border-border bg-background/60 p-4">
          <AnimatePresence mode="wait">
            {active === 'trends' && (
              <motion.div
                key="trends"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18 }}
              >
                <div className="text-xs text-muted-foreground">Active users · last 30 days</div>
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="mt-2 h-36 w-full">
                  <defs>
                    <linearGradient id="grad" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="currentColor" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d={areaPath} className="text-primary" fill="url(#grad)" />
                  <path
                    d={path}
                    className="text-primary"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>
              </motion.div>
            )}

            {active === 'funnel' && (
              <motion.div
                key="funnel"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18 }}
              >
                <div className="text-xs text-muted-foreground">Activation funnel · last 30 days</div>
                <div className="mt-3 space-y-3">
                  {funnel.map((f) => (
                    <div key={f.label}>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">{f.label}</span>
                        <span className="tabular-nums">{f.value}%</span>
                      </div>
                      <div className="mt-1 h-2 rounded-full bg-secondary">
                        <motion.div
                          className="h-full rounded-full bg-primary"
                          initial={{ width: 0 }}
                          animate={{ width: `${f.value}%` }}
                          transition={{ duration: 0.5, ease: 'easeOut' }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {active === 'retention' && (
              <motion.div
                key="retention"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18 }}
              >
                <div className="text-xs text-muted-foreground">Weekly cohorts · retention %</div>
                <div className="mt-3 grid gap-1" style={{ gridTemplateColumns: 'repeat(8, minmax(0, 1fr))' }}>
                  {retention.flatMap((row, r) =>
                    row.map((v, c) => (
                      <div
                        key={`${r}-${c}`}
                        className={cn(
                          'aspect-square rounded-sm text-[9px] flex items-center justify-center tabular-nums',
                          v < 0 ? 'bg-secondary/30 text-muted-foreground/40' : 'text-primary-foreground',
                        )}
                        style={
                          v < 0
                            ? undefined
                            : { backgroundColor: `hsl(var(--primary) / ${0.15 + (v / 100) * 0.75})` }
                        }
                      >
                        {v < 0 ? '·' : v}
                      </div>
                    )),
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
