-- Acme landing template — waitlist signups.
-- RLS: anon can INSERT only; admin reads via service role (InsForge dashboard).

create extension if not exists citext;

create table if not exists public.waitlist (
  id          uuid primary key default gen_random_uuid(),
  email       citext not null,
  source      text,
  referrer    text,
  created_at  timestamptz not null default now(),

  constraint waitlist_email_format
    check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  constraint waitlist_source_check
    check (source is null or source in ('hero', 'footer', 'cta-section', 'other'))
);

create unique index if not exists waitlist_email_unique on public.waitlist (email);
create index if not exists waitlist_created_at_idx on public.waitlist (created_at desc);

alter table public.waitlist enable row level security;

create policy "anon can insert waitlist"
  on public.waitlist
  for insert
  to anon
  with check (true);
