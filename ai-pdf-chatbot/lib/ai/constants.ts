export const EMBEDDING_MODEL = 'openai/text-embedding-3-small';
export const EMBEDDING_DIMENSIONS = 1536;
export const CHAT_MODEL = 'openai/gpt-4o-mini';
export const EMBEDDING_BATCH_SIZE = 16;
export const MATCH_CHUNK_COUNT = 8;

// Same model used for cheap one-shot generation tasks (summary, suggested
// questions, flashcards) — keeps the demo on a single OpenRouter slug.
export const UTILITY_MODEL = 'openai/gpt-4o-mini';
export const SUGGESTED_QUESTION_COUNT = 4;
export const FLASHCARD_COUNT = 6;
