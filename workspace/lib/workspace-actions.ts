'use server';

import { revalidatePath } from 'next/cache';
import { customAlphabet } from 'nanoid';
import { getAccessToken } from '@/lib/auth-cookies';
import { createInsforgeServerClient } from '@/lib/insforge';

const nanoidToken = customAlphabet('ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789', 24);

async function authedClient() {
  const accessToken = await getAccessToken();
  return createInsforgeServerClient(accessToken ? { accessToken } : undefined);
}

export async function getCurrentUser() {
  const client = await authedClient();
  const { data, error } = await client.auth.getCurrentUser();
  if (error || !data?.user) return null;
  return data.user;
}

export async function getOrCreateDefaultWorkspace(): Promise<string | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const client = await authedClient();

  const { data: memberships } = await client.database
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', user.id)
    .limit(1);

  if (memberships && memberships.length > 0) {
    return memberships[0].workspace_id;
  }

  const { data: ws, error: wsErr } = await client.database
    .from('workspaces')
    .insert({ name: `${user.email?.split('@')[0] ?? 'My'}'s Workspace`, owner_id: user.id })
    .select()
    .single();

  if (wsErr || !ws) return null;

  await client.database
    .from('workspace_members')
    .insert({ workspace_id: ws.id, user_id: user.id, role: 'owner' });

  return ws.id;
}

export async function createPage(workspaceId: string, parentId: string | null) {
  const user = await getCurrentUser();
  if (!user) throw new Error('not authenticated');
  const client = await authedClient();

  let siblingQuery = client.database
    .from('pages')
    .select('position')
    .eq('workspace_id', workspaceId);
  siblingQuery = parentId === null
    ? siblingQuery.is('parent_id', null)
    : siblingQuery.eq('parent_id', parentId);
  const { data: siblings } = await siblingQuery
    .order('position', { ascending: false })
    .limit(1);

  const nextPos = siblings && siblings.length > 0 ? siblings[0].position + 1 : 0;

  const { data: page, error } = await client.database
    .from('pages')
    .insert({
      workspace_id: workspaceId,
      parent_id: parentId,
      title: 'Untitled',
      content: [],
      position: nextPos,
      created_by: user.id,
    })
    .select()
    .single();

  if (error || !page) throw new Error(error?.message ?? 'failed to create page');
  revalidatePath(`/w/${workspaceId}`);
  return page.id as string;
}

export async function updatePage(
  pageId: string,
  patch: { title?: string; icon?: string | null; content?: unknown },
  expectedUpdatedAt?: string,
) {
  const client = await authedClient();
  let query = client.database.from('pages').update(patch).eq('id', pageId);
  if (expectedUpdatedAt) {
    query = query.eq('updated_at', expectedUpdatedAt);
  }
  const { data, error } = await query.select().single();
  if (error) {
    return { ok: false as const, error: error.message };
  }
  if (!data) {
    return { ok: false as const, error: 'conflict' };
  }
  return { ok: true as const, page: data };
}

export async function deletePage(pageId: string, workspaceId: string) {
  const client = await authedClient();
  const { error } = await client.database.from('pages').delete().eq('id', pageId);
  if (error) throw new Error(error.message);
  revalidatePath(`/w/${workspaceId}`);
}

export async function reparentPage(
  pageId: string,
  newParentId: string | null,
  newPosition: number,
  workspaceId: string,
) {
  const client = await authedClient();
  const { error } = await client.database
    .from('pages')
    .update({ parent_id: newParentId, position: newPosition })
    .eq('id', pageId);
  if (error) throw new Error(error.message);
  revalidatePath(`/w/${workspaceId}`);
}

export async function createShareLink(pageId: string) {
  const client = await authedClient();
  const token = nanoidToken();
  const { data, error } = await client.database
    .from('page_shares')
    .upsert({ page_id: pageId, share_token: token })
    .select()
    .single();
  if (error || !data) throw new Error(error?.message ?? 'failed to create share');
  return data.share_token as string;
}

export async function revokeShareLink(pageId: string) {
  const client = await authedClient();
  await client.database.from('page_shares').delete().eq('page_id', pageId);
}

export async function createInvite(workspaceId: string, role: 'editor' | 'viewer') {
  const user = await getCurrentUser();
  if (!user) throw new Error('not authenticated');
  const client = await authedClient();
  const token = nanoidToken();
  const { data, error } = await client.database
    .from('workspace_invites')
    .insert({ workspace_id: workspaceId, token, role, created_by: user.id })
    .select()
    .single();
  if (error || !data) throw new Error(error?.message ?? 'failed to create invite');
  return data.token as string;
}

export async function acceptInvite(token: string): Promise<string> {
  const client = await authedClient();
  const { data, error } = await client.database.rpc('accept_workspace_invite', { p_token: token });
  if (error) throw new Error(error.message ?? 'invite invalid');
  return data as unknown as string;
}

export async function listWorkspaceMembers(workspaceId: string) {
  const client = await authedClient();
  const { data, error } = await client.database
    .from('workspace_members')
    .select('user_id, role, created_at')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function listOpenInvites(workspaceId: string) {
  const client = await authedClient();
  const { data, error } = await client.database
    .from('workspace_invites')
    .select('id, token, role, created_at, expires_at, used_at')
    .eq('workspace_id', workspaceId)
    .is('used_at', null)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function revokeInvite(inviteId: string) {
  const client = await authedClient();
  const { error } = await client.database.from('workspace_invites').delete().eq('id', inviteId);
  if (error) throw new Error(error.message);
}

export async function removeMember(workspaceId: string, userId: string) {
  const client = await authedClient();
  const { error } = await client.database
    .from('workspace_members')
    .delete()
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId);
  if (error) throw new Error(error.message);
}

export async function leaveWorkspace(workspaceId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('not authenticated');
  await removeMember(workspaceId, user.id);
}

export async function deleteWorkspace(workspaceId: string) {
  const client = await authedClient();
  const { error } = await client.database.from('workspaces').delete().eq('id', workspaceId);
  if (error) throw new Error(error.message);
}
