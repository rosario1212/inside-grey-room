import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';

const dir=path.resolve(process.argv[2]||'dist');
const posters=[
 ['029','LE CYCLE MORT'],
 ['030','LA COUR ACHETÉE'],
 ['031','LA DETTE']
];
for(const [id,title] of posters){
 const file=path.join(dir,'assets',`cartel-${id}-poster-v2.svg`);
 const svg=await readFile(file,'utf8');
 assert(svg.startsWith('<svg '),`Poster ${id} must be an SVG`);
 assert(svg.includes('width="724" height="960"'),`Poster ${id} must have the 3:4 portrait ratio`);
 assert(svg.includes('data:image/webp;base64,'),`Poster ${id} is missing the approved illustration`);
 assert(svg.includes('>INSIDE GREY ROOM</text>'),`Poster ${id} missing aligned masthead`);
 assert(svg.includes('>CARTEL</text>'),`Poster ${id} missing collection title`);
 assert(svg.includes('>DOSSIER</text>'),`Poster ${id} missing single dossier label`);
 assert(svg.includes(`>${id}</text>`),`Poster ${id} missing large lower number`);
 assert(svg.includes(`>${title}</text>`),`Poster ${id} missing redesigned title`);
 assert((svg.match(/>DOSSIER<\/text>/g)||[]).length===1,`Poster ${id} has duplicate dossier labels`);
 assert((svg.match(/>INSIDE GREY ROOM<\/text>/g)||[]).length===1,`Poster ${id} has duplicate mastheads`);
 assert(svg.includes('id="gold"'),`Poster ${id} missing premium metallic gold gradient`);
 assert(!svg.includes('filter="url('),`Poster ${id} blurs text`);
 assert((await stat(file)).size>60000,`Poster ${id} appears incomplete`);
}
const runtime=await readFile(path.join(dir,'dlc-suite-v12-37.js'),'utf8');
assert(!runtime.includes('igr-cartel-poster-index'),'Obsolete HTML number overlay remains');
for(const [id] of posters){
 assert(runtime.includes(`assets/cartel-${id}-poster-v2.svg?v=v20261018-cartel-gilded-v5`),`Poster ${id} has stale asset URL`);
}
console.log('CARTEL luxury poster assets validated: 029, 030, 031');
