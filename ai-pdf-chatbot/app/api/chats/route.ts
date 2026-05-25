import { NextResponse } from 'next/server';
import { createInsforgeServerClient } from '@/lib/insforge';
import { getCurrentAuthState } from '@/lib/auth-state';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const auth = await getCurrentAuthState();
  if (!auth.viewer.isAuthenticated || !auth.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const client = createInsforgeServerClient({ accessToken: auth.accessToken });
  const { data, error } = await client.database
    .from('chat_sessions')
    .select('id, title, document_ids, created_at, last_message_at')
    .order('last_message_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ chats: data ?? [] });
}

export async function POST(req: Request) {
  const auth = await getCurrentAuthState();
  if (!auth.viewer.isAuthenticated || !auth.viewer.id || !auth.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as { title?: string; documentIds?: string[] };
  const client = createInsforgeServerClient({ accessToken: auth.accessToken });

  const { data, error } = await client.database
    .from('chat_sessions')
    .insert({
      user_id: auth.viewer.id,
      title: body.title?.trim() || 'New chat',
      document_ids: body.documentIds ?? [],
    })
    .select()
    .single();

  if (error || !data) return NextResponse.json({ error: error?.message ?? 'Insert failed' }, { status: 500 });
  return NextResponse.json({ chat: data });
}
