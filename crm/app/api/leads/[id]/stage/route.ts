import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken } from '@/lib/auth-cookies';
import { getCurrentViewer } from '@/lib/auth-state';
import { updateLeadStage } from '@/lib/queries';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const viewer = await getCurrentViewer();
  if (!viewer.isAuthenticated || !viewer.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const { toStageId, notes } = await request.json();
  const token = await getAccessToken();

  await updateLeadStage(id, toStageId, viewer.id, notes, token);
  return NextResponse.json({ success: true });
}
