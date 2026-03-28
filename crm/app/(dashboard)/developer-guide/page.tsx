import { GettingStarted } from '@/components/getting-started';
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
    </div>
  );
}
