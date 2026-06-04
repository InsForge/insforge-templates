import { NextResponse } from 'next/server';
import { createInsforgeServerClient } from '@/lib/insforge';
import { getCurrentAuthState } from '@/lib/auth-state';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await getCurrentAuthState();
  if (!auth.viewer.isAuthenticated || !auth.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const client = createInsforgeServerClient({ accessToken: auth.accessToken });

  const wsRes = await client.database
    .from('workspaces')
    .select('id, name, description, mindmap_markdown, mindmap_generated_at, audio_url, audio_script, audio_generated_at, created_at, updated_at')
    .eq('id', id)
    .single();

  if (wsRes.error || !wsRes.data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Fetch related counts in parallel. RLS keeps everything scoped to the
  // current user automatically — the workspace SELECT above already proved
  // ownership.
  const [docsRes, chatsRes, dueRes] = await Promise.all([
    client.database.from('documents').select('id', { count: 'exact', head: true }).eq('workspace_id', id),
    client.database.from('chat_sessions').select('id', { count: 'exact', head: true }).eq('workspace_id', id),
    client.database
      .from('document_flashcards')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', id)
      .lte('due_at', new Date().toISOString()),
  ]);

  const firstError = docsRes.error ?? chatsRes.error ?? dueRes.error;
  if (firstError) {
    return NextResponse.json({ error: firstError.message }, { status: 500 });
  }

  return NextResponse.json({
    workspace: wsRes.data,
    counts: {
      documents: docsRes.count ?? 0,
      chats: chatsRes.count ?? 0,
      due_flashcards: dueRes.count ?? 0,
    },
  });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await getCurrentAuthState();
  if (!auth.viewer.isAuthenticated || !auth.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as { name?: string; description?: string };
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (typeof body.name === 'string') {
    const trimmed = body.name.trim();
    if (!trimmed) return NextResponse.json({ error: 'Name cannot be empty' }, { status: 400 });
    patch.name = trimmed;
  }
  if (typeof body.description === 'string') {
    patch.description = body.description.trim() || null;
  }

  const client = createInsforgeServerClient({ accessToken: auth.accessToken });
  // Use `select` with single-row coerce so we can tell apart "0 rows
  // matched" (404, e.g. someone else's workspace under RLS) from a
  // successful update. Without this PATCH was returning ok for any id.
  const { data, error } = await client.database
    .from('workspaces')
    .update(patch)
    .eq('id', id)
    .select('id');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data || (Array.isArray(data) && data.length === 0)) {
    return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
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
  // Documents/chats keep existing rows alive by setting workspace_id to
  // null via the FK ON DELETE SET NULL. The workspace's own cached audio
  // file in storage still needs an explicit cleanup pass.
  const wsRes = await client.database
    .from('workspaces')
    .select('audio_url')
    .eq('id', id)
    .single();
  const audioUrl = (wsRes.data as { audio_url: string | null } | null)?.audio_url ?? null;
  if (audioUrl) {
    const match = audioUrl.match(/audio-overviews\/(.+?)(?:\?|$)/);
    const key = match?.[1];
    if (key) {
      await client.storage.from('audio-overviews').remove(decodeURIComponent(key)).catch(() => undefined);
    }
  }

  const { error } = await client.database.from('workspaces').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
