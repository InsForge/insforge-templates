/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['localhost', '127.0.0.1'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.insforge.app' },
      { protocol: 'https', hostname: '**.insforge.dev' },
    ],
  },
};

module.exports = nextConfig;
