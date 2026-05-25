import { useQuery } from '@tanstack/react-query'
import { insforge } from '@/lib/insforge'

export type Conversation = {
  id: string
  workspace_id: string
  name: string
  type: 'dm' | 'group'
  created_by: string
  created_at: string
}

export type ConversationListItem = Conversation & {
  last_message_body: string | null
  last_message_at: string | null
}

export const conversationsKey = (workspaceId: string | undefined) =>
  ['conversations', workspaceId] as const

export function useConversations(workspaceId: string | undefined) {
  return useQuery({
    enabled: !!workspaceId,
    queryKey: conversationsKey(workspaceId),
    queryFn: async (): Promise<ConversationListItem[]> => {
      const { data, error } = await insforge.database
        .from('conversations')
        .select('id, workspace_id, name, type, created_by, created_at')
        .eq('workspace_id', workspaceId!)
        .order('created_at', { ascending: false })
      if (error) throw new Error(error.message)
      const conversations = (data ?? []) as Conversation[]

      // For each conversation, fetch the last message (best-effort).
      // Since RLS allows only members to read messages, non-member conversations
      // simply return no rows here.
      const withLast = await Promise.all(
        conversations.map(async (c): Promise<ConversationListItem> => {
          const { data: msgs } = await insforge.database
            .from('messages')
            .select('body, created_at')
            .eq('conversation_id', c.id)
            .order('created_at', { ascending: false })
            .limit(1)
          const last = (msgs ?? [])[0] as { body: string; created_at: string } | undefined
          return {
            ...c,
            last_message_body: last?.body ?? null,
            last_message_at: last?.created_at ?? null,
          }
        }),
      )

      // Sort by last activity (last message time falling back to created_at).
      withLast.sort((a, b) => {
        const at = a.last_message_at ?? a.created_at
        const bt = b.last_message_at ?? b.created_at
        return bt.localeCompare(at)
      })
      return withLast
    },
  })
}
