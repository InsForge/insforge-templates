import { notFound, redirect } from 'next/navigation';
import { Sidebar } from '@/components/sidebar/Sidebar';
import { getCurrentUser } from '@/lib/workspace-actions';
import { createInsforgeServerClient } from '@/lib/insforge';
import { getAccessToken } from '@/lib/auth-cookies';

async function authedClient() {
  const accessToken = await getAccessToken();
  return createInsforgeServerClient({ accessToken: accessToken ?? undefined });
}

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect('/auth/sign-in');

  const client = await authedClient();
  const { data: ws } = await client.database
    .from('workspaces')
    .select('id, name')
    .eq('id', workspaceId)
    .single();

  if (!ws) notFound();

  const { data: pages } = await client.database
    .from('pages')
    .select('id, parent_id, title, icon, position')
    .eq('workspace_id', workspaceId)
    .order('position', { ascending: true });

  const { data: memberships } = await client.database
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', user.id);

  const workspaceIds = (memberships ?? []).map((m: { workspace_id: string }) => m.workspace_id);

  const { data: workspacesData } = workspaceIds.length > 0
    ? await client.database
        .from('workspaces')
        .select('id, name')
        .in('id', workspaceIds)
    : { data: [] };

  return (
    <div className="flex h-dvh bg-background">
      <Sidebar
        currentWorkspace={ws as { id: string; name: string }}
        workspaces={(workspacesData ?? []) as { id: string; name: string }[]}
        pages={pages ?? []}
        currentUser={{ id: user.id, email: user.email ?? '', name: (user as any).name ?? user.email ?? '' }}
      />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
