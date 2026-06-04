'use client';

import dynamic from 'next/dynamic';

const PageEditor = dynamic(
  () => import('@/components/editor/PageEditor').then((m) => m.PageEditor),
  { ssr: false },
);

export { PageEditor };
