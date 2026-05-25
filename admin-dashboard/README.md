# Admin Dashboard — InsForge Template

A polished, end-to-end admin dashboard starter built with Vite, TanStack Router/Query/Table, shadcn/ui, and `@insforge/sdk`. Multi-tenant workspaces, full CRUD with row-level security, real-time chat, file storage, and a complete settings surface — the empty admin scaffold you'd actually want to build on.

**[Features](#features)** · **[Demo](#demo)** · **[Quick launch](#quick-launch)** · **[Step-by-step setup](#step-by-step-setup)** · **[Deploy](#deploy-with-vercel)** · **[Customization](#customization)**

---

## Features

- **Authentication** — email/password + Google/GitHub OAuth + password reset via OTP
- **Workspace model** — every user gets a personal workspace on first sign-in; owners can invite others by email and assign roles (owner / admin / member)
- **Tasks** with a full **TanStack Table**: search, faceted filters (status / priority / label), column visibility, multi-select, pagination, CRUD modal with React Hook Form + Zod
- **Users** management — workspace members, role updates, pending invitations, copyable invite links, leave-workspace flow
- **Apps** — toggle-style integration grid (10 brands seeded: Stripe, OpenRouter, GitHub, Notion, Slack, Discord, Figma, Linear, Vercel, Zapier)
- **Chats** — real-time conversations powered by InsForge realtime channels; database trigger broadcasts every new message
- **Settings** — Profile (with avatar upload to public storage), Account, Appearance (light/dark/system + font), Display (sidebar + density), Notifications (per-channel + per-event)
- **Dashboard** — live stat cards, 7-day creation trend, status breakdown, recent activity — all aggregated from real `tasks` data
- **Auth pages** — sign-in (two visual variants), sign-up, forgot password, OTP reset
- **Error pages** — 401 / 403 / 404 / 500 / 503 with a preview route for design QA
- **Help Center** — searchable FAQ accordion + contact card
- **Row-Level Security** baked in — see `migrations/db_init.sql` for the full policy set, including reusable `is_workspace_member()` / `is_workspace_admin()` / `is_conversation_member()` helpers

---

## Demo

Demo: [admindashboard.insforge.site](https://admindashboard.insforge.site)

Sign up or sign in to get a personal workspace, then explore. Every page is hooked to live InsForge data — there is no mock layer.

---

## Quick launch

```bash
npx @insforge/cli create
```

Choose the **Admin Dashboard** template and follow the prompts. The CLI provisions a project, applies the migration, creates the storage bucket, registers the realtime channel pattern, fills `.env.local`, and you're ready for `npm run dev`.

Prefer to do it by hand? See the step-by-step path below.

---

## Step-by-step setup

```bash
# 1. Clone and enter the project
git clone https://github.com/InsForge/insforge-templates.git
cd insforge-templates/admin-dashboard

# 2. Link to an InsForge project (or create one)
npx @insforge/cli link            # existing project
# or
npx @insforge/cli create          # new project

# 3. Apply the database schema (12 tables + RLS + 10 seeded integrations)
npx @insforge/cli db import migrations/db_init.sql

# 4. Provision storage bucket and realtime channel pattern
npm run setup
# This runs:
#   - insforge storage create-bucket avatars --public
#   - insforge db query "INSERT INTO realtime.channels (...) VALUES ('chat:%', ...)"

# 5. Configure environment variables
cp .env.example .env
# Fill VITE_INSFORGE_URL and VITE_INSFORGE_ANON_KEY
# (Get the anon key with: npx @insforge/cli secrets get ANON_KEY)

# 6. Add redirect URLs in the InsForge dashboard
#    Auth → Settings → Redirect URLs:
#      - http://localhost:5173
#      - http://localhost:5173/dashboard
#      - http://localhost:5173/auth/callback
#    (Plus your production URLs after deploying.)

# 7. Install and run
npm install
npm run dev
```

Open http://localhost:5173 — sign up, and the app bootstraps your personal workspace automatically.

---

## Deploy with Vercel

```bash
# 1. Build locally first
npm run build

# 2. Set persistent env vars (one-time)
npx @insforge/cli deployments env set VITE_INSFORGE_URL https://<appkey>.<region>.insforge.app
npx @insforge/cli deployments env set VITE_INSFORGE_ANON_KEY <your-anon-key>

# 3. Deploy
npx @insforge/cli deployments deploy .
```

Don't forget to add your deployed URL to the **Redirect URLs** allowlist in the InsForge dashboard, otherwise OAuth callbacks will refuse to redirect back.

---

## Project structure

```
admin-dashboard/
├── migrations/db_init.sql          # 12 tables + RLS + helper functions + seed + realtime trigger
├── src/
│   ├── routes/                     # TanStack Router file-based routes
│   │   ├── __root.tsx
│   │   ├── index.tsx               # redirects based on auth
│   │   ├── (auth)/                 # sign-in, sign-up, forgot-password, otp, sign-in-2
│   │   ├── (errors)/               # 401, 403, 404, 500, 503
│   │   ├── invite.$token.tsx       # invitation accept landing
│   │   └── _authenticated/         # everything behind the AppShell
│   │       ├── route.tsx           # auth guard
│   │       ├── dashboard.tsx
│   │       ├── tasks/index.tsx
│   │       ├── users/index.tsx
│   │       ├── apps/index.tsx
│   │       ├── chats/index.tsx
│   │       ├── help-center/index.tsx
│   │       ├── errors/$error.tsx   # error-page preview
│   │       └── settings/           # 5-tab area with avatar upload
│   ├── features/                   # business logic per page
│   ├── components/
│   │   ├── layout/                 # AppShell, sidebar, topbar, user-menu, workspace-switcher
│   │   ├── ui/                     # shadcn primitives
│   │   ├── theme-provider.tsx
│   │   └── theme-toggle.tsx
│   ├── lib/
│   │   ├── insforge.ts             # singleton SDK client
│   │   ├── auth-context.tsx
│   │   ├── env.ts                  # zod-validated env loader
│   │   └── utils.ts
│   └── styles/globals.css          # Tailwind v3 + CSS variables
└── package.json
```

---

## Customization

- **Rebrand** — swap the app name, colors, and icon set. Tailwind CSS variables in `src/styles/globals.css` drive the entire palette; chart colors live there too.
- **Add a page** — drop a new file under `src/routes/_authenticated/` and add a sidebar entry in `src/components/layout/sidebar-nav.ts`. TanStack Router picks it up on next build.
- **Wire a real integration in Apps** — replace the toggle handler in `src/features/apps/use-toggle-app.ts` with an OAuth flow. The mock pattern keeps `app_connections.status` for free.
- **Email invitations** — V1 produces a copyable link. To email instead, wire `insforge.emails.send()` in `src/features/users/use-invitations.ts`.

---

## License

MIT
