import Link from 'next/link';
import { AccountHeader } from '@/components/account-header';
import { EmptyState } from '@/components/empty-state';
import { OrderPlacedToast } from '@/components/order-placed-toast';
import { SiteHeader } from '@/components/site-header';
import { requireAuthenticatedSession } from '@/lib/auth-session';
import { getOrders } from '@/lib/store';
import { formatCurrency, formatShortDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ placed?: string }>;
}) {
  const params = await searchParams;
  const { viewer, accessToken } = await requireAuthenticatedSession();

  const orders = await getOrders({
    accessToken,
    userId: viewer.id,
    isAdmin: false,
  });

  return (
    <div className="min-h-screen">
      {params.placed ? <OrderPlacedToast orderId={params.placed} /> : null}
      <SiteHeader />
      <main className="page-shell space-y-8 py-10">
        <AccountHeader
          activeTab="orders"
          description="Review each purchase, track status changes, and open the full order summary with line items and shipping details."
          title="Order history."
        />

        <section className="grid gap-4">
          {orders.length ? (
            orders.map((order) => (
              <Link
                key={order.id}
                className="glass-panel grid gap-5 p-6 transition hover:-translate-y-0.5 hover:shadow-[0_22px_60px_-24px_rgba(33,29,24,0.35)] lg:grid-cols-[minmax(0,1fr)_auto] lg:grid-rows-[auto_auto]"
                href={`/account/orders/${order.id}`}
              >
                <div className="min-w-0 lg:row-span-2">
                  <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">{order.order_number}</p>
                  <h2 className="mt-3 font-display text-3xl sm:text-4xl">{order.shipping_name}</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Placed {formatShortDate(order.created_at)}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground lg:justify-self-end lg:self-start">
                  <span className="rounded-full bg-secondary px-3 py-1 text-secondary-foreground">{order.status}</span>
                </div>

                <div className="text-left lg:justify-self-end lg:text-right lg:self-end">
                  <p className="font-medium">{formatCurrency(order.total_cents)}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{order.email}</p>
                </div>
              </Link>
            ))
          ) : (
            <EmptyState
              actionHref="/products"
              actionLabel="Explore products"
              description="Placed orders will show up here with fulfillment progress, totals, and delivery details."
              eyebrow="Orders"
              title="Your order history is empty."
            />
          )}
        </section>
      </main>
    </div>
  );
}
