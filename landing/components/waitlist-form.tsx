'use client';

import { Loader2 } from 'lucide-react';
import { useActionState, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { submitWaitlist, type WaitlistState } from '@/app/actions/waitlist';

const initial: WaitlistState = { ok: false };

export function WaitlistForm({
  source = 'hero',
  placeholder = 'you@company.com',
  buttonLabel = 'Request access',
}: {
  source?: 'hero' | 'footer' | 'cta-section' | 'other';
  placeholder?: string;
  buttonLabel?: string;
}) {
  const [state, formAction, pending] = useActionState(submitWaitlist, initial);

  useEffect(() => {
    if (state.ok && state.message) toast.success(state.message);
    if (!state.ok && state.error) toast.error(state.error);
  }, [state]);

  return (
    <form action={formAction} className="flex w-full max-w-md flex-col gap-2 sm:flex-row">
      <input type="hidden" name="source" value={source} />
      <Input
        name="email"
        type="email"
        required
        placeholder={placeholder}
        autoComplete="email"
        className="flex-1"
      />
      <Button type="submit" disabled={pending}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : buttonLabel}
      </Button>
    </form>
  );
}
