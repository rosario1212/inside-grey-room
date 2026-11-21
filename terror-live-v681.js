/* DLC TERROR v681 — shared fictional city and server-authoritative siege. */
(()=>{
  'use strict';
  const IDS=new Set(['026','027','028']);
  const isTerror=(d=STATE?.sync)=>IDS.has(String(d?.room?.scenario_id||STATE?.scenarioId||STATE?.selectedScenario||''));
  const esc=v=>typeof h==='function'?h(String(v??'')):String(v??'').replace(/[&<>"']/g,'');
  const qCache=new Map(),quizDraft=new Map();
  const safeNum=(x,min,max)=>Math.min(max,Math.max(min,Number(x)||0));
  let previousCityKey='';
  let previousControlled=null;
  const sid=()=>String(STATE?.sync?.room?.scenario_id||'');
  const live=()=>STATE?.sync?.room?.state?.terror_v681||{};
  const phaseName=()=>String(STATE?.sync?.room?.phase||'');
  const role=()=>String(STATE?.sync?.player?.public_role||'');
  const quizKey=()=>[STATE.room,STATE.token,STATE?.sync?.room?.cycle].join(':');
  function cityName(){return live().city||''}

  function citySetup(){
    const d=STATE?.sync;if(!d||!isTerror(d)||d.room.status!=='lobby')return;
    const target=document.querySelector('.lobby-v11');if(!target)return;
    document.getElementById('terrorV681CityLobby')?.remove();
    const city=cityName(),canSet=!!STATE.hostToken;
    const section=document.createElement('section');
    section.className='terror-v681-city-lobby';section.id='terrorV681CityLobby';
    section.innerHTML='<div class="terror-v681-city-head"><span>TERREUR · LOCALISATION DU DOSSIER</span><b>Quel nom portera la dernière capitale libre ?</b></div>'+
      '<p>Choisis le nom de cette capitale fictive. Elle résiste au FDR, et ses douze secteurs seront suivis pendant la partie. Aucune géolocalisation.</p>'+
      (city?'<div class="terror-v681-current-city">CAPITALE D’ALMIZIA · <strong>'+esc(city)+'</strong></div>':
       '')+
      (canSet?'<div class="terror-v681-city-entry"><label for="terrorV681CityName">Nom de la capitale (2 à 36 caractères)</label>'+
       '<div class="terror-v681-input-row"><input id="terrorV681CityName" type="text" name="igr_almizia_capital" maxlength="36" autocomplete="off" autocapitalize="words" autocorrect="off" spellcheck="false" enterkeyhint="done" placeholder="Ex. : Almera" value="'+esc(city)+'"><button type="button" class="btn primary" onclick="terrorV681SetCity()">Enregistrer</button></div></div>':
       '<p class="terror-v681-muted">L’hôte valide la ville retenue par les joueurs. Elle devient commune à toute la partie.</p>');
    target.insertAdjacentElement('beforebegin',section);
    // Local to this input: tests and inactive pages never receive city events.
    section.querySelector?.('#terrorV681CityName')?.addEventListener('keydown',e=>{
      if(e.key!=='Enter')return;
      e.preventDefault();window.terrorV681SetCity();
    });
  }
  let citySaving=false;
  window.terrorV681SetCity=async()=>{
    if(citySaving)return;
    const city=String(document.getElementById('terrorV681CityName')?.value||'').trim();
    if(city.length<2||city.length>36){toast('Entre un nom de capitale de 2 à 36 caractères.');return;}
    citySaving=true;
    try{
      await rpc('igr_v681_terror_set_city',{p_code:STATE.room,p_host_token:STATE.hostToken,p_city:city});
      await syncNow(true);toast('Nom de la capitale enregistré pour tous les joueurs.');
    }catch(e){console.error('terror city',e);toast('Impossible d’enregistrer la capitale.');}
    finally{citySaving=false;}
  };


  function mood(id){return {
    '026':['LA VILLE TOMBE','Les sources institutionnelles disparaissent, mais les actes passés restent à prouver.'],
    '027':['LA ZONE ROUGE','La pression sur une recommandation ne transforme pas un renseignement en certitude.'],
    '028':['DERNIER PÉRIMÈTRE','Dernières liaisons, soupçons intérieurs et vérifications limitées.']
  }[id]||['TERREUR','Le périmètre se resserre.'];}
  function statusLabel(w){
    if(w.controlled<=0)return 'VILLE NON CONTRÔLÉE · LA GREY ROOM TIENT ENCORE';
    if(w.pressure>=75)return 'ENCERCLEMENT CRITIQUE';
    if(w.pressure>=48)return 'PÉRIMÈTRE ISOLÉ';
    if(w.pressure>=25)return 'SECTEURS SOUS PRESSION';
    return 'CONTRÔLE FRAGILE';
  }
  function renderCityBoard(){
    const d=STATE?.sync;if(!d||!isTerror(d)||STATE.view!=='game')return;
    const strip=document.querySelector('.phase-strip');if(!strip)return;
    document.getElementById('terrorV681Board')?.remove();
    const w=live(),total=12,controlled=safeNum(w.controlled,0,12),pressure=safeNum(w.pressure,0,100);
    const city=w.city||'VILLE NON CONFIGURÉE',r=d.room;
    const [title,subtitle]=mood(sid()),key=r.code+':'+(w.last_scored_cycle||0)+':'+controlled;
    const changed=previousCityKey===r.code && previousControlled!==null && controlled<previousControlled;
    const reclaimed=previousCityKey===r.code && previousControlled!==null && controlled>previousControlled;
    if(previousCityKey!==r.code){previousCityKey=r.code;previousControlled=null;}
    const squares=Array.from({length:total},(_,i)=>{
      const held=i<controlled,fallen=changed&&i>=controlled&&i<previousControlled,restored=reclaimed&&i>=previousControlled&&i<controlled;
      return '<div class="terror-v681-district '+(held?'is-held':'is-lost')+(fallen?' is-falling':'')+(restored?' is-recovered':'')+
       '" role="listitem" aria-label="Secteur '+String(i+1)+' : '+(held?'encore administré':'hors de contrôle')+'">'+
       '<span>SECTEUR '+String(i+1).padStart(2,'0')+'</span><b>'+(held?'SOUS CONTRÔLE':'PERDU')+'</b></div>';
    }).join('');
    previousControlled=controlled;
    const stage=safeNum(w.last_scored_cycle,0,3);
    const history=Array.isArray(w.history)?w.history:[];
    const last=history.length?history[history.length-1]:null;
    const civilian=Math.max(0,Math.min(6,Number(w.civilian_services||0)));
    const operationLabel=last?.military_order_label?String(last.military_order_label).toUpperCase():last?.military_operation==='proteger'?'PROTECTION DES CIVILS':last?.military_operation==='reconquerir'?'RECONQUÊTE LIMITÉE':'TENIR LES POSITIONS';
    const outcomeText=last?.military_order_text|| (last?.decision_effect==='national_reconquest'?
      'L’officier a ordonné une reconquête sur la base de renseignements vérifiés. Les forces nationales ont rétabli leur contrôle dans des secteurs disputés.':
      last?.decision_effect==='civilian_protection'?
      'L’officier a privilégié les habitants, les services et les preuves. Leur protection progresse, même si la défense a dû céder du terrain.':
      last?.decision_effect==='fdr_breakthrough'?
      'Des informations insuffisamment confirmées et la pression militaire ont permis au FDR de progresser plus rapidement.':
      'Les défenseurs tiennent plusieurs positions. L’état-major ne dispose pas encore des preuves permettant de reprendre un secteur.');
    const consequence=last?.correct_answers!==undefined?
      '<div class="terror-v681-consequence"><small>VOTRE IMPACT · CYCLE '+Number(last.cycle)+' · RAPPORT PUBLIC DE L’ÉTAT-MAJOR</small>'+
      '<strong>'+Number(last.correct_answers)+'/6 RÉPONSES EXACTES · '+esc(operationLabel)+'</strong>'+
      '<p>'+esc(outcomeText)+'</p>'+
      '<p>Continuité civile et archives : '+Number(last.civilian_services_after||0)+'/6 · '+esc(last.band||'')+'</p></div>':'';
    const section=document.createElement('section');section.id='terrorV681Board';
    section.className='terror-v681-live'+(changed?' terror-v681-breakthrough':'')+(reclaimed?' terror-v681-recovered':'');
    section.innerHTML='<div class="terror-v681-head"><div><small>TERREUR · '+esc(title)+'</small>'+
       '<h2>'+esc(city.toUpperCase())+' <span>'+esc(w.band==='CONTRE-OFFENSIVE NATIONALE'?'REPOUSSE LE FDR':'ASSIÉGÉE PAR LE FDR')+'</span></h2><p>'+esc(subtitle)+'</p></div>'+
       '<div class="terror-v681-synch"><span class="terror-v681-dot"></span> DERNIÈRE CAPITALE · DIRECT</div></div>'+
       '<div class="terror-v681-stats"><div><small>SECTEURS ADMINISTRÉS</small><strong>'+controlled+'<em> / 12</em></strong></div>'+
       '<div><small>PRESSION DU SIÈGE</small><strong>'+Math.round(pressure)+'<em> / 100</em></strong></div>'+
       '<div><small>MENACE ACTUELLE</small><strong class="terror-v681-level">'+esc(statusLabel({controlled,pressure}))+'</strong></div>'+ 
       '<div><small>SERVICES CIVILS SOUTENUS</small><strong>'+civil+'<em> / 6</em></strong></div></div>'+
       '<div class="terror-v681-meter" role="progressbar" aria-valuenow="'+Math.round(pressure)+'" aria-valuemin="0" aria-valuemax="100" aria-label="Pression du siège"><div style="width:'+pressure+'%"></div></div>'+
       '<div class="terror-v681-map-title"><b>CAPITALE D’ALMIZIA · '+esc(city)+' · LES 12 SECTEURS</b><small>Schéma fictif partagé, sans géographie réelle</small></div>'+
       '<div class="terror-v681-map" role="list" aria-label="Les douze secteurs de '+esc(city)+'">'+squares+'</div>'+
       '<div class="terror-v681-status"><span>Grey Room · centre judiciaire</span><strong>'+esc(last?.band||'La menace se rapproche à chaque cycle')+'</strong>'+
       '<small>Cycle évalué : '+stage+'/3 · Vos réponses influencent la chute ou la reprise des secteurs.</small></div>'+consequence;
    strip.insertAdjacentElement('afterend',section);
    const legacy=document.getElementById('terrorRuntimeV33');
    if(legacy){
      legacy.classList.add('terror-v681-legacy');
      for(const el of legacy.querySelectorAll('.terror-v33-head,.terror-v33-metrics,.terror-v33-map'))el.style.display='none';
      if(!legacy.querySelector('.terror-v681-legacy-label'))legacy.insertAdjacentHTML('afterbegin','<div class="terror-v681-legacy-label">MÉCANIQUE SPÉCIFIQUE AU DOSSIER · '+esc(title)+'</div>');
    }
  }
  function promptForQuiz(){
    const d=STATE?.sync;if(!d||!isTerror(d)||d.room.status!=='playing'||phaseName()!=='cycle_debrief'
      ||!['enqueteur','analyste'].includes(role()))return null;
    const key=[STATE.room,STATE.token,d.room.cycle].join(':');
    const prior=qCache.get(key);
    if(!prior||(prior.error&&Date.now()-Number(prior.failedAt||0)>=7000)){
      qCache.set(key,{pending:true});
      rpc('igr_v681_terror_get_questions',{p_code:STATE.room,p_player_token:STATE.token})
        .then(data=>{
          qCache.set(key,data?.enabled?data:{enabled:false});
          if(STATE.room&&STATE.view==='game'&&phaseName()==='cycle_debrief'&&
            [STATE.room,STATE.token,STATE.sync?.room?.cycle].join(':')===key)renderCurrent();
        })
        .catch(e=>{console.warn('terror quiz unavailable',e);qCache.set(key,{enabled:false,error:true,failedAt:Date.now()});if(STATE.view==='game')renderCurrent();});
    }
    return qCache.get(key);
  }
  window.terrorV681SaveDraft=()=>{
    if(!isTerror()||phaseName()!=='cycle_debrief'||!['enqueteur','analyste'].includes(role()))return;
    const k=quizKey(),draft={...(quizDraft.get(k)||{})};
    for(const id of ['terrorV681Q1','terrorV681Q2','terrorV681Q3','qConvergence','qConfusion','qAxis']){
      const field=document.getElementById(id);
      if(field)draft[id]=field.value;
    }
    quizDraft.set(k,draft);
  };
  window.terrorV681RetryQuiz=()=>{
    if(!isTerror()||phaseName()!=='cycle_debrief'||!['enqueteur','analyste'].includes(role()))return;
    qCache.delete(quizKey());
    promptForQuiz();
    if(typeof renderCurrent==='function')renderCurrent();
  };
  function quizForm(){
    if(myAction('terror_v681_quiz')||myAction('debrief')){quizDraft.delete(quizKey());return '<div class="locked-state">Tes réponses sont scellées. La situation de la ville évoluera quand le cycle sera clôturé.</div>';}
    const set=promptForQuiz();
    if(!set||set.pending)return '<div class="locked-state">Réception des trois questions factuelles du dossier…</div>';
    if(!set.enabled||!Array.isArray(set.questions)||set.questions.length!==3)
      return '<div class="locked-state">Le questionnaire n’a pas pu être chargé. Vérifie la connexion, puis réessaie. <button type="button" class="btn" onclick="terrorV681RetryQuiz()">Réessayer</button></div>';
    const draft=quizDraft.get(quizKey())||{};
    const selected=(id,value)=>String(draft[id]??'')===String(value)?' selected':'';
    const questions=set.questions.map((q,i)=>{
      const opts=Array.isArray(q.options)?q.options:[];
      return '<div class="field"><label for="terrorV681Q'+(i+1)+'">'+(i+1)+' · '+esc(q.title)+'</label>'+
      '<select id="terrorV681Q'+(i+1)+'" onchange="terrorV681SaveDraft()"><option value="">Choisir une réponse…</option>'+
      opts.map((o,j)=>'<option value="'+['a','b','c'][j]+'"'+selected('terrorV681Q'+(i+1),['a','b','c'][j])+'>'+esc(o)+'</option>').join('')+
      '<option value="u"'+selected('terrorV681Q'+(i+1),'u')+'>Je ne sais pas</option></select></div>';
    }).join('');
    return '<div class="qcm-v11 terror-v681-quiz"><h3>QUESTIONS DE CRISE · '+esc(cityName().toUpperCase())+'</h3>'+
      '<p class="choice-helper">Réponds individuellement. Trois questions fondées sur les faits examinés : les réponses ne sont corrigées qu’au niveau du rythme collectif, jamais pendant le questionnaire.</p>'+
      questions+
      '<div class="field"><label for="qConvergence">Le groupe est-il proche de la reconstruction ?</label><select id="qConvergence" onchange="terrorV681SaveDraft()"><option value="0"'+selected('qConvergence',0)+'>Pas encore</option><option value="1"'+selected('qConvergence',1)+'>Partiellement</option><option value="2"'+selected('qConvergence',2)+'>Oui, largement</option></select></div>'+
      '<div class="field"><label for="qConfusion">Difficulté ressentie</label><select id="qConfusion" onchange="terrorV681SaveDraft()"><option value="0"'+selected('qConfusion',0)+'>Faible</option><option value="1"'+selected('qConfusion',1)+'>Modérée</option><option value="2"'+selected('qConfusion',2)+'>Importante</option></select></div>'+
      '<div class="field"><label for="qAxis">Axe à approfondir</label><select id="qAxis" onchange="terrorV681SaveDraft()"><option value="chronologie"'+selected('qAxis','chronologie')+'>Chronologie</option><option value="acces"'+selected('qAxis','acces')+'>Accès / déplacements</option><option value="mobile"'+selected('qAxis','mobile')+'>Motivations</option><option value="materiel"'+selected('qAxis','materiel')+'>Preuves matérielles</option><option value="responsabilite"'+selected('qAxis','responsabilite')+'>Responsabilités</option></select></div>'+
      '<button type="button" class="btn primary block" onclick="terrorV681SubmitQuiz()">Sceller mes réponses · la ville attend</button></div>';
  }
  window.terrorV681SubmitQuiz=async()=>{
    window.terrorV681SaveDraft();
    const answers={};
    for(let i=1;i<=3;i++){
      const val=document.getElementById('terrorV681Q'+i)?.value;
      if(!['a','b','c','u'].includes(val)){toast('Réponds aux trois questions ou choisis « Je ne sais pas ».');return;}
      answers['q'+i]=val;
    }
    try{
      await rpc('igr_v681_terror_submit_quiz',{
        p_code:STATE.room,p_player_token:STATE.token,p_answers:answers,
        p_convergence:Number(document.getElementById('qConvergence')?.value||1),
        p_confusion:Number(document.getElementById('qConfusion')?.value||1),
        p_axis:document.getElementById('qAxis')?.value||'chronologie'
      });
      quizDraft.delete(quizKey());
      await syncNow(true);
      toast('Réponses scellées. Le prochain bulletin de situation sera public.');
    }catch(e){console.error('terror quiz',e);toast('Débrief déjà envoyé ou phase terminée.');}
  };
  if(typeof renderLobby==='function'){
    const base=renderLobby;
    renderLobby=function(){base.apply(this,arguments);citySetup();};
  }
  if(typeof startGame==='function'){
    const base=startGame;
    startGame=function(){
      if(isTerror()&&!cityName()){toast('Choisis d’abord la ville du DLC Terror dans le lobby.');return;}
      return base.apply(this,arguments);
    };
  }
  if(typeof renderDebriefForm==='function'){
    const base=renderDebriefForm;
    renderDebriefForm=function(){return isTerror()&&phaseName()==='cycle_debrief'?
       quizForm():base.apply(this,arguments);};
  }
  if(typeof renderGame==='function'){
    const base=renderGame;
    renderGame=function(){base.apply(this,arguments);renderCityBoard();};
  }
})();
