import { useQuery } from '@tanstack/react-query'
import { insforge } from '@/lib/insforge'

export type MemberRole = 'owner' | 'admin' | 'member'

export type Member = {
  user_id: string
  role: MemberRole
  joined_at: string
  invited_by: string | null
  name: string | null
  avatar_url: string | null
}

type WorkspaceMemberRow = {
  user_id: string
  role: MemberRole
  joined_at: string
  invited_by: string | null
}

type ProfileRow = {
  user_id: string
  name: string | null
  avatar_url: string | null
}

export function useMembers(workspaceId: string | undefined) {
  return useQuery({
    enabled: !!workspaceId,
    queryKey: ['workspace-members', workspaceId],
    queryFn: async (): Promise<Member[]> => {
      const { data: memberRows, error: memErr } = await insforge.database
        .from('workspace_members')
        .select('user_id, role, joined_at, invited_by')
        .eq('workspace_id', workspaceId!)
      if (memErr) throw new Error(memErr.message)

      const members = (memberRows ?? []) as WorkspaceMemberRow[]
      const userIds = members.map((m) => m.user_id)
      if (userIds.length === 0) return []

      const { data: profileRows, error: profErr } = await insforge.database
        .from('profiles')
        .select('user_id, name, avatar_url')
        .in('user_id', userIds)
      if (profErr) throw new Error(profErr.message)

      const profileMap = new Map<string, ProfileRow>(
        ((profileRows ?? []) as ProfileRow[]).map((p) => [p.user_id, p]),
      )

      // Sort: owner first, then admin, then member; within group by joined_at asc
      const roleRank: Record<MemberRole, number> = { owner: 0, admin: 1, member: 2 }
      return members
        .map<Member>((m) => {
          const prof = profileMap.get(m.user_id)
          return {
            user_id: m.user_id,
            role: m.role,
            joined_at: m.joined_at,
            invited_by: m.invited_by,
            name: prof?.name ?? null,
            avatar_url: prof?.avatar_url ?? null,
          }
        })
        .sort((a, b) => {
          const r = roleRank[a.role] - roleRank[b.role]
          if (r !== 0) return r
          return new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime()
        })
    },
  })
}
