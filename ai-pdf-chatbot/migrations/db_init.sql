-- Single bootstrap file auto-applied by `npx @insforge/cli link`. Order:
-- 1) Extensions + Better Auth schema + requesting_user_id() helper
-- 2) App tables, indexes, triggers, the match_document_chunks RPC
-- 3) RLS policies on app tables AND on storage.objects (per-bucket grants)
--
-- After this lands, `npm run auth:migrate` populates better_auth.{user,
-- session,account,verification} via Better Auth's own Kysely migrations.

-- ivfflat index creation on document_chunks.embedding needs more than the
-- 16MB default maintenance_work_mem on InsForge cloud. Bump it for this
-- session so `CREATE INDEX ... ivfflat` doesn't fail with "memory required".
set maintenance_work_mem = '128MB';

create extension if not exists pgcrypto;
create extension if not exists vector;

-- Better Auth's tables live in a dedicated schema. PostgREST exposes only
-- `public` by default, so anything under `better_auth` is hidden from the
-- InsForge data API automatically — no REVOKE step needed.
create schema if not exists better_auth;

-- RLS policies read the BA-signed `sub` claim via auth.jwt(). The HS256
-- bridge JWT minted by /api/insforge-token (and lib/auth-state.ts) carries
-- `{ sub: <BA user.id>, role: "authenticated", aud: "insforge-api" }`.
create or replace function public.requesting_user_id()
returns text
language sql stable
as $$
  select nullif(current_setting('request.jwt.claims', true)::json->>'sub', '')::text
$$;

-- user_id columns are `text` because Better Auth issues string IDs (the
-- same `sub` claim the bridge JWT carries).

-- NotebookLM-style container that groups PDFs + chats + mindmap + flashcards
-- + audio overview together. All downstream tables (documents, chat_sessions,
-- document_flashcards) carry a nullable workspace_id so legacy rows still
-- live under "Unsorted" until the user organizes them.
create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  name text not null,
  description text,
  -- Cached LLM artifacts so the mindmap/audio surfaces don't re-bill on
  -- every visit. Cleared by the "Regenerate" actions on each tab.
  mindmap_markdown text,
  mindmap_generated_at timestamptz,
  audio_url text,
  audio_script jsonb,
  audio_generated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists workspaces_user_idx
  on public.workspaces (user_id, updated_at desc);

-- A single uploaded PDF
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  workspace_id uuid references public.workspaces(id) on delete set null,
  file_name text not null,
  file_size integer not null,
  mime_type text not null,
  storage_bucket text not null default 'pdf-documents',
  storage_key text not null,
  status text not null default 'processing'
    check (status in ('processing','ready','failed')),
  error text,
  page_count integer,
  summary text,
  suggested_questions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Idempotent column adds for projects whose `documents` table predates
-- the summary / suggested_questions / workspace_id fields.
alter table public.documents add column if not exists summary text;
alter table public.documents add column if not exists suggested_questions jsonb not null default '[]'::jsonb;
alter table public.documents add column if not exists workspace_id uuid references public.workspaces(id) on delete set null;

create index if not exists documents_user_idx
  on public.documents (user_id, created_at desc);

create index if not exists documents_workspace_idx
  on public.documents (workspace_id) where workspace_id is not null;

-- A chunk of a PDF + its embedding
create table if not exists public.document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  user_id text not null,
  chunk_index integer not null,
  content text not null,
  page_number integer,
  embedding vector(1536) not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (document_id, chunk_index)
);

-- HNSW, not ivfflat: ivfflat with lists=100 partitions vectors into 100
-- clusters and probes 1 by default, which collapses recall to near zero
-- when a user only has a handful of chunks (typical here: one PDF, 6-300
-- chunks per user). HNSW has no cluster count to mistune and holds 95%+
-- recall at any collection size.
drop index if exists document_chunks_embedding_idx;
create index if not exists document_chunks_embedding_hnsw_idx
  on public.document_chunks
  using hnsw (embedding vector_cosine_ops);

create index if not exists document_chunks_user_idx
  on public.document_chunks (user_id);

-- Chat session
create table if not exists public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  workspace_id uuid references public.workspaces(id) on delete set null,
  title text not null default 'New chat',
  document_ids uuid[] not null default '{}',
  share_token text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_message_at timestamptz not null default now()
);

alter table public.chat_sessions add column if not exists share_token text;
alter table public.chat_sessions add column if not exists workspace_id uuid references public.workspaces(id) on delete set null;
create unique index if not exists chat_sessions_share_token_idx
  on public.chat_sessions (share_token) where share_token is not null;

create index if not exists chat_sessions_user_idx
  on public.chat_sessions (user_id, last_message_at desc);

create index if not exists chat_sessions_workspace_idx
  on public.chat_sessions (workspace_id) where workspace_id is not null;

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

-- Flashcards generated from a document. Lives in its own table so the
-- documents row stays cheap to fetch in lists and the cards can be
-- regenerated/extended independently. Carries SM-2 lite SRS state so a
-- workspace-wide review queue can pull due cards across all documents.
create table if not exists public.document_flashcards (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  workspace_id uuid references public.workspaces(id) on delete set null,
  user_id text not null,
  question text not null,
  answer text not null,
  sort_order integer not null,
  due_at timestamptz not null default now(),
  last_grade smallint,
  ease real not null default 2.5,
  interval_days real not null default 0,
  reps integer not null default 0,
  created_at timestamptz not null default now(),
  unique (document_id, sort_order)
);

-- Idempotent adds for projects whose flashcards table predates SRS state.
alter table public.document_flashcards add column if not exists workspace_id uuid references public.workspaces(id) on delete set null;
alter table public.document_flashcards add column if not exists due_at timestamptz not null default now();
alter table public.document_flashcards add column if not exists last_grade smallint;
alter table public.document_flashcards add column if not exists ease real not null default 2.5;
alter table public.document_flashcards add column if not exists interval_days real not null default 0;
alter table public.document_flashcards add column if not exists reps integer not null default 0;

create index if not exists document_flashcards_doc_idx
  on public.document_flashcards (document_id, sort_order asc);

create index if not exists document_flashcards_due_idx
  on public.document_flashcards (user_id, due_at);

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

-- RAG retrieval (RLS-aware via explicit owner argument — text now, to
-- match the user_id column type and the BA-bridged JWT sub claim).
-- workspace_filter scopes retrieval to a single workspace's documents
-- when set; doc_filter further narrows within that workspace.
create or replace function public.match_document_chunks(
  query_embedding vector(1536),
  match_count integer,
  owner text,
  doc_filter uuid[] default null,
  workspace_filter uuid default null
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
  join public.documents d on d.id = dc.document_id
  where dc.user_id = owner
    and (doc_filter is null or dc.document_id = any(doc_filter))
    and (workspace_filter is null or d.workspace_id = workspace_filter)
  order by dc.embedding <=> query_embedding
  limit match_count;
$$;

-- RLS — policies read the BA `sub` claim through requesting_user_id().
alter table public.workspaces enable row level security;
alter table public.documents enable row level security;
alter table public.document_chunks enable row level security;
alter table public.chat_sessions enable row level security;
alter table public.chat_messages enable row level security;
alter table public.document_flashcards enable row level security;

drop policy if exists workspaces_owner on public.workspaces;
create policy workspaces_owner on public.workspaces
  for all
  using (user_id = public.requesting_user_id())
  with check (user_id = public.requesting_user_id());

drop policy if exists documents_owner on public.documents;
create policy documents_owner on public.documents
  for all
  using (user_id = public.requesting_user_id())
  with check (user_id = public.requesting_user_id());

drop policy if exists document_chunks_owner on public.document_chunks;
create policy document_chunks_owner on public.document_chunks
  for all
  using (user_id = public.requesting_user_id())
  with check (user_id = public.requesting_user_id());

drop policy if exists chat_sessions_owner on public.chat_sessions;
create policy chat_sessions_owner on public.chat_sessions
  for all
  using (user_id = public.requesting_user_id())
  with check (user_id = public.requesting_user_id());

drop policy if exists chat_messages_owner on public.chat_messages;
create policy chat_messages_owner on public.chat_messages
  for all
  using (
    exists (
      select 1 from public.chat_sessions cs
      where cs.id = chat_messages.chat_id
        and cs.user_id = public.requesting_user_id()
    )
  )
  with check (
    exists (
      select 1 from public.chat_sessions cs
      where cs.id = chat_messages.chat_id
        and cs.user_id = public.requesting_user_id()
    )
  );

drop policy if exists document_flashcards_owner on public.document_flashcards;
create policy document_flashcards_owner on public.document_flashcards
  for all
  using (user_id = public.requesting_user_id())
  with check (user_id = public.requesting_user_id());

-- Share-link reads — SECURITY DEFINER gate so anyone with the token can
-- read a shared chat without granting anon SELECT on chat_sessions
-- broadly. Run as the function owner (postgres), bypasses RLS, returns
-- only the chat + its messages when the token matches.
create or replace function public.get_shared_chat(p_token text)
returns json
language sql stable security definer
set search_path = public
as $$
  select case
    when cs.id is null then null
    else json_build_object(
      'chat', json_build_object(
        'id', cs.id,
        'title', cs.title,
        'created_at', cs.created_at,
        'last_message_at', cs.last_message_at
      ),
      'messages', coalesce(
        (select json_agg(
          json_build_object(
            'id', cm.id,
            'role', cm.role,
            'content', cm.content,
            'sort_order', cm.sort_order,
            'citations', cm.citations,
            'created_at', cm.created_at
          )
          order by cm.sort_order asc
        )
        from public.chat_messages cm
        where cm.chat_id = cs.id),
        '[]'::json
      )
    )
  end
  from public.chat_sessions cs
  where cs.share_token = p_token
  limit 1;
$$;

grant execute on function public.get_shared_chat(text) to anon, authenticated;

-- storage.objects RLS — InsForge fresh projects only ship a project_admin
-- policy on storage.objects, so authenticated users can't upload even into
-- buckets they "own". Add per-bucket policies scoped to uploaded_by =
-- requesting_user_id() (the JWT sub) so a signed-in user can manage their
-- own PDFs in pdf-documents and nothing else.
drop policy if exists pdf_documents_owner_insert on storage.objects;
create policy pdf_documents_owner_insert on storage.objects
  for insert to authenticated
  with check (bucket = 'pdf-documents' and uploaded_by = public.requesting_user_id());

drop policy if exists pdf_documents_owner_select on storage.objects;
create policy pdf_documents_owner_select on storage.objects
  for select to authenticated
  using (bucket = 'pdf-documents' and uploaded_by = public.requesting_user_id());

drop policy if exists pdf_documents_owner_delete on storage.objects;
create policy pdf_documents_owner_delete on storage.objects
  for delete to authenticated
  using (bucket = 'pdf-documents' and uploaded_by = public.requesting_user_id());

-- audio-overviews bucket — generated podcast-style summaries per workspace.
-- Public read so the <audio> tag works without a signed URL; owner-only
-- writes/deletes so users can't poison each other's audio.
drop policy if exists audio_overviews_public_read on storage.objects;
create policy audio_overviews_public_read on storage.objects
  for select to anon, authenticated
  using (bucket = 'audio-overviews');

drop policy if exists audio_overviews_owner_insert on storage.objects;
create policy audio_overviews_owner_insert on storage.objects
  for insert to authenticated
  with check (bucket = 'audio-overviews' and uploaded_by = public.requesting_user_id());

drop policy if exists audio_overviews_owner_delete on storage.objects;
create policy audio_overviews_owner_delete on storage.objects
  for delete to authenticated
  using (bucket = 'audio-overviews' and uploaded_by = public.requesting_user_id());

-- PostgREST caches the table schema on startup and does NOT auto-refresh
-- after a freshly-imported migration. Without this notify, the SDK hits
-- 404 ("Cannot POST /api/database/<new_table>") until the gateway is
-- restarted. Sending NOTIFY pgrst makes the gateway reload immediately.
notify pgrst, 'reload schema';
