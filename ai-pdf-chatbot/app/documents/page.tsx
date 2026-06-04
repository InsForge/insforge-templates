'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DocumentList } from '@/components/document-list';
import { DocumentUploader } from '@/components/document-uploader';

type DocRow = {
  id: string;
  workspace_id: string | null;
  file_name: string;
  file_size: number;
  status: 'processing' | 'ready' | 'failed';
  error: string | null;
  page_count: number | null;
  summary: string | null;
  created_at: string;
};

export default function DocumentsPage() {
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const res = await fetch('/api/documents');
    const data = await res.json();
    setDocs(data.documents ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // While any document is still ingesting, poll every 3s so the badge flips
  // ready/failed automatically without a manual reload. Stops once all
  // documents reach a terminal state.
  useEffect(() => {
    if (!docs.some((d) => d.status === 'processing')) return;
    const id = setInterval(() => {
      void refresh();
    }, 3000);
    return () => clearInterval(id);
  }, [docs, refresh]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <Button asChild variant="ghost">
          <Link href="/chat">
            <ArrowLeft className="mr-1 size-4" />
            Back to chat
          </Link>
        </Button>
      </div>
      <h1 className="font-display text-3xl mb-6">Your documents</h1>
      <div className="space-y-6">
        <DocumentUploader onUploaded={refresh} />
        {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : <DocumentList documents={docs} onChanged={refresh} />}
      </div>
    </div>
  );
}
