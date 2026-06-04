'use client';

import '@blocknote/core/fonts/inter.css';
import '@blocknote/mantine/style.css';
import { BlockNoteView } from '@blocknote/mantine';
import { useCreateBlockNote } from '@blocknote/react';
import type { PartialBlock } from '@blocknote/core';
import { useMemo } from 'react';

export function PublicPageView({
  page,
}: {
  page: { title: string; icon: string | null; content: unknown; updated_at: string };
}) {
  const initialContent = useMemo<PartialBlock[] | undefined>(() => {
    if (Array.isArray(page.content) && page.content.length > 0) {
      return page.content as PartialBlock[];
    }
    return undefined;
  }, [page.content]);

  const editor = useCreateBlockNote({ initialContent });

  return (
    <div className="mx-auto max-w-3xl px-8 py-12">
      <h1 className="mb-4 text-4xl font-bold">{page.title || 'Untitled'}</h1>
      <p className="mb-6 text-xs text-muted-foreground">
        Last updated: {new Date(page.updated_at).toLocaleString()}
      </p>
      <BlockNoteView editor={editor} editable={false} />
    </div>
  );
}
