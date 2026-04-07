<h1 align="center">React InsForge Starter</h1>

<p align="center">
  The fastest way to build apps with React and InsForge
</p>

<p align="center">
  <a href="#demo"><strong>Demo</strong></a> ·
  <a href="#features"><strong>Features</strong></a> ·
  <a href="#quick-launch"><strong>Quick launch</strong></a> ·
  <a href="#clone-and-run-locally"><strong>Clone and run locally</strong></a> ·
  <a href="#deploy-to-vercel"><strong>Deploy to Vercel</strong></a>
</p>

<p align="center">
  <img src="react-starter.png" alt="React InsForge Starter" />
</p>
<br />

## Demo

Check out the live demo: [demoreact.insforge.site](https://demoreact.insforge.site)

## Features

- Works across a modern [React](https://react.dev) starter stack
  - React 19
  - Vite
  - React Router
  - TypeScript
  - It just works
- [InsForge](https://insforge.dev) auth configured across the starter app
- Viewer state wired through a shared auth context for the starter routes
- Protected example route with signed-in user details and starter steps
- Optional Google and GitHub OAuth providers
- Browser-side auth actions using [`@insforge/sdk`](https://www.npmjs.com/package/@insforge/sdk)
- Starter homepage with environment setup guidance
- Styling with [Tailwind CSS](https://tailwindcss.com)
- Ready for local development and Vercel deployment

## Quick launch

If you want the fastest path, use the InsForge CLI and follow the prompts:

```bash
npx @insforge/cli create
```

From there:

1. Choose the React starter template
2. Follow the prompt flow to create or connect your InsForge project
3. Let the CLI handle the initial setup
4. Choose to deploy with [InsForge](https://insforge.dev) from the guided flow

Use the sections below if you want to set up the starter manually.

## Clone and run locally

1. Clone this repository and move into the starter directory.

```bash
git clone https://github.com/InsForge/insforge-templates.git
cd insforge-templates/react
```

2. Install dependencies.

```bash
npm install
```

3. Go to the [InsForge dashboard](https://insforge.dev), create a project, and click **Connect** → **CLI** to get the link command:

```bash
npx @insforge/cli link --project-id <your-project-id>
```

4. Copy `env.example` to `.env.local` and update the values with your InsForge project settings (find these in the InsForge dashboard under **Connect** → **API Keys**):

```bash
cp env.example .env.local
```

Set the following values in `.env.local`:

```env
VITE_INSFORGE_BASE_URL=https://your-project.region.insforge.app
VITE_INSFORGE_ANON_KEY=your-anon-key
```

You can find the project URL and anon key in your InsForge project settings.

5. Start the development server.

```bash
npm run dev
```

The starter should now be running on [localhost:5173](http://localhost:5173).

## Deploy to Vercel

Click [Deploy with Vercel](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FInsForge%2Finsforge-templates&root-directory=react&project-name=insforge-react-starter&repository-name=insforge-react-starter&env=VITE_INSFORGE_BASE_URL,VITE_INSFORGE_ANON_KEY&envDescription=Connect%20your%20InsForge%20project%20URL%20and%20anon%20key.&external-id=https%3A%2F%2Fgithub.com%2FInsForge%2Finsforge-templates%2Ftree%2Fmain%2Freact&demo-title=React%20InsForge%20Starter&demo-description=A%20clean%20React%20and%20Vite%20starter%20with%20InsForge%20auth%20and%20Tailwind%20CSS.&demo-image=https%3A%2F%2Fraw.githubusercontent.com%2FInsForge%2Finsforge-templates%2Fmain%2Freact%2Freact-starter.png), then fill in the required environment variables during the setup flow:

- `VITE_INSFORGE_BASE_URL`
- `VITE_INSFORGE_ANON_KEY`

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FInsForge%2Finsforge-templates&root-directory=react&project-name=insforge-react-starter&repository-name=insforge-react-starter&env=VITE_INSFORGE_BASE_URL,VITE_INSFORGE_ANON_KEY&envDescription=Connect%20your%20InsForge%20project%20URL%20and%20anon%20key.&external-id=https%3A%2F%2Fgithub.com%2FInsForge%2Finsforge-templates%2Ftree%2Fmain%2Freact&demo-title=React%20InsForge%20Starter&demo-description=A%20clean%20React%20and%20Vite%20starter%20with%20InsForge%20auth%20and%20Tailwind%20CSS.&demo-image=https%3A%2F%2Fraw.githubusercontent.com%2FInsForge%2Finsforge-templates%2Fmain%2Freact%2Freact-starter.png)

After importing into Vercel:

1. In your InsForge dashboard, open `Authentication` → `General` → `Allowed Redirect URLs`
2. Add your deployed callback URL, for example `https://your-project.vercel.app/auth/callback`
3. If you test locally as well, also allow `http://localhost:5173/auth/callback`

The above will also clone the starter kit to your GitHub, so you can clone it locally and continue development there.
