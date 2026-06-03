import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { EmptyState } from '@/components/empty-state';
import { ProductCard } from '@/components/product-card';
import { ProductConfigurator } from '@/components/product-configurator';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { WishlistButton } from '@/components/wishlist-button';
import { getCurrentAuthState } from '@/lib/auth-state';
import { getProductBySlug, getProducts, getWishlistProductIds } from '@/lib/store';

export const dynamic = 'force-dynamic';

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [product, authState] = await Promise.all([
    getProductBySlug(slug),
    getCurrentAuthState(),
  ]);

  if (!product) {
    notFound();
  }

  const viewerId = authState.viewer.isAuthenticated ? authState.viewer.id : null;
  const wishlistPromise = viewerId && authState.accessToken
    ? getWishlistProductIds({ accessToken: authState.accessToken, userId: viewerId })
    : Promise.resolve(new Set<string>());

  const [wishlistIds, allRelated] = await Promise.all([
    wishlistPromise,
    getProducts({ category: product.category?.slug ?? undefined }),
  ]);
  const inWishlist = wishlistIds.has(product.id);

  const relatedProducts = allRelated
    .filter((item) => item.id !== product.id)
    .slice(0, 3);

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main className="page-shell space-y-16 py-10">
        <Link href="/products" className="text-sm text-muted-foreground hover:text-foreground">
          Back to catalog
        </Link>

        <section className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="glass-panel relative min-h-[560px] overflow-hidden p-4">
            {product.image_url ? (
              <Image
                src={product.image_url}
                alt={product.image_alt || product.name}
                fill
                className="rounded-[28px] object-cover"
                sizes="(min-width: 1024px) 52vw, 100vw"
                preload
                fetchPriority="high"
              />
            ) : (
              <div className="flex h-full items-center justify-center rounded-[28px] bg-muted/60 p-10 text-center text-muted-foreground">
                Product photography will appear here once it is attached in storage.
              </div>
            )}
          </div>

          <div className="space-y-8">
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">
                  {product.category?.name}
                </p>
                {viewerId ? (
                  <WishlistButton productId={product.id} initialInWishlist={inWishlist} />
                ) : null}
              </div>
              <h1 className="font-display text-6xl leading-none">{product.name}</h1>
              <p className="max-w-xl text-lg text-muted-foreground">{product.description}</p>
            </div>

            <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
              <div>
                <p className="uppercase tracking-[0.24em]">Material</p>
                <p className="mt-2 text-foreground">{product.material || 'Curated composite'}</p>
              </div>
              <div>
                <p className="uppercase tracking-[0.24em]">Color</p>
                <p className="mt-2 text-foreground">{product.color_name || 'Natural'}</p>
              </div>
              <div>
                <p className="uppercase tracking-[0.24em]">Options</p>
                <p className="mt-2 text-foreground">
                  {product.variants?.length ? `${product.variants.length} configurations` : 'Single configuration'}
                </p>
              </div>
            </div>

            <ProductConfigurator product={product} />
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-5xl">You may also like</h2>
            <Link href="/products" className="text-sm text-muted-foreground hover:text-foreground">
              See all
            </Link>
          </div>
          {relatedProducts.length ? (
            <div className="grid gap-5 md:grid-cols-3">
              {relatedProducts.map((item) => (
                <ProductCard
                  key={item.id}
                  product={item}
                  showWishlist={!!viewerId}
                  inWishlist={wishlistIds.has(item.id)}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              actionHref="/products"
              actionLabel="Browse catalog"
              className="py-8"
              description="This piece is currently the only active product in its category, so there is nothing adjacent to recommend yet."
              eyebrow="Related"
              title="No companion pieces yet."
            />
          )}
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
