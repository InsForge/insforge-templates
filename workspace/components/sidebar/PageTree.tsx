'use client';

import { PageTreeNode } from './PageTreeNode';

type Page = {
  id: string;
  parent_id: string | null;
  title: string;
  icon: string | null;
  position: number;
};

export function PageTree({ workspaceId, pages }: { workspaceId: string; pages: Page[] }) {
  const byParent = new Map<string | null, Page[]>();
  for (const p of pages) {
    const key = p.parent_id;
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key)!.push(p);
  }
  for (const list of byParent.values()) list.sort((a, b) => a.position - b.position);

  const roots = byParent.get(null) ?? [];

  return (
    <ul className="space-y-0.5 py-1">
      {roots.map((p) => (
        <PageTreeNode key={p.id} workspaceId={workspaceId} page={p} byParent={byParent} depth={0} />
      ))}
    </ul>
  );
}
