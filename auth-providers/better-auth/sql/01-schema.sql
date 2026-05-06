-- REQUIRED. Runs BEFORE `auth:migrate` so Better Auth's CLI can create its
-- tables in the dedicated `better_auth` schema (lib/auth.ts sets the pool's
-- search_path to better_auth, public).
--
-- PostgREST is configured to expose only `public` by default, so anything in
-- `better_auth` is hidden from the data API automatically — no REVOKE block
-- needed. The InsForge dashboard reaches this schema through its admin route
-- (postgres superuser pool, role-independent), so Studio inspection of users,
-- sessions, accounts, and verification still works.
CREATE SCHEMA IF NOT EXISTS better_auth;
