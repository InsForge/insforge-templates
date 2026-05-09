-- Single bootstrap migration. The setup script applies this BEFORE
-- `auth:migrate` (via `insforge db migrations up --to 0001`), then BA's
-- CLI populates `better_auth.{user,session,account,verification}`, then
-- `up --all` picks up anything you add later with
-- `insforge db migrations new <name>`.

-- Dedicated schema for Better Auth's tables. PostgREST exposes only
-- `public` by default, so anything in `better_auth` is hidden from the
-- data API automatically — no REVOKE block needed.
CREATE SCHEMA IF NOT EXISTS better_auth;

-- pgcrypto so user-defined tables can use `gen_random_uuid()` for PKs.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Helper that extracts the `sub` claim from request.jwt.claims so RLS
-- policies written as `user_id = public.requesting_user_id()` work for
-- BA-bridged JWTs. (InsForge's db-init grants USAGE on `public` and
-- default privileges on new tables to `authenticated` already, so no
-- explicit GRANTs needed here.)
CREATE OR REPLACE FUNCTION public.requesting_user_id()
RETURNS text
LANGUAGE sql STABLE
AS $$
  SELECT NULLIF(current_setting('request.jwt.claims', true)::json->>'sub', '')::text
$$;
