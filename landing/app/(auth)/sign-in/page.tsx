import Link from 'next/link';
import type { Metadata } from 'next';
import { SignInForm } from '@/components/sign-in-form';
import { brand } from '@/lib/content';

export const metadata: Metadata = { title: 'Sign in' };

export default function SignInPage() {
  return (
    <main className="grid min-h-screen place-items-center px-6">
      <div className="w-full max-w-sm space-y-6">
        <Link href="/" className="flex items-center justify-center gap-2 font-semibold tracking-tight">
          <div className="size-6 rounded-md bg-primary" aria-hidden />
          {brand.name}
        </Link>
        <div className="rounded-2xl border border-border bg-card p-6">
          <h1 className="text-xl font-semibold tracking-tight">Welcome back</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sign in to your account to continue.</p>
          <div className="mt-6">
            <SignInForm />
          </div>
        </div>
      </div>
    </main>
  );
}
