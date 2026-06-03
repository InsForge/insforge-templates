export type AuthViewer = {
  isAuthenticated: boolean;
  id: string | null;
  email: string | null;
  name: string | null;
};

export type WorkspaceRow = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  mindmap_markdown: string | null;
  mindmap_generated_at: string | null;
  audio_url: string | null;
  audio_script: AudioScriptTurn[] | null;
  audio_generated_at: string | null;
  created_at: string;
  updated_at: string;
};

export type WorkspaceSummary = {
  id: string;
  name: string;
  description: string | null;
  updated_at: string;
  document_count: number;
  chat_count: number;
  due_flashcard_count: number;
};

export type AudioScriptTurn = {
  speaker: 'Sarah' | 'Mike';
  text: string;
};

export type DocumentRow = {
  id: string;
  user_id: string;
  workspace_id: string | null;
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
  workspace_id: string | null;
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
