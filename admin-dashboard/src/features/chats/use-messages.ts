import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { insforge } from '@/lib/insforge'

export type Message = {
  id: string
  conversation_id: string
  sender_id: string
  body: string
  created_at: string
}

export const messagesKey = (conversationId: string | undefined) =>
  ['messages', conversationId] as const

type RealtimePayload = {
  id?: unknown
  conversation_id?: unknown
  sender_id?: unknown
  body?: unknown
  created_at?: unknown
  meta?: { channel?: string }
}

function isMessage(payload: RealtimePayload): payload is RealtimePayload & Message {
  return (
    typeof payload.id === 'string' &&
    typeof payload.conversation_id === 'string' &&
    typeof payload.sender_id === 'string' &&
    typeof payload.body === 'string' &&
    typeof payload.created_at === 'string'
  )
}

export function useMessages(conversationId: string | undefined) {
  const qc = useQueryClient()

  const query = useQuery({
    enabled: !!conversationId,
    queryKey: messagesKey(conversationId),
    queryFn: async (): Promise<Message[]> => {
      const { data, error } = await insforge.database
        .from('messages')
        .select('id, conversation_id, sender_id, body, created_at')
        .eq('conversation_id', conversationId!)
        .order('created_at', { ascending: true })
        .limit(500)
      if (error) throw new Error(error.message)
      return (data ?? []) as Message[]
    },
  })

  useEffect(() => {
    if (!conversationId) return
    const channel = `chat:${conversationId}`
    let cancelled = false

    const onMessage = (payload: RealtimePayload) => {
      if (payload.meta?.channel !== channel) return
      if (!isMessage(payload)) return
      const msg: Message = {
        id: payload.id,
        conversation_id: payload.conversation_id,
        sender_id: payload.sender_id,
        body: payload.body,
        created_at: payload.created_at,
      }
      qc.setQueryData<Message[]>(messagesKey(conversationId), (old = []) => {
        if (old.some((m) => m.id === msg.id)) return old
        return [...old, msg]
      })
    }

    void (async () => {
      try {
        await insforge.realtime.connect()
        if (cancelled) return
        const res = await insforge.realtime.subscribe(channel)
        if (cancelled) {
          insforge.realtime.unsubscribe(channel)
          return
        }
        if (!res.ok) {
          toast.error(`Realtime: ${res.error.message}`)
          return
        }
        insforge.realtime.on('new_message', onMessage)
      } catch (err) {
        if (!cancelled) {
          toast.error(err instanceof Error ? err.message : 'Realtime connection failed')
        }
      }
    })()

    return () => {
      cancelled = true
      insforge.realtime.off('new_message', onMessage)
      insforge.realtime.unsubscribe(channel)
    }
  }, [conversationId, qc])

  return query
}
