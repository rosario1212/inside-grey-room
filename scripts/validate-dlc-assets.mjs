import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const names=['omerta-021-l-enveloppe.webp','omerta-022-omerta.webp','omerta-023-la-table.webp','omerta-024-il-pentito.webp','omerta-025-il-don.webp'];
function webpSize(buf){
  if(buf.toString('ascii',0,4)!=='RIFF'||buf.toString('ascii',8,12)!=='WEBP')throw new Error('not_webp');
  const type=buf.toString('ascii',12,16);
  if(type==='VP8 '){
    if(buf[23]!==0x9d||buf[24]!==0x01||buf[25]!==0x2a)throw new Error('bad_vp8_frame');
    return [buf.readUInt16LE(26)&0x3fff,buf.readUInt16LE(28)&0x3fff];
  }
  if(type==='VP8X')return [1+buf.readUIntLE(24,3),1+buf.readUIntLE(27,3)];
  if(type==='VP8L'){
    const b0=buf[21],b1=buf[22],b2=buf[23],b3=buf[24];
    return [1+(((b2&0x3f)<<8)|b1),1+(((b3&0x0f)<<10)|(b2>>6)|(b3<<2&0x300)|((b0&0)/* keep parser explicit */))];
  }
  throw new Error(`unsupported_webp_${type}`);
}
for(const name of names){
  const file=path.join(root,'assets',name);if(!fs.existsSync(file))throw new Error(`Missing ${file}`);
  const buf=fs.readFileSync(file);if(buf.length<200_000)throw new Error(`${name} suspiciously small: ${buf.length} bytes`);
  const [w,h]=webpSize(buf);if(w!==1086||h!==1448)throw new Error(`${name} wrong dimensions ${w}x${h}`);
  console.log(`OK ${name}: ${w}x${h} · ${(buf.length/1024).toFixed(1)} KiB`);
}
const js=fs.readFileSync(path.join(root,'omerta-v12-35.js'),'utf8');
if(/-hd\.svg|pixelated|crisp-edges/.test(js))throw new Error('Legacy/degraded OMERTA image reference found in omerta-v12-35.js');
console.log('OMERTÀ HQ asset validation OK');
