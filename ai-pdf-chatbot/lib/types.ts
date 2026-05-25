export type AuthViewer = {
  isAuthenticated: boolean;
  id: string | null;
  email: string | null;
  name: string | null;
};

export type DocumentRow = {
  id: string;
  user_id: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  storage_bucket: string;
  storage_key: string;
  status: 'processing' | 'ready' | 'failed';
  error: string | null;
  page_count: number | null;
  created_at: string;
  updated_at: string;
};

export type ChatSessionRow = {
  id: string;
  user_id: string;
  title: string;
  document_ids: string[];
  created_at: string;
  updated_at: string;
  last_message_at: string;
};

export type ChatMessageRow = {
  id: string;
  chat_id: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
  sort_order: number;
  citations: Array<{
    marker: number;
    chunk_id: string;
    document_id: string;
    file_name: string;
    page_number: number | null;
    snippet: string;
  }>;
  created_at: string;
};
