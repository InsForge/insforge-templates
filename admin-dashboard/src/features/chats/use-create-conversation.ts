import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { insforge } from '@/lib/insforge'
import { useAuth } from '@/lib/auth-context'
import { conversationsKey, type Conversation } from './use-conversations'

type CreateArgs = {
  name: string
}

export function useCreateConversation(workspaceId: string | undefined) {
  const qc = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async ({ name }: CreateArgs): Promise<Conversation> => {
      if (!workspaceId) throw new Error('No active workspace')
      if (!user) throw new Error('Not signed in')
      const trimmed = name.trim()
      if (!trimmed) throw new Error('Name is required')

      const { data: convo, error: convoErr } = await insforge.database
        .from('conversations')
        .insert([
          {
            workspace_id: workspaceId,
            name: trimmed,
            type: 'group',
            created_by: user.id,
          },
        ])
        .select('id, workspace_id, name, type, created_by, created_at')
        .single()
      if (convoErr) throw new Error(convoErr.message)

      const created = convo as Conversation

      const { error: memberErr } = await insforge.database
        .from('conversation_members')
        .insert([{ conversation_id: created.id, user_id: user.id }])
      if (memberErr) throw new Error(memberErr.message)

      return created
    },
    onSuccess: () => {
      toast.success('Conversation created')
      void qc.invalidateQueries({ queryKey: conversationsKey(workspaceId) })
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to create conversation')
    },
  })
}
