import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const now = new Date();
  return [
    { url: `${base}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/sign-in`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${base}/sign-up`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
  ];
}
