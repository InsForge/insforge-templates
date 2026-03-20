# InsForge E-Commerce

A full-stack customer e-commerce template built with Next.js 16, React 19, Tailwind CSS 4, and InsForge.

## What is included

- InsForge authentication with email/password, OAuth, verification, and password reset
- Single-file backend bootstrap in [`migrations/db_init.sql`](./migrations/db_init.sql)
- Public catalog with categories, featured products, and seeded inventory
- Variant-aware product detail pages with color, size, and finish selection
- Authenticated cart + checkout flow backed by real database tables
- Saved shipping addresses and order snapshots
- Customer order history
- Row Level Security for customer data

## Backend setup

The entire database schema and seed data now live in one file:

```bash
insforge db query "$(cat migrations/db_init.sql)"
```

That command is idempotent and matches the current linked backend schema used by this template.
It creates:

- all storefront tables
- variant and option tables
- the `product-images` public storage bucket
- RLS policies and helper functions
- the seeded 15-product catalog

The seeded catalog uses remote placeholder furniture photography through `image_url`, so the app works immediately even before any bucket uploads. In production, developers should upload their own product photography and save the final public URL into each product or variant `image_url`.

## Environment

Copy `.env.example` to `.env.local` and provide:

```bash
NEXT_PUBLIC_INSFORGE_URL=https://your-project.region.insforge.app
NEXT_PUBLIC_INSFORGE_ANON_KEY=your-anon-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Run locally

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Verification

```bash
npm run typecheck
npm run build
```

## Notes

- The app uses server-side InsForge SDK calls with httpOnly auth cookies.
- Checkout is performed through the `place_order` database function for an atomic order write.
- `migrations/db_init.sql` is the only database init file new developers need for schema plus seed data.
- In production, developers should upload their own product photography to the `product-images` bucket and update each product's `image_url`. The current seeded images are placeholders only.
