'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { pollOrderPaymentAction } from '@/lib/store-actions';
import { Button } from '@/components/ui/button';

const POLL_INTERVAL_MS = 1500;
const POLL_TIMEOUT_MS = 30_000;

function CheckoutSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order_id');

  const [status, setStatus] = useState<'polling' | 'paid' | 'timeout' | 'error'>('polling');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!orderId) {
      setStatus('error');
      setErrorMsg('Missing order identifier.');
      return;
    }

    let cancelled = false;
    const start = Date.now();

    async function poll() {
      try {
        const result = await pollOrderPaymentAction({ orderId: orderId! });
        if (cancelled) return;
        if (result.paid) {
          setStatus('paid');
          redirectTimerRef.current = setTimeout(() => router.replace(`/account/orders/${orderId}`), 600);
          return;
        }
        if (Date.now() - start > POLL_TIMEOUT_MS) {
          setStatus('timeout');
          return;
        }
        pollTimerRef.current = setTimeout(poll, POLL_INTERVAL_MS);
      } catch (err) {
        if (cancelled) return;
        setStatus('error');
        setErrorMsg(err instanceof Error ? err.message : 'Unable to confirm payment.');
      }
    }

    poll();
    return () => {
      cancelled = true;
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
      if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
    };
  }, [orderId, router]);

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      {status === 'polling' ? (
        <>
          <Loader2 className="size-8 animate-spin" />
          <h1 className="font-display text-2xl">Confirming your payment</h1>
          <p className="text-sm text-muted-foreground">
            Stripe is letting us know your payment went through. This usually takes a few seconds.
          </p>
        </>
      ) : null}
      {status === 'paid' ? (
        <>
          <h1 className="font-display text-2xl">Payment confirmed</h1>
          <p className="text-sm text-muted-foreground">Redirecting to your order details.</p>
        </>
      ) : null}
      {status === 'timeout' ? (
        <>
          <h1 className="font-display text-2xl">Still processing</h1>
          <p className="text-sm text-muted-foreground">
            Your payment is taking longer than usual. We saved your order. You can refresh this page, or check your account to see the latest status.
          </p>
          <Button onClick={() => router.replace(`/account/orders/${orderId}`)}>View order</Button>
        </>
      ) : null}
      {status === 'error' ? (
        <>
          <h1 className="font-display text-2xl">Something went wrong</h1>
          <p className="text-sm text-destructive">{errorMsg}</p>
          <Button onClick={() => router.replace('/cart')}>Back to cart</Button>
        </>
      ) : null}
    </main>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
          <Loader2 className="size-8 animate-spin" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </main>
      }
    >
      <CheckoutSuccessContent />
    </Suspense>
  );
}
