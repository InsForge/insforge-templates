'use client';

import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { updatePage } from '@/lib/workspace-actions';

type Patch = { title?: string; icon?: string | null; content?: unknown };

export function useAutosave(pageId: string, initialUpdatedAt: string) {
  const [savedAt, setSavedAt] = useState<string>(initialUpdatedAt);
  const pendingRef = useRef<Patch>({});
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlightRef = useRef(false);
  const conflictedRef = useRef(false);

  function flush() {
    if (inFlightRef.current || conflictedRef.current) return;
    const patch = pendingRef.current;
    if (Object.keys(patch).length === 0) return;
    pendingRef.current = {};
    inFlightRef.current = true;
    (async () => {
      const result = await updatePage(pageId, patch, savedAt);
      inFlightRef.current = false;
      if (!result.ok) {
        if (result.error === 'conflict') {
          conflictedRef.current = true;
          toast.error('This page changed elsewhere. Refresh to see the latest.');
          return;
        }
        toast.error(result.error);
        return;
      }
      setSavedAt(result.page.updated_at);
    })();
  }

  function schedule(patch: Patch) {
    pendingRef.current = { ...pendingRef.current, ...patch };
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(flush, 1500);
  }

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    flush();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { schedule, savedAt, conflicted: () => conflictedRef.current };
}
