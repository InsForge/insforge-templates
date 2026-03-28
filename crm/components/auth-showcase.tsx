import { Database, ShieldCheck, Workflow } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function AuthShowcase({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h1 className="max-w-2xl text-3xl font-semibold tracking-tight text-balance lg:text-4xl">
          {title}
        </h1>
        <p className="max-w-2xl text-sm leading-7 text-muted-foreground lg:text-base">
          {description}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-none">
          <CardHeader className="pb-3">
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
              <Workflow className="h-5 w-5" />
            </div>
            <CardTitle className="text-base">Next.js and React</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Build on a polished app shell with protected routes and responsive UI patterns.
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader className="pb-3">
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
              <Database className="h-5 w-5" />
            </div>
            <CardTitle className="text-base">InsForge auth and database</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Authentication, database access, storage, and server-side queries are already wired in.
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader className="pb-3">
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <CardTitle className="text-base">Security and workflows</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Built-in access patterns and CRM workflows help you move faster from day one.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
