import { redirect } from 'next/navigation';
import { createInsforgeServerClient } from '@/lib/insforge';
import { getAccessToken } from '@/lib/auth-cookies';
import { ProfileSection } from '@/components/settings/ProfileSection';
import { MembersSection } from '@/components/settings/MembersSection';
import { InvitesSection } from '@/components/settings/InvitesSection';
import { DangerZoneSection } from '@/components/settings/DangerZoneSection';
import {
  getCurrentUser,
  getOrCreateDefaultWorkspace,
  listWorkspaceMembers,
  listOpenInvites,
} from '@/lib/workspace-actions';

async function authedClient() {
  const accessToken = await getAccessToken();
  return createInsforgeServerClient({ accessToken: accessToken ?? undefined });
}

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/auth/sign-in');

  const workspaceId = await getOrCreateDefaultWorkspace();
  if (!workspaceId) redirect('/auth/sign-in');

  const client = await authedClient();
  const { data: ws } = await client.database
    .from('workspaces')
    .select('id, name, owner_id')
    .eq('id', workspaceId)
    .single();

  if (!ws) redirect('/');

  const [members, invites] = await Promise.all([
    listWorkspaceMembers(workspaceId),
    listOpenInvites(workspaceId),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-6 py-12">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <ProfileSection
        user={{ email: user.email ?? '', name: (user as any).name ?? user.email ?? '' }}
      />
      <MembersSection
        workspaceId={workspaceId}
        ownerId={(ws as any).owner_id}
        currentUserId={user.id}
        members={members as any}
      />
      <InvitesSection invites={invites as any} />
      <DangerZoneSection workspaceId={workspaceId} isOwner={(ws as any).owner_id === user.id} />
    </div>
  );
}
