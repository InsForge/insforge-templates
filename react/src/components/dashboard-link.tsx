declare const __INSFORGE_PROJECT_ID__: string | null;

function ExternalLinkIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block ml-1">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

function getDashboardUrl(): string {
  if (__INSFORGE_PROJECT_ID__) {
    return `https://insforge.dev/dashboard/project/${__INSFORGE_PROJECT_ID__}`;
  }
  return "https://insforge.dev/dashboard";
}

export function DashboardLink({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <a
      href={getDashboardUrl()}
      target="_blank"
      rel="noreferrer"
      className={className ?? "font-medium text-[var(--foreground)] hover:underline"}
    >
      {children ?? "InsForge Dashboard"}
      <ExternalLinkIcon />
    </a>
  );
}
