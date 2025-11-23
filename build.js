#!/usr/bin/env node

/**
 * Simple build script that copies files for Vercel deployment
 * Since this is a static site with legacy scripts, we just copy everything
 */

import { copyFileSync, mkdirSync, readdirSync, statSync, rmSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const srcDir = resolve(__dirname, 'mini-militia-fresh');
const destDir = resolve(__dirname, 'dist');

// Clean dist directory
try {
  rmSync(destDir, { recursive: true, force: true });
} catch (e) {
  // Ignore if doesn't exist
}

// Copy directory function
function copyDir(src, dest) {
  mkdirSync(dest, { recursive: true });
  const entries = readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = resolve(src, entry.name);
    const destPath = resolve(dest, entry.name);
    
    // Skip .git, node_modules, .idea, etc.
    if (['.git', 'node_modules', '.idea', '.DS_Store'].includes(entry.name)) {
      continue;
    }
    
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else if (entry.isFile()) {
      copyFileSync(srcPath, destPath);
    }
  }
}

console.log('📦 Building for production...');
console.log(`Source: ${srcDir}`);
console.log(`Destination: ${destDir}`);

copyDir(srcDir, destDir);

console.log('✅ Build complete!');
console.log(`Output: ${destDir}`);

