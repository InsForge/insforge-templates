'use client';

import Link from 'next/link';
import { useRouter, useSelectedLayoutSegments } from 'next/navigation';
import { ChevronRight, FileText, MoreHorizontal, Plus, Trash2 } from 'lucide-react';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { createPage, deletePage } from '@/lib/workspace-actions';
import { cn } from '@/lib/utils';

type Page = {
  id: string;
  parent_id: string | null;
  title: string;
  icon: string | null;
  position: number;
};

export function PageTreeNode({
  workspaceId,
  page,
  byParent,
  depth,
}: {
  workspaceId: string;
  page: Page;
  byParent: Map<string | null, Page[]>;
  depth: number;
}) {
  const [expanded, setExpanded] = useState(true);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const segments = useSelectedLayoutSegments();
  // Under /w/[workspaceId]/p/[pageId], segments are ['p', pageId]
  const activePageId = segments[1];
  const isActive = activePageId === page.id;
  const children = byParent.get(page.id) ?? [];

  function addChild() {
    startTransition(async () => {
      try {
        const id = await createPage(workspaceId, page.id);
        router.push(`/w/${workspaceId}/p/${id}`);
        setExpanded(true);
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Failed');
      }
    });
  }

  function remove() {
    if (!confirm(`Delete "${page.title}" and all its children?`)) return;
    startTransition(async () => {
      try {
        await deletePage(page.id, workspaceId);
        if (isActive) router.push(`/w/${workspaceId}`);
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Failed');
      }
    });
  }

  return (
    <li>
      <div
        className={cn(
          'group flex items-center gap-1 rounded-md px-1 py-1 text-sm hover:bg-muted',
          isActive && 'bg-muted',
        )}
        style={{ paddingLeft: `${depth * 12 + 4}px` }}
      >
        {children.length > 0 ? (
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className="rounded p-0.5 text-muted-foreground hover:bg-background"
          >
            <ChevronRight className={cn('h-3 w-3 transition-transform', expanded && 'rotate-90')} />
          </button>
        ) : (
          <span className="w-4" />
        )}
        <Link href={`/w/${workspaceId}/p/${page.id}`} className="flex flex-1 items-center gap-2 truncate">
          {page.icon ? (
            <span className="text-xs">{page.icon}</span>
          ) : (
            <FileText className="h-3.5 w-3.5 opacity-70" />
          )}
          <span className="truncate">{page.title || 'Untitled'}</span>
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger
            className="rounded p-1 opacity-0 group-hover:opacity-100 hover:bg-background"
            aria-label="Page actions"
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-44">
            <DropdownMenuItem onClick={addChild} disabled={pending}>
              <Plus className="mr-2 h-4 w-4" /> Add subpage
            </DropdownMenuItem>
            <DropdownMenuItem onClick={remove} disabled={pending} className="text-red-600 focus:text-red-600">
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {expanded && children.length > 0 && (
        <ul className="space-y-0.5">
          {children.map((c) => (
            <PageTreeNode
              key={c.id}
              workspaceId={workspaceId}
              page={c}
              byParent={byParent}
              depth={depth + 1}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
