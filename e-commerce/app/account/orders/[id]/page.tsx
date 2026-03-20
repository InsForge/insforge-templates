import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { SiteHeader } from '@/components/site-header';
import { requireAuthenticatedSession } from '@/lib/auth-session';
import { getOrderById } from '@/lib/store';
import { formatCurrency, formatShortDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm text-foreground">{value}</p>
    </div>
  );
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { viewer, accessToken } = await requireAuthenticatedSession();

  const order = await getOrderById({
    accessToken,
    userId: viewer.id,
    isAdmin: false,
    id,
  });

  if (!order) {
    notFound();
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="page-shell space-y-8 py-10">
        <div className="space-y-4">
          <Link
            href="/account/orders"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="size-4" />
            Back to orders
          </Link>
          <div className="space-y-3">
            <h1 className="font-display text-5xl leading-none sm:text-6xl">{order.order_number}</h1>
            <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
              Placed {formatShortDate(order.placed_at)} for {order.shipping_name}. Review items, totals, and delivery details below.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.2em]">
            <span className="rounded-full bg-secondary px-3 py-1 text-secondary-foreground">{order.status}</span>
            <span className="rounded-full border border-border px-3 py-1 text-muted-foreground">{order.payment_status}</span>
            <span className="rounded-full border border-border px-3 py-1 text-muted-foreground">{order.fulfillment_status}</span>
          </div>
        </div>

        <section className="grid gap-8 xl:grid-cols-[minmax(0,1.2fr)_420px]">
          <div className="space-y-5">
            <section className="glass-panel overflow-hidden">
              <div className="border-b border-border px-6 py-5">
                <h2 className="font-display text-4xl">Items</h2>
              </div>
              <div className="divide-y divide-border">
                {(order.items ?? []).map((item) => (
                  <article key={item.id} className="grid gap-4 px-6 py-5 md:grid-cols-[110px_minmax(0,1fr)_auto] md:items-center">
                    <div className="relative aspect-square overflow-hidden rounded-[18px] bg-muted/60">
                      {item.product_image_url ? (
                        <Image
                          alt={item.product_name}
                          className="object-cover"
                          fill
                          src={item.product_image_url}
                          sizes="110px"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                          No image
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium">{item.product_name}</p>
                      {item.variant_title || item.variant_summary ? (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {item.variant_title}
                          {item.variant_summary ? ` • ${item.variant_summary}` : ''}
                        </p>
                      ) : null}
                      <p className="mt-2 text-sm text-muted-foreground">
                        Qty {item.quantity}
                        {item.sku ? ` • ${item.sku}` : ''}
                      </p>
                    </div>
                    <div className="text-left md:text-right">
                      <p className="font-medium">{formatCurrency(item.line_total_cents)}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(item.unit_price_cents)} each
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </div>

          <aside className="space-y-5 xl:sticky xl:top-24">
            <section className="glass-panel space-y-4 p-6">
              <h2 className="font-display text-4xl">Summary</h2>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(order.subtotal_cents)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>{formatCurrency(order.shipping_cents)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span>{formatCurrency(order.tax_cents)}</span>
                </div>
                <div className="flex items-center justify-between border-t border-border pt-3 font-medium">
                  <span>Total</span>
                  <span>{formatCurrency(order.total_cents)}</span>
                </div>
              </div>
            </section>

            <section className="glass-panel space-y-4 p-6">
              <h2 className="font-display text-4xl">Shipping</h2>
              <div className="grid gap-4">
                <DetailRow label="Recipient" value={order.shipping_name} />
                <DetailRow
                  label="Address"
                  value={[
                    order.shipping_address1,
                    order.shipping_address2,
                    `${order.shipping_city}, ${order.shipping_region} ${order.shipping_postal_code}`,
                    order.shipping_country_code,
                  ]
                    .filter(Boolean)
                    .join(', ')}
                />
                <DetailRow label="Email" value={order.email} />
                {order.shipping_phone ? (
                  <DetailRow label="Phone" value={order.shipping_phone} />
                ) : null}
                {order.notes ? (
                  <DetailRow label="Note" value={order.notes} />
                ) : null}
              </div>
            </section>
          </aside>
        </section>
      </main>
    </div>
  );
}
