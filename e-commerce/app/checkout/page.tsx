import { redirect } from 'next/navigation';
import { CheckoutForm } from '@/components/checkout-form';
import { SiteHeader } from '@/components/site-header';
import { requireAuthenticatedSession } from '@/lib/auth-session';
import { calculateCartTotals, getActiveCart, getSavedAddresses } from '@/lib/store';
import { formatCurrency } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function CheckoutPage() {
  const { viewer, accessToken } = await requireAuthenticatedSession();

  const [cart, addresses] = await Promise.all([
    getActiveCart(viewer.id, accessToken),
    getSavedAddresses(viewer.id, accessToken),
  ]);

  if (!cart?.items.length) {
    redirect('/cart');
  }

  const totals = calculateCartTotals(cart.items);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="page-shell grid gap-8 py-10 lg:grid-cols-[1fr_0.8fr]">
        <section className="space-y-6">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Checkout</p>
            <h1 className="mt-2 font-display text-6xl">Ship this order.</h1>
          </div>
          <CheckoutForm addresses={addresses} />
        </section>

        <aside className="glass-panel h-fit space-y-5 p-6">
          <h2 className="font-display text-4xl">Cart recap</h2>
          <div className="space-y-4">
            {cart.items.map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-4 text-sm">
                <div>
                  <p className="font-medium">{item.product?.name}</p>
                  {item.variant?.option_summary ? (
                    <p className="text-muted-foreground">{item.variant.option_summary}</p>
                  ) : null}
                  <p className="text-muted-foreground">Qty {item.quantity}</p>
                </div>
                <span>{formatCurrency(item.quantity * item.unit_price_cents)}</span>
              </div>
            ))}
          </div>

          <div className="space-y-2 border-t border-border pt-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(totals.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shipping</span>
              <span>{formatCurrency(totals.shipping)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax</span>
              <span>{formatCurrency(totals.tax)}</span>
            </div>
            <div className="flex justify-between font-medium">
              <span>Total</span>
              <span>{formatCurrency(totals.total)}</span>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
