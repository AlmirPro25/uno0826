
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// AEGIS-VII BUILD CONFIGURATION
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000', // Points to the backend service
        changeOrigin: true,
      }
    }
  }
});
