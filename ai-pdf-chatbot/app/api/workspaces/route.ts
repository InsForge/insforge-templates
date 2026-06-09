import { NextResponse } from 'next/server';
import { createInsforgeServerClient } from '@/lib/insforge';
import { getCurrentAuthState } from '@/lib/auth-state';
import { getPostHogClient } from '@/lib/posthog-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const auth = await getCurrentAuthState();
  if (!auth.viewer.isAuthenticated || !auth.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const client = createInsforgeServerClient({ accessToken: auth.accessToken });
  const { data, error } = await client.database
    .from('workspaces')
    .select('id, name, description, mindmap_generated_at, audio_url, audio_generated_at, created_at, updated_at')
    .order('updated_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ workspaces: data ?? [] });
}

export async function POST(req: Request) {
  const auth = await getCurrentAuthState();
  if (!auth.viewer.isAuthenticated || !auth.viewer.id || !auth.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as { name?: unknown; description?: unknown };
  // .trim() throws on non-strings, so check types before reaching for it.
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (!name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }
  const description =
    typeof body.description === 'string' ? body.description.trim() || null : null;

  const client = createInsforgeServerClient({ accessToken: auth.accessToken });
  const { data, error } = await client.database
    .from('workspaces')
    .insert({
      user_id: auth.viewer.id,
      name,
      description,
    })
    .select()
    .single();

  if (error || !data) return NextResponse.json({ error: error?.message ?? 'Insert failed' }, { status: 500 });

  const posthog = getPostHogClient();
  const ws = data as { id: string };
  posthog.capture({
    distinctId: auth.viewer.id,
    event: 'workspace_created',
    properties: { workspace_id: ws.id, workspace_name: name },
  });
  // Analytics flush failure must not surface as a 500 for the user;
  // the write above already succeeded. Swallow the error.
  await posthog.shutdown().catch(() => undefined);

  return NextResponse.json({ workspace: data });
}
