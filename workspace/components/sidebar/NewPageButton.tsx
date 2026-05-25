'use client';

import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { useTransition } from 'react';
import { toast } from 'sonner';
import { createPage } from '@/lib/workspace-actions';

export function NewPageButton({
  workspaceId,
  parentId,
}: {
  workspaceId: string;
  parentId: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleCreate() {
    startTransition(async () => {
      try {
        const pageId = await createPage(workspaceId, parentId);
        router.push(`/w/${workspaceId}/p/${pageId}`);
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Failed to create page');
      }
    });
  }

  return (
    <button
      onClick={handleCreate}
      disabled={pending}
      className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
      aria-label="New page"
    >
      <Plus className="h-4 w-4" />
    </button>
  );
}
