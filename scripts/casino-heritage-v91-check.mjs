import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
const root=process.cwd(),dir=path.resolve(process.argv[2]||'dist');
const j=await readFile(path.join(dir,'heritage-casino-v91.js'),'utf8');
const c=await readFile(path.join(dir,'heritage-casino-v91.css'),'utf8');
assert.match(j,/LES PORTES DE L’IMPÉRIAL/);assert.match(j,/LA CHUTE DE L’IMPÉRIAL/);assert.match(j,/LE DERNIER DRAGON/);
assert.match(j,/launchReady:true/);assert.match(j,/data-casino-live>JOUER LA CAMPAGNE/);assert.doesNotMatch(j,/LANCEMENT INDISPONIBLE|INTRIGUES EN VALIDATION/);
assert.match(j,/data-casino-nav/);assert.match(j,/hplay-hub-grid/);
assert.doesNotMatch(j,/18[,.]4|Sang du Dragon|Double Livre|Pacte Brisé|answerKey|CREATE\s+POLICY/);
assert.match(c,/\.casino-page/);
assert.match(j,/class="casino-chapter-stage"/,'Chapter posters must sit alongside the narrative');
assert.match(j,/class="casino-launch casino-chapter-launch"/,'Chapter launch needs an isolated spaced container');
assert.match(j,/class="casino-action casino-launch-button" type="button" data-casino-live/,'Both launch CTAs must share the premium style');
assert.doesNotMatch(j,/class="btn primary casino-action"/,'The generic white primary button must not override Casino');
assert.match(c,/CASINO cinematic poster finish v91\.3/);
assert.ok(c.includes('CASINO poster dimensions v91.4'),'Version marker missing');
assert.ok(c.includes('grid-template-rows:auto auto'),'Mobile card needs separate poster/title rows');
assert.ok(c.includes('width:clamp(140px,39vw,166px)'),'Mobile poster dimensions must be responsive');
assert.ok(c.includes('aspect-ratio:var(--poster-width) / 1024'),'Poster artwork proportions must be preserved');
assert.match(c,/--casino-burgundy:#651d29/);
assert.match(c,/--casino-ivory:#f7ecdc/);
assert.match(c,/--casino-metal:#bc965a/);
assert.match(c,/\.casino-page \.casino-chapter-stage/);
assert.match(c,/\.casino-page \.casino-launch \.casino-launch-button/);
assert.match(c,/\.casino-page \.casino-dossier-poster/);
assert.match(c,/@media\(max-width:650px\)/);
assert.doesNotMatch(c,/object-fit:\s*cover\s*!important/,'Artwork must never be cropped');

for(const name of ['campagne','scenario-1','scenario-2','scenario-3']){
  const p=path.join(dir,'assets/casino',name+'.webp'),buf=await readFile(p);
  assert.equal(buf.toString('ascii',0,4),'RIFF');assert.equal(buf.toString('ascii',8,12),'WEBP');
}
for(const p of ['index.html','en.html']){
  const html=await readFile(path.join(dir,p),'utf8');
  assert.equal(html.split('heritage-casino-v91.js?v=v91.4-casino-proportions').length-1,1,`duplicate Casino runtime in ${p}`);
  assert.equal(html.split('heritage-casino-v91.css?v=v91.4-casino-proportions').length-1,1,`duplicate Casino style in ${p}`);
  assert.ok(html.indexOf('heritage-play-v13-7.js')<html.indexOf('heritage-casino-v91.js'),`Casino script before Heritage in ${p}`);
}
console.log('CASINO v91 checks passed — artwork, isolated navigation, no secret stories, server-backed campaign launch');
