import { NextResponse } from 'next/server';
import { getAccessToken } from '@/lib/auth-cookies';
import { getCurrentViewer } from '@/lib/auth-state';
import { getLeadSources } from '@/lib/queries';

export async function GET() {
  const viewer = await getCurrentViewer();
  if (!viewer.isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = await getAccessToken();
  const sources = await getLeadSources(token);
  return NextResponse.json(sources);
}
