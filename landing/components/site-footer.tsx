import Link from 'next/link';
import { brand, footer } from '@/lib/content';
import { ThemeToggle } from '@/components/theme-toggle';

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-6">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2 font-semibold tracking-tight">
            <div className="size-6 rounded-md bg-primary" aria-hidden />
            {brand.name}
          </div>
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">{brand.description}</p>
        </div>
        {footer.groups.map((g) => (
          <div key={g.heading}>
            <h4 className="text-sm font-medium text-foreground">{g.heading}</h4>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {g.links.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="transition hover:text-foreground">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-6 text-xs text-muted-foreground md:flex-row">
          <p>
            © {new Date().getFullYear()} {brand.name}. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            {footer.social.map((s) => (
              <a key={s.label} href={s.href} className="transition hover:text-foreground">
                {s.label}
              </a>
            ))}
            <ThemeToggle />
          </div>
        </div>
      </div>
    </footer>
  );
}
