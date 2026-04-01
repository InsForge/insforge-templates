function RefreshIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
    </svg>
  );
}

export function RefreshButton({ onRefresh, isRefreshing }: { onRefresh: () => void; isRefreshing: boolean }) {
  return (
    <button
      type="button"
      onClick={onRefresh}
      disabled={isRefreshing}
      className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-xs font-medium text-[var(--muted-foreground)] transition hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)] disabled:opacity-50"
    >
      <RefreshIcon />
      {isRefreshing ? "Checking..." : "Check for updates"}
    </button>
  );
}
