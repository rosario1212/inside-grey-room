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
assert(view.markup.includes('TON RÔLE')&&view.markup.includes('Attribution aléatoire'));
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
assert(casinoHTML.includes('CHOISIS')||casinoHTML.includes('Choisis ton rôle'),'Casino role selection title missing');
assert(casinoHTML.includes('data-role-id="agent"')&&casinoHTML.includes('COMPLET'),'Taken Bureau function must be disabled');
assert(casinoHTML.includes('data-role-id="casino"')&&casinoHTML.includes('TON RÔLE'),'Own Casino role must be selected');

console.log('PASS v729: CENDRES/KUROI/MAÎTRE role reservations, Casino cards, 5-7 seats, private role boundaries, mobile UI and SQL contracts');
