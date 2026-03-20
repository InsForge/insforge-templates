'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Loader2, Minus, Plus, Trash2 } from 'lucide-react';
import { startTransition, useState } from 'react';
import { toast } from 'sonner';
import { removeCartItemAction, updateCartItemAction } from '@/lib/store-actions';
import type { CartItem } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';

export function CartItemRow({ item }: { item: CartItem }) {
  const [isPending, setIsPending] = useState(false);
  const previewImage = item.variant?.image_url ?? item.product?.image_url;
  const previewAlt = item.variant?.title || item.product?.image_alt || item.product?.name || 'Product image';

  function mutate(nextQuantity?: number, remove = false) {
    setIsPending(true);

    startTransition(async () => {
      try {
        if (remove) {
          await removeCartItemAction(item.id);
        } else if (typeof nextQuantity === 'number') {
          await updateCartItemAction(item.id, nextQuantity);
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Unable to update cart.');
      } finally {
        setIsPending(false);
      }
    });
  }

  return (
    <article className="grid gap-4 rounded-[24px] border border-border bg-white/55 p-4 sm:grid-cols-[140px_1fr] sm:p-5">
      <div className="relative aspect-square overflow-hidden rounded-[20px] bg-muted/60">
        {previewImage ? (
          <Image
            src={previewImage}
            alt={previewAlt}
            fill
            className="object-cover"
            sizes="(min-width: 640px) 140px, 100vw"
          />
        ) : <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Preview pending</div>}
      </div>

      <div className="flex flex-col justify-between gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Link href={`/products/${item.product?.slug}`} className="font-display text-3xl leading-none">
              {item.product?.name}
            </Link>
            {item.variant?.title || item.variant?.option_summary ? (
              <p className="mt-2 text-sm text-foreground">
                {item.variant?.title}
                {item.variant?.option_summary ? ` • ${item.variant.option_summary}` : ''}
              </p>
            ) : null}
            <p className="mt-2 text-sm text-muted-foreground">{item.product?.short_description}</p>
          </div>

          <div className="text-left sm:text-right">
            <p className="font-medium">{formatCurrency(item.unit_price_cents)}</p>
            <p className="text-sm text-muted-foreground">each</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center rounded-full border border-border bg-background p-1">
            <button
              type="button"
              className="inline-flex size-9 items-center justify-center rounded-full hover:bg-muted"
              disabled={isPending}
              onClick={() => mutate(item.quantity - 1)}
            >
              <Minus className="size-4" />
            </button>
            <span className="min-w-9 text-center text-sm">{item.quantity}</span>
            <button
              type="button"
              className="inline-flex size-9 items-center justify-center rounded-full hover:bg-muted"
              disabled={isPending}
              onClick={() => mutate(item.quantity + 1)}
            >
              <Plus className="size-4" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <p className="font-medium">{formatCurrency(item.quantity * item.unit_price_cents)}</p>
            <button
              type="button"
              className="inline-flex size-10 items-center justify-center rounded-full border border-border text-muted-foreground hover:text-foreground"
              disabled={isPending}
              onClick={() => mutate(undefined, true)}
            >
              {isPending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
