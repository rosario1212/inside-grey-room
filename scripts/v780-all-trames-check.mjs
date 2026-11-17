// v780: every canonical candidate trame is reviewed; only exactly verified source text changes.
// No variant-specific facts can migrate to another dossier.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(path,'utf8');
const files=['data/v780-reviewed-001-012.json','data/v780-reviewed-013-024.json',
 'data/v780-reviewed-025-034.json','data/v780-reviewed-035-044.json'];
const groups=files.map(path=>JSON.parse(read(path)));
const all=groups.flat(),variants=JSON.parse(read('data/v780-reviewed-004-variants.json'));
const combined=JSON.parse(read('data/v780-all-316-reviewed.json'));
const edited=all.filter(x=>x.original_text!==x.new_text||(x.new_title||x.title)!==x.title);
const app=read('common-dossier-v106.js'),catSql=read('sql/v780_plain_language_catalogue.sql');
const variantSql=read('sql/v780_plain_language_004_variants.sql');
const legacy=JSON.parse(read('data/trame-editorial-v778.json'));
assert.equal(all.length,316,'All 316 catalogue trames must be reviewed');
assert.deepEqual(combined,all,'Combined audit must match each individual source-anchored review');
assert.equal(new Set(all.map(x=>x.scenario_id)).size,44,'All 44 canonical scenarios audited');
assert.equal(new Set(all.map(x=>x.scenario_id+'|'+x.ord)).size,316);
assert.equal(edited.length,281,'281 trames have actual editorial improvements');
assert.equal(all.length-edited.length,35,'Already clear trames must be left intact');
assert.equal(variants.length,9,'All three Sofia variants have three reviewed trames');
assert(app.includes('const trameEditsV780='+JSON.stringify(edited.map(x=>({
 scenario_id:x.scenario_id,title:x.title,original_text:x.original_text,
 new_title:x.new_title||x.title,new_text:x.new_text
})))+';'),'Runtime must match exact 281 reviewed sources');
assert(app.includes('const variantTramesV780='+JSON.stringify(variants.map(x=>({
 scenario_id:x.scenario_id,variant_id:x.variant_id,title:x.title,original_text:x.original_text,
 new_title:x.new_title,new_text:x.new_text
})))+';'),'Runtime must match all nine 004 variant trames');
assert(catSql.includes("ORDER BY t.ord")&&catSql.includes("x.old_text=t.item->>'text'"),
 'Catalogue SQL must preserve ordering and exact-source scope');
assert(variantSql.includes("m.scenario_id='004'")&&variantSql.includes("content_md5=md5(u.new_manuscript::text)")&&
 variantSql.includes("x.id=t.item->>'id'"),'Variant SQL must preserve scenario, IDs and manuscript hash');
const quote=s=>"'"+String(s).replaceAll("'","''")+"'";
let maximum=0;
for(const t of all){
 assert.equal(typeof t.original_text,'string');
 assert.equal(typeof t.new_text,'string');
 assert(t.new_text.length<=150,'Too long after review: '+t.scenario_id+'/'+t.ord);
 maximum=Math.max(maximum,t.new_text.length);
 assert(!/premier suspect|deuxième suspect|troisième suspect/i.test(t.new_text),
  'Suspect slot number must not replace an actual person: '+t.scenario_id+'/'+t.ord);
 if(t.new_text!==t.original_text||(t.new_title&&t.new_title!==t.title)){
  assert(catSql.includes(quote(t.original_text))&&catSql.includes(quote(t.new_text)),
  'SQL lacks source or replacement: '+t.scenario_id+'/'+t.title);
 }
}
for(const x of variants){
 assert(x.new_text.length<=150&&x.new_title);
 assert(variantSql.includes(quote(x.original_text))&&variantSql.includes(quote(x.new_text)));
}
const helperStart=app.indexOf('const case004Copy='),helperEnd=app.indexOf('\nlet cache=',helperStart);
assert(helperStart>=0&&helperEnd>helperStart);
let id='001';
const api=new Function('game','esc','tr',app.slice(helperStart,helperEnd)+
 ';return {preciseCaseCopy,editorialTitle,conciseCaseText};')(
 ()=>({room:{scenario_id:id}}),String,fr=>fr
);
for(const t of all){
 id=t.scenario_id;
 assert.equal(api.preciseCaseCopy(t.original_text,t.title),t.new_text,
  'Source event wording wrong: '+id+'/'+t.title);
 assert.equal(api.editorialTitle(t.title,t.original_text),t.new_title||t.title,
  'Old event heading wrong: '+id+'/'+t.title);
 assert.equal(api.preciseCaseCopy(t.new_text,t.new_title||t.title),t.new_text,
  'New event changed again: '+id+'/'+t.title);
 id='999';
 assert.equal(api.preciseCaseCopy(t.original_text,t.title),t.original_text,
  'Different scenario contamination: '+t.scenario_id);
}
id='004';
for(const x of variants){
 assert.equal(api.preciseCaseCopy(x.original_text,x.title),x.new_text,x.id+' text mismatch');
 assert.equal(api.editorialTitle(x.title,x.original_text),x.new_title,x.id+' title mismatch');
}
for(const old of legacy){
 const modern=all.find(x=>x.scenario_id===old.scenario_id&&x.title===old.new_title
  &&x.original_text===old.text);
 if(!modern)continue;
 id=old.scenario_id;
 assert.equal(api.preciseCaseCopy(old.original_text,old.title),modern.new_text,
  'Old pre-v778 events must display final v780 text');
 assert.equal(api.editorialTitle(old.title,old.original_text),modern.new_title||modern.title);
}
const finale=all.filter(x=>x.scenario_id==='044'&&x.cycle===3);
assert.equal(finale.length,1);
assert(!/l’a tué|a tué|meurtrier est|coupable est|responsabilité centrale/i.test(finale[0].new_text),
 'Final trame must not tell the players who killed the Oyabun');
const nome=['025','044'];
for(const sid of nome){
 assert(all.filter(x=>x.scenario_id===sid).every(x=>x.new_text.length<=140),
 sid+' must be simple enough to read immediately');
}
console.log('PASS v780: 316 reviewed/281 rewritten/35 retained, 9 Sofia variants, 44 scenarios, '+maximum+'-char maximum, old-room and cross-scenario QA.');
