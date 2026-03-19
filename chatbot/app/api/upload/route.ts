import { NextResponse } from 'next/server';
import { getInsforgeServerClient } from '@/lib/insforge';
import {
  UPLOAD_BUCKET,
  MAX_FILE_SIZE,
  isAllowedAttachmentFile,
  resolveAttachmentMimeType,
} from '@/lib/constants';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File exceeds the ${MAX_FILE_SIZE / (1024 * 1024)}MB limit.` },
        { status: 400 },
      );
    }

    const mimeType = resolveAttachmentMimeType(file.name, file.type);

    if (!isAllowedAttachmentFile(file)) {
      return NextResponse.json(
        { error: `File type "${file.type || file.name}" is not supported.` },
        { status: 400 },
      );
    }

    const insforge = getInsforgeServerClient();
    const { data, error } = await insforge.storage
      .from(UPLOAD_BUCKET)
      .uploadAuto(file);

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message ?? 'Upload failed.' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      key: data.key,
      url: data.url,
      fileName: file.name,
      fileSize: file.size,
      mimeType,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Upload failed.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
