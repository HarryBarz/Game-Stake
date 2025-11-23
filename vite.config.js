import { defineConfig } from 'vite';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { copyFileSync, mkdirSync, readdirSync, statSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Simple copy function for build
function copyDir(src, dest) {
  mkdirSync(dest, { recursive: true });
  const entries = readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = resolve(src, entry.name);
    const destPath = resolve(dest, entry.name);
    if (entry.isDirectory() && entry.name !== '.git' && entry.name !== 'node_modules') {
      copyDir(srcPath, destPath);
    } else if (entry.isFile() && entry.name !== '.gitignore') {
      copyFileSync(srcPath, destPath);
    }
  }
}

export default defineConfig({
  root: resolve(__dirname, 'mini-militia-fresh'),
  server: {
    port: 8080,
    open: true,
    hot: true
  },
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(__dirname, 'mini-militia-fresh/index.html'),
      output: {
        format: 'es',
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]'
      }
    }
  },
  plugins: [
    {
      name: 'copy-assets',
      closeBundle() {
        const src = resolve(__dirname, 'mini-militia-fresh');
        const dest = resolve(__dirname, 'dist');
        // Copy images, audio, css (excluding .git)
        ['images', 'audio', 'css'].forEach(dir => {
          const srcDir = resolve(src, dir);
          if (statSync(srcDir).isDirectory()) {
            copyDir(srcDir, resolve(dest, dir));
          }
        });
      }
    }
  ]
});

