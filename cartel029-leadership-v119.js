/* CARTEL 029 — distinct leadership and optional private text dialogue.
   Applies ONLY to verified four-witness rooms; never changes other DLC. */
(()=>{
'use strict';
const state=()=>typeof STATE!=='undefined'?STATE:null;
const sync=()=>state()?.sync;
const role=()=>sync()?.player?.public_role||'';
const guided=()=>{
 const r=sync()?.room;
 return r?.scenario_id==='029' && (
   (Number(r?.min_players)===6&&Number(r?.max_players)===11) ||
   r?.state?.cartel029_ready===true
 );
};
const live=()=>guided()&&sync()?.room?.status==='playing'&&sync()?.room?.state?.cartel029_ready===true;
const tr=(f,e)=>window.IGR_LOCALE==='en'?e:f;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const roster=['enqueteur','analyste','suspect','suspect','suspect','suspect','procureur','juge','journaliste','don','bras_droit'];
const info0=typeof roleInfo==='function'?roleInfo:null;
if(info0){const wrap=function(r){
 if(guided()){
  if(r==='don')return {label:tr('Don','Don'),win:tr('Préserve ton pouvoir ou choisis de coopérer.','Preserve your authority or choose to cooperate.'),body:tr('Tu diriges Los Salcedo. Tes échanges sont libres, mais aucun message ne déclenche une représaille automatique.','You lead Los Salcedo. Your messages never automatically trigger reprisals.')};
  if(r==='bras_droit')return {label:tr('Bras droit','Right hand'),win:tr('Protège ta position ou décide de témoigner.','Protect your position or choose to testify.'),body:tr('Tu coordonnes plusieurs responsables du cartel et peux correspondre librement.','You coordinate cartel managers and can exchange messages.')};
 }
 return info0.call(this,r);
};try{roleInfo=wrap}catch{}window.roleInfo=wrap;}
const slots0=typeof lobbyRoleSlots==='function'?lobbyRoleSlots:null;
if(slots0){const wrap=function(sc,count){
 if(sc?.id==='029'&&guided())return roster.slice(0,Math.min(11,Math.max(6,count)));
 return slots0.apply(this,arguments);
};try{lobbyRoleSlots=wrap}catch{}window.lobbyRoleSlots=wrap;}
const label0=typeof displayRole==='function'?displayRole:null;
if(label0){const wrap=function(r,p){
 if(guided()&&r==='don')return tr('Don','Don')+' · '+p;
 if(guided()&&r==='bras_droit')return tr('Bras droit','Right hand')+' · '+p;
 return label0.call(this,r,p);
};try{displayRole=wrap}catch{}window.displayRole=wrap;}
const tabs0=typeof gameTabs==='function'?gameTabs:null;
if(tabs0){const wrap=function(){
 const tabs=[...(tabs0.apply(this,arguments)||[])];
 if(guided()&&['don','bras_droit'].includes(role())&&!tabs.some(x=>x.id==='channel')){
  const idx=tabs.findIndex(t=>t.id==='card');
  tabs.splice(idx>=0?idx+1:0,0,{id:'channel',label:tr('Messages','Messages')});
 }
 return tabs;
};try{gameTabs=wrap}catch{}window.gameTabs=wrap;}
function contactHtml(){
 const all=sync()?.players||[],self=sync()?.player;
 const candidates=all.filter(p=>p.id!==self?.id&&
    ['suspect','don','bras_droit'].includes(p.public_role)&&
    !(role()==='suspect'&&p.public_role==='suspect'));
 const mail=(sync()?.events||[]).filter(e=>e.event_type==='message'&&e.payload?.channel==='cartel_contact').slice(-16);
 return '<section class="igr119-contact"><h3>'+esc(tr('Correspondance confidentielle','Private correspondence'))+'</h3>'+
 '<p>'+esc(tr('Vous pouvez parler librement. Un message n’ordonne jamais une violence automatiquement.','Messages are free-form; no message automatically orders violence.'))+'</p>'+
 '<div class="igr119-mail">'+(mail.length?mail.map(e=>'<div class="igr119-letter"><b>'+esc(e.payload.author||'')+'</b> → '+esc(e.payload.to||'')+'<p>'+esc(e.payload.text||'')+'</p></div>').join(''):'<p>'+esc(tr('Aucun message pour le moment.','No messages yet.'))+'</p>')+'</div>'+
 (candidates.length?'<label>'+esc(tr('À qui écrire ?','Send to'))+'<select id="igr119-target">'+candidates.map(p=>'<option value="'+esc(p.id)+'">'+esc(p.pseudo||'')+' · '+esc(p.public_role==='suspect'?tr('Témoin','Witness'):p.public_role==='don'?tr('Don','Don'):tr('Bras droit','Right hand'))+'</option>').join('')+'</select></label>'+
 '<label>'+esc(tr('Message privé','Private message'))+'<textarea id="igr119-text" maxlength="200" rows="3"></textarea></label>'+
 '<button type="button" class="btn ghost" onclick="igr119SendContact()">'+esc(tr('Envoyer le message','Send message'))+'</button>':'<p>'+esc(tr('Aucun destinataire disponible.','No recipients available.'))+'</p>')+'</section>';
}
window.igr119SendContact=async function(){
 if(!live()||!['suspect','don','bras_droit'].includes(role()))return;
 const target=document.getElementById('igr119-target')?.value,content=document.getElementById('igr119-text')?.value?.trim();
 if(!target||!content)return;
 try{
  await rpc('igr_v118_cartel_correspondence',{p_code:sync().room.code,p_player_token:state().token,p_target:target,p_text:content});
  await syncNow(true);
 }catch(e){console.warn('[IGR 029 correspondence]',e?.message||e);if(typeof toast==='function')toast(tr('Envoi refusé.','Message rejected.'))}
};
const tab0=typeof renderGameTab==='function'?renderGameTab:null;
if(tab0){const wrap=function(){
 const html=String(tab0.apply(this,arguments)||'');
 if(!live()||state()?.tab!=='channel'||!['suspect','don','bras_droit'].includes(role()))return html;
 return html+contactHtml();
};try{renderGameTab=wrap}catch{}window.renderGameTab=wrap;}
const style=document.createElement('style');
style.textContent='.igr119-contact{padding:14px;border:1px solid rgba(193,151,118,.3);border-radius:14px;margin-top:16px}.igr119-contact h3{font-size:16px}.igr119-contact p{font-size:13px;line-height:1.5;color:#c7c1bc}.igr119-contact label{display:grid;gap:6px;font-size:12px;margin:12px 0}.igr119-contact select,.igr119-contact textarea{width:100%;box-sizing:border-box;padding:11px;border:1px solid #59504d;background:#1e1d1c;color:#eee7e3;border-radius:9px}.igr119-mail{max-height:280px;overflow:auto}.igr119-letter{border-bottom:1px solid rgba(255,255,255,.1);padding:9px 0;font-size:12px}.igr119-letter p{white-space:pre-wrap;margin:5px 0}';
document.head.appendChild(style);
window.IGR_CARTEL_029_V119=Object.freeze({guided,live});
})();