import { getAccessToken } from '@/lib/auth-cookies';
import { getProjects } from '@/lib/queries';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus } from 'lucide-react';
import Link from 'next/link';

export default async function ProjectsPage() {
  const token = await getAccessToken();
  const { projects, count } = await getProjects(token);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Projects</h1>
          <p className="text-sm text-muted-foreground">{count} total projects</p>
        </div>
        <Link href="/projects/add">
          <Button><Plus className="mr-2 h-4 w-4" />New Project</Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-0">
          {projects.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No projects yet. Create your first project to get started.
            </div>
          ) : (
            <div className="divide-y">
              {projects.map((project: Record<string, unknown>) => (
                <div key={project.id as string} className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-medium">{project.name as string}</p>
                    <p className="text-sm text-muted-foreground">
                      {project.code as string}
                      {(project.client as Record<string, string>)?.name && (
                        <> &middot; {(project.client as Record<string, string>).name}</>
                      )}
                    </p>
                  </div>
                  <Badge variant={(project.deal_status as string) === 'active' ? 'default' : 'secondary'}>
                    {project.deal_status as string}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
