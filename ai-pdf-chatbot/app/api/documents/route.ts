import { NextResponse } from 'next/server';
import { createInsforgeServerClient } from '@/lib/insforge';
import { getCurrentAuthState } from '@/lib/auth-state';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await getCurrentAuthState();
  if (!auth.viewer.isAuthenticated || !auth.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ?workspace=<id> scopes the list to one workspace.
  // ?workspace=unsorted returns documents with workspace_id IS NULL.
  // No param: returns all of the user's documents.
  const url = new URL(req.url);
  const workspace = url.searchParams.get('workspace');

  const client = createInsforgeServerClient({ accessToken: auth.accessToken });
  let query = client.database
    .from('documents')
    .select('id, workspace_id, file_name, file_size, mime_type, status, error, page_count, summary, suggested_questions, created_at')
    .order('created_at', { ascending: false });

  if (workspace === 'unsorted') {
    query = query.is('workspace_id', null);
  } else if (workspace) {
    query = query.eq('workspace_id', workspace);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ documents: data ?? [] });
}
