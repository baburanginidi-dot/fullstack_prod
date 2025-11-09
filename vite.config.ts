import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const wsDevUrl = env.WS_URL || 'ws://localhost:3001';
    const wsProdUrl = env.WS_URL_PROD || wsDevUrl.replace(/^ws:/, 'wss:');
    const resolvedWsUrl = mode === 'production' ? wsProdUrl : wsDevUrl;
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.FRONTEND_URL': JSON.stringify(env.FRONTEND_URL || 'http://localhost:3000'),
        'process.env.WS_URL': JSON.stringify(resolvedWsUrl),
        'process.env.WS_URL_DEV': JSON.stringify(wsDevUrl),
        'process.env.WS_URL_PROD': JSON.stringify(wsProdUrl)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
