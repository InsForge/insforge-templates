import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import { SiteHeader } from '@/components/site-header';
import { getAccessToken } from '@/lib/auth-cookies';
import { createInsforgeServerClient } from '@/lib/insforge';
import { signOut } from '@/lib/auth-actions';

export const metadata: Metadata = { title: 'Dashboard' };

export default async function DashboardPage() {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    redirect('/sign-in');
  }

  const insforge = createInsforgeServerClient({ accessToken });
  const { data, error } = await insforge.auth.getCurrentUser();

  if (error || !data?.user) {
    redirect('/sign-in');
  }

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="mt-2 text-muted-foreground">
          Signed in as <span className="font-mono">{data.user.email}</span>.
        </p>
        <div className="mt-8 rounded-2xl border border-border bg-card p-6">
          <h2 className="text-lg font-medium">This is your dashboard placeholder.</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Replace this with your application UI. The Acme landing template ships this page only as a
            protected-route example.
          </p>
        </div>
        <form action={signOut} className="mt-6">
          <Button variant="outline" type="submit">Sign out</Button>
        </form>
      </main>
    </>
  );
}
