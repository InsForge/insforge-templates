import Link from 'next/link';
import { AuthShell } from '@/components/auth-shell';
import { ResetPasswordForm } from '@/components/reset-password-form';
import { getAuthConfig } from '@/lib/auth-actions';

export const dynamic = 'force-dynamic';

export default async function ResetPasswordPage() {
  const config = await getAuthConfig();
  const resetMethod = (config.resetPasswordMethod ?? 'code').toLowerCase();

  return (
    <AuthShell
      eyebrow="Reset password"
      title="Recover access"
      description={
        resetMethod === 'link'
          ? 'Request a reset link and finish the password update from your email.'
          : 'Request a reset code, verify it here, and choose a new password.'
      }
    >
      <ResetPasswordForm resetPasswordMethod={resetMethod} />

      <p className="text-center text-sm text-muted-foreground">
        Back to{' '}
        <Link href="/auth/sign-in" className="text-foreground underline-offset-4 hover:underline">
          sign in
        </Link>
      </p>
    </AuthShell>
  );
}
