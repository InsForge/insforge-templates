import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { insforge } from '@/lib/insforge'
import { useAuth } from '@/lib/auth-context'
import { messagesKey, type Message } from './use-messages'

export function useSendMessage(conversationId: string | undefined) {
  const qc = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (body: string): Promise<Message> => {
      if (!conversationId) throw new Error('No conversation selected')
      if (!user) throw new Error('Not signed in')
      const trimmed = body.trim()
      if (!trimmed) throw new Error('Message cannot be empty')

      const { data, error } = await insforge.database
        .from('messages')
        .insert([
          {
            conversation_id: conversationId,
            sender_id: user.id,
            body: trimmed,
          },
        ])
        .select('id, conversation_id, sender_id, body, created_at')
        .single()
      if (error) throw new Error(error.message)
      return data as Message
    },
    onSuccess: (msg) => {
      // Optimistically merge so the sender sees their message immediately,
      // even if the realtime echo hasn't arrived yet.
      qc.setQueryData<Message[]>(messagesKey(conversationId), (old = []) => {
        if (old.some((m) => m.id === msg.id)) return old
        return [...old, msg]
      })
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to send message')
    },
  })
}
