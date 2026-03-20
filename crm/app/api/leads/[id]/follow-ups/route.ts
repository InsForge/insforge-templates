import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken } from '@/lib/auth-cookies';
import { getCurrentViewer } from '@/lib/auth-state';
import { getLeadFollowUps, addLeadFollowUp, completeFollowUp } from '@/lib/queries';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const viewer = await getCurrentViewer();
  if (!viewer.isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const token = await getAccessToken();
  const followUps = await getLeadFollowUps(id, token);
  return NextResponse.json(followUps);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const viewer = await getCurrentViewer();
  if (!viewer.isAuthenticated || !viewer.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const token = await getAccessToken();

  const followUp = await addLeadFollowUp({ ...body, lead_id: id, user_id: viewer.id }, token);
  return NextResponse.json(followUp, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const viewer = await getCurrentViewer();
  if (!viewer.isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { followUpId } = await request.json();
  const token = await getAccessToken();

  await completeFollowUp(followUpId, token);
  return NextResponse.json({ success: true });
}
