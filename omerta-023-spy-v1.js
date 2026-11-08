/* OMERTA 023 — La Table: private, variant-pinned mole and fair evidence play.
 * Never ship A/B/C answers, card details, actor identity or role mappings.
 * The server authorizes the cover actor, signs each cycle, and scores the end.
 */
(()=>{
 'use strict';
 const CASE='023',ENTRY='igr-023-spy-entry',MODAL='igr-023-spy-modal';
 const getState=()=>{try{return typeof STATE!=='undefined'?STATE.sync:null;}catch{return null;}};
 const isCase=d=>d?.room?.scenario_id===CASE&&d?.room?.state?.omerta_standalone===true
   &&['playing','finished'].includes(d?.room?.status);
 const who=d=>d?.player?.public_role||'';
 const spy=d=>who(d)==='suspect'&&d?.player?.private_state?.spy_mission?.role==='taupe';
 const investigator=d=>['enqueteur','analyste'].includes(who(d))
   &&(Number(d.room.cycle)>=3||d.room.status==='finished');
 const n=(tag,value,cls)=>{
   const item=document.createElement(tag);
   if(value!==undefined)item.textContent=String(value);
   if(cls)item.className=cls;
   return item;
 };
 const action=(label,handler,primary=false)=>{
   const b=n('button',label,'btn '+(primary?'primary':'ghost'));
   b.type='button';b.addEventListener('click',handler);return b;
 };
 const call=(name,extra={})=>{
   if(typeof rpc!=='function'||typeof STATE==='undefined')throw Error('Connexion indisponible.');
   const d=getState();
   return rpc(name,{p_code:STATE.room||d?.room?.code,p_player_token:STATE.token,...extra});
 };
 const reload=async()=>{try{if(typeof syncNow==='function')await syncNow(true);}catch(e){console.warn('[TAUPE 023] sync',e);}};
 const message=e=>{
   const s=String(e?.message||e||'');
   for(const [code,label] of Object.entries({
     spy_feature_unreleased:'Cette mécanique est encore en préparation.',
     spy_cycle_choice_already_sealed:'Une seule décision est autorisée par cycle.',
     spy_action_outside_active_cycle:'Choix indisponible pendant cette phase.',
     spy_not_your_private_role:'Cette mission est réservée à un autre personnage.',
     spy_official_informant_conflict:'Un pacte officiel d’Indic remplace la mission clandestine.',
     spy_accusation_already_sealed:'Une accusation a déjà été déposée.',
     spy_accusation_outside_final_lock:'Cette accusation n’est possible qu’au verrouillage du cycle III.',
     spy_two_independent_sources_required:'Deux pièces documentaires indépendantes sont obligatoires.',
     spy_no_two_documented_traces:'Les deux traces indépendantes ne sont pas disponibles.'
   }))if(s.includes(code))return label;
   return /unauthorized|401|403/i.test(s)?'Accès refusé pour ce joueur.':'Action indisponible : '+s.slice(0,135);
 };
 const section=(parent,title,body)=>{
   const box=n('section',undefined,'igr-023-spy-section');
   box.append(n('h3',title),n('p',body));parent.append(box);return box;
 };
 function overlay(){
   document.querySelector('.'+MODAL)?.remove();
   const backdrop=n('div',undefined,'modal '+MODAL);
   const card=n('div',undefined,'modal-box igr-023-spy-card');
   card.setAttribute('role','dialog');card.setAttribute('aria-modal','true');
   card.setAttribute('aria-label','La Table · mission et preuves');
   const header=n('span','OMERTÀ · LA TABLE','omerta-eyebrow');
   const content=n('div',undefined,'igr-023-spy-content');
   const footer=n('div',undefined,'modal-actions');
   footer.append(action('Fermer',()=>backdrop.remove()));
   card.append(header,n('h2','Correspondance clandestine'),content,footer);
   backdrop.append(card);
   backdrop.addEventListener('click',e=>{if(e.target===backdrop)backdrop.remove();});
   document.body.append(backdrop);
   return {outer:backdrop,content,footer};
 }
 function renderSpy(modal,data){
   section(modal.content,data.title||'Mission confidentielle',
     data.private_context||'Consulte ta fiche privée pour la mission.');
   section(modal.content,'Contact et couverture',
     'Contact : '+(data.sponsor||'confidentiel')+
     '. Ne divulgue pas ta mission hors de ton rôle.');
   section(modal.content,'Cycle I',data.cycle1_mission||'');
   section(modal.content,'Cycle II',data.cycle2_mission||'');
   section(modal.content,'Conditions de victoire',data.win_rule||'');
   const history=Array.isArray(data.actions)?data.actions:[];
   const pointCount=history.reduce((sum,x)=>sum+(Number(x.points)||0),0);
   const progress=n('p','Progression : '+pointCount+' point(s) · '+history.length+'/2 cycle(s) scellé(s).',
     'igr-023-spy-progress');
   modal.content.append(progress);
   for(const record of history){
     const txt='Cycle '+(Number(record.cycle)===1?'I':'II')+' · '
       +(record.kind==='relay'?'Transmission détaillée':'Relais discret')
       +' · '+record.points+' point(s).';
     modal.content.append(n('p',txt,'igr-023-spy-sealed'));
   }
   if(data.result){
     const result=data.result;
     section(modal.content,'Bilan de la mission',
       result.official_informant_defection?'Mission clandestine abandonnée après un pacte officiel d’Indic.'
       :result.won?'Mission clandestine réussie : renseignement transmis et couverture préservée.'
       :result.exposed_by_signed_accusation?'Couverture perdue : identification documentée par l’Enquêteur.'
       :'Objectif non atteint : transmissions insuffisantes ou cycle manquant.');
     return;
   }
   if(data.can_act!==true){
     modal.content.append(n('p','Aucune décision clandestine possible pendant cette phase ou ce cycle.',
       'igr-023-spy-note'));
     return;
   }
   const cycle=Number(data.cycle);
   const area=n('div',undefined,'igr-023-spy-actions');
   const opts=[
     {kind:'relay',label:'Transmission détaillée · 2 points',
      note:'Progression forte. Les traces documentaires seront plus précises au cycle III.'},
     {kind:'cover',label:'Relais discret · 1 point',
      note:'Progression limitée. Le document final sera moins précis, mais pas inexistant.'}
   ];
   for(const option of opts){
     const row=n('section',undefined,'igr-023-spy-option');
     row.append(n('p',option.note));
     const button=action(option.label,async()=>{
       if(!window.confirm('Sceller ce choix pour le cycle '+(cycle===1?'I':'II')+' ? Il est irréversible.'))return;
       area.querySelectorAll('button').forEach(x=>x.disabled=true);
       try{
         const out=await call('igr_omerta_023_spy_action',{p_kind:option.kind});
         if(out?.sealed!==true)throw Error('Décision non enregistrée.');
         modal.outer.remove();await reload();
       }catch(e){
         modal.content.append(n('p',message(e),'igr-023-spy-error'));
         area.querySelectorAll('button').forEach(x=>x.disabled=false);
       }
     },option.kind==='relay');
     row.append(button);area.append(row);
   }
   modal.content.append(n('h3','Décision du cycle '+(cycle===1?'I':'II')),area);
 }
 function renderEvidence(modal,data,d){
   const docs=Array.isArray(data.evidence)?data.evidence:[];
   section(modal.content,'Enquête documentaire',
     'Les deux sources sont indépendantes. Elles permettent de rechercher une taupe, '
     +'mais ne prouvent pas automatiquement quel joueur contrôlait le poste utilisé.');
   if(docs.length!==2){
     modal.content.append(n('p',
       'Aucune paire documentaire suffisante : aucune accusation spéciale possible.',
       'igr-023-spy-note'));return;
   }
   for(const doc of docs){
     const box=section(modal.content,doc.origin||'Document recoupé',doc.text||'');
     box.append(n('small',doc.precision?.includes('indirect')?'Correspondance indirecte':'Correspondance détaillée'));
   }
   if(d.room.status==='finished'){
     section(modal.content,'Résultat de la piste',
       data.submitted!==true?'Aucune accusation clandestine n’a été scellée.'
       :data.correct===true?'Le joueur désigné était bien la taupe.'
       :'La désignation n’a pas identifié la taupe.');
     return;
   }
   if(data.submitted===true){
     modal.content.append(n('p','Accusation scellée : son exactitude ne sera révélée qu’après le verdict principal.',
       'igr-023-spy-note'));return;
   }
   if(data.can_accuse!==true)return;
   const suspects=(d.players||[]).filter(x=>x.public_role==='suspect'&&x.id);
   if(!suspects.length)return;
   const label=n('label','Désignation unique · sélectionner un suspect');
   const select=n('select',undefined,'igr-023-spy-select');
   const empty=n('option','Choisir un joueur');empty.value='';select.append(empty);
   for(const suspect of suspects){const option=n('option',suspect.pseudo||'Suspect');option.value=suspect.id;select.append(option);}
   label.append(select);modal.content.append(label);
   const submit=action('Sceller la désignation de la taupe',async()=>{
     if(!select.value)return;
     if(!window.confirm('Une seule accusation possible. Les deux pièces sont-elles pertinentes pour ce joueur ?'))return;
     submit.disabled=true;
     try{
       const result=await call('igr_omerta_023_spy_accuse',{
         p_target:select.value,p_evidence_ids:docs.map(x=>x.id)
       });
       if(result?.sealed!==true)throw Error('Accusation non reçue.');
       modal.outer.remove();await reload();
     }catch(e){modal.content.append(n('p',message(e),'igr-023-spy-error'));submit.disabled=false;}
   },true);
   modal.content.append(submit);
   modal.content.append(n('p',
     'Cette accusation est distincte des actes criminels du verdict principal. Elle ne prouve aucun ordre d’attaque.',
     'igr-023-spy-note'));
 }
 async function open(){
   const d=getState();if(!isCase(d))return;
   const modal=overlay();
   modal.content.append(n('p','Consultation du dossier authentifié…'));
   try{
     const data=await call('igr_omerta_023_spy_status');
     if(!modal.outer.isConnected)return;
     modal.content.replaceChildren();
     if(data?.spy===true)renderSpy(modal,data);
     else if(data?.investigation===true)renderEvidence(modal,data,d);
     else modal.content.append(n('p','Aucune mission accessible pour ce joueur.'));
   }catch(e){
     if(!modal.outer.isConnected)return;
     modal.content.replaceChildren(n('p',message(e),'igr-023-spy-error'));
   }
 }
 function mount(){
   const d=getState(),target=document.querySelector('.omerta-decision-dock')
     ||document.querySelector('.game-panel-v11');
   const allowed=!!target&&isCase(d)&&(spy(d)||investigator(d));
   document.querySelectorAll('.'+ENTRY).forEach(b=>{if(!allowed||b.parentElement!==target)b.remove();});
   if(!allowed||target.querySelector('.'+ENTRY))return;
   const label=spy(d)?'La taupe · ma mission privée':'La Table · deux traces à recouper';
   const button=action(label,open,true);button.classList.add(ENTRY);
   button.setAttribute('aria-label',label);
   target.append(button);
 }
 function init(){
   mount();if(!document.body)return;
   const observer=new MutationObserver(records=>{
     if(records.some(x=>x.addedNodes?.length||x.removedNodes?.length))mount();
   });
   observer.observe(document.body,{childList:true,subtree:true});
   window.addEventListener('pageshow',mount);
 }
 if(document.readyState==='loading')
   document.addEventListener('DOMContentLoaded',init,{once:true});
 else init();
})();
