import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
const root=process.cwd();const fail=[];const ok=[];
function check(c,msg){(c?ok:fail).push(msg)}
function text(f){return fs.readFileSync(path.join(root,f),'utf8')}
const migration='supabase/migrations/20261003_directed_cycles_v34.sql';
const required=['scenario-flow-v13.js','gameplay-flow-v13.js','gameplay-flow-v13.css','dlc-experience-v13.js','dlc-experience-v13.css','scenario-replay-contracts-v13.json','lobby-ui-fix-v13.js','lobby-ui-fix-v13.css','gameplay-clarity-v32.js',migration,'supabase/migrations/20261003_directed_cycles_v34_security.sql'];
for(const f of required)check(fs.existsSync(path.join(root,f)),`présent: ${f}`);
for(const f of ['scenario-flow-v13.js','gameplay-flow-v13.js','dlc-experience-v13.js','lobby-ui-fix-v13.js','gameplay-clarity-v32.js','scripts/install-v13-flow.mjs','scripts/verify-v13-flow.mjs']){if(fs.existsSync(path.join(root,f))){const r=spawnSync(process.execPath,['--check',path.join(root,f)],{encoding:'utf8'});check(r.status===0,`syntaxe JS: ${f}`);if(r.status!==0)console.error(r.stderr)}}
if(fs.existsSync(path.join(root,'scenario-flow-v13.js'))){
 const s=text('scenario-flow-v13.js');
 check(s.includes("Array.from({length:34}"),'directeur gameplay couvre 001–034');
 check(s.includes("1:{interrogations:3,events:0}"),'Cycle 1 = 3 interrogatoires');
 check(s.includes("2:{actions:3,interrogationsMax:2}"),'Cycle 2 = 3 actions / max 2 interrogatoires');
 check(s.includes("3:{actions:3,interrogationsMax:1}"),'Cycle 3 = 3 actions / max 1 interrogatoire');
 for(const [key,value] of [['interrogation','360'],['cycleDebrief','120'],['finalDebrief','120'],['finalDefense','180'],['confrontation','240'],['assembly','240']])check(s.includes(`${key}:${value}`),`${key} = ${value}s`);
 check(s.includes('résoudre la partie de mémoire'),'principe anti-mémoire présent');
}
if(fs.existsSync(path.join(root,'gameplay-flow-v13.js'))){const s=text('gameplay-flow-v13.js');check(!s.includes('onclick="endInterrogation()"'),'pas de bouton d’arrêt anticipé dans la couche v13');check(s.includes('Vous vous rapprochez d’une conclusion ?'),'question MJ convergence');check(s.includes('Le dossier reste difficile à relier ?'),'question MJ difficulté');check(s.includes('SALLE D’ATTENTE'),'pré-enquête sociale');}
if(fs.existsSync(path.join(root,'gameplay-clarity-v32.js'))){const s=text('gameplay-clarity-v32.js');check(s.includes('À LA PAROLE · DERNIÈRE DÉFENSE'),'défenseur affiché globalement');check(s.includes('03:00'),'défense UI 3:00');check(s.includes('CONFRONTATION · 04:00'),'confrontation UI 4:00');check(s.includes('ASSEMBLÉE · 04:00'),'assemblée UI 4:00');}
if(fs.existsSync(path.join(root,'scenario-replay-contracts-v13.json'))){const j=JSON.parse(text('scenario-replay-contracts-v13.json'));check(Object.keys(j.scenarios||{}).length===34,'34 scénarios couverts par les contrats replay');check(Object.values(j.scenarios||{}).every(x=>(x.variants||[]).length>=3),'minimum 3 variantes contractuelles par scénario');check(j.selection?.never_exposed_to_clients===true,'variant id non exposé au client');}
if(fs.existsSync(path.join(root,'dlc-experience-v13.js'))){const s=text('dlc-experience-v13.js');for(const id of ['021','025','026','028','029','031','032','034'])check(s.includes(`'${id}'`),`mécanique DLC ${id}`);check(s.includes('districts_controlled'),'TERREUR compteur de quartiers');check(s.includes('rotatingCodenames:true'),'RÉGIME surnoms rotatifs');}
if(fs.existsSync(path.join(root,migration))){
 const s=text(migration);
 for(const fn of ['igr_v13_start_event','igr_v13_enter_event_select','igr_v13_complete_event','igr_v4_start_cycle','igr_v4_start_interrogation','igr_v4_tick','igr_v4_submit_debrief','igr_v4_set_provisional'])check(s.includes(`function public.${fn}`),`migration contient ${fn}`);
 check(s.includes("between '001' and '034'"),'backend couvre 001–034');
 check(s.includes("interval '6 minutes'"),'interrogation serveur 6:00');
 check(s.includes("interval '2 minutes'"),'débrief serveur 2:00');
 check(s.includes("interval '3 minutes'"),'défense serveur 3:00');
 check(s.includes("interval '4 minutes'"),'confrontation/assemblée serveur 4:00');
 check(s.includes("phase='event_select'"),'sélection d’actions serveur active');
 check(s.includes("raise exception 'choice required'"),'impossible de sauter un choix obligatoire');
}
console.log(ok.map(x=>'✓ '+x).join('\n'));if(fail.length){console.error(fail.map(x=>'✗ '+x).join('\n'));process.exit(1)}console.log(`\n${ok.length} contrôles statiques réussis.`);
