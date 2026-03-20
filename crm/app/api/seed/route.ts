import { NextResponse } from 'next/server';
import { getAccessToken } from '@/lib/auth-cookies';
import { getCurrentViewer } from '@/lib/auth-state';
import { seedDefaults } from '@/lib/queries';

export async function POST() {
  const viewer = await getCurrentViewer();
  if (!viewer.isAuthenticated || !viewer.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = await getAccessToken();
  await seedDefaults(viewer.id, token);
  return NextResponse.json({ success: true });
}
