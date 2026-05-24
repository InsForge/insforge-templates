/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.insforge.dev' },
    ],
  },
};

module.exports = nextConfig;
