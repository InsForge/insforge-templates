import Link from 'next/link';
import { ArrowRight, Code2, Database, WandSparkles } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SeedDefaultsButton } from '@/components/seed-defaults-button';

type GettingStartedProps = {
  hasLeads: boolean;
  hasClients: boolean;
};

const sqlSnippet = `insert into public.lead_stages (name, order_index, user_id)
values ('Qualified', 2, auth.uid());`;

const querySnippet = `const { leads } = await getLeads(token, 1, 25)
const qualified = leads.filter((lead) => lead.status === 'qualified')`;

export function GettingStarted({ hasLeads, hasClients }: GettingStartedProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Customize this CRM starter</h2>
          <p className="text-sm text-muted-foreground">
            Treat the current schema, routes, and sample copy as a starting point for your own CRM.
          </p>
        </div>
        <Badge variant="outline">Developer guide</Badge>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 text-primary">
              <WandSparkles className="h-4 w-4" />
              <CardTitle className="text-base">First run</CardTitle>
            </div>
            <CardDescription>
              Get the default sources and pipeline stages into your project, then add your first lead.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              {hasLeads || hasClients
                ? 'You already have CRM data in place. Use the links below to inspect the starter flows and adapt them to your own process.'
                : 'New project? Seed the default CRM records first so the dashboard, pipeline, and forms have realistic starter data.'}
            </p>
            <div className="flex flex-wrap gap-2">
              <SeedDefaultsButton />
              <Link href="/leads/add" className="inline-flex items-center gap-1 text-foreground hover:underline">
                Create a lead <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 text-primary">
              <Database className="h-4 w-4" />
              <CardTitle className="text-base">Where to customize</CardTitle>
            </div>
            <CardDescription>
              The starter is organized so the most common CRM edits live in predictable files.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <ul className="space-y-2">
              <li><code>migrations/db_init.sql</code>: tables, RLS policies, trigger functions, and seed RPC.</li>
              <li><code>lib/queries.ts</code>: server-side data access for leads, clients, pipeline, and projects.</li>
              <li><code>app/(dashboard)</code>: route structure for dashboard pages and CRUD flows.</li>
              <li><code>components/leads</code>: pipeline board, lead detail, and create/edit form UI.</li>
            </ul>
            <p>
              Common first edits: add custom lead fields, rename stages, swap seeded sources, or add a
              team-specific dashboard metric.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 text-primary">
              <Code2 className="h-4 w-4" />
              <CardTitle className="text-base">Starter snippets</CardTitle>
            </div>
            <CardDescription>
              Use these as a reference when extending the CRM instead of reverse-engineering the app from scratch.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="rounded-lg border bg-muted/40 p-3">
              <p className="mb-2 font-medium text-foreground">Add a pipeline stage</p>
              <pre className="overflow-x-auto text-xs leading-5 text-foreground/90">{sqlSnippet}</pre>
            </div>
            <div className="rounded-lg border bg-muted/40 p-3">
              <p className="mb-2 font-medium text-foreground">Query leads in a server component</p>
              <pre className="overflow-x-auto text-xs leading-5 text-foreground/90">{querySnippet}</pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
