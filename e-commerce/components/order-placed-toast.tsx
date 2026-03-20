'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';

export function OrderPlacedToast({ orderId }: { orderId: string }) {
  useEffect(() => {
    toast.success('Order placed successfully.', {
      description: `Order id: ${orderId}`,
      id: `order-placed-${orderId}`,
    });
  }, [orderId]);

  return null;
}
