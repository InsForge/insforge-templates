import { NextResponse } from 'next/server';
import { createInsforgeServerClient } from '@/lib/insforge';
import { getCurrentAuthState } from '@/lib/auth-state';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Returns a short-lived presigned URL for the stored PDF so the browser
// can open it in a new tab (with a `#page=N` fragment) for citation
// viewing. Bucket is private; RLS scopes the SELECT on `documents` to
// the owner. The presigned URL embeds its own auth in the query string
// so the new-tab request doesn't need our bridge JWT.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await getCurrentAuthState();
  if (!auth.viewer.isAuthenticated || !auth.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const client = createInsforgeServerClient({ accessToken: auth.accessToken });
  const { data, error } = await client.database
    .from('documents')
    .select('storage_bucket, storage_key')
    .eq('id', id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 });
  }
  const doc = data as { storage_bucket: string; storage_key: string };

  const baseUrl = process.env.NEXT_PUBLIC_INSFORGE_BASE_URL!;
  const strategyRes = await fetch(
    `${baseUrl}/api/storage/buckets/${doc.storage_bucket}/objects/${encodeURIComponent(doc.storage_key)}/download-strategy`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${auth.accessToken}`,
      },
      body: JSON.stringify({ expiresIn: 300 }),
    },
  );

  if (!strategyRes.ok) {
    const errText = await strategyRes.text().catch(() => '');
    return NextResponse.json(
      { error: errText || `Sign failed (${strategyRes.status})` },
      { status: 500 },
    );
  }

  const strategy = (await strategyRes.json()) as { url?: string; method?: string };
  if (!strategy.url) {
    return NextResponse.json({ error: 'No URL returned' }, { status: 500 });
  }

  return NextResponse.json(
    { url: strategy.url },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
