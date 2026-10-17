import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import vm from 'node:vm';

const root=process.cwd();
const source=await readFile(root+'/narrative-dossier-v87.js','utf8');
const sql=await readFile(root+'/supabase/migrations/20261017213000_narrative_v87.sql','utf8');
const res=spawnSync(process.execPath,['--check',root+'/narrative-dossier-v87.js'],{encoding:'utf8'});
assert.equal(res.status,0,'Narrative runtime must be valid JavaScript: '+res.stderr);
assert(sql.includes('enable row level security'),'Notes need RLS');
assert(sql.includes("public_role<>'enqueteur'"),'Notes RPCs must be investigator-only');
assert(sql.includes("p.public_role='suspect'"),'Notes must reject suspects from other rooms');
assert(sql.includes("raw.axes ? v_focus_axis"),'Director must consider the chosen QCM axis');
assert(sql.includes("v_trend='confusion_up'"),'Director must consider changes over consecutive cycles');
assert(sql.includes("director_version','v87-canonical-signal'"),'Director must advertise its actual version');
assert(!source.includes('scenario.truth'),'Client dossier must never inspect canonical truth');
assert(!source.includes('private_state'),'Client dossier must not read suspect private cards');

const sample={
 room:{code:'ABCDE',status:'playing',cycle:1,phase:'interrogation'},
 player:{id:'enq',pseudo:'Investigator',public_role:'enqueteur'},
 suspects:[{id:'sus1',pseudo:'Suspect A'},{id:'sus2',pseudo:'Suspect B'}],
 scenario:{context:'Shared public case description'},
 events:[{event_type:'trame',target_player_id:'sus1',payload:{title:'AUTHORIZED CLUE',text:'Officially released clue'}}],
 my_actions:[]
};
const state={room:'ABCDE',token:'demo-token',tab:'investigation',sync:sample};
const context={STATE:state,window:{IGR_LOCALE:'fr'},console,
 renderInvestigationTab:()=>'<p>Existing phase controls stay</p>',
 renderGame:()=>{},renderDebriefForm:()=>'<div><select id="qConvergence"></select><select id="qConfusion"></select><button onclick="submitDebrief()">Envoyer</button></div>',
 submitDebrief:()=>{},queueMicrotask:()=>{},document:{querySelectorAll:()=>[],getElementById:()=>null},
 rpc:()=>Promise.resolve({notes:[]}),syncNow:()=>Promise.resolve(),toast:()=>{}};
vm.runInNewContext(source,context);
const investigatorHtml=context.renderInvestigationTab();
assert(investigatorHtml.includes('Suspect A')&&investigatorHtml.includes('Suspect B'),'One dossier per assigned suspect');
assert(investigatorHtml.includes('AUTHORIZED CLUE'),'Authorized evidence should enrich a dossier');
assert(investigatorHtml.includes('Shared public case description'),'Initial dossier uses public case context');
assert(investigatorHtml.includes('Existing phase controls stay'),'Existing gameplay remains');
assert(investigatorHtml.includes('Consigner une information'),'Investigator can take notes in Enquête');
assert(investigatorHtml.indexOf('Existing phase controls stay')>investigatorHtml.indexOf('Personnes et découvertes'),'Dossier is placed inside Enquête');
assert(context.renderDebriefForm().includes('id="qAxis"'),'Final debrief asks for an investigation axis');
state.sync.player.public_role='suspect';
const suspectHtml=context.renderInvestigationTab();
assert(!suspectHtml.includes('igr87-dossier'),'Suspects must not receive investigator dossier');
assert(suspectHtml.includes('Existing phase controls stay'),'Suspects keep their existing investigation phase');
console.log('v87: role separation, canonical-source-only dossier, human notes and three-question director contract OK');
