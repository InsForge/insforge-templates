-- ============================================================================
-- InsForge Workspace template — initial schema
-- ============================================================================
-- DO NOT write to storage.*, auth.*, or realtime.* schemas here.
-- The workspace-files bucket is created via `npm run setup` (CLI).
-- ============================================================================

-- ---------- Tables ----------

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'editor', 'viewer')),
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create index workspace_members_user_idx on public.workspace_members (user_id);

create table public.pages (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  parent_id uuid references public.pages(id) on delete cascade,
  title text not null default 'Untitled',
  icon text,
  content jsonb not null default '[]'::jsonb,
  position double precision not null default 0,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index pages_workspace_parent_position_idx
  on public.pages (workspace_id, parent_id, position);

create table public.page_shares (
  page_id uuid primary key references public.pages(id) on delete cascade,
  share_token text not null unique,
  created_at timestamptz not null default now()
);

create table public.workspace_invites (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  token text not null unique,
  role text not null check (role in ('editor', 'viewer')),
  created_by uuid not null references auth.users(id),
  expires_at timestamptz,
  used_at timestamptz,
  used_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index workspace_invites_workspace_idx on public.workspace_invites (workspace_id);

-- ---------- Updated-at trigger for pages ----------

create or replace function public.set_pages_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger pages_set_updated_at
  before update on public.pages
  for each row execute function public.set_pages_updated_at();

-- ---------- Helper: is_workspace_member / workspace_role ----------

create or replace function public.is_workspace_member(p_workspace_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.workspace_members
     where workspace_id = p_workspace_id and user_id = p_user_id
  );
$$;

create or replace function public.workspace_role(p_workspace_id uuid, p_user_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.workspace_members
   where workspace_id = p_workspace_id and user_id = p_user_id
   limit 1;
$$;

-- ---------- RLS: workspaces ----------

alter table public.workspaces enable row level security;

create policy workspaces_select on public.workspaces
  for select using (public.is_workspace_member(id, auth.uid()));

create policy workspaces_insert on public.workspaces
  for insert with check (auth.uid() is not null and owner_id = auth.uid());

create policy workspaces_update on public.workspaces
  for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy workspaces_delete on public.workspaces
  for delete using (owner_id = auth.uid());

-- ---------- RLS: workspace_members ----------

alter table public.workspace_members enable row level security;

create policy workspace_members_select on public.workspace_members
  for select using (public.is_workspace_member(workspace_id, auth.uid()));

create policy workspace_members_insert on public.workspace_members
  for insert with check (
    exists (
      select 1 from public.workspaces w
       where w.id = workspace_id and w.owner_id = auth.uid()
    )
    or
    (user_id = auth.uid() and exists (
      select 1 from public.workspaces w
       where w.id = workspace_id and w.owner_id = auth.uid()
    ))
  );

create policy workspace_members_delete on public.workspace_members
  for delete using (
    user_id = auth.uid()
    or exists (
      select 1 from public.workspaces w
       where w.id = workspace_id and w.owner_id = auth.uid()
    )
  );

-- ---------- RLS: pages ----------

alter table public.pages enable row level security;

create policy pages_select on public.pages
  for select using (public.is_workspace_member(workspace_id, auth.uid()));

create policy pages_insert on public.pages
  for insert with check (
    public.workspace_role(workspace_id, auth.uid()) in ('owner', 'editor')
    and created_by = auth.uid()
  );

create policy pages_update on public.pages
  for update using (public.workspace_role(workspace_id, auth.uid()) in ('owner', 'editor'))
  with check (public.workspace_role(workspace_id, auth.uid()) in ('owner', 'editor'));

create policy pages_delete on public.pages
  for delete using (public.workspace_role(workspace_id, auth.uid()) in ('owner', 'editor'));

-- ---------- RLS: page_shares ----------

alter table public.page_shares enable row level security;

create policy page_shares_select on public.page_shares
  for select using (
    exists (
      select 1 from public.pages p
       where p.id = page_id
         and public.is_workspace_member(p.workspace_id, auth.uid())
    )
  );

create policy page_shares_insert on public.page_shares
  for insert with check (
    exists (
      select 1 from public.pages p
       where p.id = page_id
         and public.workspace_role(p.workspace_id, auth.uid()) in ('owner', 'editor')
    )
  );

create policy page_shares_delete on public.page_shares
  for delete using (
    exists (
      select 1 from public.pages p
       where p.id = page_id
         and public.workspace_role(p.workspace_id, auth.uid()) in ('owner', 'editor')
    )
  );

-- ---------- RLS: workspace_invites ----------

alter table public.workspace_invites enable row level security;

create policy workspace_invites_select on public.workspace_invites
  for select using (public.is_workspace_member(workspace_id, auth.uid()));

create policy workspace_invites_insert on public.workspace_invites
  for insert with check (
    public.workspace_role(workspace_id, auth.uid()) in ('owner', 'editor')
    and created_by = auth.uid()
  );

create policy workspace_invites_delete on public.workspace_invites
  for delete using (
    public.workspace_role(workspace_id, auth.uid()) in ('owner', 'editor')
  );

-- ---------- RPC: public share read ----------

create or replace function public.get_shared_page(p_share_token text)
returns table (
  id uuid,
  title text,
  icon text,
  content jsonb,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.title, p.icon, p.content, p.updated_at
    from public.pages p
    join public.page_shares s on s.page_id = p.id
   where s.share_token = p_share_token
   limit 1;
$$;

grant execute on function public.get_shared_page(text) to anon, authenticated;

-- ---------- RPC: accept invite ----------

create or replace function public.accept_workspace_invite(p_token text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite public.workspace_invites;
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'not authenticated';
  end if;

  select * into v_invite
    from public.workspace_invites
   where token = p_token
     and used_at is null
     and (expires_at is null or expires_at > now())
   for update;

  if not found then
    raise exception 'invite invalid or expired';
  end if;

  insert into public.workspace_members (workspace_id, user_id, role)
    values (v_invite.workspace_id, v_user, v_invite.role)
    on conflict (workspace_id, user_id) do nothing;

  update public.workspace_invites
     set used_at = now(), used_by = v_user
   where id = v_invite.id;

  return v_invite.workspace_id;
end;
$$;

grant execute on function public.accept_workspace_invite(text) to authenticated;
