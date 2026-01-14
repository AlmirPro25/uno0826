import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const isLocalMode = env.VITE_LOCAL_MODE === 'true' || process.env.VITE_LOCAL_MODE === 'true';
    
    return {
      server: {
        port: 5174, // AETHER IDE - porta fixa (5173 fica livre para workspace apps)
        host: '0.0.0.0',
        strictPort: true, // Falhar se porta estiver ocupada
        // Proxy para o backend local quando em modo local
        proxy: isLocalMode ? {
          '/api': {
            target: 'http://localhost:3001',
            changeOrigin: true
          }
        } : undefined
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        // Injetar flag de modo local no window
        'window.__AETHER_LOCAL_MODE__': isLocalMode
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
