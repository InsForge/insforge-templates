'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronsUpDown, LogOut, UserRound } from 'lucide-react';
import { signOut } from '@/lib/auth-actions';
import type { AuthViewer } from '@/lib/types';

function displayName(viewer: AuthViewer) {
  return viewer.name ?? viewer.email ?? 'Account';
}

function initials(viewer: AuthViewer) {
  const label = viewer.name ?? viewer.email ?? 'A';
  const parts = label.trim().split(/[\s@]+/).filter(Boolean);
  if (parts.length === 0) return 'A';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
}

export function SidebarAccountBar({ viewer }: { viewer: AuthViewer | null }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function handleOutside(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  if (!viewer) {
    return (
      <div className="px-3 py-3">
        <div className="h-12 animate-pulse rounded-2xl bg-muted/60" />
      </div>
    );
  }

  if (!viewer.isAuthenticated) {
    return (
      <div className="px-3 py-3">
        <Link
          className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card/60 px-3 py-3 text-left text-sm hover:bg-accent/10"
          href="/auth/sign-in"
        >
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted">
            <UserRound className="size-4" />
          </div>
          <span className="font-medium">Sign in</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="px-3 py-3">
      <div ref={containerRef} className="relative">
        {open ? (
          <div className="absolute inset-x-0 bottom-[calc(100%+0.5rem)] z-20 rounded-2xl border border-border bg-popover p-2 shadow-xl">
            <div className="px-3 py-2">
              <div className="truncate text-sm font-medium">{displayName(viewer)}</div>
              {viewer.email && viewer.email !== displayName(viewer) ? (
                <div className="mt-0.5 truncate text-xs text-muted-foreground">{viewer.email}</div>
              ) : null}
            </div>
            <div className="mx-1 my-1 h-px bg-border" />
            <form action={signOut}>
              <button
                type="submit"
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm hover:bg-accent/10"
              >
                <LogOut className="size-4" />
                Sign out
              </button>
            </form>
          </div>
        ) : null}

        <button
          type="button"
          aria-expanded={open}
          aria-haspopup="menu"
          className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card/60 px-3 py-3 text-left text-sm hover:bg-accent/10"
          onClick={() => setOpen((o) => !o)}
        >
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary font-medium text-xs text-primary-foreground">
            {initials(viewer)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate font-medium">{displayName(viewer)}</div>
            {viewer.email && viewer.email !== displayName(viewer) ? (
              <div className="truncate text-xs text-muted-foreground">{viewer.email}</div>
            ) : null}
          </div>
          <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}
