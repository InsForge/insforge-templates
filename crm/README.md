# InsForge CRM

A full-featured CRM template built with Next.js, shadcn/ui, and InsForge. Manage leads through a visual pipeline, track activities and follow-ups, convert leads to clients, and organize projects.

Inspired by [nextjs-supabase-boilerplate](https://github.com/phamvuhoang/nextjs-supabase-boilerplate), rebuilt from scratch for the InsForge platform.

## What is included

- Lead management with CRUD, status tracking, and scoring
- Drag-and-drop Kanban pipeline for visualizing lead stages
- Lead activities, documents, and follow-up tracking
- Lead-to-client conversion workflow
- Client and project management
- InsForge authentication (email/password + OAuth)
- InsForge database with Row Level Security
- InsForge storage for lead documents
- Dark mode support

## Project structure

- `app/(dashboard)/` - Protected CRM pages (leads, clients, projects, pipeline)
- `app/auth/` - Sign in, sign up, password reset
- `app/api/` - Server-side API routes for all CRM operations
- `components/leads/` - Lead list, detail, pipeline, and form components
- `components/layout/` - Sidebar and dashboard layout
- `components/ui/` - shadcn-style UI primitives
- `lib/insforge.ts` - InsForge SDK client initialization
- `lib/queries.ts` - All database query functions
- `lib/auth-*.ts` - Authentication helpers
- `migrations/db_int.sql` - Database schema with tables, RLS policies, and triggers

## Environment

Copy `.env.example` to `.env.local` and fill in:

```bash
NEXT_PUBLIC_INSFORGE_URL=https://your-project.region.insforge.app
NEXT_PUBLIC_INSFORGE_ANON_KEY=your-anon-key
NEXT_PUBLIC_APP_URL=https://your-project.insforge.site
```

## Apply the backend migration

If you have the InsForge CLI installed and your project linked:

```bash
insforge db import migrations/db_int.sql
```

Or paste the SQL from `migrations/db_int.sql` into the InsForge SQL editor.

## Seed default data

After signing in for the first time, seed the default lead sources and pipeline stages by calling:

```bash
curl -X POST http://localhost:3000/api/seed
```

Or the app can be extended to call this automatically on first login.

## Run locally

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Notes

- All InsForge calls happen on the server through Next.js API routes and server components.
- Row Level Security ensures each user only sees their own data (`user_id = auth.uid()`).
- The drag-and-drop pipeline uses `@hello-pangea/dnd` with optimistic UI updates.
- Lead documents are stored in an InsForge storage bucket (`lead-documents`).
