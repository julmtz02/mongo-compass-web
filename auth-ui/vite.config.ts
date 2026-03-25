import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: resolve(__dirname, '../src/static/auth'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        login: resolve(__dirname, 'src/entries/login.tsx'),
        setup: resolve(__dirname, 'src/entries/setup.tsx'),
        admin: resolve(__dirname, 'src/entries/admin.tsx'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: 'assets/[name][extname]',
      },
    },
  },
});
