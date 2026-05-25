import { useState, type KeyboardEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Send } from 'lucide-react'

type Props = {
  disabled?: boolean
  onSend: (body: string) => Promise<void> | void
}

export function Composer({ disabled, onSend }: Props) {
  const [value, setValue] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const send = async () => {
    const trimmed = value.trim()
    if (!trimmed || submitting) return
    setSubmitting(true)
    try {
      await onSend(trimmed)
      setValue('')
    } finally {
      setSubmitting(false)
    }
  }

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void send()
    }
  }

  return (
    <div className="border-t bg-background p-3">
      <div className="flex items-end gap-2">
        <Textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Type a message…"
          rows={1}
          disabled={disabled}
          className="max-h-32 min-h-10 resize-none"
        />
        <Button
          type="button"
          size="icon"
          onClick={() => void send()}
          disabled={disabled || submitting || !value.trim()}
          aria-label="Send message"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
