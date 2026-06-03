'use client';

import { useState } from 'react';
import { AudioLines, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import type { AudioScriptTurn } from '@/lib/types';
import { cn } from '@/lib/utils';

type Props = {
  workspaceId: string;
  initialAudioUrl: string | null;
  initialScript: AudioScriptTurn[] | null;
  initialGeneratedAt: string | null;
  onChanged: () => void;
};

// Plays the workspace audio overview and shows the underlying script as
// a transcript. We intentionally don't sync transcript highlight to
// playback time — OpenAI TTS doesn't return per-turn timing, and
// estimating from character counts is unreliable enough that it tends
// to mislead more than it helps. Skip-by-turn could be added later.
export function AudioOverview({
  workspaceId,
  initialAudioUrl,
  initialScript,
  initialGeneratedAt,
  onChanged,
}: Props) {
  const [audioUrl, setAudioUrl] = useState<string | null>(initialAudioUrl);
  const [script, setScript] = useState<AudioScriptTurn[] | null>(initialScript);
  const [generatedAt, setGeneratedAt] = useState<string | null>(initialGeneratedAt);
  const [generating, setGenerating] = useState(false);

  async function generate() {
    if (generating) return;
    setGenerating(true);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/audio`, { method: 'POST' });
      const data = (await res.json().catch(() => ({}))) as {
        audio_url?: string;
        script?: AudioScriptTurn[];
        generated_at?: string;
        error?: string;
      };
      if (!res.ok) {
        if (res.status === 412) {
          toast.error('Configure OPENAI_API_KEY to enable Audio Overview');
        } else {
          toast.error(data.error ?? 'Audio generation failed');
        }
        return;
      }
      setAudioUrl(data.audio_url ?? null);
      setScript(data.script ?? null);
      setGeneratedAt(data.generated_at ?? null);
      onChanged();
    } catch {
      // Network errors and request aborts land here; the inner block only
      // covers non-ok HTTP responses, not transport failures.
      toast.error('Audio generation failed');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {generatedAt
            ? `Last generated ${new Date(generatedAt).toLocaleString()}`
            : 'Two hosts will chat through the key ideas from your PDFs.'}
        </p>
        <Button onClick={generate} disabled={generating}>
          {generating ? (
            <Loader2 className="mr-1 size-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-1 size-4" />
          )}
          {audioUrl ? 'Regenerate' : 'Generate audio'}
        </Button>
      </div>

      {!audioUrl ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/40 p-8 text-center">
          <AudioLines className="mx-auto mb-3 size-8 text-muted-foreground" />
          <p className="text-base font-medium">No audio yet</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Generation takes 30 to 60 seconds. Needs `OPENAI_API_KEY` in your env.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card/40 p-4">
            <audio controls preload="metadata" src={audioUrl} className="w-full">
              Your browser does not support audio playback.
            </audio>
          </div>

          {script && script.length > 0 ? (
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Transcript</p>
              <ol className="space-y-2">
                {script.map((turn, i) => (
                  <li
                    key={i}
                    className={cn(
                      'rounded-xl border border-border bg-card/40 p-3 text-sm leading-relaxed',
                      turn.speaker === 'Sarah'
                        ? 'border-l-4 border-l-rose-300/70'
                        : 'border-l-4 border-l-sky-300/70',
                    )}
                  >
                    <p className="mb-1 text-xs font-medium text-muted-foreground">{turn.speaker}</p>
                    {turn.text}
                  </li>
                ))}
              </ol>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
