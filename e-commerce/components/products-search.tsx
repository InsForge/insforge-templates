'use client';

import { Search } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useDeferredValue, useEffect, useState } from 'react';

export function ProductsSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentSearch = searchParams.get('search') ?? '';
  const [query, setQuery] = useState(currentSearch);
  const deferredQuery = useDeferredValue(query);
  const paramsString = searchParams.toString();

  useEffect(() => {
    setQuery(currentSearch);
  }, [currentSearch]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const params = new URLSearchParams(paramsString);
      const normalized = deferredQuery.trim();

      if (normalized) {
        params.set('search', normalized);
      } else {
        params.delete('search');
      }

      const nextHref = params.toString() ? `${pathname}?${params.toString()}` : pathname;
      const currentHref = paramsString ? `${pathname}?${paramsString}` : pathname;

      if (nextHref !== currentHref) {
        router.replace(nextHref, { scroll: false });
      }
    }, 280);

    return () => window.clearTimeout(timeoutId);
  }, [deferredQuery, paramsString, pathname, router]);

  return (
    <label className="relative block w-full max-w-xl">
      <Search className="pointer-events-none absolute left-5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        aria-label="Search products"
        className="h-12 w-full rounded-full border border-input bg-white/70 pl-12 pr-5 text-sm shadow-sm outline-none transition focus:border-foreground/20"
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search furniture, tableware, and bedroom pieces"
        type="search"
        value={query}
      />
    </label>
  );
}
