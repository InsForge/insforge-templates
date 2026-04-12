-- Create the todo table if it doesn't exist
CREATE TABLE IF NOT EXISTS todo (
  id SERIAL PRIMARY KEY,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_completed BOOLEAN NOT NULL DEFAULT FALSE
);
