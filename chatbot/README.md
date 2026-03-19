# InsForge Chatbot

A minimal-but-polished Next.js chatbot app inspired by the structure and UX goals of Vercel's Chat SDK template, rebuilt from scratch with the core pieces plus the UI stack the reference app leans on:

- App Router UI
- Tailwind CSS v4
- shadcn-style component primitives
- persisted chat history
- InsForge database tables
- InsForge AI completions through server-side route handlers

## What is included

- A two-pane chat layout with grouped recent chats
- A lean message composer and prompt suggestions
- Tailwind-driven design tokens, dark mode support, and shared UI components
- Next.js API routes for listing chats, loading a thread, and sending messages
- An InsForge SQL migration for the required chat tables and triggers

## Project structure

- `app/` - Next.js routes and pages
- `components/chat-shell.tsx` - the main chat experience
- `components/ui/*` - shadcn-style UI primitives used by the shell
- `components.json` - shadcn component alias configuration
- `lib/chat-service.ts` - InsForge database and AI orchestration
- `migrations/db_int.sql` - local migration file for backend setup

## Environment

Copy `.env.example` to `.env.local` and fill in:

```bash
INSFORGE_BASE_URL=https://your-project.region.insforge.app
INSFORGE_ANON_KEY=your-anon-key
INSFORGE_AI_MODEL=openai/gpt-4o-mini
```

`INSFORGE_AI_MODEL` must match a model that is already enabled in your InsForge project's AI settings.

## Apply the backend migration

If you have the InsForge CLI installed and your project linked:

```bash
insforge db import migrations/db_int.sql
```

Or paste the SQL from `migrations/db_int.sql` into the InsForge SQL editor.

## Run locally

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Notes

- The app uses a browser-generated `visitor_id` stored in `localStorage` so it can work without a full auth flow.
- All InsForge calls happen on the server through Next.js route handlers, which keeps the frontend simple and avoids direct database access from client components.
- If you later want direct client-side InsForge access, add authentication plus RLS before exposing database operations to the browser.
