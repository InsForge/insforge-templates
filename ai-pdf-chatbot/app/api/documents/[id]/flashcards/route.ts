import { NextResponse } from 'next/server';
import { createInsforgeServerClient } from '@/lib/insforge';
import { getCurrentAuthState } from '@/lib/auth-state';
import { generateFlashcards } from '@/lib/ai/document-insights';
import { parsePdf } from '@/lib/pdf/parse';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type FlashcardRow = {
  id: string;
  question: string;
  answer: string;
  sort_order: number;
};

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await getCurrentAuthState();
  if (!auth.viewer.isAuthenticated || !auth.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const client = createInsforgeServerClient({ accessToken: auth.accessToken });
  const { data, error } = await client.database
    .from('document_flashcards')
    .select('id, question, answer, sort_order')
    .eq('document_id', id)
    .order('sort_order', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ flashcards: (data ?? []) as FlashcardRow[] });
}

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await getCurrentAuthState();
  if (!auth.viewer.isAuthenticated || !auth.viewer.id || !auth.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const client = createInsforgeServerClient({ accessToken: auth.accessToken });

  const docRes = await client.database
    .from('documents')
    .select('id, workspace_id, storage_bucket, storage_key, file_name, status')
    .eq('id', id)
    .single();

  if (docRes.error || !docRes.data) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 });
  }
  const doc = docRes.data as {
    id: string;
    workspace_id: string | null;
    storage_bucket: string;
    storage_key: string;
    file_name: string;
    status: string;
  };
  if (doc.status !== 'ready') {
    return NextResponse.json(
      { error: 'Document still processing — flashcards available once ingestion finishes.' },
      { status: 409 },
    );
  }

  const dl = await client.storage.from(doc.storage_bucket).download(doc.storage_key);
  if (dl.error || !dl.data) {
    return NextResponse.json({ error: dl.error?.message ?? 'Download failed' }, { status: 500 });
  }
  const buffer = await dl.data.arrayBuffer();
  const { pages } = await parsePdf(buffer);
  const fullText = pages.map((p) => p.text).join('\n\n');

  const cards = await generateFlashcards(client, doc.file_name, fullText);
  if (cards.length === 0) {
    return NextResponse.json({ error: 'No flashcards could be generated.' }, { status: 500 });
  }

  // Replace any previous deck for this doc so re-generation feels fresh.
  await client.database.from('document_flashcards').delete().eq('document_id', id);

  const rows = cards.map((c, i) => ({
    document_id: id,
    workspace_id: doc.workspace_id,
    user_id: auth.viewer.id,
    question: c.question,
    answer: c.answer,
    sort_order: i,
    // Fresh cards land in the SRS queue immediately; defaults on the
    // ease/interval/reps columns take care of the rest.
    due_at: new Date().toISOString(),
  }));

  const ins = await client.database
    .from('document_flashcards')
    .insert(rows)
    .select('id, question, answer, sort_order');

  if (ins.error) return NextResponse.json({ error: ins.error.message }, { status: 500 });
  return NextResponse.json({ flashcards: (ins.data ?? []) as FlashcardRow[] });
}
