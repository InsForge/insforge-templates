'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InviteDialog } from '@/components/invites/InviteDialog';
import { removeMember } from '@/lib/workspace-actions';

export function MembersSection({
  workspaceId,
  ownerId,
  currentUserId,
  members,
}: {
  workspaceId: string;
  ownerId: string;
  currentUserId: string;
  members: { user_id: string; role: string }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const isOwner = currentUserId === ownerId;

  function handleRemove(userId: string) {
    if (!confirm('Remove this member?')) return;
    startTransition(async () => {
      try {
        await removeMember(workspaceId, userId);
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Failed');
      }
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Members</CardTitle>
        {isOwner ? <InviteDialog workspaceId={workspaceId} /> : null}
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {members.map((m) => (
            <li
              key={m.user_id}
              className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
            >
              <div>
                <div className="font-medium">{m.user_id === currentUserId ? 'You' : m.user_id}</div>
                <div className="text-xs text-muted-foreground">{m.role}</div>
              </div>
              {isOwner && m.user_id !== ownerId ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemove(m.user_id)}
                  disabled={pending}
                  className="text-red-600"
                >
                  Remove
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
