import { NextResponse } from 'next/server';
import { createInsforgeServerClient } from '@/lib/insforge';
import { getCurrentAuthState } from '@/lib/auth-state';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: Promise<{ chatId: string }> }) {
  const { chatId } = await params;
  const auth = await getCurrentAuthState();
  if (!auth.viewer.isAuthenticated || !auth.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const client = createInsforgeServerClient({ accessToken: auth.accessToken });

  const chatRes = await client.database
    .from('chat_sessions')
    .select('*')
    .eq('id', chatId)
    .single();

  if (chatRes.error || !chatRes.data) {
    return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
  }

  const msgRes = await client.database
    .from('chat_messages')
    .select('id, role, content, sort_order, citations, created_at')
    .eq('chat_id', chatId)
    .order('sort_order', { ascending: true });

  if (msgRes.error) return NextResponse.json({ error: msgRes.error.message }, { status: 500 });

  return NextResponse.json({ chat: chatRes.data, messages: msgRes.data ?? [] });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ chatId: string }> }) {
  const { chatId } = await params;
  const auth = await getCurrentAuthState();
  if (!auth.viewer.isAuthenticated || !auth.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const client = createInsforgeServerClient({ accessToken: auth.accessToken });

  const del = await client.database.from('chat_sessions').delete().eq('id', chatId);
  if (del.error) return NextResponse.json({ error: del.error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
