import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useAuth } from '@/lib/auth-context'
import { insforge } from '@/lib/insforge'
import { useActiveWorkspace } from '@/features/dashboard/use-active-workspace'
import { ConversationList } from './conversation-list'
import { Composer } from './composer'
import { MessageStream } from './message-stream'
import { NewConversationDialog } from './new-conversation-dialog'
import { useConversations } from './use-conversations'
import { useCreateConversation } from './use-create-conversation'
import { useMessages } from './use-messages'
import { useSendMessage } from './use-send-message'

export function ChatsPage() {
  const { user } = useAuth()
  const { workspace } = useActiveWorkspace()
  const { data: conversations = [], isLoading: convosLoading } = useConversations(workspace?.id)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const createConvo = useCreateConversation(workspace?.id)

  // Auto-select the most recent conversation when none is selected.
  useEffect(() => {
    if (!activeId && conversations.length > 0) {
      setActiveId(conversations[0]!.id)
    }
    if (activeId && !conversations.some((c) => c.id === activeId)) {
      setActiveId(conversations[0]?.id ?? null)
    }
  }, [activeId, conversations])

  // Disconnect realtime entirely when leaving the chats page.
  useEffect(() => {
    return () => {
      insforge.realtime.disconnect()
    }
  }, [])

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeId) ?? null,
    [conversations, activeId],
  )

  const { data: messages = [], isLoading: messagesLoading } = useMessages(activeId ?? undefined)
  const sendMessage = useSendMessage(activeId ?? undefined)

  const handleCreate = async (name: string) => {
    const result = await createConvo.mutateAsync({ name })
    setDialogOpen(false)
    setActiveId(result.id)
  }

  const handleSend = async (body: string) => {
    await sendMessage.mutateAsync(body)
  }

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col gap-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Chats</h2>
        <p className="text-sm text-muted-foreground">
          Realtime conversations in {workspace?.name ?? 'your workspace'}.
        </p>
      </div>

      <Card className="flex min-h-0 flex-1 overflow-hidden p-0">
        <div className="w-[280px] shrink-0 border-r">
          <ConversationList
            conversations={conversations}
            isLoading={convosLoading}
            activeId={activeId}
            onSelect={setActiveId}
            onNew={() => setDialogOpen(true)}
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          {activeConversation ? (
            <>
              <div className="border-b px-4 py-3">
                <h3 className="text-sm font-semibold">{activeConversation.name}</h3>
                <p className="text-xs text-muted-foreground capitalize">
                  {activeConversation.type === 'dm' ? 'Direct message' : 'Group'}
                </p>
              </div>
              <MessageStream
                messages={messages}
                isLoading={messagesLoading}
                currentUserId={user?.id}
              />
              <Composer disabled={!activeId} onSend={handleSend} />
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
              <p className="text-sm text-muted-foreground">No conversations yet. Start one.</p>
              <Button onClick={() => setDialogOpen(true)}>New conversation</Button>
            </div>
          )}
        </div>
      </Card>

      <NewConversationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        submitting={createConvo.isPending}
        onSubmit={handleCreate}
      />
    </div>
  )
}
