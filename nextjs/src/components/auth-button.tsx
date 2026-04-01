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
          className="inline-flex items-center rounded-md border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-stone-900 hover:bg-stone-50"
        >
          Sign in
        </Link>
        <Link
          href="/auth/sign-up"
          className="inline-flex items-center rounded-md border border-stone-950 bg-stone-950 px-3 py-2 text-xs font-medium text-white hover:bg-stone-800"
        >
          Sign up
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 text-xs font-medium text-stone-700">
      <span>Hey, {viewer.name || viewer.email || "there"}!</span>
      <LogoutButton />
    </div>
  );
}
