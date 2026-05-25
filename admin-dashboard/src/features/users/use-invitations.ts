import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { insforge } from '@/lib/insforge'

export type InvitationRole = 'admin' | 'member'

export type Invitation = {
  id: string
  workspace_id: string
  email: string
  role: InvitationRole
  token: string
  expires_at: string
  accepted_at: string | null
  created_by: string
  created_at: string
}

export function useInvitations(workspaceId: string | undefined) {
  return useQuery({
    enabled: !!workspaceId,
    queryKey: ['workspace-invitations', workspaceId],
    queryFn: async (): Promise<Invitation[]> => {
      const { data, error } = await insforge.database
        .from('workspace_invitations')
        .select('id, workspace_id, email, role, token, expires_at, accepted_at, created_by, created_at')
        .eq('workspace_id', workspaceId!)
        .is('accepted_at', null)
        .order('created_at', { ascending: false })
      if (error) throw new Error(error.message)
      const now = Date.now()
      return ((data ?? []) as Invitation[]).filter(
        (inv) => new Date(inv.expires_at).getTime() > now,
      )
    },
  })
}

export function useInviteMember(workspaceId: string | undefined, userId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { email: string; role: InvitationRole }): Promise<Invitation> => {
      if (!workspaceId) throw new Error('No active workspace')
      if (!userId) throw new Error('Not signed in')
      const token =
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`
      const { data, error } = await insforge.database
        .from('workspace_invitations')
        .insert([
          {
            workspace_id: workspaceId,
            email: input.email.trim().toLowerCase(),
            role: input.role,
            token,
            created_by: userId,
          },
        ])
        .select()
        .single()
      if (error || !data) throw new Error(error?.message ?? 'Failed to create invitation')
      return data as Invitation
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['workspace-invitations', workspaceId] })
    },
  })
}

export function useDeleteInvitation(workspaceId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (invitationId: string) => {
      const { error } = await insforge.database
        .from('workspace_invitations')
        .delete()
        .eq('id', invitationId)
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['workspace-invitations', workspaceId] })
    },
  })
}
