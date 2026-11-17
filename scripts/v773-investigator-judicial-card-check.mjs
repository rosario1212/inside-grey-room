// v773 — Cross-scenario judicial brief contract, no live room or variant truth.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const src=readFileSync('judicial-card-v773.js','utf8');
const page=readFileSync('index.html','utf8');
const sw=readFileSync('service-worker.js','utf8');
const css=readFileSync('judicial-card-v773.css','utf8');
const web=readFileSync('scripts/build-web.mjs','utf8');
const mobile=readFileSync('scripts/build-mobile.mjs','utf8');
assert(page.includes('judicial-card-v773.js?v=v776-20261117'));
assert(page.includes('judicial-card-v773.css?v=v776-20261117'));
assert(page.indexOf('judicial-card-v773.js')>page.indexOf('investigation-ux-v772.js'),
  'Judicial classification must run after all legacy role-card overrides');
for(const source of [web,mobile,sw])for(const file of ['judicial-card-v773.js','judicial-card-v773.css'])
  assert(source.includes(file),'Release runtime or PWA misses '+file);
assert(css.includes('.igr773-lines'),'Readable mobile list styling missing');
assert(css.includes('.igr773-situation-copy'),'Opening prose mobile style missing');
assert(src.includes("if(kind==='situation')")&&src.includes("paragraph.textContent=values.join(' ');"),'Opening must render as one paragraph, not a list');
assert(!/answer_key|canonical_truth|private_variant|culprit|secret_mission/i.test(src),
  'Shared judicial layer must not read secret solutions or other roles');
let rendererCalls=0;
const state={sync:{player:{public_role:'enqueteur',private_state:{}}}};
const original=()=>{rendererCalls++;return '<div class="private-card-v11">ORIGINAL</div>'};
const sandbox={window:{privateCardHtml:original,STATE:state},STATE:state,console};
vm.createContext(sandbox);vm.runInContext(src,sandbox,{timeout:1500});
const classify=sandbox.window.IGRV773CardParts;
assert.equal(typeof classify,'function');
const sample={
 chronology:"Sofia a sollicité trois personnes avant sa mort. Certaines ont reçu un appel. D'autres n'ont lu qu'un message ou appris les faits trop tard. La Grey Room doit établir les heures, les connaissances et les décisions.",
 anchors:'Reconstituis des degrés de responsabilité séparés ; ne transforme jamais une réaction en preuve.',
 position:'Compare les horaires et les versions.'
};
for(let n=1;n<=49;n++){
  const id=String(n).padStart(3,'0');
  state.sync.room={scenario_id:id};
  const b=classify(sample);
  assert.equal(b.situation.length,1,id+' needs a single clear factual opening');
  assert.equal(b.judicial.length,2,id+' needs two distinct judicial facts');
  assert(b.judicial.some(x=>x.includes("D'autres n'ont lu")),id+' must distinguish access to information');
  assert.equal(b.line.length,3,id+' must move duties out of factual knowledge');
  assert(b.line.some(x=>x.includes('Reconstituis des degrés')),id+' must move original role guidance');
  assert(!b.situation.join(' ').includes('La Grey Room doit'),id+' must not treat instructions as factual narrative');
  assert(!b.judicial.join(' ').includes('Reconstituis'),id+' must not treat instructions as known evidence');
}
const compound=classify({chronology:'Nora est retrouvée morte. La porte a été ouverte avant les secours.',
 anchors:'La porte a été ouverte puis refermée : distingue présence, compréhension et décision de refermer.'});
assert(compound.judicial.some(x=>x.includes('La porte a été ouverte puis refermée')),
 'The established part of a colon sentence must remain in judicial knowledge');
assert(compound.line.some(x=>x.includes('Distingue présence')),
 'The directive after a colon must move to the Investigator line');
const withoutChronology=classify({chronology:'',anchors:'Vérifie les accès.'},
 'Une disparition est signalée. Plusieurs témoignages divergent.');
assert.equal(withoutChronology.situation.length,1,'The public opening must cover dossiers with no private chronology');
assert(withoutChronology.judicial.some(x=>x.includes('Plusieurs témoignages')),
 'The summary must use only another public starting fact, not invent one');
const factual=classify({chronology:'Un homme est retrouvé mort.',anchors:'Le registre mentionne deux accès distincts.'});
assert.equal(factual.judicial[0],'Le registre mentionne deux accès distincts.');
const sparse=classify({chronology:'Une personne est portée disparue.',anchors:'Établis les faits.'});
assert(sparse.judicial[0].includes('Aucun autre fait distinct'),'Never fabricate a legal summary without source facts');
state.sync.player.public_role='suspect';
const unchanged=sandbox.window.privateCardHtml();
assert.equal(unchanged,'<div class="private-card-v11">ORIGINAL</div>',
  'Suspect/manuscript cards must remain untouched');
assert.equal(rendererCalls,1);
console.log('PASS v773: 49 scenario identifiers, investigator/analyst fact-vs-directive split, no canon leak, suspects unchanged, web/mobile/PWA bundled.');
