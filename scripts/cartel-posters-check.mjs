import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';

const dir=path.resolve(process.argv[2]||'dist');
const posters=[
 ['029','LE CYCLE MORT',115],
 ['030','LA COUR ACHETÉE',90],
 ['031','LA DETTE',115]
];
for(const [id,title,cropTop] of posters){
 const file=path.join(dir,'assets',`cartel-${id}-poster-v2.svg`);
 const svg=await readFile(file,'utf8');
 assert(svg.startsWith('<svg '),`Poster ${id} must be an SVG`);
 assert(svg.includes('width="724" height="960"'),`Poster ${id} must have the 3:4 portrait ratio`);
 assert(svg.includes('data:image/webp;base64,'),`Poster ${id} is missing the approved illustration`);
 assert(svg.includes(`viewBox="0 ${cropTop} 724 ${560-cropTop}"`),`Poster ${id} must use a text-free source crop`);
 assert(svg.includes('preserveAspectRatio="xMidYMid slice"'),`Poster ${id} must crop away original embedded lettering`);
 assert(svg.includes('<rect width="724" height="122" fill="#080503"/>'),`Poster ${id} lacks opaque masthead backdrop`);
 assert(svg.includes('<rect y="585" width="724" height="375" fill="url(#bottomShade)"/>'),`Poster ${id} lacks continuous lower photo fade`);
 assert(svg.includes('<svg x="0" y="120" width="724" height="635"'),`Poster ${id} lacks cropped scene viewport`);
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
 assert(runtime.includes(`assets/cartel-${id}-poster-v2.svg?v=v20261018-cartel-open-masthead-v7`),`Poster ${id} has stale asset URL`);
}
console.log('CARTEL luxury poster assets validated: 029, 030, 031');
