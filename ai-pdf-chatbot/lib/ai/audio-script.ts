import 'server-only';
import type { createClient } from '@insforge/sdk';
import { UTILITY_MODEL } from './constants';

type InsforgeClient = ReturnType<typeof createClient>;

export type AudioScriptTurn = {
  speaker: 'Sarah' | 'Mike';
  text: string;
};

// Trim each document summary so the joint prompt stays under a few k
// tokens. Quality of the conversational script saturates well before
// model context limits.
const SUMMARY_CHAR_BUDGET = 600;

// Adapted from open-notebooklm (github.com/gabrielchua/open-notebooklm,
// 2.6k stars). The asymmetric host/guest framing + scratchpad-style
// brainstorm step are what stop two co-hosts from just agreeing with
// each other ("Absolutely!" / "Totally!"). Sarah interviews Mike, who
// plays the subject-matter expert, so questions and answers flow
// naturally instead of mirrored validations.
function buildPrompt(
  workspaceName: string,
  docs: Array<{ file_name: string; summary: string | null }>,
): string {
  const block = docs
    .map((d, i) => `${i + 1}. ${d.file_name}\n   ${(d.summary ?? '').slice(0, SUMMARY_CHAR_BUDGET)}`)
    .join('\n\n');

  return `You are a world-class podcast producer tasked with transforming the provided PDF summaries from a study workspace named "${workspaceName}" into an engaging and informative podcast script. The input may be unstructured or messy, sourced from PDFs. Your goal is to extract the most interesting and insightful content for a compelling podcast discussion.

# Steps to Follow:

1. **Analyze the Input:**
   Carefully examine the text, identifying key topics, points, and interesting facts or anecdotes that could drive an engaging podcast conversation. Disregard irrelevant information or formatting issues.

2. **Brainstorm Ideas (internal):**
   Before writing, mentally brainstorm ways to present the key points engagingly. Consider:
   - Analogies, storytelling techniques, or hypothetical scenarios to make content relatable
   - Ways to make complex topics accessible to a general audience
   - Thought-provoking questions to explore during the podcast
   - Creative approaches to fill any gaps in the information
   Do NOT include this brainstorm in your final output.

3. **Craft the Dialogue:**
   Develop a natural, conversational flow between the host (Sarah) and the guest speaker (Mike, a subject-matter expert on the topics in the materials). Incorporate:
   - The best ideas from your brainstorming
   - Clear explanations of complex topics
   - An engaging and lively tone to captivate listeners
   - A balance of information and entertainment

   Rules for the dialogue:
   - The host (Sarah) always initiates the conversation and interviews the guest (Mike)
   - Include thoughtful questions from the host to guide the discussion
   - Incorporate natural speech patterns, including occasional verbal fillers (e.g., "um", "well", "you know")
   - Allow for natural interruptions and back-and-forth between host and guest
   - Ensure the guest's responses are substantiated by the input text, avoiding unsupported claims
   - Reference the source PDFs by topic, not by file name
   - Maintain a PG-rated conversation appropriate for all audiences
   - The host (Sarah) concludes the conversation

4. **Summarize Key Insights:**
   Naturally weave a summary of key points into the closing part of the dialogue. This should feel like a casual conversation rather than a formal recap, reinforcing the main takeaways before signing off.

5. **Maintain Authenticity:**
   Throughout the script, strive for authenticity in the conversation. Include:
   - Moments of genuine curiosity or surprise from the host
   - Instances where the guest might briefly struggle to articulate a complex idea
   - Light-hearted moments or humor when appropriate
   - Brief personal anecdotes or examples that relate to the topic (within the bounds of the input text)

6. **Consider Pacing and Structure:**
   Ensure the dialogue has a natural ebb and flow:
   - Start with a strong hook to grab the listener's attention
   - Gradually build complexity as the conversation progresses
   - Include brief "breather" moments for listeners to absorb complex information
   - End on a high note, perhaps with a thought-provoking question or a call-to-action for listeners

IMPORTANT RULES:
- Each line of dialogue should be no more than 100 characters (about 5-8 seconds spoken).
- 10 to 18 total turns alternating between Sarah and Mike, starting with Sarah.
- Total spoken length should fit roughly 5 to 8 minutes of audio.

Return ONLY a valid JSON object with this exact schema, no scratchpad, no markdown fences, no commentary:
{"turns":[{"speaker":"Sarah","text":"..."},{"speaker":"Mike","text":"..."}]}
The "speaker" value must be exactly "Sarah" or "Mike". Begin your response directly with the opening brace.

PDF summaries:
${block}`;
}

export async function generateAudioScript(
  client: InsforgeClient,
  workspaceName: string,
  docs: Array<{ file_name: string; summary: string | null }>,
): Promise<AudioScriptTurn[]> {
  const completion = (await client.ai.chat.completions.create({
    model: UTILITY_MODEL,
    messages: [{ role: 'user', content: buildPrompt(workspaceName, docs) }],
  })) as { choices: Array<{ message: { content: string } }> };

  const raw = completion.choices?.[0]?.message?.content ?? '{}';
  return parseScript(raw);
}

function parseScript(raw: string): AudioScriptTurn[] {
  // The richer producer-style prompt sometimes leaks brainstorm text or
  // wraps JSON in code fences. Strip fences, then carve out the JSON by
  // its outermost brace pair so leading commentary doesn't break us.
  let cleaned = raw.replace(/```[a-zA-Z]*\n?/g, '').replace(/```/g, '').trim();
  const first = cleaned.indexOf('{');
  const last = cleaned.lastIndexOf('}');
  if (first >= 0 && last > first) cleaned = cleaned.slice(first, last + 1);

  try {
    const parsed = JSON.parse(cleaned) as { turns?: Array<{ speaker?: string; text?: string }> };
    const turns = Array.isArray(parsed.turns) ? parsed.turns : [];
    return turns
      .map((t) => ({
        speaker: t.speaker === 'Mike' ? 'Mike' : 'Sarah',
        text: typeof t.text === 'string' ? t.text.trim() : '',
      }))
      .filter((t): t is AudioScriptTurn => t.text.length > 0);
  } catch (err) {
    // Avoid logging raw model output: it contains PDF-derived text that
    // can leak user content to server logs. Just record the failure mode
    // and shapes so the route can surface a clean error to the caller.
    const head = cleaned.slice(0, 80);
    console.error('[audio-script] JSON parse failed', {
      error: err instanceof Error ? err.message : String(err),
      cleanedLength: cleaned.length,
      startsWith: head.startsWith('{') ? 'brace' : 'other',
    });
    return [];
  }
}
