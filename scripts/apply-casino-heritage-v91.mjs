import {copyFile,mkdir,readFile,stat,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
const root=process.cwd(),dest=path.resolve(root,process.argv[2]||'dist');
const JS='heritage-casino-v91.js',CSS='heritage-casino-v91.css',VERSION='v91.3-casino-cinema';
const images=['campagne.webp','scenario-1.webp','scenario-2.webp','scenario-3.webp'];
for(const file of [JS,CSS,'casino-client-v105.js','casino-client-v105.css']){
  await stat(path.join(root,file));
  await copyFile(path.join(root,file),path.join(dest,file));
}
await mkdir(path.join(dest,'assets/casino'),{recursive:true});
await copyFile(path.join(root,'assets/casino/approved-posters-v105-2.webp'),path.join(dest,'assets/casino/approved-posters-v105-2.webp'));
for(const img of images){
  const origin=path.join(root,'assets/casino',img);
  const data=await readFile(origin);
  if(data.length<3000||data.toString('ascii',0,4)!=='RIFF'||data.toString('ascii',8,12)!=='WEBP')throw new Error('Bad Casino artwork: '+img);
  await copyFile(origin,path.join(dest,'assets/casino',img));
}
for(const page of ['index.html','en.html']){
  const name=path.join(dest,page);let html=await readFile(name,'utf8');
  // Replace previous cache versions when this finalizer is re-applied.
  html=html.replace(/\s*<link\b[^>]*href="(?:heritage-casino-v91|casino-client-v105)\.css(?:\?[^"]*)?"[^>]*>/g,'')
    .replace(/\s*<script\b[^>]*src="(?:heritage-casino-v91|casino-client-v105)\.js(?:\?[^"]*)?"[^>]*><\/script>/g,'');
  if(!html.includes(`href="${CSS}?v=${VERSION}"`)){
    html=html.replace('</head>',`  <link rel="stylesheet" href="${CSS}?v=${VERSION}">\n</head>`);
  }
  if(!html.includes(`src="${JS}?v=${VERSION}"`)){
    html=html.replace('</body>',`  <script src="${JS}?v=${VERSION}"></script>\n</body>`);
  }
  if(!html.includes('casino-client-v105.js?v=105.3'))html=html.replace('</body>','  <script src="casino-client-v105.js?v=105.3"></script>\n</body>');
  if(!html.includes('casino-client-v105.css?v=105.3'))html=html.replace('</head>','  <link rel="stylesheet" href="casino-client-v105.css?v=105.3">\n</head>');
  await writeFile(name,html,'utf8');
}
const commit=process.env.GITHUB_SHA||execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
await writeFile(path.join(dest,'casino-release.json'),JSON.stringify({version:'105.3',commit,campaign:'casino',chapters:3,phases:8}));
console.log('HÉRITAGE / CASINO: trois scénarios et reprise serveur intégrés');
