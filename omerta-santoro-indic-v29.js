/* OMERTA / SANTORO — one signed Indic panel, independent of Verri.
 * No manuscript is embedded; a signal contains only a neutral topic title.
 */
(()=>{
'use strict';
const SCENARIOS=new Set(['021','022','023','024','025']);
let opened=null,requesting=false;
function context(){try{return typeof STATE!=='undefined'?STATE.sync:null;}catch{return null;}}
function eligible(d){return SCENARIOS.has(d?.room?.scenario_id)
 &&d.room.state?.omerta_standalone===true&&d.room.status==='playing'
 &&Number(d.room.cycle)>=1&&Number(d.room.cycle)<=3
 &&['enqueteur','suspect'].includes(d.player?.public_role);}
function make(tag,label,cls){
 const item=document.createElement(tag);
 if(label!==undefined)item.textContent=label;
 if(cls)item.className=cls;
 return item;
}
function control(label,callback,cls='btn ghost'){
 const b=make('button',label,cls);
 b.type='button';b.addEventListener('click',callback);return b;
}
function message(error){
 const value=String(error?.message||'');
 if(value.includes('indic_three_canonical_topics_not_approved'))return 'Les renseignements de cette source ne sont pas encore validés.';
 if(value.includes('indic_one_official_report_per_cycle'))return 'Une seule transmission officielle par cycle est autorisée.';
 if(value.includes('indic_final_review_closed'))return 'Ce bilan est déjà enregistré ou le troisième cycle n’est pas terminé.';
 if(value.includes('indic_cannot_answer'))return 'Cette proposition ne peut plus être acceptée ou refusée.';
 if(value.includes('omerta_santoro_indic_closed'))return 'Cette action n’est plus disponible.';
 return 'Action refusée : vérifie ta phase de jeu et ta connexion.';
}
async function api(name,params={}){
 if(typeof rpc!=='function'||typeof STATE==='undefined')throw Error('rpc_unavailable');
 return rpc(name,{p_code:STATE.room||context()?.room?.code,p_player_token:STATE.token,...params});
}
async function refreshGame(){
 try{if(typeof syncNow==='function')await syncNow(true);}catch(error){console.warn('[SANTORO INDIC] sync',error);}
}
function modal(){
 document.querySelector('.igr-santoro-indic-modal')?.remove();
 const outer=make('div',undefined,'modal igr-santoro-indic-modal');
 const panel=make('div',undefined,'modal-box igr-santoro-indic-panel');
 panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');
 panel.setAttribute('aria-label','Source confidentielle Santoro');
 const head=make('span','OMERTÀ · SANTORO','omerta-eyebrow');
 const title=make('h2','Source confidentielle');
 const intro=make('p','Un pacte protège une personne ; il ne valide pas automatiquement ce qu’elle affirme.');
 const inner=make('section',undefined,'igr-santoro-indic-inner');
 const footer=make('div',undefined,'modal-actions');
 footer.append(control('Fermer',()=>outer.remove()));
 panel.append(head,title,intro,inner,footer);outer.append(panel);
 outer.addEventListener('click',event=>{if(event.target===outer)outer.remove();});
 document.body.append(outer);opened={outer,inner,footer};
 return opened;
}
async function act(kind,params={}){
 if(requesting)return;
 requesting=true;
 try{
  await api('igr_omerta_santoro_indic_action',{p_kind:kind,...params});
  await refreshGame();
  if(opened?.outer?.isConnected)await render();
 }catch(error){
  if(opened?.inner?.isConnected)opened.inner.append(make('p',message(error),'igr-santoro-indic-error'));
 }finally{requesting=false;}
}
function line(container,value,cls){container.append(make('p',value,cls));}
async function render(){
 const box=opened;
 if(!box?.outer?.isConnected||!eligible(context()))return;
 box.inner.replaceChildren(make('p','Consultation confidentielle…'));
 try{
  const status=await api('igr_omerta_santoro_indic_status');
  if(!box.outer.isConnected)return;
  box.inner.replaceChildren();
  if(!status?.available){line(box.inner,'Le pacte est indisponible dans cette partie.');return;}
  const d=context();
  const investigator=d.player.public_role==='enqueteur';
  if(!status.offered){
   if(!investigator){line(box.inner,'Aucune proposition de source ne t’a été adressée.');return;}
   if(!status.can_offer){line(box.inner,'Tu peux proposer un pacte avant le troisième cycle.');return;}
   const suspects=(d.players||[]).filter(p=>p.public_role==='suspect');
   if(!suspects.length){line(box.inner,'Aucun suspect admissible.');return;}
   const select=make('select',undefined,'igr-santoro-indic-select');
   for(const person of suspects){
    const option=make('option',person.pseudo||'Suspect');option.value=person.id;select.append(option);
   }
   line(box.inner,'Choisis la personne à qui proposer un accord confidentiel.');
   box.inner.append(select,control('Proposer le pacte',()=>act('offer',{p_target:select.value}),'btn primary'));
   return;
  }
  if(status.accepted===null){
   if(status.is_source){
    line(box.inner,'L’Enquêteur te propose un pacte. Tu restes libre de négocier oralement.');
    box.inner.append(control('Accepter le pacte',()=>act('answer',{p_value:true}),'btn primary'),
      control('Refuser',()=>act('answer',{p_value:false})));
   }else line(box.inner,'Proposition transmise. La réponse de la source est en attente.');
   return;
  }
  if(status.accepted===false){
   line(box.inner,'Le pacte a été refusé.');
   if(investigator&&Number(d.room.cycle)<=2){
    box.inner.append(control('Proposer à une autre personne',async()=>{
      const old=opened;
      old.inner.replaceChildren();
      const select=make('select',undefined,'igr-santoro-indic-select');
      for(const p of (d.players||[]).filter(p=>p.public_role==='suspect'&&p.id!==status.source_id)){
       const opt=make('option',p.pseudo);opt.value=p.id;select.append(opt);
      }
      old.inner.append(select,control('Envoyer la nouvelle proposition',()=>act('offer',{p_target:select.value}),'btn primary'));
    }));
   }
   return;
  }
  line(box.inner,status.is_source
   ?'Tu es Indic. Tu dois survivre, obtenir une protection ou une réduction de peine d’au moins trois ans, et être utile à l’Enquête.'
   :'L’Indic a accepté. Les sujets annoncés ne constituent pas, à eux seuls, une preuve.');
  const topics=Array.isArray(status.topics)?status.topics:[];
  if(status.is_source){
   for(const topic of topics){
    const item=make('div',undefined,'igr-santoro-indic-topic');
    item.append(make('strong',topic.title||'Sujet confidentiel'));
    const details=make('details');
    details.append(make('summary','Relire ce que je sais'),make('p',topic.detail||''));
    item.append(details);
    if(topic.logged)line(item,'Déjà consigné officiellement.');
    else {
     item.append(
      control(topic.signaled?'Renvoyer mon signal':'Je souhaite en parler',
       ()=>act('signal',{p_topic_id:topic.id})),
      control('J’en ai déjà parlé',
       ()=>act('spoken',{p_topic_id:topic.id}),'btn primary'));
    }
    box.inner.append(item);
   }
  }else if(investigator){
   for(const topic of topics){
    const summary=topic.logged?'Transmission consignée':topic.signaled?'Souhaite en parler':'Aucun signal';
    const item=make('p',(topic.title||'Sujet')+' · '+summary,'igr-santoro-indic-topic');
    box.inner.append(item);
   }
   if(!status.protected&&d.room.phase!=='locking')
    box.inner.append(control('Accorder la protection officielle',()=>act('protect'),'btn ghost'));
   if(Number(d.room.cycle)===3&&['cycle_debrief','locking'].includes(d.room.phase)){
    if(status.final_review_recorded){
     line(box.inner,'Bilan final enregistré et verrouillé.');
    }else{
     const rating=make('select',undefined,'igr-santoro-indic-select');
     for(const [value,caption] of [['','Évaluer l’utilité'],['yes','Oui · utile'],['no','Non · insuffisant']]){
      const option=make('option',caption);option.value=value;rating.append(option);
     }
     const reduction=make('select',undefined,'igr-santoro-indic-select');
     for(const [value,caption] of [['0','Pas de réduction'],['3','Réduction officielle de trois ans']]){
      const option=make('option',caption);option.value=value;reduction.append(option);
     }
     box.inner.append(make('h3','Bilan final de l’Indic'),rating,reduction,
      control('Enregistrer le bilan définitif',()=>{
       if(rating.value!=='yes'&&rating.value!=='no')return line(box.inner,'Choisis oui ou non.');
       if(!window.confirm('Confirmer ce bilan définitif ?'))return;
       act('review',{p_value:rating.value==='yes',p_reduction_years:Number(reduction.value)});
      },'btn primary'));
    }
   }
  }
 }catch(error){
  if(box.outer.isConnected){box.inner.replaceChildren();line(box.inner,message(error),'igr-santoro-indic-error');}
 }
}
function mount(){
 const d=context();
 const dock=document.querySelector('.omerta-decision-dock')||document.querySelector('.game-panel-v11');
 const old=document.querySelector('.igr-santoro-indic-entry');
 if(!eligible(d)||!dock){old?.remove();return;}
 if(old&&old.parentNode===dock)return;
 old?.remove();
 dock.append(control('Indic · pacte et renseignements',()=>{modal();render();},'btn ghost igr-santoro-indic-entry'));
}
function start(){
 mount();
 const observer=new MutationObserver(changes=>{if(changes.some(x=>x.addedNodes?.length||x.removedNodes?.length))mount();});
 observer.observe(document.body,{childList:true,subtree:true});
 window.addEventListener('pageshow',mount);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();