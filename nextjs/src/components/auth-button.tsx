import Link from "next/link";

import { getCurrentViewer } from "@/lib/auth-state";

import { LogoutButton } from "@/components/logout-button";

export async function AuthButton() {
  const viewer = await getCurrentViewer();

  if (!viewer.isAuthenticated) {
    return (
      <div className="flex gap-2">
        <Link
          href="/auth/sign-in"
          className="inline-flex items-center rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-medium text-[var(--foreground)] hover:bg-[var(--surface-muted)]"
        >
          Sign in
        </Link>
        <Link
          href="/auth/sign-up"
          className="inline-flex items-center rounded-md border border-[var(--foreground)] bg-[var(--foreground)] px-3 py-2 text-xs font-medium text-[var(--surface)] opacity-100 transition hover:opacity-90"
        >
          Sign up
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 text-xs font-medium text-[var(--muted-foreground)]">
      <span>Hey, {viewer.name || viewer.email || "there"}!</span>
      <LogoutButton />
    </div>
  );
}
