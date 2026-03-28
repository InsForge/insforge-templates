import { GettingStarted } from '@/components/getting-started';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getAccessToken } from '@/lib/auth-cookies';
import { getClients, getLeads } from '@/lib/queries';

export default async function DeveloperGuidePage() {
  const token = await getAccessToken();
  const [leadsResult, clientsResult] = await Promise.all([
    getLeads(token, 1, 1),
    getClients(token),
  ]);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Developer Guide</p>
        <h1 className="text-2xl font-bold">Start here before customizing the CRM</h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          This page is the default landing experience for the starter. Change
          <code> DEFAULT_LANDING_ROUTE </code>
          in <code>lib/constants.ts</code> if you want your team to land on the dashboard or any
          other route instead.
        </p>
      </div>

      <GettingStarted
        hasLeads={leadsResult.count > 0}
        hasClients={clientsResult.count > 0}
      />

      <Card>
        <CardHeader>
          <CardTitle>Suggested first edits</CardTitle>
          <CardDescription>
            If you are adapting this starter for your own CRM, these are usually the highest-leverage changes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>1. Replace the seeded lead stages and sources with your own sales process.</p>
          <p>2. Add or rename fields in <code>migrations/db_init.sql</code> and <code>lib/queries.ts</code>.</p>
          <p>3. Update the sidebar and dashboard metrics to reflect your team&apos;s workflow.</p>
          <p>4. Review RLS policies before introducing shared pipelines or multi-user collaboration.</p>
        </CardContent>
      </Card>
    </div>
  );
}
