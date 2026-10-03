/* Inside Grey Room — TERREUR 026–028 gameplay runtime v33
   Server-authored crisis state. No tactical simulation. */
(()=>{
  'use strict';
  const IDS=new Set(['026','027','028']);
  const POST_C3=new Set(['closed','provisional_orals','provisional_lock','defense','final_debrief','locking','reveal']);
  let checkpointBusy=false;
  let checkpointBackoffUntil=0;

  const sid=()=>String(STATE?.sync?.room?.scenario_id||STATE?.scenarioId||'');
  const isTerror=()=>IDS.has(sid());
  const esc=s=>typeof h==='function'?h(String(s??'')):String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const playerRole=()=>String(STATE?.sync?.player?.public_role||STATE?.role||'');
  const state=()=>STATE?.sync?.room?.state||{};
  const runtime=()=>state().terror_runtime||{};
  const world=()=>state().dlc_world||{};

  function desiredStage(d){
    const cycle=Number(d?.room?.cycle||0),phase=String(d?.room?.phase||'');
    if(cycle<2)return 0;
    if(cycle===2)return 1;
    if(cycle>=3&&POST_C3.has(phase))return 3;
    return 2;
  }

  async function ensureCheckpoint(d){
    if(!d||!IDS.has(String(d.room?.scenario_id||''))||!STATE.room||!STATE.token)return;
    if(d.room.status!=='playing'&&d.room.status!=='finished')return;
    const current=Number(d.room?.state?.terror_runtime?.stage??-1),wanted=desiredStage(d);
    if(current===wanted||current>wanted||checkpointBusy||Date.now()<checkpointBackoffUntil)return;
    checkpointBusy=true;
    try{
      const out=await rpc('igr_v33_terror_checkpoint',{p_code:STATE.room,p_player_token:STATE.token});
      if(out?.world)d.room.state.dlc_world=out.world;
      if(out?.runtime)d.room.state.terror_runtime=out.runtime;
      if(STATE.sync===d&&STATE.view==='game')renderGame();
    }catch(e){
      console.warn('terror checkpoint',e);
      checkpointBackoffUntil=Date.now()+30000;
    }finally{checkpointBusy=false}
  }

  const perimeterLabel=v=>({stable:'STABLE',strained:'SOUS PRESSION',critical:'CRITIQUE',isolated:'ISOLÉ',collapsed:'ROMPU'})[v]||String(v||'—').toUpperCase();
  const liaisonLabel=v=>({active:'ACTIVE',degraded:'DÉGRADÉE',limited:'LIMITÉE',last:'DERNIÈRE LIAISON',lost:'ROMPUE'})[v]||String(v||'—').toUpperCase();
  const assessmentLabel=v=>({incertaine:'INCERTAINE',plausible:'PLAUSIBLE',solide:'SOLIDE',faible:'FAIBLE',forte:'FORTE'})[v]||'NON VERROUILLÉE';

  function mapBlocks(w){
    const total=Math.max(1,Number(w.districts_total||12)),controlled=Math.max(0,Math.min(total,Number(w.districts_controlled||0)));
    return `<div class="terror-v33-map" aria-label="${controlled} secteurs encore contrôlés sur ${total}">${Array.from({length:total},(_,i)=>`<span class="${i<controlled?'held':'lost'}"></span>`).join('')}</div>`;
  }

  function lostResources(rt){
    const items=Array.isArray(rt.lost_resources)?rt.lost_resources:[];
    if(!items.length)return '<div class="terror-v33-muted">Aucune ressource d’enquête perdue à ce stade.</div>';
    return `<div class="terror-v33-losses">${items.map(x=>`<span>${esc(x)}</span>`).join('')}</div>`;
  }

  function buttons(axis,values,locked){
    if(locked)return '';
    return `<div class="terror-v33-actions">${values.map(([v,l])=>`<button class="btn ghost small" type="button" onclick="terrorV33Rate('${axis}','${v}')">${esc(l)}</button>`).join('')}</div>`;
  }

  function scenarioBody(id,rt,w){
    const role=playerRole();
    if(id==='026'){
      return `<div class="terror-v33-section"><b>RESSOURCES D'ENQUÊTE</b><p>La ville tombe autour de la Grey Room. Les pertes retirent des possibilités de recoupement, jamais du temps de parole.</p>${lostResources(rt)}</div>`;
    }
    if(id==='027'){
      const a=rt.assessments||{},cred=a.credibility,sinc=a.sincerity,decision=rt.decision;
      const canDecision=role==='enqueteur'&&String(STATE?.sync?.room?.phase||'')==='locking'&&!decision&&cred&&sinc;
      return `<div class="terror-v33-grid">
        <div class="terror-v33-assessment"><small>INFORMATION CRÉDIBLE ? · ENQUÊTEUR</small><strong>${esc(assessmentLabel(cred))}</strong>${role==='enqueteur'?buttons('credibility',[['incertaine','Incertaine'],['plausible','Plausible'],['solide','Solide']],!!cred):''}</div>
        <div class="terror-v33-assessment"><small>SOURCE SINCÈRE ? · ANALYSTE</small><strong>${esc(assessmentLabel(sinc))}</strong>${role==='analyste'?buttons('sincerity',[['faible','Faible'],['incertaine','Incertaine'],['forte','Forte']],!!sinc):''}</div>
      </div>
      ${decision?`<div class="terror-v33-decision locked"><small>DÉCISION EXTÉRIEURE VERROUILLÉE</small><strong>${esc(String(decision).toUpperCase())}</strong><p>${esc(rt.decision_outcome||'')}</p></div>`:''}
      ${canDecision?`<div class="terror-v33-decision"><small>RECOMMANDATION FINALE · IRRÉVERSIBLE</small><p>Le verdict judiciaire ne décide pas automatiquement de l’action extérieure. Verrouille une recommandation abstraite après consultation du groupe.</p><div class="terror-v33-actions"><button class="btn ghost small" onclick="terrorV33Decision('intervenir')">Intervenir</button><button class="btn primary small" onclick="terrorV33Decision('retarder')">Retarder</button><button class="btn ghost small" onclick="terrorV33Decision('annuler')">Annuler</button></div></div>`:''}
      ${role==='enqueteur'&&String(STATE?.sync?.room?.phase||'')==='locking'&&!decision&&(!cred||!sinc)?'<div class="terror-v33-muted">La recommandation finale attend les deux évaluations indépendantes.</div>':''}`;
    }
    if(id==='028'){
      const selected=rt.selected_confirmation,missed=!!rt.missed_confirmation,canChoose=(role==='enqueteur'||role==='analyste')&&Number(rt.stage||0)>=2&&!selected&&!missed&&w.liaison!=='lost';
      return `<div class="terror-v33-section"><b>DERNIÈRE LIAISON</b><p>Une seule confirmation extérieure peut encore être obtenue. Les autres pistes ne deviennent pas fausses : elles resteront non confirmées.</p>
      ${selected?`<div class="terror-v33-confirmation locked"><small>CONFIRMATION CHOISIE</small><strong>${esc(rt.selected_confirmation_label||selected)}</strong><p>${esc(rt.confirmation_result||'')}</p></div>`:''}
      ${missed&&!selected?'<div class="terror-v33-confirmation missed"><strong>LIAISON ROMPUE</strong><p>Aucune confirmation supplémentaire n’a été verrouillée avant la rupture.</p></div>':''}
      ${canChoose?`<div class="terror-v33-actions stacked"><button class="btn ghost" onclick="terrorV33Confirm('identite')">Confirmer une identité</button><button class="btn ghost" onclick="terrorV33Confirm('chronologie')">Confirmer la chronologie</button><button class="btn ghost" onclick="terrorV33Confirm('relais')">Confirmer le relais intérieur</button></div>`:''}
      ${lostResources(rt)}</div>`;
    }
    return '';
  }

  function renderRuntimePanel(){
    if(!isTerror()||STATE.view!=='game')return;
    const strip=document.querySelector('.phase-strip');
    if(!strip)return;
    document.getElementById('terrorRuntimeV33')?.remove();
    const id=sid(),w=world(),rt=runtime();
    const controlled=Number(w.districts_controlled??(id==='026'?9:id==='027'?6:3)),total=Number(w.districts_total||12);
    const signatures={'026':'LE PÉRIMÈTRE','027':'VRAI ≠ SINCÈRE','028':'DERNIÈRE LIAISON'};
    const el=document.createElement('section');el.id='terrorRuntimeV33';el.className='terror-v33-runtime';
    el.innerHTML=`<div class="terror-v33-head"><div><small>TERREUR · ${esc(signatures[id])}</small><strong>LA VILLE QUI TOMBE</strong></div><span>CHECKPOINT ${Math.max(0,Number(rt.stage||0))}/3</span></div>
      <div class="terror-v33-metrics"><div><small>VILLE</small><strong>${controlled}/${total}</strong></div><div><small>PÉRIMÈTRE</small><strong>${esc(perimeterLabel(w.perimeter||'stable'))}</strong></div><div><small>LIAISON</small><strong>${esc(liaisonLabel(w.liaison||'active'))}</strong></div></div>
      ${mapBlocks({...w,districts_controlled:controlled,districts_total:total})}
      ${scenarioBody(id,rt,w)}`;
    strip.insertAdjacentElement('afterend',el);
  }

  window.terrorV33Rate=async function(axis,value){
    try{
      await rpc('igr_v33_terror_rate',{p_code:STATE.room,p_player_token:STATE.token,p_axis:axis,p_value:value});
      await syncNow(true);toast('Évaluation verrouillée.');
    }catch(e){console.error(e);toast('Impossible de verrouiller cette évaluation.')}
  };

  window.terrorV33Decision=async function(decision){
    const ok=typeof appConfirm==='function'?await appConfirm({title:'Verrouiller la recommandation ?',text:'Cette recommandation extérieure est irréversible pour cette partie.',confirmLabel:'Verrouiller'}):confirm('Verrouiller cette recommandation ?');
    if(!ok)return;
    try{
      await rpc('igr_v33_terror_decide_027',{p_code:STATE.room,p_player_token:STATE.token,p_decision:decision});
      await syncNow(true);toast('Recommandation transmise.');
    }catch(e){console.error(e);toast('La recommandation ne peut pas encore être verrouillée.')}
  };

  window.terrorV33Confirm=async function(choice){
    const ok=typeof appConfirm==='function'?await appConfirm({title:'Utiliser la dernière liaison ?',text:'Une seule confirmation extérieure est possible. Les autres pistes resteront non confirmées.',confirmLabel:'Confirmer'}):confirm('Utiliser la dernière liaison ?');
    if(!ok)return;
    try{
      await rpc('igr_v33_terror_confirm_028',{p_code:STATE.room,p_player_token:STATE.token,p_choice:choice});
      await syncNow(true);toast('Dernière confirmation verrouillée.');
    }catch(e){console.error(e);toast('La liaison n’est plus disponible ou a déjà été utilisée.')}
  };

  if(typeof renderGame==='function'){
    const baseRenderGame=renderGame;
    renderGame=function(){baseRenderGame.apply(this,arguments);renderRuntimePanel()};
  }
  if(typeof performSync==='function'){
    const basePerformSync=performSync;
    performSync=async function(force=false){
      const d=await basePerformSync.call(this,force);
      await ensureCheckpoint(d);
      return d;
    };
  }
})();
