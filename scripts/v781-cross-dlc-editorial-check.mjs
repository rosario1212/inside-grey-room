// v781 — Editorial release: guard public facts, short DLC copy and compatible PWA URLs.
// A/B/C plot secrets are never inspected or bundled here.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(path,'utf8');
const app=read('app-v11.js');
const omerta=read('omerta-v12.js');
const suite=read('dlc-suite-v12-37.js');
const copy=read('dlc-copy-v12-46.js');
const maitre=read('heritage-maitre-data-v34.js');
const heritage=read('heritage-play-v13-7.js');
const index=read('index.html');
const sw=read('service-worker.js');
const finalizer=read('scripts/finalize-cartel030-release.mjs');
const version='v781-dlc-clarity-20261118';
const clientVersion='v812-spy-lobby-viewport-20261121';
assert(app.includes('Un patient est mort pendant le programme hospitalier ÉLIGIBLES'),
  '015: patient death, never an invented doctor death');
const baseSummary=app.slice(app.indexOf('const PUBLIC_LOBBY_SUMMARIES'),app.indexOf('const CANONICAL_BRIEFINGS'));
assert(!baseSummary.includes('Une médecin est retrouvée morte'),'015 public briefing contradicts the case');
assert(app.includes('Une succession oppose plusieurs proches autour d’un testament'),'007 case context must be concrete');
assert(omerta.includes('Domenico Falco ne se présente pas'),'023 public brief must preserve the meeting');
assert(omerta.includes('Sandro Vitale, un chauffeur, a été violemment interrogé'),'024 public brief must preserve the injured driver');
assert(suite.includes('Six agents américains ont été abattus près de la frontière du Sonora'),
  '031 must describe the ambush, not a mismatched abduction');
assert(!suite.includes('L’enquête se joue en trois cycles ;'),'Do not add procedural instructions to case story');
assert(!copy.includes('Un fugitif capturé perd son objectif'),'Collection teaser must not repeat game mechanics');

function caseContext(source,id) {
  const start=source.indexOf("{id:'"+id+"'");
  assert(start>=0,'Scenario absent: '+id);
  const contextStart=source.indexOf('context:',start);
  const end=source.indexOf(',mood:',contextStart);
  assert(contextStart>start&&end>contextStart&&end-start<1900,'Scenario context missing: '+id);
  return source.slice(contextStart+8,end);
}
for(const id of ['001','002','003','004','005','006','007','008','009','010','011','012','013','014','015','016','017','018','019','020']){
  assert(caseContext(app,id).length>35,'Base scenario has empty context '+id);
}
for(const id of ['021','022','023','024','025']){
  const ctx=caseContext(omerta,id);
  assert(ctx.length<=400,'Omerta public context too long: '+id);
}
for(const id of ['029','030','031','032','033','034']){
  assert(caseContext(suite,id).length<=430,'Cartel/Regime context too long: '+id);
}
const briefs=src=>[...src.matchAll(/\bbriefing:(?:"((?:\\.|[^"])*)"|'((?:\\.|[^'])*)')/g)]
  .map(m=>m[1]??m[2]);
const mb=briefs(maitre),hb=briefs(heritage);
assert.equal(mb.length,5,'Maître must have 5 chapter briefings');
assert.equal(hb.length,10,'Cendres/Kuroi must have 10 chapter briefings');
assert(mb.every(t=>t.length<=400),'Maître chapter intro excessively long');
assert(hb.every(t=>t.length<=400),'Heritage chapter intro excessively long');

for(const name of ['app-v11.js','omerta-v12.js','dlc-suite-v12-37.js','dlc-copy-v12-46.js']){
 const v=name==='app-v11.js'?clientVersion:version;
 assert(index.includes(name+'?v='+v),'Missing updated index asset '+name);
 assert(sw.includes(name+'?v='+v),'Missing PWA precache asset '+name);
}
for(const name of ['heritage-maitre-data-v34.js','heritage-play-v13-7.js']){
 assert(sw.includes(name+'?v='+version),'Missing premium asset revision '+name);
}
assert(sw.includes("igr-v826-full-width-dossiers-20261121"),'New mobile PWA cache revision missing');
assert(finalizer.includes("const clientVersion='"+clientVersion+"'"),
 'Production builder must not roll back the canonical app version');
console.log('PASS v781: 20 base briefs, 14 DLC contexts, 15 Heritage chapter introductions, preview and cache coherence.');
