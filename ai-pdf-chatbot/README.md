<a href="https://insforge.dev">
  <h1 align="center">InsForge AI Notebook</h1>
</a>

<p align="center">
  Open-source NotebookLM for students. Workspaces of PDFs come with auto-generated mindmaps, spaced-repetition flashcards, two-host podcast summaries, and RAG chat that highlights cited passages inside the source PDF.
</p>

<p align="center">
  <a href="#features"><strong>Features</strong></a> ·
  <a href="#demo"><strong>Demo</strong></a> ·
  <a href="#quick-launch"><strong>Quick Launch</strong></a> ·
  <a href="#run-locally"><strong>Run Locally</strong></a> ·
  <a href="#prerequisites"><strong>Prerequisites</strong></a> ·
  <a href="#architecture"><strong>Architecture</strong></a>
</p>

## Features

NotebookLM-style learning features:

- **Workspaces.** Group related PDFs, chats, mindmaps, and flashcards into one notebook-style container. Cross-document RAG inside a workspace.
- **Inline PDF viewer.** Click a `[n]` citation, the source PDF slides in from the right at the cited page with the passage highlighted.
- **Mindmap.** Workspace-wide concept tree, generated from PDF summaries and rendered as an interactive Markmap.
- **Spaced-repetition flashcards.** Generated from the PDF content, dropped into a per-workspace SRS queue (SM-2 lite, three review grades).
- **Audio Overview.** Two-host podcast summary, opt-in via `OPENAI_API_KEY`. Prompt adapted from [open-notebooklm](https://github.com/gabrielchua/open-notebooklm).

Production-grade plumbing under the hood:

- Next.js 16 App Router
- PDF upload (≤ 10 MB) with server-side extraction via `pdfjs-dist`
- Vector search on InsForge pgvector (`vector(1536)` + ivfflat cosine)
- Streaming RAG chat with bracketed `[n]` source citations (NDJSON)
- **Better Auth** for email + password sign-in. User/session tables live in your InsForge Postgres.
- HS256 bridge JWT from BA → InsForge: RLS reads `requesting_user_id()` so every user only sees their own data.
- shadcn/ui + Tailwind 4 design tokens

## Demo

[aipdfchat.insforge.site](https://aipdfchat.insforge.site) — sign up with any email, upload a PDF, ask away.

## Why this template

| | NotebookLM | ChatPDF | LangChain RAG demo | **This template** |
|---|---|---|---|---|
| Workspaces + cross-PDF RAG | yes | no | no | yes |
| Inline PDF passage highlight | partial | no | no | yes |
| Mindmap from PDFs | yes | no | no | yes |
| Spaced-repetition flashcards | no | partial | no | yes |
| Two-host audio podcast | yes | no | no | yes (opt-in) |
| Self-hosted, your data | no | no | yes | yes |
| Open source, swap any model | no | no | yes | yes |
| Multi-tenant out of the box | no | yes | no | yes (Better Auth + RLS) |
| Ready to ship a real product | no | yes | no | yes |

If you want to fork a NotebookLM-style study tool and run it on infrastructure you control, this is the closest open-source starting point.

## Quick Launch

Fastest path:

```bash
npx @insforge/cli create
```

1. Pick the **AI PDF Chatbot** template.
2. Create or connect your InsForge project.
3. The CLI provisions the project and fills the `NEXT_PUBLIC_INSFORGE_*` and `DATABASE_URL` values into `.env.local`.
4. Fill in the remaining BA secrets (see below), then `npm run setup && npm run dev`.

## Run Locally

If you'd rather clone manually:

```bash
git clone https://github.com/InsForge/insforge-templates.git
cd insforge-templates/ai-pdf-chatbot
npm install
```

1. Create a project at [insforge.dev](https://insforge.dev) and copy its **URL** and **anon key** from **Connect → API Keys**.
2. Link this directory:

   ```bash
   npx @insforge/cli link --project-id <your-project-id>
   ```

3. Copy the env example and fill in:

   ```bash
   cp .env.example .env.local
   ```

   - `NEXT_PUBLIC_INSFORGE_BASE_URL`, `NEXT_PUBLIC_INSFORGE_ANON_KEY` — from the dashboard
   - `DATABASE_URL` — the Postgres connection string for the BA tables (cloud: from the dashboard; self-hosted: the default `postgresql://postgres:postgres@127.0.0.1:5432/insforge` works against the local stack)
   - `BETTER_AUTH_SECRET` — `openssl rand -hex 32`
   - `BETTER_AUTH_URL` and `NEXT_PUBLIC_BETTER_AUTH_URL` — `http://localhost:3000` for dev
   - `INSFORGE_JWT_SECRET` — `npx @insforge/cli secrets get JWT_SECRET`

4. Generate the BA tables and create the storage bucket:

   ```bash
   npm run setup
   ```

   `npx @insforge/cli link` (step 2) already applied `migrations/db_init.sql`, which created the `better_auth` schema, the `requesting_user_id()` helper, the app tables (`documents`, `document_chunks`, `chat_sessions`, `chat_messages`), all RLS policies, and the per-bucket storage grants. `npm run setup` now only runs `better-auth migrate` to populate `better_auth.{user,session,account,verification}` and creates the `pdf-documents` storage bucket.

5. Start the dev server:

   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000).

## Prerequisites

- **InsForge project with AI billing enabled.** The template calls `client.ai.embeddings.create` and `client.ai.chat.completions.create`; both route through OpenRouter under the hood. Free-tier quota runs out quickly under regular use.
- **pgvector extension** — the migration runs `create extension if not exists vector;` against the `public` schema. Supported on any standard InsForge project.
- **Node 18+** for `node:test` and the ESM `pdfjs-dist` build.
- **InsForge SMTP** configured if you want password resets to send mail. Cloud projects: configured automatically. Self-hosted: `PUT /api/auth/smtp-config`.
- **OpenAI API key (optional)** — required only for the Audio Overview tab. Set `OPENAI_API_KEY` in `.env.local`; without it the workspace audio tab shows a friendly "configure to enable" prompt and everything else still works.

## Architecture

```
Sign in (Better Auth) ──► same-origin cookie ──► /api/insforge-token signs HS256
                                                            │
                                                            ▼
                                  edgeFunctionToken on InsForge client
                                                            │
                                                            ▼
                              RLS policies read `sub` via requesting_user_id()

PDF upload ──► /api/documents/upload ──► storage.upload + insert documents row + ingest()
                                              │
                                              ▼
                       parsePdf (pdfjs-dist legacy) ──► chunkPages (~800 chars)
                                              │
                                              ▼
                  client.ai.embeddings.create (batches of 16)
                                              │
                                              ▼
                    insert document_chunks (vector(1536), ivfflat)

Chat ──► /api/chat (NDJSON stream) ──► embed(question) ──► match_document_chunks RPC
                                                                  │
                                                                  ▼
                                  send {type:'citations'} to client
                                                                  │
                                                                  ▼
              client.ai.chat.completions.create({ stream: true })  ──► {type:'delta'}…{type:'done'}
                                                                  │
                                                                  ▼
                  persist assistant message with citations payload
```

## Audio Overview

The Audio tab generates a NotebookLM-style two-host podcast summary of every PDF in a workspace.

**How it works:**

1. `lib/ai/audio-script.ts` calls InsForge AI (chat completion) with a producer-style prompt adapted from [open-notebooklm](https://github.com/gabrielchua/open-notebooklm). Sarah hosts and interviews Mike, a subject-matter expert. The asymmetric framing prevents the "two co-hosts agreeing with each other" failure mode.
2. `lib/audio/tts.ts` synthesizes each turn through OpenAI TTS (`gpt-4o-mini-tts`, `nova` voice for Sarah, `onyx` for Mike), 4 turns in parallel.
3. mp3 frames are concatenated naively (good enough for a study tool; swap in `ffmpeg.wasm` if you need gapless playback).
4. The final mp3 lands in the `audio-overviews` storage bucket (public read), and `workspaces.audio_url` + `audio_script` are cached so the tab renders instantly on revisit.

**Cost:** about $0.006 per regeneration (700 chars TTS at `tts-1` pricing). The chat completion that drafts the script runs on InsForge AI and counts against your existing AI quota.

**Without `OPENAI_API_KEY`:** the Audio tab shows a friendly "configure to enable" prompt. Every other feature works.

**Want a different TTS?** Edit `lib/audio/tts.ts`. ElevenLabs and Cartesia have OpenAI-compatible HTTP endpoints. The voice-per-speaker mapping (`VOICE_BY_SPEAKER`) is the only thing to swap.

**Want a better script?** Set `UTILITY_MODEL` in `lib/ai/constants.ts` from `gpt-4o-mini` to `gpt-4o`. Cost goes from $0.006 to ~$0.04 per generation, but you start getting analogies, anecdotes, and "aha moments" the mini model can't produce.

## Customizing

- **Switch embedding model:** edit `lib/ai/constants.ts` (`EMBEDDING_MODEL`, `EMBEDDING_DIMENSIONS`). If the dimension changes, also `ALTER TABLE document_chunks ALTER COLUMN embedding TYPE vector(N)` and re-ingest existing documents.
- **Switch chat model:** edit `CHAT_MODEL` in the same file.
- **Add file types:** swap `lib/pdf/parse.ts` for the right parser; the rest of the pipeline (chunker, embedder, retriever) is format-agnostic.

## License

MIT — see `LICENSE`.
