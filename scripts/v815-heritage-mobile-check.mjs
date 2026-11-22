// Heritage v815 — structural checks for the recording-based mobile polish.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Script} from 'node:vm';

const read=path=>readFileSync(path,'utf8');
const index=read('index.html');
const sw=read('service-worker.js');
const web=read('scripts/build-web.mjs');
const mobile=read('scripts/build-mobile.mjs');
const css=read('heritage-mobile-polish-v815.css');
const journey=read('heritage-journey-v755.js');
const finalizer=read('scripts/finalize-cartel030-release.mjs');
const name='heritage-mobile-polish-v815.css';
const url=name+'?v=20261121-v815-1';

assert.equal(index.split(url).length-1,1,'Heritage visual layer must load once');
assert(sw.includes('/'+url),'Heritage visual layer must be cached for PWA');
assert(sw.includes("const CACHE='igr-v827-game-tabs-and-investigator-controls-20261122'"),
 'Heritage PWA source cache must be refreshed');
assert(finalizer.includes("const pwaVersion='v827-game-tabs-and-investigator-controls-20261122'"),
 'Production release finalizer must preserve the Heritage cache');
for(const [label,source] of [['web',web],['mobile',mobile]])
 assert(source.includes("'"+name+"'"),label+' builder missing Heritage CSS');
for(const marker of [
 'hplay-campaign-card:is(.hplay-theme-cendres,.hplay-theme-kuroi)>img',
 'z-index:0!important',
 '.hj-progress .hj-step-link',
 '.casino-live .casino-role-choice-card',
 '.hj-activity-note',
 'prefers-reduced-motion:reduce'
])assert(css.includes(marker),'Missing scoped Heritage style: '+marker);
assert(css.includes('.hplay-hub')&&css.includes('.casino-live')&&css.includes('.hnet'),
 'Heritage CSS should cover campaign and lobby screen variants');
assert(!css.includes('display:none!important'),'Do not conceal gameplay or navigation with polish CSS');
new Script(journey,{filename:'heritage-journey-v755.js'});
assert(journey.includes('★ Étoiles : activité estimée du rôle, pas sa puissance.'),
 'Non-Casino lobby star legend absent');
assert(journey.includes('Choisis une place libre. ★ Étoiles : activité estimée du rôle, pas sa puissance.'),
 'Casino lobby star legend absent');
assert(journey.includes("if(grid&&!$('.hj-activity-note',lobby))"),
 'Star legend must not duplicate after lobby synchronization');
console.log('PASS v815: Heritage mobile visuals, role-activity explanations, and web/mobile/PWA wiring.');
