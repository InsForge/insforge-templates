'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

export type PdfViewerTarget = {
  documentId: string;
  fileName: string;
  pageNumber: number | null;
  // First ~60 chars of the cited chunk. Used to locate the actual text
  // span inside the rendered page's text layer for highlight + scroll.
  highlightPrefix: string | null;
};

type Ctx = {
  current: PdfViewerTarget | null;
  open: (target: PdfViewerTarget) => void;
  close: () => void;
};

const PdfViewerContext = createContext<Ctx | null>(null);

export function PdfViewerProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<PdfViewerTarget | null>(null);

  const open = useCallback((target: PdfViewerTarget) => setCurrent(target), []);
  const close = useCallback(() => setCurrent(null), []);

  const value = useMemo(() => ({ current, open, close }), [current, open, close]);
  return <PdfViewerContext.Provider value={value}>{children}</PdfViewerContext.Provider>;
}

// Returns null when used outside a provider so opt-in callers (the
// share-page citation rail, for example) can fall back to the old
// new-tab behaviour without crashing.
export function usePdfViewer(): Ctx | null {
  return useContext(PdfViewerContext);
}
