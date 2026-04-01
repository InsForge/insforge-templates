export function DeployButton() {
  return (
    <a
      href="https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FInsForge%2Finsforge-templates%2Ftree%2Fmain&root-directory=nextjs&project-name=insforge-nextjs-starter&repository-name=insforge-nextjs-starter&env=NEXT_PUBLIC_INSFORGE_URL,NEXT_PUBLIC_INSFORGE_ANON_KEY,NEXT_PUBLIC_APP_URL&envDescription=Connect%20your%20InsForge%20project%20URL%2C%20anon%20key%2C%20and%20app%20URL.&external-id=https%3A%2F%2Fgithub.com%2FInsForge%2Finsforge-templates%2Ftree%2Fmain%2Fnextjs&demo-title=Next.js%20InsForge%20Starter&demo-description=A%20clean%20Next.js%20starter%20with%20InsForge%20auth%20and%20Tailwind%20CSS.&demo-image=https%3A%2F%2Fraw.githubusercontent.com%2FInsForge%2Finsforge-templates%2Fmain%2Fnextjs%2Fassets%2Fnextjs-starter.png"
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-2 rounded-md bg-stone-950 px-3 py-2 text-xs font-medium text-white hover:bg-stone-800"
    >
      <svg
        className="h-3 w-3"
        viewBox="0 0 76 65"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" />
      </svg>
      <span>Deploy to Vercel</span>
    </a>
  );
}
