import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken } from '@/lib/auth-cookies';
import { getCurrentViewer } from '@/lib/auth-state';
import { getLeadActivities, addLeadActivity } from '@/lib/queries';

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
  const activities = await getLeadActivities(id, token);
  return NextResponse.json(activities);
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

  const activity = await addLeadActivity({ ...body, lead_id: id, user_id: viewer.id }, token);
  return NextResponse.json(activity, { status: 201 });
}
