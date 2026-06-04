'use client';

import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';

const MAX_BYTES = 10 * 1024 * 1024;

// workspaceId, when provided, attaches the uploaded document to that
// workspace immediately. Used by the workspace detail page; the global
// /documents page passes nothing so uploads land in "Unsorted".
export function DocumentUploader({
  onUploaded,
  workspaceId,
}: {
  onUploaded: () => void;
  workspaceId?: string | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  async function handleFile(file: File) {
    if (file.type !== 'application/pdf') {
      toast.error('Only PDF files are supported');
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error('File exceeds 10 MB limit');
      return;
    }
    setIsUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      if (workspaceId) fd.append('workspaceId', workspaceId);
      const res = await fetch('/api/documents/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Upload failed');
      if (data.ingest?.status === 'failed') {
        toast.error(`Indexed with errors: ${data.ingest.error}`);
      } else {
        toast.success(`Indexed "${file.name}" (${data.ingest?.chunkCount ?? 0} chunks)`);
      }
      onUploaded();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/40 p-6 text-center">
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
        }}
      />
      <Upload className="mx-auto mb-3 size-8 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">Drop a PDF, max 10 MB</p>
      <Button
        className="mt-4"
        disabled={isUploading}
        onClick={() => inputRef.current?.click()}
      >
        {isUploading ? 'Uploading & indexing…' : 'Choose PDF'}
      </Button>
    </div>
  );
}
