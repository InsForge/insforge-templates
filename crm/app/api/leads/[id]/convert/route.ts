import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken } from '@/lib/auth-cookies';
import { getCurrentViewer } from '@/lib/auth-state';
import { convertLeadToClient } from '@/lib/queries';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const viewer = await getCurrentViewer();
  if (!viewer.isAuthenticated || !viewer.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const { clientName, clientCode, dealValue, notes } = await request.json();
  const token = await getAccessToken();

  const client = await convertLeadToClient(
    id,
    { name: clientName, client_code: clientCode, user_id: viewer.id },
    dealValue,
    notes,
    token,
  );

  return NextResponse.json(client, { status: 201 });
}
