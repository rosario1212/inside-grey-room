import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
const dir=path.resolve(process.argv[2]||'dist');
for(const id of ['029','030','031']){
 const file=path.join(dir,'assets',`cartel-${id}-poster-v2.svg`);
 const svg=await readFile(file,'utf8');
 assert(svg.startsWith('<svg '),`Poster ${id} is not an SVG`);
 assert(svg.includes('data:image/webp;base64,'),`Poster ${id} missing approved embedded artwork`);
 assert(svg.includes('>${id}</text>'),`Poster ${id} missing visible gold number`);
 assert(svg.includes('>DOSSIER</text>'),`Poster ${id} missing dossier label`);
 assert((await stat(file)).size>60000,`Poster ${id} is incomplete`);
}
const runtime=await readFile(path.join(dir,'dlc-suite-v12-37.js'),'utf8');
assert(!runtime.includes('igr-cartel-poster-index'),'Obsolete duplicate HTML number overlay remains');
console.log('CARTEL poster assets validated: 029, 030, 031');
