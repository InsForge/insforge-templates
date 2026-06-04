import 'server-only';
import type { createClient } from '@insforge/sdk';
import { embedTexts } from '@/lib/ai/embeddings';
import { MATCH_CHUNK_COUNT } from '@/lib/ai/constants';
import type { RetrievedChunk } from './format';

export type { Citation, RetrievedChunk } from './format';
export { buildContextString, toCitations } from './format';

type InsforgeClient = ReturnType<typeof createClient>;

export async function retrieveForQuestion(
  client: InsforgeClient,
  ownerId: string,
  question: string,
  documentIds?: string[],
  workspaceId?: string | null,
): Promise<RetrievedChunk[]> {
  const [embedding] = await embedTexts(client, [question]);

  const { data, error } = await client.database
    .from('documents')
    .select('id, file_name');

  if (error) throw new Error(error.message ?? 'Failed to load documents');
  const nameById = new Map<string, string>(
    (data ?? []).map((d: { id: string; file_name: string }) => [d.id, d.file_name]),
  );

  const rpcRes = await client.database.rpc('match_document_chunks', {
    query_embedding: embedding,
    match_count: MATCH_CHUNK_COUNT,
    owner: ownerId,
    doc_filter: documentIds && documentIds.length > 0 ? documentIds : null,
    workspace_filter: workspaceId ?? null,
  });

  if (rpcRes.error) throw new Error(rpcRes.error.message ?? 'Vector search failed');

  type RpcRow = {
    chunk_id: string;
    document_id: string;
    content: string;
    page_number: number | null;
    similarity: number;
  };
  const rows: RpcRow[] = (rpcRes.data ?? []) as RpcRow[];

  return rows.map((r) => ({
    chunk_id: r.chunk_id,
    document_id: r.document_id,
    file_name: nameById.get(r.document_id) ?? 'document.pdf',
    page_number: r.page_number,
    content: r.content,
    similarity: r.similarity,
  }));
}
