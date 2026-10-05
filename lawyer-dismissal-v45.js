/* Inside Grey Room — v45 Lawyer dismissal
   A represented suspect may dismiss their official lawyer once per game.
   The choice is irreversible for the suspect and frees the lawyer for another client.
*/
(()=>{
'use strict';
const VERSION='v45-lawyer-dismissal';
const S=()=>{try{return typeof STATE!=='undefined'?STATE:(window.STATE||null)}catch(_){return window.STATE||null}};
const sync=()=>S()?.sync||null;
const room=()=>sync()?.room||null;
const me=()=>sync()?.player||null;
const role=()=>me()?.public_role||S()?.role||'';
const code=()=>S()?.room||room()?.code||'';
const token=()=>S()?.token||'';
const fr=()=>window.IGR_LOCALE!=='en';
const copy=(a,b)=>fr()?a:b;
const esc=v=>typeof window.h==='function'?window.h(String(v??'')):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let state=null,loading=false,last='';

async function rpc45(name,args={}){
  if(typeof window.rpc!=='function')throw new Error(copy('Connexion indisponible.','Connection unavailable.'));
  return window.rpc(name,{p_code:code(),p_player_token:token(),...args});
}

async function refresh(force=false){
  if(role()!=='suspect'||!code()||!token()||loading)return;
  loading=true;
  try{
    const next=await rpc45('igr_v45_lawyer_state');
    const sig=JSON.stringify(next||{});
    state=next||null;
    if(force||sig!==last){last=sig;inject()}
  }catch(e){
    if(force)window.toast?.(e?.message||copy('État de la représentation indisponible.','Representation state unavailable.'));
  }finally{loading=false}
}

function disableRehire(page){
  page.querySelectorAll('button[onclick*="igr43RequestLawyer"]').forEach(btn=>{
    btn.disabled=true;
    btn.setAttribute('aria-disabled','true');
    btn.style.display='none';
  });
}
function inject(){
  if(role()!=='suspect')return;
  const page=document.querySelector('.igr43-lawyer-page');
  if(!page)return;
  const dismissed=!!state?.dismissal_used&&!state?.represented;
  const canDismiss=!!state?.can_dismiss&&!!state?.represented;
  if(dismissed)disableRehire(page);
  const mode=dismissed?'dismissed':canDismiss?'active':'none';
  const existing=document.getElementById('igr45DismissCard');
  if(mode==='none'){existing?.remove();return}
  if(existing?.dataset.mode===mode)return;
  existing?.remove();

  if(dismissed){
    const former=state?.former_lawyer?.pseudo||copy('ton ancien avocat','your former lawyer');
    const card=document.createElement('article');
    card.id='igr45DismissCard';
    card.dataset.mode='dismissed';
    card.className='igr43-client-card strong';
    card.innerHTML=`<small>${esc(copy('REPRÉSENTATION TERMINÉE','REPRESENTATION ENDED'))}</small><h3>${esc(former)}</h3><p>${esc(copy('Tu as mis fin à cette représentation. Ce choix est définitif : tu ne peux plus demander de nouvel avocat officiel. Si tu ne l’as pas encore utilisée, ta consultation unique de 1 minute reste disponible pendant ton propre interrogatoire.','You ended this representation. This choice is final: you cannot request another official lawyer. If unused, your one-minute consultation remains available during your own interrogation.'))}</p>`;
    page.querySelector('header')?.after(card);
    return;
  }

  const lawyer=state?.lawyer?.pseudo||copy('ton Avocat','your Lawyer');
  const card=document.createElement('article');
  card.id='igr45DismissCard';
  card.dataset.mode='active';
  card.className='igr43-rule-card';
  card.innerHTML=`<small>${esc(copy('METTRE FIN À LA REPRÉSENTATION','END REPRESENTATION'))}</small><p>${esc(copy(`Tu peux renvoyer ${lawyer} une seule fois. La décision est irréversible : tu ne pourras plus demander de nouvel avocat officiel. L’Avocat redeviendra libre de représenter quelqu’un d’autre.`,`You may dismiss ${lawyer} once. The decision is irreversible: you will not be able to request another official lawyer. The Lawyer will become free to represent someone else.`))}</p><button class="btn ghost block" type="button" onclick="igr45DismissLawyer()">${esc(copy('Mettre fin à la représentation','End representation'))}</button>`;
  page.appendChild(card);
}

window.igr45DismissLawyer=async()=>{
  const lawyer=state?.lawyer?.pseudo||copy('ton Avocat','your Lawyer');
  const ok=window.confirm(copy(
    `Mettre fin à la représentation de ${lawyer} ?\n\nCe choix est définitif. Tu ne pourras plus demander de nouvel avocat officiel dans cette partie.`,
    `End ${lawyer}'s representation?\n\nThis choice is final. You will not be able to request another official lawyer in this game.`
  ));
  if(!ok)return;
  try{
    await rpc45('igr_v45_dismiss_lawyer');
    window.toast?.(copy('Représentation terminée.','Representation ended.'));
    await window.syncNow?.(true);
    await refresh(true);
    try{window.renderGame?.()}catch(_){}
    setTimeout(inject,50);
  }catch(e){
    window.toast?.(e?.message||copy('Impossible de mettre fin à la représentation.','Unable to end representation.'));
  }
};

const observer=new MutationObserver(()=>inject());
if(document.documentElement)observer.observe(document.documentElement,{childList:true,subtree:true});
setInterval(()=>refresh(false),1800);
window.addEventListener('focus',()=>refresh(true));
setTimeout(()=>refresh(true),350);
window.IGR_LAWYER_DISMISSAL_VERSION=VERSION;
})();
