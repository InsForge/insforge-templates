<a href="https://insforge.dev">
  <h1 align="center">InsForge AI PDF Chatbot</h1>
</a>

<p align="center">
  Upload PDFs and chat with them. RAG with citations powered by InsForge pgvector + InsForge AI.
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

- Next.js 16 App Router
- PDF upload (≤ 10 MB) with server-side extraction via `pdfjs-dist`
- Vector search on InsForge pgvector (`vector(1536)` + ivfflat cosine)
- Streaming chat with bracketed `[n]` source citations
- Email + OAuth (Google, GitHub) sign-in via InsForge Auth
- Row-level security: every user only sees their own documents and chats
- shadcn/ui + Tailwind 4 design tokens

## Demo

[aipdfchat.insforge.site](https://aipdfchat.insforge.site) — sign up with any email, upload a PDF, ask away.

## Quick Launch

Fastest path:

```bash
npx @insforge/cli create
```

1. Pick the **AI PDF Chatbot** template.
2. Create or connect your InsForge project.
3. The CLI provisions the project, fills `.env.local`, applies `migrations/db_init.sql`, and creates the `pdf-documents` bucket.
4. `npm run dev` and open `http://localhost:3000`.

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

3. Copy the env example and fill in the two `NEXT_PUBLIC_INSFORGE_*` values:

   ```bash
   cp .env.example .env.local
   ```

4. Apply the schema and create the storage bucket:

   ```bash
   npx @insforge/cli db import migrations/db_init.sql
   npm run setup
   ```

5. Start the dev server:

   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000).

## Prerequisites

- **InsForge project with AI billing enabled.** The template calls `client.ai.embeddings.create` and `client.ai.chat.completions.create`; both route through OpenRouter under the hood. Free-tier quota runs out quickly under regular use.
- **pgvector extension** — the migration runs `create extension if not exists vector;` against the `public` schema. Supported on any standard InsForge project.
- **Node 18+** for `node:test` and the ESM `pdfjs-dist` build.

## Architecture

```
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

## Customizing

- **Switch embedding model:** edit `lib/ai/constants.ts` (`EMBEDDING_MODEL`, `EMBEDDING_DIMENSIONS`). If the dimension changes, also `ALTER TABLE document_chunks ALTER COLUMN embedding TYPE vector(N)` and re-ingest existing documents.
- **Switch chat model:** edit `CHAT_MODEL` in the same file.
- **Add file types:** swap `lib/pdf/parse.ts` for the right parser; the rest of the pipeline (chunker, embedder, retriever) is format-agnostic.

## License

MIT — see `LICENSE`.
