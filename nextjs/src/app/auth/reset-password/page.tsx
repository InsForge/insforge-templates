import Link from "next/link";

import { ResetPasswordForm } from "@/components/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-white px-4">
      <div className="w-full max-w-sm space-y-6 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <ResetPasswordForm />

        <p className="text-center text-sm text-stone-500">
          <Link href="/auth/sign-in" className="text-stone-950 underline-offset-4 hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
