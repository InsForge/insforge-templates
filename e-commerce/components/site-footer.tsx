import Link from 'next/link';
import { STORE_DESCRIPTION, STORE_NAME } from '@/lib/constants';

export function SiteFooter() {
  return (
    <footer className="border-t border-black/5 py-10">
      <div className="page-shell flex flex-col gap-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-display text-2xl text-foreground">{STORE_NAME}</p>
          <p className="mt-1 max-w-md">{STORE_DESCRIPTION}</p>
        </div>
        <div className="flex flex-wrap gap-4">
          <Link href="/products" className="hover:text-foreground">Shop all</Link>
          <Link href="/account/orders" className="hover:text-foreground">Orders</Link>
          <Link href="/cart" className="hover:text-foreground">Cart</Link>
        </div>
      </div>
    </footer>
  );
}
