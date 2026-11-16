// v728 — Every playable role has a concise full-width preview and a shared 5-star scale.
// These checks never read, alter or expose sealed scenario truth.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(p,'utf8');
const app=read('app-v11.js'),omerta=read('omerta-v12.js'),omertaHQ=read('omerta-v12-39.js');
const natural=read('natural-role-gameplay-v50.js'),rules=read('self-guided-rules-v51.js');
const heritage=read('heritage-play-v13-7.js'),maitreData=read('heritage-maitre-data-v34.js');
const maitreUI=read('heritage-maitre-v34.js'),casino=read('casino-client-v105.js');
const heritageCSS=read('heritage-play-v13-7.css'),casinoCSS=read('casino-client-v105.css'),lobbyCSS=read('lobby-ui-fix-v13.css');
const core=['officier_liaison','enqueteur','analyste','suspect','maitre','procureur','juge','journaliste','inspecteur','expert','temoin','espion','bras_droit','don','informateur'];
const santoro=['associato','uomo_onore','contabile','pentito','caporegime','consigliere','sottocapo','don'];
const cendres=['chef','sigint','terrain','source','liaison','legal','archive'];
const kuroi=['waka_k','kobun_k','waka_a','kobun_a','commissaire','inspecteur','bengoshi'];
const maitre=['avocat','client','enqueteur','procureur','juge','associe','temoin'];
const casinoRoles=['casino','agent','investigator','analyst','prosecutor','judge'];
const shortEnough=(s,where)=>{assert(s.length>9&&s.length<=72,where+' must be concise: '+s.length);assert(!s.includes('…')&&!s.includes('...'),where+' must not end in ellipses');};
function mapOfActivity(src){
 const m=src.match(/const ACTIVITY=\{([^}]+)\}/);assert(m,'Missing shared activity rating');
 return Object.fromEntries(m[1].split(',').map(part=>{const [k,v]=part.split(':');return [k.trim(),Number(v)]}));
}
const lobbyActivity=mapOfActivity(natural);
assert.deepEqual(mapOfActivity(rules),lobbyActivity,'Lobby and rules star ratings differ');
for(const id of new Set([...core,...santoro])){
 const source=santoro.includes(id)&&id!=='don'?omerta:app;
 const hit=source.match(new RegExp('\\b'+id+":\\{label:'[^']+',short:'([^']+)'"));
 assert(hit,'Missing concise description '+id);
 shortEnough(hit[1],id);
 assert(Number.isInteger(lobbyActivity[id])&&lobbyActivity[id]>=1&&lobbyActivity[id]<=5,'Missing 5-star rating '+id);
}
assert.equal(lobbyActivity.juge,4,'Judge is an active but non-sovereign role');
assert.equal(lobbyActivity.espion,4,'Hidden spy must not fall back to generic 2 stars');
assert(app.includes('<small>${h(x.info.short||x.info.body)}</small>'),'Lobby does not render short descriptions');
assert(omerta.includes("ROLE_SETS[sc.id].filter(id=>id!=='suspect')"),'Generic suspect still competes with Santoro ranks');
assert(omertaHQ.includes("ROLE_PREVIEWS_FR"),'Omerta ranks must preserve their dossier-specific wording');
assert(lobbyCSS.includes('-webkit-line-clamp:unset!important')&&lobbyCSS.includes('overflow:visible!important'),'Lobby description clamping has returned');
function checkHeritage(source,ids,family){
 for(const id of ids){
  const match=source.match(new RegExp("\\{id:'"+id+"',name:'[^']+',short:'([^']+)',activity:([1-5]),public:'"));
  assert(match,'Missing summary, activity or full sheet for '+family+'/'+id);
  shortEnough(match[1],family+'/'+id);
  const n=Number(match[2]);assert(n>=1&&n<=5,'Rating out of range '+id);
 }
}
checkHeritage(heritage,cendres,'Cendres');
checkHeritage(heritage,kuroi,'Kuroi');
checkHeritage(maitreData,maitre,'Maître');
for(const ui of [heritage,maitreUI]){
 for(const fragment of ['hplay-role-short','hplay-role-activity','hplay-role-full','Lire la fiche complète'])
  assert(ui.includes(fragment),'Heritage reveal missing '+fragment);
}
assert(heritageCSS.includes('.hplay-private .hplay-role-short')&&heritageCSS.includes('overflow:visible!important'),'Heritage summary not fully readable');
const casinoText=casino.match(/const ROLE_SHORT=Object\.freeze\(\{([\s\S]*?)\}\);/);
const casinoStars=casino.match(/const ROLE_ACTIVITY=Object\.freeze\(\{([^}]+)\}\);/);
assert(casinoText&&casinoStars,'Casino summary and rating tables missing');
const ratings=Object.fromEntries(casinoStars[1].split(',').map(x=>{const [k,v]=x.split(':');return [k.trim(),Number(v)]}));
for(const role of casinoRoles){
 const match=casinoText[1].match(new RegExp('\\b'+role+":'([^']+)'"));
 assert(match,'Casino summary missing '+role);
 shortEnough(match[1],'Casino/'+role);
 assert(ratings[role]>=1&&ratings[role]<=5,'Casino rating missing '+role);
}
assert.equal(ratings.judge,4,'Casino Judge and standard Judge must use the same 4/5 activity rating');
for(const fragment of ['data-casino-role-preview','data-casino-role-activity','casino-role-preview','casino-role-activity','roleShort(state.role)'])assert(casino.includes(fragment),'Casino role UI missing '+fragment);
assert(casinoCSS.includes('overflow:visible')&&casinoCSS.includes('text-overflow:clip'),'Casino role description can be truncated');
console.log('PASS v728: 20 Base scenarios + DLC roles, 14 Cendres/Kuroi, 7 Maître and 6 Casino roles; full captions, individual 5-star activity and unmodified complete sheets.');
