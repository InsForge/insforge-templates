/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.insforge.app' },
      { protocol: 'https', hostname: 'cdn.insforge.dev' },
    ],
  },
  async rewrites() {
    // PostHog reverse-proxy hosts. NEXT_PUBLIC_POSTHOG_HOST is read at
    // build time, so changing it requires a rebuild. We derive the
    // matching assets host for cloud (us / eu); self-hosted instances
    // typically serve assets from the same origin, so the unchanged
    // host falls through naturally.
    const POSTHOG_HOST =
      process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';
    const POSTHOG_ASSETS_HOST = POSTHOG_HOST
      .replace('//us.i.posthog.com', '//us-assets.i.posthog.com')
      .replace('//eu.i.posthog.com', '//eu-assets.i.posthog.com');
    return [
      {
        source: '/ingest/static/:path*',
        destination: `${POSTHOG_ASSETS_HOST}/static/:path*`,
      },
      {
        source: '/ingest/array/:path*',
        destination: `${POSTHOG_ASSETS_HOST}/array/:path*`,
      },
      {
        source: '/ingest/:path*',
        destination: `${POSTHOG_HOST}/:path*`,
      },
    ];
  },
  skipTrailingSlashRedirect: true,
};

module.exports = nextConfig;
