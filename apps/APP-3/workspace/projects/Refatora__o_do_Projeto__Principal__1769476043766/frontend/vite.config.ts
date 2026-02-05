
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// OPTIMIZED FOR ORBITAL LATENCY
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      // Tunneling connection to the Neural Cortex (Backend)
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      }
    }
  }
});
