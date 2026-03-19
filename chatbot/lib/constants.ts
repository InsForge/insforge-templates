export const DEFAULT_MODEL = 'openai/gpt-4o-mini';

export const UPLOAD_BUCKET = 'chat-attachments';
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/plain',
  'text/csv',
  'text/markdown',
  'text/x-markdown',
];

const EXTENSION_TO_MIME_TYPE: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain',
  '.csv': 'text/csv',
  '.md': 'text/markdown',
  '.markdown': 'text/markdown',
};

export const FILE_INPUT_ACCEPT = [...ALLOWED_MIME_TYPES, '.md', '.markdown'].join(',');

export function resolveAttachmentMimeType(fileName: string, mimeType: string) {
  const normalizedMimeType = mimeType.trim().toLowerCase();
  if (ALLOWED_MIME_TYPES.includes(normalizedMimeType)) {
    return normalizedMimeType;
  }

  const normalizedFileName = fileName.trim().toLowerCase();
  for (const [extension, inferredMimeType] of Object.entries(EXTENSION_TO_MIME_TYPE)) {
    if (normalizedFileName.endsWith(extension)) {
      return inferredMimeType;
    }
  }

  return normalizedMimeType;
}

export function isAllowedAttachmentFile(file: { name: string; type: string }) {
  return ALLOWED_MIME_TYPES.includes(resolveAttachmentMimeType(file.name, file.type));
}

export const MODEL_OPTIONS = [
  { id: 'openai/gpt-4o-mini', label: 'GPT-4o mini' },
  { id: 'anthropic/claude-sonnet-4.5', label: 'Claude Sonnet 4.5' },
  { id: 'deepseek/deepseek-v3.2', label: 'DeepSeek V3.2' },
  { id: 'minimax/minimax-m2.1', label: 'MiniMax M2.1' },
  { id: 'x-ai/grok-4.1-fast', label: 'Grok 4.1 Fast' },
  { id: 'google/gemini-3-pro-image-preview', label: 'Gemini 3 Pro' },
] as const;

export const SUGGESTED_PROMPTS = [
  {
    title: 'Launch Plan',
    prompt:
      'Help me turn a rough product idea into a launch plan with milestones, risks, and first-week experiments.',
  },
  {
    title: 'Support Reply',
    prompt:
      'Write a thoughtful support reply to a customer who hit a login bug after changing their email address.',
  },
  {
    title: 'Technical Breakdown',
    prompt:
      'Explain event-driven architecture to a product manager using practical examples and tradeoffs.',
  },
];
