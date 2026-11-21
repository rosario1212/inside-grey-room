import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const read=p=>readFileSync(p,'utf8');
const js=read('play-modes-v13-8.js'),maitre=read('heritage-maitre-online-v34-4.js');
const heritage=read('heritage-play-v13-7.js'),casino=read('casino-client-v105.js');
const css=read('play-modes-v13-8.css'),casinoCss=read('casino-client-v105.css');
const sql=read('supabase/migrations/20261116190500_heritage_online_role_selection_v729.sql');
for(const f of ['play-modes-v13-8.js','heritage-maitre-online-v34-4.js','heritage-play-v13-7.js','casino-client-v105.js'])execFileSync(process.execPath,['--check',f]);
for(const fragment of ['function heritageRoleCards(d)','hnet-role-card','data-hnet="role"','data-role=""','Attribution aléatoire','hRolePending','p.preferred_role','p_player_token:s.token','igr_heritage_online_choose_role','selected_role_not_available'])assert(js.includes(fragment),'Missing Cendres/Kuroi role choice: '+fragment);
assert(js.includes('(d.players||[]).map(p=>[p.id,p.ready,p.role_id,p.preferred_role])'),'Role picks must propagate to all devices');
assert(heritage.includes('publicRoles:(campaign,count=5)=>'),'Public role roster not exposed safely');
for(const role of ['chef','sigint','terrain','source','liaison','legal','archive','waka_k','kobun_k','waka_a','kobun_a','commissaire','inspecteur','bengoshi'])assert(heritage.includes("id:'"+role+"'"),'Missing role '+role);
for(const fragment of ['function maitreRoleIds(chapter,count)','n>=6','Number(chapter)===3','hnet-role-grid','data-mnet="role"','rolePending','igr_heritage_online_choose_role','p.preferred_role','d.player?.preferred_role','p.player_token','case']){if(fragment==='p.player_token'||fragment==='case')continue;assert(maitre.includes(fragment),'Missing MAÎTRE role choice: '+fragment)}
assert(maitre.includes('p_player_token:s.token'),'MAÎTRE must use its own token');
assert(maitre.includes('d.players.map(p=>[p.id,p.ready,p.role_id,p.preferred_role])'),'MAÎTRE choice changes must update live roster');
for(const fragment of ['data-casino-action="select-role"',"case 'select-role'",'data-role-id=','is-taken','roleShort(id)','roleStars(id)'])assert(casino.includes(fragment),'Casino choice missing '+fragment);
assert(!casino.includes("form('role',`<label>Ta fonction<select"),'Casino must not hide roles in a dropdown');
for(const cssText of [css,casinoCss])assert(cssText.includes('role')&&cssText.includes('-webkit-line-clamp:unset'),'Descriptions must never be clipped');
assert(css.includes('.hnet-role-warning'),'A stale selected role after player departure needs a visible warning');
for(const fragment of ['add column if not exists preferred_role','create unique index','igr_heritage_online_role_pool','igr_heritage_online_choose_role','for update','rate_limit','role_already_taken','selected_role_not_available_for_player_count','set role_id=preferred_role','where room_code=p_code and preferred_role is null','v_room.status=\'playing\' then role_id else null','grant execute on function public.igr_heritage_online_choose_role'])assert(sql.includes(fragment),'Server contract missing '+fragment);
assert(sql.includes("if p_chapter=3 then"),'MAÎTRE chapter 3 requires the associate');
assert(sql.includes("when 5 then array['waka_k','kobun_k','waka_a','commissaire','inspecteur']"),'KUROI five-seat repertoire must not change');

import {runInNewContext} from 'node:vm';
const roleCardSource=js.slice(js.indexOf('function heritageRoleCards(d){'),js.indexOf('function renderHLobby(d){'));
assert(roleCardSource.startsWith('function heritageRoleCards'),'Cannot extract playable role renderer');
const publicChoices=[
 {id:'chef',name:'CHEF DE CELLULE',short:'Coordonne la cellule.',activity:5},
 {id:'sigint',name:'ANALYSTE',short:'Recoupe les traces.',activity:4}
];
const heritageRoleCards=runInNewContext(roleCardSource+';heritageRoleCards',{
 window:{IGR_HERITAGE_PLAY:{publicRoles:()=>publicChoices}},
 esc:s=>String(s).replaceAll('<','&lt;')
},{timeout:1000});
let view=heritageRoleCards({room:{campaign_id:'cendres'},player:{preferred_role:'sigint'},players:[
 {id:'p1',pseudo:'Ana',preferred_role:'chef'},{id:'p2',pseudo:'Bob',preferred_role:'sigint'}]});
assert.equal(view.invalid,0);
assert(view.markup.includes('CHEF DE CELLULE')&&view.markup.includes('COMPLET'));
assert(view.markup.includes('Ton rôle')&&view.markup.includes('Tirer un rôle'),'Compact chooser must expose the random action even when another role is selected');
assert(view.markup.includes('data-random="1"')&&view.markup.includes('hnet-role-actions'),'Cendres/Kuroi must show a compact real role draw outside the grid');
assert(!view.markup.includes('INFORMATION PRIVÉE'),'Lobby must never reveal a private role card');
view=heritageRoleCards({room:{campaign_id:'cendres'},player:{preferred_role:'sigint'},players:[
 {id:'p1',pseudo:'Ana',preferred_role:'archive'},{id:'p2',pseudo:'Bob',preferred_role:'sigint'}]});
assert.equal(view.invalid,1,'Departing sixth/seventh player must invalidate an unavailable role');
assert(view.markup.includes('hnet-role-warning'),'Invalid choice requires accessible feedback');

const maitrePool=maitre.slice(maitre.indexOf('function maitreRoleIds(chapter,count){'),maitre.indexOf('function lobby(d){'));
const maitreRoleIds=runInNewContext(maitrePool+';maitreRoleIds',{},{timeout:1000});
assert.deepEqual(Array.from(maitreRoleIds(3,5)),['avocat','client','associe','enqueteur','juge']);
assert.deepEqual(Array.from(maitreRoleIds(1,6)),['avocat','client','enqueteur','procureur','juge','associe']);
assert.equal(maitreRoleIds(3,7).length,7);

const casinoLobbySource=casino.slice(casino.indexOf('function lobby(){'),casino.indexOf('function card(){'));
const roleNames={casino:'Personnage de Yonghe',agent:'Agent international',investigator:'Enquêteur',analyst:'Analyste',prosecutor:'Procureur',judge:'Juge'};
const casinoCtx={
 state:{viewer:'me',inviteCode:'TESTCODE',isHost:true,members:[
 {id:'me',name:'Jeanne',role:'casino',ready:false},{id:'p2',name:'Marc',role:'agent',ready:true}]},
 roles:roleNames,roleShort:x=>'Brève du rôle '+x,roleStars:()=> '★★★★☆',esc:x=>String(x)
};
const casinoLobby=runInNewContext(casinoLobbySource+';lobby',casinoCtx,{timeout:1000});
const casinoHTML=casinoLobby();
assert(casinoHTML.includes('Choisis où jouer'),'Casino role selection title missing');
assert(casinoHTML.includes('data-role-id="agent"')&&casinoHTML.includes('COMPLET'),'Taken Bureau function must be disabled');
assert(casinoHTML.includes('data-role-id="casino"')&&casinoHTML.includes('TON RÔLE'),'Own Casino role must be selected');

assert(casinoHTML.includes('casino-role-choice-group--yonghe')&&casinoHTML.includes('casino-role-choice-group--bureau'),'Yonghe camp must be distinct from Bureau professions');
assert(casinoHTML.includes('Personnage de Yonghe')&&casinoHTML.includes('4 À 7 PERSONNAGES'),'Casino must no longer masquerade as a profession');
assert(casinoHTML.includes('casino-roster-disclosure')&&casinoHTML.includes('Participants · 2/12'),'Roster should be compact and collapsible');
assert(casinoHTML.includes('data-role-id="judge"')&&casinoHTML.includes('data-role-id="prosecutor"'),'Optional Bureau roles must remain selectable');
assert(casino.includes("?.role!==selected"),'Re-selecting the same role must not reset player readiness');
assert(casinoCss.includes('casino-role-choice-grid--bureau')&&casinoCss.includes('casino-role-choice-footnote'),'Responsive grouped role UI must be styled');



// v730 — all four online campaigns must present role selection before the roster.
// Existing sealed-card authoring, role pools and multiplayer RPC permissions remain unchanged.
const onlineLobbySource=js.slice(js.indexOf('function renderHLobby(d){'),js.indexOf('async function chooseHeritageRole(roleId){'));
assert(onlineLobbySource.startsWith('function renderHLobby'),'Cendres/Kuroi lobby renderer missing');
for(const campaign of ['cendres','kuroi']){
 let rendered=null;
 const render=runInNewContext(onlineLobbySource+';renderHLobby',{
  hSession:()=>({hostToken:'host'}),
  heritageMeta:()=>({title:campaign.toUpperCase(),chapters:[{title:'Dossier de test'}]}),
  heritageRoleCards:()=>({markup:'<section class="hnet-role-zone">RÔLES</section>',invalid:0}),
  window:{IGR_HERITAGE_PLAY:{publicRoles:()=>[{id:'chef',name:'Chef de cellule'}]}},
  $:()=>null,esc:x=>String(x),shellPut:(html,preserve)=>{rendered={html,preserve}}
 },{timeout:1000});
 render({room:{campaign_id:campaign,chapter:1,code:'H1234'},players:[
  {id:'p1',pseudo:'Ana',preferred_role:'chef',is_host:true},
  {id:'p2',pseudo:'Bob',preferred_role:null,is_host:false}]});
 assert(rendered?.preserve,'Heritage '+campaign+' lobby updates must preserve scrolling');
 assert(rendered.html.indexOf('<section class="hnet-role-zone"')<rendered.html.indexOf('<details class="hnet-roster-disclosure"'),'Role choice must precede roster in '+campaign);
 assert(rendered.html.includes('INVITATION')&&rendered.html.includes('<summary>Joueurs'),'Invitation and expandable roster missing in '+campaign);
 assert(rendered.html.includes('data-hnet="copy-code"'),'Invitation code should be directly copyable in '+campaign);
 assert(rendered.html.includes('EN ATTENTE (3)'),'A two-player room must show exactly three missing participants in '+campaign);
}
const maitreLobbySource=maitre.slice(maitre.indexOf('function lobby(d){'),maitre.indexOf('function reveal(d){'));
assert(maitreLobbySource.startsWith('function lobby'),'MAÎTRE online lobby renderer missing');
let renderedMaitre=null;
const renderMaitre=runInNewContext(maitreLobbySource+';lobby',{
 sess:()=>({hostToken:'host'}),maitreRoleIds:()=>['avocat','client','enqueteur','procureur','juge'],
 ROLES:[{id:'avocat',name:'Avocat'}],role:id=>({id,name:id.toUpperCase(),short:'Description.',activity:4}),
 pc:()=>({title:'Dossier de test'}),$:()=>null,esc:x=>String(x),
 put:(html,preserve)=>{renderedMaitre={html,preserve}}
},{timeout:1000});
renderMaitre({room:{chapter:1,code:'H4321'},player:{preferred_role:'avocat'},
 players:['avocat','client','enqueteur','procureur','juge'].map((id,i)=>({id:'p'+i,pseudo:'J'+i,preferred_role:i?null:id,is_host:i===0}))});
assert(renderedMaitre?.preserve,'MAÎTRE lobby must preserve scrolling');
assert(renderedMaitre.html.indexOf('<section class="hnet-role-zone"')<renderedMaitre.html.indexOf('<details class="hnet-roster-disclosure"'),'MAÎTRE roles must precede roster');
assert(renderedMaitre.html.includes('INVITATION')&&renderedMaitre.html.includes('<summary>Joueurs'),'MAÎTRE invitation or expandable roster missing');
assert(renderedMaitre.html.includes('data-mnet="copy-code"'),'MAÎTRE invitation code should be directly copyable');
assert(renderedMaitre.html.includes('LANCER LA PARTIE'),'MAÎTRE can launch at five participants');
assert(renderedMaitre.html.includes('data-random="1"'),'MAÎTRE must expose an actual random draw action');
assert(renderedMaitre.html.indexOf('<div class="hnet-role-grid">')<renderedMaitre.html.indexOf('class="mnet-role-actions"'),'Random draw must be a small secondary action, outside the role grid');
assert(!renderedMaitre.html.includes('Choisis ta fonction'),'MAÎTRE must remove redundant role-selector headings');
assert(casinoHTML.indexOf('<section class="casino-role-choice-zone"')<casinoHTML.indexOf('<details class="casino-roster-disclosure"'),'Casino roles must precede roster');
assert(casinoHTML.includes('casino-lobby-access'),'Casino invite code should use compact shared hierarchy');
assert(casinoHTML.includes('casino-launch-readiness')&&casinoHTML.includes('casino-selected-role'),'Casino must show all play requirements and own selected role');
assert(casinoHTML.includes('casino-optional-roles'),'Optional prosecutor/judge should be discoverable without cluttering required functions');

assert(casinoHTML.includes('EN ATTENTE · 5 À INVITER')&&casinoHTML.includes('disabled'),'Casino cannot launch with fewer than seven players');
const casinoReadyLobby=runInNewContext(casinoLobbySource+';lobby',{
 state:{viewer:'me',inviteCode:'TESTCODE',isHost:true,members:[
  {id:'me',name:'J1',role:'casino',ready:true},
  {id:'p2',name:'J2',role:'casino',ready:true},
  {id:'p3',name:'J3',role:'casino',ready:true},
  {id:'p4',name:'J4',role:'casino',ready:true},
  {id:'p5',name:'J5',role:'agent',ready:true},
  {id:'p6',name:'J6',role:'investigator',ready:true},
  {id:'p7',name:'J7',role:'analyst',ready:true}
 ]},
 roles:roleNames,roleShort:x=>'Brève du rôle '+x,roleStars:()=> '★★★★☆',esc:x=>String(x)
},{timeout:1000});
assert(casinoReadyLobby().includes('COMMENCER LA PARTIE')&&!casinoReadyLobby().includes('EN ATTENTE ·'),'Casino valid configuration should enable host launch');

const casinoUnassignedLobby=runInNewContext(casinoLobbySource+';lobby',{
 state:{viewer:'p8',inviteCode:'TESTCODE',isHost:false,members:[
  ...Array.from({length:7},(_,i)=>({id:'p'+i,name:'Yonghe '+i,role:'casino',ready:false})),
  {id:'p8',name:'Nouveau joueur',role:null,ready:false}
 ]},
 roles:roleNames,roleShort:x=>'Brève du rôle '+x,roleStars:()=> '★★★★☆',esc:x=>String(x)
},{timeout:1000})();
assert(casinoUnassignedLobby.includes('À CHOISIR'),'Unassigned player must see an explicit roster status');
assert(casinoUnassignedLobby.includes('CHOISIS D’ABORD UN RÔLE'),'Unassigned player must be unable to confirm ready');
assert(casinoUnassignedLobby.includes('data-role-id="casino"')&&casinoUnassignedLobby.includes('is-taken'),'Full Yonghe camp must not accept an eighth player');


const preservesLegacyAnchor=source=>source.includes('lobby=preserveLobby?')&&source.includes('window.scrollY+delta')&&source.includes('getBoundingClientRect().top');
assert(preservesLegacyAnchor(js),'Cendres/Kuroi online lobby must retain its existing scroll protection');
assert(maitre.includes('previousY=Math.max(0,window.scrollY)')&&maitre.includes('IGR_ROLE_VIEWPORT_V816')&&!maitre.includes('window.scrollY+delta'),
 'Maître online role selection must preserve absolute scroll without a competing geometry delta');
assert(casino.includes('lobbyScroll')&&!casino.includes('oldAnchorTop'),'Casino lobby must preserve viewport without resizing-card delta');
assert(js.includes("getAttribute('aria-pressed')!=='true'")&&maitre.includes("getAttribute('aria-pressed')==='true'"),'An already selected role must not trigger a redundant network request');
for(const marker of ['hnet-activity-note','hnet-roster-disclosure','hnet-code strong','hnet-role-random'])assert(css.includes(marker),'Unifying Heritage CSS missing '+marker);
for(const marker of ['casino-lobby-access','casino-roster-disclosure'])assert(casinoCss.includes(marker),'Casino CSS missing '+marker);
console.log('PASS v730: four Heritage online lobbies align roles, invitation, roster and scroll position.');



// v733 — Simulate the actual host start command and the next synchronization.
// This uses synthetic tokens; no user's session or production table is touched.
const heritageStartSource=js.slice(js.indexOf('async function startHeritageOnline(){'),js.indexOf('function bridgeBase(d,stage){'));
assert(heritageStartSource.startsWith('async function startHeritageOnline'),'Heritage host launch handler missing');
for(const campaign of ['cendres','kuroi']){
 const calls=[];let refreshes=0;const notices=[];
 const start=runInNewContext(heritageStartSource+';startHeritageOnline',{
  hSession:()=>({hostToken:'synthetic-host',code:'H1234',campaign}),
  rpc:async(name,args)=>{calls.push({name,args});return {ok:true}},
  syncHeritageOnline:async(force)=>{assert.equal(force,true);refreshes++},
  toastX:m=>notices.push(m),console
 },{timeout:1000});
 await start();
 assert.equal(calls.length,1,'One start request per campaign is required');
 assert.equal(calls[0].name,'igr_heritage_online_start');
 assert.equal(calls[0].args.p_code,'H1234');
 assert.equal(calls[0].args.p_host_token,'synthetic-host');
 assert.equal(refreshes,1,'Start must synchronize the new role-reading stage');
 assert.equal(notices.length,0,'Valid start should not display a generic error');
}
const maitreClickSource=maitre.slice(maitre.indexOf('async function click(n){'),maitre.indexOf('function boot(){'));
assert(maitreClickSource.startsWith('async function click'),'MAÎTRE click handler missing');
const maitreCalls=[];let maitreRefreshes=0;
const maitreClick=runInNewContext(maitreClickSource+';click',{
 sess:()=>({hostToken:'synthetic-host',code:'H4321',chapter:1}),
 rpcx:async(name,args)=>{maitreCalls.push({name,args});return {ok:true}},
 sync:async(force)=>{assert.equal(force,true);maitreRefreshes++},
 toastx:m=>{throw new Error('Unexpected MAÎTRE error: '+m)},
 rolePending:false,console
},{timeout:1000});
await maitreClick({dataset:{mnet:'start',ch:'1'}});
assert.equal(maitreCalls[0]?.name,'igr_heritage_online_start','MAÎTRE must call server-side start');
assert.equal(maitreCalls[0]?.args.p_host_token,'synthetic-host');
assert.equal(maitreRefreshes,1,'MAÎTRE start should refresh its role-reading stage');
assert(css.includes('.hnet-selected-role')&&css.includes('.hnet-code-copy'),'Shared role preview and copy button must have styling');
// v759 — Actual immediate server-side random-role reservation, retry on race,
// plus an explicit return to the server's at-launch random assignment.
const maitreRandomSource=maitre.slice(maitre.indexOf('function availableMaitreRoleButtons(){'),maitre.indexOf('function boot(){'));
assert(maitreRandomSource.startsWith('function availableMaitreRoleButtons'),'MAÎTRE needs a real random-role handler');
const makeRoleButton=(id,picked=false,taken=false)=>({
 dataset:{role:id},disabled:taken,classList:{contains:x=>taken&&x==='is-taken'},
 getAttribute:k=>k==='aria-pressed'?(picked?'true':'false'):null,
 querySelector:()=>({textContent:id.toUpperCase()})
});
for(const collision of [false,true]){
 const calls=[],notices=[];let refreshed=0;
 const available=[makeRoleButton('avocat'),makeRoleButton('client')];
 const randomClick=runInNewContext(maitreRandomSource+';click',{
  document:{querySelectorAll:()=>available},
  sess:()=>({code:'H4321',token:'synthetic-token',chapter:1,hostToken:'synthetic-host'}),
  Math:{random:()=>0,floor:Math.floor},
  rpcx:async(name,args)=>{
   calls.push({name,args});
   if(collision&&args.p_role_id==='avocat')throw new Error('role_already_taken');
   return {ok:true,preferred_role:args.p_role_id}
  },
  sync:async(force)=>{assert.equal(force,true);refreshed++},
  toastx:m=>notices.push(m),rolePending:false,console
 },{timeout:1000});
 await randomClick({dataset:{mnet:'role',random:'1',role:''},getAttribute:()=> 'false'});
 assert.equal(calls[0].name,'igr_heritage_online_choose_role','The random button must actually reserve a role on the server');
 assert.equal(calls[0].args.p_player_token,'synthetic-token','A random role must use the requesting player token');
 assert.equal(calls[0].args.p_role_id,'avocat','The first public available role must be considered');
 assert.equal(calls.at(-1).args.p_role_id,collision?'client':'avocat','Conflicts must retry another free role');
 assert.equal(refreshed,1,'A confirmed draw must synchronize the lobby');
 assert(notices.some(x=>x.startsWith('Rôle tiré :')),'The result must be visibly acknowledged');
 await randomClick({dataset:{mnet:'role',role:''},getAttribute:()=> 'false'});
 assert.equal(calls.at(-1).args.p_role_id,null,'Annuler must restore server-side assignment at launch');
 assert(notices.includes('Tirage au lancement.'),'Reset should tell the player what happens next');
}
console.log('PASS v759: compact random action reserves an actual role, handles collisions and restores launch lottery.');

// v760 — CENDRES/KUROI follow Maître's immediate, authoritative random draw.
const heritageDrawSource=js.slice(js.indexOf('async function drawHeritageOnlineRole(){'),js.indexOf('async function chooseHeritageRole(roleId){'));
assert(heritageDrawSource.startsWith('async function drawHeritageOnlineRole'),'Shared role draw handler missing');
for(const campaign of ['cendres','kuroi']){
 for(const collision of [false,true]){
  const calls=[],notices=[];let refreshes=0;
  const buttons=['chef','sigint'].map(id=>({
   dataset:{role:id},disabled:false,classList:{contains:()=>false},
   getAttribute:()=> 'false',querySelector:()=>({textContent:id.toUpperCase()})
  }));
  const draw=runInNewContext(heritageDrawSource+';drawHeritageOnlineRole',{
   document:{querySelectorAll:()=>buttons},
   hSession:()=>({code:'H1234',token:'synthetic-'+campaign,campaign}),
   hRolePending:false,Math:{random:()=>0,floor:Math.floor},
   rpc:async(name,args)=>{calls.push({name,args});if(collision&&args.p_role_id==='chef')throw Error('role_already_taken');return {ok:true}},
   syncHeritageOnline:async(force)=>{assert.equal(force,true);refreshes++},
   toastX:m=>notices.push(m),console
  },{timeout:1000});
  await draw();
  assert.equal(calls[0].name,'igr_heritage_online_choose_role','Random button must reserve via authenticated RPC');
  assert.equal(calls[0].args.p_player_token,'synthetic-'+campaign,'Random choice must use personal token');
  assert.equal(calls.at(-1).args.p_role_id,collision?'sigint':'chef','Concurrent role claim must retry a remaining free role');
  assert.equal(refreshes,1,'Confirmed random choice synchronizes lobby');
  assert(notices.some(x=>x.startsWith('Rôle tiré :')),'Successful draw must show result');
 }
}
assert(js.includes("data-random=\"1\"")&&js.includes("drawHeritageOnlineRole()"),'The visible button must call the random handler');
console.log('PASS v760: Cendres and Kuroi reserve immediately, retry collisions, and keep server role authorization.');

console.log('PASS v733: synthetic Cendres/Kuroi/Maître host launch and Casino preparation paths.');

console.log('PASS v729: CENDRES/KUROI/MAÎTRE role reservations, Casino cards, 5-7 seats, private role boundaries, mobile UI and SQL contracts');
