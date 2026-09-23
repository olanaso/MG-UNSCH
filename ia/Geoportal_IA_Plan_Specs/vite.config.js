import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  root: 'frontend',
  plugins: [tailwindcss()],
  server: {
    port: 5174,
    strictPort: true,
    proxy: {
      '/api': 'http://127.0.0.1:3001',
    },
  },
  build: {
    outDir: '../dist/frontend',
    emptyOutDir: true,
  },
});
