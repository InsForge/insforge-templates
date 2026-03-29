export type ChatRole = 'assistant' | 'system' | 'user';

export interface Attachment {
  key: string;
  url: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

export interface ChatSummary {
  id: string;
  title: string;
  created_at: string;
  last_message_at: string;
}

export interface ChatMessage {
  id: string;
  chat_id: string;
  role: ChatRole;
  content: string;
  attachments?: Attachment[];
  created_at: string;
}

export interface ChatDetailResponse {
  chat: ChatSummary;
  messages: ChatMessage[];
}

export interface SendMessageResponse {
  chat: ChatSummary;
  userMessage: ChatMessage;
  assistantMessage: ChatMessage;
}

export type ChatStreamEvent =
  | { type: 'chat'; chat: ChatSummary }
  | { type: 'delta'; content: string }
  | { type: 'done'; payload: SendMessageResponse }
  | { type: 'error'; error: string }
  | { type: 'warning'; message: string };

export interface ChatOwner {
  userId?: string;
  visitorId?: string;
}

export interface SendMessageRequest {
  visitorId?: string;
  userId?: string;
  chatId?: string | null;
  input?: string;
  model?: string;
  attachments?: Attachment[];
}

export interface AuthViewer {
  isAuthenticated: boolean;
  id: string | null;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
}
