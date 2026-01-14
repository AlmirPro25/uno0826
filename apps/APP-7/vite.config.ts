import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const isProduction = mode === 'production';
    
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        hmr: {
          overlay: false
        }
      },
      plugins: [react()],
      build: {
        outDir: 'dist',
        sourcemap: !isProduction,
        minify: isProduction ? 'esbuild' : false,
        rollupOptions: {
          output: {
            manualChunks: {
              vendor: ['react', 'react-dom'],
              supabase: ['@supabase/supabase-js', '@supabase/auth-ui-react'],
              ui: ['@mercadopago/sdk-react']
            }
          }
        },
        chunkSizeWarningLimit: 1000
      },
      preview: {
        port: 3000,
        host: true
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
