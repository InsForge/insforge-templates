import { getAccessToken } from '@/lib/auth-cookies';
import { getLeads, getClients, getLeadStages } from '@/lib/queries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, Users, KanbanSquare } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function CRMOverviewPage() {
  const token = await getAccessToken();

  const [leadsResult, clientsResult, stages] = await Promise.all([
    getLeads(token, 1, 5),
    getClients(token),
    getLeadStages(token),
  ]);

  const stats = [
    { label: 'Total Leads', value: leadsResult.count, icon: Target, href: '/leads' },
    { label: 'Clients', value: clientsResult.count, icon: Users, href: '/clients' },
    { label: 'Pipeline Stages', value: stages.length, icon: KanbanSquare, href: '/leads/pipeline' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Link href="/leads/add">
          <Button>New Lead</Button>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className="transition-shadow hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Leads</CardTitle>
        </CardHeader>
        <CardContent>
          {leadsResult.leads.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No leads yet. <Link href="/leads/add" className="underline">Create your first lead</Link>.
            </p>
          ) : (
            <div className="space-y-3">
              {leadsResult.leads.map((lead: Record<string, unknown>) => (
                <Link
                  key={lead.id as string}
                  href={`/leads/${lead.id}`}
                  className="flex items-center justify-between rounded-md border p-3 transition-colors hover:bg-accent"
                >
                  <div>
                    <p className="font-medium">{lead.contact_name as string}</p>
                    <p className="text-sm text-muted-foreground">{lead.company_name as string}</p>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    {(lead.current_stage as Record<string, string>)?.name ?? lead.status as string}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
