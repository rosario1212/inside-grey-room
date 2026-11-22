/* v835 synthetic regressions: phase names, public role boundaries,
   clean idle state, player overview and exported UI hooks. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
const read=p=>fs.readFileSync(p,'utf8');
const code=read('live-player-focus-v835.js'),css=read('live-player-focus-v835.css');
const target=path.resolve(process.argv[2]||'dist');
const html=read(path.join(target,'index.html')),sw=read(path.join(target,'service-worker.js'));
assert(html.includes('live-player-focus-v835.js?v=v835-player-focus-20261122'));
assert(html.includes('live-player-focus-v835.css?v=v835-player-focus-20261122'));
assert(sw.includes('/live-player-focus-v835.js?v=v835-player-focus-20261122'));
assert(sw.includes('/live-player-focus-v835.css?v=v835-player-focus-20261122'));
assert(html.indexOf('cycle-workspace-v834.js')<html.indexOf('live-player-focus-v835.js'));
assert(css.includes('.igr835-spotlight')&&css.includes('.igr835-party-overview'));
assert(!code.includes('private_state')&&!code.includes('secret_role'),'Never read private roles into public player roster');
const STATE={
 room:'PEQPQ',playerId:'host',role:'enqueteur',tab:'rules',
 sync:{
  room:{code:'PEQPQ',scenario_id:'004',cycle:1,phase:'interrogation',
   state:{current_target:'sus1',heard:['sus2'],interrogation_limit:2,interrogation_count:1}},
  player:{id:'host',public_role:'enqueteur'},
  players:[
   {id:'host',pseudo:'Ali',public_role:'enqueteur',is_host:true},
   {id:'sus1',pseudo:'asa',public_role:'suspect'},
   {id:'sus2',pseudo:'asap',public_role:'suspect'},
   {id:'ana',pseudo:'as',public_role:'analyste'}
  ],
  scenario:{title:'Les Trois Absents'}
 }
};
const window={IGR_LOCALE:'fr',addEventListener(){}};
const document={readyState:'loading',addEventListener(){}};
const context={STATE,window,document,console,gameTabs:()=>[{id:'card',label:'Ma fiche'},{id:'rules',label:'Partie'}],renderGameTab:()=>'<div class="party-tab-clean">Historique</div>'};
vm.runInNewContext(code,context);
const api=window.IGR_LIVE_FOCUS_V835;
assert(api,'v835 hook missing');
assert.equal(api.action().type,'interrogation');
assert.deepEqual(Array.from(api.action().names),['asa']);
assert(api.overview().includes('Interrogé maintenant'));
assert(api.overview().includes('Déjà entendu ce cycle'));
assert(api.overview().includes('Les Trois Absents'));
assert(api.overview().includes('Joueurs dans la partie'));
assert(!api.overview().includes('secret_role'));
assert.equal(window.gameTabs().find(x=>x.id==='rules').label,'Joueurs & partie');
STATE.sync.room.phase='event_confrontation';
STATE.sync.room.state.event_targets=['sus1','sus2'];
assert.equal(api.action().type,'confrontation');
assert.deepEqual(Array.from(api.action().names),['asa','asap']);
assert(api.overview().includes('Convoqué maintenant'));
STATE.sync.room.phase='interrogation_select';
assert.equal(api.action(),null,'No stale current_target outside the live interrogation phase');
STATE.sync.room.phase='interrogation';
STATE.sync.player.id='sus1';STATE.sync.player.public_role='suspect';
assert(api.action().title.includes('CONVOQUÉ'),'A summoned suspect sees an explicit personal instruction');
STATE.sync.players[1].pseudo='<img src=x onerror=alert(1)>';
assert(!api.overview().includes('<img'),'Player-controlled names must be escaped in the UI');
console.log('PASS v835: role-safe current interview/confrontation, phase context, roster, HTML escaping, public/private isolation.');
