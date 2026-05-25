import { insforge } from '@/lib/insforge'

/**
 * Idempotent post-sign-in bootstrap: if the user has no workspace, create a
 * personal one and add them as owner. Safe to call multiple times.
 */
export async function ensureWorkspace(userId: string, email: string): Promise<string> {
  const { data: memberships, error: readErr } = await insforge.database
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', userId)
    .limit(1)
  if (readErr) throw new Error(readErr.message)
  if (memberships && memberships.length > 0) {
    return (memberships[0] as { workspace_id: string }).workspace_id
  }

  const username = email.split('@')[0]?.toLowerCase().replace(/[^a-z0-9-]/g, '') || 'user'
  const slug = `${username}-${Math.random().toString(36).slice(2, 7)}`

  const { data: ws, error: wsErr } = await insforge.database
    .from('workspaces')
    .insert([{ slug, name: `${username}'s workspace`, owner_id: userId }])
    .select()
    .single()
  if (wsErr || !ws) throw new Error(wsErr?.message ?? 'Failed to create workspace')

  const workspace = ws as { id: string }

  const { error: memErr } = await insforge.database
    .from('workspace_members')
    .insert([{ workspace_id: workspace.id, user_id: userId, role: 'owner' }])
  if (memErr) throw new Error(memErr.message)

  return workspace.id
}
