<div align="center">
  <a href="https://insforge.dev">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/InsForge/InsForge/main/assets/logo-dark.svg">
      <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/InsForge/InsForge/main/assets/logo-light.svg">
      <img src="https://raw.githubusercontent.com/InsForge/InsForge/main/assets/logo-dark.svg" alt="InsForge" width="500">
    </picture>
  </a>

  <p>
    <a href="https://insforge.dev"><img src="https://insforge.dev/badge-made-with-insforge-dark.svg" alt="Made with InsForge"></a>
    <a href="https://github.com/InsForge/InsForge"><img src="https://img.shields.io/badge/github-InsForge-181717?logo=github&logoColor=white" alt="GitHub"></a>
    <a href="https://x.com/InsForge_dev"><img src="https://img.shields.io/badge/X-%40InsForge__dev-000000?logo=x&logoColor=white" alt="X"></a>
    <a href="https://discord.gg/DvBtaEc9Jz"><img src="https://img.shields.io/badge/community-Discord-5865F2?logo=discord&logoColor=white" alt="Join community"></a>
  </p>

  <p>
    <a href="https://www.npmjs.com/package/@insforge/cli"><img src="https://img.shields.io/npm/v/@insforge/cli" alt="npm version"></a>
    <a href="https://www.npmjs.com/package/@insforge/cli"><img src="https://img.shields.io/npm/dy/@insforge/cli" alt="npm downloads"></a>
    <a href="./LICENSE"><img src="https://img.shields.io/badge/license-MIT-green" alt="License"></a>
  </p>

</div>

## InsForge Templates

Production-ready starters and app templates for Next.js and React.

This repository collects standalone templates you can use to start a new InsForge app quickly, whether you want a minimal framework starter or a more complete product-style template such as a chatbot, CRM, or e-commerce storefront.

## Quick Start

The fastest way to get started is with the InsForge CLI:

```bash
npx @insforge/cli create
```

If you prefer to inspect a template manually, clone this repository, move into a template directory, and follow that template's local setup instructions.

## Templates

### Starters

| Template | Framework | Best for | Includes |
| --- | --- | --- | --- |
| [`nextjs`](./nextjs) | Next.js App Router | Learning how to build a Next.js app with InsForge from a clean starting point | InsForge auth setup, protected route example, OAuth support, Tailwind CSS, starter guidance |
| [`react`](./react) | React + Vite | Learning how to use InsForge in a client-side React app | InsForge auth context, protected route example, OAuth support, Tailwind CSS, starter guidance |

### App Templates

| Template | Framework | Best for | Includes |
| --- | --- | --- | --- |
| [`chatbot`](./chatbot) | Next.js App Router | Building an AI chat product on top of InsForge | Persisted chat history, file uploads, auth, storage, optional Vercel AI Gateway support |
| [`crm`](./crm) | Next.js App Router | Building an authenticated internal tool or CRM | Sales pipeline, lead management, client flows, RLS, seeded defaults |
| [`e-commerce`](./e-commerce) | Next.js App Router | Launching a storefront with user accounts and checkout | Seeded catalog, product pages, cart, checkout, account area, analytics |

## Features

- Framework starters and app templates built with [Next.js](https://nextjs.org), [React](https://react.dev), and [Vite](https://vite.dev)
- UI foundations built with [Tailwind CSS](https://tailwindcss.com) across the repository
- Authentication, database, and storage integration with [InsForge](https://insforge.dev)
- Per-template setup guides and example environment variables for local development
- Deployment paths designed to work well with [Vercel](https://vercel.com)
- Templates designed to be adapted into real products

## Repository Structure

```text
insforge-templates/
├── chatbot/
├── crm/
├── e-commerce/
├── nextjs/
├── react/
└── ...
```

Each directory is an independent template with its own dependencies, environment variables, and setup instructions.

## Getting Started Manually

1. Clone the repository.
2. Move into the template you want to use.
3. Install dependencies with `npm install`.
4. Copy the template's example environment file.
5. Follow that template's `README.md` for any required InsForge migration, local setup, and deployment steps.

## Per-Template Documentation

For full setup details, go directly to the template README you want to use:

- [`chatbot/README.md`](./chatbot/README.md)
- [`crm/README.md`](./crm/README.md)
- [`e-commerce/README.md`](./e-commerce/README.md)
- [`nextjs/README.md`](./nextjs/README.md)
- [`react/README.md`](./react/README.md)

## Provide Feedback

- [Open an issue](../../issues/new) if you believe you've encountered a bug that you want to flag for the team.
