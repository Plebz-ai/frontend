const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const ORCHESTRATOR_HOST = process.env.ORCHESTRATOR_HOST || 'localhost:8010';
const AI_LAYER_WS_TARGET = `ws://${ORCHESTRATOR_HOST.replace(/^https?:\/\//, '')}`;
const AI_LAYER_HTTP_TARGET = `http://${ORCHESTRATOR_HOST.replace(/^https?:\/\//, '')}`;

app.prepare().then(() => {
  const server = express();

  // Proxy WebSocket for /ai-layer/ws/voice-session
  server.use(
    '/ai-layer/ws/voice-session',
    createProxyMiddleware({
      target: AI_LAYER_WS_TARGET,
      changeOrigin: true,
      ws: true,
      pathRewrite: { '^/ai-layer/ws/voice-session': '/ws/voice-session' },
      logLevel: 'debug',
    })
  );

  // Proxy all /ai-layer/* HTTP requests
  server.use(
    '/ai-layer',
    createProxyMiddleware({
      target: AI_LAYER_HTTP_TARGET,
      changeOrigin: true,
      pathRewrite: { '^/ai-layer': '' },
      logLevel: 'debug',
    })
  );

  // Proxy all /api/* HTTP requests
  server.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:8081',
      changeOrigin: true,
      pathRewrite: { '^/api': '/api' },
      logLevel: 'debug',
    })
  );

  // Let Next.js handle everything else
  server.all('*', (req, res) => {
    return handle(req, res, parse(req.url, true));
  });

  const httpServer = createServer(server);

  // Upgrade the server to handle WebSocket requests
  httpServer.on('upgrade', (req, socket, head) => {
    if (req.url.startsWith('/ai-layer/ws/voice-session')) {
      // Let http-proxy-middleware handle the upgrade (handled automatically)
    } else {
      socket.destroy();
    }
  });

  const port = process.env.PORT || 3000;
  httpServer.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${port}`);
  });
}); 