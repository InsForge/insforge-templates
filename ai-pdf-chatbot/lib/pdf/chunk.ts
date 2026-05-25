import type { ParsedPage } from './parse';

export type Chunk = {
  index: number;
  page: number;
  content: string;
};

export type ChunkOptions = {
  size: number;
  overlap: number;
};

const DEFAULTS: ChunkOptions = { size: 800, overlap: 100 };

const PARAGRAPH = /\n{2,}/;
const SENTENCE = /(?<=[.!?])\s+(?=[A-Z0-9"'(])/;

function splitRecursive(text: string, size: number): string[] {
  if (text.length <= size) return [text];

  const paragraphs = text.split(PARAGRAPH);
  if (paragraphs.length > 1) {
    return paragraphs.flatMap((p) => splitRecursive(p, size));
  }

  const sentences = text.split(SENTENCE);
  if (sentences.length > 1) {
    return sentences.flatMap((s) => splitRecursive(s, size));
  }

  const out: string[] = [];
  for (let i = 0; i < text.length; i += size) {
    out.push(text.slice(i, i + size));
  }
  return out;
}

function mergeWithOverlap(parts: string[], size: number, overlap: number): string[] {
  const chunks: string[] = [];
  let current = '';

  for (const part of parts) {
    if (!part.trim()) continue;
    if (current.length === 0) {
      current = part;
      continue;
    }
    if (current.length + 1 + part.length <= size) {
      current = `${current} ${part}`;
    } else {
      chunks.push(current);
      const tail = overlap > 0 && current.length > overlap ? current.slice(-overlap) : '';
      current = tail ? `${tail} ${part}` : part;
    }
  }
  if (current.trim()) chunks.push(current);
  return chunks;
}

export function chunkPages(
  pages: ParsedPage[],
  options: Partial<ChunkOptions> = {},
): Chunk[] {
  const { size, overlap } = { ...DEFAULTS, ...options };
  const chunks: Chunk[] = [];
  let runningIndex = 0;

  for (const { page, text } of pages) {
    const trimmed = text.trim();
    if (!trimmed) continue;

    const parts = splitRecursive(trimmed, size);
    const merged = mergeWithOverlap(parts, size, overlap);

    for (const content of merged) {
      chunks.push({ index: runningIndex++, page, content });
    }
  }

  return chunks;
}
