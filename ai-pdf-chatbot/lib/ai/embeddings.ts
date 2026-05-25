import 'server-only';
import type { createClient } from '@insforge/sdk';
import { EMBEDDING_MODEL, EMBEDDING_BATCH_SIZE } from './constants';

type InsforgeClient = ReturnType<typeof createClient>;

export async function embedTexts(
  client: InsforgeClient,
  texts: string[],
): Promise<number[][]> {
  if (texts.length === 0) return [];

  const out: number[][] = [];
  for (let i = 0; i < texts.length; i += EMBEDDING_BATCH_SIZE) {
    const slice = texts.slice(i, i + EMBEDDING_BATCH_SIZE);
    const result = await embedWithRetry(client, slice);
    out.push(...result);
  }
  return out;
}

async function embedWithRetry(
  client: InsforgeClient,
  inputs: string[],
  attempt = 1,
): Promise<number[][]> {
  try {
    const res = (await client.ai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: inputs,
    })) as { data: Array<{ embedding: number[] }> };
    return res.data.map((d) => d.embedding);
  } catch (err) {
    if (attempt >= 3) throw err;
    const delay = 250 * Math.pow(2, attempt - 1);
    await new Promise((r) => setTimeout(r, delay));
    return embedWithRetry(client, inputs, attempt + 1);
  }
}
