import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken } from '@/lib/auth-cookies';
import { getCurrentViewer } from '@/lib/auth-state';
import { getProjects, addProject } from '@/lib/queries';

export async function GET(request: NextRequest) {
  const viewer = await getCurrentViewer();
  if (!viewer.isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const page = searchParams.get('page') ? Number(searchParams.get('page')) : undefined;
  const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined;
  const token = await getAccessToken();

  const result = await getProjects(token, page, limit);
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const viewer = await getCurrentViewer();
  if (!viewer.isAuthenticated || !viewer.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const token = await getAccessToken();

  const project = await addProject({ ...body, user_id: viewer.id }, token);
  return NextResponse.json(project, { status: 201 });
}
