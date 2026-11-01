import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const app=readFileSync('app-v11.js','utf8');
const index=readFileSync('index.html','utf8');
const sw=readFileSync('service-worker.js','utf8');
const standard=readFileSync('docs/standard-fiches-personnages.md','utf8');
const cache='v647-006-fiches-220';
assert(app.includes("const conciseDossier=['001','002','003','004','005','006'].includes("),
  'Scenario 005 must use the same short-card layout as 001–004');
assert(app.includes("valueBlock('CE QUE TU SAIS',ps.anchors)"),'Known facts must remain visible');
assert(!app.includes("valueBlock('CE QUE TU IGNORES'"),'Unknown facts must stay internal');
const section=app.slice(app.indexOf('function igr82RelationsHtml(value)'),app.indexOf('\nfunction valueBlock'));
assert(section.includes('igr82RelationKnownOnly(entry?.text)'),'Relations must be facts-only');
assert(!section.includes('igr82-relation-question'),'No guided questions in relations');
assert(/120 à 160 mots/.test(standard),'Standard must remain 120–160 words');
assert(standard.includes('Ignorances réservées à l\'édition'),'Unknowns must remain private');
assert(index.includes('app-v11.js?v='+cache),'HTML asset version mismatch');
assert(sw.includes("const CACHE='igr-"+cache+"'"),'Service Worker version mismatch');
assert(sw.includes('/app-v11.js?v='+cache),'SW pre-cache version mismatch');
console.log('v645: scenario 005 short cards, safe knowledge and cache all verified');

assert(app.includes('Porté lors des coups, puis posé près du corps'),'A mask label');
assert(app.includes('Porté pendant le meurtre, puis abandonné sur place'),'B mask label');
assert(app.includes('Laissé avant les coups, puis déplacé ensuite'),'C mask label');

assert(app.includes("const conciseDossier=['001','002','003','004','005','006'].includes("),'Scenario 006 must also use the concise three-event private card');
