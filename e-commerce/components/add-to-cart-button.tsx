'use client';

import { Loader2 } from 'lucide-react';
import { startTransition, useState } from 'react';
import { toast } from 'sonner';
import { addToCartAction } from '@/lib/store-actions';
import { Button } from '@/components/ui/button';

function isRedirectError(error: unknown): boolean {
  return error instanceof Error && error.message === 'NEXT_REDIRECT';
}

export function AddToCartButton({
  productId,
  variantId,
  quantity = 1,
  className,
  label = 'Add to cart',
  disabled = false,
}: {
  productId: string;
  variantId?: string;
  quantity?: number;
  className?: string;
  label?: string;
  disabled?: boolean;
}) {
  const [isPending, setIsPending] = useState(false);

  function handleClick() {
    setIsPending(true);

    startTransition(async () => {
      try {
        await addToCartAction(productId, quantity, variantId);
        toast.success('Added to cart.');
      } catch (error) {
        if (isRedirectError(error)) throw error;
        toast.error(error instanceof Error ? error.message : 'Unable to add item.');
      } finally {
        setIsPending(false);
      }
    });
  }

  return (
    <Button className={className} disabled={disabled || isPending} onClick={handleClick}>
      {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
      {isPending ? 'Adding' : label}
    </Button>
  );
}
