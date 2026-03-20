import { AccountHeader } from '@/components/account-header';
import { AddressBook } from '@/components/address-book';
import { SiteHeader } from '@/components/site-header';
import { requireAuthenticatedSession } from '@/lib/auth-session';
import { getSavedAddresses } from '@/lib/store';
import { getInitials } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const { viewer, accessToken } = await requireAuthenticatedSession();

  const label = viewer.name?.trim() || viewer.email?.trim() || 'Account';
  const initials = getInitials(label);
  const addresses = await getSavedAddresses(viewer.id, accessToken);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="page-shell space-y-8 py-10">
        <AccountHeader
          activeTab="profile"
          description="Keep your customer profile tidy and manage the saved addresses that appear during checkout."
          title="Profile."
        />

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="glass-panel grid gap-6 p-6 sm:grid-cols-[auto_1fr] sm:items-center">
            <div className="flex size-24 items-center justify-center overflow-hidden rounded-full bg-secondary text-2xl font-medium text-secondary-foreground">
              {viewer.avatarUrl ? (
                <img
                  alt={label}
                  className="h-full w-full object-cover"
                  height={96}
                  referrerPolicy="no-referrer"
                  src={viewer.avatarUrl}
                  width={96}
                />
              ) : (
                initials
              )}
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Name</p>
                <p className="mt-2 text-lg text-foreground">{viewer.name || 'Not set yet'}</p>
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Email</p>
                <p className="mt-2 text-lg text-foreground break-all">{viewer.email}</p>
              </div>
            </div>
          </div>

          <div className="glass-panel space-y-4 p-6">
            <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Address book</p>
            <h2 className="font-display text-4xl">{addresses.length} saved {addresses.length === 1 ? 'address' : 'addresses'}</h2>
            <p className="text-sm text-muted-foreground">
              Set shipping and billing defaults here so checkout starts with the right destination.
            </p>
          </div>
        </section>

        <AddressBook addresses={addresses} />
      </main>
    </div>
  );
}
