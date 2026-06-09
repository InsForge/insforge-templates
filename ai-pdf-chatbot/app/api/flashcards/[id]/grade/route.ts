import { NextResponse } from 'next/server';
import { createInsforgeServerClient } from '@/lib/insforge';
import { getCurrentAuthState } from '@/lib/auth-state';
import { schedule, type Grade } from '@/lib/srs/schedule';
import { getPostHogClient } from '@/lib/posthog-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VALID: Grade[] = ['again', 'hard', 'good', 'easy'];

// Applies an SRS grade to a flashcard and stores the new state. The
// algorithm is a pure function in lib/srs/schedule.ts so the same logic
// is testable in node:test and unchanged by HTTP plumbing.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await getCurrentAuthState();
  if (!auth.viewer.isAuthenticated || !auth.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as { grade?: string };
  const grade = body.grade as Grade | undefined;
  if (!grade || !VALID.includes(grade)) {
    return NextResponse.json({ error: 'Invalid grade' }, { status: 400 });
  }

  const client = createInsforgeServerClient({ accessToken: auth.accessToken });

  const cardRes = await client.database
    .from('document_flashcards')
    .select('id, ease, interval_days, reps')
    .eq('id', id)
    .single();
  if (cardRes.error || !cardRes.data) {
    return NextResponse.json({ error: 'Card not found' }, { status: 404 });
  }
  const card = cardRes.data as { id: string; ease: number; interval_days: number; reps: number };

  const next = schedule(
    { ease: card.ease, interval_days: card.interval_days, reps: card.reps },
    grade,
  );

  const upd = await client.database
    .from('document_flashcards')
    .update({
      ease: next.ease,
      interval_days: next.interval_days,
      reps: next.reps,
      last_grade: next.last_grade,
      due_at: next.due_at.toISOString(),
    })
    .eq('id', id);

  if (upd.error) return NextResponse.json({ error: upd.error.message }, { status: 500 });

  const posthog = getPostHogClient();
  posthog.capture({
    distinctId: auth.viewer.id ?? 'anonymous',
    event: 'flashcard_graded',
    properties: {
      card_id: id,
      grade,
      next_interval_days: next.interval_days,
      reps: next.reps,
    },
  });
  await posthog.shutdown();

  return NextResponse.json({
    ok: true,
    next: {
      ease: next.ease,
      interval_days: next.interval_days,
      due_at: next.due_at.toISOString(),
    },
  });
}
