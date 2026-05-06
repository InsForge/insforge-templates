# Better Auth + InsForge — Overlay

This is **not a standalone template**. It's a scaffold that the InsForge CLI overlays on top of an existing Next.js project (or one freshly created from a base template) when you pass `--auth better-auth`.

## How it's used

```bash
# Fresh project — base Next.js template plus this overlay in one step
npx @insforge/cli create --template nextjs --auth better-auth

# Existing Next.js project — overlay only, leaves your code intact
npx @insforge/cli link --auth better-auth
```

The CLI reads `manifest.json`, copies the files listed under `files`, deep-merges `packageJsonPatch` into your `package.json` (your existing values win on conflict), and appends `envExampleAppend` to `.env.example` (skipping any keys you've already defined).

## What gets dropped

- `src/lib/auth.ts` — Better Auth server (Postgres pool, email + password)
- `src/lib/auth-client.ts` — Better Auth React client
- `src/lib/insforge.ts` — `useInsforgeClient` hook (Pattern A)
- `src/lib/insforge.server.ts` — `createInsForgeClient` for RSC / server actions (Pattern B)
- `src/lib/insforge-server-mailer.ts` — server-side mailer using InsForge's email service
- `src/app/api/auth/[...all]/route.ts` — Better Auth route handler
- `src/app/api/insforge-token/route.ts` — bridge route that signs HS256 with `INSFORGE_JWT_SECRET`
- `src/app/sign-up/page.tsx`, `src/app/sign-in/page.tsx`, `src/app/notes/page.tsx` — working demo UI
- `sql/01-init.sql` — `pgcrypto`, `requesting_user_id()`, RLS-protected `notes` table
- `sql/02-revoke.sql` — locks BA's tables down from PostgREST anon/authenticated
- `scripts/setup-db.mjs` — runs the SQL files using `pg` (no `psql` dependency)

## Why an overlay, not a template

Auth provider scaffolds don't replace a base template — they layer on top. Putting Better Auth as a separate `nextjs-better-auth` template would force users into an either/or choice (and crowd the CLI's template picker). The overlay model means a user can pick `chatbot` (or any base) and still add Better Auth.

This directory is invisible to the CLI's template picker — only `--auth better-auth` triggers download.

## Manual install (no CLI)

The CLI's overlay logic isn't required. You can clone this directory and copy the files manually:

```bash
git clone https://github.com/InsForge/insforge-templates.git
cp -r insforge-templates/auth-providers/better-auth/{lib,app,sql,scripts} your-project/
# Then edit your package.json to add the deps from manifest.json's packageJsonPatch
# and write .env.local with the values from manifest.json's envExampleAppend.
```

See the [InsForge Better Auth integration guide](https://staging.insforge.dev/integrations/better-auth) for the full walk-through and the [skill reference](https://github.com/InsForge/insforge-skills/blob/main/skills/insforge-integrations/references/better-auth.md) for plugins, custom claims, and common-mistake guidance.
