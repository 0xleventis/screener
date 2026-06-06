const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Proxy GeckoTerminal API — mirrors the Vite dev proxy
app.use(
  '/api/gecko',
  createProxyMiddleware({
    target: 'https://api.geckoterminal.com',
    changeOrigin: true,
    pathRewrite: { '^/api/gecko': '/api/v2' },
    headers: { Accept: 'application/json;version=20230302' },
  }),
);

// Serve built React app
app.use(express.static(path.join(__dirname, 'dist')));

// SPA fallback — all unmatched routes return index.html so React Router works
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
