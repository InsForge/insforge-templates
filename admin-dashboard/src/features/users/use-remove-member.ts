import { useMutation, useQueryClient } from '@tanstack/react-query'
import { insforge } from '@/lib/insforge'

/**
 * Remove a member from a workspace. If the user being removed is the current
 * user, this is effectively "leave workspace". RLS forbids removing the owner.
 */
export function useRemoveMember(workspaceId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { userId: string }) => {
      if (!workspaceId) throw new Error('No active workspace')
      const { error } = await insforge.database
        .from('workspace_members')
        .delete()
        .eq('workspace_id', workspaceId)
        .eq('user_id', input.userId)
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['workspace-members', workspaceId] })
      void qc.invalidateQueries({ queryKey: ['workspaces'] })
    },
  })
}
