create extension if not exists pgcrypto;

insert into storage.buckets (name, public)
values ('chat-attachments', true)
on conflict (name) do update
set public = excluded.public,
    updated_at = now();

create table if not exists public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  visitor_id uuid,
  user_id uuid,
  title text not null default 'New chat',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_message_at timestamptz not null default now(),
  constraint chat_sessions_title_not_blank check (btrim(title) <> ''),
  constraint chat_sessions_owner_check check (
    (visitor_id is not null and user_id is null)
    or (visitor_id is null and user_id is not null)
  )
);

alter table public.chat_sessions
  alter column visitor_id drop not null;

alter table public.chat_sessions
  add column if not exists user_id uuid;

alter table public.chat_sessions
  drop column if exists model;

alter table public.chat_sessions
  drop constraint if exists chat_sessions_owner_check;

alter table public.chat_sessions
  add constraint chat_sessions_owner_check check (
    (visitor_id is not null and user_id is null)
    or (visitor_id is null and user_id is not null)
  );

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.chat_sessions(id) on delete cascade,
  role text not null,
  content text not null,
  sort_order integer not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint chat_messages_role_check check (role in ('system', 'user', 'assistant')),
  constraint chat_messages_content_not_blank check (btrim(content) <> ''),
  constraint chat_messages_sort_order_non_negative check (sort_order >= 0),
  constraint chat_messages_unique_sort unique (chat_id, sort_order)
);

create table if not exists public.chat_attachments (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.chat_messages(id) on delete cascade,
  bucket text not null default 'chat-attachments',
  key text not null,
  url text not null,
  file_name text not null,
  file_size integer not null,
  mime_type text not null,
  created_at timestamptz not null default now(),
  constraint chat_attachments_key_not_blank check (btrim(key) <> ''),
  constraint chat_attachments_file_size_positive check (file_size > 0)
);

drop index if exists chat_sessions_visitor_last_message_idx;

create index if not exists chat_sessions_visitor_last_message_idx
  on public.chat_sessions (visitor_id, last_message_at desc)
  where visitor_id is not null;

create index if not exists chat_sessions_user_last_message_idx
  on public.chat_sessions (user_id, last_message_at desc)
  where user_id is not null;

create index if not exists chat_messages_chat_sort_idx
  on public.chat_messages (chat_id, sort_order asc);

create index if not exists chat_messages_chat_created_idx
  on public.chat_messages (chat_id, created_at asc);

create index if not exists chat_attachments_message_idx
  on public.chat_attachments (message_id);

create or replace function public.sync_chat_session_activity()
returns trigger
language plpgsql
as $$
begin
  update public.chat_sessions
  set last_message_at = new.created_at,
      updated_at = now()
  where id = new.chat_id;

  return new;
end;
$$;

drop trigger if exists chat_sessions_set_updated_at on public.chat_sessions;

create trigger chat_sessions_set_updated_at
before update on public.chat_sessions
for each row
execute function system.update_updated_at();

drop trigger if exists chat_messages_sync_chat_session_activity on public.chat_messages;

create trigger chat_messages_sync_chat_session_activity
after insert on public.chat_messages
for each row
execute function public.sync_chat_session_activity();

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on table public.chat_sessions to anon, authenticated;
grant select, insert, delete on table public.chat_messages to anon, authenticated;
grant select, insert on table public.chat_attachments to anon, authenticated;

alter table public.chat_sessions enable row level security;
alter table public.chat_messages enable row level security;
alter table public.chat_attachments enable row level security;

drop policy if exists "auth_user_select_own_sessions" on public.chat_sessions;
drop policy if exists "auth_user_insert_own_sessions" on public.chat_sessions;
drop policy if exists "auth_user_update_own_sessions" on public.chat_sessions;
drop policy if exists "auth_user_delete_own_sessions" on public.chat_sessions;
drop policy if exists "anon_select_visitor_sessions" on public.chat_sessions;
drop policy if exists "anon_insert_visitor_sessions" on public.chat_sessions;
drop policy if exists "anon_update_visitor_sessions" on public.chat_sessions;
drop policy if exists "anon_delete_visitor_sessions" on public.chat_sessions;

create policy "auth_user_select_own_sessions"
  on public.chat_sessions for select
  to authenticated
  using (user_id = auth.uid());

create policy "auth_user_insert_own_sessions"
  on public.chat_sessions for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "auth_user_update_own_sessions"
  on public.chat_sessions for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "auth_user_delete_own_sessions"
  on public.chat_sessions for delete
  to authenticated
  using (user_id = auth.uid());

create policy "anon_select_visitor_sessions"
  on public.chat_sessions for select
  to anon
  using (visitor_id is not null);

create policy "anon_insert_visitor_sessions"
  on public.chat_sessions for insert
  to anon
  with check (visitor_id is not null and user_id is null);

create policy "anon_update_visitor_sessions"
  on public.chat_sessions for update
  to anon
  using (visitor_id is not null)
  with check (visitor_id is not null and user_id is null);

create policy "anon_delete_visitor_sessions"
  on public.chat_sessions for delete
  to anon
  using (visitor_id is not null);

drop policy if exists "auth_user_select_own_messages" on public.chat_messages;
drop policy if exists "auth_user_insert_own_messages" on public.chat_messages;
drop policy if exists "auth_user_delete_own_messages" on public.chat_messages;
drop policy if exists "anon_select_visitor_messages" on public.chat_messages;
drop policy if exists "anon_insert_visitor_messages" on public.chat_messages;
drop policy if exists "anon_delete_visitor_messages" on public.chat_messages;

create policy "auth_user_select_own_messages"
  on public.chat_messages for select
  to authenticated
  using (
    exists (
      select 1
      from public.chat_sessions
      where chat_sessions.id = chat_messages.chat_id
        and chat_sessions.user_id = auth.uid()
    )
  );

create policy "auth_user_insert_own_messages"
  on public.chat_messages for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.chat_sessions
      where chat_sessions.id = chat_messages.chat_id
        and chat_sessions.user_id = auth.uid()
    )
  );

create policy "auth_user_delete_own_messages"
  on public.chat_messages for delete
  to authenticated
  using (
    exists (
      select 1
      from public.chat_sessions
      where chat_sessions.id = chat_messages.chat_id
        and chat_sessions.user_id = auth.uid()
    )
  );

create policy "anon_select_visitor_messages"
  on public.chat_messages for select
  to anon
  using (
    exists (
      select 1
      from public.chat_sessions
      where chat_sessions.id = chat_messages.chat_id
        and chat_sessions.visitor_id is not null
    )
  );

create policy "anon_insert_visitor_messages"
  on public.chat_messages for insert
  to anon
  with check (
    exists (
      select 1
      from public.chat_sessions
      where chat_sessions.id = chat_messages.chat_id
        and chat_sessions.visitor_id is not null
    )
  );

create policy "anon_delete_visitor_messages"
  on public.chat_messages for delete
  to anon
  using (
    exists (
      select 1
      from public.chat_sessions
      where chat_sessions.id = chat_messages.chat_id
        and chat_sessions.visitor_id is not null
    )
  );

drop policy if exists "auth_user_select_own_attachments" on public.chat_attachments;
drop policy if exists "auth_user_insert_own_attachments" on public.chat_attachments;
drop policy if exists "anon_select_visitor_attachments" on public.chat_attachments;
drop policy if exists "anon_insert_visitor_attachments" on public.chat_attachments;

create policy "auth_user_select_own_attachments"
  on public.chat_attachments for select
  to authenticated
  using (
    exists (
      select 1
      from public.chat_messages
      join public.chat_sessions on chat_sessions.id = chat_messages.chat_id
      where chat_messages.id = chat_attachments.message_id
        and chat_sessions.user_id = auth.uid()
    )
  );

create policy "auth_user_insert_own_attachments"
  on public.chat_attachments for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.chat_messages
      join public.chat_sessions on chat_sessions.id = chat_messages.chat_id
      where chat_messages.id = chat_attachments.message_id
        and chat_sessions.user_id = auth.uid()
    )
  );

create policy "anon_select_visitor_attachments"
  on public.chat_attachments for select
  to anon
  using (
    exists (
      select 1
      from public.chat_messages
      join public.chat_sessions on chat_sessions.id = chat_messages.chat_id
      where chat_messages.id = chat_attachments.message_id
        and chat_sessions.visitor_id is not null
    )
  );

create policy "anon_insert_visitor_attachments"
  on public.chat_attachments for insert
  to anon
  with check (
    exists (
      select 1
      from public.chat_messages
      join public.chat_sessions on chat_sessions.id = chat_messages.chat_id
      where chat_messages.id = chat_attachments.message_id
        and chat_sessions.visitor_id is not null
    )
  );
