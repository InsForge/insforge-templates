'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { revokeInvite } from '@/lib/workspace-actions';

export function InvitesSection({
  invites,
}: {
  invites: { id: string; token: string; role: string; created_at: string }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function copy(token: string) {
    const url = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(url);
    toast.success('Copied');
  }

  function revoke(id: string) {
    startTransition(async () => {
      try {
        await revokeInvite(id);
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Failed');
      }
    });
  }

  if (invites.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Open invites</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {invites.map((iv) => (
            <li key={iv.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
              <div>
                <div className="font-medium">{iv.role}</div>
                <div className="text-xs text-muted-foreground">
                  created {new Date(iv.created_at).toLocaleString()}
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => copy(iv.token)}>
                  Copy link
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-red-600"
                  onClick={() => revoke(iv.id)}
                  disabled={pending}
                >
                  Revoke
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
