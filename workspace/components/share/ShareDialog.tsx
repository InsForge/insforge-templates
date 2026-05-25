'use client';

import { Copy, Share2 } from 'lucide-react';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { createShareLink, revokeShareLink } from '@/lib/workspace-actions';

export function ShareDialog({ pageId }: { pageId: string }) {
  const [open, setOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function generate() {
    startTransition(async () => {
      try {
        const token = await createShareLink(pageId);
        const url = `${window.location.origin}/share/${token}`;
        setShareUrl(url);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Failed to create link');
      }
    });
  }

  function revoke() {
    startTransition(async () => {
      try {
        await revokeShareLink(pageId);
        setShareUrl(null);
        toast.success('Link revoked');
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Failed to revoke');
      }
    });
  }

  function copy() {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    toast.success('Copied to clipboard');
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Share2 className="mr-2 h-4 w-4" /> Share
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share page</DialogTitle>
          <DialogDescription>
            Anyone with the link can view this page. Revoke at any time.
          </DialogDescription>
        </DialogHeader>
        {shareUrl ? (
          <div className="flex gap-2">
            <Input readOnly value={shareUrl} />
            <Button onClick={copy} variant="outline" size="icon">
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button onClick={generate} disabled={pending}>
            Create public link
          </Button>
        )}
        {shareUrl ? (
          <Button variant="ghost" onClick={revoke} disabled={pending} className="text-red-600">
            Revoke link
          </Button>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
