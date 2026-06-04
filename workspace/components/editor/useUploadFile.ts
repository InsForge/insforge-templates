'use client';

import { customAlphabet } from 'nanoid';
import { getInsforgeBrowserClient } from '@/lib/insforge-browser';
import { UPLOAD_BUCKET } from '@/lib/constants';

const nano = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 12);

export function useUploadFile(workspaceId: string, pageId: string) {
  return async function uploadFile(file: File): Promise<string> {
    const client = getInsforgeBrowserClient();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `${workspaceId}/${pageId}/${nano()}-${safeName}`;
    const { data, error } = await client.storage.from(UPLOAD_BUCKET).upload(path, file);
    if (error || !data) {
      throw new Error(error?.message ?? 'upload failed');
    }
    return data.url;
  };
}
