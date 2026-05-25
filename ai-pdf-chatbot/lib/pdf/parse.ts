import 'server-only';
import { extractText, getDocumentProxy } from 'unpdf';

export type ParsedPage = { page: number; text: string };

export async function parsePdf(buffer: ArrayBuffer | Uint8Array): Promise<{
  pages: ParsedPage[];
  pageCount: number;
}> {
  const data = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  const doc = await getDocumentProxy(data);
  const { totalPages, text } = await extractText(doc, { mergePages: false });

  const pages: ParsedPage[] = text.map((pageText, i) => ({
    page: i + 1,
    text: pageText.replace(/\s+/g, ' ').trim(),
  }));

  return { pages, pageCount: totalPages };
}
