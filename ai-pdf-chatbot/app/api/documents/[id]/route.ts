import { NextResponse } from 'next/server';
import { createInsforgeServerClient } from '@/lib/insforge';
import { getCurrentAuthState } from '@/lib/auth-state';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await getCurrentAuthState();
  if (!auth.viewer.isAuthenticated || !auth.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as { workspace_id?: string | null };
  // Only workspace_id is mutable via this route today. Adding other fields
  // here keeps the surface flat instead of one route per column.
  if (!('workspace_id' in body)) {
    return NextResponse.json({ error: 'No mutable fields provided' }, { status: 400 });
  }

  const client = createInsforgeServerClient({ accessToken: auth.accessToken });
  const { error } = await client.database
    .from('documents')
    .update({ workspace_id: body.workspace_id ?? null, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Cascade the workspace_id to all flashcards generated from this doc so
  // workspace-wide review queues see them. Documents that don't have
  // flashcards yet just no-op. Failures here would silently leave the
  // doc and its flashcards out of sync, so surface them.
  const cascade = await client.database
    .from('document_flashcards')
    .update({ workspace_id: body.workspace_id ?? null })
    .eq('document_id', id);
  if (cascade.error) {
    return NextResponse.json({ error: cascade.error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

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
