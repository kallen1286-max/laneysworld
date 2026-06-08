#!/usr/bin/env node
/**
 * Optimize src/assets/*.png by:
 *  1) Resizing oversized photos down to a sane max width (1920px) — the source
 *     files are raw iPhone 13 Pro captures at 3024x4032, which is way larger
 *     than anything we'd ever display.
 *  2) Re-encoding as MozJPEG quality 78, stripped of EXIF — looks visually
 *     identical, ~10–20x smaller on disk.
 *  3) Preserving the original .png filename so the figma:asset resolver and
 *     existing imports keep working unchanged.
 *
 * Idempotent: skips files that are already small (<200KB) or have no
 * compressible photo content (e.g. the logo).
 *
 * Run with: node scripts/optimize-images.mjs
 */
import { readdir, stat, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const assetsDir = path.resolve(__dirname, '..', 'src', 'assets');

const MAX_WIDTH = 1920;
const JPEG_QUALITY = 78;
const SKIP_BELOW_BYTES = 200 * 1024; // 200KB — don't touch the small logo/icons

const fmtBytes = (n) =>
  n < 1024 ? `${n}B` : n < 1024 ** 2 ? `${(n / 1024).toFixed(0)}KB` : `${(n / 1024 ** 2).toFixed(2)}MB`;

const files = (await readdir(assetsDir)).filter((f) => /\.(png|jpe?g)$/i.test(f));

let totalBefore = 0;
let totalAfter = 0;
let touched = 0;

for (const file of files) {
  const full = path.join(assetsDir, file);
  const before = (await stat(full)).size;
  totalBefore += before;

  if (before < SKIP_BELOW_BYTES) {
    console.log(`  skip  ${file.padEnd(50)} ${fmtBytes(before).padStart(8)}  (under threshold)`);
    totalAfter += before;
    continue;
  }

  const buf = await readFile(full);
  const meta = await sharp(buf).metadata();

  let pipeline = sharp(buf, { failOn: 'none' }).rotate(); // honor EXIF orientation
  if (meta.width && meta.width > MAX_WIDTH) {
    pipeline = pipeline.resize({ width: MAX_WIDTH, withoutEnlargement: true });
  }
  const out = await pipeline
    .jpeg({ quality: JPEG_QUALITY, mozjpeg: true, progressive: true })
    .withMetadata({ exif: {} }) // strip EXIF
    .toBuffer();

  await writeFile(full, out);
  const after = out.length;
  totalAfter += after;
  touched += 1;
  const pct = ((1 - after / before) * 100).toFixed(0);
  console.log(`  opt   ${file.padEnd(50)} ${fmtBytes(before).padStart(8)} -> ${fmtBytes(after).padStart(8)}  (-${pct}%)`);
}

console.log('');
console.log(`Optimized ${touched} file(s).`);
console.log(`Total: ${fmtBytes(totalBefore)} -> ${fmtBytes(totalAfter)}  (saved ${fmtBytes(totalBefore - totalAfter)})`);
