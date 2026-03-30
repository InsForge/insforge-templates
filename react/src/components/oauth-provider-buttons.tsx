import { useState } from 'react';
import { getOAuthUrl } from '../lib/auth';
import { OAuthProviderIcon } from './oauth-provider-icon';

function formatProviderLabel(provider: string) {
  return provider.charAt(0).toUpperCase() + provider.slice(1);
}

export function OAuthProviderButtons({ providers }: { providers: string[] }) {
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const [error, setError] = useState('');

  if (providers.length === 0) {
    return null;
  }

  async function handleOAuth(provider: string) {
    setLoadingProvider(provider);
    setError('');
    try {
      const result = await getOAuthUrl(provider);

      if ('error' in result) {
        setError(result.error);
        setLoadingProvider(null);
        return;
      }

      window.location.href = result.url;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'OAuth failed.');
      setLoadingProvider(null);
    }
  }

  return (
    <div className="auth-stack">
      <div className="auth-divider">
        <div className="auth-divider__line" />
        <span>or continue with</span>
        <div className="auth-divider__line" />
      </div>

      <div className={`oauth-grid ${providers.length > 1 ? 'oauth-grid--split' : ''}`}>
        {providers.map((provider) => (
          <button
            key={provider}
            type="button"
            className="oauth-button"
            disabled={loadingProvider !== null}
            onClick={() => void handleOAuth(provider)}
          >
            {loadingProvider === provider ? (
              <span className="oauth-button-spinner" />
            ) : (
              <>
                <OAuthProviderIcon provider={provider} />
                <span>{formatProviderLabel(provider)}</span>
              </>
            )}
          </button>
        ))}
      </div>

      {error ? <p className="auth-error auth-error--center">{error}</p> : null}
    </div>
  );
}
