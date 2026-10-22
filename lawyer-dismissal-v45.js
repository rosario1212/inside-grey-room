/* Inside Grey Room — mutual termination, using the historical v45 asset. */
(()=>{
'use strict';
const VERSION='v45-lawyer-dismissal';
const S=()=>{try{return typeof STATE!=='undefined'?STATE:(window.STATE||null)}catch(_){return window.STATE||null}};
const sync=()=>S()?.sync||null,room=()=>sync()?.room||null,me=()=>sync()?.player||null;
const role=()=>me()?.public_role||S()?.role||'';
const code=()=>S()?.room||room()?.code||'',token=()=>S()?.token||'';
const copy=(fr,en)=>window.IGR_LOCALE==='en'?en:fr;
const esc=v=>typeof window.h==='function'?window.h(String(v??'')):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let state=null,loading=false,ending=false;

async function rpc(name,args={}){
 if(typeof window.rpc!=='function')throw new Error(copy('Connexion indisponible.','Connection unavailable.'));
 return window.rpc(name,{p_code:code(),p_player_token:token(),...args});
}
async function refresh(force=false){
 if(!['suspect','maitre'].includes(role())||!code()||!token()||loading)return;
 loading=true;
 try{state=await rpc('igr_v45_lawyer_state');inject();}
 catch(e){if(force)window.toast?.(e?.message||copy('État de la représentation indisponible.','Representation state unavailable.'));}
 finally{loading=false;}
}
function renderControls(){
 if(!state||state.role!==role())return '';
 const lawyer=role()==='maitre',peer=lawyer?state.client:state.lawyer;
 const penalty=lawyer&&state.cartel_penalty_on_withdraw===true;
 const forfeit=lawyer&&state.cartel_forfeit===true;
 let html=forfeit?`<article class="igr43-rule-card"><b>${esc(copy('DÉFAITE PERSONNELLE','PERSONAL DEFEAT'))}</b><p>${esc(copy('Tu as abandonné le mandat du cartel. Ta défaite est définitive et le cartel fera tuer ta famille au dénouement. Tu continues à jouer.','You abandoned the cartel’s appointment. Your personal defeat is final and the cartel will kill your family in the ending. You continue playing.'))}</p></article>`:'';
 if(state.can_end_representation&&peer?.id){
  const text=lawyer?copy(`Tu peux cesser de représenter ${peer.pseudo}.`,`You may stop representing ${peer.pseudo}.`):copy(`Tu peux renvoyer ${peer.pseudo}.`,`You may dismiss ${peer.pseudo}.`);
  const warning=penalty?copy('Si tu abandonnes ce mandat, tu perds personnellement la partie et le cartel fera tuer ta famille au dénouement.','If you abandon this appointment, you personally lose the game and the cartel will kill your family in the ending.'):copy('La représentation prend fin immédiatement. Une nouvelle représentation demande l’accord des deux joueurs.','Representation ends immediately. A new representation requires both players to agree.');
  html+=`<article class="igr43-rule-card"><small>${esc(copy('METTRE FIN À LA REPRÉSENTATION','END REPRESENTATION'))}</small><p>${esc(text)}</p><p>${esc(warning)}</p><button class="btn ghost block" type="button" onclick="igr170EndRepresentation('${esc(peer.id)}')">${esc(lawyer?copy('Cesser de représenter ce client','Stop representing this client'):copy('Renvoyer l’avocat','Dismiss the lawyer'))}</button></article>`;
 }else if(state.last_termination){
  html+=`<article class="igr43-rule-card"><small>${esc(copy('REPRÉSENTATION TERMINÉE','REPRESENTATION ENDED'))}</small><p>${esc(copy('Tu n’as plus de représentation officielle avec ','You no longer have official representation with ')+(state.last_termination.peer_pseudo||copy('ce joueur','this player'))+'.')}</p></article>`;
 }
 return html;
}
function inject(){
 if(!['suspect','maitre'].includes(role()))return;
 const root=document.querySelector('.igr43-lawyer-page')||document.getElementById('igr43RoleHelper');
 if(!root)return;
 const html=renderControls(),existing=document.getElementById('igr45DismissCard');
 if(!html){existing?.remove();return;}
 if(existing&&existing.dataset.signature===html&&existing.parentNode===root)return;
 existing?.remove();
 const holder=document.createElement('div');holder.id='igr45DismissCard';holder.dataset.signature=html;holder.innerHTML=html;root.appendChild(holder);
}
async function endRepresentation(expectedPeer){
 if(ending)return;
 const lawyer=role()==='maitre',peer=lawyer?state?.client:state?.lawyer;
 if(!state?.can_end_representation||!peer?.id)return refresh(true);
 if(expectedPeer&&String(expectedPeer)!==String(peer.id))return refresh(true);
 const penalty=lawyer&&state.cartel_penalty_on_withdraw===true;
 const prompt=(lawyer?copy(`Cesser de représenter ${peer.pseudo} ?`,`Stop representing ${peer.pseudo}?`):copy(`Renvoyer ${peer.pseudo} ?`,`Dismiss ${peer.pseudo}?`))+'\n\n'+(penalty?copy('Tu perdras personnellement la partie et le cartel fera tuer ta famille au dénouement. Cette sanction est définitive, même si tu reprends ensuite le mandat.','You will personally lose the game and the cartel will kill your family in the ending. This penalty is final, even if you later resume the appointment.'):copy('La représentation prendra fin immédiatement.','Representation will end immediately.'));
 if(!window.confirm(prompt))return;
 ending=true;
 try{
  await rpc('igr_v170_end_representation',{p_peer_id:peer.id,p_acknowledge_cartel:penalty});
  window.toast?.(copy('Représentation terminée.','Representation ended.'));
  const overlay=document.getElementById('igr43ConsultOverlay');
  if(overlay?.dataset.suspect===(lawyer?peer.id:me()?.id))window.igr43EndConsultation?.();
  await window.syncNow?.(true);
  await window.IGR_LAWYER_V43?.refresh?.(true);
  await refresh(true);
  window.renderGame?.();setTimeout(inject,0);
 }catch(e){window.toast?.(e?.message||copy('Impossible de terminer la représentation.','Unable to end representation.'));}
 finally{ending=false;}
}
window.igr170EndRepresentation=endRepresentation;
window.igr45DismissLawyer=()=>endRepresentation();
const observer=new MutationObserver(inject);
if(document.documentElement)observer.observe(document.documentElement,{childList:true,subtree:true});
setInterval(()=>refresh(false),1800);
window.addEventListener('focus',()=>refresh(true));
setTimeout(()=>refresh(true),350);
window.IGR_LAWYER_DISMISSAL_VERSION=VERSION;
window.IGR_LAWYER_TERMINATION_V170={refresh,renderControls,endRepresentation};
})();
