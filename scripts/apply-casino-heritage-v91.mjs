import {copyFile,mkdir,readFile,stat,writeFile} from 'node:fs/promises';
import path from 'node:path';
const root=process.cwd(),dest=path.resolve(root,process.argv[2]||'dist');
const JS='heritage-casino-v91.js',CSS='heritage-casino-v91.css',VERSION='v91-casino-heritage';
const images=['campagne.webp','scenario-1.webp','scenario-2.webp','scenario-3.webp'];
for(const file of [JS,CSS,'casino-client-v105.js','casino-client-v105.css']){
  await stat(path.join(root,file));
  await copyFile(path.join(root,file),path.join(dest,file));
}
await mkdir(path.join(dest,'assets/casino'),{recursive:true});
for(const img of images){
  const origin=path.join(root,'assets/casino',img);
  const data=await readFile(origin);
  if(data.length<3000||data.toString('ascii',0,4)!=='RIFF'||data.toString('ascii',8,12)!=='WEBP')throw new Error('Bad Casino artwork: '+img);
  await copyFile(origin,path.join(dest,'assets/casino',img));
}
for(const page of ['index.html','en.html']){
  const name=path.join(dest,page);let html=await readFile(name,'utf8');
  if(!html.includes(`href="${CSS}?v=${VERSION}"`)){
    html=html.replace('</head>',`  <link rel="stylesheet" href="${CSS}?v=${VERSION}">\n</head>`);
  }
  if(!html.includes(`src="${JS}?v=${VERSION}"`)){
    html=html.replace('</body>',`  <script src="${JS}?v=${VERSION}"></script>\n</body>`);
  }
  if(!html.includes('casino-client-v105.js?v=105.0'))html=html.replace('</body>','  <script src="casino-client-v105.js?v=105.0"></script>\n</body>');
  if(!html.includes('casino-client-v105.css?v=105.0'))html=html.replace('</head>','  <link rel="stylesheet" href="casino-client-v105.css?v=105.0">\n</head>');
  await writeFile(name,html,'utf8');
}
console.log('HÉRITAGE / CASINO v91 + client v105: server-backed lobby staged — campaign launch requires approved private canons');
