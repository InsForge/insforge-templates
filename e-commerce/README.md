# InsForge E-Commerce

A full-stack e-commerce starter built with Next.js, Tailwind CSS, and InsForge.

**[Features](#features)** · **[Demo](#demo)** · **[Quick Launch](#quick-launch)** · **[Run locally](#run-locally)** · **[Deploy to Vercel](#deploy-to-vercel)** · **[First Try](#first-try)**

![InsForge E-Commerce starter preview](public/e-commerce-readme-cover.png)

This starter includes a public storefront, seeded catalog data, customer authentication, cart and checkout flows, saved addresses, order history, and the database + storage setup needed to run it from one migration file.

## Features

- Seeded storefront with featured products, categories, and search
- Variant-aware product pages and customer shopping flow
- Authenticated cart, checkout, saved addresses, and order history
- [InsForge](https://insforge.dev) authentication, database, storage, and Row Level Security
- Built with [Next.js](https://nextjs.org), React 19, and [Tailwind CSS](https://tailwindcss.com)

## Demo

Demo: [insforge-ecommerce.vercel.app](https://insforge-ecommerce.vercel.app/)

The starter includes a seeded storefront, category browsing, product detail pages, cart and checkout flows, and customer account pages for first-run evaluation.

## Quick Launch

If you want the fastest path, use the InsForge CLI and follow the prompts:

```bash
npx @insforge/cli create
```

From there:

1. Choose the e-commerce template
2. Create or connect your InsForge project
3. Let the CLI set up the project files
4. Choose to deploy with [Vercel](https://vercel.com) automatically from the guided flow

Use the local setup below if you want to inspect the repo, edit environment variables manually, or control the setup step by step.

## Run locally

1. Clone the repository and move into the e-commerce template:

   ```bash
   git clone https://github.com/InsForge/insforge-templates.git
   cd insforge-templates/e-commerce
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Copy the example environment file:

   ```bash
   cp .env.example .env.local
   ```

4. Fill in the required values:

   ```env
   NEXT_PUBLIC_INSFORGE_URL=https://your-project.region.insforge.app
   NEXT_PUBLIC_INSFORGE_ANON_KEY=your-anon-key
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

5. Apply the included schema and seed data to your InsForge project:

   ```bash
   insforge db import migrations/db_init.sql
   ```

   This migration creates the storefront tables, checkout functions, RLS policies, the `product-images` storage bucket record, and the seeded 15-product catalog.

6. Start the dev server:

   ```bash
   npm run dev
   ```

7. Open [http://localhost:3000](http://localhost:3000)

## Deploy to Vercel

After cloning the repo and running the starter locally, you can deploy it on Vercel:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FInsForge%2Finsforge-templates&root-directory=e-commerce&project-name=insforge-ecommerce&repository-name=insforge-ecommerce&env=NEXT_PUBLIC_INSFORGE_URL,NEXT_PUBLIC_INSFORGE_ANON_KEY&envDescription=Connect%20your%20InsForge%20project%20URL%20and%20anon%20key.&external-id=https%3A%2F%2Fgithub.com%2FInsForge%2Finsforge-templates%2Ftree%2Fmain%2Fe-commerce&demo-title=InsForge%20E-Commerce&demo-description=A%20full-stack%20e-commerce%20starter%20built%20with%20Next.js%2C%20Tailwind%20CSS%2C%20and%20InsForge.)

1. Set `NEXT_PUBLIC_INSFORGE_URL`
2. Set `NEXT_PUBLIC_INSFORGE_ANON_KEY`
3. Deploy the project
4. In Vercel, open your project, go to `Settings` → `Environment Variables`, and set `NEXT_PUBLIC_APP_URL` to your deployed app URL
5. Redeploy the project
6. In the InsForge dashboard, open `Authentication` → `General` → `Allowed Redirect URLs`, then add:
   - `http://localhost:3000/auth/callback`
   - `https://your-project.vercel.app/auth/callback`

## First Try

After the migration runs, the starter opens with a seeded home page, featured products, categories, and product detail pages backed by real database records. Sign up, add items to the cart, complete checkout, and then open the account area to review saved addresses and order history.

## Notes

- The seeded catalog uses remote placeholder furniture photography through `image_url`, so the storefront works immediately before any bucket uploads.
- In production, replace the placeholder photography with your own assets and update each product or variant `image_url`.
- Checkout is written through the `place_order` database function for an atomic order write.
- The app uses server-side [InsForge](https://insforge.dev) SDK calls with `httpOnly` auth cookies.
