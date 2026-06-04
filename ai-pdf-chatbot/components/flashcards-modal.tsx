'use client';

import { ChevronLeft, ChevronRight, Loader2, RefreshCw, Sparkles, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

type Card = { id: string; question: string; answer: string; sort_order: number };

export function FlashcardsModal({
  documentId,
  documentName,
  onClose,
}: {
  documentId: string;
  documentName: string;
  onClose: () => void;
}) {
  const [cards, setCards] = useState<Card[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/documents/${documentId}/flashcards`);
      if (!res.ok) {
        setCards([]);
        return;
      }
      const data = await res.json();
      setCards(data.flashcards ?? []);
    } catch {
      setCards([]);
      toast.error('Failed to load flashcards');
    } finally {
      setLoading(false);
    }
  }, [documentId]);

  const generate = useCallback(async () => {
    setGenerating(true);
    try {
      const res = await fetch(`/api/documents/${documentId}/flashcards`, { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? 'Failed to generate flashcards');
        return;
      }
      setCards(data.flashcards ?? []);
      setIndex(0);
      setRevealed(false);
    } catch {
      toast.error('Failed to generate flashcards');
    } finally {
      setGenerating(false);
    }
  }, [documentId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const card = cards?.[index];

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-xl rounded-2xl border border-border bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Flashcards</p>
            <p className="truncate text-sm font-medium">{documentName}</p>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="rounded p-2 text-muted-foreground hover:bg-muted"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="px-5 py-6">
          {loading ? (
            <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
              <Loader2 className="mr-2 size-4 animate-spin" /> Loading…
            </div>
          ) : !cards || cards.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <Sparkles className="size-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                No flashcards yet. Generate a study deck from this PDF.
              </p>
              <Button onClick={generate} disabled={generating}>
                {generating ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" /> Generating…
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 size-4" /> Generate flashcards
                  </>
                )}
              </Button>
            </div>
          ) : card ? (
            <>
              <button
                type="button"
                onClick={() => setRevealed((v) => !v)}
                className="block min-h-[180px] w-full rounded-xl border border-border bg-background p-6 text-left transition hover:bg-muted/40"
              >
                <p className="mb-3 text-xs uppercase tracking-wider text-muted-foreground">
                  {revealed ? 'Answer' : 'Question'}
                </p>
                <p className="text-base leading-relaxed">
                  {revealed ? card.answer : card.question}
                </p>
                <p className="mt-4 text-xs text-muted-foreground">
                  {revealed ? 'Tap to flip back' : 'Tap to reveal answer'}
                </p>
              </button>

              <div className="mt-5 flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={index === 0}
                  onClick={() => {
                    setIndex((i) => Math.max(0, i - 1));
                    setRevealed(false);
                  }}
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <p className="text-xs text-muted-foreground">
                  {index + 1} / {cards.length}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={index === cards.length - 1}
                  onClick={() => {
                    setIndex((i) => Math.min(cards.length - 1, i + 1));
                    setRevealed(false);
                  }}
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>

              <div className="mt-5 flex justify-end border-t border-border pt-4">
                <Button variant="ghost" size="sm" onClick={generate} disabled={generating}>
                  {generating ? (
                    <>
                      <Loader2 className="mr-1 size-3.5 animate-spin" /> Regenerating…
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-1 size-3.5" /> Regenerate
                    </>
                  )}
                </Button>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
