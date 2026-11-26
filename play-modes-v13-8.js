/* Inside Grey Room v13.8 — Dual play modes
   - Scenarios 001–034: existing online mode + local pass-and-play on one phone.
   - MODE HÉRITAGE: existing local campaign mode + synchronized online room mode.
   Additive runtime: does not rewrite the v4 online engine.
*/
(()=>{
'use strict';

const BUILD='v13.8-dual-play';
const LOCAL_KEY='igr_local_standard_v13_8';
const HNET_KEY='igr_heritage_online_v13_8';
const HERITAGE_LIVE_KEY='igr_heritage_live_v2';
const IDENTITY_KEY='igr_social_identity_v1';
const HROLE={
  cendres:['chef','sigint','terrain','source','liaison','legal','archive'],
  kuroi:['waka_k','kobun_k','waka_a','kobun_a','commissaire','inspecteur','bengoshi']
};
const HRESULT={
  alias:{grade:2,title:'IDENTITÉ DE COUVERTURE PARTAGÉE',consequence:'La cellule cesse de chercher un individu inexistant et conserve une piste exploitable.'},
  agent:{grade:0,title:'AGENT RÉEL À RETROUVER',consequence:'La cellule mobilise ses moyens sur une personne qui n’existe pas sous cette forme.'},
  victim:{grade:1,title:'IDENTITÉ D’UNE PERSONNE EFFACÉE',consequence:'L’hypothèse reste possible mais ne correspond pas aux traces techniques disponibles.'},
  transfer:{grade:2,title:'COUVRIR UN TRANSFERT CLASSIFIÉ',consequence:'Vous suivez le mouvement matériel utile et préservez une piste pour la suite.'},
  border:{grade:1,title:'CRÉER UN INCIDENT DIPLOMATIQUE',consequence:'La pression politique est réelle mais n’explique pas le trajet préparé du convoi C.'},
  terror:{grade:0,title:'FRAPPER LE CENTRE LOGISTIQUE',consequence:'Le convoi C et le chargement déplacé sortent de votre priorité.'},
  b:{grade:2,title:'COMPTE RENDU B',consequence:'Le témoignage reste partiellement exploitable et une compromission interne est confirmée.'},
  source:{grade:0,title:'TOUT LE TÉMOIGNAGE',consequence:'Vous perdez plusieurs éléments déjà recoupés indépendamment.'},
  audio:{grade:1,title:'ENREGISTREMENT AUDIO',consequence:'Vous identifiez une anomalie mais conservez la pièce falsifiée dans la synthèse.'},
  kern:{grade:2,title:'RESPONSABLE DES HABILITATIONS',consequence:'Le principal relais interne est neutralisé avant le dernier dossier.'},
  prisoner:{grade:0,title:'OPÉRATRICE DÉTENUE',consequence:'Le compte privilégié interne reste actif et peut encore fausser le dernier dossier.'},
  minister:{grade:1,title:'CABINET MINISTÉRIEL',consequence:'Vous identifiez une circulation anormale de l’information sans neutraliser le relais technique.'},
  nadir:{grade:2,title:'ANCIENNE GALERIE HYDROÉLECTRIQUE',consequence:'L’ogive est retrouvée et sécurisée. La qualité de la victoire dépend du niveau de crise accumulé.'},
  airbase:{grade:0,title:'BASE AÉRIENNE ACTIVE',consequence:'La base est une fausse piste et le dispositif perd un temps critique.'},
  depot:{grade:1,title:'ANCIEN DÉPÔT DE DÉMANTÈLEMENT',consequence:'Vous retrouvez l’origine de la disparition mais pas le stockage final.'},
  police_hand:{grade:2,title:'ORDRE POLICE · MAIN KUROKAWA',consequence:'La coopération continue, mais une dette cachée entre police et Kurokawa est désormais certaine.'},
  arakida:{grade:0,title:'COUP ARAKIDA',consequence:'Arakida est accusé à tort et la tension entre clans augmente.'},
  internal:{grade:1,title:'PURGE / JUSTICE INTERNE',consequence:'Une partie de la vérité est reconnue, mais le système n’est pas entièrement exposé.'},
  mori_ren:{grade:2,title:'MORI → REN',consequence:'La dette centrale est inscrite dans le registre.'},
  arakida_k:{grade:0,title:'ARAKIDA → KUROKAWA',consequence:'Les clans se rapprochent de la guerre pour une dette inventée.'},
  oyabun_police:{grade:1,title:'OYABUN → POLICE',consequence:'Vous confirmez l’ancien lien, mais inversez le sens de l’obligation décisive.'},
  copy:{grade:2,title:'COPIE TIERS · ORIGINAL NÉGOCIÉ',consequence:'La vérité survit sans exposer immédiatement tout le clan.'},
  police:{grade:0,title:'RENDRE À LA POLICE',consequence:'Des pages disparaissent et la police reprend l’initiative.'},
  clan:{grade:1,title:'GARDER AU CLAN',consequence:'La preuve survit, mais la coopération avec la police devient hostile.'},
  chain:{grade:2,title:'ISHIDA → MORI → REN',consequence:'La chaîne complète entre au Registre et prépare le Conseil final.'},
  ren:{grade:0,title:'REN SEUL',consequence:'La police survit intacte et Kurokawa porte seul le crime.'},
  mori:{grade:1,title:'MORI → REN',consequence:'La facilitation est reconnue, mais le commandement reste protégé.'},
  public:{grade:2,title:'VÉRITÉ PUBLIQUE',consequence:'Fin — LA LUMIÈRE FROIDE : les institutions paient, la Famille se fracture mais la dette cesse d’être secrète.'},
  scapegoat:{grade:0,title:'BOUC ÉMISSAIRE',consequence:'Fin — LA DETTE CONTINUE : la guerre évitée aujourd’hui devient la prochaine dette.'}
};

function heritageResult(campaign,chapter,decision){
  if(campaign==='kuroi'&&decision==='internal'){
    if(Number(chapter)===1)return {grade:1,title:'PURGE INTERNE KUROKAWA',consequence:'Vous percevez la main interne mais pas l’ordre extérieur.'};
    if(Number(chapter)===5)return {grade:1,title:'JUSTICE INTERNE',consequence:'Fin — LE SILENCE NÉGOCIÉ : la paix tient, mais une partie du système survit.'};
  }
  return HRESULT[decision]||null;
}

const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const storage=()=>{try{return typeof STORAGE!=='undefined'?STORAGE:localStorage}catch{return localStorage}};
const readJSON=(k)=>{try{return JSON.parse(storage().getItem(k)||'null')}catch{return null}};
const writeJSON=(k,v)=>{try{storage().setItem(k,JSON.stringify(v));return true}catch{return false}};
const del=(k)=>{try{storage().removeItem(k)}catch{}};
const profileIdentity=()=>readJSON(IDENTITY_KEY);
const pseudoDefault=()=>{try{return loadProfile?.().pseudo||storage().getItem('igr_v9_last_pseudo')||''}catch{return storage().getItem('igr_v9_last_pseudo')||''}};
const toastX=m=>{try{toast?.(m)}catch{console.log(m)}};
function shellPut(html,preserveLobby=false){
 const root=$('#app');if(!root)return;
 const lobby=preserveLobby?root.querySelector('.hnet-lobby'):null;
 const oldScroll=window.scrollY;
 const oldFocused=document.activeElement?.closest?.('.hnet-role-card[data-role]');
 const roleId=oldFocused?.dataset.role||null;
 const oldAnchor=oldFocused||lobby?.querySelector('.hnet-role-zone')||lobby?.querySelector('.hnet-title');
 const oldTop=oldAnchor?.getBoundingClientRect().top;
 root.innerHTML=typeof shell==='function'?shell(html,false):`<div class="app">${html}</div>`;
 const newLobby=root.querySelector('.hnet-lobby');
 const chosen=roleId&&Array.from(newLobby?.querySelectorAll('.hnet-role-card[data-role]')||[]).find(b=>b.dataset.role===roleId);
 const newAnchor=chosen||newLobby?.querySelector('.hnet-role-zone')||newLobby?.querySelector('.hnet-title');
 // Keep the touched role at the same viewport position despite changing labels.
 const delta=lobby&&newAnchor&&Number.isFinite(oldTop)?newAnchor.getBoundingClientRect().top-oldTop:0;
 try{window.scrollTo({top:lobby&&newLobby?Math.max(0,window.scrollY+delta):0,left:0,behavior:'instant'})}
 catch(_){window.scrollTo(0,lobby&&newLobby?Math.max(0,window.scrollY+delta):0)}
 if(chosen&&!chosen.disabled)chosen.focus({preventScroll:true});
}
function secureIndex(n){if(n<=1)return 0;try{const a=new Uint32Array(1),lim=Math.floor(0x100000000/n)*n;let x;do{crypto.getRandomValues(a);x=a[0]}while(x>=lim);return x%n}catch{return Math.floor(Math.random()*n)}}
function shuffle(a){a=[...a];for(let i=a.length-1;i>0;i--){const j=secureIndex(i+1);[a[i],a[j]]=[a[j],a[i]]}return a}
function newHCode(){const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';let s='H';for(let i=0;i<4;i++)s+=chars[secureIndex(chars.length)];return s}
function roleLabel(id){try{return publicRoleLabel?.(id)||roleInfo?.(id)?.label||id}catch{return id}}
function scenarioObj(id){try{return scenario(id)}catch{return SCENARIOS?.find?.(x=>x.id===id)}}
function art(id){try{return scenarioArt(id)}catch{return ''}}

/* ------------------------------------------------------------------
   STANDARD 001–034 · MODE LOCAL
------------------------------------------------------------------ */
let baseRenderCreateConfirm=null;
let baseJoinRoom=null;

async function getStandardPack(id){
  const ident=profileIdentity();
  return rpc('igr_local_scenario_pack',{
    p_scenario_id:id,
    p_profile_id:ident?.id||null,
    p_profile_token:ident?.token||null
  });
}

function enhanceStandardConfirm(){
  const page=$('.page-confirm-v10-13');if(!page||page.dataset.dualModes==='1')return;
  const sc=scenarioObj(STATE?.selectedScenario);if(!sc||!/^(0(0[1-9]|[12][0-9]|3[0-4]))$/.test(sc.id))return;
  const confirm=$('.confirm',page);if(!confirm)return;
  const old=$$('button',confirm).find(b=>/ouvrir la cellule|open/i.test(b.textContent||''));if(!old)return;
  page.dataset.dualModes='1';
  const wrap=document.createElement('div');wrap.className='dual-mode-chooser';
  const localLive=readLocal();
  const canResumeLocal=localLive?.scenarioId===sc.id&&localLive?.stage&&localLive.stage!=='finished';
  wrap.innerHTML=`<button type="button" class="dual-mode-card is-online"><span class="dual-mode-icon">⌁</span><span><b>MULTIJOUEUR EN LIGNE</b><small>Chaque joueur utilise son téléphone et rejoint la cellule avec un code.</small></span><i>CLASSIQUE</i></button><button type="button" class="dual-mode-card is-local"><span class="dual-mode-icon">▣</span><span><b>${canResumeLocal?'REPRENDRE EN LOCAL':'MODE LOCAL'}</b><small>${canResumeLocal?'Continuer la partie locale enregistrée sur cet appareil.':'Un seul téléphone circule à table pour les cartes privées et les phases.'}</small></span><i>${canResumeLocal?'EN COURS':'1 TÉLÉPHONE'}</i></button>`;
  old.replaceWith(wrap);
  $('.is-online',wrap)?.addEventListener('click',()=>baseRenderOnlineCreate());
  $('.is-local',wrap)?.addEventListener('click',()=>canResumeLocal?renderStandardLocal():renderStandardLocalSetup(sc.id));
}
function baseRenderOnlineCreate(){
  try{createRoom()}catch(e){console.error(e);toastX('Impossible d’ouvrir la cellule.')}
}

async function renderStandardLocalSetup(id){
  const sc=scenarioObj(id);if(!sc)return;
  shellPut(`<main class="page localplay local-loading"><button class="btn ghost small local-top-back" id="localBack">← Dossier</button><section class="local-loading-card"><span>MODE LOCAL</span><h1>${esc(sc.title)}</h1><p>Préparation du dossier…</p><div class="local-spinner"></div></section></main>`);
  $('#localBack')?.addEventListener('click',()=>{STATE.selectedScenario=id;STATE.view='create-confirm';renderCreateConfirm()});
  const loadingScreen=$('.local-loading');
  let payload;
  try{payload=await getStandardPack(id)}catch(e){
    if(!loadingScreen?.isConnected)return;
    console.error(e);
    shellPut(`<main class="page localplay"><button class="btn ghost small local-top-back" id="localBack2">← Dossier</button><section class="local-error"><span>MODE LOCAL</span><h1>Accès impossible</h1><p>${/premium|access/i.test(e.message||'')?'Ce dossier nécessite l’accès premium correspondant.':'Le dossier local n’a pas pu être chargé. Vérifie la connexion puis réessaie.'}</p></section></main>`);
    $('#localBack2')?.addEventListener('click',()=>{STATE.selectedScenario=id;STATE.view='create-confirm';renderCreateConfirm()});return;
  }
  if(!loadingScreen?.isConnected)return;
  const min=Number(payload.min_players||sc.min||4),max=Number(payload.max_players||sc.max||min),prev=readJSON(LOCAL_KEY);
  const count=clamp(prev?.scenarioId===id?prev.players?.length||min:min,min,max);
  const prevFourMode=(prev?.scenarioId===id&&prev.mode==='team')?'team':'classic';
  const fourLocalMode=['001','004','009'].includes(id)
    ?`<div class="local-mode-choice" id="localFourMode" ${count===4?'':'hidden'}><label for="localFourModeSelect"><b>Composition à 4 joueurs</b></label><select id="localFourModeSelect"><option value="classic" ${prevFourMode==='classic'?'selected':''}>Enquêteur + 3 Suspects</option><option value="team" ${prevFourMode==='team'?'selected':''}>Enquêteur + Analyste + 2 Suspects</option></select><small>Le troisième personnage reste dans l’histoire, sans joueur attitré.</small></div>`
    :'';
  shellPut(`<main class="page localplay local-setup"><header class="local-head"><button class="btn ghost small" id="localBack3">← ${esc(sc.title)}</button><span>MODE LOCAL · 1 TÉLÉPHONE</span></header><section class="local-title"><div class="local-poster-mini"><img src="${art(id)}" alt=""></div><div><span>DOSSIER ${esc(id)}</span><h1>Composer la cellule</h1><p>Les cartes privées seront révélées une par une. Ensuite, le téléphone revient au centre de la table.</p></div></section><form id="localSetupForm" class="local-panel"><div class="local-count"><div><b>JOUEURS</b><small>${min}${max!==min?`–${max}`:''} joueurs</small></div><div class="local-stepper"><button type="button" data-local-count="-1">−</button><strong id="localCount">${count}</strong><button type="button" data-local-count="1">+</button></div></div>${fourLocalMode}<div id="localNames" class="local-names"></div><button class="btn primary block" type="submit">ATTRIBUER LES RÔLES</button></form></main>`);
  const build=(n,values=[])=>{$('#localNames').innerHTML=Array.from({length:n},(_,i)=>`<label><span>J${i+1}</span><input required maxlength="22" autocomplete="off" value="${esc(values[i]||'')}" placeholder="Pseudo ${i+1}"></label>`).join('')};
  build(count,prev?.scenarioId===id?(prev.players||[]).map(x=>x.name):[]);
  $('#localBack3')?.addEventListener('click',()=>{STATE.selectedScenario=id;STATE.view='create-confirm';renderCreateConfirm()});
  $$('[data-local-count]').forEach(btn=>btn.addEventListener('click',()=>{const now=Number($('#localCount').textContent),next=clamp(now+Number(btn.dataset.localCount),min,max),vals=$$('#localNames input').map(x=>x.value);if(next!==now){$('#localCount').textContent=String(next);build(next,vals);const modeNode=$('#localFourMode');if(modeNode)modeNode.hidden=next!==4;}}));
  $('#localSetupForm')?.addEventListener('submit',e=>{
    e.preventDefault();
    const names=[],seen=new Set();
    for(const field of $$('#localNames input')){
      const name=field.value.trim().replace(/\s+/gu,' ');
      const key=name.normalize('NFKC').toLocaleLowerCase('fr');
      if(!name||seen.has(key)){
        field.setCustomValidity(name?'Ce pseudo est déjà utilisé. Choisis un pseudo distinct.':'Indique le pseudo de ce joueur.');
        field.reportValidity();
        field.setCustomValidity('');
        return;
      }
      seen.add(key);
      names.push(name);
    }
    const existing=readLocal();
    if(existing?.scenarioId&&existing.stage!=='finished'&&!confirm(`Remplacer la partie locale du dossier ${existing.scenarioId} par une nouvelle partie du dossier ${id} ? Sa progression sera effacée.`))return;
    const mode=['001','004','009'].includes(id)&&names.length===4?($('#localFourModeSelect')?.value||'classic'):'classic';
    startStandardLocal(id,payload.pack,names,mode);
  });
}

function genericCard(role,context){
  const map={
    enqueteur:{place:'Tu diriges l’enquête.',chronology:context,hide:'Tu ne caches aucun fait du dossier.',anchors:'Croise horaires, accès, objets et contradictions. Le stress n’est pas une preuve.',position:'Tu mènes les interrogatoires et portes la reconstruction finale.'},
    analyste:{place:'Tu observes les interrogatoires et aides l’Enquêteur.',chronology:context,hide:'Tes notes restent privées jusqu’aux échanges avec l’Enquêteur.',anchors:'Repère contradictions et changements de version.',position:'Tu aides à reconstruire les faits.'},
    procureur:{place:'Tu portes l’accusation.',chronology:context,hide:'Tes priorités d’entretien restent stratégiques.',anchors:'Poursuis uniquement ce que les faits permettent de soutenir.',position:'Tu mets la pression sans inventer de preuve.'},
    juge:{place:'Tu arbitres certaines informations protégées.',chronology:context,hide:'Ton jugement reste privé jusqu’à la fin.',anchors:'Distingue confidentialité et vérité factuelle.',position:'Tu rends ton propre jugement.'},
    journaliste:{place:'Tu enquêtes en dehors du camp judiciaire.',chronology:context,hide:'Tes sources et ton angle restent à toi.',anchors:'Une publication n’est jamais un verdict.',position:'Tu peux mettre la pression.'},
    inspecteur:{place:'Tu travailles sur le terrain.',chronology:context,hide:'Tes priorités de recherche restent privées.',anchors:'Tu choisis où chercher.',position:'Tu établis les faits matériels.'},
    expert:{place:'Tu es l’Expert / médecin légiste.',chronology:context,hide:'Tes priorités d’analyse restent privées.',anchors:'Tu établis un fait technique, jamais un coupable.',position:'Tu interprètes les traces.'},
    temoin:{place:'Tu es témoin dans le dossier.',chronology:context,hide:'Tu peux garder un élément personnel sans changer les faits.',anchors:'Réponds uniquement avec ce que tu sais.',position:'Ta vérité peut déplacer l’enquête.'},
    maitre:{place:'Tu es l’Avocat.',chronology:context,hide:'Tu ne connais pas automatiquement les secrets de tes clients.',anchors:'Défends ce qu’ils ont réellement fait.',position:'Tu protèges la frontière exacte de leur responsabilité.'}
  };return {...(map[role]||{place:role,chronology:context,hide:'',anchors:'',position:''})};
}
const IGR_001_ARCHIVED_WITNESS='Le client du même étage ne participe pas à cette séance. Sa première déclaration consignée : « J’étais à cet étage. J’ai entendu de l’agitation près de la chambre 222, mais je ne peux pas établir qui se trouvait dans la pièce ni l’origine de la blessure. » Cette déclaration est contestable, et non une preuve.';
const IGR_004_ARCHIVED_WITNESS='Un troisième proche de Sofia, qui habite à proximité, a été entendu séparément et ne participe pas à la Grey Room. Sa déclaration initiale : « Je connaissais Sofia et nos relations étaient tendues. Mes déplacements ne démontrent pas, à eux seuls, quelles informations j’ai reçues cette nuit-là. » Ses échanges et horaires doivent être vérifiés : ce récit ne disculpe ni n’accuse personne.';
const IGR_009_ARCHIVED_WITNESS='Un membre de l’équipe du Sujet 17 a remis une première déclaration et ne participe pas aux interrogatoires de la Grey Room. « Je travaillais au protocole. Ce que chacun savait au sujet du retrait du consentement et de l’ordre de poursuite doit être vérifié dans les dossiers. » Ce récit reste contestable et ne prouve ni décision autorisée ni innocence.';
function igrLocalNonplayerTitle(id){return id==='001'?'DÉCLARATION CONSIGNÉE · CHAMBRE 222':id==='004'?'DÉCLARATION CONSIGNÉE · SOFIA':'DÉCLARATION CONSIGNÉE · du Sujet 17'}
function igrLocalNonplayerText(id){return id==='001'?IGR_001_ARCHIVED_WITNESS:id==='004'?IGR_004_ARCHIVED_WITNESS:IGR_009_ARCHIVED_WITNESS}
function igrLocalNonplayerLabel(id){return id==='001'?'Le client de l’hôtel (non joueur)':id==='004'?'Le proche de Sofia (non joueur)':'Le membre de l’équipe du Sujet 17 (non joueur)'}
function buildLocalPlayers(id,pack,names,mode='classic'){
  const sc=scenarioObj(id),count=names.length;
  let slots=[];
  if(['001','004','009'].includes(id)&&count===4&&mode==='team')
    slots=['enqueteur','analyste','suspect','suspect'];
  else if(id==='009'&&count===4)
    slots=['enqueteur','suspect','suspect','suspect'];
  else try{slots=lobbyRoleSlots(sc,count)}catch{}
  if(!slots.length){slots=['enqueteur',...Array(Math.max(0,count-1)).fill('suspect')]}
  slots=shuffle(slots);
  const players=names.map((name,i)=>({id:`L${i+1}`,name,role:slots[i]||'suspect',secretRole:slots[i]||'suspect',slot:null,card:null}));
  const suspects=shuffle(players.filter(x=>x.role==='suspect'));suspects.forEach((p,i)=>p.slot=i+1);
  if(['013','014','016','019','020'].includes(id)&&suspects.length){suspects[secureIndex(suspects.length)].secretRole='espion'}
  const witnesses=players.filter(x=>x.role==='temoin').sort((a,b)=>players.indexOf(a)-players.indexOf(b));
  const lawyers=players.filter(x=>x.role==='maitre').sort((a,b)=>players.indexOf(a)-players.indexOf(b));
  for(const p of players){
    let card;
    if(p.role==='suspect'){
      card={...(pack.suspects?.[Math.max(0,(p.slot||1)-1)]||{})};
      const rels=(pack.relations?.[String(p.slot)]||[]).map(r=>{const q=players.find(x=>x.role==='suspect'&&x.slot===Number(r.slot));return {pseudo:q?.name||(['001','004','009'].includes(id)&&mode==='team'&&Number(r.slot)===3?(igrLocalNonplayerLabel(id)):`Suspect ${r.slot}`),text:r.text||''}});card.relations=rels;
    }else{
      card=genericCard(p.role,pack.context||'');Object.assign(card,pack.role_notes?.[p.role]||{});
      if(p.role==='temoin'){const rank=witnesses.indexOf(p);Object.assign(card,pack.witnesses?.[Math.max(0,rank)]||{})}
      if(p.role==='maitre'){
        const rank=lawyers.indexOf(p),n=Math.max(1,lawyers.length);card.clients=players.filter(x=>x.role==='suspect'&&((x.slot-1)%n)===rank).map(x=>x.name);
      }
    }
    if(p.secretRole==='espion')card.secret_mission=pack.espion_mission||'Observe et détourne sans inventer de preuve.';
    if(id==='031'&&pack.cartel031_canon){if(p.role==='suspect'){const original=pack.suspects?.[p.slot-1]||{};card.relations=original.relations||'';card.place=(original.identity||'')+'\n\n'+(original.place||'')}if(p.role==='maitre')card.clients=players.filter(q=>q.role==='suspect'&&q.slot===3).map(q=>q.name)}
    p.card=card;
  }
  return players;
}
function pickTrames(pack){const used=new Set(),plan=[];for(let cycle=1;cycle<=3;cycle++){const eligible=(pack.trames||[]).filter((t,i)=>!used.has(i)&&Number(t.min_cycle||1)<=cycle);const exact=eligible.filter(t=>Number(t.min_cycle||1)===cycle);const pool=exact.length?exact:eligible;if(pool.length){const chosen=pool[secureIndex(pool.length)],idx=(pack.trames||[]).indexOf(chosen);used.add(idx);plan.push(chosen)}else plan.push(null)}return plan}
function startStandardLocal(id,pack,names,mode='classic'){
  const players=buildLocalPlayers(id,pack,names,mode),state={version:1,scenarioId:id,mode,pack,players,revealIndex:0,revealOpen:false,stage:'reveal',cycle:1,trameOpen:false,tramePlan:pickTrames(pack),verdict:{},startedAt:new Date().toISOString()};window.IGR_CARTEL031?.initLocal?.(state);writeJSON(LOCAL_KEY,state);renderStandardLocal();
}
function readLocal(){return readJSON(LOCAL_KEY)}
function saveLocal(s){writeJSON(LOCAL_KEY,s)}
function privateBlocks(card){
  const blocks=[['TA PLACE',card.place],['TA CHRONOLOGIE',card.chronology],['CE QUE TU CACHES',card.hide],['TES REPÈRES',card.anchors],['TA POSITION',card.position],['TES RELATIONS',card.relations],['TES CLIENTS',card.clients],['MISSION SECRÈTE',card.secret_mission]];
  return blocks.filter(([,v])=>v!=null&&v!==''&&(!Array.isArray(v)||v.length)).map(([k,v])=>`<div class="local-private-block"><span>${esc(k)}</span>${Array.isArray(v)?v.map(x=>`<p>${esc(typeof x==='string'?x:`${x.pseudo||''} — ${x.text||''}`)}</p>`).join(''):`<p>${esc(v)}</p>`}</div>`).join('');
}
function renderStandardLocal(){
  const s=readLocal();if(!s)return renderHome?.();
  if(s.scenarioId==='031'&&s.pack?.cartel031_canon&&!['reveal','briefing'].includes(s.stage)&&window.IGR_CARTEL031)return window.IGR_CARTEL031.renderLocal(s,{save:saveLocal,shell:shellPut});
  if(s.stage==='reveal')return renderLocalReveal({...s,revealOpen:false});
  if(s.stage==='briefing')return renderLocalBriefing(s);
  if(s.stage==='cycle')return renderLocalCycle(s);
  if(s.stage==='debrief')return renderLocalDebrief(s);
  if(s.stage==='verdict')return renderLocalVerdict(s);
  if(s.stage==='result')return renderLocalResult(s);
}
function localHeader(s,label){const sc=scenarioObj(s.scenarioId);return `<header class="local-head"><button class="btn ghost small" data-local-act="quit">× Quitter</button><span>DOSSIER ${esc(s.scenarioId)} · ${esc(label)}</span></header><div class="local-case-name">${esc(sc?.title||'')}</div>`}
function renderLocalReveal(s){const p=s.players[s.revealIndex];shellPut(`<main class="page localplay local-reveal">${localHeader(s,`CARTE ${s.revealIndex+1}/${s.players.length}`)}<section class="local-private-card ${s.revealOpen?'is-open':'is-sealed'}">${s.revealOpen?`<span>CARTE PRIVÉE · ${esc(p.name)}</span><h1>${esc(roleLabel(p.role))}${p.secretRole==='espion'?' · COUVERTURE':''}</h1>${privateBlocks(p.card)}<button class="btn primary block" data-local-act="next-card">MASQUER & PASSER</button>`:`<div class="local-seal">◇</div><span>PASSEZ LE TÉLÉPHONE À</span><h1>${esc(p.name)}</h1><p>Personne d’autre ne doit regarder l’écran.</p><button class="btn primary block" data-local-act="open-card">RÉVÉLER MA CARTE</button>`}</section></main>`)}
function renderLocalBriefing(s){const sc=scenarioObj(s.scenarioId);shellPut(`<main class="page localplay local-table">${localHeader(s,'BRIEFING')}<section class="local-briefing-hero"><img src="${art(s.scenarioId)}" alt=""><div><span>CONTEXTE PUBLIC</span><h1>${esc(sc?.title||'')}</h1><p>${esc(s.pack.context||sc?.context||'')}</p></div></section>${['001','004','009'].includes(s.scenarioId)&&s.mode==='team'?'<section class="local-panel"><b>'+igrLocalNonplayerTitle(s.scenarioId)+'</b><p>'+esc(igrLocalNonplayerText(s.scenarioId))+'</p></section>':''}<section class="local-panel local-roster"><div class="local-section-title"><span>À TABLE</span><b>${s.players.length} JOUEURS</b></div>${s.players.map(p=>`<div><b>${esc(p.name)}</b><small>${esc(roleLabel(p.role))}</small></div>`).join('')}</section><button class="btn primary block" data-local-act="start-cycles">COMMENCER L’ENQUÊTE</button></main>`)}
function localFindingKind(kind){return ({clarity:'ÉLÉMENT FACTUEL',contradiction:'CONTRADICTION',pressure:'NOUVEL ÉLÉMENT',reveal:'ÉLÉMENT RÉVÉLÉ',evidence:'ÉLÉMENT MATÉRIEL'})[kind]||'ÉLÉMENT RÉVÉLÉ'}
function localHistory(s){
 const cycles=Array.isArray(s.revealedCycles)?s.revealedCycles:Array.from({length:Math.max(0,Number(s.cycle||1)-1)},(_,i)=>i+1);
 const entries=[...new Set(cycles)].filter(c=>c>=1&&c<=3&&(c<Number(s.cycle||1)||(c===Number(s.cycle||1)&&s.trameOpen)||['verdict','result'].includes(s.stage))).sort((a,b)=>a-b).map(c=>({cycle:c,trame:s.tramePlan?.[c-1]})).filter(x=>x.trame);
 if(!entries.length)return '';
 return '<details class="local-panel local-evidence-history"><summary style="min-height:44px;cursor:pointer;padding:8px">Éléments déjà révélés · '+entries.length+'</summary>'+entries.map(({cycle,trame})=>'<article class="local-trame"><span>CYCLE '+cycle+' · '+esc(localFindingKind(trame.kind))+'</span><h2>'+esc(trame.title||'Nouvel élément')+'</h2><p>'+esc(trame.text||'')+'</p></article>').join('')+'</details>';
}
function renderLocalCycle(s){const cycle=clamp(Number(s.cycle||1),1,3),suspects=s.players.filter(p=>p.role==='suspect').sort((a,b)=>(a.slot||0)-(b.slot||0)),target=suspects[(cycle-1)%Math.max(1,suspects.length)],trame=s.tramePlan?.[cycle-1];shellPut(`<main class="page localplay local-table">${localHeader(s,`CYCLE ${cycle}/3`)}<section class="local-cycle-head"><span>INTERROGATION · 8 MIN</span><h1>${target?esc(target.name):'Interrogation libre'}</h1><p>Les joueurs parlent face à face. Le téléphone reste au centre jusqu’à la trame.</p></section><section class="local-panel local-cycle-panel"><div class="local-section-title"><span>TRAME DU CYCLE</span><b>${s.trameOpen?'RÉVÉLÉE':'SCELLÉE'}</b></div>${s.trameOpen?(trame?`<div class="local-trame"><span>${esc(localFindingKind(trame.kind))}</span><h2>${esc(trame.title||'NOUVEL ÉLÉMENT')}</h2><p>${esc(trame.text||'')}</p></div>`:`<div class="local-trame"><h2>Aucune trame supplémentaire</h2><p>Continuez le recoupement à partir des cartes privées.</p></div>`):`<button class="local-sealed-trame" data-local-act="reveal-trame"><span>◇</span><b>RÉVÉLER LA TRAME</b><small>À ouvrir après l’interrogation.</small></button>`}</section>${localHistory(s)}${['001','004','009'].includes(s.scenarioId)&&s.mode==='team'?'<details class="local-panel"><summary>Déclaration du personnage non joué</summary><p>'+esc(igrLocalNonplayerText(s.scenarioId))+'</p></details>':''}<section class="local-panel local-role-reminder"><span>RAPPEL</span><p>Les pouvoirs spéciaux restent joués à l’oral dans ce mode local. Une carte privée ou une trame ne peut jamais être modifiée ou inventée.</p></section>${s.trameOpen?`<button class="btn primary block" data-local-act="next-cycle">OUVRIR LE DÉBRIEF</button>`:''}</main>`)}
function renderLocalDebrief(s){
 const questions=[
  ['convergence','Êtes-vous d’accord sur une piste ?',['Non','En partie','Oui']],
  ['confusion','Vous sentez-vous encore perdus ?',['Non','Un peu','Oui']],
  ['missing','Quelle piste manque le plus ?',['Chronologie','Accès et déplacements','Mobile et relations','Éléments matériels','Responsabilités']]
 ];
 const draft=s.debriefDraft?.cycle===s.cycle?s.debriefDraft.answers:{};
 const fields=questions.map(([key,label,options])=>`<label>${label}<select required name="${key}"><option value="">Choisir…</option>${options.map(o=>`<option${draft?.[key]===o?' selected':''}>${o}</option>`).join('')}</select></label>`).join('');
 shellPut(`<main class="page localplay">${localHeader(s,'DÉBRIEF · CYCLE '+s.cycle)}<form class="local-panel local-verdict-list" id="localDebriefForm"><h1>Point d’enquête</h1><p>Le camp Enquête fait le point avant de poursuivre.</p>${fields}<button class="btn primary block">Valider le débrief</button></form></main>`);
 const form=$('#localDebriefForm');
 form.addEventListener('change',event=>{
  const current=readLocal();
  if(current?.startedAt!==s.startedAt||current?.scenarioId!==s.scenarioId||current?.stage!=='debrief'||current.cycle!==s.cycle)return;
  const answers=current.debriefDraft?.cycle===s.cycle?current.debriefDraft.answers:{};
  current.debriefDraft={cycle:s.cycle,answers:{...answers,[event.target.name]:event.target.value}};
  saveLocal(current);
 });
 form.dataset.startedAt=s.startedAt;
 form.dataset.cycle=String(s.cycle);
}
function renderLocalVerdict(s){const suspects=s.players.filter(p=>p.role==='suspect').sort((a,b)=>(a.slot||0)-(b.slot||0));shellPut(`<main class="page localplay local-verdict">${localHeader(s,'VERDICT')}<section class="local-cycle-head"><span>RESPONSABILITÉ FINALE</span><h1>Verrouiller la reconstruction</h1><p>Attribuez à chaque suspect un niveau de 0 à 3. Le téléphone peut rester au centre : il ne contient plus d’information privée.</p></section>${localHistory(s)}<form id="localVerdictForm" class="local-panel local-verdict-list">${suspects.map(p=>`<label><span><b>${esc(p.name)}</b><small>0 = hors de cause · 3 = responsabilité centrale</small></span><select required data-suspect-slot="${p.slot}"><option value="">Choisir un niveau…</option>${[0,1,2,3].map(v=>`<option value="${v}" ${s.verdict?.[p.slot]===v?'selected':''}>${v}</option>`).join('')}</select></label>`).join('')}<button class="btn primary block" type="submit">RÉVÉLER LA VÉRITÉ</button></form></main>`)}
function normalizeTruthLevels(pack,suspects){const x=pack.truth?.levels;if(Array.isArray(x))return x.map(Number);if(x&&typeof x==='object')return suspects.map((_,i)=>Number(x[String(i+1)]??x[i+1]??0));return suspects.map(()=>0)}
function renderLocalResult(s){const suspects=s.players.filter(p=>p.role==='suspect').sort((a,b)=>(a.slot||0)-(b.slot||0)),levels=normalizeTruthLevels(s.pack,suspects);let pts=0;const rows=suspects.map((p,i)=>{const pred=Number(s.verdict?.[p.slot]??0),real=Number(levels[i]??0),diff=Math.abs(pred-real);pts+=Math.max(0,3-diff);return `<div><span><b>${esc(p.name)}</b><small>estimé ${pred} · réel ${real}</small></span><strong>${diff===0?'EXACT':diff===1?'PROCHE':'ÉCART'}</strong></div>`}).join('');const max=Math.max(1,suspects.length*3),score=Math.round(100*pts/max);shellPut(`<main class="page localplay local-result">${localHeader(s,'RÉVÉLATION')}<section class="local-result-card"><span>VÉRITÉ CANONIQUE</span><h1>${score}%</h1><p>${esc(s.pack.truth?.summary||'La vérité du dossier est révélée.')}</p><div class="local-result-rows">${rows}</div>${['001','004','009'].includes(s.scenarioId)&&s.mode==='team'?'<p>Le troisième personnage reste présent dans la vérité du dossier. Ce score concerne les deux Suspects incarnés.</p>':''}<div class="local-score"><b>FORCE DE RECONSTRUCTION</b><strong>${score}/100</strong></div><button class="btn primary block" data-local-act="finish-local">TERMINER</button></section></main>`)}

function handleLocalClick(e){const b=e.target.closest?.('[data-local-act]');if(!b)return;const s=readLocal();if(!s)return;e.preventDefault();const a=b.dataset.localAct;if(a==='quit'){if(confirm('Quitter cette partie locale ? La progression locale sera conservée.')){STATE.selectedScenario=s.scenarioId;STATE.view='create-confirm';renderCreateConfirm()}return}if(a==='open-card'){renderLocalReveal({...s,revealOpen:true});return}if(a==='next-card'){b.closest('.local-private-card')?.replaceChildren();s.revealOpen=false;if(s.revealIndex>=s.players.length-1){s.stage='briefing'}else s.revealIndex++;saveLocal(s);renderStandardLocal();return}if(a==='start-cycles'){s.stage='cycle';s.cycle=1;s.trameOpen=false;saveLocal(s);renderStandardLocal();return}if(a==='reveal-trame'){s.revealedCycles=[...new Set([...(Array.isArray(s.revealedCycles)?s.revealedCycles:Array.from({length:Math.max(0,Number(s.cycle)-1)},(_,i)=>i+1)),Number(s.cycle)])];s.trameOpen=true;saveLocal(s);renderStandardLocal();return}if(a==='next-cycle'){s.stage='debrief';saveLocal(s);renderStandardLocal();return}if(a==='finish-local'){del(LOCAL_KEY);STATE.selectedScenario=s.scenarioId;STATE.view='create-confirm';renderCreateConfirm();return}}
function handleLocalSubmit(e){
 if(e.target.id==='localDebriefForm'){
  e.preventDefault();const s=readLocal();if(s?.stage!=='debrief'||e.target.dataset.startedAt!==String(s.startedAt)||e.target.dataset.cycle!==String(s.cycle)||!e.target.reportValidity())return;
  delete s.debriefDraft;
  s.debriefs=s.debriefs||{};s.debriefs[s.cycle]=Object.fromEntries(new FormData(e.target));
  if(s.cycle<3){s.cycle++;s.trameOpen=false;s.stage='cycle'}else s.stage='verdict';
  saveLocal(s);renderStandardLocal();return;
 }
 if(e.target.id!=='localVerdictForm')return;e.preventDefault();const s=readLocal();if(!s)return;const verdict={};$$('[data-suspect-slot]',e.target).forEach(sel=>verdict[sel.dataset.suspectSlot]=Number(sel.value));s.verdict=verdict;s.stage='result';saveLocal(s);renderStandardLocal()}

/* ------------------------------------------------------------------
   HÉRITAGE · LOCAL + ONLINE
------------------------------------------------------------------ */
let hWatcher=null,hLastSig='',hLastStage='',hVotePending=false,hFinishPending=false,hRolePending=false,hBrowsingLobby=false,hBrowseEpoch=0;
function hSession(){return readJSON(HNET_KEY)}
function saveHSession(v){writeJSON(HNET_KEY,v)}
function clearHSession(){hBrowsingLobby=false;hBrowseEpoch++;del(HNET_KEY);hLastSig='';hLastStage='';if(hWatcher){clearInterval(hWatcher);hWatcher=null}}
function heritageMeta(campaign){return window.IGR_HERITAGE?.campaigns?.[campaign]}
function heritageCarry(campaign){
  try{const s=window.IGR_HERITAGE?.get?.(campaign);if(!s)return[];if(campaign==='cendres'){return [`Crise : ${s.cendres?.crisis?.label||'SOUS CONTRÔLE'}`,`${s.cendres?.network?.nodes?.length||0} identités`,`${s.cendres?.network?.links?.length||0} connexions`]}return [`${(s.kuroi?.debts||[]).filter(d=>d.status==='due').length} dettes ouvertes`,`${s.kuroi?.chronicle?.length||0} faits dans la Chronique`]}catch{return[]}
}
function enhanceHeritageChapter(){
  const box=$('.hplay-dossier .hplay-launch-box');if(!box||box.dataset.dualHeritage==='1')return;
  const old=$('.hplay-launch',box);if(!old)return;
  const campaign=old.dataset.campaign,chapter=Number(old.dataset.chapter);if(!campaign||!chapter)return;
  box.dataset.dualHeritage='1';
  const label=$('b',box);if(label)label.textContent='MODE DE JEU';
  const p=$('p',box);if(p)p.textContent='En ligne ou sur un téléphone.';
  const row=document.createElement('div');row.className='heritage-dual-row';
  const hs=hSession(),onlineResume=hs&&hs.campaign===campaign&&Number(hs.chapter)===chapter;
  const localLabel=(old.textContent||'').includes('REPRENDRE')?'REPRENDRE EN LOCAL':'LOCAL · 1 TÉLÉPHONE';
  row.innerHTML=`<button type="button" class="btn heritage-online-btn">${onlineResume?'REPRENDRE EN LIGNE':'MULTIJOUEUR EN LIGNE'}</button><button type="button" class="btn ghost heritage-local-btn">${localLabel}</button>`;
  old.replaceWith(row);
  $('.heritage-online-btn',row)?.addEventListener('click',()=>onlineResume?resumeHeritageOnline():renderHeritageOnlineCreate(campaign,chapter,/ARCHIVÉ|REJOUER/i.test(box.textContent||'')));
  $('.heritage-local-btn',row)?.addEventListener('click',async()=>{if(hSession()){try{await rpc('igr_heritage_online_leave',{p_code:hSession().code,p_player_token:hSession().token})}catch{}clearHSession();del(HERITAGE_LIVE_KEY)}const temp=document.createElement('button');temp.dataset.hpAction=(old.dataset.hpAction==='resume'?'resume':'setup');temp.dataset.campaign=campaign;temp.dataset.chapter=String(chapter);temp.style.display='none';document.body.appendChild(temp);temp.click();temp.remove()});
}
function openMaitreOnline(chapter){const api=window.IGR_HERITAGE_MAITRE_ONLINE;if(typeof api?.create==='function')return api.create(chapter);toastX('Le multijoueur Maître se charge. Réessaie dans un instant.')}
function renderHeritageOnlineCreate(campaign,chapter,practice=false){if(hSession())return showExistingHeritageRoom(()=>renderHeritageOnlineCreate(campaign,chapter,practice),()=>campaign==='maitre'?window.IGR_HERITAGE_MAITRE?.openChapter?.(chapter):window.IGR_HERITAGE_PLAY?.openChapter?.(campaign,chapter),campaign);if(campaign==='maitre')return openMaitreOnline(chapter);const m=heritageMeta(campaign),ch=m?.chapters?.[chapter-1];shellPut(`<main class="page hnet hplay-theme-${campaign}${campaign==='maitre'?' maitre-page':''}"><header class="hnet-head"><button class="btn ghost small" id="hnetBack">← ${esc(ch?.title||'Héritage')}</button><span>HÉRITAGE · EN LIGNE</span></header><section class="hnet-create"><span>${esc(m?.title||campaign)} · DOSSIER 0${chapter}</span><h1>Créer une cellule</h1><p>Chaque joueur sur son téléphone.</p><label><span>TON PSEUDO</span><input id="hnetPseudo" maxlength="22" autocomplete="nickname" value="${esc(pseudoDefault())}" placeholder="Pseudo"></label><button class="btn primary block" id="hnetCreateBtn">CRÉER LA CELLULE</button></section></main>`);$('#hnetBack')?.addEventListener('click',()=>window.IGR_HERITAGE_PLAY?.openChapter?.(campaign,chapter));$('#hnetCreateBtn')?.addEventListener('click',()=>createHeritageOnline(campaign,chapter,practice))}
async function createHeritageOnline(campaign,chapter,practice){if(campaign==='maitre')return openMaitreOnline(chapter);if(hSession())return renderHeritageOnlineCreate(campaign,chapter,practice);const pseudo=$('#hnetPseudo')?.value.trim();if(!pseudo)return toastX('Entre ton pseudo.');const ident=profileIdentity();if(!ident?.id||!ident?.token)return toastX('Ton profil est requis pour ouvrir HÉRITAGE.');let out=null,code=null;for(let i=0;i<5;i++){code=newHCode();try{out=await rpc('igr_heritage_online_create',{p_code:code,p_campaign_id:campaign,p_chapter:chapter,p_pseudo:pseudo,p_profile_id:ident.id,p_profile_token:ident.token});break}catch(e){if(i===4||!/duplicate|23505/i.test(`${e.code||''} ${e.message||''}`)){console.error(e);return toastX(/access/i.test(e.message||'')?'Accès HÉRITAGE requis.':'Création impossible.')}}}storage().setItem('igr_v9_last_pseudo',pseudo);saveHSession({code:out.room_code||code,token:out.player_token,hostToken:out.host_token,playerId:out.player_id,campaign,chapter,practice:!!practice});await window.IGR_HERITAGE_CONTEXT_V71?.publish?.();startHWatcher(true)}
async function dualJoinRoom(){const pseudo=($('#joinPseudo')?.value||'').trim(),code=($('#joinCode')?.value||'').trim().toUpperCase();if(!pseudo||code.length!==5)return toastX('Pseudo et code requis.');if(code.startsWith('H')){const existing=hSession();if(existing){if(existing.code===code)return resumeHeritageOnline();return showExistingHeritageRoom(()=>{if(typeof renderJoin==='function')renderJoin();const p=$('#joinPseudo'),c=$('#joinCode');if(p)p.value=pseudo;if(c)c.value=code;},()=>{if(typeof renderJoin==='function')renderJoin();});}try{const out=await rpc('igr_heritage_online_join',{p_code:code,p_pseudo:pseudo});storage().setItem('igr_v9_last_pseudo',pseudo);saveHSession({code:out.room_code||code,token:out.player_token,hostToken:null,playerId:out.player_id,campaign:out.campaign_id,chapter:out.chapter,practice:false});startHWatcher(true);return}catch(e){if(!/heritage[_ ]room[_ ]not[_ ]found/i.test(e.message||'')){console.error(e);return toastX(/full/i.test(e.message||'')?'Cellule HÉRITAGE complète.':/started/i.test(e.message||'')?'Cette campagne a déjà commencé.':'Impossible de rejoindre cette cellule HÉRITAGE.')}}}return baseJoinRoom?.()}
function startHWatcher(immediate=false){hBrowsingLobby=false;hBrowseEpoch++;if(hSession()?.campaign==='maitre'){window.IGR_HERITAGE_MAITRE_ONLINE?.resume?.();return}if(hWatcher)clearInterval(hWatcher);hWatcher=setInterval(()=>syncHeritageOnline(false),850);if(immediate)syncHeritageOnline(true)}
async function syncHeritageOnline(force=false){
  const s=hSession();if(!s||s.campaign==='maitre'||hBrowsingLobby)return;
  const epoch=hBrowseEpoch;
  if(document.hidden&&!force)return;
  try{
    const d=await rpc('igr_heritage_online_sync',{p_code:s.code,p_player_token:s.token});
    if(hBrowsingLobby||epoch!==hBrowseEpoch||hSession()?.token!==s.token)return;
    hLastStage=d.room?.stage||'';
    if(['cendres','kuroi'].includes(d.room?.campaign_id)&&d.room?.stage==='decision'){
      // Both campaigns have private, player-token validated majority ballots.
      const statusRpc=d.room.campaign_id==='cendres'?'igr_heritage_online_cendres_ballot_status':'igr_heritage_online_kuroi_ballot_status';
      d.room.ballot_status=await rpc(statusRpc,{p_code:s.code,p_player_token:s.token});
    }
    if(hBrowsingLobby||epoch!==hBrowseEpoch||hSession()?.token!==s.token)return;
    document.dispatchEvent(new CustomEvent('igr-heritage-sync',{detail:d}));
    const ballot=d.room?.ballot_status;
    const sig=JSON.stringify([d.room?.status,d.room?.stage,d.room?.phase_index,d.room?.decision_id,
      ballot?.vote_round,ballot?.votes_cast,ballot?.my_vote,(d.players||[]).map(p=>[p.id,p.ready,p.role_id,p.preferred_role])]);
    if(!force&&sig===hLastSig)return;
    routeHOnline(d);hLastSig=sig;
  }catch(e){
    console.warn('heritage online sync',e.message);
    if(/expired|unauthorized/i.test(e.message||'')){clearHSession();toastX('La cellule HÉRITAGE a expiré.')}
  }
}
function routeHOnline(d){const stage=d.room?.stage;if(stage==='lobby')return renderHLobby(d);if(stage==='role_reading')return renderHRole(d);if(stage==='play')return bridgeHPlay(d,'play');if(stage==='decision')return bridgeHPlay(d,'decision');if(stage==='reveal')return bridgeHPlay(d,'result');if(stage==='finished')return hFinishPending?null:renderHFinished(d)}
function heritageRoleCards(d){
 const selected=d.player?.preferred_role||null,players=d.players||[],count=players.length;
 const candidates=window.IGR_HERITAGE_PLAY?.publicRoles?.(d.room.campaign_id,Math.max(5,count))||[];
 const used=new Map(players.filter(p=>p.preferred_role).map(p=>[p.preferred_role,p]));
 const available=new Set(candidates.map(r=>r.id));
 const invalid=players.filter(p=>p.preferred_role&&!available.has(p.preferred_role));
 const random='<div class="hnet-role-actions"><button type="button" class="hnet-role-random hnet-random-action" data-hnet="role" data-role="" data-random="1" aria-label="Tirer un rôle libre maintenant"><span aria-hidden="true">⚄</span><b>Tirer un rôle</b></button>'+(selected?'<button type="button" class="hnet-role-reset" data-hnet="role" data-role="" aria-label="Annuler mon rôle et garder le tirage au lancement">Annuler</button>':'')+'</div>';
 const cards=candidates.map(r=>{
   const holder=used.get(r.id),mine=selected===r.id,taken=!!holder&&!mine,stars=Number(r.activity)||2;
   return `<button type="button" class="hnet-role-card ${mine?'is-picked':''} ${taken?'is-taken':''}" data-hnet="role" data-role="${esc(r.id)}" aria-pressed="${mine}" aria-label="${esc(r.name+' — '+(r.short||r.public))}" ${taken?'disabled':''}>
      <span class="hnet-role-top"><b>${esc(r.name)}</b><em>${mine?'✓ CHOISI':taken?'COMPLET':'CHOISIR'}</em></span>
      <span class="hnet-stars" aria-label="Activité estimée">${'★'.repeat(stars)+'☆'.repeat(5-stars)}</span>
    </button>`;
 }).join('');
 const chosen=candidates.find(r=>r.id===selected)||null;
 return {markup:`<section class="hnet-role-zone hnet-role-minimal" aria-label="Choix des rôles"><div class="hnet-role-head"><div><h2>Ton rôle</h2></div></div>
   <div class="hnet-selected-role" role="status" aria-live="polite"><span>TON CHOIX</span><b>${esc(chosen?.name||'Attribution aléatoire')}</b><small>${esc(chosen?.short||chosen?.public||'Un rôle sera attribué au lancement.')}</small>${chosen?`<em>ACTIVITÉ · ${'★'.repeat(Number(chosen.activity)||2)}${'☆'.repeat(5-(Number(chosen.activity)||2))}</em>`:''}</div>
   <div class="hnet-role-grid">${cards}</div>${random}
   ${invalid.length?`<p class="hnet-role-warning" role="alert">Choix à revoir : ${invalid.map(p=>esc(p.pseudo)).join(', ')}.</p>`:''}
 </section>`,invalid:invalid.length};
}
function renderHLobby(d){
 const s=hSession(),host=!!s?.hostToken,count=d.players?.length||0;
 const m=heritageMeta(d.room.campaign_id),ch=m?.chapters?.[d.room.chapter-1],roles=heritageRoleCards(d);
 const assigned=Object.fromEntries((d.players||[]).map(p=>[p.id,p.preferred_role||null]));
 const names=new Map((window.IGR_HERITAGE_PLAY?.publicRoles?.(d.room.campaign_id,7)||[]).map(r=>[r.id,r.name]));
 const rosterOpen=!!$('.hnet-lobby .hnet-roster-disclosure[open]');
 const roster=(d.players||[]).map((p,i)=>`<div><span>${i+1}</span><b>${esc(p.pseudo)}</b><small>${p.preferred_role?esc(names.get(assigned[p.id])||p.preferred_role):'AU HASARD'}${p.is_host?' · HÔTE':''}</small></div>`).join('');
 const canStart=count>=5&&!roles.invalid;
 shellPut(`<main class="page hnet hplay-theme-${d.room.campaign_id}"><header class="hnet-head"><button class="btn ghost small" data-hnet="leave">← Quitter</button><span>${esc(m?.title||'HÉRITAGE')} · DOSSIER 0${d.room.chapter}</span></header>
  <section class="hnet-lobby"><div class="hnet-title"><span>SALON</span><h1>${esc(ch?.title||'')}</h1><p>${count}/7 joueurs · minimum 5</p></div>
   <div class="hnet-code"><span>INVITATION</span><strong>${esc(d.room.code)}</strong><small>À partager</small><button type="button" class="hnet-code-copy" data-hnet="copy-code" data-code="${esc(d.room.code)}" aria-label="Copier le code d’invitation">COPIER</button></div>
   ${roles.markup}
   <details class="hnet-roster-disclosure" ${rosterOpen?'open':''}><summary>Joueurs <span>${count}/7</span></summary><div class="hnet-players">${roster}</div></details>
   <p class="hnet-launch-hint">${count<5?`Encore ${5-count} joueur${5-count>1?'s':''}.`:roles.invalid?'Un choix est indisponible.':''}</p>
   ${host?`<button class="btn primary block hnet-start" data-hnet="start" ${canStart?'':'disabled'}>${count<5?`EN ATTENTE (${5-count})`:roles.invalid?'CHOIX À REVOIR':'LANCER LA PARTIE'}</button>`:'<div class="hnet-wait">En attente de l’hôte.</div>'}
  </section></main>`,true);
}
/* The visible dice button now draws AND reserves one public role.
   The authoritative RPC checks availability; races retry with another role. */
async function drawHeritageOnlineRole(){
 const s=hSession();if(!s||hRolePending)return;
 hRolePending=true;
 try{
  const buttons=Array.from(document.querySelectorAll('.hnet .hnet-role-grid .hnet-role-card[data-role]'))
   .filter(b=>b.dataset.role&&!b.disabled&&!b.classList.contains('is-taken'));
  const other=buttons.filter(b=>b.getAttribute('aria-pressed')!=='true');
  const remaining=(other.length?other:buttons).slice();
  if(!remaining.length){toastX('Aucun rôle disponible.');await syncHeritageOnline(true);return}
  while(remaining.length){
   const idx=Math.floor(Math.random()*remaining.length),btn=remaining.splice(idx,1)[0];
   try{
    const response=await rpc('igr_heritage_online_choose_role',{p_code:s.code,p_player_token:s.token,p_role_id:btn.dataset.role});
    if(response?.ok===false)throw Error('role_not_available');
    await syncHeritageOnline(true);
    toastX('Rôle tiré : '+(btn.querySelector('.hnet-role-top b')?.textContent||btn.dataset.role));
    return;
   }catch(e){
    if(!/role_already_taken|role_not_available|selected_role_not_available/i.test(String(e?.message||''))){
     console.warn('[HÉRITAGE] draw',e);toastX('Tirage impossible.');await syncHeritageOnline(true).catch(()=>{});return;
    }
   }
  }
  toastX('Aucun rôle libre.');await syncHeritageOnline(true).catch(()=>{});
 }finally{hRolePending=false}
}
async function chooseHeritageRole(roleId){
 const s=hSession();if(!s||hRolePending)return;
 hRolePending=true;
 try{
  await rpc('igr_heritage_online_choose_role',{p_code:s.code,p_player_token:s.token,p_role_id:roleId||null});
  await syncHeritageOnline(true);
 }catch(e){
  const error=String(e?.message||'');
  toastX(/role_already_taken/i.test(error)?'Ce rôle vient d’être réservé par un autre joueur.'
    :/role_not_available/i.test(error)?'Ce rôle n’est plus disponible pour ce nombre de joueurs.'
    :/role_selection_closed/i.test(error)?'La partie a déjà commencé.'
    :'Impossible de réserver ce rôle. Réessaie.');
  await syncHeritageOnline(true).catch(()=>{});
 }finally{hRolePending=false}
}
async function startHeritageOnline(){
 const s=hSession();if(!s?.hostToken)return;
 try{await rpc('igr_heritage_online_start',{p_code:s.code,p_host_token:s.hostToken});await syncHeritageOnline(true)}
 catch(e){console.error(e);
  const err=String(e?.message||'');
  toastX(/selected_role_not_available/i.test(err)?'Un rôle choisi n’est plus disponible : vérifiez les réservations.'
    :/role_already_taken/i.test(err)?'Deux joueurs ont réservé le même rôle.'
    :/need 5 to 7/i.test(err)?'Il faut 5 à 7 joueurs pour lancer.'
    :'Lancement impossible. Vérifiez les rôles et réessayez.');
  await syncHeritageOnline(true).catch(()=>{});
 }
}
function bridgeBase(d,stage){const s=hSession(),players=(d.players||[]).map(p=>({id:p.id,name:p.pseudo,roleId:p.role_id}));return {version:2,online:true,campaignCarry:d.room.campaign_carry||null,campaignId:d.room.campaign_id,chapter:Number(d.room.chapter),players,revealIndex:Math.max(0,players.findIndex(p=>p.id===d.player.id)),revealed:[],phaseIndex:Number(d.room.phase_index||0),stage,decision:d.room.decision_id||null,result:d.room.decision_id?heritageResult(d.room.campaign_id,d.room.chapter,d.room.decision_id):null,practice:!!s?.practice,startedAt:new Date().toISOString(),finished:false}}
function patchOnlineRoleScreen(d=null){if(!hSession()||!$('.hplay-reveal'))return;const head=$('.hplay-reveal .hplay-mode');if(head&&d)head.textContent=`EN LIGNE · ${d.players.filter(p=>p.ready).length}/${d.players.length} PRÊTS`;const quit=$('[data-hp-action="abort"]');if(quit)quit.textContent='← Quitter';const action=$('[data-hp-action="hide-next"]');if(action)action.textContent='J’AI LU · PRÊT';const pass=$('.hplay-private.is-closed .hplay-eyebrow');if(pass&&/PASSEZ LE TÉLÉPHONE/i.test(pass.textContent||''))pass.textContent='VOTRE CARTE PRIVÉE';const p=$('.hplay-private.is-closed p');if(p&&/Personne d’autre/i.test(p.textContent||''))p.textContent='Uniquement visible sur votre téléphone.'}
function renderHRole(d){const live=bridgeBase(d,'reveal');writeJSON(HERITAGE_LIVE_KEY,live);window.IGR_HERITAGE_PLAY?.resume?.();setTimeout(()=>patchOnlineRoleScreen(d),0)}
async function readyHeritageOnline(){const s=hSession();if(!s)return;try{await rpc('igr_heritage_online_ready',{p_code:s.code,p_player_token:s.token});await syncHeritageOnline(true)}catch(e){console.error(e);toastX('Impossible de valider la carte.')}}
function bridgeHPlay(d,stage){const live=bridgeBase(d,stage);writeJSON(HERITAGE_LIVE_KEY,live);window.IGR_HERITAGE_PLAY?.resume?.();requestAnimationFrame(()=>patchHBridge(d,stage))}
function patchHBridge(d,stage){
  const s=hSession();
  const host=!!s?.hostToken;
  if(stage==='play'){
    const nav=$('.hplay-session-nav');
    if(nav){
      const prev=$('[data-hp-action="phase-prev"]',nav);
      if(prev)prev.remove();
      const next=$('[data-hp-action="phase-next"], [data-hp-action="decision"]',nav);
      if(next&&!host){
        next.disabled=true;
        next.textContent='EN ATTENTE DE L’HÔTE…';
      }else if(next){
        next.textContent=Number(d.room.phase_index)<3?'PHASE SUIVANTE →':(['cendres','kuroi'].includes(d.room.campaign_id)?'OUVRIR LE VOTE COLLECTIF →':'PASSER À LA DÉCISION →');
      }
    }
    const mode=$('.hplay-mode');
    if(mode)mode.textContent=`EN LIGNE · PHASE ${Number(d.room.phase_index)+1}/4`;
  }
  if(stage==='decision'){
    const info=document.createElement('div');
    info.className='hnet-decision-note';
    const ballot=['cendres','kuroi'].includes(d.room.campaign_id)?d.room.ballot_status:null;
    info.textContent=ballot
      ?`VOTE COLLECTIF · TOUR ${ballot.vote_round} · ${ballot.votes_cast}/${ballot.players} votes · majorité requise : ${ballot.majority}. ${ballot.my_vote?'Votre voix est enregistrée.':'Chaque joueur vote sur son téléphone.'} ${ballot.vote_round>1?'Le tour précédent n’a dégagé aucune majorité.':''}`
      :host?'Vous êtes l’hôte : verrouillez le choix du groupe.':'Discutez ensemble. Seul l’hôte peut verrouiller la décision.';
    const options=$('.hplay-options');
    if(options){
      options.before(info);
      if(ballot){
        $$('button',options).forEach(b=>{b.disabled=!!ballot.my_vote;b.classList.toggle('is-voted',!!ballot.my_vote&&b.dataset.hpOption===ballot.my_vote)});
      }else if(!host)$$('button',options).forEach(b=>b.disabled=true);
    }
    const mode=$('.hplay-mode');
    if(mode)mode.textContent='EN LIGNE · DÉCISION';
  }
  if(stage==='result'){
    const btn=$('[data-hp-action="finish"]');
    if(btn)btn.textContent=host?(s.practice?'TERMINER LE REPLAY':'INSCRIRE DANS L’HÉRITAGE'):'RETOUR À L’ACCUEIL';
    const mode=$('.hplay-mode');
    if(mode)mode.textContent='EN LIGNE · RÉVÉLATION';
  }
}
async function advanceHeritageOnline(){const s=hSession();if(!s?.hostToken)return toastX('Seul l’hôte contrôle les phases.');try{await rpc('igr_heritage_online_advance',{p_code:s.code,p_host_token:s.hostToken});await syncHeritageOnline(true)}catch(e){console.error(e);toastX('Impossible de changer de phase.')}}
async function decideHeritageOnline(decision){
  const s=hSession();if(!s||hVotePending)return;
  if(!['cendres','kuroi'].includes(s.campaign)&&!s.hostToken)return toastX('Seul l’hôte verrouille la décision.');
  hVotePending=true;
  try{
    if(['cendres','kuroi'].includes(s.campaign)){
      // All 5–7 player tokens have one equal vote. Host token is deliberately unused.
      const voteRpc=s.campaign==='cendres'?'igr_heritage_online_vote_cendres':'igr_heritage_online_vote_kuroi';
      const result=await rpc(voteRpc,{p_code:s.code,p_player_token:s.token,p_option_id:decision});
      if(result?.new_round)toastX('Aucune majorité : un nouveau vote commence.');
    }else{
      await rpc('igr_heritage_online_decide',{p_code:s.code,p_host_token:s.hostToken,p_option_id:decision});
    }
    await syncHeritageOnline(true);
  }catch(e){
    console.error(e);
    toastX(['cendres','kuroi'].includes(s.campaign)?'Vote non enregistré. Réessaie.':'Décision non confirmée.');
  }finally{hVotePending=false}
}
async function leaveHeritageOnline(){
  const s=hSession();if(!s)return;
  if(['cendres','kuroi'].includes(s.campaign)&&hLastStage&&hLastStage!=='lobby'&&hLastStage!=='finished'){
    // Preserve the seat and player token: disconnecting must not shrink the majority.
    if(hWatcher){clearInterval(hWatcher);hWatcher=null}
    hLastSig='';del(HERITAGE_LIVE_KEY);
    try{renderHome()}catch{location.reload()}
    toastX('Votre place est conservée. Reprenez la cellule pour voter.');
    return;
  }
  try{
    const out=await rpc('igr_heritage_online_leave',{p_code:s.code,p_player_token:s.token});
    if(out?.resume_required){
      if(hWatcher){clearInterval(hWatcher);hWatcher=null}
      hLastSig='';del(HERITAGE_LIVE_KEY);renderHome();
      toastX('Votre place est conservée. Reprenez la cellule pour voter.');return;
    }
  }catch(e){console.warn('heritage leave',e)}
  clearHSession();del(HERITAGE_LIVE_KEY);
  try{renderHome()}catch{location.reload()}
}
async function finishHeritageOnlineHost(){
  const s=hSession();if(!s?.hostToken||hFinishPending)return;
  hFinishPending=true;
  try{
    const out=await rpc('igr_heritage_online_finish',{p_code:s.code,p_host_token:s.hostToken});
    if(out?.ok===false)throw new Error('server finish refused');
    const verified=await rpc('igr_heritage_online_sync',{p_code:s.code,p_player_token:s.token});
    if(verified?.room?.stage!=='finished')throw new Error('server finish not confirmed');
    const stored=window.IGR_HERITAGE_PLAY?.finishOnlineConfirmed?.(verified.room,!!s.practice);
    if(!stored)throw new Error('the confirmed Heritage result could not be persisted');
    clearHSession();del(HERITAGE_LIVE_KEY);
  }catch(e){
    console.warn('heritage online finish',e);
    toastX('Clôture non synchronisée. Réessayez depuis ce dossier.');
  }finally{hFinishPending=false}
}
function renderHFinished(d){
  const s=hSession(),host=!!s?.hostToken;
  if(host){
    const stored=window.IGR_HERITAGE_PLAY?.finishOnlineConfirmed?.(d.room,!!s.practice);
    if(!stored){
      shellPut(`<main class="page hnet hplay-theme-${d.room.campaign_id}"><section class="hnet-finished"><span>SAUVEGARDE À TERMINER</span><h1>Le serveur a clos ce dossier.</h1><p>La conséquence n’a pas encore été inscrite dans votre campagne. Votre accès est conservé pour réessayer.</p><button class="btn primary" id="hnetRecover">RÉESSAYER LA SYNCHRONISATION</button></section></main>`);
      $('#hnetRecover')?.addEventListener('click',()=>syncHeritageOnline(true));
      return;
    }
    clearHSession();del(HERITAGE_LIVE_KEY);
    return;
  }
  clearHSession();del(HERITAGE_LIVE_KEY);
  shellPut(`<main class="page hnet hplay-theme-${d.room.campaign_id}"><section class="hnet-finished"><span>PARTIE TERMINÉE</span><h1>Le dossier est clos.</h1><p>Le résultat collectif a été confirmé par le serveur.</p><button class="btn primary" id="hnetHome">RETOUR À L’ACCUEIL</button></section></main>`);
  $('#hnetHome')?.addEventListener('click',()=>renderHome());
}
function showExistingHeritageRoom(onCreate,onBack,requestedCampaign){
 const s=hSession();if(!s)return onCreate?.();
 // Pause both controllers while a player makes an explicit choice.
 hBrowsingLobby=true;hBrowseEpoch++;if(hWatcher){clearInterval(hWatcher);hWatcher=null}
 if(s.campaign==='maitre')window.IGR_HERITAGE_MAITRE_ONLINE?.pauseRoomChoice?.();
 const title=heritageMeta(s.campaign)?.title||String(s.campaign||'HÉRITAGE').toUpperCase();
 shellPut(`<main class="page hnet hplay-theme-${esc(requestedCampaign||s.campaign)}"><header class="hnet-head"><button type="button" class="btn ghost small" id="hnetBack">← Retour</button><span>HÉRITAGE · EN LIGNE</span></header><section class="hnet-create"><span>${esc(title)} · DOSSIER 0${esc(s.chapter)}</span><h1>Cellule déjà ouverte</h1><p>Code : <strong>${esc(s.code)}</strong>. Reprends ta salle ou quitte-la pour en créer une autre.</p><button type="button" class="btn primary block" id="hnetResumeExisting">REPRENDRE LA CELLULE</button><button type="button" class="btn ghost block" id="hnetReleaseExisting">${s.hostToken?'FERMER LA CELLULE':'QUITTER LA CELLULE'}</button><p id="hnetRoomChoiceStatus" role="status" aria-live="polite"></p></section></main>`);
 const resume=$('#hnetResumeExisting'),release=$('#hnetReleaseExisting'),status=$('#hnetRoomChoiceStatus'),back=$('#hnetBack');
 let pending=false;
 back?.addEventListener('click',()=>{if(!pending)onBack?.()});
 resume?.addEventListener('click',async()=>{
  if(pending)return;pending=true;resume.disabled=true;release.disabled=true;
  try{
   const d=await rpc('igr_heritage_online_sync',{p_code:s.code,p_player_token:s.token});
   if(hSession()?.token!==s.token)return;
   if(!d?.room)throw Error('room unavailable');
   resumeHeritageOnline();
  }catch(e){
   if(hSession()?.token!==s.token)return;
   if(/expired|unauthorized|not.found|room unavailable/i.test(e.message||'')){
    clearHSession();del(HERITAGE_LIVE_KEY);onCreate?.();return;
   }
   status.textContent='Connexion impossible. Réessaie ou reviens en arrière.';
  }finally{pending=false;resume.disabled=false;release.disabled=false}
 });
 release?.addEventListener('click',async()=>{
  if(pending)return;
  if(!window.confirm(s.hostToken?'Fermer cette cellule pour tous les participants ?':'Quitter cette cellule et libérer ton rôle ?'))return;
  pending=true;resume.disabled=true;release.disabled=true;status.textContent='';
  try{
   const out=await rpc('igr_heritage_online_leave',{p_code:s.code,p_player_token:s.token});
   if(hSession()?.token!==s.token)return;
   if(out?.resume_required||out?.ok===false){status.textContent='La partie a commencé. Reprends la cellule pour continuer.';return}
   if(out?.ok!==true)throw Error('leave not confirmed');
   clearHSession();del(HERITAGE_LIVE_KEY);onCreate?.();
  }catch(e){status.textContent='Impossible de quitter la cellule. Réessaie.'}
  finally{pending=false;resume.disabled=false;release.disabled=false}
 });
}
function backHeritageLobby(to){
 const s=hSession();if(!s||s.campaign==='maitre'||hLastStage!=='lobby'||!$('.hnet-lobby')||![0,1,2,3].includes(to))return false;
 hBrowsingLobby=true;hBrowseEpoch++;if(hWatcher){clearInterval(hWatcher);hWatcher=null}
 if(to===0)window.IGR_HERITAGE_PLAY?.open?.();
 else if(to===1)window.IGR_HERITAGE_PLAY?.openCampaign?.(s.campaign);
 else if(to===2)window.IGR_HERITAGE_PLAY?.openChapter?.(s.campaign,s.chapter);
 else{
  const m=heritageMeta(s.campaign),ch=m?.chapters?.[s.chapter-1];
  shellPut(`<main class="page hnet hplay-theme-${esc(s.campaign)}"><header class="hnet-head"><button class="btn ghost small" id="hnetBack">← Retour</button><span>HÉRITAGE · EN LIGNE</span></header><section class="hnet-create"><span>${esc(m?.title||s.campaign)} · DOSSIER 0${s.chapter}</span><h1>Préparation</h1><p>Ta cellule reste ouverte et ton rôle est conservé. Code : <strong>${esc(s.code)}</strong></p><button class="btn primary block" id="hnetResumeLobby">REVENIR AU LOBBY</button></section></main>`);
  $('#hnetBack')?.addEventListener('click',()=>window.IGR_HERITAGE_PLAY?.openChapter?.(s.campaign,s.chapter));
  $('#hnetResumeLobby')?.addEventListener('click',resumeHeritageOnline);
 }
 return true;
}
function resumeHeritageOnline(){if(!hSession())return toastX('Aucune cellule HÉRITAGE à reprendre.');startHWatcher(true)}

function interceptHeritageOnline(e){const s=hSession();if(!s)return;const hp=e.target.closest?.('[data-hp-action],[data-hp-option]');if(!hp)return;const a=hp.dataset.hpAction;if(a==='hide-next'){e.preventDefault();e.stopImmediatePropagation();readyHeritageOnline();return}if(a==='phase-next'||a==='decision'){e.preventDefault();e.stopImmediatePropagation();advanceHeritageOnline();return}if(a==='phase-prev'){e.preventDefault();e.stopImmediatePropagation();return}if(hp.dataset.hpOption){e.preventDefault();e.stopImmediatePropagation();decideHeritageOnline(hp.dataset.hpOption);return}if(a==='abort'||a==='session-menu'){e.preventDefault();e.stopImmediatePropagation();leaveHeritageOnline();return}if(a==='finish'){e.preventDefault();e.stopImmediatePropagation();if(!s.hostToken){clearHSession();del(HERITAGE_LIVE_KEY);renderHome();return}void finishHeritageOnlineHost();return}}
async function handleHNetClick(e){const b=e.target.closest?.('[data-hnet]');if(!b)return;e.preventDefault();if(b.dataset.hnet==='copy-code'){const code=b.dataset.code||'';try{await navigator.clipboard.writeText(code);toastX('Code copié.')}catch{toastX('Code à partager : '+code)}return}if(b.dataset.hnet==='role'){if(b.dataset.random==='1'){void drawHeritageOnlineRole();return}if(b.getAttribute('aria-pressed')!=='true')void chooseHeritageRole(b.dataset.role||'');return}if(b.dataset.hnet==='start')startHeritageOnline();if(b.dataset.hnet==='leave')leaveHeritageOnline()}

/* ------------------------------------------------------------------
   BOOT / WRAPPERS
------------------------------------------------------------------ */
function installWrappers(){
  if(typeof renderCreateConfirm==='function'&&!baseRenderCreateConfirm){baseRenderCreateConfirm=renderCreateConfirm;renderCreateConfirm=function(){const out=baseRenderCreateConfirm.apply(this,arguments);queueMicrotask(enhanceStandardConfirm);requestAnimationFrame(enhanceStandardConfirm);return out}}
  if(typeof joinRoom==='function'&&!baseJoinRoom){baseJoinRoom=joinRoom;joinRoom=dualJoinRoom}
}
function boot(){
  installWrappers();
  window.addEventListener('click',interceptHeritageOnline,true);
  document.addEventListener('click',handleLocalClick);
  document.addEventListener('submit',handleLocalSubmit);
  document.addEventListener('click',handleHNetClick);
  const obs=new MutationObserver(()=>{queueMicrotask(()=>{enhanceStandardConfirm();enhanceHeritageChapter();patchOnlineRoleScreen()})});obs.observe(document.documentElement,{childList:true,subtree:true});
  enhanceStandardConfirm();enhanceHeritageChapter();
  window.addEventListener('pageshow',()=>{installWrappers();setTimeout(()=>{enhanceStandardConfirm();enhanceHeritageChapter()},0)},{passive:true});
  window.IGR_PLAY_MODES=Object.freeze({version:BUILD,openLocal:renderStandardLocalSetup,resumeHeritageOnline,backHeritageLobby,showExistingHeritageRoom});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
