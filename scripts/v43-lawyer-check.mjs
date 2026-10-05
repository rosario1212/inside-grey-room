import { readFile, stat } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const root=process.cwd();
const target=path.resolve(root,process.argv[2]||'dist');
const runtime=path.join(target,'lawyer-runtime-v43.js');
const reading=path.join(target,'lawyer-reading-v43-1.js');
const judicial=path.join(target,'judicial-runtime-v44.js');
const app=path.join(target,'app-v11.js');
const migration=path.join(root,'supabase/migrations/20261005_lawyer_role_v43.sql');
const audit44=path.join(root,'JUDGE_LAWYER_AUDIT_V44.md');
const exists=async f=>{try{await stat(f);return true}catch{return false}};
for(const f of [runtime,reading,judicial,app,migration,audit44])if(!(await exists(f)))throw new Error(`lawyer/judge check missing ${f}`);
for(const f of [runtime,reading,judicial]){
  const syntax=spawnSync(process.execPath,['--check',f],{encoding:'utf8'});
  if(syntax.status!==0)throw new Error(`${path.basename(f)} syntax error: ${syntax.stderr||syntax.stdout}`);
}
const js=await readFile(runtime,'utf8');
const readingJs=await readFile(reading,'utf8');
const judicialJs=await readFile(judicial,'utf8');
const sourceApp=await readFile(app,'utf8');
const sql=await readFile(migration,'utf8');
const audit=await readFile(audit44,'utf8');

for(const marker of ['igr_v43_lawyer_state','igr_v43_request_lawyer','igr_v43_refuse_lawyer','igr_v43_accept_lawyer','can_request_again','one_pending','security definer','set search_path to \'public\''])if(!sql.includes(marker))throw new Error(`v43 migration marker missing: ${marker}`);
for(const marker of ['Rencontrer · 1 min','Demander à nouveau l’avocat','unique client officiel','CONSULTATIONS OFFICIEUSES','may never invent information','AVANT LES CONCLUSIONS PROVISOIRES','window.confirm'])if(!js.includes(marker))throw new Error(`v43 runtime marker missing: ${marker}`);
for(const marker of ['v43.1-lawyer-reading','PENDANT LA LECTURE DES CARTES','renderLawyerTab','igr43RoleHelper','enforceMeetingFirst','a rencontrer','aria-disabled','Entretien préalable requis'])if(!readingJs.includes(marker))throw new Error(`v43.1 role-reading marker missing: ${marker}`);
for(const marker of ['v44-judge-lawyer','CABINET DU JUGE','3 protections','Convoquer · 2 min','CONSULTATION DEMANDÉE','DÉLIBÉRATION OBLIGATOIRE','ÉVALUATION SECRÈTE','igr_v44_request_lawyer_consultation','igr_v44_integrity_vote'])if(!judicialJs.includes(marker))throw new Error(`v44 runtime marker missing: ${marker}`);
for(const marker of ['v44_role_integration_tests_ok','v44_reveal_tests_ok','v44_endgame_flow_tests_ok','Maximum **3 protections','une seule** consultation','courte : **3:00**','longue : **4:00**'])if(!audit.includes(marker))throw new Error(`v44 audit marker missing: ${marker}`);
if(/5 points de confidentialité|jauge de 5 points/.test(judicialJs))throw new Error('v44 runtime reintroduced the old five-point Judge model');
if(/SALLE D[’']ATTENTE|Consultations officieuses/.test(judicialJs))throw new Error('v44 runtime reintroduced free waiting-room consultations');

if(!sourceApp.includes('unique client officiel'))throw new Error('built app does not contain the one-client lawyer rule');
if(sourceApp.includes('Avocat : peut défendre plusieurs clients compatibles'))throw new Error('legacy multi-client manual copy survived');
for(const page of ['index.html','en.html']){
  const file=path.join(target,page);if(!(await exists(file)))continue;
  const html=await readFile(file,'utf8');
  const count43=(html.match(/lawyer-runtime-v43\.js/g)||[]).length;
  const count431=(html.match(/lawyer-reading-v43-1\.js/g)||[]).length;
  const count44=(html.match(/judicial-runtime-v44\.js/g)||[]).length;
  if(count43!==1||count431!==1||count44!==1)throw new Error(`${page}: expected one v43, one v43.1 and one v44 runtime`);
  const v42=html.lastIndexOf('investigation-audit-v42-1.js');
  const v43=html.lastIndexOf('lawyer-runtime-v43.js');
  const v431=html.lastIndexOf('lawyer-reading-v43-1.js');
  const v44=html.lastIndexOf('judicial-runtime-v44.js');
  if(!(v42<v43&&v43<v431&&v431<v44))throw new Error(`${page}: expected v42 < v43 < v43.1 < v44 runtime order`);
}
console.log('Inside Grey Room v44 lawyer + judge checks: OK');
