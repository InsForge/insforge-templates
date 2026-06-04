import 'server-only';
import type { createClient } from '@insforge/sdk';
import { FLASHCARD_COUNT, SUGGESTED_QUESTION_COUNT, UTILITY_MODEL } from './constants';

type InsforgeClient = ReturnType<typeof createClient>;

// Cap the prompt context: 4 pages or ~12k chars is enough for a summary
// and to anchor question/flashcard generation. Saves cost; full ingestion
// already happened separately via the chunk+embed pipeline.
const MAX_CONTEXT_CHARS = 12_000;

function buildContext(fullText: string): string {
  if (fullText.length <= MAX_CONTEXT_CHARS) return fullText;
  return fullText.slice(0, MAX_CONTEXT_CHARS);
}

// One-shot summary + suggested-questions for a PDF. The model returns a
// strict JSON envelope so we can store both fields without a second call.
export async function generateDocumentInsights(
  client: InsforgeClient,
  fileName: string,
  fullText: string,
): Promise<{ summary: string; questions: string[] }> {
  const context = buildContext(fullText);
  const prompt = `You are helping a reader skim a PDF named "${fileName}". From the excerpt below, produce:
1. A one-paragraph summary (max 200 characters), neutral tone.
2. ${SUGGESTED_QUESTION_COUNT} questions a reader would naturally ask the document, phrased as full sentences ending in "?".

Return ONLY a JSON object: {"summary":"...","questions":["...","..."]}. No markdown fences.

PDF excerpt:
${context}`;

  const res = (await client.ai.chat.completions.create({
    model: UTILITY_MODEL,
    messages: [{ role: 'user', content: prompt }],
  })) as { choices: Array<{ message: { content: string } }> };

  const raw = res.choices?.[0]?.message?.content ?? '{}';
  return parseInsights(raw);
}

export async function generateFlashcards(
  client: InsforgeClient,
  fileName: string,
  fullText: string,
): Promise<Array<{ question: string; answer: string }>> {
  const context = buildContext(fullText);
  const prompt = `You are creating study flashcards from a PDF named "${fileName}". From the excerpt below, produce ${FLASHCARD_COUNT} flashcards. Each card has a short factual question and a concise answer (1-2 sentences) drawn directly from the text — no speculation.

Return ONLY a JSON object: {"cards":[{"question":"...","answer":"..."}]}. No markdown fences.

PDF excerpt:
${context}`;

  const res = (await client.ai.chat.completions.create({
    model: UTILITY_MODEL,
    messages: [{ role: 'user', content: prompt }],
  })) as { choices: Array<{ message: { content: string } }> };

  const raw = res.choices?.[0]?.message?.content ?? '{}';
  return parseFlashcards(raw);
}

// Strip ```json ... ``` fences and stray prose around the JSON object.
// LLM sometimes wraps despite the explicit "no markdown fences" rule.
function extractJson(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenced) return fenced[1].trim();
  const first = raw.indexOf('{');
  const last = raw.lastIndexOf('}');
  if (first >= 0 && last > first) return raw.slice(first, last + 1);
  return raw;
}

function parseInsights(raw: string): { summary: string; questions: string[] } {
  try {
    const obj = JSON.parse(extractJson(raw)) as { summary?: unknown; questions?: unknown };
    const summary = typeof obj.summary === 'string' ? obj.summary.trim() : '';
    const questions = Array.isArray(obj.questions)
      ? obj.questions
          .filter((q): q is string => typeof q === 'string' && q.trim().length > 0)
          .slice(0, SUGGESTED_QUESTION_COUNT)
      : [];
    return { summary, questions };
  } catch {
    return { summary: '', questions: [] };
  }
}

function parseFlashcards(raw: string): Array<{ question: string; answer: string }> {
  try {
    const obj = JSON.parse(extractJson(raw)) as { cards?: unknown };
    if (!Array.isArray(obj.cards)) return [];
    return obj.cards
      .filter(
        (c): c is { question: string; answer: string } =>
          !!c &&
          typeof c === 'object' &&
          typeof (c as { question?: unknown }).question === 'string' &&
          typeof (c as { answer?: unknown }).answer === 'string',
      )
      .map((c) => ({ question: c.question.trim(), answer: c.answer.trim() }))
      .filter((c) => c.question && c.answer)
      .slice(0, FLASHCARD_COUNT);
  } catch {
    return [];
  }
}
