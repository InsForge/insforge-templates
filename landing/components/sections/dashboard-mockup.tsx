'use client';

import { NumberTicker } from '@/components/magicui/number-ticker';

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

export function DashboardMockup() {
  return (
    <div className="rounded-2xl border border-border bg-card/80 p-4 shadow-2xl backdrop-blur">
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

      <div className="mt-4 grid gap-3 md:grid-cols-[2fr_1fr]">
        <div className="rounded-xl border border-border bg-background/60 p-4">
          <div className="text-xs text-muted-foreground">Last 30 days</div>
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="mt-2 h-32 w-full">
            <defs>
              <linearGradient id="grad" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="currentColor" stopOpacity="0.35" />
                <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={areaPath} className="text-primary" fill="url(#grad)" />
            <path d={path} className="text-primary" fill="none" stroke="currentColor" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
          </svg>
        </div>
        <div className="rounded-xl border border-border bg-background/60 p-4">
          <div className="text-xs text-muted-foreground">Funnel</div>
          <div className="mt-3 space-y-2">
            {funnel.map((f) => (
              <div key={f.label}>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{f.label}</span>
                  <span className="tabular-nums">{f.value}%</span>
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${f.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
