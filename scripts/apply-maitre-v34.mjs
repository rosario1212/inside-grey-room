import { cp, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root=process.cwd();
const out=path.resolve(root,process.argv[2]||'dist');
const runtime=['heritage-maitre-data-v34.js','heritage-maitre-v34.css','heritage-maitre-v34.js'];
async function exists(file){try{await stat(file);return true}catch{return false}}
if(!(await exists(out)))throw new Error(`MAÎTRE target does not exist: ${out}`);
for(const name of runtime){
  const src=path.join(root,name);
  if(!(await exists(src)))throw new Error(`Missing MAÎTRE runtime: ${name}`);
  await cp(src,path.join(out,name));
}
const css='  <link rel="stylesheet" href="heritage-maitre-v34.css?v=v34-maitre">';
const data='  <script src="heritage-maitre-data-v34.js?v=v34-maitre"></script>';
const js='  <script src="heritage-maitre-v34.js?v=v34-maitre"></script>';
for(const page of ['index.html','en.html']){
  const file=path.join(out,page);let html=await readFile(file,'utf8');
  if(!html.includes('heritage-maitre-v34.css'))html=html.replace('</head>',`${css}\n</head>`);
  if(!html.includes('heritage-maitre-data-v34.js'))html=html.replace('</body>',`${data}\n${js}\n</body>`);
  else if(!html.includes('heritage-maitre-v34.js'))html=html.replace('</body>',`${js}\n</body>`);
  await writeFile(file,html,'utf8');
}
console.log(`HÉRITAGE — MAÎTRE v34 applied to ${out}`);
