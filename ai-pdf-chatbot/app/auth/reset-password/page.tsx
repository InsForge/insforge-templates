import Link from 'next/link';
import { AuthShell } from '@/components/auth-shell';
import { ResetPasswordForm } from '@/components/reset-password-form';

export const dynamic = 'force-dynamic';

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const { token: rawToken } = await searchParams;
  // Next.js parses repeated query params as `string[]` (e.g.
  // `?token=a&token=b`). Reset links only carry one token; take the
  // first if duplicated, ignore array shape elsewhere in the page.
  const token = Array.isArray(rawToken) ? rawToken[0] ?? null : rawToken ?? null;
  const hasToken = Boolean(token);

  return (
    <AuthShell
      eyebrow="Reset password"
      title="Recover access"
      description={
        hasToken
          ? 'Choose a new password to finish recovering your account.'
          : 'Enter your email and we’ll send a reset link.'
      }
    >
      <ResetPasswordForm token={token} />

      <p className="text-center text-sm text-muted-foreground">
        Back to{' '}
        <Link href="/auth/sign-in" className="text-foreground underline-offset-4 hover:underline">
          sign in
        </Link>
      </p>
    </AuthShell>
  );
}
