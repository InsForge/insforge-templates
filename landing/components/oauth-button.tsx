'use client';

import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { getOAuthUrl } from '@/lib/auth-actions';

export function OAuthButton({
  provider,
  label,
}: {
  provider: 'google' | 'github';
  label: string;
}) {
  const [loading, setLoading] = useState(false);

  async function handle() {
    setLoading(true);
    try {
      const result = await getOAuthUrl(provider);
      if ('error' in result) {
        toast.error(result.error);
        setLoading(false);
        return;
      }
      window.location.href = result.url;
    } catch {
      toast.error('Could not start sign in. Please try again.');
      setLoading(false);
    }
  }

  return (
    <Button type="button" variant="outline" className="w-full" onClick={handle} disabled={loading}>
      {loading ? <Loader2 className="size-4 animate-spin" /> : label}
    </Button>
  );
}
