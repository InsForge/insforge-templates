'use client';

import { use, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import type { Grade } from '@/lib/srs/schedule';
import { cn } from '@/lib/utils';

type DueCard = {
  id: string;
  document_id: string;
  file_name: string;
  question: string;
  answer: string;
  ease: number;
  interval_days: number;
  reps: number;
  due_at: string;
};

const GRADES: { id: Grade; label: string; tone: string }[] = [
  { id: 'again', label: 'Again', tone: 'bg-red-100 text-red-900 hover:bg-red-200 dark:bg-red-950/40 dark:text-red-100' },
  { id: 'hard', label: 'Hard', tone: 'bg-orange-100 text-orange-900 hover:bg-orange-200 dark:bg-orange-950/40 dark:text-orange-100' },
  { id: 'good', label: 'Good', tone: 'bg-emerald-100 text-emerald-900 hover:bg-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-100' },
  { id: 'easy', label: 'Easy', tone: 'bg-sky-100 text-sky-900 hover:bg-sky-200 dark:bg-sky-950/40 dark:text-sky-100' },
];

export default function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [cards, setCards] = useState<DueCard[] | null>(null);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [grading, setGrading] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/workspaces/${id}/flashcards/due`);
      if (!res.ok) {
        toast.error('Could not load review queue');
        setCards([]);
        return;
      }
      const data = (await res.json()) as { cards: DueCard[] };
      setCards(data.cards ?? []);
      setIndex(0);
      setRevealed(false);
    } catch {
      toast.error('Could not load review queue');
      setCards([]);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleGrade(grade: Grade) {
    if (!cards || index >= cards.length) return;
    const current = cards[index];
    setGrading(true);
    try {
      const res = await fetch(`/api/flashcards/${current.id}/grade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grade }),
      });
      if (!res.ok) throw new Error(await res.text());
      setIndex((i) => i + 1);
      setRevealed(false);
    } catch {
      toast.error('Could not save grade');
    } finally {
      setGrading(false);
    }
  }

  if (cards === null) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Loading queue…
        </div>
      </div>
    );
  }

  const total = cards.length;
  const done = index >= total;
  const card = !done ? cards[index] : null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <Button asChild variant="ghost">
          <Link href={`/workspaces/${id}`}>
            <ArrowLeft className="mr-1 size-4" />
            Back to workspace
          </Link>
        </Button>
        <span className="text-xs text-muted-foreground">
          {Math.min(index, total)} / {total}
        </span>
      </div>

      {total === 0 ? (
        <EmptyState
          icon={<Sparkles className="mx-auto mb-3 size-8 text-muted-foreground" />}
          title="No cards due"
          body="Generate flashcards on a document in this workspace, then come back here to review."
        />
      ) : done ? (
        <EmptyState
          icon={<Check className="mx-auto mb-3 size-8 text-emerald-600" />}
          title="Today's review done"
          body="Come back tomorrow for the next batch. The schedule moves cards out automatically."
        />
      ) : (
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card/40 p-6">
            <p className="mb-3 text-xs text-muted-foreground">From {card?.file_name}</p>
            <p className="font-display text-2xl leading-snug">{card?.question}</p>
            {revealed ? (
              <div className="mt-6 rounded-xl border border-border bg-background/60 p-4 text-sm leading-relaxed">
                {card?.answer}
              </div>
            ) : (
              <Button className="mt-6" onClick={() => setRevealed(true)}>
                Show answer
              </Button>
            )}
          </div>

          {revealed ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {GRADES.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => handleGrade(g.id)}
                  disabled={grading}
                  className={cn(
                    'rounded-xl px-3 py-3 text-sm font-medium transition disabled:opacity-50',
                    g.tone,
                  )}
                >
                  {g.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

function EmptyState({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/40 p-8 text-center">
      {icon}
      <p className="text-base font-medium">{title}</p>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
