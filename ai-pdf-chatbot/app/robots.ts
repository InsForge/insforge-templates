import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_BETTER_AUTH_URL ?? 'http://localhost:3000';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // API routes carry no indexable content; share links are
        // unlisted-by-design and shouldn't end up in search results.
        disallow: ['/api/', '/share/'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
