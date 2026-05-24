# SaaS Landing — InsForge Template

A production-ready SaaS marketing site with waitlist signup, pricing, FAQ, dark mode, and an optional auth scaffold. Built with Next.js 16, Tailwind CSS 4, shadcn/ui, and `@insforge/sdk`.

[**Live demo →**](https://marketing.insforge.site)

## Features

- Animated hero with a hand-built dashboard mockup
- Logo cloud (real brand SVGs from simple-icons), features grid, how-it-works, pricing with monthly/yearly toggle
- Testimonials, FAQ accordion, waitlist signup
- Optional sign-in / sign-up / protected dashboard wired to InsForge auth (deletable)
- Dark mode default (`next-themes`, system-aware)
- SEO: Open Graph image, `robots.txt`, `sitemap.xml`
- All marketing copy centralized in `lib/content.ts` — fork-and-rebrand in one file

## Quick start

1. **Create an InsForge project** at https://app.insforge.dev and copy the project URL + anon key.
2. **Configure env vars:**

   ```bash
   cp .env.example .env.local
   # edit .env.local with your InsForge URL and anon key
   ```

3. **Apply the database migration:**

   ```bash
   npx @insforge/cli db import migrations/db_init.sql
   ```

4. **Add redirect URLs in the InsForge dashboard** — under Auth → Settings, add:
   - `http://localhost:3000`
   - `http://localhost:3000/dashboard`
   - `http://localhost:3000/auth/callback`

   (Add your production URLs the same way after deploying.)

5. **Run locally:**

   ```bash
   npm install
   npm run dev
   ```

Visit http://localhost:3000.

## Customize

- **Rebrand** — edit `lib/content.ts` (all copy lives here).
- **Swap logos** — replace SVGs in `public/logos/`.
- **Drop a section** — delete its file in `components/sections/` and remove the import in `app/page.tsx`.
- **Remove auth entirely** — delete `app/(auth)/`, `app/dashboard/`, `app/auth/callback/`, `lib/auth-actions.ts`, `lib/auth-cookies.ts`, `components/sign-in-form.tsx`, `components/sign-up-form.tsx`, `components/oauth-button.tsx`.
- **Regenerate the OG image** — edit `scripts/generate-og.tsx`, then run `npm run generate:og`.

## Deploy

The fastest path is Vercel:

1. Push this directory to a GitHub repo.
2. Import the repo into Vercel.
3. Set the same env vars from `.env.example` in Vercel's project settings.
4. After the first deploy, add your production URL to the redirect-URLs list in the InsForge dashboard (Auth → Settings).

## Scripts

- `npm run dev` — start dev server with Turbopack
- `npm run build` — production build
- `npm run start` — start production build
- `npm run typecheck` — run TypeScript without emit
- `npm test` — run unit tests (Vitest)
- `npm run generate:og` — regenerate `public/og-default.png`

## License

Apache-2.0
