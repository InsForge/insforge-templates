'use client';

import { useState, type FormEvent } from 'react';
import { SendHorizonal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export function ChatInput({
  disabled,
  onSubmit,
}: {
  disabled: boolean;
  onSubmit: (input: string) => void;
}) {
  const [value, setValue] = useState('');

  function handle(e: FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSubmit(trimmed);
    setValue('');
  }

  return (
    <form onSubmit={handle} className="flex items-end gap-2 border-t border-border bg-card/40 p-4">
      <Textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Ask a question about your documents…"
        rows={1}
        className="resize-none"
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handle(e as unknown as FormEvent);
          }
        }}
      />
      <Button type="submit" disabled={disabled || value.trim() === ''}>
        <SendHorizonal className="size-4" />
      </Button>
    </form>
  );
}
