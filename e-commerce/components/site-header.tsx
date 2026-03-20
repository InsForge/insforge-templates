import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { AccountDropdown } from '@/components/account-dropdown';
import { STORE_NAME } from '@/lib/constants';
import { getCurrentAuthState } from '@/lib/auth-state';
import { getActiveCart } from '@/lib/store';
import { cn, getInitials, getViewerLabel } from '@/lib/utils';

const navItems = [
  { href: '/products', label: 'Shop' },
  { href: '/products?category=living', label: 'Living' },
  { href: '/products?category=bedroom', label: 'Bedroom' },
  { href: '/products?category=dining', label: 'Dining' },
];

export async function SiteHeader({ compact = false }: { compact?: boolean }) {
  const { viewer, accessToken } = await getCurrentAuthState();
  const cart = viewer.isAuthenticated && viewer.id && accessToken
    ? await getActiveCart(viewer.id, accessToken)
    : null;
  const cartCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
  const viewerLabel = getViewerLabel(viewer.name, viewer.email);
  const viewerInitials = getInitials(viewerLabel);

  return (
    <header className={cn('sticky top-0 z-40 border-b border-black/5 bg-background/85 backdrop-blur-xl', compact && 'relative bg-transparent')}>
      <div className="page-shell flex h-18 items-center justify-between gap-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="font-display text-3xl tracking-tight">
            {STORE_NAME}
          </Link>
          <nav className="hidden items-center gap-5 text-sm text-muted-foreground md:flex">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="hover:text-foreground">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {viewer.isAuthenticated ? (
            <AccountDropdown
              avatarUrl={viewer.avatarUrl}
              email={viewer.email}
              viewerInitials={viewerInitials}
              viewerLabel={viewerLabel}
            />
          ) : (
            <Link
              href="/auth/sign-in"
              className="inline-flex rounded-full border border-border bg-card px-4 py-2 text-sm text-foreground"
            >
              Sign in
            </Link>
          )}

          <Link
            href="/cart"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-primary px-4 py-2 text-sm text-primary-foreground"
          >
            <ShoppingBag className="size-4" />
            Cart
            <span className="rounded-full bg-white/12 px-2 py-0.5 text-xs">{cartCount}</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
