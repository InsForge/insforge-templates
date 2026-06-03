import Image from 'next/image';
import Link from 'next/link';
import { AccountHeader } from '@/components/account-header';
import { SiteHeader } from '@/components/site-header';
import { WishlistButton } from '@/components/wishlist-button';
import { requireAuthenticatedSession } from '@/lib/auth-session';
import { getWishlistWithProducts } from '@/lib/store';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

export default async function WishlistPage() {
  const { viewer, accessToken } = await requireAuthenticatedSession();
  const items = await getWishlistWithProducts({ accessToken, userId: viewer.id });

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="page-shell space-y-8 py-10">
        <AccountHeader
          activeTab="wishlist"
          description="Products you have saved for later. Tap the heart to remove an item from your list."
          title="Wishlist."
        />

        <section>
          {items.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-sm text-muted-foreground mb-6">
                Browse the catalog and tap the heart on anything you want to come back to.
              </p>
              <Button asChild>
                <Link href="/products">Browse products</Link>
              </Button>
            </div>
          ) : (
            <ul className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {items.map((item) => (
                <li key={item.id} className="glass-panel overflow-hidden">
                  <Link href={`/products/${item.product?.slug ?? ''}`} className="block">
                    {item.product?.image_url ? (
                      <div className="relative aspect-[4/5] overflow-hidden rounded-t-[24px] bg-muted/60">
                        <Image
                          src={item.product.image_url}
                          alt={item.product.image_alt || item.product.name}
                          fill
                          sizes="(min-width: 1280px) 25vw, (min-width: 768px) 50vw, 100vw"
                          className="object-cover"
                        />
                        <div
                          className="absolute right-3 top-3"
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                        >
                          <WishlistButton
                            productId={item.product_id}
                            initialInWishlist
                            size="sm"
                          />
                        </div>
                      </div>
                    ) : null}
                    <div className="p-5">
                      <p className="font-display text-2xl leading-none">{item.product?.name}</p>
                      {item.product?.short_description ? (
                        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                          {item.product.short_description}
                        </p>
                      ) : null}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
