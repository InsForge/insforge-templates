import { NextResponse } from 'next/server';
import { getCurrentAuthState } from '@/lib/auth-state';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const auth = await getCurrentAuthState();
  return NextResponse.json({ viewer: auth.viewer });
}
