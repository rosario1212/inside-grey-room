import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';

const target=path.resolve(process.argv[2]||'dist');
const VERSION='v68-rc1';
const POLISH='release-polish-v68.css';

for(const page of ['index.html','en.html']){
  const file=path.join(target,page);
  let html=await readFile(file,'utf8');

  if(!/name=["']color-scheme["']/i.test(html)){
    html=html.replace('</head>','  <meta name="color-scheme" content="dark">\n</head>');
  }
  if(!html.includes(POLISH)){
    html=html.replace('</head>',`  <link rel="stylesheet" href="${POLISH}?v=${VERSION}">\n</head>`);
  }

  // The old beta footer is useful during testing but must not leak an obsolete
  // internal version into the commercial presentation.
  html=html.replace(/Inside Grey Room\s*·\s*Bêta\s*12\.11\.0/gi,'Inside Grey Room');
  html=html.replace(/Inside Grey Room\s*·\s*Beta\s*12\.11\.0/gi,'Inside Grey Room');

  await writeFile(file,html,'utf8');
}

try{
  const sw=path.join(target,'service-worker.js');
  let text=await readFile(sw,'utf8');
  text=text.replace(/const CACHE='[^']+';/,`const CACHE='igr-${VERSION}';`);
  if(!text.includes('/'+POLISH+'?v='+VERSION) && text.includes('const SHELL=[')){
    text=text.replace('const SHELL=[',`const SHELL=[\n  '/${POLISH}?v=${VERSION}',`);
  }
  await writeFile(sw,text,'utf8');
}catch(error){
  if(error?.code!=='ENOENT')throw error;
}

try{
  const app=path.join(target,'app-v11.js');
  let text=await readFile(app,'utf8');
  text=text.replace(/\/service-worker\.js\?v=[A-Za-z0-9._-]+/g,'/service-worker.js?v='+VERSION);
  await writeFile(app,text,'utf8');
}catch(error){
  if(error?.code!=='ENOENT')throw error;
}

console.log(`Inside Grey Room ${VERSION}: commercial presentation polish applied`);
