import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { exchangeResetCode, resetPassword, sendResetEmail } from '../lib/auth';

export function ResetPasswordForm() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [token, setToken] = useState('');
  const [step, setStep] = useState<'email' | 'code' | 'password'>('email');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function handleSendEmail(event: React.FormEvent) {
    event.preventDefault();
    setIsLoading(true);
    setError('');
    setMessage('');

    const result = await sendResetEmail(email.trim());

    if (!result.success) {
      setError(result.error);
      setIsLoading(false);
      return;
    }

    setMessage('Check your email for a reset code.');
    setStep('code');
    setIsLoading(false);
  }

  async function handleVerifyCode(event: React.FormEvent) {
    event.preventDefault();
    setIsLoading(true);
    setError('');

    const result = await exchangeResetCode(email.trim(), code.trim());

    if (!result.success) {
      setError(result.error);
      setIsLoading(false);
      return;
    }

    setToken(result.token);
    setStep('password');
    setIsLoading(false);
  }

  async function handleResetPassword(event: React.FormEvent) {
    event.preventDefault();
    setIsLoading(true);
    setError('');

    const result = await resetPassword(newPassword, token);

    if (!result.success) {
      setError(result.error);
      setIsLoading(false);
      return;
    }

    navigate('/auth/sign-in');
  }

  return (
    <div className="auth-stack">
      {step === 'email' ? (
        <>
          <div className="auth-header">
            <h1>Reset password</h1>
            <p>Enter your email and we&apos;ll send you a reset code</p>
          </div>

          <form className="auth-stack" onSubmit={handleSendEmail}>
            <div className="auth-field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>

            {error ? <p className="auth-error">{error}</p> : null}
            {message ? <p className="auth-message">{message}</p> : null}

            <button className="auth-submit" type="submit" disabled={isLoading}>
              {isLoading ? 'Sending...' : 'Send reset code'}
            </button>
          </form>
        </>
      ) : null}

      {step === 'code' ? (
        <>
          <div className="auth-header">
            <h1>Enter reset code</h1>
            <p>
              We sent a code to <span className="auth-strong">{email}</span>
            </p>
          </div>

          <form className="auth-stack" onSubmit={handleVerifyCode}>
            <div className="auth-field">
              <label htmlFor="code">Reset code</label>
              <input
                id="code"
                type="text"
                required
                inputMode="numeric"
                maxLength={6}
                autoComplete="one-time-code"
                placeholder="000000"
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
              />
            </div>

            {error ? <p className="auth-error">{error}</p> : null}
            {message ? <p className="auth-message">{message}</p> : null}

            <button className="auth-submit" type="submit" disabled={isLoading || code.length < 6}>
              {isLoading ? 'Verifying...' : 'Verify code'}
            </button>
          </form>
        </>
      ) : null}

      {step === 'password' ? (
        <>
          <div className="auth-header">
            <h1>Set new password</h1>
            <p>Choose a new password for your account</p>
          </div>

          <form className="auth-stack" onSubmit={handleResetPassword}>
            <div className="auth-field">
              <label htmlFor="new-password">New password</label>
              <input
                id="new-password"
                type="password"
                required
                autoComplete="new-password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
              />
            </div>

            {error ? <p className="auth-error">{error}</p> : null}

            <button className="auth-submit" type="submit" disabled={isLoading}>
              {isLoading ? 'Resetting...' : 'Reset password'}
            </button>
          </form>
        </>
      ) : null}
    </div>
  );
}
