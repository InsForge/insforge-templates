import { formatDistanceToNow } from 'date-fns'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { Plus } from 'lucide-react'
import type { ConversationListItem } from './use-conversations'

type Props = {
  conversations: ConversationListItem[]
  isLoading: boolean
  activeId: string | null
  onSelect: (id: string) => void
  onNew: () => void
}

export function ConversationList({ conversations, isLoading, activeId, onSelect, onNew }: Props) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h3 className="text-sm font-semibold">Conversations</h3>
        <Button size="sm" variant="ghost" onClick={onNew} aria-label="New conversation">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="space-y-2 p-3">
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">No conversations yet.</p>
        ) : (
          <ul className="py-1">
            {conversations.map((c) => {
              const ts = c.last_message_at ?? c.created_at
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(c.id)}
                    className={cn(
                      'flex w-full flex-col items-start gap-1 px-4 py-3 text-left text-sm transition-colors hover:bg-accent',
                      activeId === c.id && 'bg-accent',
                    )}
                  >
                    <div className="flex w-full items-center justify-between gap-2">
                      <span className="truncate font-medium">{c.name}</span>
                      <span className="shrink-0 text-[10px] uppercase text-muted-foreground">
                        {formatDistanceToNow(new Date(ts), { addSuffix: false })}
                      </span>
                    </div>
                    <span className="line-clamp-1 text-xs text-muted-foreground">
                      {c.last_message_body ?? 'No messages yet'}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </ScrollArea>
    </div>
  )
}
