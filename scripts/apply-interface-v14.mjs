import { copyFile, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root=process.cwd();
const outArg=process.argv[2];
if(!outArg)throw new Error('Usage: node scripts/apply-interface-v14.mjs <dist|www>');
const out=path.resolve(root,outArg);
await stat(out);

for(const name of ['interface-polish-v14.css','interface-polish-v14.js','navigation-theme-v18.css','navigation-theme-v18.js','navigation-heritage-v19.css','navigation-heritage-v19.js','cell-controls-stability-v23.js']){
  await copyFile(path.join(root,name),path.join(out,name));
}

const iosIcon='apple-touch-icon-v15.png';
await copyFile(path.join(root,'assets',iosIcon),path.join(out,'assets',iosIcon));

for(const page of ['index.html','en.html']){
  const target=path.join(out,page);
  let html=await readFile(target,'utf8');
  if(!html.includes('interface-polish-v14.css'))html=html.replace('</head>','  <link rel="stylesheet" href="interface-polish-v14.css?v=v20-settings-nav">\n</head>');
  else html=html.replace(/interface-polish-v14\.css\?v=[^"']+/g,'interface-polish-v14.css?v=v20-settings-nav');
  if(!html.includes('interface-polish-v14.js'))html=html.replace('</body>','  <script src="interface-polish-v14.js?v=v20-settings-nav"></script>\n</body>');
  else html=html.replace(/interface-polish-v14\.js\?v=[^"']+/g,'interface-polish-v14.js?v=v20-settings-nav');

  if(!html.includes('navigation-theme-v18.css'))html=html.replace('</head>','  <link rel="stylesheet" href="navigation-theme-v18.css?v=v20-settings-nav">\n</head>');
  else html=html.replace(/navigation-theme-v18\.css\?v=[^"']+/g,'navigation-theme-v18.css?v=v20-settings-nav');
  if(!html.includes('navigation-theme-v18.js'))html=html.replace('</body>','  <script src="navigation-theme-v18.js?v=v20-settings-nav"></script>\n</body>');
  else html=html.replace(/navigation-theme-v18\.js\?v=[^"']+/g,'navigation-theme-v18.js?v=v20-settings-nav');

  if(!html.includes('navigation-heritage-v19.css'))html=html.replace('</head>','  <link rel="stylesheet" href="navigation-heritage-v19.css?v=v23-cell-stability">\n</head>');
  else html=html.replace(/navigation-heritage-v19\.css\?v=[^"']+/g,'navigation-heritage-v19.css?v=v23-cell-stability');
  if(!html.includes('navigation-heritage-v19.js'))html=html.replace('</body>','  <script src="navigation-heritage-v19.js?v=v23-cell-stability"></script>\n</body>');
  else html=html.replace(/navigation-heritage-v19\.js\?v=[^"']+/g,'navigation-heritage-v19.js?v=v23-cell-stability');

  if(!html.includes('cell-controls-stability-v23.js'))html=html.replace('</body>','  <script src="cell-controls-stability-v23.js?v=v23-cell-stability"></script>\n</body>');
  else html=html.replace(/cell-controls-stability-v23\.js\?v=[^"']+/g,'cell-controls-stability-v23.js?v=v23-cell-stability');

  html=html.replace(/dlc-profile-ui-v12-44\.css\?v=[^"']+/g,'dlc-profile-ui-v12-44.css?v=v20-settings-nav');
  html=html.replace(/dlc-profile-ui-v12-44\.js\?v=[^"']+/g,'dlc-profile-ui-v12-44.js?v=v20-settings-nav');
  html=html.replace(/dlc-suite-v12-40\.css\?v=[^"']+/g,'dlc-suite-v12-40.css?v=v20-settings-nav');
  html=html.replace(/terror-v12-40\.css\?v=[^"']+/g,'terror-v12-40.css?v=v20-settings-nav');
  html=html.replace(/dlc-suite-v12-37\.js\?v=[^"']+/g,'dlc-suite-v12-37.js?v=v20-settings-nav');
  html=html.replace(/omerta-v12\.js\?v=[^"']+/g,'omerta-v12.js?v=v20-settings-nav');
  html=html.replace(/dlc-invites-v12-45\.js\?v=[^"']+/g,'dlc-invites-v12-45.js?v=v20-settings-nav');

  html=html.replace(/<link\s+rel="apple-touch-icon"[^>]*>/i,'<link rel="apple-touch-icon" sizes="180x180" href="assets/apple-touch-icon-v15.png?v=v15-ios-home">');
  if(!/rel="apple-touch-icon-precomposed"/i.test(html))html=html.replace(/(<link\s+rel="apple-touch-icon"[^>]*>)/i,'$1\n  <link rel="apple-touch-icon-precomposed" sizes="180x180" href="assets/apple-touch-icon-v15.png?v=v15-ios-home">');
  html=html.replace(/<link\s+rel="icon"[^>]*>/i,'<link rel="icon" type="image/png" sizes="180x180" href="assets/apple-touch-icon-v15.png?v=v15-ios-home">');
  await writeFile(target,html,'utf8');
}

const manifestPath=path.join(out,'manifest.webmanifest');
try{
  const manifest=JSON.parse(await readFile(manifestPath,'utf8'));
  manifest.id='/';manifest.start_url='/';manifest.scope='/';
  manifest.icons=[
    {src:'assets/icon-192-v14.png',sizes:'192x192',type:'image/png',purpose:'any'},
    {src:'assets/icon-512-v14.png',sizes:'512x512',type:'image/png',purpose:'any maskable'}
  ];
  await writeFile(manifestPath,JSON.stringify(manifest,null,2)+'\n','utf8');
}catch(err){console.warn('[v23] manifest patch skipped',err.message)}

const swPath=path.join(out,'service-worker.js');
try{
  let sw=await readFile(swPath,'utf8');
  sw=sw.replace(/const CACHE='[^']+';/,"const CACHE='igr-v23-cell-stability';");
  if(!sw.includes('/premium-access-sync-v17.css')){
    sw=sw.replace("  '/', '/index.html', '/en.html',","  '/', '/index.html', '/en.html',\n  '/premium-access-sync-v17.css?v=v17-premium-sync','/premium-access-sync-v17.js?v=v17-premium-sync',");
  }
  if(!sw.includes('/interface-polish-v14.css')){
    sw=sw.replace("  '/', '/index.html', '/en.html',","  '/', '/index.html', '/en.html',\n  '/interface-polish-v14.css?v=v20-settings-nav','/interface-polish-v14.js?v=v20-settings-nav',");
  }else{
    sw=sw.replace(/\/interface-polish-v14\.css\?v=[^']+/g,'/interface-polish-v14.css?v=v20-settings-nav');
    sw=sw.replace(/\/interface-polish-v14\.js\?v=[^']+/g,'/interface-polish-v14.js?v=v20-settings-nav');
  }
  if(!sw.includes('/navigation-theme-v18.css')){
    sw=sw.replace("  '/', '/index.html', '/en.html',","  '/', '/index.html', '/en.html',\n  '/navigation-theme-v18.css?v=v20-settings-nav','/navigation-theme-v18.js?v=v20-settings-nav',");
  }else{
    sw=sw.replace(/\/navigation-theme-v18\.css\?v=[^']+/g,'/navigation-theme-v18.css?v=v20-settings-nav');
    sw=sw.replace(/\/navigation-theme-v18\.js\?v=[^']+/g,'/navigation-theme-v18.js?v=v20-settings-nav');
  }
  if(!sw.includes('/navigation-heritage-v19.css')){
    sw=sw.replace("  '/', '/index.html', '/en.html',","  '/', '/index.html', '/en.html',\n  '/navigation-heritage-v19.css?v=v23-cell-stability','/navigation-heritage-v19.js?v=v23-cell-stability',");
  }else{
    sw=sw.replace(/\/navigation-heritage-v19\.css\?v=[^']+/g,'/navigation-heritage-v19.css?v=v23-cell-stability');
    sw=sw.replace(/\/navigation-heritage-v19\.js\?v=[^']+/g,'/navigation-heritage-v19.js?v=v23-cell-stability');
  }
  if(!sw.includes('/cell-controls-stability-v23.js')){
    sw=sw.replace("  '/', '/index.html', '/en.html',","  '/', '/index.html', '/en.html',\n  '/cell-controls-stability-v23.js?v=v23-cell-stability',");
  }else{
    sw=sw.replace(/\/cell-controls-stability-v23\.js\?v=[^']+/g,'/cell-controls-stability-v23.js?v=v23-cell-stability');
  }
  sw=sw.replace(/\/dlc-profile-ui-v12-44\.css\?v=[^']+/g,'/dlc-profile-ui-v12-44.css?v=v20-settings-nav');
  sw=sw.replace(/\/dlc-profile-ui-v12-44\.js\?v=[^']+/g,'/dlc-profile-ui-v12-44.js?v=v20-settings-nav');
  sw=sw.replace(/\/dlc-suite-v12-40\.css\?v=[^']+/g,'/dlc-suite-v12-40.css?v=v20-settings-nav');
  sw=sw.replace(/\/terror-v12-40\.css\?v=[^']+/g,'/terror-v12-40.css?v=v20-settings-nav');
  sw=sw.replace(/\/dlc-suite-v12-37\.js\?v=[^']+/g,'/dlc-suite-v12-37.js?v=v20-settings-nav');
  sw=sw.replace(/\/omerta-v12\.js\?v=[^']+/g,'/omerta-v12.js?v=v20-settings-nav');
  sw=sw.replace(/\/dlc-invites-v12-45\.js\?v=[^']+/g,'/dlc-invites-v12-45.js?v=v20-settings-nav');
  sw=sw.replace("'/assets/icon-192-v9.png','/assets/icon-512-v9.png','/assets/apple-touch-icon-v9.png','/assets/favicon-v9.png'","'/assets/icon-192-v14.png','/assets/icon-512-v14.png','/assets/apple-touch-icon-v15.png','/assets/favicon-v14.png'");
  sw=sw.replaceAll('/assets/apple-touch-icon-v14.png','/assets/apple-touch-icon-v15.png');
  await writeFile(swPath,sw,'utf8');
}catch{}

console.log(`Inside Grey Room v23 cell controls + scoped navigation applied to ${outArg}`);
