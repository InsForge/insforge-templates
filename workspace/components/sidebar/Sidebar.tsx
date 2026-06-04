'use client';

import { WorkspaceSwitcher } from './WorkspaceSwitcher';
import { PageTree } from './PageTree';
import { NewPageButton } from './NewPageButton';

type Page = {
  id: string;
  parent_id: string | null;
  title: string;
  icon: string | null;
  position: number;
};

export function Sidebar({
  currentWorkspace,
  workspaces,
  pages,
  currentUser,
}: {
  currentWorkspace: { id: string; name: string };
  workspaces: { id: string; name: string }[];
  pages: Page[];
  currentUser: { id: string; email: string; name: string };
}) {
  return (
    <aside className="flex w-64 flex-col border-r bg-muted/30">
      <div className="border-b p-3">
        <WorkspaceSwitcher current={currentWorkspace} workspaces={workspaces} currentUser={currentUser} />
      </div>
      <div className="flex items-center justify-between px-3 py-2">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Pages</span>
        <NewPageButton workspaceId={currentWorkspace.id} parentId={null} />
      </div>
      <div className="flex-1 overflow-auto px-1">
        <PageTree workspaceId={currentWorkspace.id} pages={pages} />
      </div>
    </aside>
  );
}
