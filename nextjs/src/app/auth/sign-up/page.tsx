import Link from "next/link";

import { AuthShell } from "@/components/auth-shell";
import { SignUpForm } from "@/components/sign-up-form";
import { getAuthConfig } from "@/lib/auth-actions";

export default async function SignUpPage() {
  const config = await getAuthConfig();

  return (
    <AuthShell
      footer={
        <p className="text-center text-sm text-[var(--muted-foreground)]">
          Already have an account?{" "}
          <Link href="/auth/sign-in" className="text-[var(--foreground)] underline-offset-4 hover:underline">
            Sign in
          </Link>
        </p>
      }
    >
      <div className="space-y-6">
        <SignUpForm providers={config.oAuthProviders ?? []} />
      </div>
    </AuthShell>
  );
}
