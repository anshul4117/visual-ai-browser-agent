import * as esbuild from 'esbuild';
import { copyFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const srcDir = join(__dirname, '..', 'src');
const outdir = join(__dirname, '..', 'dist');

const isMinify = process.argv.includes('--minify');

async function build(): Promise<void> {
  // Ensure output directories exist
  mkdirSync(join(outdir, 'popup'), { recursive: true });

  // 1. Build background service worker (IIFE — service workers don't support ESM)
  await esbuild.build({
    entryPoints: [join(srcDir, 'background', 'index.ts')],
    outfile: join(outdir, 'background.js'),
    bundle: true,
    format: 'iife',
    target: 'es2022',
    sourcemap: true,
    minify: isMinify,
  });

  // 2. Build content script (IIFE — injected into page context)
  await esbuild.build({
    entryPoints: [join(srcDir, 'content', 'index.ts')],
    outfile: join(outdir, 'content.js'),
    bundle: true,
    format: 'iife',
    target: 'es2022',
    sourcemap: true,
    minify: isMinify,
  });

  // 3. Build popup script (IIFE)
  await esbuild.build({
    entryPoints: [join(srcDir, 'popup', 'popup.ts')],
    outfile: join(outdir, 'popup', 'popup.js'),
    bundle: true,
    format: 'iife',
    target: 'es2022',
    sourcemap: true,
    minify: isMinify,
  });

  // Also build popup.js in root dist for convenience
  copyFileSync(join(outdir, 'popup', 'popup.js'), join(outdir, 'popup.js'));

  // 4. Copy static files
  copyFileSync(
    join(srcDir, 'manifest.json'),
    join(outdir, 'manifest.json')
  );
  copyFileSync(
    join(srcDir, 'popup', 'popup.html'),
    join(outdir, 'popup', 'popup.html')
  );
  copyFileSync(
    join(srcDir, 'popup', 'popup.css'),
    join(outdir, 'popup', 'popup.css')
  );
  copyFileSync(
    join(srcDir, 'popup', 'popup.html'),
    join(outdir, 'popup.html')
  );
  copyFileSync(
    join(srcDir, 'popup', 'popup.css'),
    join(outdir, 'popup.css')
  );

  console.log('✅ Extension built successfully → dist/');
}

build().catch((err) => {
  console.error('❌ Build failed:', err);
  process.exit(1);
});
