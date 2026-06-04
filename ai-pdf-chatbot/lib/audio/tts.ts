import 'server-only';
import type { AudioScriptTurn } from '@/lib/ai/audio-script';

const OPENAI_URL = 'https://api.openai.com/v1/audio/speech';
const MODEL = 'gpt-4o-mini-tts';
// nova / onyx are OpenAI's lightest "natural conversational" voices —
// nova reads warm/feminine, onyx reads neutral/masculine.
const VOICE_BY_SPEAKER: Record<AudioScriptTurn['speaker'], string> = {
  Sarah: 'nova',
  Mike: 'onyx',
};

async function synthesizeOne(text: string, voice: string, apiKey: string): Promise<Buffer> {
  const res = await fetch(OPENAI_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model: MODEL, voice, input: text, response_format: 'mp3' }),
  });
  if (!res.ok) {
    const err = await res.text().catch(() => res.statusText);
    throw new Error(`TTS failed (${res.status}): ${err.slice(0, 200)}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

// Synthesizes each turn in parallel (capped to avoid OpenAI rate limit
// 429s), then naive-concats the mp3 frames into a single stream.
//
// Why naive concat works: mp3 is a frame-oriented format with no
// mandatory file header, so adjacent files' frames are still decodable
// by browsers, ffmpeg, VLC, etc. It's not strictly spec-compliant
// (there'll be a tiny gap on some decoders) but it's enough for a
// study-tool overview where exact gapless playback isn't the bar.
// For production-grade audio, swap this for ffmpeg.wasm.
export async function synthesizeScript(
  turns: AudioScriptTurn[],
  apiKey: string,
): Promise<Buffer> {
  if (turns.length === 0) throw new Error('Empty script');

  const CONCURRENCY = 4;
  const buffers: Buffer[] = new Array(turns.length);

  for (let i = 0; i < turns.length; i += CONCURRENCY) {
    const batch = turns.slice(i, i + CONCURRENCY).map((t, j) =>
      synthesizeOne(t.text, VOICE_BY_SPEAKER[t.speaker], apiKey).then((buf) => {
        buffers[i + j] = buf;
      }),
    );
    await Promise.all(batch);
  }

  return Buffer.concat(buffers);
}
