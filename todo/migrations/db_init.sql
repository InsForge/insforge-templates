-- Create the todo table if it doesn't exist
CREATE TABLE IF NOT EXISTS todo (
  id SERIAL PRIMARY KEY,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  file_url TEXT,
  file_key TEXT
);

-- Grant sequence permissions so anon/authenticated can insert rows
GRANT USAGE, SELECT ON SEQUENCE todo_id_seq TO anon, authenticated;

-- Create the storage bucket for todo attachments
INSERT INTO storage.buckets (name, public)
VALUES ('todo-attachments', true)
ON CONFLICT (name) DO UPDATE
SET public = excluded.public,
    updated_at = now();
