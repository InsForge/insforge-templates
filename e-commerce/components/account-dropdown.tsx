'use client';

import Link from 'next/link';
import { ChevronDown, LogOut, Package2, UserRound } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { signOut } from '@/lib/auth-actions';
import { cn } from '@/lib/utils';

export function AccountDropdown({
  avatarUrl,
  email,
  viewerInitials,
  viewerLabel,
}: {
  avatarUrl: string | null;
  email?: string | null;
  viewerInitials: string;
  viewerLabel: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleEscape);
    };
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <button
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className="inline-flex h-11 items-center gap-3 rounded-full border border-border bg-card px-2 py-2 text-left text-sm text-foreground shadow-sm"
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <span className="relative flex size-9 items-center justify-center overflow-hidden rounded-full bg-secondary text-xs font-medium text-secondary-foreground">
          {avatarUrl ? (
            <img
              alt={viewerLabel}
              className="h-full w-full object-cover"
              height={36}
              referrerPolicy="no-referrer"
              src={avatarUrl}
              width={36}
            />
          ) : (
            viewerInitials
          )}
        </span>
        <span className="hidden min-w-0 sm:flex sm:flex-col">
          <span className="truncate font-medium">{viewerLabel}</span>
        </span>
        <ChevronDown className={cn('size-4 text-muted-foreground transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen ? (
        <div
          className="absolute right-0 top-[calc(100%+0.75rem)] z-50 w-64 rounded-[24px] border border-border bg-popover/95 p-2 shadow-[0_24px_60px_-24px_rgba(33,29,24,0.35)] backdrop-blur-xl"
          role="menu"
        >
          <div className="border-b border-border px-3 py-3">
            <p className="truncate font-medium text-foreground">{viewerLabel}</p>
            {email ? (
              <p className="mt-1 truncate text-sm text-muted-foreground">{email}</p>
            ) : null}
          </div>

          <div className="py-2">
            <Link
              className="flex items-center gap-3 rounded-[18px] px-3 py-3 text-sm text-foreground hover:bg-muted/70"
              href="/account/orders"
              onClick={() => setIsOpen(false)}
              role="menuitem"
            >
              <Package2 className="size-4 text-muted-foreground" />
              Orders
            </Link>
            <Link
              className="flex items-center gap-3 rounded-[18px] px-3 py-3 text-sm text-foreground hover:bg-muted/70"
              href="/account/profile"
              onClick={() => setIsOpen(false)}
              role="menuitem"
            >
              <UserRound className="size-4 text-muted-foreground" />
              Profile
            </Link>
          </div>

          <div className="border-t border-border pt-2">
            <form action={signOut}>
              <button
                className="flex w-full items-center gap-3 rounded-[18px] px-3 py-3 text-left text-sm text-foreground hover:bg-muted/70"
                onClick={() => setIsOpen(false)}
                role="menuitem"
                type="submit"
              >
                <LogOut className="size-4 text-muted-foreground" />
                Sign out
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
