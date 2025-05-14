/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    // Direct URL to orchestrator (external API) - without /api prefix
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || '/api/v1',
    // WebSocket URL for real-time communication
    NEXT_PUBLIC_AI_LAYER_URL: process.env.NEXT_PUBLIC_AI_LAYER_URL || '/ai-layer',
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL || (process.env.NODE_ENV === 'production' 
      ? 'wss://your-production-domain.com/ws'
      : 'ws://localhost:8082/ws')
  },
  async rewrites() {
    return [
      {
        // Next.js API routes - Go backend API
        source: '/api/:path*',
        // Map to Go backend API
        destination: 'http://localhost:8081/api/:path*',
        basePath: false,
      },
      {
        // Direct proxy for AI Layer2 services
        source: '/ai-layer/:path*',
        destination: 'http://localhost:8010/:path*',
        basePath: false,
      },
      {
        source: '/ws',
        destination: 'http://localhost:8081/ws',
        basePath: false,
      }
    ];
  },
  async headers() {
    return [
      {
        // Apply CORS headers to all API routes
        source: '/(api|ai-layer)/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Accept, Authorization, Content-Type, X-Requested-With' },
        ],
      },
    ];
  }
};

module.exports = nextConfig;