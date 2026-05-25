import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { insforge } from '@/lib/insforge'
import { useAuth } from '@/lib/auth-context'
import { appsKey } from './use-apps'

type ToggleArgs = {
  slug: string
  connected: boolean
}

export function useToggleApp(workspaceId: string | undefined) {
  const qc = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async ({ slug, connected }: ToggleArgs): Promise<void> => {
      if (!workspaceId) throw new Error('No active workspace')
      if (!user) throw new Error('Not signed in')

      const { error } = await insforge.database
        .from('app_connections')
        .upsert(
          {
            workspace_id: workspaceId,
            app_slug: slug,
            status: connected ? 'connected' : 'disconnected',
            connected_by: user.id,
            connected_at: new Date().toISOString(),
          },
          { onConflict: 'workspace_id,app_slug' },
        )
      if (error) throw new Error(error.message)
    },
    onSuccess: (_data, vars) => {
      toast.success(vars.connected ? 'App connected' : 'App disconnected')
      void qc.invalidateQueries({ queryKey: appsKey(workspaceId) })
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to update connection')
    },
  })
}
