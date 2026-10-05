import { copyFile, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root=process.cwd();
const target=path.resolve(root,process.argv[2]||'dist');
const source=path.join(root,'timer-runtime-v46.js');
const exists=async file=>{try{await stat(file);return true}catch{return false}};
if(!(await exists(target)))throw new Error(`Timer v46 target missing: ${target}`);
if(!(await exists(source)))throw new Error('Timer v46 source missing');
await copyFile(source,path.join(target,'timer-runtime-v46.js'));
const script='  <script src="timer-runtime-v46.js?v=v46-1-long-timers"></script>';
for(const page of ['index.html','en.html']){
  const file=path.join(target,page);if(!(await exists(file)))continue;
  let html=await readFile(file,'utf8');
  if(!html.includes('timer-runtime-v46.js'))html=html.replace('</body>',`${script}\n</body>`);
  await writeFile(file,html,'utf8');
}
console.log(`Inside Grey Room timer runtime v46.1 applied to ${target}`);
