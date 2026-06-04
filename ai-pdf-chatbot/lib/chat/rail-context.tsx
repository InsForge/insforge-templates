'use client';

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { ChatMessageRow } from '@/lib/types';

type Citation = ChatMessageRow['citations'][number];

type Ctx = {
  citations: Citation[];
  setCitations: (citations: Citation[]) => void;
};

const RailContext = createContext<Ctx | null>(null);

// The chat sidebar lives in the chat layout so it survives navigation
// between /chat and /chat/[id]. The citation rail still belongs to each
// page (its data is tied to that page's streaming state), so the page
// pushes its citations up through this context and the layout renders
// the rail with them.
export function RailProvider({ children }: { children: ReactNode }) {
  const [citations, setCitations] = useState<Citation[]>([]);
  const value = useMemo(() => ({ citations, setCitations }), [citations]);
  return <RailContext.Provider value={value}>{children}</RailContext.Provider>;
}

export function useRailCitations(): Citation[] {
  return useContext(RailContext)?.citations ?? [];
}

export function useSetRailCitations(): (c: Citation[]) => void {
  const ctx = useContext(RailContext);
  return ctx?.setCitations ?? (() => {});
}
