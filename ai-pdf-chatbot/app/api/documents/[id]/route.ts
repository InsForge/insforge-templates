import { NextResponse } from 'next/server';
import { createInsforgeServerClient } from '@/lib/insforge';
import { getCurrentAuthState } from '@/lib/auth-state';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await getCurrentAuthState();
  if (!auth.viewer.isAuthenticated || !auth.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const client = createInsforgeServerClient({ accessToken: auth.accessToken });

  const docRes = await client.database
    .from('documents')
    .select('id, storage_bucket, storage_key')
    .eq('id', id)
    .single();

  if (docRes.error || !docRes.data) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 });
  }
  const doc = docRes.data as { id: string; storage_bucket: string; storage_key: string };

  await client.storage.from(doc.storage_bucket).remove(doc.storage_key).catch(() => undefined);

  const del = await client.database.from('documents').delete().eq('id', doc.id);
  if (del.error) return NextResponse.json({ error: del.error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
