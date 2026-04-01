const ExternalLinkIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="inline-block ml-1"
  >
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

function getProjectIdFromLinkFile(): string | null {
  try {
    const fs = require("fs");
    const path = require("path");
    const filePath = path.resolve(process.cwd(), ".insforge", "project.json");
    const content = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    return content.project_id ?? null;
  } catch {
    return null;
  }
}

function getDashboardUrl(): string {
  const projectId = getProjectIdFromLinkFile();
  if (projectId) {
    return `https://insforge.dev/dashboard/project/${projectId}`;
  }
  return "https://insforge.dev/dashboard";
}

export function DashboardLink({ children, className }: { children?: React.ReactNode; className?: string }) {
  const href = getDashboardUrl();

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={className ?? "font-medium text-[var(--foreground)] hover:underline"}
    >
      {children ?? "InsForge Dashboard"}
      <ExternalLinkIcon />
    </a>
  );
}
