// Public CARTEL Mexico lore smoke test. Does not activate any secret variant.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const src=await readFile('dlc-suite-v12-37.js','utf8');
const lore=await readFile('docs/cartel-mexico-world-v1.md','utf8');
const start=src.indexOf('  const CARTEL=['),end=src.indexOf('  const REGIME=[',start);
assert(start>0&&end>start,'CARTEL dossier definitions missing');
const cartel=src.slice(start,end);
const entries=[...cartel.matchAll(/\{id:'(\d{3})',title:'([^']+)',short:'([^']+)',context:'([^']+)'/g)];
assert.deepEqual(entries.map(x=>x[1]),['029','030','031'],'Only the three CARTEL dossiers should change');
for(const [,id,title,short,context] of entries){
  assert(/Puerto Ceniza/.test(short+' '+context),'Fictional Mexican location missing for '+id);
  assert(/Sinaloa|Mexique/.test(short+' '+context),'Mexican context missing for '+id);
  assert(/Corona de Sal/.test(short+' '+context),'Cartel identity missing for '+id);
  assert(short.length<220,'Lobby synopsis is too long for '+id);
  assert(context.length<750,'Scenario description is too long for '+id);
  assert(!/coupable est|assassin est|variante [ABC]/i.test(short+' '+context),'Potential secret disclosure in '+id);
  assert(title.length>0);
}
assert(src.includes("Object.assign(PUBLIC_LOBBY_SUMMARIES,Object.fromEntries([...CARTEL,...REGIME].map(sc=>[sc.id,sc.short])))"),'Lobby must receive the public CARTEL summary');
assert(lore.includes('**entièrement au Mexique**'),'Mexico-only canon missing');
assert(lore.includes('**future**'),'Pressure mechanic must be explicitly non-active');
assert(lore.includes('Zéro fuite'),'Variant secrecy policy missing');
assert(!/cartel_pressure\s*:\s*[1-4]/.test(src),'No fake reactive pressure value in public runtime');
console.log('CARTEL Mexico canon validated: 029–031 public copy, shared location, no premature secret or fake pressure');
