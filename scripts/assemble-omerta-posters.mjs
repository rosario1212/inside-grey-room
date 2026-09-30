import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root=process.cwd();
const ids=['021','022','023','024','025'];
const outputNames={
  '021':'omerta-021-v1227.webp',
  '022':'omerta-022-v1227.webp',
  '023':'omerta-023-v1227.webp',
  '024':'omerta-024-v1227.webp',
  '025':'omerta-025-v1227.webp'
};

function validateWebp(buffer,id){
  if(buffer.length<10000)throw new Error(`OMERTA ${id}: assembled poster is unexpectedly small (${buffer.length} bytes)`);
  if(buffer.subarray(0,4).toString('ascii')!=='RIFF'||buffer.subarray(8,12).toString('ascii')!=='WEBP'){
    throw new Error(`OMERTA ${id}: assembled poster is not a valid WebP container`);
  }
  const declared=buffer.readUInt32LE(4)+8;
  if(declared!==buffer.length)throw new Error(`OMERTA ${id}: RIFF length mismatch (${declared} declared, ${buffer.length} actual)`);
}

for(const id of ids){
  const sourceDir=path.join(root,'assets-src','omerta',id);
  const chunks=(await readdir(sourceDir)).filter(name=>name.endsWith('.b64')).sort();
  if(!chunks.length)throw new Error(`OMERTA ${id}: no Base64 chunks found`);
  const encoded=(await Promise.all(chunks.map(name=>readFile(path.join(sourceDir,name),'utf8')))).map(x=>x.trim()).join('');
  const buffer=Buffer.from(encoded,'base64');
  validateWebp(buffer,id);
  const target=path.join(root,'assets',outputNames[id]);
  await mkdir(path.dirname(target),{recursive:true});
  await writeFile(target,buffer);
  console.log(`OMERTA ${id}: ${chunks.length} chunks -> ${buffer.length} bytes -> assets/${outputNames[id]}`);
}
