import { NextResponse } from 'next/server';
import { createInsforgeServerClient } from '@/lib/insforge';
import { getCurrentAuthState } from '@/lib/auth-state';
import { generateAudioScript } from '@/lib/ai/audio-script';
import { synthesizeScript } from '@/lib/audio/tts';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// TTS for ~10 turns easily runs 30-60s in series. Lift the timeout off
// the default 10s edge cap so the route can finish before Vercel kills
// it on production.
export const maxDuration = 300;

const BUCKET = 'audio-overviews';

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await getCurrentAuthState();
  if (!auth.viewer.isAuthenticated || !auth.viewer.id || !auth.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Audio Overview is opt-in: users wire their own OpenAI key. We
  // surface a clean 412 instead of throwing so the UI can show a
  // friendly "Configure OPENAI_API_KEY" prompt.
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          'Audio Overview requires an OPENAI_API_KEY environment variable. See the README for setup.',
      },
      { status: 412 },
    );
  }

  const client = createInsforgeServerClient({ accessToken: auth.accessToken });

  const wsRes = await client.database
    .from('workspaces')
    .select('id, name')
    .eq('id', id)
    .single();
  if (wsRes.error || !wsRes.data) {
    return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
  }
  const ws = wsRes.data as { id: string; name: string };

  const docsRes = await client.database
    .from('documents')
    .select('file_name, summary')
    .eq('workspace_id', id)
    .eq('status', 'ready');
  if (docsRes.error) {
    return NextResponse.json({ error: docsRes.error.message }, { status: 500 });
  }
  const docs = (docsRes.data ?? []) as Array<{ file_name: string; summary: string | null }>;
  if (docs.length === 0) {
    return NextResponse.json(
      { error: 'Add at least one ready document before generating an audio overview.' },
      { status: 409 },
    );
  }

  const script = await generateAudioScript(client, ws.name, docs);
  if (script.length < 4) {
    return NextResponse.json({ error: 'Could not produce a usable script' }, { status: 500 });
  }

  const audioBuffer = await synthesizeScript(script, apiKey);

  // Versioned key so the public URL doesn't get stale-cached on
  // regenerate. The previous audio file lingers but the DB only points
  // at the latest one.
  const key = `${auth.viewer.id}/${id}/${Date.now()}.mp3`;
  const upload = await client.storage
    .from(BUCKET)
    .upload(key, new Blob([new Uint8Array(audioBuffer)], { type: 'audio/mpeg' }));
  if (upload.error) {
    return NextResponse.json({ error: upload.error.message ?? 'Upload failed' }, { status: 500 });
  }

  const url = client.storage.from(BUCKET).getPublicUrl(key);
  const audioUrl = typeof url === 'string' ? url : (url as { data?: { publicUrl?: string } })?.data?.publicUrl;
  if (!audioUrl) {
    return NextResponse.json({ error: 'Could not resolve audio URL' }, { status: 500 });
  }

  const now = new Date().toISOString();
  const upd = await client.database
    .from('workspaces')
    .update({
      audio_url: audioUrl,
      audio_script: script,
      audio_generated_at: now,
      updated_at: now,
    })
    .eq('id', id);
  if (upd.error) return NextResponse.json({ error: upd.error.message }, { status: 500 });

  return NextResponse.json({ audio_url: audioUrl, script, generated_at: now });
}
