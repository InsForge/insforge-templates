"use client";

import { useState } from "react";

import { getOAuthUrl } from "@/lib/auth-actions";
import { OAuthProviderIcon } from "@/components/oauth-provider-icon";

function formatProviderLabel(provider: string) {
  return provider.charAt(0).toUpperCase() + provider.slice(1);
}

export function OAuthProviderButtons({ providers }: { providers: string[] }) {
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const [error, setError] = useState("");

  if (providers.length === 0) {
    return null;
  }

  async function handleOAuth(provider: string) {
    setLoadingProvider(provider);
    setError("");

    const result = await getOAuthUrl(provider);

    if ("error" in result) {
      setError(result.error);
      setLoadingProvider(null);
      return;
    }

    window.location.href = result.url;
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-stone-200" />
        </div>
        <div className="relative flex justify-center text-xs uppercase tracking-[0.14em]">
          <span className="bg-white px-2 text-stone-400">or continue with</span>
        </div>
      </div>

      <div className={`grid gap-2 ${providers.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
        {providers.map((provider) => (
          <button
            key={provider}
            type="button"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-stone-200 bg-white px-4 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-50"
            disabled={loadingProvider !== null}
            onClick={() => void handleOAuth(provider)}
          >
            {loadingProvider === provider ? (
              <span className="text-xs">Loading...</span>
            ) : (
              <>
                <OAuthProviderIcon provider={provider} />
                <span>{formatProviderLabel(provider)}</span>
              </>
            )}
          </button>
        ))}
      </div>

      {error ? <p className="text-center text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
