import { NextResponse } from 'next/server';
import { createInsforgeServerClient } from '@/lib/insforge';
import { getCurrentAuthState } from '@/lib/auth-state';
import { ingestPdf } from '@/lib/rag/ingest';
import { getPostHogClient } from '@/lib/posthog-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_BYTES = 10 * 1024 * 1024;
const BUCKET = 'pdf-documents';

export async function POST(req: Request) {
  const auth = await getCurrentAuthState();
  if (!auth.viewer.isAuthenticated || !auth.viewer.id || !auth.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get('file');
  const rawWorkspaceId = formData.get('workspaceId');
  // Validate the client-supplied workspace id format up-front so a bad
  // value returns a 400 instead of leaking a 500 from a downstream
  // `invalid input syntax for type uuid` Postgres error.
  const UUID_RE = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  let workspaceId: string | null = null;
  if (typeof rawWorkspaceId === 'string' && rawWorkspaceId) {
    if (!UUID_RE.test(rawWorkspaceId)) {
      return NextResponse.json({ error: 'workspaceId must be a UUID' }, { status: 400 });
    }
    workspaceId = rawWorkspaceId;
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }
  if (file.type !== 'application/pdf') {
    return NextResponse.json({ error: 'Only PDF files are supported' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'File exceeds 10 MB limit' }, { status: 400 });
  }

  const client = createInsforgeServerClient({ accessToken: auth.accessToken });

  const insertRes = await client.database
    .from('documents')
    .insert({
      user_id: auth.viewer.id,
      workspace_id: workspaceId,
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type,
      storage_bucket: BUCKET,
      storage_key: 'pending',
      status: 'processing',
    })
    .select()
    .single();

  if (insertRes.error || !insertRes.data) {
    return NextResponse.json({ error: insertRes.error?.message ?? 'Insert failed' }, { status: 500 });
  }

  const doc = insertRes.data as { id: string };
  const storageKey = `${auth.viewer.id}/${doc.id}/${file.name}`;

  const buffer = await file.arrayBuffer();

  const upload = await client.storage
    .from(BUCKET)
    .upload(storageKey, new Blob([buffer], { type: file.type }));

  if (upload.error) {
    await client.database.from('documents').delete().eq('id', doc.id);
    return NextResponse.json({ error: upload.error.message ?? 'Upload failed' }, { status: 500 });
  }

  await client.database
    .from('documents')
    .update({ storage_key: storageKey })
    .eq('id', doc.id);

  const ingestResult = await ingestPdf(client, {
    userId: auth.viewer.id,
    documentId: doc.id,
    fileName: file.name,
    buffer,
  });

  const posthog = getPostHogClient();
  posthog.capture({
    distinctId: auth.viewer.id,
    event: 'document_uploaded',
    properties: {
      document_id: doc.id,
      file_name: file.name,
      file_size_bytes: file.size,
      workspace_id: workspaceId,
      ingest_status: ingestResult.status,
      chunk_count: ingestResult.status === 'ready' ? ingestResult.chunkCount : 0,
    },
  });
  await posthog.shutdown();

  return NextResponse.json({
    document: { id: doc.id, file_name: file.name, file_size: file.size, status: ingestResult.status },
    ingest: ingestResult,
  });
}
