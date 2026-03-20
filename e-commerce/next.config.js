/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'txvtce5i.us-west.insforge.app',
      },
      {
        protocol: 'https',
        hostname: 'cdn.insforge.dev',
      },
    ],
  },
};

module.exports = nextConfig;
