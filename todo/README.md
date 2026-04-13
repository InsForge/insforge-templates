<h1 align="center">To Do List</h1>

<p align="center">
  A simple to-do list app built with Next.js and InsForge
</p>

<p align="center">
  <a href="https://demotodo.insforge.site"><strong>Live Demo</strong></a> ·
  <a href="#features"><strong>Features</strong></a> ·
  <a href="#quick-launch"><strong>Quick launch</strong></a> ·
  <a href="#database-setup"><strong>Database setup</strong></a> ·
  <a href="#clone-and-run-locally"><strong>Clone and run locally</strong></a>
</p>
<br />

## Features

- Simple to-do list UI with add, toggle, and display
- Built with [Next.js](https://nextjs.org) App Router and [Tailwind CSS](https://tailwindcss.com)
- [InsForge](https://insforge.dev) database for persistent storage


## Quick launch

Use the InsForge CLI to get started:

```bash
npx @insforge/cli create
```

Choose the **To Do List** template and follow the prompts.

## Database setup

Apply the database schema (creates the `todo` table, grants permissions, and sets up the storage bucket):

```bash
npx @insforge/cli db import migrations/db_init.sql
```

## Clone and run locally

1. Clone this repository:

```bash
git clone https://github.com/InsForge/insforge-templates.git
cd insforge-templates/todo
```

2. Install dependencies:

```bash
npm install
```

3. Link your InsForge project:

```bash
npx @insforge/cli link --project-id <your-project-id>
```

4. Copy `.env.example` to `.env.local` and fill in your project settings:

```bash
cp .env.example .env.local
```

5. Start the development server:

```bash
npm run dev
```

The app should now be running on [localhost:3000](http://localhost:3000).
