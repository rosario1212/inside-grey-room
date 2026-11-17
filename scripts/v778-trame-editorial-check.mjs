// v778 — editorial regression: exact old evidence, scenario/variant isolation,
// first-read clarity, no answer-key leakage, intact source metadata and game rules.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const edits=JSON.parse(readFileSync('data/trame-editorial-v778.json','utf8'));
const reviewedV780=JSON.parse(readFileSync('data/v780-all-316-reviewed.json','utf8'));

const source=readFileSync('common-dossier-v106.js','utf8');
const sql=readFileSync('sql/v778_trame_editorial_patch.sql','utf8');
const ux=readFileSync('investigation-ux-v772.js','utf8');
const investigatorRender=readFileSync('investigation-runtime-v42.js','utf8');
assert.equal(edits.length,46,'All 46 reviewed edits must be retained');
const unique=new Set;
for(const item of edits){
 const key=item.scenario_id+'|'+item.title;
 assert(!unique.has(key),'Duplicate edit: '+key); unique.add(key);
 assert(item.original_text&&item.text&&item.new_title,'Missing original, new copy or title: '+key);
 assert(item.text.length<=185,'Card exceeds concise editorial limit: '+key);
 assert(!/premier suspect|deuxième suspect|troisième suspect|le suspect [ABC]\b/i.test(item.text),
 'Opaque ordinal or placeholder survives: '+key);
 const escapeSql=s=>"'"+String(s).replaceAll("'","''")+"'";
 assert(sql.includes(escapeSql(item.original_text))&&sql.includes(escapeSql(item.text)),
 'The SQL patch must be guarded against the exact original wording: '+key);
}
assert.equal(new Set(edits.map(x=>x.scenario_id)).size,22);
assert(source.includes('const trameEditsV778='+JSON.stringify(edits)+';'),
 'Browser event previews must use the same reviewed edits as database migration');
assert(investigatorRender.includes("editorial?.preciseCaseCopy?.(original,p.title,scenarioId())") &&
 investigatorRender.includes("editorial?.editorialTitle?.(p.title,original,scenarioId())"),
 'Investigator must see the corrected title and facts on first render');
assert(ux.includes("typeof STATE!=='undefined'?STATE:window.STATE"),
 'Late DOM cleanup must read the actual game state safely');
assert(ux.includes("e.event_type!=='trame'")&&ux.includes("const events=state?.sync?.events||[]"),
 'Evidence-panel headings can only be updated for actually authorized and displayed events');
assert(sql.includes("ORDER BY t.ord") && sql.includes("AND x.old_text=t.item->>'text'"),
 'Do not reorder candidate trames or rewrite a different variant');

const start=source.indexOf('const case004Copy='),end=source.indexOf('\nlet cache=',start);
assert(start>0&&end>start);
let scenario='001';
const api=new Function('game','esc','tr',source.slice(start,end)+
 '; return {preciseCaseCopy,conciseCaseText,editorialTitle};')(
 ()=>({room:{scenario_id:scenario}}),String,fr=>fr
);
for(const edit of edits){
 scenario=edit.scenario_id;
 const next=reviewedV780.find(x=>x.scenario_id===edit.scenario_id &&
  x.title===edit.new_title && x.original_text===edit.text);
 const expectedCopy=next?.new_text||edit.text,expectedTitle=next?.new_title||edit.new_title;
 assert.equal(api.preciseCaseCopy(edit.original_text,edit.title),expectedCopy,
  'Legacy event must display the latest reviewed text: '+scenario+'/'+edit.title);
 assert.equal(api.preciseCaseCopy(edit.text,edit.new_title),expectedCopy,
  'Updated canonical evidence must get latest v780 text: '+scenario+'/'+edit.title);
 assert.equal(api.editorialTitle(edit.title,edit.original_text),expectedTitle,
  'Old event must display latest corrected heading: '+scenario+'/'+edit.title);
 assert(api.conciseCaseText(expectedCopy,expectedTitle).length<=185);
 scenario='999';
 assert.equal(api.preciseCaseCopy(edit.original_text,edit.title),edit.original_text,
  'Unrelated scenarios must never inherit this trame: '+edit.scenario_id);
}
const spoiler=['041|GIRI','042|MAINS SALES','043|LA DETTE','044|LE CONSEIL'];
for(const key of spoiler){
 const edit=edits.find(x=>x.scenario_id+'|'+x.title===key);
 assert(edit,'Spoiler-prone final-cycle clue not audited: '+key);
 assert(!/l’a tué|l'a tué|est l.exécutant matériel|chaîne la plus cohérente|police a utilisé les clans/i.test(edit.text),
  'Final-cycle trames cannot supply the final verdict: '+key);
}
const nonEvidence=['025|LES AUDIENCES','024|LA PROTECTION','031|LE DOSSIER'];
for(const key of nonEvidence){
 const edit=edits.find(x=>x.scenario_id+'|'+x.title===key);
 assert(edit&&!/Le Don peut convoquer|protection n.est pas automatique|Recoupez les déclarations/i.test(edit.text),
 'Keep role rules and instructions out of narrative trames: '+key);
}
console.log('PASS v778: 46 reviewed trames, 22 affected scenarios, source-matched migration, variant isolation, no explicit finale spoilers');
