/* Inside Grey Room — OMERTÀ 021 / intelligence financière
 * L'échange est oral. La transmission officielle est volontaire et vérifiée côté serveur.
 * Ne jamais se fier à une affirmation client pour conclure qu'un fait est authentique.
 */
(function(){
  'use strict';
  const SID='021';
  const FORBIDDEN=new Set(['briefing','provisional_lock','final_debrief','locking','reveal']);
  const BLOCKED_MESSAGE={
    intel_unavailable:'La transmission n’est plus disponible.',
    intel_not_owned_or_unavailable:'Cette information ne t’appartient pas ou a déjà été transmise.',
    one_intel_per_cycle:'Tu as déjà transmis un renseignement pendant ce cycle.',
    intel_already_received:'L’Enquêteur connaît déjà ce renseignement.',
    investigator_not_found:'L’Enquêteur n’est pas présent.'
  };
  function current(){
    try { return typeof STATE==='undefined' ? null : STATE.sync; } catch(_) { return null; }
  }
  function eligible(d){
    const room=d?.room, me=d?.player;
    if(!room||!me||room.scenario_id!==SID||room.status!=='playing'||Number(room.cycle)<2||FORBIDDEN.has(room.phase)||me.public_role!=='suspect')return false;
    const text=String(me.private_state?.hide||'').toLowerCase();
    return text.includes('l’argent devait en partie remonter')||text.includes('les comptes indiquent une somme supplémentaire');
  }
  function createButton(label,cls,cb){
    const b=document.createElement('button');b.type='button';b.className=cls;b.textContent=label;b.addEventListener('click',cb);return b;
  }
  function close(){document.querySelector('.igr-money-intel-modal')?.remove();}
  function errorText(err){const s=String(err?.message||'');for(const [key,msg] of Object.entries(BLOCKED_MESSAGE))if(s.includes(key))return msg;return 'Transmission indisponible. Réessaie pendant le cycle actif.';}
  async function open(){
    const d=current();
    if(!eligible(d)||typeof rpc!=='function')return;
    close();
    const modal=document.createElement('div');
    modal.className='modal igr-money-intel-modal';
    const panel=document.createElement('div');panel.className='modal-box igr-money-intel-panel';
    const eyebrow=document.createElement('span');eyebrow.className='omerta-eyebrow';eyebrow.textContent='OMERTÀ · SOURCE CONFIDENTIELLE';
    const heading=document.createElement('h2');heading.textContent='Les transferts d’argent';
    const expl=document.createElement('p');expl.textContent='Parle d’abord librement avec l’Enquêteur. Ensuite seulement, décide si tu assumes de lui transmettre officiellement ce renseignement.';
    const note=document.createElement('p');note.className='igr-money-intel-note';note.textContent='La transmission sera enregistrée. Elle pourra révéler que quelqu’un parle à la police.';
    const slot=document.createElement('div');slot.className='igr-money-intel-card';slot.textContent='Consultation du dossier privé…';
    const actions=document.createElement('div');actions.className='modal-actions';
    const cancel=createButton('Retour à la table','btn ghost',close);
    actions.appendChild(cancel);
    panel.append(eyebrow,heading,expl,note,slot,actions);modal.appendChild(panel);
    modal.addEventListener('click',e=>{if(e.target===modal)close();});
    document.body.appendChild(modal);
    try{
      const out=await rpc('igr_omerta_money_intel_options',{
        p_code:d.room.code,p_player_token:STATE.token
      });
      if(!modal.isConnected)return;
      slot.replaceChildren();
      const card=Array.isArray(out?.cards)?out.cards[0]:null;
      if(!card){
        slot.textContent=out?.already_sent?'Ce renseignement a déjà été transmis.':'Aucun renseignement financier à transmettre à ce stade.';
        return;
      }
      const name=document.createElement('strong');name.textContent=card.title||'Renseignement';
      const detail=document.createElement('p');detail.textContent=card.detail||'';
      slot.append(name,detail);
      const send=createButton('Transmettre à l’Enquêteur','btn primary',async()=>{
        if(!confirm('Confirmer cette transmission ? Elle ne pourra plus être annulée.'))return;
        send.disabled=true;
        try{
          const live=current();
          if(!live||live.room?.code!==d.room.code||live.player?.id!==d.player?.id){throw new Error('intel_unavailable');}
          const sent=await rpc('igr_omerta_money_intel_send',{
            p_code:d.room.code,p_player_token:STATE.token,p_card_id:card.id
          });
          if(sent?.ok!==true)throw new Error('intel_unavailable');
          slot.replaceChildren();
          const done=document.createElement('strong');done.textContent='Transmission enregistrée';
          const message=document.createElement('p');message.textContent='L’Enquêteur a reçu ce renseignement dans son dossier privé. Continue la partie oralement.';
          slot.append(done,message);send.remove();
          try {if(typeof syncNow==='function')await syncNow(true);}catch(syncError){console.warn('[OMERTA] synchronisation après transmission',syncError);}
        }catch(err){
          console.error('[OMERTA] transmission',err);
          if(modal.isConnected){const message=document.createElement('p');message.className='igr-money-intel-error';message.textContent=errorText(err);slot.appendChild(message);}
          send.disabled=false;
        }
      });
      actions.insertBefore(send,cancel);
    }catch(err){
      console.warn('[OMERTA] carte indisponible',err);
      if(modal.isConnected)slot.textContent='Impossible de consulter cette carte. La transmission n’a pas été effectuée.';
    }
  }
  function mount(){
    const d=current(),dock=document.querySelector('.omerta-decision-dock');
    if(!dock||!eligible(d))return;
    if(dock.querySelector('.igr-money-intel-entry'))return;
    const button=createButton('Transmettre un renseignement financier','btn ghost igr-money-intel-entry',open);
    button.setAttribute('aria-label','OMERTÀ : ouvrir la carte Les transferts d’argent');
    dock.appendChild(button);
  }
  function init(){
    mount();
    const root=document.body;
    if(!root)return;
    const watcher=new MutationObserver(records=>{
      // Ne réagit qu'aux éléments nouveaux, pas aux styles de la modale.
      if(records.some(r=>r.addedNodes.length))mount();
    });
    watcher.observe(root,{childList:true,subtree:true});
    window.addEventListener('pageshow',mount);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
