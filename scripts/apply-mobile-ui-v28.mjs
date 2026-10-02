import { copyFile, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root=process.cwd();
const outArg=process.argv[2];
if(!outArg)throw new Error('Usage: node scripts/apply-mobile-ui-v28.mjs <dist|www>');
const out=path.resolve(root,outArg);
await stat(out);

const VERSION='v28-mobile-ui-controls';
for(const name of ['mobile-ui-v28.css','mobile-ui-v28.js']){
  await copyFile(path.join(root,name),path.join(out,name));
}

for(const page of ['index.html','en.html']){
  const target=path.join(out,page);
  let html=await readFile(target,'utf8');
  html=html.replace(/\s*<link[^>]+mobile-ui-v28\.css[^>]*>\s*/gi,'\n');
  html=html.replace(/\s*<script[^>]+mobile-ui-v28\.js[^>]*><\/script>\s*/gi,'\n');
  html=html.replace('</head>',`  <link rel="stylesheet" href="mobile-ui-v28.css?v=${VERSION}">\n</head>`);
  html=html.replace('</body>',`  <script src="mobile-ui-v28.js?v=${VERSION}"></script>\n</body>`);
  await writeFile(target,html,'utf8');
}

const swPath=path.join(out,'service-worker.js');
try{
  let sw=await readFile(swPath,'utf8');
  sw=sw.replace(/const CACHE='[^']+';/,"const CACHE='igr-v28-mobile-ui-controls';");
  if(!sw.includes('/mobile-ui-v28.css')){
    sw=sw.replace(
      "  '/', '/index.html', '/en.html',",
      `  '/', '/index.html', '/en.html',\n  '/mobile-ui-v28.css?v=${VERSION}','/mobile-ui-v28.js?v=${VERSION}',`
    );
  }
  await writeFile(swPath,sw,'utf8');
}catch(err){
  console.warn('[v28] service worker patch skipped',err.message);
}

console.log(`Inside Grey Room v28 mobile UI controls applied to ${outArg}`);
