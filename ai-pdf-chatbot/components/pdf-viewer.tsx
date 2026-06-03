'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Document, Page } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { ensurePdfWorker } from '@/lib/pdf/pdf-worker';

// Highlight class is applied by toggling this on text-layer spans whose
// content starts with the citation prefix. Defined as a string so it can
// be added/removed without touching React state.
const HIGHLIGHT_CLASS = 'rag-citation-highlight';

type Props = {
  fileUrl: string;
  initialPage?: number;
  highlightPrefix?: string | null;
};

// Self-contained react-pdf wrapper. Renders a single page at a time with
// page navigation; on each page render, scans the text layer for the
// chunk prefix and highlights the matching spans. Keeps things minimal
// so the drawer can stay narrow and still be useful on mobile.
export function PdfViewer({ fileUrl, initialPage = 1, highlightPrefix = null }: Props) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [page, setPage] = useState(initialPage);
  const pageWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ensurePdfWorker();
  }, []);

  // Reset when a new citation target is opened
  useEffect(() => {
    setPage(initialPage);
  }, [initialPage, fileUrl]);

  const onLoadSuccess = useCallback(({ numPages: n }: { numPages: number }) => {
    setNumPages(n);
  }, []);

  const onPageRender = useCallback(() => {
    const wrapper = pageWrapperRef.current;
    if (!wrapper) return;
    const layer = wrapper.querySelector('.react-pdf__Page__textContent');
    if (!layer) return;

    // Always clear stale highlights first so opening a citation without a
    // snippet doesn't keep the previous citation's yellow text on the page.
    layer.querySelectorAll(`.${HIGHLIGHT_CLASS}`).forEach((el) => {
      el.classList.remove(HIGHLIGHT_CLASS);
    });
    if (!highlightPrefix) return;

    // Span granularity in pdfjs text layer can vary, so we look for the
    // first span whose text contains the prefix and walk forward until we
    // cover ~prefix length. Imperfect on hyphenated/multi-span words but
    // good enough for "scroll the cited sentence into view" UX.
    const spans = Array.from(layer.querySelectorAll<HTMLElement>('span'));
    const normalized = normalize(highlightPrefix).slice(0, 60);
    if (!normalized) return;

    let firstHit: HTMLElement | null = null;
    let consumed = 0;
    for (const span of spans) {
      const text = normalize(span.textContent ?? '');
      if (!firstHit) {
        if (text && normalized.startsWith(text.slice(0, Math.min(text.length, 12)))) {
          firstHit = span;
          span.classList.add(HIGHLIGHT_CLASS);
          consumed = text.length;
        }
      } else if (consumed < normalized.length) {
        span.classList.add(HIGHLIGHT_CLASS);
        consumed += text.length;
      } else {
        break;
      }
    }

    firstHit?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [highlightPrefix]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-border bg-card/40 px-3 py-2 text-sm">
        <button
          type="button"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page <= 1}
          className="inline-flex items-center gap-1 rounded p-1 text-muted-foreground hover:bg-muted disabled:opacity-40"
          aria-label="Previous page"
        >
          <ChevronLeft className="size-4" />
        </button>
        <span className="text-xs text-muted-foreground">
          Page {page}
          {numPages ? ` / ${numPages}` : null}
        </span>
        <button
          type="button"
          onClick={() => {
            // Don't advance past the document end, and don't advance at all
            // until react-pdf reports the page count.
            if (!numPages) return;
            setPage((p) => Math.min(numPages, p + 1));
          }}
          disabled={!numPages || page >= numPages}
          className="inline-flex items-center gap-1 rounded p-1 text-muted-foreground hover:bg-muted disabled:opacity-40"
          aria-label="Next page"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
      <div ref={pageWrapperRef} className="flex-1 overflow-auto bg-muted/40 p-2">
        <Document
          file={fileUrl}
          onLoadSuccess={onLoadSuccess}
          loading={<PdfLoading label="Loading PDF…" />}
          error={<PdfError />}
          className="flex flex-col items-center"
        >
          <Page
            pageNumber={page}
            onRenderSuccess={onPageRender}
            renderAnnotationLayer={false}
            renderTextLayer
            className="shadow-md"
            width={520}
          />
        </Document>
      </div>
    </div>
  );
}

function PdfLoading({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
      <Loader2 className="size-4 animate-spin" />
      {label}
    </div>
  );
}

function PdfError() {
  return (
    <div className="p-6 text-sm text-red-700">
      Could not load this PDF. The presigned URL may have expired — try clicking the citation again.
    </div>
  );
}

function normalize(text: string): string {
  return text.replace(/\s+/g, ' ').trim().toLowerCase();
}
