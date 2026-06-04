import 'server-only';
import type { createClient } from '@insforge/sdk';
import { after } from 'next/server';
import { parsePdf } from '@/lib/pdf/parse';
import { chunkPages } from '@/lib/pdf/chunk';
import { embedTexts } from '@/lib/ai/embeddings';
import { generateDocumentInsights } from '@/lib/ai/document-insights';

type InsforgeClient = ReturnType<typeof createClient>;

export type IngestResult =
  | { status: 'ready'; chunkCount: number; pageCount: number }
  | { status: 'failed'; error: string };

export async function ingestPdf(
  client: InsforgeClient,
  params: {
    userId: string;
    documentId: string;
    fileName: string;
    buffer: ArrayBuffer | Uint8Array;
  },
): Promise<IngestResult> {
  const { userId, documentId, fileName, buffer } = params;
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

    // Auto-summary + suggested questions runs AFTER the response is
    // sent. `next/server`'s `after()` keeps the runtime alive on
    // serverless platforms (Vercel etc.) so the LLM call + DB update
    // can finish — a plain `void promise.then()` would be cut by the
    // function-context termination. Failure is non-fatal: the doc is
    // still queryable for chat, only the "skim help" stays empty.
    const fullText = pages.map((p) => p.text).join('\n\n');
    after(
      generateDocumentInsights(client, fileName, fullText)
        .then(async ({ summary, questions }) => {
          if (!summary && questions.length === 0) return;
          await client.database
            .from('documents')
            .update({
              ...(summary ? { summary } : {}),
              ...(questions.length > 0 ? { suggested_questions: questions } : {}),
              updated_at: new Date().toISOString(),
            })
            .eq('id', documentId);
        })
        .catch(() => undefined),
    );

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
