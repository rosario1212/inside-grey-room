import { cp, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const out = path.join(root, 'dist');

const runtimeFiles = [
  'index.html',
  'styles-v11.css',
  'polish-v12.css',
  'app-v11.js',
  'qa-fixes-v12.js',
  'investigation-sheet-v12.js',
  'video-v12-3.js',
  'turn-v12-4.js',
  'profile-dossier-v12.js',
  'playstore-ready-v12.js',
  'social-v12.js',
  'notifications-v12.js',
  'native-lifecycle-v12.js',
  'runtime-optimization-v12.js',
  'gameplay-simple-v12.js',
  'apple-ui-stability-v12.js',
  'gameplay-clean-v12.js',
  'language-v12.js',
  'service-worker.js',
  'manifest.webmanifest',
  'privacy.html',
  'terms.html',
  'delete-account.html',
  'support.html'
];

async function exists(file) {
  try { await stat(file); return true; } catch { return false; }
}

const indexHtml = await readFile(path.join(root, 'index.html'), 'utf8');
const declared = new Set(runtimeFiles);
const referenced = new Set();
for (const match of indexHtml.matchAll(/(?:src|href)=["']([^"']+)["']/g)) {
  const raw = match[1];
  if (!raw || /^(?:https?:|data:|blob:|#)/i.test(raw)) continue;
  const relative = raw.split(/[?#]/, 1)[0].replace(/^\.\//, '');
  if (!relative || relative.startsWith('assets/')) continue;
  if (!declared.has(relative)) throw new Error(`Web runtime list is out of sync with index.html: ${relative}`);
  referenced.add(relative);
}
for (const name of runtimeFiles.filter(name => /\.(?:js|css)$/.test(name) && name !== 'service-worker.js')) {
  if (!referenced.has(name)) throw new Error(`Web runtime file is shipped but not loaded by index.html: ${name}`);
}

await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });

const searchableText = [];
for (const name of runtimeFiles) {
  const src = path.join(root, name);
  if (!(await exists(src))) throw new Error(`Missing web runtime file: ${name}`);
  const dst = path.join(out, name);
  await mkdir(path.dirname(dst), { recursive: true });
  await cp(src, dst, { recursive: true });
  searchableText.push(await readFile(src, 'utf8'));
}

// Only ship assets referenced by the active runtime. Historical artwork and backups
// stay in GitHub, but no longer consume storage in every hosting deployment.
const assetRefs = new Set();
for (const text of searchableText) {
  for (const match of text.matchAll(/assets\/[A-Za-z0-9._/-]+/g)) assetRefs.add(match[0]);
}

let assetBytes = 0;
for (const relative of [...assetRefs].sort()) {
  const src = path.join(root, relative);
  if (!(await exists(src))) throw new Error(`Missing referenced web asset: ${relative}`);
  const dst = path.join(out, relative);
  await mkdir(path.dirname(dst), { recursive: true });
  await cp(src, dst);
  assetBytes += (await stat(src)).size;
}

// Cloudflare Pages reads this file natively. Vercel ignores it and continues to use
// vercel.json, so one bundle can be deployed on either host.
const cloudflareHeaders = `
/*
  Strict-Transport-Security: max-age=31536000
  X-Content-Type-Options: nosniff
  X-Permitted-Cross-Domain-Policies: none
  Referrer-Policy: no-referrer
  Permissions-Policy: camera=(self), microphone=(self), geolocation=(), payment=(), usb=(), bluetooth=(), serial=()
  X-Frame-Options: DENY
  Cross-Origin-Resource-Policy: same-origin

/service-worker.js
  Cache-Control: public, max-age=0, must-revalidate
  Service-Worker-Allowed: /

/manifest.webmanifest
  Cache-Control: public, max-age=0, must-revalidate
  Content-Type: application/manifest+json; charset=utf-8

/index.html
  Cache-Control: public, max-age=0, must-revalidate

/assets/*
  Cache-Control: public, max-age=31536000, immutable
`;
await writeFile(path.join(out, '_headers'), cloudflareHeaders.trimStart(), 'utf8');

console.log(`Inside Grey Room web bundle ready: ${out}`);
console.log(`Runtime files: ${runtimeFiles.length} · assets: ${assetRefs.size} · ${(assetBytes / 1024 / 1024).toFixed(2)} MiB assets`);