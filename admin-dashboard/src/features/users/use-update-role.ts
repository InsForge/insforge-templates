import { useMutation, useQueryClient } from '@tanstack/react-query'
import { insforge } from '@/lib/insforge'
import type { MemberRole } from './use-members'

export function useUpdateRole(workspaceId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { userId: string; role: MemberRole }) => {
      if (!workspaceId) throw new Error('No active workspace')
      const { error } = await insforge.database
        .from('workspace_members')
        .update({ role: input.role })
        .eq('workspace_id', workspaceId)
        .eq('user_id', input.userId)
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['workspace-members', workspaceId] })
    },
  })
}
