import { copyFile, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root=process.cwd();
const target=path.resolve(root,process.argv[2]||'dist');
async function exists(file){try{await stat(file);return true}catch{return false}}
if(!(await exists(target)))throw new Error(`Duration v35 target missing: ${target}`);
for(const name of ['duration-modes-v35.js','duration-modes-v35.css']){
  const source=path.join(root,name);
  if(!(await exists(source)))throw new Error(`Duration v35 source missing: ${name}`);
  await copyFile(source,path.join(target,name));
}
const style='  <link rel="stylesheet" href="duration-modes-v35.css?v=v35-duration-modes-lobby">';
const script='  <script src="duration-modes-v35.js?v=v35-duration-modes-lobby"></script>';
for(const page of ['index.html','en.html']){
  const file=path.join(target,page);if(!(await exists(file)))continue;
  let html=await readFile(file,'utf8');
  if(!html.includes('duration-modes-v35.css'))html=html.replace('</head>',`${style}\n</head>`);
  if(!html.includes('duration-modes-v35.js'))html=html.replace('</body>',`${script}\n</body>`);
  await writeFile(file,html,'utf8');
}
console.log(`Inside Grey Room duration modes v35.1 lobby selector applied to ${target}`);
