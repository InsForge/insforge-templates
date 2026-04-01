import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { resendVerification, signUp, verifyEmail } from '../lib/auth';
import { useAuth } from '../lib/auth-context';
import { OAuthProviderButtons } from './oauth-provider-buttons';

export function SignUpForm({ providers }: { providers: string[] }) {
  const navigate = useNavigate();
  const { refreshViewer } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'register' | 'verify'>('register');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function handleSignUp(event: React.FormEvent) {
    event.preventDefault();
    setIsLoading(true);
    setError('');
    setMessage('');

    const result = await signUp(email.trim(), password, name.trim());

    if (!result.success) {
      setError(result.error);
      setIsLoading(false);
      return;
    }

    if (result.requireVerification) {
      setStep('verify');
      setMessage('Check your email for a verification code.');
      setIsLoading(false);
      return;
    }

    await refreshViewer();
    navigate('/protected');
  }

  async function handleVerify(event: React.FormEvent) {
    event.preventDefault();
    setIsLoading(true);
    setError('');

    const result = await verifyEmail(email.trim(), otp.trim());

    if (result.success) {
      await refreshViewer();
      navigate('/protected');
      return;
    }

    setError(result.error);
    setIsLoading(false);
  }

  async function handleResend() {
    setError('');
    setMessage('');
    const result = await resendVerification(email.trim());

    if (result.success) {
      setMessage('Verification code resent.');
      return;
    }

    setError(result.error);
  }

  if (step === 'verify') {
    return (
      <div className="auth-stack">
        <div className="auth-header">
          <h1>Verify your email</h1>
          <p>
            We sent a 6-digit code to <span className="auth-strong">{email}</span>
          </p>
        </div>

        <form className="auth-stack" onSubmit={handleVerify}>
          <div className="auth-field">
            <label htmlFor="otp">Verification code</label>
            <input
              id="otp"
              type="text"
              required
              inputMode="numeric"
              maxLength={6}
              autoComplete="one-time-code"
              placeholder="000000"
              value={otp}
              onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
            />
          </div>

          {error ? <p className="auth-error">{error}</p> : null}
          {message ? <p className="auth-message">{message}</p> : null}

          <button className="auth-submit" type="submit" disabled={isLoading || otp.length < 6}>
            {isLoading ? 'Verifying...' : 'Verify'}
          </button>
        </form>

        <p className="auth-helper">
          Didn&apos;t receive the code?{' '}
          <button type="button" className="auth-inline-button" onClick={() => void handleResend()}>
            Resend
          </button>
        </p>
      </div>
    );
  }

  return (
    <div className="auth-stack">
      <div className="auth-header">
        <h1>Create an account</h1>
        <p>Enter your details to get started</p>
      </div>

      <form className="auth-stack" onSubmit={handleSignUp}>
        <div className="auth-field">
          <label htmlFor="name">Name</label>
          <input
            id="name"
            type="text"
            required
            autoComplete="name"
            placeholder="Your name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </div>

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

        <div className="auth-field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            required
            autoComplete="new-password"
            placeholder="Create a password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>

        {error ? <p className="auth-error">{error}</p> : null}
        {message ? <p className="auth-message">{message}</p> : null}

        <button className="auth-submit" type="submit" disabled={isLoading}>
          {isLoading ? 'Signing up...' : 'Sign up'}
        </button>
      </form>

      <OAuthProviderButtons providers={providers} />
    </div>
  );
}
