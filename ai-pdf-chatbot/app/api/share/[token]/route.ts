import { NextResponse } from 'next/server';
import { createInsforgeServerClient } from '@/lib/insforge';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Public endpoint: read a chat + its messages by share token. Uses the
// anon InsForge client (no edgeFunctionToken) and relies on the
// public.get_shared_chat() SECURITY DEFINER function to perform the
// lookup. RLS on chat_sessions / chat_messages stays strict (owner-only
// for both authenticated and anon).
export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!token || token.length < 8) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
  }

  const client = createInsforgeServerClient();
  const { data, error } = await client.database.rpc('get_shared_chat', { p_token: token });

  // Public endpoint — don't leak raw PostgREST / function error
  // messages (could expose schema details or trigger fingerprinting).
  // Log server-side; return a generic message to the caller.
  if (error) {
    console.error('share endpoint rpc error:', error);
    return NextResponse.json({ error: 'Failed to load shared chat' }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: 'Shared chat not found' }, { status: 404 });
  }

  return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } });
}
