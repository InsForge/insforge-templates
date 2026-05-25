import 'server-only';
import type { createClient } from '@insforge/sdk';
import { parsePdf } from '@/lib/pdf/parse';
import { chunkPages } from '@/lib/pdf/chunk';
import { embedTexts } from '@/lib/ai/embeddings';

type InsforgeClient = ReturnType<typeof createClient>;

export type IngestResult =
  | { status: 'ready'; chunkCount: number; pageCount: number }
  | { status: 'failed'; error: string };

export async function ingestPdf(
  client: InsforgeClient,
  params: {
    userId: string;
    documentId: string;
    buffer: ArrayBuffer | Uint8Array;
  },
): Promise<IngestResult> {
  const { userId, documentId, buffer } = params;
  try {
    const { pages, pageCount } = await parsePdf(buffer);
    const chunks = chunkPages(pages);

    if (chunks.length === 0) {
      await markDocument(client, documentId, {
        status: 'failed',
        error: 'No extractable text in the PDF.',
        page_count: pageCount,
      });
      return { status: 'failed', error: 'No extractable text in the PDF.' };
    }

    await client.database
      .from('document_chunks')
      .delete()
      .eq('document_id', documentId);

    const embeddings = await embedTexts(
      client,
      chunks.map((c) => c.content),
    );

    if (embeddings.length !== chunks.length) {
      throw new Error('Embedding count did not match chunk count.');
    }

    const rows = chunks.map((c, i) => ({
      document_id: documentId,
      user_id: userId,
      chunk_index: c.index,
      content: c.content,
      page_number: c.page,
      embedding: embeddings[i],
    }));

    const { error: insertError } = await client.database
      .from('document_chunks')
      .insert(rows);

    if (insertError) throw new Error(insertError.message ?? 'Insert failed');

    await markDocument(client, documentId, {
      status: 'ready',
      error: null,
      page_count: pageCount,
    });

    return { status: 'ready', chunkCount: chunks.length, pageCount };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Ingestion failed.';
    await markDocument(client, documentId, { status: 'failed', error: message });
    return { status: 'failed', error: message };
  }
}

async function markDocument(
  client: InsforgeClient,
  documentId: string,
  patch: { status: 'processing' | 'ready' | 'failed'; error: string | null; page_count?: number },
) {
  await client.database
    .from('documents')
    .update({
      status: patch.status,
      error: patch.error,
      ...(patch.page_count != null ? { page_count: patch.page_count } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq('id', documentId);
}
