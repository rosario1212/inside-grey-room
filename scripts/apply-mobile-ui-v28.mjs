import { copyFile, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root=process.cwd();
const outArg=process.argv[2];
if(!outArg)throw new Error('Usage: node scripts/apply-mobile-ui-v28.mjs <dist|www>');
const out=path.resolve(root,outArg);
await stat(out);

const VERSION='v30-fixed-top-quit-button';
for(const name of ['mobile-ui-v28.css','mobile-ui-v28.js','prebeta-v30.css','notification-bell-visibility-v31.js']){
  await copyFile(path.join(root,name),path.join(out,name));
}

for(const page of ['index.html','en.html']){
  const target=path.join(out,page);
  let html=await readFile(target,'utf8');
  html=html.replace(/\s*<link[^>]+mobile-ui-v28\.css[^>]*>\s*/gi,'\n');
  html=html.replace(/\s*<link[^>]+prebeta-v30\.css[^>]*>\s*/gi,'\n');
  html=html.replace(/\s*<script[^>]+mobile-ui-v28\.js[^>]*><\/script>\s*/gi,'\n');
  html=html.replace(/\s*<script[^>]+notification-bell-visibility-v31\.js[^>]*><\/script>\s*/gi,'\n');
  html=html.replace('</head>',`  <link rel="stylesheet" href="mobile-ui-v28.css?v=${VERSION}">\n  <link rel="stylesheet" href="prebeta-v30.css?v=${VERSION}">\n</head>`);
  html=html.replace('</body>',`  <script src="mobile-ui-v28.js?v=${VERSION}"></script>\n  <script src="notification-bell-visibility-v31.js?v=${VERSION}"></script>\n</body>`);
  await writeFile(target,html,'utf8');
}

const swPath=path.join(out,'service-worker.js');
try{
  let sw=await readFile(swPath,'utf8');
  if(!sw.includes('/mobile-ui-v28.css')){
    sw=sw.replace(
      "  '/', '/index.html', '/en.html',",
      `  '/', '/index.html', '/en.html',\n  '/mobile-ui-v28.css?v=${VERSION}','/prebeta-v30.css?v=${VERSION}','/mobile-ui-v28.js?v=${VERSION}','/notification-bell-visibility-v31.js?v=${VERSION}',`
    );
  }else{
    sw=sw.replace(/\/mobile-ui-v28\.css\?v=[^']+/g,`/mobile-ui-v28.css?v=${VERSION}`);
    sw=sw.replace(/\/mobile-ui-v28\.js\?v=[^']+/g,`/mobile-ui-v28.js?v=${VERSION}`);
    if(!sw.includes('/prebeta-v30.css')){
      sw=sw.replace(/'\/mobile-ui-v28\.css\?v=[^']+'/,match=>`${match},'/prebeta-v30.css?v=${VERSION}'`);
    }else{
      sw=sw.replace(/\/prebeta-v30\.css\?v=[^']+/g,`/prebeta-v30.css?v=${VERSION}`);
    }
    if(!sw.includes('/notification-bell-visibility-v31.js')){
      sw=sw.replace(/'\/mobile-ui-v28\.js\?v=[^']+'/,match=>`${match},'/notification-bell-visibility-v31.js?v=${VERSION}'`);
    }else{
      sw=sw.replace(/\/notification-bell-visibility-v31\.js\?v=[^']+/g,`/notification-bell-visibility-v31.js?v=${VERSION}`);
    }
  }
  await writeFile(swPath,sw,'utf8');
}catch(err){
  console.warn('[v30] service worker patch skipped',err.message);
}

console.log(`Inside Grey Room v30 fixed top quit button applied to ${outArg}`);
