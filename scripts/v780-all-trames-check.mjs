// v780 complete editorial regression: every trame is source-anchored and future
// scenario/variant clues are kept on the SERVER, not embedded in the public app.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(path,'utf8'),json=path=>JSON.parse(read(path));
const cataloguePaths=['data/v780-reviewed-001-012.json','data/v780-reviewed-013-024.json',
 'data/v780-reviewed-025-034.json','data/v780-reviewed-035-044.json'];
const variantPaths=['data/v780-variants-001-005.json','data/v780-variants-006-010.json',
 'data/v780-variants-011-015.json','data/v780-variants-016-020.json'];
const cat=cataloguePaths.flatMap(json),variants=variantPaths.flatMap(json);
assert.deepEqual(cat,json('data/v780-all-316-reviewed.json'),'Catalogue part files disagree');
assert.deepEqual(variants,json('data/v780-all-204-variants.json'),'Variant part files disagree');
assert.equal(cat.length,316);
assert.equal(new Set(cat.map(x=>x.scenario_id)).size,44);
assert.equal(new Set(cat.map(x=>x.scenario_id+'|'+x.ord)).size,316);
const changed=cat.filter(x=>x.new_text!==x.original_text||(x.new_title&&x.new_title!==x.title));
assert.equal(changed.length,281);
assert.equal(cat.length-changed.length,35);
assert.equal(variants.length,204,'Every authored runtime trame must be reviewed');
assert.equal(new Set(variants.map(x=>x.scenario_id)).size,20);
assert.equal(new Set(variants.map(x=>x.scenario_id+x.variant_id)).size,60);
assert.equal(new Set(variants.map(x=>x.scenario_id+x.variant_id+x.field)).size,65);
const unique=variants.map(x=>x.scenario_id+'|'+x.variant_id+'|'+x.field+'|'+x.ord);
assert.equal(new Set(unique).size,204);
const four=variants.filter(x=>x.scenario_id==='004');
assert.equal(four.length,9);
const exactFour=json('data/v780-reviewed-004-variants.json');
for(const x of four){
 const y=exactFour.find(t=>t.id===x.id&&t.variant_id===x.variant_id);
 assert(y&&x.new_text===y.new_text&&x.new_title===y.new_title);
}
const app=read('common-dossier-v106.js');
assert(!app.includes('const trameEditsV780=')&&!app.includes('const variantTramesV780='),
 'Future secret trame content must not be shipped to every player in browser JavaScript');
const catalogueSql=read('sql/v780_plain_language_catalogue.sql');
const manuscriptsSql=read('sql/v780_variant_manuscripts_204.sql');
const pinSql=read('sql/v780_existing_room_canons.sql');
const eventSql=read('sql/v780_existing_trame_events.sql');
const sqlQuote=x=>"'"+String(x).replaceAll("'","''")+"'";
assert(catalogueSql.includes('ORDER BY t.ord')&&
 catalogueSql.includes("x.old_text=t.item->>'text'"),'Catalogue patch needs exact-source and order guards');
assert(manuscriptsSql.includes("k.key~'_runtime_trames$'")&&
 manuscriptsSql.includes('ed.ord::integer=t.ord::integer')&&
 manuscriptsSql.includes('content_md5=md5(r.new_manuscript::text)'),
 'Manuscript patch must only touch source-matched trames and update hash');
assert(pinSql.includes('m.room_code=r.room_code')&&
 pinSql.includes('manuscript_md5=md5(r.new_manuscript::text)'),
 'Pinned-room patch must never swap another room’s manuscript');
assert(eventSql.includes("ev.event_type='trame'")&&
 eventSql.includes("ev.payload->>'text'=x.old_text")&&
 eventSql.includes("ev.payload->>'title'=x.old_title"),
 'History patch must change only already-emitted authorized trame payloads');
assert(!eventSql.includes("visibility=")&&!eventSql.includes("audience_roles="),
 'Never broaden access to private evidence');
let max=0;
for(const x of cat){
 assert(x.original_text&&x.new_text&&x.title,'Missing source in catalogue '+x.scenario_id);
 assert(x.new_text.length<=150,'Catalogue text too long '+x.scenario_id+'/'+x.ord);
 max=Math.max(max,x.new_text.length);
 assert(!/premier suspect|deuxième suspect|troisième suspect/i.test(x.new_text));
 if(x.original_text!==x.new_text||(x.new_title&&x.new_title!==x.title)){
  assert(catalogueSql.includes(sqlQuote(x.original_text))&&catalogueSql.includes(sqlQuote(x.new_text)),
   'Missing catalogue SQL source guard: '+x.scenario_id+'/'+x.title);
 }
}
const duplicate=new Map;
for(const x of variants){
 assert(x.original_text&&x.new_text&&x.title&&x.field);
 assert(x.new_text.length<=160,'Variant text too long '+x.scenario_id+x.variant_id+'/'+x.ord);
 max=Math.max(max,x.new_text.length);
 const key=x.scenario_id+'|'+x.title+'|'+x.original_text,z=duplicate.get(key);
 if(z)assert(z.new_text===x.new_text&&z.new_title===x.new_title,
  'Identical original clue must have the same plain-language rendering across variants');
 duplicate.set(key,x);
 assert(manuscriptsSql.includes(sqlQuote(x.original_text))&&manuscriptsSql.includes(sqlQuote(x.new_text)),
  'Missing manuscript patch source guard: '+x.scenario_id+x.variant_id+'/'+x.field+'/'+x.ord);
}
const finale=cat.find(x=>x.scenario_id==='044'&&x.cycle===3);
assert(finale&&finale.new_text.includes('un policier contacte le Kobun Kurokawa'));
assert(!/l’a tué|a tué|le meurtrier est|responsabilité centrale/i.test(finale.new_text));
const don=cat.filter(x=>x.scenario_id==='025');
assert.equal(don.length,3);
assert(don.every(x=>x.new_text.length<=120),'Don trames must be immediately understandable');
console.log('PASS v780: 316 catalogue trames (281 simplified), 204 private variant trames (all simplified), 520 reviewed; no secret clues shipped in client.');
