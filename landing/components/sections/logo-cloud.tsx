import Image from 'next/image';
import { Marquee } from '@/components/magicui/marquee';
import { logoCloud } from '@/lib/content';

export function LogoCloud() {
  return (
    <section className="border-b border-border py-14">
      <div className="mx-auto max-w-6xl px-6">
        <p className="text-center text-xs uppercase tracking-widest text-muted-foreground">
          {logoCloud.heading}
        </p>
        <Marquee pauseOnHover className="mt-8 [--duration:35s]">
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
