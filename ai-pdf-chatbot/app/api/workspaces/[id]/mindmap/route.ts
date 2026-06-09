import { NextResponse } from 'next/server';
import { createInsforgeServerClient } from '@/lib/insforge';
import { getCurrentAuthState } from '@/lib/auth-state';
import { UTILITY_MODEL } from '@/lib/ai/constants';
import { getPostHogClient } from '@/lib/posthog-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Hard cap on how much of each document summary we feed the LLM. Mindmap
// quality saturates quickly past a few sentences per doc; raising this
// just burns tokens.
const SUMMARY_CHAR_BUDGET = 600;

function buildPrompt(workspaceName: string, docs: Array<{ file_name: string; summary: string | null }>): string {
  const docBlock = docs
    .map((d, i) => `${i + 1}. ${d.file_name}\n   ${(d.summary ?? '').slice(0, SUMMARY_CHAR_BUDGET)}`)
    .join('\n\n');

  return `You build mindmaps from study materials. Below are PDF summaries grouped under a workspace named "${workspaceName}". Produce a Markmap-compatible mindmap as Markdown:

- Use "#" for the top-level node (the workspace topic).
- Use "##", "###", "####" for nested topics.
- 3 to 5 levels deep.
- 10 to 30 leaf nodes total.
- Group related ideas across documents under shared parent nodes; don't just list documents.
- Concise leaves: short noun phrases, not full sentences.
- Output ONLY the Markdown. No commentary, no code fences.

PDF summaries:
${docBlock}`;
}

// POST regenerates the mindmap and caches the result on workspaces.
// GET returns the cached markdown (or null) so the client can decide
// whether to call POST. Keeping write separate from read makes the
// "regenerate" affordance obvious.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await getCurrentAuthState();
  if (!auth.viewer.isAuthenticated || !auth.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const client = createInsforgeServerClient({ accessToken: auth.accessToken });

  const wsRes = await client.database
    .from('workspaces')
    .select('id, name')
    .eq('id', id)
    .single();
  if (wsRes.error || !wsRes.data) {
    return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
  }
  const ws = wsRes.data as { id: string; name: string };

  const docsRes = await client.database
    .from('documents')
    .select('file_name, summary')
    .eq('workspace_id', id)
    .eq('status', 'ready');
  if (docsRes.error) {
    return NextResponse.json({ error: docsRes.error.message }, { status: 500 });
  }
  const docs = (docsRes.data ?? []) as Array<{ file_name: string; summary: string | null }>;
  if (docs.length === 0) {
    return NextResponse.json(
      { error: 'Add at least one ready document to this workspace before generating a mindmap.' },
      { status: 409 },
    );
  }

  const completion = (await client.ai.chat.completions.create({
    model: UTILITY_MODEL,
    messages: [{ role: 'user', content: buildPrompt(ws.name, docs) }],
  })) as { choices: Array<{ message: { content: string } }> };

  const raw = completion.choices?.[0]?.message?.content ?? '';
  const markdown = raw
    .replace(/```[a-zA-Z]*\n?/g, '')
    .replace(/```/g, '')
    .trim();
  if (!markdown) {
    return NextResponse.json({ error: 'Empty mindmap response' }, { status: 500 });
  }

  const now = new Date().toISOString();
  const upd = await client.database
    .from('workspaces')
    .update({ mindmap_markdown: markdown, mindmap_generated_at: now, updated_at: now })
    .eq('id', id);
  if (upd.error) return NextResponse.json({ error: upd.error.message }, { status: 500 });

  const posthog = getPostHogClient();
  posthog.capture({
    distinctId: auth.viewer.id ?? 'anonymous',
    event: 'mindmap_generated',
    properties: { workspace_id: id, workspace_name: ws.name, document_count: docs.length },
  });
  await posthog.shutdown();

  return NextResponse.json({ markdown, generated_at: now });
}
