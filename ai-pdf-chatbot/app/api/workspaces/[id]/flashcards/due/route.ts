import { NextResponse } from 'next/server';
import { createInsforgeServerClient } from '@/lib/insforge';
import { getCurrentAuthState } from '@/lib/auth-state';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Returns up to 50 due cards in this workspace, joined with their source
// document file name so the review UI can show provenance under each
// question. Ordered by due_at so the most overdue card surfaces first.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await getCurrentAuthState();
  if (!auth.viewer.isAuthenticated || !auth.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const client = createInsforgeServerClient({ accessToken: auth.accessToken });

  const cardsRes = await client.database
    .from('document_flashcards')
    .select('id, document_id, question, answer, ease, interval_days, reps, due_at')
    .eq('workspace_id', id)
    .lte('due_at', new Date().toISOString())
    .order('due_at', { ascending: true })
    .limit(50);

  if (cardsRes.error) {
    return NextResponse.json({ error: cardsRes.error.message }, { status: 500 });
  }

  const cards = (cardsRes.data ?? []) as Array<{
    id: string;
    document_id: string;
    question: string;
    answer: string;
    ease: number;
    interval_days: number;
    reps: number;
    due_at: string;
  }>;

  // Resolve file names in one query rather than per-card. RLS keeps
  // anything outside this user's documents out by default.
  const docIds = Array.from(new Set(cards.map((c) => c.document_id)));
  let nameById = new Map<string, string>();
  if (docIds.length > 0) {
    const docsRes = await client.database
      .from('documents')
      .select('id, file_name')
      .in('id', docIds);
    if (docsRes.error) {
      return NextResponse.json({ error: docsRes.error.message }, { status: 500 });
    }
    nameById = new Map(
      ((docsRes.data ?? []) as Array<{ id: string; file_name: string }>).map((d) => [d.id, d.file_name]),
    );
  }

  return NextResponse.json({
    cards: cards.map((c) => ({ ...c, file_name: nameById.get(c.document_id) ?? 'document.pdf' })),
  });
}
