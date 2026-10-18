import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
const root=process.cwd(),dir=path.resolve(process.argv[2]||'dist');
const j=await readFile(path.join(dir,'heritage-casino-v91.js'),'utf8');
const c=await readFile(path.join(dir,'heritage-casino-v91.css'),'utf8');
assert.match(j,/LES PORTES DE L’IMPÉRIAL/);assert.match(j,/LA CHUTE DE L’IMPÉRIAL/);assert.match(j,/LE DERNIER DRAGON/);
assert.match(j,/launchReady:false/);assert.match(j,/disabled aria-disabled="true"/);
assert.match(j,/data-casino-nav/);assert.match(j,/hplay-hub-grid/);
assert.doesNotMatch(j,/18[,.]4|Sang du Dragon|Double Livre|Pacte Brisé|answerKey|CREATE\s+POLICY/);
assert.match(c,/\.casino-page/);
for(const name of ['campagne','scenario-1','scenario-2','scenario-3']){
  const p=path.join(dir,'assets/casino',name+'.webp'),buf=await readFile(p);
  assert.equal(buf.toString('ascii',0,4),'RIFF');assert.equal(buf.toString('ascii',8,12),'WEBP');
}
for(const p of ['index.html','en.html']){
  const html=await readFile(path.join(dir,p),'utf8');
  assert.equal(html.split('heritage-casino-v91.js?v=v91-casino-heritage').length-1,1,`duplicate Casino runtime in ${p}`);
  assert.equal(html.split('heritage-casino-v91.css?v=v91-casino-heritage').length-1,1,`duplicate Casino style in ${p}`);
  assert.ok(html.indexOf('heritage-play-v13-7.js')<html.indexOf('heritage-casino-v91.js'),`Casino script before Heritage in ${p}`);
}
console.log('CASINO v91 checks passed — artwork, isolated navigation, no secret stories, disabled session launch');
