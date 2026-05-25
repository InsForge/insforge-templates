import { NextResponse } from 'next/server';
import { createInsforgeServerClient } from '@/lib/insforge';
import { getCurrentAuthState } from '@/lib/auth-state';
import { ingestPdf } from '@/lib/rag/ingest';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await getCurrentAuthState();
  if (!auth.viewer.isAuthenticated || !auth.viewer.id || !auth.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const client = createInsforgeServerClient({ accessToken: auth.accessToken });

  const docRes = await client.database
    .from('documents')
    .select('id, storage_bucket, storage_key, user_id')
    .eq('id', id)
    .single();

  if (docRes.error || !docRes.data) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 });
  }

  const doc = docRes.data as { id: string; storage_bucket: string; storage_key: string; user_id: string };

  await client.database
    .from('documents')
    .update({ status: 'processing', error: null, updated_at: new Date().toISOString() })
    .eq('id', doc.id);

  const dl = await client.storage.from(doc.storage_bucket).download(doc.storage_key);
  if (dl.error || !dl.data) {
    return NextResponse.json({ error: dl.error?.message ?? 'Download failed' }, { status: 500 });
  }

  const buffer = await dl.data.arrayBuffer();
  const result = await ingestPdf(client, {
    userId: doc.user_id,
    documentId: doc.id,
    buffer,
  });

  return NextResponse.json({ ingest: result });
}
