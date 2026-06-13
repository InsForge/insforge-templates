import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_BETTER_AUTH_URL ?? 'http://localhost:3000';

// Everything behind auth is invisible to crawlers anyway; the public
// surface is the landing redirect and the two auth pages.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE_URL}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/auth/sign-up`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/auth/sign-in`, changeFrequency: 'monthly', priority: 0.5 },
  ];
}
