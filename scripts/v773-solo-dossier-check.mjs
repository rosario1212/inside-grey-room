/* v773: one-person investigator consent without weakening two-person release. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const source=readFileSync(path.join(root,'common-dossier-v106.js'),'utf8');
const sql=readFileSync(path.join(root,'supabase/migrations/20261117214402_igr_v773_solo_investigator_dossier_approval.sql'),'utf8');
const dist=path.resolve(process.argv[2]||path.join(root,'dist'));
const built=readFileSync(path.join(dist,'common-dossier-v106.js'),'utf8');
const html=readFileSync(path.join(dist,'index.html'),'utf8');
new Function(source); new Function(built);
assert.match(html,/common-dossier-v106\.js\?v=v771-common-dossier-public-progress-20261117-soloquorum-v773/);
for(const term of ['required_votes','v_votes<v_required_votes','voter.public_role=any(source_event.audience_roles)','v_publications>=2',"'public_evidence','public'"]){
  assert(sql.includes(term),'Missing database guard: '+term);
}
assert.match(source,/publishing&&typeof window\.confirm/,'Every final release must be confirmed');
assert.match(source,/if\(c\.mine&&Number\(c\.votes\)<required\)return/,'Cannot vote twice before quorum');
assert.match(source,/voted&&votes<required\?'disabled'/,'Pending votes must not be resubmitted');
const start=source.indexOf('function disclosureRows(){');
const end=source.indexOf('\nfunction disclosurePanel(){',start);
assert(start>=0&&end>start,'Disclosure UI renderer missing');
// Run the actual evidence helpers in isolation: no fake shortener in the test.
const helperStart=source.indexOf('const case004Copy=');
const helperEnd=source.indexOf('\nlet cache=',helperStart);
assert(helperStart>=0&&helperEnd>helperStart,'Evidence helpers missing');
const helpers=new Function('game','esc','tr',source.slice(helperStart,helperEnd)+'; return {conciseCaseText,readableTitle,expandableCopy,preciseCaseCopy,editorialTitle};')(
 ()=>({room:{scenario_id:'004'}}),(v)=>String(v).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])),(fr)=>fr);
const getRows=new Function('disclosure','esc','tr','conciseCaseText','readableTitle','expandableCopy','preciseCaseCopy','editorialTitle',source.slice(start,end)+'; return disclosureRows;');
const render=(candidate)=>getRows({error:false,data:{candidates:[{id:51,title:'Test',text:'Evidence to verify',published:false,...candidate}]}},String,(fr)=>fr,helpers.conciseCaseText,helpers.readableTitle,helpers.expandableCopy,helpers.preciseCaseCopy,helpers.editorialTitle)();
const longEvidence='Deux messages adressés à des destinataires différents arrivent après la rupture du premier suspect. Le contenu exact de leur conversation n’est pas encore connu.';
const shortened=render({title:'DEUX ALERTES DISTINCTES',text:longEvidence,required_votes:2,votes:0,mine:false});
assert.match(shortened,/Deux alertes distinctes/,'Uppercase titles should be readable');
assert.match(shortened,/Après la fin de la dispute entre Sofia et son ex-partenaire/,'Scenario 004 must name the real relationship');
assert.match(shortened,/Voir le texte complet/,'Full text remains accessible');
assert(!shortened.includes('rupture du premier suspect'),'No vague numerical identity in displayed copy');
const solo=render({required_votes:1,votes:0,mine:false});
assert.match(solo,/0\/1/); assert.match(solo,/Publier pour tous/); assert.doesNotMatch(solo,/disabled/);
const duo=render({required_votes:2,votes:0,mine:false});
assert.match(duo,/0\/2/); assert.match(duo,/Proposer la publication/);
const waiting=render({required_votes:2,votes:1,mine:true});
assert.match(waiting,/1\/2/); assert.match(waiting,/Accord enregistré/); assert.match(waiting,/disabled/);
const oldSolo=render({required_votes:1,votes:1,mine:true});
assert.match(oldSolo,/1\/1/); assert.match(oldSolo,/Finaliser la publication/); assert.doesNotMatch(oldSolo,/disabled/);
const second=render({required_votes:2,votes:1,mine:false});
assert.match(second,/Approuver la publication/); assert.doesNotMatch(second,/disabled/);
console.log('PASS v773: solo 1/1, collective 2/2, legacy vote recovery, permission and publication guards');
