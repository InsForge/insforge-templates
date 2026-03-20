import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken } from '@/lib/auth-cookies';
import { getCurrentViewer } from '@/lib/auth-state';
import { getLead, updateLead } from '@/lib/queries';

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
  const lead = await getLead(id, token);

  if (!lead) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(lead);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const viewer = await getCurrentViewer();
  if (!viewer.isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const token = await getAccessToken();

  const lead = await updateLead(id, body, token);
  return NextResponse.json(lead);
}
