/* DLC TERROR v681 — shared fictional city and server-authoritative siege. */
(()=>{
  'use strict';
  const IDS=new Set(['026','027','028']);
  const isTerror=(d=STATE?.sync)=>IDS.has(String(d?.room?.scenario_id||STATE?.scenarioId||STATE?.selectedScenario||''));
  const esc=v=>typeof h==='function'?h(String(v??'')):String(v??'').replace(/[&<>"']/g,'');
  const qCache=new Map();
  const safeNum=(x,min,max)=>Math.min(max,Math.max(min,Number(x)||0));
  let previousCityKey='';
  let previousControlled=null;
  const sid=()=>String(STATE?.sync?.room?.scenario_id||'');
  const live=()=>STATE?.sync?.room?.state?.terror_v681||{};
  const phaseName=()=>String(STATE?.sync?.room?.phase||'');
  const role=()=>String(STATE?.sync?.player?.public_role||'');
  function cityName(){return live().city||''}

  function citySetup(){
    const d=STATE?.sync;if(!d||!isTerror(d)||d.room.status!=='lobby')return;
    const target=document.querySelector('.lobby-v11');if(!target)return;
    document.getElementById('terrorV681CityLobby')?.remove();
    const city=cityName(),canSet=!!STATE.hostToken;
    const section=document.createElement('section');
    section.className='terror-v681-city-lobby';section.id='terrorV681CityLobby';
    section.innerHTML='<div class="terror-v681-city-head"><span>TERREUR · LOCALISATION DU DOSSIER</span><b>Quelle ville le groupe défendra-t-il ?</b></div>'+
      '<p>Une seule ville choisie collectivement. Son nom sera affiché à tous les joueurs pendant la chute fictive de douze secteurs. Aucune géolocalisation.</p>'+
      (city?'<div class="terror-v681-current-city">VILLE DU DOSSIER · <strong>'+esc(city)+'</strong></div>':
       '<div class="terror-v681-warning">La ville doit être indiquée avant de lancer cette partie.</div>')+
      (canSet?'<div class="terror-v681-city-entry"><label for="terrorV681CityName">Nom de la ville (2 à 36 caractères)</label>'+
       '<div class="terror-v681-input-row"><input id="terrorV681CityName" maxlength="36" autocomplete="off" placeholder="Ex. : Bagdad, Genève, Paris" value="'+esc(city)+'"><button type="button" class="btn primary" onclick="terrorV681SetCity()">Valider la ville</button></div></div>':
       '<p class="terror-v681-muted">L’hôte valide la ville retenue par les joueurs. Elle devient commune à toute la partie.</p>');
    target.insertAdjacentElement('beforebegin',section);
  }
  window.terrorV681SetCity=async()=>{
    const city=String(document.getElementById('terrorV681CityName')?.value||'').trim();
    if(city.length<2||city.length>36){toast('Entre un nom de ville de 2 à 36 caractères.');return;}
    try{
      await rpc('igr_v681_terror_set_city',{p_code:STATE.room,p_host_token:STATE.hostToken,p_city:city});
      await syncNow(true);toast('Ville du dossier enregistrée pour tous.');
    }catch(e){console.error('terror city',e);toast('Impossible de valider ce nom de ville.');}
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
    if(previousCityKey!==r.code){previousCityKey=r.code;previousControlled=null;}
    const squares=Array.from({length:total},(_,i)=>{
      const held=i<controlled,fallen=changed&&i>=controlled&&i<previousControlled;
      return '<div class="terror-v681-district '+(held?'is-held':'is-lost')+(fallen?' is-falling':'')+
       '" role="listitem" aria-label="Secteur '+String(i+1)+' : '+(held?'encore administré':'hors de contrôle')+'">'+
       '<span>SECTEUR '+String(i+1).padStart(2,'0')+'</span><b>'+(held?'SOUS CONTRÔLE':'PERDU')+'</b></div>';
    }).join('');
    previousControlled=controlled;
    const stage=safeNum(w.last_scored_cycle,0,3);
    const history=Array.isArray(w.history)?w.history:[];
    const last=history.length?history[history.length-1]:null;
    const section=document.createElement('section');section.id='terrorV681Board';
    section.className='terror-v681-live'+(changed?' terror-v681-breakthrough':'');
    section.innerHTML='<div class="terror-v681-head"><div><small>TERREUR · '+esc(title)+'</small>'+
       '<h2>'+esc(city.toUpperCase())+' <span>SE DÉSAGRÈGE</span></h2><p>'+esc(subtitle)+'</p></div>'+
       '<div class="terror-v681-synch"><span class="terror-v681-dot"></span> ÉTAT COMMUN · DIRECT</div></div>'+
       '<div class="terror-v681-stats"><div><small>SECTEURS ADMINISTRÉS</small><strong>'+controlled+'<em> / 12</em></strong></div>'+
       '<div><small>PRESSION DU SIÈGE</small><strong>'+Math.round(pressure)+'<em> / 100</em></strong></div>'+
       '<div><small>MENACE ACTUELLE</small><strong class="terror-v681-level">'+esc(statusLabel({controlled,pressure}))+'</strong></div></div>'+
       '<div class="terror-v681-meter" role="progressbar" aria-valuenow="'+Math.round(pressure)+'" aria-valuemin="0" aria-valuemax="100" aria-label="Pression du siège"><div style="width:'+pressure+'%"></div></div>'+
       '<div class="terror-v681-map-title"><b>ÉTAT DES 12 SECTEURS · '+esc(city)+'</b><small>Schéma fictif partagé, sans géographie réelle</small></div>'+
       '<div class="terror-v681-map" role="list" aria-label="Les douze secteurs de '+esc(city)+'">'+squares+'</div>'+
       '<div class="terror-v681-status"><span>Grey Room · centre judiciaire</span><strong>'+esc(last?.band||'La menace se rapproche à chaque cycle')+'</strong>'+
       '<small>Cycle évalué : '+stage+'/3 · Les réponses déterminent l’accélération à la fin du débrief.</small></div>';
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
    if(!qCache.has(key)){
      qCache.set(key,{pending:true});
      rpc('igr_v681_terror_get_questions',{p_code:STATE.room,p_player_token:STATE.token})
        .then(data=>{
          qCache.set(key,data?.enabled?data:{enabled:false});
          if(STATE.room&&STATE.view==='game'&&phaseName()==='cycle_debrief'&&
            [STATE.room,STATE.token,STATE.sync?.room?.cycle].join(':')===key)renderCurrent();
        })
        .catch(e=>{console.warn('terror quiz unavailable',e);qCache.set(key,{enabled:false,error:true});if(STATE.view==='game')renderCurrent();});
    }
    return qCache.get(key);
  }
  function quizForm(){
    if(myAction('terror_v681_quiz')||myAction('debrief'))return '<div class="locked-state">Tes réponses sont scellées. La situation de la ville évoluera quand le cycle sera clôturé.</div>';
    const set=promptForQuiz();
    if(!set||set.pending)return '<div class="locked-state">Réception des trois questions factuelles du dossier…</div>';
    if(!set.enabled||!Array.isArray(set.questions)||set.questions.length!==3)
      return '<div class="locked-state">Questionnaire indisponible. Le MJ n’affichera aucun score avant la clôture du cycle.</div>';
    const questions=set.questions.map((q,i)=>{
      const opts=Array.isArray(q.options)?q.options:[];
      return '<div class="field"><label for="terrorV681Q'+(i+1)+'">'+(i+1)+' · '+esc(q.title)+'</label>'+
      '<select id="terrorV681Q'+(i+1)+'"><option value="">Choisir une réponse…</option>'+
      opts.map((o,j)=>'<option value="'+['a','b','c'][j]+'">'+esc(o)+'</option>').join('')+
      '<option value="u">Je ne sais pas</option></select></div>';
    }).join('');
    return '<div class="qcm-v11 terror-v681-quiz"><h3>QUESTIONS DE CRISE · '+esc(cityName().toUpperCase())+'</h3>'+
      '<p class="choice-helper">Réponds individuellement. Trois questions fondées sur les faits examinés : les réponses ne sont corrigées qu’au niveau du rythme collectif, jamais pendant le questionnaire.</p>'+
      questions+
      '<div class="field"><label for="qConvergence">Le groupe est-il proche de la reconstruction ?</label><select id="qConvergence"><option value="0">Pas encore</option><option value="1">Partiellement</option><option value="2">Oui, largement</option></select></div>'+
      '<div class="field"><label for="qConfusion">Difficulté ressentie</label><select id="qConfusion"><option value="0">Faible</option><option value="1">Modérée</option><option value="2">Importante</option></select></div>'+
      '<div class="field"><label for="qAxis">Axe à approfondir</label><select id="qAxis"><option value="chronologie">Chronologie</option><option value="acces">Accès / déplacements</option><option value="mobile">Motivations</option><option value="materiel">Preuves matérielles</option><option value="responsabilite">Responsabilités</option></select></div>'+
      '<button type="button" class="btn primary block" onclick="terrorV681SubmitQuiz()">Sceller mes réponses · la ville attend</button></div>';
  }
  window.terrorV681SubmitQuiz=async()=>{
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
