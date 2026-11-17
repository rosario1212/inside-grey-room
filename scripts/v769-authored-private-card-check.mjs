// Regression: only the caller's already-authorized, pinned manuscript
// may contribute personal context/dialogue. No sealed plot data in this test.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const sql=fs.readFileSync(
 'supabase/migrations/20261117172600_igr_v769_authored_private_card_enrichment.sql','utf8');
const app=fs.readFileSync('app-v11.js','utf8');
for(const guard of [
 'igr_v769_authored_supplement','p_player uuid','p.public_role=',
 "p.room_code=v_room","v_slot","v_variant",
 'igr_v99_room_canons','igr_v99_variant_manuscripts',
 "pg_catalog.md5(c.manuscript::text)=c.manuscript_md5",
 'IF v_matches<3 THEN RETURN p_private',
 "p_private->>'anchors'=v_card->>'what_you_know'",
 "p_private->>'hide'=v_card->>'what_you_hide'",
 "p_private->>'chronology'=v_card->>'your_chronology'",
 "p_private->>'place'=v_card->>'identity'",
 "p_scenario IN ('005','006','021','022','023','024','025','030','031','032','033','034')",
 "v_card->'conversation_hooks'",
 "LIMIT 2",
 "'{player,private_state}'",
 "raw->''player''->>''public_role''=''suspect''",
 "raw->''room''->>''status'' in (''playing'',''finished'')",
 'REVOKE ALL ON FUNCTION igr_private.igr_v769_authored_supplement'
]){
 assert(sql.includes(guard),'Authored card guard missing: '+guard);
}
assert(!/UPDATE\s+(?:igr_private\.|public\.)?igr_v99_variant_manuscripts/i.test(sql),
 'Never mutate the canonical variants');
assert(!/\{scenario,/.test(sql),'The supplement must never enter public scenarios');
assert(!sql.includes('v769_truth')&&!sql.includes('answer_key'),
 'Private card cannot contain an answer-key field');

const start=app.indexOf('function igr82RelationLink(');
const next=app.indexOf('\nasync function sendSpyDecision',start);
const cardStart=app.indexOf('function privateCardHtml(){',next);
const cardEnd=app.indexOf('\nfunction renderRole(){',cardStart);
assert(start>=0&&next>start&&cardStart>next&&cardEnd>cardStart,
 'Actual card renderer functions must be found');
const extracted=app.slice(start,next)+'\n'+app.slice(cardStart,cardEnd)+'\nprivateCardHtml()';
const h=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
function draw(custom={}){
 const ps={
  place:'Ta fonction officielle au sein de ce dossier',
  story:'',
  chronology:'08:20 — Tu as consulté les registres.',
  anchors:'Tu as observé une entrée irrégulière.',
  hide:'Ton geste personnel, non connu du groupe.',
  objective_main:'Établir ta propre version.',
  relations:[{pseudo:'Partenaire',text:'Vous avez échangé la veille.'}],
  ...custom
 };
 const STATE={room:'TEST',role:'suspect',playerPseudo:'Alice',
  sync:{room:{scenario_id:'014',status:'playing',phase:'role_reading',cycle:1,state:{}},
   player:{id:'self',pseudo:'Alice',public_role:'suspect',secret_role:'',private_state:ps},
   players:[{id:'self',pseudo:'Alice',seat_index:0},{id:'other',pseudo:'Partenaire',seat_index:1,
    private_state:{story:'NE-JAMAIS-MONTRER-LE-SECRET-D-AUTRUI'}}]}};
 const sandbox={STATE,STORAGE:{getItem:()=>null},window:{IGR_LOCALE:'fr'},h,
  roleInfo:()=>({label:'Suspect',win:'Respecter les faits établis.'}),
  currentScenario:()=>({id:'014'}),console};
 vm.createContext(sandbox);
 return vm.runInContext(extracted,sandbox,{timeout:1000});
}
const enriched=draw({v769_story:'La veille tu as refusé une demande précise.',
 v769_questions:['Quelle pièce manque à ton registre ?','Peux-tu préciser ton horaire <privé> ?']});
assert(enriched.includes('La veille tu as refusé une demande précise.'));
assert(enriched.includes('QUELLES')===false);
assert(enriched.includes('POUR ÉCHANGER'));
assert(enriched.includes('Des questions possibles, pas des faits établis.'));
assert(enriched.includes('Quelle pièce manque à ton registre ?'));
assert(enriched.includes('&lt;privé&gt;')&&!enriched.includes('<privé>'));
assert(!enriched.includes('NE-JAMAIS-MONTRER-LE-SECRET-D-AUTRUI'));
assert(enriched.indexOf('TON CONTEXTE PERSONNEL')<enriched.indexOf('POUR ÉCHANGER'));
assert(enriched.includes('Alice')&&enriched.includes('Partenaire'));

const original=draw();
assert(!original.includes('TON CONTEXTE PERSONNEL')&&!original.includes('POUR ÉCHANGER'),
 'Do not create placeholder sections when the pin cannot be proven');
const full=draw({story:'Le texte originel de cette fiche est déjà assez détaillé.',
 v769_story:'À NE PAS DUPLIQUER',v769_questions:[]});
assert(!full.includes('À NE PAS DUPLIQUER'),'Never duplicate an already visible story');
console.log('PASS v769: authenticated authored supplements are useful, escaped, optional, and private; no other secret, variant mismatch or duplicate content.');
