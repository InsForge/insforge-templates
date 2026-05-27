-- Admin Dashboard Template — Initial Schema
-- Workspace-scoped multi-tenant SaaS scaffold.

create extension if not exists pgcrypto;

-- ============================================================================
-- TABLES
-- ============================================================================

create table if not exists public.profiles (
  user_id uuid primary key,
  name text,
  avatar_url text,
  avatar_key text,
  bio text,
  phone text,
  urls jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  owner_id uuid not null,
  created_at timestamptz not null default now(),
  constraint workspaces_name_not_blank check (btrim(name) <> ''),
  constraint workspaces_slug_format check (slug ~ '^[a-z0-9][a-z0-9-]{2,62}[a-z0-9]$')
);

create table if not exists public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null,
  role text not null default 'member',
  joined_at timestamptz not null default now(),
  invited_by uuid,
  primary key (workspace_id, user_id),
  constraint workspace_members_role_check check (role in ('owner', 'admin', 'member'))
);

create table if not exists public.workspace_invitations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  email text not null,
  role text not null default 'member',
  token text not null unique,
  expires_at timestamptz not null default now() + interval '7 days',
  accepted_at timestamptz,
  created_by uuid not null,
  created_at timestamptz not null default now(),
  constraint workspace_invitations_role_check check (role in ('admin', 'member')),
  constraint workspace_invitations_email_format check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')
);

create index if not exists workspace_invitations_workspace_idx on public.workspace_invitations(workspace_id);
create index if not exists workspace_invitations_email_idx on public.workspace_invitations(lower(email));

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'backlog',
  priority text not null default 'medium',
  label text not null default 'feature',
  due_date date,
  assignee_id uuid,
  created_by uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tasks_title_not_blank check (btrim(title) <> ''),
  constraint tasks_status_check check (status in ('backlog', 'todo', 'in_progress', 'done', 'canceled')),
  constraint tasks_priority_check check (priority in ('low', 'medium', 'high')),
  constraint tasks_label_check check (label in ('feature', 'bug', 'documentation', 'enhancement'))
);

create index if not exists tasks_workspace_idx on public.tasks(workspace_id);
create index if not exists tasks_status_idx on public.tasks(workspace_id, status);
create index if not exists tasks_created_at_idx on public.tasks(workspace_id, created_at desc);

create table if not exists public.apps_catalog (
  slug text primary key,
  name text not null,
  description text not null,
  icon_url text,
  oauth_provider text,
  display_order integer not null default 0
);

create table if not exists public.app_connections (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  app_slug text not null references public.apps_catalog(slug) on delete cascade,
  status text not null default 'connected',
  connected_at timestamptz not null default now(),
  connected_by uuid not null,
  config_json jsonb not null default '{}'::jsonb,
  unique (workspace_id, app_slug),
  constraint app_connections_status_check check (status in ('connected', 'disconnected'))
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null default 'New conversation',
  type text not null default 'group',
  created_by uuid not null,
  created_at timestamptz not null default now(),
  constraint conversations_type_check check (type in ('dm', 'group'))
);

create index if not exists conversations_workspace_idx on public.conversations(workspace_id);

create table if not exists public.conversation_members (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null,
  joined_at timestamptz not null default now(),
  last_read_at timestamptz,
  primary key (conversation_id, user_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null,
  body text not null,
  created_at timestamptz not null default now(),
  constraint messages_body_not_blank check (btrim(body) <> '')
);

create index if not exists messages_conversation_idx on public.messages(conversation_id, created_at);

create table if not exists public.display_prefs (
  user_id uuid primary key,
  theme text not null default 'system',
  font text not null default 'default',
  layout_density text not null default 'comfortable',
  sidebar_collapsed boolean not null default false,
  language text not null default 'en',
  updated_at timestamptz not null default now(),
  constraint display_prefs_theme_check check (theme in ('light', 'dark', 'system')),
  constraint display_prefs_font_check check (font in ('default', 'serif', 'mono')),
  constraint display_prefs_density_check check (layout_density in ('comfortable', 'compact'))
);

create table if not exists public.notification_prefs (
  user_id uuid not null,
  channel text not null,
  event_type text not null,
  enabled boolean not null default true,
  updated_at timestamptz not null default now(),
  primary key (user_id, channel, event_type),
  constraint notification_prefs_channel_check check (channel in ('email', 'push')),
  constraint notification_prefs_event_check check (event_type in ('mention', 'task_assigned', 'weekly_digest', 'security_alert'))
);

-- ============================================================================
-- HELPER FUNCTIONS (SECURITY DEFINER to bypass RLS recursion)
-- ============================================================================

create or replace function public.is_workspace_member(p_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.workspace_members
    where workspace_id = p_workspace_id
      and user_id = auth.uid()
  )
$$;

create or replace function public.is_workspace_admin(p_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.workspace_members
    where workspace_id = p_workspace_id
      and user_id = auth.uid()
      and role in ('owner', 'admin')
  )
$$;

create or replace function public.is_workspace_owner(p_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.workspace_members
    where workspace_id = p_workspace_id
      and user_id = auth.uid()
      and role = 'owner'
  )
$$;

create or replace function public.current_user_email()
returns text
language sql
stable
security definer
set search_path = public, auth
as $$
  select email from auth.users where id = auth.uid()
$$;

create or replace function public.is_conversation_member(p_conversation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.conversation_members
    where conversation_id = p_conversation_id
      and user_id = auth.uid()
  )
$$;

-- ============================================================================
-- ENABLE RLS
-- ============================================================================

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.workspace_invitations enable row level security;
alter table public.tasks enable row level security;
alter table public.apps_catalog enable row level security;
alter table public.app_connections enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;
alter table public.display_prefs enable row level security;
alter table public.notification_prefs enable row level security;

-- ============================================================================
-- POLICIES — profiles
-- Profiles are visible to anyone who shares a workspace with the user.
-- ============================================================================

create policy "profiles_select_workspace_peers"
  on public.profiles for select
  to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1
      from public.workspace_members wm_self
      join public.workspace_members wm_peer
        on wm_self.workspace_id = wm_peer.workspace_id
      where wm_self.user_id = auth.uid()
        and wm_peer.user_id = public.profiles.user_id
    )
  );

create policy "profiles_insert_self"
  on public.profiles for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "profiles_update_self"
  on public.profiles for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ============================================================================
-- POLICIES — workspaces
-- ============================================================================

-- Owners are included explicitly so that INSERT ... RETURNING (used by
-- PostgREST when the client chains .select()) can see the freshly-created row
-- before any workspace_members entry exists.
create policy "workspaces_select_member"
  on public.workspaces for select
  to authenticated
  using (owner_id = auth.uid() or public.is_workspace_member(id));

create policy "workspaces_insert_self_as_owner"
  on public.workspaces for insert
  to authenticated
  with check (owner_id = auth.uid());

-- WITH CHECK pins owner_id to the caller so the owner cannot transfer ownership
-- by updating workspaces alone — otherwise the SELECT policy's owner_id branch
-- would grant the new owner_id read access without a workspace_members row.
create policy "workspaces_update_owner"
  on public.workspaces for update
  to authenticated
  using (public.is_workspace_owner(id))
  with check (public.is_workspace_owner(id) and owner_id = auth.uid());

create policy "workspaces_delete_owner"
  on public.workspaces for delete
  to authenticated
  using (public.is_workspace_owner(id));

-- ============================================================================
-- POLICIES — workspace_members
-- ============================================================================

create policy "workspace_members_select_peer"
  on public.workspace_members for select
  to authenticated
  using (
    user_id = auth.uid()
    or public.is_workspace_member(workspace_id)
  );

-- Insert covers two cases:
-- (a) Workspace creation: user inserts themselves as 'owner' for a workspace they just created
-- (b) Admin inviting another user: existing admin/owner adds a row
create policy "workspace_members_insert_self_or_admin"
  on public.workspace_members for insert
  to authenticated
  with check (
    (user_id = auth.uid() and role = 'owner')
    or public.is_workspace_admin(workspace_id)
  );

create policy "workspace_members_update_admin"
  on public.workspace_members for update
  to authenticated
  using (public.is_workspace_admin(workspace_id))
  with check (public.is_workspace_admin(workspace_id));

-- Delete: admin can remove anyone, or user can remove themselves (leave workspace).
-- Owner cannot be removed by anyone other than themselves.
create policy "workspace_members_delete_admin_or_self"
  on public.workspace_members for delete
  to authenticated
  using (
    (user_id = auth.uid() and role <> 'owner')
    or (public.is_workspace_admin(workspace_id) and role <> 'owner')
  );

-- ============================================================================
-- POLICIES — workspace_invitations
-- ============================================================================

create policy "workspace_invitations_select_admin_or_invitee"
  on public.workspace_invitations for select
  to authenticated
  using (
    public.is_workspace_admin(workspace_id)
    or lower(email) = lower(public.current_user_email())
  );

create policy "workspace_invitations_insert_admin"
  on public.workspace_invitations for insert
  to authenticated
  with check (public.is_workspace_admin(workspace_id) and created_by = auth.uid());

create policy "workspace_invitations_update_admin_or_invitee"
  on public.workspace_invitations for update
  to authenticated
  using (
    public.is_workspace_admin(workspace_id)
    or lower(email) = lower(public.current_user_email())
  )
  with check (
    public.is_workspace_admin(workspace_id)
    or lower(email) = lower(public.current_user_email())
  );

create policy "workspace_invitations_delete_admin"
  on public.workspace_invitations for delete
  to authenticated
  using (public.is_workspace_admin(workspace_id));

-- ============================================================================
-- POLICIES — tasks
-- ============================================================================

create policy "tasks_select_member"
  on public.tasks for select
  to authenticated
  using (public.is_workspace_member(workspace_id));

create policy "tasks_insert_member"
  on public.tasks for insert
  to authenticated
  with check (public.is_workspace_member(workspace_id) and created_by = auth.uid());

create policy "tasks_update_member"
  on public.tasks for update
  to authenticated
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

create policy "tasks_delete_member"
  on public.tasks for delete
  to authenticated
  using (public.is_workspace_member(workspace_id));

-- ============================================================================
-- POLICIES — apps_catalog (public-read)
-- ============================================================================

create policy "apps_catalog_select_all"
  on public.apps_catalog for select
  to anon, authenticated
  using (true);

-- ============================================================================
-- POLICIES — app_connections
-- ============================================================================

create policy "app_connections_select_member"
  on public.app_connections for select
  to authenticated
  using (public.is_workspace_member(workspace_id));

create policy "app_connections_insert_member"
  on public.app_connections for insert
  to authenticated
  with check (public.is_workspace_member(workspace_id) and connected_by = auth.uid());

create policy "app_connections_update_member"
  on public.app_connections for update
  to authenticated
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

create policy "app_connections_delete_member"
  on public.app_connections for delete
  to authenticated
  using (public.is_workspace_member(workspace_id));

-- ============================================================================
-- POLICIES — conversations
-- ============================================================================

create policy "conversations_select_member"
  on public.conversations for select
  to authenticated
  using (public.is_conversation_member(id));

create policy "conversations_insert_workspace_member"
  on public.conversations for insert
  to authenticated
  with check (public.is_workspace_member(workspace_id) and created_by = auth.uid());

create policy "conversations_update_creator_or_admin"
  on public.conversations for update
  to authenticated
  using (created_by = auth.uid() or public.is_workspace_admin(workspace_id))
  with check (created_by = auth.uid() or public.is_workspace_admin(workspace_id));

create policy "conversations_delete_creator_or_admin"
  on public.conversations for delete
  to authenticated
  using (created_by = auth.uid() or public.is_workspace_admin(workspace_id));

-- ============================================================================
-- POLICIES — conversation_members
-- ============================================================================

create policy "conversation_members_select_self_or_peer"
  on public.conversation_members for select
  to authenticated
  using (
    user_id = auth.uid()
    or public.is_conversation_member(conversation_id)
  );

create policy "conversation_members_insert_self_or_creator"
  on public.conversation_members for insert
  to authenticated
  with check (
    user_id = auth.uid()
    or exists (
      select 1 from public.conversations c
      where c.id = conversation_id and c.created_by = auth.uid()
    )
  );

create policy "conversation_members_delete_self_or_creator"
  on public.conversation_members for delete
  to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.conversations c
      where c.id = conversation_id and c.created_by = auth.uid()
    )
  );

-- ============================================================================
-- POLICIES — messages
-- ============================================================================

create policy "messages_select_member"
  on public.messages for select
  to authenticated
  using (public.is_conversation_member(conversation_id));

create policy "messages_insert_member"
  on public.messages for insert
  to authenticated
  with check (
    sender_id = auth.uid()
    and public.is_conversation_member(conversation_id)
  );

create policy "messages_update_sender_recent"
  on public.messages for update
  to authenticated
  using (sender_id = auth.uid() and created_at > now() - interval '5 minutes')
  with check (sender_id = auth.uid());

create policy "messages_delete_sender_recent"
  on public.messages for delete
  to authenticated
  using (sender_id = auth.uid() and created_at > now() - interval '5 minutes');

-- ============================================================================
-- POLICIES — display_prefs, notification_prefs
-- ============================================================================

create policy "display_prefs_all_self"
  on public.display_prefs for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "notification_prefs_all_self"
  on public.notification_prefs for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Bump updated_at automatically
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists tasks_set_updated_at on public.tasks;
create trigger tasks_set_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists display_prefs_set_updated_at on public.display_prefs;
create trigger display_prefs_set_updated_at
  before update on public.display_prefs
  for each row execute function public.set_updated_at();

drop trigger if exists notification_prefs_set_updated_at on public.notification_prefs;
create trigger notification_prefs_set_updated_at
  before update on public.notification_prefs
  for each row execute function public.set_updated_at();

-- Realtime broadcast on new chat message
create or replace function public.publish_message_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform realtime.publish(
    'chat:' || new.conversation_id::text,
    'new_message',
    jsonb_build_object(
      'id', new.id,
      'conversation_id', new.conversation_id,
      'sender_id', new.sender_id,
      'body', new.body,
      'created_at', new.created_at
    )
  );
  return new;
end;
$$;

drop trigger if exists messages_realtime on public.messages;
create trigger messages_realtime
  after insert on public.messages
  for each row execute function public.publish_message_event();

-- ============================================================================
-- SEED — apps_catalog
-- ============================================================================

insert into public.apps_catalog (slug, name, description, icon_url, oauth_provider, display_order) values
  ('stripe',     'Stripe',     'Accept payments, manage subscriptions, and view revenue.',     'https://cdn.simpleicons.org/stripe',     'stripe',  1),
  ('openrouter', 'OpenRouter', 'Unified API for 100+ AI models, with usage analytics.',         'https://cdn.simpleicons.org/openrouter', null,      2),
  ('github',     'GitHub',     'Sync issues, manage releases, and trigger workflows.',          'https://cdn.simpleicons.org/github',     'github',  3),
  ('notion',     'Notion',     'Embed docs, capture notes, and link knowledge bases.',          'https://cdn.simpleicons.org/notion',     'notion',  4),
  ('slack',      'Slack',      'Get notifications and respond to events without leaving Slack.','https://cdn.simpleicons.org/slack',      'slack',   5),
  ('discord',    'Discord',    'Bridge community channels into your workspace.',                'https://cdn.simpleicons.org/discord',    'discord', 6),
  ('figma',      'Figma',      'Link design files and surface comments inline.',                'https://cdn.simpleicons.org/figma',      'figma',   7),
  ('linear',     'Linear',     'Track issues, ship faster, and keep tasks in sync.',            'https://cdn.simpleicons.org/linear',     null,      8),
  ('vercel',     'Vercel',     'Tail deployments and surface preview URLs.',                    'https://cdn.simpleicons.org/vercel',     null,      9),
  ('zapier',     'Zapier',     'Automate workflows across thousands of apps.',                  'https://cdn.simpleicons.org/zapier',     null,     10)
on conflict (slug) do nothing;
