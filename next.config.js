/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081/api',
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8081/ws'
  },
  webpack: (config, { isServer }) => {
    // Add WebSocket polyfill for the client
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        ws: false
      };
    }
    return config;
  }
};

module.exports = nextConfig; 