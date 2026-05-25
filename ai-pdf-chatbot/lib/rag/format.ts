export type RetrievedChunk = {
  chunk_id: string;
  document_id: string;
  file_name: string;
  page_number: number | null;
  content: string;
  similarity?: number;
};

export type Citation = {
  marker: number;
  chunk_id: string;
  document_id: string;
  file_name: string;
  page_number: number | null;
  snippet: string;
};

const SNIPPET_CHARS = 240;

export function buildContextString(chunks: RetrievedChunk[]): string {
  return chunks
    .map((c, i) => {
      const where = c.page_number != null
        ? `(${c.file_name}, page ${c.page_number})`
        : `(${c.file_name})`;
      return `[${i + 1}] ${where} ${c.content}`;
    })
    .join('\n\n');
}

export function toCitations(chunks: RetrievedChunk[]): Citation[] {
  return chunks.map((c, i) => ({
    marker: i + 1,
    chunk_id: c.chunk_id,
    document_id: c.document_id,
    file_name: c.file_name,
    page_number: c.page_number,
    snippet:
      c.content.length > SNIPPET_CHARS
        ? `${c.content.slice(0, SNIPPET_CHARS)}…`
        : c.content,
  }));
}
