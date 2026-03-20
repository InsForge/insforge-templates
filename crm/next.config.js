/** @type {import('next').NextConfig} */
const nextConfig = {
  // When you access the dev server from another device / by LAN IP,
  // Next.js may block HMR websocket requests for safety unless allowed.
  allowedDevOrigins: ['192.168.1.232', 'localhost', '127.0.0.1'],
};

module.exports = nextConfig;

