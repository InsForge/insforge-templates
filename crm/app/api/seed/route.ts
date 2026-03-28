import { NextResponse } from 'next/server';
import { getAuthenticatedSession } from '@/lib/auth-state';
import { seedDefaults } from '@/lib/queries';

export async function POST() {
  const { viewer, accessToken } = await getAuthenticatedSession();
  if (!viewer.isAuthenticated || !viewer.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await seedDefaults(viewer.id, accessToken);
  return NextResponse.json({ success: true });
}
