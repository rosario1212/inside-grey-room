/* Casino visual-contract smoke test: no private manuscript or server rule changes. */
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const read=path=>readFileSync(path,'utf8');
const client=read('casino-client-v105.js');
const visual=read('casino-immersive-v1.js');
const css=read('casino-immersive-v1.css');
const finalizer=read('scripts/apply-casino-heritage-v91.mjs');
const runtime=read('casino/runtime.mjs');
const scope=read('casino/campaign-core.mjs');
for(const file of ['casino-client-v105.js','casino-immersive-v1.js']){
 execFileSync(process.execPath,['--check',file],{stdio:'pipe'});
}
for(const marker of [
 'IGR_CASINO_IMMERSIVE?.decorate?.(screen,state,tab)',
 'IGR_CASINO_IMMERSIVE?.clock?.()',
 'unknown_campaign_command:'
])assert(client.includes(marker),'Client must activate compatibility UI: '+marker);
for(const marker of [
 'state.characters','c.id===state.viewer','Number.isSafeInteger',
 'state.poker','hand.pot','hand.ante','hand.highestBet',
 'state.ownSlotResult','state.minimumSocialUntil',
 'state.phaseReadiness','data-casino-phase-clock',
 'Pacte de non-agression','Reconnaissance de dette',
 'window.IGR_CASINO_IMMERSIVE'
])assert(visual.includes(marker),'Missing visual contract: '+marker);
assert(!visual.includes('fetch(')&&!visual.includes('localStorage')&&!visual.includes('crypto.randomUUID'),
 'Visual layer may never send game commands, mutate user storage or decide random results');
assert(!/SUPABASE_SERVICE_ROLE_KEY|sb_secret_|answer_key|privateCanon/.test(visual),
 'No private server data should be available to visual layer');
assert(runtime.includes("case 'PHASE_POSITION'")&&runtime.includes('phaseReadiness:')&&
 runtime.includes('minimumSocialUntil:'),'Server must own phase readiness and minimum time');
assert(scope.includes('case \'SETTLE_POKER\''),'Opening poker scoring remains server only');
assert(css.includes('.casino-wallet')&&css.includes('.casino-felt')&&
 css.includes('.casino-phase-clock')&&css.includes('prefers-reduced-motion'),'Essential responsive visuals absent');
for(const item of ['casino-immersive-v1.js','casino-immersive-v1.css']){
 assert(finalizer.includes("'"+item+"'"),'Missing built asset '+item);
}
assert(finalizer.includes('IMMERSIVE_VERSION')&&finalizer.includes('casinoFingerprint'),
 'Casino assets must be versioned and invalidated in the PWA');
const target=process.argv[2];
if(target){
 for(const file of ['casino-immersive-v1.js','casino-immersive-v1.css']){
   assert(existsSync(target+'/'+file),'Built immersive asset missing '+file);
   const html=read(target+'/index.html');
   assert(html.includes(file+'?v=v1-mafia-20261127'),'Entry point must version '+file);
   const sw=read(target+'/service-worker.js');
   assert(sw.includes('/'+file+'?v=v1-mafia-20261127'),'Offline PWA must precache '+file);
 }
}
console.log('PASS Casino immersive: chips, phase clock, felt/poker/slots, safe DOM, cache and authoritative rules.');