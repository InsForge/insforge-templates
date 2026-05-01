# Next.js + Better Auth (InsForge template)

A runnable Next.js skeleton with [Better Auth](https://better-auth.com) wired to InsForge through a bridge route, RLS, and a REVOKE block. Created via:

```bash
npx @insforge/cli link --project-id <your-project> --template nextjs-better-auth
```

## What's wired

- **Better Auth** at `/api/auth/[...all]` with email + password
- **Bridge route** at `/api/insforge-token` that re-signs the BA session as an HS256 JWT for InsForge
- **`useInsforgeClient` hook** keeping a long-lived `@insforge/sdk` client in sync with the BA session
- **One-page app** that signs you up, lists notes the bridged user owns, and inserts new ones through `client.database` — RLS isolates per user
- **`sql/01-init.sql`** provisions `requesting_user_id()`, an RLS-protected `notes` table, and realtime support
- **`sql/02-revoke.sql`** locks down PostgREST exposure of BA's `user` / `session` / `account` / `verification` tables

## Setup

The CLI fills `.env.local` with `INSFORGE_JWT_SECRET`, `BETTER_AUTH_SECRET`, and the InsForge URL/anon-key. You still need to set `DATABASE_URL` for the Postgres your InsForge instance runs on (cloud users need their own Postgres for BA's tables; self-hosted users typically point at `postgresql://postgres:postgres@127.0.0.1:5432/insforge`).

```bash
# 1. Install dependencies
npm install

# 2. Run the full setup chain — BA migrations, then RLS + REVOKE + notes table.
#    Order matters: BA tables must exist before the FK in notes can resolve.
npm run setup

# 3. Develop
npm run dev
# → http://localhost:3000
```

## Verifying

Sign up at `/sign-up`, then on the home page:

- "Add a note" inserts via `client.database.from('notes').insert(...)`
- Reload — only your own notes are visible (RLS through the bridged JWT)
- Sign out, sign back in — same notes still yours
- `curl <postgrest>/user?select=email` — returns `permission denied for table user` (REVOKE works)

## What's not in this skeleton

- OAuth providers (GitHub, Google, …) — add `socialProviders` in `lib/auth.ts`
- Email verification — BA's `sendVerificationEmail` callback wired to `client.emails.send`
- Better Auth plugins that add tables (organization, twoFactor, …) — each needs its own REVOKE

The full skill guide at `skills/insforge-integrations/references/better-auth.md` in [insforge-skills](https://github.com/InsForge/insforge-skills) covers all of these.
