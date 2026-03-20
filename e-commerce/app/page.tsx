import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { ProductCard } from '@/components/product-card';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { Button } from '@/components/ui/button';
import { getCategories, getFeaturedProducts, getProducts } from '@/lib/store';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [categories, featuredProducts, latestProducts] = await Promise.all([
    getCategories(),
    getFeaturedProducts(),
    getProducts(),
  ]);

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main className="space-y-20 pb-20">
        <section className="page-shell grid gap-8 py-10 lg:grid-cols-[0.9fr_1.1fr] lg:py-14">
          <div className="flex flex-col justify-between gap-10">
            <div className="space-y-6">
              <p className="text-sm uppercase tracking-[0.35em] text-muted-foreground">
                Everyday pieces
              </p>
              <h1 className="max-w-xl font-display text-6xl leading-none text-balance sm:text-7xl lg:text-[6.5rem]">
                Modern essentials for a quieter home.
              </h1>
              <p className="max-w-lg text-base text-muted-foreground sm:text-lg">
                Thoughtful furniture, lighting, and tableware designed to settle naturally into daily life.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button asChild className="rounded-full px-6">
                <Link href="/products">
                  Shop collection
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="glass-panel relative overflow-hidden p-4 sm:p-6">
            <div className="grid gap-4 md:grid-cols-[1.3fr_0.7fr]">
              <div className="relative min-h-[420px] overflow-hidden rounded-[28px]">
                <Image
                  src="https://images.unsplash.com/photo-1499933374294-4584851497cc?auto=format&fit=crop&w=1600&q=80"
                  alt="Sunlit dining room with neutral styling"
                  fill
                  className="object-cover"
                  sizes="(min-width: 1024px) 36vw, (min-width: 768px) 55vw, 100vw"
                />
              </div>
              <div className="flex flex-col justify-between gap-4">
                <div className="rounded-[24px] bg-secondary/65 p-5">
                  <p className="text-sm uppercase tracking-[0.25em] text-muted-foreground">
                    New edit
                  </p>
                  <ul className="mt-4 space-y-3 text-sm">
                    <li>Soft living room anchors and compact storage</li>
                    <li>Bedroom layers that keep the room light and calm</li>
                    <li>Dining pieces made for everyday hosting</li>
                  </ul>
                </div>
                <div className="rounded-[24px] bg-primary p-5 text-primary-foreground">
                  <p className="text-sm uppercase tracking-[0.25em] text-primary-foreground/60">Built by InsForge</p>
                  <p className="mt-4 font-display text-4xl">Simple flow</p>
                  <p className="mt-2 text-sm text-primary-foreground/72">
                    Browse, save, and order through a clean customer experience powered by InsForge.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="page-shell space-y-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Featured edit</p>
              <h2 className="mt-2 font-display text-5xl">Pieces chosen to feel warm, useful, and lived in.</h2>
            </div>
            <Link href="/products" className="text-sm text-muted-foreground hover:text-foreground">
              Browse every product
            </Link>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>

        <section className="page-shell grid gap-5 lg:grid-cols-3">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/products?category=${category.slug}`}
              className="glass-panel group flex min-h-60 flex-col justify-between p-6"
            >
              <div
                className="size-12 rounded-full"
                style={{ backgroundColor: category.accent_color ?? '#d6b48b' }}
              />
              <div>
                <p className="text-sm uppercase tracking-[0.28em] text-muted-foreground">Category</p>
                <h3 className="mt-2 font-display text-4xl group-hover:translate-x-1 transition-transform">
                  {category.name}
                </h3>
                <p className="mt-2 max-w-sm text-sm text-muted-foreground">{category.description}</p>
              </div>
            </Link>
          ))}
        </section>

        <section className="page-shell space-y-6">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-muted-foreground">New in store</p>
            <h2 className="mt-2 font-display text-5xl">Fresh arrivals for living, dining, and rest.</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {latestProducts.slice(0, 3).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
