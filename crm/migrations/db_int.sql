
create extension if not exists pgcrypto;


create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  name varchar(255) not null,
  client_code varchar(8) not null,
  address varchar(255),
  postal_code varchar(8),
  country_code varchar(2),
  is_active boolean not null default true,
  is_deleted boolean not null default false,
  user_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint clients_name_not_blank check (btrim(name) <> ''),
  constraint clients_code_not_blank check (btrim(client_code) <> '')
);

create table if not exists public.lead_sources (
  id uuid primary key default gen_random_uuid(),
  name varchar(100) not null,
  description text,
  is_active boolean not null default true,
  user_id uuid not null,
  created_at timestamptz not null default now(),
  constraint lead_sources_name_not_blank check (btrim(name) <> '')
);

create table if not exists public.lead_stages (
  id uuid primary key default gen_random_uuid(),
  name varchar(100) not null,
  description text,
  order_index integer not null,
  is_active boolean not null default true,
  user_id uuid not null,
  created_at timestamptz not null default now(),
  constraint lead_stages_name_not_blank check (btrim(name) <> '')
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  company_name varchar(255) not null,
  industry varchar(100),
  website varchar(255),
  contact_name varchar(255) not null,
  contact_title varchar(100),
  contact_email varchar(255),
  contact_phone varchar(50),
  source_id uuid references public.lead_sources(id),
  current_stage_id uuid references public.lead_stages(id),
  status varchar(50) not null default 'new',
  score integer not null default 0,
  notes text,
  tags varchar(255)[],
  is_converted boolean not null default false,
  converted_to_client_id uuid references public.clients(id),
  converted_at timestamptz,
  user_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint leads_company_not_blank check (btrim(company_name) <> ''),
  constraint leads_contact_not_blank check (btrim(contact_name) <> ''),
  constraint leads_status_check check (status in ('new', 'contacted', 'qualified', 'unqualified'))
);

create table if not exists public.lead_stage_history (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  from_stage_id uuid references public.lead_stages(id),
  to_stage_id uuid not null references public.lead_stages(id),
  changed_by uuid not null,
  changed_at timestamptz not null default now(),
  time_in_previous_stage interval,
  notes text,
  user_id uuid not null
);

create table if not exists public.lead_activities (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  type varchar(50) not null,
  subject varchar(255) not null,
  description text,
  activity_date timestamptz not null,
  duration_minutes integer,
  status varchar(50),
  user_id uuid not null,
  created_at timestamptz not null default now(),
  constraint lead_activities_type_check check (type in ('email', 'call', 'meeting', 'note', 'task')),
  constraint lead_activities_subject_not_blank check (btrim(subject) <> '')
);

create table if not exists public.lead_documents (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  name varchar(255) not null,
  file_url varchar(500) not null,
  file_type varchar(50) not null,
  file_size integer not null,
  user_id uuid not null,
  created_at timestamptz not null default now(),
  constraint lead_documents_name_not_blank check (btrim(name) <> ''),
  constraint lead_documents_size_positive check (file_size > 0)
);

create table if not exists public.lead_follow_ups (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  due_date timestamptz not null,
  priority text not null default 'medium',
  status text not null default 'pending',
  description text not null,
  completed_at timestamptz,
  user_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lead_follow_ups_priority_check check (priority in ('low', 'medium', 'high')),
  constraint lead_follow_ups_status_check check (status in ('pending', 'completed', 'overdue'))
);

create table if not exists public.lead_conversions (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id),
  client_id uuid not null references public.clients(id),
  converted_at timestamptz not null default now(),
  converted_by uuid not null,
  deal_value decimal(10,2),
  conversion_notes text,
  user_id uuid not null,
  created_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  code varchar(50) not null,
  name varchar(255) not null,
  client_id uuid not null references public.clients(id),
  currency varchar(6),
  start_date date,
  end_date date,
  deal_status text not null default 'active',
  billable boolean not null default false,
  note text,
  user_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint projects_code_not_blank check (btrim(code) <> ''),
  constraint projects_name_not_blank check (btrim(name) <> '')
);


create index if not exists leads_user_created_idx
  on public.leads (user_id, created_at desc);

create index if not exists leads_stage_idx
  on public.leads (current_stage_id);

create index if not exists lead_activities_lead_idx
  on public.lead_activities (lead_id, activity_date desc);

create index if not exists lead_documents_lead_idx
  on public.lead_documents (lead_id);

create index if not exists lead_follow_ups_lead_due_idx
  on public.lead_follow_ups (lead_id, due_date asc);

create index if not exists lead_stage_history_lead_idx
  on public.lead_stage_history (lead_id, changed_at desc);

create index if not exists clients_user_idx
  on public.clients (user_id);

create index if not exists projects_client_idx
  on public.projects (client_id);


create trigger clients_set_updated_at
before update on public.clients
for each row
execute function system.update_updated_at();

create trigger leads_set_updated_at
before update on public.leads
for each row
execute function system.update_updated_at();

create trigger lead_follow_ups_set_updated_at
before update on public.lead_follow_ups
for each row
execute function system.update_updated_at();

create trigger projects_set_updated_at
before update on public.projects
for each row
execute function system.update_updated_at();


create or replace function public.update_lead_stage(
  p_lead_id uuid,
  p_to_stage_id uuid,
  p_user_id uuid,
  p_notes text default null
)
returns void
language plpgsql
as $$
declare
  v_from_stage_id uuid;
  v_last_changed_at timestamptz;
  v_time_in_stage interval;
begin
  select current_stage_id into v_from_stage_id
  from public.leads
  where id = p_lead_id;

  if v_from_stage_id is not null then
    select changed_at into v_last_changed_at
    from public.lead_stage_history
    where lead_id = p_lead_id
    order by changed_at desc
    limit 1;

    if v_last_changed_at is not null then
      v_time_in_stage := now() - v_last_changed_at;
    end if;
  end if;

  insert into public.lead_stage_history (
    lead_id, from_stage_id, to_stage_id, changed_by, time_in_previous_stage, notes, user_id
  ) values (
    p_lead_id, v_from_stage_id, p_to_stage_id, p_user_id, v_time_in_stage, p_notes, p_user_id
  );

  update public.leads
  set current_stage_id = p_to_stage_id, updated_at = now()
  where id = p_lead_id;
end;
$$;


create or replace function public.seed_crm_defaults(p_user_id uuid)
returns void
language plpgsql
as $$
begin
  if not exists (select 1 from public.lead_sources where user_id = p_user_id) then
    insert into public.lead_sources (name, user_id) values
      ('Website', p_user_id),
      ('Referral', p_user_id),
      ('Social Media', p_user_id),
      ('Cold Call', p_user_id),
      ('Email Campaign', p_user_id),
      ('Trade Show', p_user_id),
      ('Other', p_user_id);
  end if;

  if not exists (select 1 from public.lead_stages where user_id = p_user_id) then
    insert into public.lead_stages (name, order_index, user_id) values
      ('New Lead', 1, p_user_id),
      ('Contacted', 2, p_user_id),
      ('Qualified', 3, p_user_id),
      ('Proposal Sent', 4, p_user_id),
      ('Negotiation', 5, p_user_id),
      ('Won', 6, p_user_id),
      ('Lost', 7, p_user_id);
  end if;
end;
$$;


grant usage on schema public to authenticated;

grant select, insert, update, delete on table public.clients to authenticated;
grant select, insert, update, delete on table public.lead_sources to authenticated;
grant select, insert, update, delete on table public.lead_stages to authenticated;
grant select, insert, update, delete on table public.leads to authenticated;
grant select, insert on table public.lead_stage_history to authenticated;
grant select, insert, update, delete on table public.lead_activities to authenticated;
grant select, insert, delete on table public.lead_documents to authenticated;
grant select, insert, update on table public.lead_follow_ups to authenticated;
grant select, insert on table public.lead_conversions to authenticated;
grant select, insert, update, delete on table public.projects to authenticated;


alter table public.clients enable row level security;
alter table public.lead_sources enable row level security;
alter table public.lead_stages enable row level security;
alter table public.leads enable row level security;
alter table public.lead_stage_history enable row level security;
alter table public.lead_activities enable row level security;
alter table public.lead_documents enable row level security;
alter table public.lead_follow_ups enable row level security;
alter table public.lead_conversions enable row level security;
alter table public.projects enable row level security;

create policy "auth_user_select_clients" on public.clients for select to authenticated using (user_id = auth.uid());
create policy "auth_user_insert_clients" on public.clients for insert to authenticated with check (user_id = auth.uid());
create policy "auth_user_update_clients" on public.clients for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "auth_user_delete_clients" on public.clients for delete to authenticated using (user_id = auth.uid());

create policy "auth_user_select_lead_sources" on public.lead_sources for select to authenticated using (user_id = auth.uid());
create policy "auth_user_insert_lead_sources" on public.lead_sources for insert to authenticated with check (user_id = auth.uid());
create policy "auth_user_update_lead_sources" on public.lead_sources for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "auth_user_delete_lead_sources" on public.lead_sources for delete to authenticated using (user_id = auth.uid());

create policy "auth_user_select_lead_stages" on public.lead_stages for select to authenticated using (user_id = auth.uid());
create policy "auth_user_insert_lead_stages" on public.lead_stages for insert to authenticated with check (user_id = auth.uid());
create policy "auth_user_update_lead_stages" on public.lead_stages for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "auth_user_delete_lead_stages" on public.lead_stages for delete to authenticated using (user_id = auth.uid());

create policy "auth_user_select_leads" on public.leads for select to authenticated using (user_id = auth.uid());
create policy "auth_user_insert_leads" on public.leads for insert to authenticated with check (user_id = auth.uid());
create policy "auth_user_update_leads" on public.leads for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "auth_user_delete_leads" on public.leads for delete to authenticated using (user_id = auth.uid());

create policy "auth_user_select_lead_stage_history" on public.lead_stage_history for select to authenticated using (user_id = auth.uid());
create policy "auth_user_insert_lead_stage_history" on public.lead_stage_history for insert to authenticated with check (user_id = auth.uid());

create policy "auth_user_select_lead_activities" on public.lead_activities for select to authenticated using (user_id = auth.uid());
create policy "auth_user_insert_lead_activities" on public.lead_activities for insert to authenticated with check (user_id = auth.uid());
create policy "auth_user_update_lead_activities" on public.lead_activities for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "auth_user_delete_lead_activities" on public.lead_activities for delete to authenticated using (user_id = auth.uid());

create policy "auth_user_select_lead_documents" on public.lead_documents for select to authenticated using (user_id = auth.uid());
create policy "auth_user_insert_lead_documents" on public.lead_documents for insert to authenticated with check (user_id = auth.uid());
create policy "auth_user_delete_lead_documents" on public.lead_documents for delete to authenticated using (user_id = auth.uid());

create policy "auth_user_select_lead_follow_ups" on public.lead_follow_ups for select to authenticated using (user_id = auth.uid());
create policy "auth_user_insert_lead_follow_ups" on public.lead_follow_ups for insert to authenticated with check (user_id = auth.uid());
create policy "auth_user_update_lead_follow_ups" on public.lead_follow_ups for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "auth_user_select_lead_conversions" on public.lead_conversions for select to authenticated using (user_id = auth.uid());
create policy "auth_user_insert_lead_conversions" on public.lead_conversions for insert to authenticated with check (user_id = auth.uid());

create policy "auth_user_select_projects" on public.projects for select to authenticated using (user_id = auth.uid());
create policy "auth_user_insert_projects" on public.projects for insert to authenticated with check (user_id = auth.uid());
create policy "auth_user_update_projects" on public.projects for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "auth_user_delete_projects" on public.projects for delete to authenticated using (user_id = auth.uid());
