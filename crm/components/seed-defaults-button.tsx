'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Loader2, DatabaseZap } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

export function SeedDefaultsButton() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  async function handleSeed() {
    setIsPending(true);

    try {
      const response = await fetch('/api/seed', { method: 'POST' });

      if (!response.ok) {
        throw new Error('Failed to seed CRM defaults.');
      }

      toast.success('CRM defaults added. Refreshing dashboard...');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to seed CRM defaults.');
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Button type="button" variant="outline" onClick={handleSeed} disabled={isPending}>
      {isPending ? <Loader2 className="animate-spin" /> : <DatabaseZap />}
      Seed CRM defaults
    </Button>
  );
}
