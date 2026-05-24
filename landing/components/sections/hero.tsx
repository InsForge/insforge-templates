import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BorderBeam } from '@/components/magicui/border-beam';
import { DotPattern } from '@/components/magicui/dot-pattern';
import { DashboardMockup } from '@/components/sections/dashboard-mockup';
import { hero } from '@/lib/content';
import { cn } from '@/lib/utils';

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <DotPattern
        className={cn(
          '[mask-image:radial-gradient(circle_at_center,white,transparent_70%)]',
          'opacity-40',
        )}
      />
      <div className="absolute inset-x-0 top-0 -z-10 mx-auto h-[600px] max-w-5xl bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.15),transparent_60%)]" />

      <div className="relative mx-auto grid max-w-6xl gap-12 px-6 py-20 lg:grid-cols-2 lg:py-28">
        <div className="flex flex-col justify-center gap-6">
          <Badge variant="outline" className="w-fit gap-2 rounded-full border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
            <span className="size-1.5 rounded-full bg-primary" />
            {hero.badge}
          </Badge>
          <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
            {hero.headline}
          </h1>
          <p className="max-w-xl text-pretty text-base text-muted-foreground sm:text-lg">
            {hero.subhead}
          </p>
          <div className="flex flex-wrap gap-3">
            <div className="relative overflow-hidden rounded-md">
              <Button asChild size="lg">
                <Link href={hero.primaryCta.href}>
                  {hero.primaryCta.label}
                  <ArrowRight className="ml-1 size-4" />
                </Link>
              </Button>
              <BorderBeam size={60} duration={6} />
            </div>
            <Button asChild size="lg" variant="ghost">
              <Link href={hero.secondaryCta.href}>{hero.secondaryCta.label}</Link>
            </Button>
          </div>
        </div>

        <div className="relative">
          <DashboardMockup />
        </div>
      </div>
    </section>
  );
}
