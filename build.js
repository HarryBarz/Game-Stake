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

// Verify source exists
try {
  const srcStat = statSync(srcDir);
  if (!srcStat.isDirectory()) {
    throw new Error(`Source is not a directory: ${srcDir}`);
  }
} catch (e) {
  console.error(`❌ Source directory not found: ${srcDir}`);
  process.exit(1);
}

// Copy files
try {
  copyDir(srcDir, destDir);
} catch (e) {
  console.error('❌ Build failed:', e);
  process.exit(1);
}

// Verify files were copied
try {
  const files = readdirSync(destDir);
  if (files.length === 0) {
    console.error('❌ Build output is empty!');
    process.exit(1);
  }
  console.log(`✅ Copied ${files.length} items to dist/`);
  console.log(`   Files: ${files.slice(0, 5).join(', ')}${files.length > 5 ? '...' : ''}`);
} catch (e) {
  console.error('❌ Failed to verify build output:', e);
  process.exit(1);
}

console.log('✅ Build complete!');
console.log(`Output: ${destDir}`);

