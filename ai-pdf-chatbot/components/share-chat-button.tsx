'use client';

import { Check, Copy, Link2, Loader2, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

export function ShareChatButton({
  chatId,
  initialShareToken,
  onShareTokenChange,
}: {
  chatId: string;
  initialShareToken: string | null;
  onShareTokenChange?: (next: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [shareToken, setShareToken] = useState<string | null>(initialShareToken);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => setShareToken(initialShareToken), [initialShareToken]);

  useEffect(() => {
    if (!open) return;
    function onOutside(e: MouseEvent) {
      if (!popoverRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [open]);

  const shareUrl = useMemo(() => {
    if (!shareToken) return '';
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/share/${shareToken}`;
  }, [shareToken]);

  async function toggleShare(enable: boolean) {
    setBusy(true);
    try {
      const res = await fetch(`/api/chats/${chatId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ share_enabled: enable }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        chat?: { share_token: string | null };
        error?: string;
      };
      if (!res.ok) {
        toast.error(data.error ?? 'Failed to update share state');
        return;
      }
      const next = data.chat?.share_token ?? null;
      setShareToken(next);
      onShareTokenChange?.(next);
      toast.success(enable ? 'Share link created' : 'Share link revoked');
    } catch {
      toast.error('Failed to update share state');
    } finally {
      setBusy(false);
    }
  }

  async function copyToClipboard() {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('Copy failed');
    }
  }

  return (
    <div className="relative" ref={popoverRef}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <Link2 className="mr-1 size-4" />
        {shareToken ? 'Shared' : 'Share'}
        {shareToken ? (
          <span
            aria-hidden
            className="ml-1.5 inline-block size-1.5 rounded-full bg-emerald-500"
            title="Sharing is on"
          />
        ) : null}
      </Button>

      {open ? (
        <div className="absolute right-0 top-[calc(100%+0.5rem)] z-30 w-80 rounded-xl border border-border bg-popover p-4 shadow-xl">
          <div className="mb-3 flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-medium">Share this chat</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {shareToken
                  ? 'Anyone with the link can view the conversation read-only.'
                  : 'Create a read-only link anyone can open.'}
              </p>
            </div>
            <button
              type="button"
              aria-label="Close"
              onClick={() => setOpen(false)}
              className="rounded p-1 text-muted-foreground hover:bg-muted"
            >
              <X className="size-3.5" />
            </button>
          </div>

          {shareToken ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={shareUrl}
                  className="min-w-0 flex-1 truncate rounded border border-border bg-background px-2 py-1.5 text-xs"
                  onFocus={(e) => e.currentTarget.select()}
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={copyToClipboard}
                  disabled={!shareUrl}
                >
                  {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                </Button>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-destructive hover:text-destructive"
                onClick={() => void toggleShare(false)}
                disabled={busy}
              >
                {busy ? <Loader2 className="mr-1 size-3.5 animate-spin" /> : null}
                Revoke link
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              className="w-full"
              onClick={() => void toggleShare(true)}
              disabled={busy}
            >
              {busy ? <Loader2 className="mr-1 size-3.5 animate-spin" /> : null}
              Create share link
            </Button>
          )}
        </div>
      ) : null}
    </div>
  );
}
