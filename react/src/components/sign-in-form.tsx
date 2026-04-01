import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signIn } from '../lib/auth';
import { useAuth } from '../lib/auth-context';
import { OAuthProviderButtons } from './oauth-provider-buttons';

export function SignInForm({ providers }: { providers: string[] }) {
  const navigate = useNavigate();
  const { refreshViewer } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await signIn(email.trim(), password);

      if (result.success) {
        await refreshViewer();
        navigate('/protected');
        return;
      }

      setError(result.error);
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="auth-stack">
      <form className="auth-stack" onSubmit={handleSubmit}>
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
          <div className="auth-field__row">
            <label htmlFor="password">Password</label>
            <Link to="/auth/reset-password" className="auth-inline-link">
              Forgot password?
            </Link>
          </div>
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="Enter your password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>

        {error ? <p className="auth-error">{error}</p> : null}

        <button className="auth-submit" type="submit" disabled={isLoading}>
          {isLoading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      <OAuthProviderButtons providers={providers} />
    </div>
  );
}
