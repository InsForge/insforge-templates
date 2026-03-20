import Image from 'next/image';
import Link from 'next/link';
import type { Product } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';

export function ProductCard({
  product,
  imageLoading = 'lazy',
  imageFetchPriority = 'auto',
}: {
  product: Product;
  imageLoading?: 'lazy' | 'eager';
  imageFetchPriority?: 'auto' | 'high' | 'low';
}) {
  return (
    <Link href={`/products/${product.slug}`} className="group glass-panel overflow-hidden">
      <div className="relative aspect-[4/5] overflow-hidden rounded-[24px] bg-muted/60">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.image_alt || product.name}
            fill
            className="object-cover transition duration-500 group-hover:scale-[1.03]"
            sizes="(min-width: 1280px) 25vw, (min-width: 768px) 50vw, 100vw"
            loading={imageLoading}
            fetchPriority={imageFetchPriority}
          />
        ) : null}
      </div>

      <div className="space-y-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            {product.badge ? (
              <p className="mb-2 text-xs uppercase tracking-[0.28em] text-muted-foreground">
                {product.badge}
              </p>
            ) : null}
            <h3 className="font-display text-3xl leading-none">{product.name}</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            {product.category?.name}
          </p>
        </div>

        <p className="min-h-12 text-sm text-muted-foreground">
          {product.short_description}
        </p>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <span className="font-medium text-foreground">{formatCurrency(product.price_cents)}</span>
            {product.compare_at_price_cents ? (
              <span className="text-muted-foreground line-through">
                {formatCurrency(product.compare_at_price_cents)}
              </span>
            ) : null}
          </div>
          <span className="text-muted-foreground">Stock {product.inventory_count}</span>
        </div>
      </div>
    </Link>
  );
}
