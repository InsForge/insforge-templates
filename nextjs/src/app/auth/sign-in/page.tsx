import Link from "next/link";

import { AuthShell } from "@/components/auth-shell";
import { SignInForm } from "@/components/sign-in-form";
import { getAuthConfig } from "@/lib/auth-actions";

export default async function SignInPage() {
  const config = await getAuthConfig();

  return (
    <AuthShell
      footer={
        <p className="text-center text-sm text-[var(--muted-foreground)]">
          Don&apos;t have an account?{" "}
          <Link href="/auth/sign-up" className="text-[var(--foreground)] underline-offset-4 hover:underline">
            Sign up
          </Link>
        </p>
      }
    >
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-[var(--foreground)]">Welcome back</h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">Sign in to your account</p>
        </div>

        <SignInForm providers={config.oAuthProviders ?? []} />
      </div>
    </AuthShell>
  );
}
