import { notFound } from 'next/navigation';
import { createInsforgeServerClient } from '@/lib/insforge';
import { getAccessToken } from '@/lib/auth-cookies';
import { ShareDialog } from '@/components/share/ShareDialog';
import { PageEditor } from '@/components/editor/PageEditorClient';

async function authedClient() {
  const accessToken = await getAccessToken();
  return createInsforgeServerClient({ accessToken: accessToken ?? undefined });
}

export default async function PageRoute({
  params,
}: {
  params: Promise<{ workspaceId: string; pageId: string }>;
}) {
  const { workspaceId, pageId } = await params;
  const client = await authedClient();
  const { data: page } = await client.database
    .from('pages')
    .select('id, title, icon, content, updated_at')
    .eq('id', pageId)
    .eq('workspace_id', workspaceId)
    .single();

  if (!page) notFound();

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-end gap-2 border-b px-6 py-2">
        <ShareDialog pageId={page.id} />
      </div>
      <div className="flex-1 overflow-auto">
        <PageEditor workspaceId={workspaceId} page={page as any} />
      </div>
    </div>
  );
}
