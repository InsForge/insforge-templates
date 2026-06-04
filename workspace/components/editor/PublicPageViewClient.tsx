'use client';

import dynamic from 'next/dynamic';

const PublicPageView = dynamic(
  () => import('@/components/editor/PublicPageView').then((m) => m.PublicPageView),
  { ssr: false },
);

export { PublicPageView };
