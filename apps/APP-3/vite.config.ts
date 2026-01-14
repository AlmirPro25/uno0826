import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const isProduction = mode === 'production';
    
    return {
      plugins: [react()],
      define: {
        'process.env.NODE_ENV': JSON.stringify(mode),
        'process.env.VITE_GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY || ''),
        'process.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL || ''),
        'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY || ''),
        'process.env.VITE_DEV_MODE': JSON.stringify(env.VITE_DEV_MODE || 'false'),
        '__DEV__': JSON.stringify(!isProduction),
        '__PROD__': JSON.stringify(isProduction)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        },
        extensions: ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json']
      },
      build: {
        outDir: 'dist',
        sourcemap: false,
        minify: isProduction ? 'terser' : false,
        target: 'es2020',
        rollupOptions: {
          output: {
            manualChunks: {
              vendor: ['react', 'react-dom'],
              monaco: ['@monaco-editor/react', 'monaco-editor'],
              ai: ['@google/genai'],
              ui: ['zustand', 'immer', 'marked'],
              utils: ['uuid', 'jszip', 'file-saver']
            },
            chunkFileNames: 'assets/[name]-[hash].js',
            entryFileNames: 'assets/[name]-[hash].js',
            assetFileNames: 'assets/[name]-[hash].[ext]'
          }
        },
        terserOptions: isProduction ? {
          compress: {
            drop_console: false,
            drop_debugger: true,
            pure_funcs: ['console.log']
          }
        } : undefined,
        assetsInlineLimit: 4096
      },
      server: {
        port: 5173,
        host: true
      },
      preview: {
        port: 4173,
        host: true
      },
      optimizeDeps: {
        include: [
          'react',
          'react-dom',
          '@google/genai',
          'zustand',
          'immer',
          'marked',
          'uuid',
          'jszip',
          'file-saver'
        ]
      }
    };
});
