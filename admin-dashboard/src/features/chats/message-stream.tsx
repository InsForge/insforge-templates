import { useEffect, useRef } from 'react'
import { format, isSameDay } from 'date-fns'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { Message } from './use-messages'

type Props = {
  messages: Message[]
  isLoading: boolean
  currentUserId: string | undefined
}

export function MessageStream({ messages, isLoading, currentUserId }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' })
  }, [messages.length])

  if (isLoading) {
    return (
      <div className="flex-1 space-y-3 p-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className={cn('h-10 w-2/3', i % 2 === 1 && 'ml-auto')} />
        ))}
      </div>
    )
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <p className="text-sm text-muted-foreground">No messages yet. Say hi.</p>
      </div>
    )
  }

  return (
    <ScrollArea className="flex-1">
      <div className="space-y-1 p-4">
        {messages.map((m, idx) => {
          const prev = messages[idx - 1]
          const isMine = m.sender_id === currentUserId
          const showHeader = !prev || prev.sender_id !== m.sender_id
          const showDay =
            !prev || !isSameDay(new Date(prev.created_at), new Date(m.created_at))
          return (
            <div key={m.id}>
              {showDay && (
                <div className="my-3 flex items-center justify-center">
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                    {format(new Date(m.created_at), 'PP')}
                  </span>
                </div>
              )}
              <div className={cn('flex flex-col', isMine ? 'items-end' : 'items-start')}>
                {showHeader && (
                  <span className="mb-0.5 px-1 text-[10px] text-muted-foreground">
                    {isMine ? 'You' : truncateId(m.sender_id)} ·{' '}
                    {format(new Date(m.created_at), 'p')}
                  </span>
                )}
                <div
                  className={cn(
                    'max-w-[75%] rounded-2xl px-3 py-2 text-sm shadow-sm',
                    isMine
                      ? 'rounded-br-sm bg-primary text-primary-foreground'
                      : 'rounded-bl-sm bg-muted text-foreground',
                  )}
                >
                  <p className="whitespace-pre-wrap break-words">{m.body}</p>
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  )
}

function truncateId(id: string) {
  return id.slice(0, 8)
}
