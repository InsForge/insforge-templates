'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { usePdfViewer } from '@/lib/pdf/viewer-context';

type CitationLike = {
  document_id?: string | null;
  file_name?: string | null;
  page_number?: number | null;
  snippet?: string | null;
};

// Shared open-citation handler. When the surface is wrapped in
// PdfViewerProvider (the chat shell), opens an inline PDF drawer at the
// cited page and highlights the matching text. Falls back to a
// presigned URL in a new tab on surfaces without a provider — the
// public share page in particular.
export function useOpenCitation() {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const viewer = usePdfViewer();

  async function open(citation: CitationLike) {
    const documentId = citation.document_id;
    if (!documentId) return;

    if (viewer) {
      viewer.open({
        documentId,
        fileName: citation.file_name ?? 'document.pdf',
        pageNumber: citation.page_number ?? null,
        highlightPrefix: citation.snippet ?? null,
      });
      return;
    }

    setLoadingId(documentId);
    try {
      const res = await fetch(`/api/documents/${documentId}/url`);
      if (!res.ok) throw new Error(`status ${res.status}`);
      const { url } = (await res.json()) as { url: string };
      const fragment = citation.page_number ? `#page=${citation.page_number}` : '';
      window.open(url + fragment, '_blank', 'noopener,noreferrer');
    } catch {
      toast.error('Could not open source PDF');
    } finally {
      setLoadingId(null);
    }
  }

  return { open, loadingId };
}
