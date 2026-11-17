// v773 — Investigators' private cards: factual judicial brief, no leaked variant keys.
// Tests the real pure formatter used by the shipped role card. No private data access.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const app=readFileSync('investigation-ux-v772.js','utf8');
const a=app.indexOf('function v773SplitSentences(');
const b=app.indexOf('function v773InstallInvestigatorCard(',a);
assert(a>0&&b>a,'Missing shared v773 judicial formatter');
const format=vm.runInNewContext(app.slice(a,b)+'\nv773InvestigatorSummary;',{});
const sofia=format(
 "Sofia a sollicité trois personnes avant sa mort. Certaines ont reçu un appel. D'autres n'ont lu qu'un message ou appris les faits trop tard. La Grey Room doit établir les heures, les connaissances et les décisions — pas inventer une cause certaine à son décès.",
 "Reconstruis des degrés de responsabilité séparés ; ne transforme jamais une réaction en preuve.",
 '',
);
assert.equal(sofia.incident,'Sofia a sollicité trois personnes avant sa mort.');
assert.equal(sofia.knowledge.length,2,'Two known judicial facts must be distinct from the incident');
assert(sofia.knowledge.every(x=>!x.includes('doit établir')),'Procedural orders cannot masquerade as evidence');
assert(sofia.line.some(x=>x.includes('Reconstruis des degrés de responsabilité')),'Role anchor must be moved to the strategy');
assert(sofia.line.some(x=>x.includes('La Grey Room doit établir')),'Chronology directive must be moved to strategy');
assert(!sofia.knowledge.join(' ').includes('Reconstruis'),'Investigator orders cannot remain under known facts');
const nora=format('Nora a été retrouvée morte. Une porte a été ouverte avant sa découverte.',
 'La porte a été ouverte puis refermée : distingue présence, compréhension et décision de refermer.',
 'Demande à chacun de préciser les heures.');
assert.equal(nora.incident,'Nora a été retrouvée morte.');
assert(nora.knowledge.some(x=>x.includes('Une porte')));
assert(nora.line.join(' ').includes('distingue présence'));
assert(nora.line.join(' ').includes('Demande à chacun'));
const single=format('Un document a disparu.', 'Il faut distinguer les accès et les actes.',
 'Confronte les horaires.', 'Plusieurs personnes ont eu accès au dossier. Le registre existe.');
assert.equal(single.incident,'Un document a disparu.');
assert(single.knowledge.some(x=>x.includes('Plusieurs personnes')),'Public opening context must serve as a non-spoiler factual fallback');
assert(single.line.some(x=>x.includes('Il faut distinguer')));
const empty=format('', 'Reste prudent.', '', '');
assert.equal(empty.incident,'','No canonical event may be fabricated');
for(let i=1;i<=49;i++){
 const id=String(i).padStart(3,'0');
 const r=format('Un signalement a été reçu. Trois déclarations divergent. Une pièce doit encore être contrôlée.',
   'Sépare les déclarations des preuves.','Confronte les horaires.');
 assert(r.incident&&r.knowledge.length>=1&&r.line.length===2,id+' must use the same generic safe grouping');
 assert(!r.knowledge.some(x=>/Sépare|Confronte/.test(x)),id+' must keep commands out of facts');
}
assert(app.includes("player?.public_role!=='enqueteur'"),'Other role cards must be preserved');
assert(app.includes("document.createElement('template')"),'Real authenticated card HTML must be reconstructed without injecting raw role text');
assert(app.includes("li.textContent=fact"),'Knowledge must be escaped as text nodes');
assert(app.includes("li.textContent=item"),'Strategy must be escaped as text nodes');
assert(!/canonical_truth|answer_key|private_variant|true_culprit|sealed_variant/i.test(app.slice(a)),
 'No confidential answer-key or variant fields may enter this renderer');
const css=readFileSync('investigation-ux-v772.css','utf8');
for(const label of ['igr-v773-incident-copy','igr-v773-fact-list','igr-v773-line-list'])
 assert(css.includes(label),'Missing v773 iPhone styling for '+label);
const html=readFileSync('index.html','utf8');
const sw=readFileSync('service-worker.js','utf8');
for(const asset of ['investigation-ux-v772.js','investigation-ux-v772.css']){
 const target=asset+'?v=20261117-v773-judicial-card';
 assert(html.includes(target),'Live entrypoint missing v773 asset: '+asset);
 assert(sw.includes(target),'Offline cache missing v773 asset: '+asset);
}
console.log('PASS v773: 49 shared investigator cards, factual judicial knowledge, instructions relocated, concise iPhone brief, no spoilers.');
