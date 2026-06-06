import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/gecko': {
        target: 'https://api.geckoterminal.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/gecko/, '/api/v2'),
        headers: {
          Accept: 'application/json;version=20230302',
        },
      },
    },
  },
});
