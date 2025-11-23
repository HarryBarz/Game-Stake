import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: 'mini-militia-fresh',
  server: {
    port: 8080,
    open: true,
    hot: true
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'mini-militia-fresh/index.html')
      }
    }
  },
  publicDir: 'mini-militia-fresh'
});

