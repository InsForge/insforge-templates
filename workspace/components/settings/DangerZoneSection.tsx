'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { deleteWorkspace, leaveWorkspace } from '@/lib/workspace-actions';

export function DangerZoneSection({
  workspaceId,
  isOwner,
}: {
  workspaceId: string;
  isOwner: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleLeave() {
    if (!confirm('Leave this workspace?')) return;
    startTransition(async () => {
      try {
        await leaveWorkspace(workspaceId);
        router.push('/');
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Failed');
      }
    });
  }

  function handleDelete() {
    if (!confirm('Delete this workspace and all its pages permanently?')) return;
    startTransition(async () => {
      try {
        await deleteWorkspace(workspaceId);
        router.push('/');
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Failed');
      }
    });
  }

  return (
    <Card className="border-red-200">
      <CardHeader>
        <CardTitle className="text-red-600">Danger zone</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {isOwner ? (
          <Button variant="ghost" className="text-red-600" onClick={handleDelete} disabled={pending}>
            Delete workspace
          </Button>
        ) : (
          <Button variant="ghost" className="text-red-600" onClick={handleLeave} disabled={pending}>
            Leave workspace
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
