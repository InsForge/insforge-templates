import Image from 'next/image';
import { Marquee } from '@/components/magicui/marquee';
import { NumberTicker } from '@/components/magicui/number-ticker';
import { logoCloud } from '@/lib/content';

export function LogoCloud() {
  return (
    <section className="border-b border-border py-14">
      <div className="mx-auto max-w-6xl px-6">
        <dl className="grid gap-8 sm:grid-cols-3">
          {logoCloud.stats.map((s) => (
            <div key={s.label} className="text-center">
              <dt className="flex items-baseline justify-center gap-0.5 text-4xl font-semibold tracking-tight sm:text-5xl">
                {s.prefix}
                <NumberTicker value={s.value} decimalPlaces={s.decimals ?? 0} />
                {s.suffix}
              </dt>
              <dd className="mt-2 text-sm text-muted-foreground">{s.label}</dd>
            </div>
          ))}
        </dl>

        <p className="mt-12 text-center text-xs uppercase tracking-widest text-muted-foreground">
          {logoCloud.heading}
        </p>
        <Marquee pauseOnHover className="mt-6 [--duration:35s]">
          {logoCloud.logos.map((l) => (
            <div key={l.name} className="mx-8 flex h-8 w-28 items-center justify-center">
              <Image
                src={l.src}
                alt={l.name}
                width={112}
                height={32}
                className="h-6 w-auto opacity-60 grayscale transition hover:opacity-100 dark:invert"
              />
            </div>
          ))}
        </Marquee>
      </div>
    </section>
  );
}
