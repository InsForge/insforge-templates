import Link from "next/link";

import { SignInForm } from "@/components/sign-in-form";
import { getAuthConfig } from "@/lib/auth-actions";

export default async function SignInPage() {
  const config = await getAuthConfig();

  return (
    <div className="flex min-h-dvh items-center justify-center bg-white px-4">
      <div className="w-full max-w-sm space-y-6 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-stone-950">Welcome back</h1>
          <p className="mt-1 text-sm text-stone-500">Sign in to your account</p>
        </div>

        <SignInForm providers={config.oAuthProviders ?? []} />

        <p className="text-center text-sm text-stone-500">
          Don&apos;t have an account?{" "}
          <Link href="/auth/sign-up" className="text-stone-950 underline-offset-4 hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
