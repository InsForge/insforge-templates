'use client';

import '@blocknote/core/fonts/inter.css';
import '@blocknote/mantine/style.css';
import { BlockNoteView } from '@blocknote/mantine';
import { useCreateBlockNote } from '@blocknote/react';
import type { PartialBlock } from '@blocknote/core';
import { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { useUploadFile } from './useUploadFile';
import { useAutosave } from './useAutosave';

export function PageEditor({
  workspaceId,
  page,
}: {
  workspaceId: string;
  page: {
    id: string;
    title: string;
    icon: string | null;
    content: unknown;
    updated_at: string;
  };
}) {
  const [title, setTitle] = useState(page.title);
  const uploadFile = useUploadFile(workspaceId, page.id);
  const { schedule, savedAt } = useAutosave(page.id, page.updated_at);

  const initialContent = useMemo<PartialBlock[] | undefined>(() => {
    if (Array.isArray(page.content) && page.content.length > 0) {
      return page.content as PartialBlock[];
    }
    return undefined;
  }, [page.content]);

  const editor = useCreateBlockNote({
    initialContent,
    uploadFile,
  });

  return (
    <div className="mx-auto max-w-3xl px-8 py-12">
      <Input
        value={title}
        onChange={(e) => {
          setTitle(e.target.value);
          schedule({ title: e.target.value });
        }}
        placeholder="Untitled"
        className="mb-4 border-none px-0 text-4xl font-bold shadow-none focus-visible:ring-0"
      />
      <p className="mb-6 text-xs text-muted-foreground">
        Last saved: {new Date(savedAt).toLocaleTimeString()}
      </p>
      <BlockNoteView
        editor={editor}
        onChange={() => schedule({ content: editor.document })}
      />
    </div>
  );
}
