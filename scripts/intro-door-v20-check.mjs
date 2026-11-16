import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root=path.resolve(process.argv[2]||'dist');
const read=name=>readFile(path.join(root,name),'utf8');
const fail=reason=>{throw new Error('Intro v20 visual integrity: '+reason)};
const [html,css,sw]=await Promise.all([
  read('index.html'),read('intro-poster-v18.css'),read('service-worker.js')
]);

const entry=(html.match(/id="introEnterBtn"/g)||[]).length;
if(entry!==1)fail('expected one functional ENTRER button, found '+entry);
if(!html.includes('id="introHint">TOUCHEZ POUR OUVRIR LA PORTE</small>'))fail('entry hint is missing');
if(!html.includes('class="intro-door-scene-v20"'))fail('self-contained door element is missing');
if(html.includes('<img class="intro-art"'))fail('fragile legacy intro image is still present');
if(!html.includes('intro-poster-v18.css?v=v20-original-door-embedded-20261116'))fail('stale intro stylesheet reference');
if(!sw.includes('/intro-poster-v18.css?v=v20-original-door-embedded-20261116'))fail('intro stylesheet missing from PWA cache');

const match=css.match(/background-image:url\("data:image\/webp;base64,([A-Za-z0-9+/=]+)"\)!important/);
if(!match)fail('inline door image missing from stylesheet');
const buffer=Buffer.from(match[1],'base64');
if(buffer.length<20000)fail('embedded door WebP is implausibly small');
if(buffer.toString('ascii',0,4)!=='RIFF'||buffer.toString('ascii',8,12)!=='WEBP')fail('embedded door is not a valid WebP container');
if(!css.includes('background-size:112% auto!important'))fail('portrait door framing missing');
if(!css.includes('.intro-gate-v18.opening .intro-poster-frame .intro-door-scene-v20'))fail('door animation missing');
console.log('Intro v20 integrity OK: native ENTRER button, original WebP door, mobile framing, offline cache.');
