import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const names=[
  'omerta-021-l-enveloppe.webp','omerta-022-omerta.webp','omerta-023-la-table.webp','omerta-024-il-pentito.webp','omerta-025-il-don.webp',
  'terror-026-la-ville-tombe.webp','terror-027-la-zone-rouge.webp','terror-028-dernier-perimetre.webp',
  'cartel-029-le-cycle-mort.webp','cartel-030-la-cour-achetee.webp','cartel-031-la-dette.webp',
  'regime-032-les-archives-du-palais.webp','regime-033-la-dynastie.webp','regime-034-les-noms-quils-portaient.webp'
];
function webpSize(buf){
  if(buf.toString('ascii',0,4)!=='RIFF'||buf.toString('ascii',8,12)!=='WEBP')throw new Error('not_webp');
  const type=buf.toString('ascii',12,16);
  if(type==='VP8 '){
    if(buf[23]!==0x9d||buf[24]!==0x01||buf[25]!==0x2a)throw new Error('bad_vp8_frame');
    return [buf.readUInt16LE(26)&0x3fff,buf.readUInt16LE(28)&0x3fff];
  }
  if(type==='VP8X')return [1+buf.readUIntLE(24,3),1+buf.readUIntLE(27,3)];
  throw new Error(`unsupported_webp_${type}`);
}
for(const name of names){
  const file=path.join(root,'assets',name);if(!fs.existsSync(file))throw new Error(`Missing ${file}`);
  const buf=fs.readFileSync(file);if(buf.length<120_000)throw new Error(`${name} suspiciously small: ${buf.length} bytes`);
  const [w,h]=webpSize(buf);if(w!==1086||h!==1448)throw new Error(`${name} wrong dimensions ${w}x${h}`);
  console.log(`OK ${name}: ${w}x${h} · ${(buf.length/1024).toFixed(1)} KiB`);
}
const omerta=fs.readFileSync(path.join(root,'omerta-v12-37.js'),'utf8');
const terror=fs.readFileSync(path.join(root,'terror-v12-37.js'),'utf8');
const suite=fs.readFileSync(path.join(root,'dlc-suite-v12-37.js'),'utf8');
if(/-hd\.svg|pixelated|crisp-edges/.test(omerta+terror+suite))throw new Error('Legacy/degraded image reference found in v12.37 runtime');
console.log('DLC v12.37 asset validation OK');
