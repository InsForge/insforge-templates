create extension if not exists pgcrypto;
create extension if not exists vector;

-- A single uploaded PDF
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  file_name text not null,
  file_size integer not null,
  mime_type text not null,
  storage_bucket text not null default 'pdf-documents',
  storage_key text not null,
  status text not null default 'processing'
    check (status in ('processing','ready','failed')),
  error text,
  page_count integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists documents_user_idx
  on public.documents (user_id, created_at desc);

-- A chunk of a PDF + its embedding
create table if not exists public.document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  user_id uuid not null,
  chunk_index integer not null,
  content text not null,
  page_number integer,
  embedding vector(1536) not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (document_id, chunk_index)
);

create index if not exists document_chunks_embedding_idx
  on public.document_chunks
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

create index if not exists document_chunks_user_idx
  on public.document_chunks (user_id);

-- Chat session
create table if not exists public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null default 'New chat',
  document_ids uuid[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_message_at timestamptz not null default now()
);

create index if not exists chat_sessions_user_idx
  on public.chat_sessions (user_id, last_message_at desc);

-- Chat message
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.chat_sessions(id) on delete cascade,
  role text not null check (role in ('system','user','assistant')),
  content text not null,
  sort_order integer not null,
  citations jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  unique (chat_id, sort_order)
);

create index if not exists chat_messages_chat_sort_idx
  on public.chat_messages (chat_id, sort_order asc);

-- Bump chat_sessions.last_message_at on each new message
create or replace function public.touch_chat_session()
returns trigger language plpgsql as $$
begin
  update public.chat_sessions
  set last_message_at = new.created_at,
      updated_at = now()
  where id = new.chat_id;
  return new;
end;
$$;

drop trigger if exists chat_messages_touch_session on public.chat_messages;
create trigger chat_messages_touch_session
after insert on public.chat_messages
for each row execute function public.touch_chat_session();

-- RAG retrieval (RLS-aware via explicit owner argument)
create or replace function public.match_document_chunks(
  query_embedding vector(1536),
  match_count integer,
  owner uuid,
  doc_filter uuid[] default null
)
returns table (
  chunk_id uuid,
  document_id uuid,
  content text,
  page_number integer,
  similarity float
)
language sql stable as $$
  select
    dc.id,
    dc.document_id,
    dc.content,
    dc.page_number,
    1 - (dc.embedding <=> query_embedding) as similarity
  from public.document_chunks dc
  where dc.user_id = owner
    and (doc_filter is null or dc.document_id = any(doc_filter))
  order by dc.embedding <=> query_embedding
  limit match_count;
$$;

-- RLS
alter table public.documents enable row level security;
alter table public.document_chunks enable row level security;
alter table public.chat_sessions enable row level security;
alter table public.chat_messages enable row level security;

drop policy if exists documents_owner on public.documents;
create policy documents_owner on public.documents
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists document_chunks_owner on public.document_chunks;
create policy document_chunks_owner on public.document_chunks
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists chat_sessions_owner on public.chat_sessions;
create policy chat_sessions_owner on public.chat_sessions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists chat_messages_owner on public.chat_messages;
create policy chat_messages_owner on public.chat_messages
  for all using (
    exists (
      select 1 from public.chat_sessions cs
      where cs.id = chat_messages.chat_id and cs.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.chat_sessions cs
      where cs.id = chat_messages.chat_id and cs.user_id = auth.uid()
    )
  );
