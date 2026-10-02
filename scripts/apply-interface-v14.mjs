import { copyFile, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root=process.cwd();
const outArg=process.argv[2];
if(!outArg)throw new Error('Usage: node scripts/apply-interface-v14.mjs <dist|www>');
const out=path.resolve(root,outArg);
await stat(out);

for(const name of ['interface-polish-v14.css','interface-polish-v14.js']){
  await copyFile(path.join(root,name),path.join(out,name));
}

// iOS caches touch icons very aggressively. Keep a new physical filename so
// Safari cannot silently reuse an older icon after a deployment.
const iosIcon='apple-touch-icon-v15.png';
await copyFile(path.join(root,'assets',iosIcon),path.join(out,'assets',iosIcon));

for(const page of ['index.html','en.html']){
  const target=path.join(out,page);
  let html=await readFile(target,'utf8');
  if(!html.includes('interface-polish-v14.css')){
    html=html.replace('</head>','  <link rel="stylesheet" href="interface-polish-v14.css?v=v14-ui-polish">\n</head>');
  }
  if(!html.includes('interface-polish-v14.js')){
    html=html.replace('</body>','  <script src="interface-polish-v14.js?v=v14-ui-polish"></script>\n</body>');
  }
  // Force the exact Inside Grey Room door artwork for iOS Add to Home Screen,
  // plus a precomposed alias and a normal page icon for Safari's share UI.
  html=html.replace(/<link\s+rel="apple-touch-icon"[^>]*>/i,'<link rel="apple-touch-icon" sizes="180x180" href="assets/apple-touch-icon-v15.png?v=v15-ios-home">');
  if(!/rel="apple-touch-icon-precomposed"/i.test(html)){
    html=html.replace(/(<link\s+rel="apple-touch-icon"[^>]*>)/i,'$1\n  <link rel="apple-touch-icon-precomposed" sizes="180x180" href="assets/apple-touch-icon-v15.png?v=v15-ios-home">');
  }
  html=html.replace(/<link\s+rel="icon"[^>]*>/i,'<link rel="icon" type="image/png" sizes="180x180" href="assets/apple-touch-icon-v15.png?v=v15-ios-home">');
  await writeFile(target,html,'utf8');
}

const manifestPath=path.join(out,'manifest.webmanifest');
try{
  const manifest=JSON.parse(await readFile(manifestPath,'utf8'));
  manifest.start_url='/?igr=v15-ios-home-icon';
  manifest.icons=[
    {src:'assets/icon-192-v14.png',sizes:'192x192',type:'image/png',purpose:'any'},
    {src:'assets/icon-512-v14.png',sizes:'512x512',type:'image/png',purpose:'any maskable'}
  ];
  await writeFile(manifestPath,JSON.stringify(manifest,null,2)+'\n','utf8');
}catch(err){console.warn('[v15] manifest patch skipped',err.message)}

const swPath=path.join(out,'service-worker.js');
try{
  let sw=await readFile(swPath,'utf8');
  sw=sw.replace(/const CACHE='[^']+';/,"const CACHE='igr-v15-ios-home-icon';");
  if(!sw.includes('/interface-polish-v14.css')){
    sw=sw.replace("  '/', '/index.html', '/en.html',","  '/', '/index.html', '/en.html',\n  '/interface-polish-v14.css?v=v14-ui-polish','/interface-polish-v14.js?v=v14-ui-polish',");
  }
  sw=sw.replace("'/assets/icon-192-v9.png','/assets/icon-512-v9.png','/assets/apple-touch-icon-v9.png','/assets/favicon-v9.png'","'/assets/icon-192-v14.png','/assets/icon-512-v14.png','/assets/apple-touch-icon-v15.png','/assets/favicon-v14.png'");
  sw=sw.replaceAll('/assets/apple-touch-icon-v14.png','/assets/apple-touch-icon-v15.png');
  await writeFile(swPath,sw,'utf8');
}catch{}

console.log(`Inside Grey Room v15 iOS icon + v14 interface polish applied to ${outArg}`);
