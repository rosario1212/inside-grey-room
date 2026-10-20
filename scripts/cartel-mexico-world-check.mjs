// Public CARTEL Mexico lore smoke test. Does not activate any secret variant.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const src=await readFile('dlc-suite-v12-37.js','utf8');
const lore=await readFile('docs/cartel-mexico-world-v1.md','utf8');
const canon=await readFile('docs/cartel-los-salcedo-canon-v1.md','utf8');
const start=src.indexOf('  const CARTEL=['),end=src.indexOf('  const REGIME=[',start);
assert(start>0&&end>start,'CARTEL dossier definitions missing');
const cartel=src.slice(start,end);
const entries=[...cartel.matchAll(/\{id:'(\d{3})',title:'([^']+)',short:'([^']+)',context:'([^']+)'/g)];
assert.deepEqual(entries.map(x=>x[1]),['029','030','031'],'Only the three CARTEL dossiers should change');
for(const [,id,title,short,context] of entries){
  assert(/Puerto Ceniza/.test(lore),'Fictional Mexican location missing for '+id);
  assert(/Sinaloa|Mexique/.test(lore),'Mexican context missing for '+id);
  assert(/Los Salcedo/.test(canon),'Salcedo identity missing for '+id);
  assert(short.length<220,'Lobby synopsis is too long for '+id);
  assert(context.length<750,'Scenario description is too long for '+id);
  assert(!/coupable est|assassin est|variante [ABC]/i.test(short+' '+context),'Potential secret disclosure in '+id);
  assert(title.length>0);
}
assert(src.includes("Object.assign(PUBLIC_LOBBY_SUMMARIES,Object.fromEntries([...CARTEL,...REGIME].map(sc=>[sc.id,sc.short])))"),'Lobby must receive the public CARTEL summary');
assert(src.includes("if(window.IGR_LOCALE==='en')"),'English edition must carry the Mexico narrative');
for(const id of ['029','030','031'])assert(src.includes("'"+id+"':{short:'"),'English synopsis missing for '+id);
assert(lore.includes('**entièrement au Mexique**'),'Mexico-only canon missing');
assert(lore.includes('**future**') || lore.includes('**non active**') || lore.includes('**NON ACTIVÉ**'),'Pressure mechanic must be explicitly non-active');
assert(lore.includes('Zéro fuite'),'Variant secrecy policy missing');
assert(!/cartel_pressure\s*:\s*[1-4]/.test(src),'No fake reactive pressure value in public runtime');
assert(!/Corona de Sal|Valcárcel/.test(src),'Deprecated cartel branding found in public runtime');
for(const name of ['Ismael','Isabel','Ramiro','Jesús','Vicente','Rogelio','Saúl','Damián','Nicolás','Alberto'])assert(canon.includes(name),'Missing canonical family member '+name);
assert(canon.includes('**53 ans**')||canon.includes('**53**'),'Ismael must be 53');
assert(canon.includes('« Chuy »'),'Jesus must keep his nickname');
assert(canon.includes('**029 — LE CYCLE MORT**')&&canon.includes('**031 — LA DETTE**'),'Fear escalation across dossier trilogy missing');
assert(/peur/i.test(cartel),'Fear must be explicit in public CARTEL premise');
console.log('CARTEL Los Salcedo canon validated: 029–031 public copy, family, fear progression, no secret leak or fake pressure');
