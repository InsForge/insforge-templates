'use client';

import { Loader2 } from 'lucide-react';
import { OAuthProviderIcon } from '@/components/oauth-provider-icon';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type OAuthProviderButtonsProps = {
  providers: string[];
  loadingProvider: string | null;
  onSelect: (provider: string) => void;
};

function formatProviderLabel(provider: string) {
  return provider.charAt(0).toUpperCase() + provider.slice(1);
}

export function OAuthProviderButtons({
  providers,
  loadingProvider,
  onSelect,
}: OAuthProviderButtonsProps) {
  if (providers.length === 0) {
    return null;
  }

  return (
    <>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">or continue with</span>
        </div>
      </div>

      <div className={cn('grid gap-2', providers.length > 1 ? 'grid-cols-2' : 'grid-cols-1')}>
        {providers.map((provider) => (
          <Button
            key={provider}
            type="button"
            variant="outline"
            disabled={loadingProvider !== null}
            onClick={() => onSelect(provider)}
          >
            {loadingProvider === provider ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <OAuthProviderIcon provider={provider} />
            )}
            {formatProviderLabel(provider)}
          </Button>
        ))}
      </div>
    </>
  );
}
