-- Runs AFTER `npx @better-auth/cli migrate` has created the four BA tables in
-- `better_auth`. This file installs the bridge infrastructure only — no demo
-- tables. Add your own tables + RLS policies that key off
-- `public.requesting_user_id()` (see README for the pattern).

-- pgcrypto so user-defined tables can use `gen_random_uuid()` for PKs.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Helper: extract the `sub` claim from request.jwt.claims so RLS policies
-- written as `user_id = public.requesting_user_id()` work for BA-bridged JWTs.
CREATE OR REPLACE FUNCTION public.requesting_user_id()
RETURNS text
LANGUAGE sql STABLE
AS $$
  SELECT NULLIF(current_setting('request.jwt.claims', true)::json->>'sub', '')::text
$$;

GRANT USAGE ON SCHEMA public TO authenticated;

-- Realtime: BA user IDs aren't UUIDs, so widen sender_id to text.
ALTER TABLE realtime.messages ALTER COLUMN sender_id TYPE text;

-- Force PostgREST to refresh its schema cache after this script runs.
NOTIFY pgrst, 'reload schema';
