/* Inside Grey Room — Santoro signed final verdict (021–025).
 * No private canon is embedded. The server supplies only public act codes,
 * suspects and the two independently sourced C3 records at final lock.
 */
(()=>{
'use strict';
const CASES=new Set(['021','022','023','024','025']);
const LABELS={
 'détournement':'Détournement des fonds','écritures':'Falsification des écritures',
 'fuite':'Divulgation d’informations','transport':'Remise et transport',
 'coverup':'Faux alibis et dissimulation','debt':'Dettes et comptes des paris',
 'executor':'Exécution du meurtre','order':'Ordre donné pour le meurtre',
 'absence':'Absence organisée','attack':'Attaque contre Adriano',
 'contract':'Contrats de transport','route':'Fuite d’itinéraire',
 'corroboration':'Comptabilité et preuves','false_or_old':'Déclarations fausses ou anciennes',
 'justice':'Déclarations aux autorités','new_info':'Extorsion et faits nouveaux',
 'aggression':'Agression du propriétaire','money':'Prélèvements forcés',
 'origin':'Origine de la consigne','relay':'Transmission de la consigne'
};
function current(){try{return typeof STATE!=='undefined'?STATE.sync:null;}catch{return null;}}
function room(d){return d?.room||{};}
function isSantoro(d){return CASES.has(room(d).scenario_id)&&room(d).state?.omerta_standalone===true;}
function canLock(d){return isSantoro(d)&&d?.player?.public_role==='enqueteur'
  &&room(d).status==='playing'&&Number(room(d).cycle)===3&&room(d).phase==='locking';}
function canRead(d){return isSantoro(d)&&d?.player?.public_role==='suspect'&&room(d).status==='finished';}
function el(tag,text,cls){const node=document.createElement(tag);if(text!==undefined)node.textContent=text;if(cls)node.className=cls;return node;}
async function call(name,params={}){
 if(typeof rpc!=='function'||typeof STATE==='undefined')throw Error('Connexion indisponible');
 return rpc(name,{p_code:STATE.room||room(current()).code,p_player_token:STATE.token,...params});
}
async function sync(){try{if(typeof syncNow==='function')await syncNow(true);}catch(e){console.warn('[SANTORO] synchro',e);}}
function overlay(title,description){
 document.querySelector('.igr-santoro-verdict-modal')?.remove();
 const m=el('div',undefined,'modal igr-santoro-verdict-modal');
 const inner=el('div',undefined,'modal-box igr-santoro-verdict-box');
 inner.setAttribute('role','dialog');inner.setAttribute('aria-modal','true');inner.setAttribute('aria-label',title);
 const head=el('span','OMERTÀ · SANTORO','omerta-eyebrow');
 const content=el('section',undefined,'igr-santoro-verdict-content');
 const foot=el('div',undefined,'modal-actions');
 const cancel=el('button','Fermer','btn ghost');cancel.type='button';cancel.addEventListener('click',()=>m.remove());
 foot.append(cancel);
 inner.append(head,el('h2',title),el('p',description),content,foot);
 m.append(inner);m.addEventListener('click',e=>{if(e.target===m)m.remove();});
 document.body.append(m);
 return {outer:m,content,foot,cancel};
}
function error(container,e){container.append(el('p',String(e?.message||'Action indisponible').replace(/^[a-z_]+$/i,'Vérifie le statut de la partie.'),'igr-santoro-verdict-error'));}
async function openVerdict(){
 if(!canLock(current()))return;
 const m=overlay('Verdict final','Désigne uniquement un joueur et un acte précis. Les deux pièces C3 sont les références du dossier, pas une preuve automatique de la culpabilité.');
 m.content.append(el('p','Chargement des éléments du dossier…'));
 try{
  const data=await call('igr_omerta_standalone_verdict_options');
  if(!m.outer.isConnected)return;
  const suspects=Array.isArray(data?.suspects)?data.suspects:[];
  const acts=Array.isArray(data?.acts)?data.acts:[];
  const evidence=Array.isArray(data?.evidence)?data.evidence:[];
  if(!data?.available||!suspects.length||!acts.length||evidence.length<2)
    throw Error('Les éléments requis pour le verdict sont incomplets.');
  m.content.replaceChildren();
  m.content.append(el('h3','Documents recoupés · cycle III'));
  const ul=el('ul');
  for(const item of evidence.slice(0,2))ul.append(el('li',item.description||'Pièce documentée'));
  m.content.append(ul,el('h3','Désignations officielles'));
  const selectors=[];
  for(const person of suspects){
   const field=el('div',undefined,'igr-santoro-verdict-field');
   const name=el('label',person.pseudo||'Suspect');
   const choice=el('select',undefined,'igr-santoro-verdict-select');
   const none=el('option','Ne pas désigner');none.value='';choice.append(none);
   for(const act of acts){
    const option=el('option',LABELS[act.code]||act.code);
    option.value=act.code;choice.append(option);
   }
   name.append(choice);field.append(name);m.content.append(field);
   selectors.push({player:person.id,choice});
  }
  m.content.append(el('p','Chaque désignation doit correspondre à un acte particulier. Une fois enregistré, le verdict ne peut plus être modifié.','igr-santoro-verdict-note'));
  const submit=el('button','Sceller le verdict final','btn primary');submit.type='button';
  submit.addEventListener('click',async()=>{
   const entries=selectors.filter(x=>x.choice.value).map(x=>({
    player_id:x.player,act_axis:x.choice.value,
    evidence_ids:evidence.slice(0,2).map(x=>x.id)
   }));
   if(!window.confirm('Sceller définitivement ce verdict ? Les désignations seront irréversibles.'))return;
   submit.disabled=true;
   try{
    const result=await call('igr_omerta_standalone_lock_verdict',{p_designations:entries});
    if(result?.finished!==true)throw Error('Le verdict n’a pas été enregistré.');
    m.content.replaceChildren(el('p','Le verdict est scellé. La conclusion du dossier est maintenant consultable.'));
    submit.remove();await sync();
   }catch(e){error(m.content,e);submit.disabled=false;}
  });
  m.foot.insertBefore(submit,m.cancel);
 }catch(e){m.content.replaceChildren();error(m.content,e);}
}
async function openPersonalResult(){
 if(!canRead(current()))return;
 const m=overlay('Mon résultat confidentiel','Seul ton personnage peut consulter son objectif individuel. Une désignation n’est pas une preuve de culpabilité.');
 m.content.append(el('p','Calcul du résultat privé…'));
 try{
  const data=await call('igr_omerta_standalone_my_verdict');
  if(!m.outer.isConnected)return;
  m.content.replaceChildren();
  if(!data?.available){
   m.content.append(el('p',data?.reason==='editorial_goal_axis_pending'
    ?'Résultat en attente de validation éditoriale.'
    :data?.reason==='informant_separate_goal_pending'
     ?'Le pacte de l’Indic suit ses propres conditions de victoire.'
     :'Résultat indisponible pour cette partie.'));
   return;
  }
  m.content.append(el('h3',data.result?.won===true?'Objectif atteint':'Objectif non atteint'));
  m.content.append(el('p',data.canonical_goal||''));
  m.content.append(el('p','Acte associé : '+(LABELS[data.act_axis]||data.act_axis||'non renseigné')));
 }catch(e){m.content.replaceChildren();error(m.content,e);}
}
function mount(){
 const d=current(),dock=document.querySelector('.omerta-decision-dock')||document.querySelector('.game-panel-v11');
 document.querySelectorAll('.igr-santoro-verdict-entry').forEach(node=>{
  if(!dock||(!canLock(d)&&!canRead(d)))node.remove();
 });
 if(!dock||!isSantoro(d))return;
 const type=canLock(d)?'lock':canRead(d)?'result':null;
 if(!type)return;
 const already=dock.querySelector('.igr-santoro-verdict-entry');
 if(already){
   if(already.dataset.type===type)return;
   already.remove();
 }
 const button=el('button',type==='lock'?'Verdict Santoro · désigner les actes':'Mon résultat · Santoro','btn primary igr-santoro-verdict-entry');
 button.type='button';button.dataset.type=type;
 button.addEventListener('click',type==='lock'?openVerdict:openPersonalResult);
 dock.append(button);
}
function start(){
 mount();
 const observer=new MutationObserver(records=>{if(records.some(x=>x.addedNodes?.length||x.removedNodes?.length))mount();});
 observer.observe(document.body,{childList:true,subtree:true});
 window.addEventListener('pageshow',mount);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();