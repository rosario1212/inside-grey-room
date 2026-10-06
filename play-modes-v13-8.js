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
function shellPut(html){const root=$('#app');if(!root)return;root.innerHTML=typeof shell==='function'?shell(html,false):`<div class="app">${html}</div>`;requestAnimationFrame(()=>scrollTo({top:0,behavior:'auto'}))}
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
  let payload;
  try{payload=await getStandardPack(id)}catch(e){
    console.error(e);
    shellPut(`<main class="page localplay"><button class="btn ghost small local-top-back" id="localBack2">← Dossier</button><section class="local-error"><span>MODE LOCAL</span><h1>Accès impossible</h1><p>${/premium|access/i.test(e.message||'')?'Ce dossier nécessite l’accès premium correspondant.':'Le dossier local n’a pas pu être chargé. Vérifie la connexion puis réessaie.'}</p></section></main>`);
    $('#localBack2')?.addEventListener('click',()=>{STATE.selectedScenario=id;STATE.view='create-confirm';renderCreateConfirm()});return;
  }
  const min=Number(payload.min_players||sc.min||4),max=Number(payload.max_players||sc.max||min),prev=readJSON(LOCAL_KEY);
  const count=clamp(prev?.scenarioId===id?prev.players?.length||min:min,min,max);
  shellPut(`<main class="page localplay local-setup"><header class="local-head"><button class="btn ghost small" id="localBack3">← ${esc(sc.title)}</button><span>MODE LOCAL · 1 TÉLÉPHONE</span></header><section class="local-title"><div class="local-poster-mini"><img src="${art(id)}" alt=""></div><div><span>DOSSIER ${esc(id)}</span><h1>Composer la cellule</h1><p>Les cartes privées seront révélées une par une. Ensuite, le téléphone revient au centre de la table.</p></div></section><form id="localSetupForm" class="local-panel"><div class="local-count"><div><b>JOUEURS</b><small>${min}${max!==min?`–${max}`:''} joueurs</small></div><div class="local-stepper"><button type="button" data-local-count="-1">−</button><strong id="localCount">${count}</strong><button type="button" data-local-count="1">+</button></div></div><div id="localNames" class="local-names"></div><button class="btn primary block" type="submit">ATTRIBUER LES RÔLES</button></form></main>`);
  const build=(n,values=[])=>{$('#localNames').innerHTML=Array.from({length:n},(_,i)=>`<label><span>J${i+1}</span><input required maxlength="22" autocomplete="off" value="${esc(values[i]||'')}" placeholder="Pseudo ${i+1}"></label>`).join('')};
  build(count,prev?.scenarioId===id?(prev.players||[]).map(x=>x.name):[]);
  $('#localBack3')?.addEventListener('click',()=>{STATE.selectedScenario=id;STATE.view='create-confirm';renderCreateConfirm()});
  $$('[data-local-count]').forEach(btn=>btn.addEventListener('click',()=>{const now=Number($('#localCount').textContent),next=clamp(now+Number(btn.dataset.localCount),min,max),vals=$$('#localNames input').map(x=>x.value);if(next!==now){$('#localCount').textContent=String(next);build(next,vals)}}));
  $('#localSetupForm')?.addEventListener('submit',e=>{e.preventDefault();const names=$$('#localNames input').map(x=>x.value.trim()).filter(Boolean);if(names.length<min)return toastX(`Il faut au moins ${min} joueurs.`);startStandardLocal(id,payload.pack,names)});
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
function buildLocalPlayers(id,pack,names){
  const sc=scenarioObj(id),count=names.length;
  let slots=[];try{slots=lobbyRoleSlots(sc,count)}catch{}
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
      const rels=(pack.relations?.[String(p.slot)]||[]).map(r=>{const q=players.find(x=>x.role==='suspect'&&x.slot===Number(r.slot));return {pseudo:q?.name||`Suspect ${r.slot}`,text:r.text||''}});card.relations=rels;
    }else{
      card=genericCard(p.role,pack.context||'');Object.assign(card,pack.role_notes?.[p.role]||{});
      if(p.role==='temoin'){const rank=witnesses.indexOf(p);Object.assign(card,pack.witnesses?.[Math.max(0,rank)]||{})}
      if(p.role==='maitre'){
        const rank=lawyers.indexOf(p),n=Math.max(1,lawyers.length);card.clients=players.filter(x=>x.role==='suspect'&&((x.slot-1)%n)===rank).map(x=>x.name);
      }
    }
    if(p.secretRole==='espion')card.secret_mission=pack.espion_mission||'Observe et détourne sans inventer de preuve.';
    p.card=card;
  }
  return players;
}
function pickTrames(pack){const used=new Set(),plan=[];for(let cycle=1;cycle<=3;cycle++){const eligible=(pack.trames||[]).filter((t,i)=>!used.has(i)&&Number(t.min_cycle||1)<=cycle);const exact=eligible.filter(t=>Number(t.min_cycle||1)===cycle);const pool=exact.length?exact:eligible;if(pool.length){const chosen=pool[secureIndex(pool.length)],idx=(pack.trames||[]).indexOf(chosen);used.add(idx);plan.push(chosen)}else plan.push(null)}return plan}
function startStandardLocal(id,pack,names){
  const players=buildLocalPlayers(id,pack,names),state={version:1,scenarioId:id,pack,players,revealIndex:0,revealOpen:false,stage:'reveal',cycle:1,trameOpen:false,tramePlan:pickTrames(pack),verdict:{},startedAt:new Date().toISOString()};writeJSON(LOCAL_KEY,state);renderStandardLocal();
}
function readLocal(){return readJSON(LOCAL_KEY)}
function saveLocal(s){writeJSON(LOCAL_KEY,s)}
function privateBlocks(card){
  const blocks=[['TA PLACE',card.place],['TA CHRONOLOGIE',card.chronology],['CE QUE TU CACHES',card.hide],['TES REPÈRES',card.anchors],['TA POSITION',card.position],['TES RELATIONS',card.relations],['TES CLIENTS',card.clients],['MISSION SECRÈTE',card.secret_mission]];
  return blocks.filter(([,v])=>v!=null&&v!==''&&(!Array.isArray(v)||v.length)).map(([k,v])=>`<div class="local-private-block"><span>${esc(k)}</span>${Array.isArray(v)?v.map(x=>`<p>${esc(typeof x==='string'?x:`${x.pseudo||''} — ${x.text||''}`)}</p>`).join(''):`<p>${esc(v)}</p>`}</div>`).join('');
}
function renderStandardLocal(){
  const s=readLocal();if(!s)return renderHome?.();
  if(s.stage==='reveal')return renderLocalReveal(s);
  if(s.stage==='briefing')return renderLocalBriefing(s);
  if(s.stage==='cycle')return renderLocalCycle(s);
  if(s.stage==='verdict')return renderLocalVerdict(s);
  if(s.stage==='result')return renderLocalResult(s);
}
function localHeader(s,label){const sc=scenarioObj(s.scenarioId);return `<header class="local-head"><button class="btn ghost small" data-local-act="quit">× Quitter</button><span>DOSSIER ${esc(s.scenarioId)} · ${esc(label)}</span></header><div class="local-case-name">${esc(sc?.title||'')}</div>`}
function renderLocalReveal(s){const p=s.players[s.revealIndex];shellPut(`<main class="page localplay local-reveal">${localHeader(s,`CARTE ${s.revealIndex+1}/${s.players.length}`)}<section class="local-private-card ${s.revealOpen?'is-open':'is-sealed'}">${s.revealOpen?`<span>CARTE PRIVÉE · ${esc(p.name)}</span><h1>${esc(roleLabel(p.role))}${p.secretRole==='espion'?' · COUVERTURE':''}</h1>${privateBlocks(p.card)}<button class="btn primary block" data-local-act="next-card">MASQUER & PASSER</button>`:`<div class="local-seal">◇</div><span>PASSEZ LE TÉLÉPHONE À</span><h1>${esc(p.name)}</h1><p>Personne d’autre ne doit regarder l’écran.</p><button class="btn primary block" data-local-act="open-card">RÉVÉLER MA CARTE</button>`}</section></main>`)}
function renderLocalBriefing(s){const sc=scenarioObj(s.scenarioId);shellPut(`<main class="page localplay local-table">${localHeader(s,'BRIEFING')}<section class="local-briefing-hero"><img src="${art(s.scenarioId)}" alt=""><div><span>CONTEXTE PUBLIC</span><h1>${esc(sc?.title||'')}</h1><p>${esc(s.pack.context||sc?.context||'')}</p></div></section><section class="local-panel local-roster"><div class="local-section-title"><span>À TABLE</span><b>${s.players.length} JOUEURS</b></div>${s.players.map(p=>`<div><b>${esc(p.name)}</b><small>${esc(roleLabel(p.role))}</small></div>`).join('')}</section><button class="btn primary block" data-local-act="start-cycles">COMMENCER L’ENQUÊTE</button></main>`)}
function renderLocalCycle(s){const cycle=clamp(Number(s.cycle||1),1,3),suspects=s.players.filter(p=>p.role==='suspect').sort((a,b)=>(a.slot||0)-(b.slot||0)),target=suspects[(cycle-1)%Math.max(1,suspects.length)],trame=s.tramePlan?.[cycle-1];shellPut(`<main class="page localplay local-table">${localHeader(s,`CYCLE ${cycle}/3`)}<section class="local-cycle-head"><span>INTERROGATION · 8 MIN</span><h1>${target?esc(target.name):'Interrogation libre'}</h1><p>Les joueurs parlent face à face. Le téléphone reste au centre jusqu’à la trame.</p></section><section class="local-panel local-cycle-panel"><div class="local-section-title"><span>TRAME DU CYCLE</span><b>${s.trameOpen?'RÉVÉLÉE':'SCELLÉE'}</b></div>${s.trameOpen?(trame?`<div class="local-trame"><span>${esc(trame.kind||'TRAME')}</span><h2>${esc(trame.title||'NOUVEL ÉLÉMENT')}</h2><p>${esc(trame.text||'')}</p></div>`:`<div class="local-trame"><h2>Aucune trame supplémentaire</h2><p>Continuez le recoupement à partir des cartes privées.</p></div>`):`<button class="local-sealed-trame" data-local-act="reveal-trame"><span>◇</span><b>RÉVÉLER LA TRAME</b><small>À ouvrir après l’interrogation.</small></button>`}</section><section class="local-panel local-role-reminder"><span>RAPPEL</span><p>Les pouvoirs spéciaux restent joués à l’oral dans ce mode local. Une carte privée ou une trame ne peut jamais être modifiée ou inventée.</p></section>${s.trameOpen?`<button class="btn primary block" data-local-act="next-cycle">${cycle<3?'CYCLE SUIVANT':'PASSER AU VERDICT'}</button>`:''}</main>`)}
function renderLocalVerdict(s){const suspects=s.players.filter(p=>p.role==='suspect').sort((a,b)=>(a.slot||0)-(b.slot||0));shellPut(`<main class="page localplay local-verdict">${localHeader(s,'VERDICT')}<section class="local-cycle-head"><span>RESPONSABILITÉ FINALE</span><h1>Verrouiller la reconstruction</h1><p>Attribuez à chaque suspect un niveau de 0 à 3. Le téléphone peut rester au centre : il ne contient plus d’information privée.</p></section><form id="localVerdictForm" class="local-panel local-verdict-list">${suspects.map(p=>`<label><span><b>${esc(p.name)}</b><small>0 = hors de cause · 3 = responsabilité centrale</small></span><select data-suspect-slot="${p.slot}">${[0,1,2,3].map(v=>`<option value="${v}" ${Number(s.verdict?.[p.slot]??1)===v?'selected':''}>${v}</option>`).join('')}</select></label>`).join('')}<button class="btn primary block" type="submit">RÉVÉLER LA VÉRITÉ</button></form></main>`)}
function normalizeTruthLevels(pack,suspects){const x=pack.truth?.levels;if(Array.isArray(x))return x.map(Number);if(x&&typeof x==='object')return suspects.map((_,i)=>Number(x[String(i+1)]??x[i+1]??0));return suspects.map(()=>0)}
function renderLocalResult(s){const suspects=s.players.filter(p=>p.role==='suspect').sort((a,b)=>(a.slot||0)-(b.slot||0)),levels=normalizeTruthLevels(s.pack,suspects);let pts=0;const rows=suspects.map((p,i)=>{const pred=Number(s.verdict?.[p.slot]??0),real=Number(levels[i]??0),diff=Math.abs(pred-real);pts+=Math.max(0,3-diff);return `<div><span><b>${esc(p.name)}</b><small>estimé ${pred} · réel ${real}</small></span><strong>${diff===0?'EXACT':diff===1?'PROCHE':'ÉCART'}</strong></div>`}).join('');const max=Math.max(1,suspects.length*3),score=Math.round(100*pts/max);shellPut(`<main class="page localplay local-result">${localHeader(s,'RÉVÉLATION')}<section class="local-result-card"><span>VÉRITÉ CANONIQUE</span><h1>${score}%</h1><p>${esc(s.pack.truth?.summary||'La vérité du dossier est révélée.')}</p><div class="local-result-rows">${rows}</div><div class="local-score"><b>FORCE DE RECONSTRUCTION</b><strong>${score}/100</strong></div><button class="btn primary block" data-local-act="finish-local">TERMINER</button></section></main>`)}

function handleLocalClick(e){const b=e.target.closest?.('[data-local-act]');if(!b)return;const s=readLocal();if(!s)return;e.preventDefault();const a=b.dataset.localAct;if(a==='quit'){if(confirm('Quitter cette partie locale ? La progression locale sera conservée.')){STATE.selectedScenario=s.scenarioId;STATE.view='create-confirm';renderCreateConfirm()}return}if(a==='open-card'){s.revealOpen=true;saveLocal(s);renderStandardLocal();return}if(a==='next-card'){s.revealOpen=false;if(s.revealIndex>=s.players.length-1){s.stage='briefing'}else s.revealIndex++;saveLocal(s);renderStandardLocal();return}if(a==='start-cycles'){s.stage='cycle';s.cycle=1;s.trameOpen=false;saveLocal(s);renderStandardLocal();return}if(a==='reveal-trame'){s.trameOpen=true;saveLocal(s);renderStandardLocal();return}if(a==='next-cycle'){if(s.cycle<3){s.cycle++;s.trameOpen=false}else s.stage='verdict';saveLocal(s);renderStandardLocal();return}if(a==='finish-local'){del(LOCAL_KEY);STATE.selectedScenario=s.scenarioId;STATE.view='create-confirm';renderCreateConfirm();return}}
function handleLocalSubmit(e){if(e.target.id!=='localVerdictForm')return;e.preventDefault();const s=readLocal();if(!s)return;const verdict={};$$('[data-suspect-slot]',e.target).forEach(sel=>verdict[sel.dataset.suspectSlot]=Number(sel.value));s.verdict=verdict;s.stage='result';saveLocal(s);renderStandardLocal()}

/* ------------------------------------------------------------------
   HÉRITAGE · LOCAL + ONLINE
------------------------------------------------------------------ */
let hWatcher=null,hLastSig='';
function hSession(){return readJSON(HNET_KEY)}
function saveHSession(v){writeJSON(HNET_KEY,v)}
function clearHSession(){del(HNET_KEY);hLastSig='';if(hWatcher){clearInterval(hWatcher);hWatcher=null}}
function heritageMeta(campaign){return window.IGR_HERITAGE?.campaigns?.[campaign]}
function heritageCarry(campaign){
  try{const s=window.IGR_HERITAGE?.get?.(campaign);if(!s)return[];if(campaign==='cendres'){return [`Crise : ${s.cendres?.crisis?.label||'SOUS CONTRÔLE'}`,`${s.cendres?.network?.nodes?.length||0} identités`,`${s.cendres?.network?.links?.length||0} connexions`]}return [`${(s.kuroi?.debts||[]).filter(d=>d.status==='due').length} dettes ouvertes`,`${s.kuroi?.chronicle?.length||0} faits dans la Chronique`]}catch{return[]}
}
function enhanceHeritageChapter(){
  const box=$('.hplay-dossier .hplay-launch-box');if(!box||box.dataset.dualHeritage==='1')return;
  const old=$('.hplay-launch',box);if(!old)return;
  const campaign=old.dataset.campaign,chapter=Number(old.dataset.chapter);if(!campaign||!chapter)return;
  box.dataset.dualHeritage='1';
  const label=$('b',box);if(label)label.textContent='CHOISISSEZ LE MODE DE JEU';
  const p=$('p',box);if(p)p.textContent='Même campagne, deux façons de jouer : chacun sur son téléphone ou un téléphone partagé à table.';
  const row=document.createElement('div');row.className='heritage-dual-row';
  const hs=hSession(),onlineResume=hs&&hs.campaign===campaign&&Number(hs.chapter)===chapter;
  const localLabel=(old.textContent||'').includes('REPRENDRE')?'REPRENDRE EN LOCAL':'LOCAL · 1 TÉLÉPHONE';
  row.innerHTML=`<button type="button" class="btn heritage-online-btn">${onlineResume?'REPRENDRE EN LIGNE':'MULTIJOUEUR EN LIGNE'}</button><button type="button" class="btn ghost heritage-local-btn">${localLabel}</button>`;
  old.replaceWith(row);
  $('.heritage-online-btn',row)?.addEventListener('click',()=>onlineResume?resumeHeritageOnline():renderHeritageOnlineCreate(campaign,chapter,/ARCHIVÉ|REJOUER/i.test(box.textContent||'')));
  $('.heritage-local-btn',row)?.addEventListener('click',async()=>{if(hSession()){try{await rpc('igr_heritage_online_leave',{p_code:hSession().code,p_player_token:hSession().token})}catch{}clearHSession();del(HERITAGE_LIVE_KEY)}const temp=document.createElement('button');temp.dataset.hpAction=(old.dataset.hpAction==='resume'?'resume':'setup');temp.dataset.campaign=campaign;temp.dataset.chapter=String(chapter);temp.style.display='none';document.body.appendChild(temp);temp.click();temp.remove()});
}
function renderHeritageOnlineCreate(campaign,chapter,practice=false){const m=heritageMeta(campaign),ch=m?.chapters?.[chapter-1];shellPut(`<main class="page hnet hplay-theme-${campaign}${campaign==='maitre'?' maitre-page':''}"><header class="hnet-head"><button class="btn ghost small" id="hnetBack">← ${esc(ch?.title||'Héritage')}</button><span>HÉRITAGE · EN LIGNE</span></header><section class="hnet-create"><span>${esc(m?.title||campaign)} · DOSSIER 0${chapter}</span><h1>Créer une cellule en ligne</h1><p>Chaque joueur rejoint avec son téléphone. Les rôles et informations privées restent sur l’écran de leur propriétaire.</p><label><span>TON PSEUDO</span><input id="hnetPseudo" maxlength="22" autocomplete="nickname" value="${esc(pseudoDefault())}" placeholder="Pseudo"></label><button class="btn primary block" id="hnetCreateBtn">CRÉER LA CELLULE</button></section></main>`);$('#hnetBack')?.addEventListener('click',()=>window.IGR_HERITAGE_PLAY?.openChapter?.(campaign,chapter));$('#hnetCreateBtn')?.addEventListener('click',()=>createHeritageOnline(campaign,chapter,practice))}
async function createHeritageOnline(campaign,chapter,practice){const pseudo=$('#hnetPseudo')?.value.trim();if(!pseudo)return toastX('Entre ton pseudo.');const ident=profileIdentity();if(!ident?.id||!ident?.token)return toastX('Ton profil est requis pour ouvrir HÉRITAGE.');let out=null,code=null;for(let i=0;i<5;i++){code=newHCode();try{out=await rpc('igr_heritage_online_create',{p_code:code,p_campaign_id:campaign,p_chapter:chapter,p_pseudo:pseudo,p_profile_id:ident.id,p_profile_token:ident.token});break}catch(e){if(i===4||!/duplicate|23505/i.test(`${e.code||''} ${e.message||''}`)){console.error(e);return toastX(/access/i.test(e.message||'')?'Accès HÉRITAGE requis.':'Création impossible.')}}}storage().setItem('igr_v9_last_pseudo',pseudo);saveHSession({code:out.room_code||code,token:out.player_token,hostToken:out.host_token,playerId:out.player_id,campaign,chapter,practice:!!practice});startHWatcher(true)}
async function dualJoinRoom(){const pseudo=($('#joinPseudo')?.value||'').trim(),code=($('#joinCode')?.value||'').trim().toUpperCase();if(!pseudo||code.length!==5)return toastX('Pseudo et code requis.');if(code.startsWith('H')){try{const out=await rpc('igr_heritage_online_join',{p_code:code,p_pseudo:pseudo});storage().setItem('igr_v9_last_pseudo',pseudo);saveHSession({code:out.room_code||code,token:out.player_token,hostToken:null,playerId:out.player_id,campaign:out.campaign_id,chapter:out.chapter,practice:false});startHWatcher(true);return}catch(e){if(!/heritage[_ ]room[_ ]not[_ ]found/i.test(e.message||'')){console.error(e);return toastX(/full/i.test(e.message||'')?'Cellule HÉRITAGE complète.':/started/i.test(e.message||'')?'Cette campagne a déjà commencé.':'Impossible de rejoindre cette cellule HÉRITAGE.')}}}return baseJoinRoom?.()}
function startHWatcher(immediate=false){if(hWatcher)clearInterval(hWatcher);hWatcher=setInterval(()=>syncHeritageOnline(false),850);if(immediate)syncHeritageOnline(true)}
async function syncHeritageOnline(force=false){const s=hSession();if(!s)return;if(document.hidden&&!force)return;try{const d=await rpc('igr_heritage_online_sync',{p_code:s.code,p_player_token:s.token});const sig=JSON.stringify([d.room?.status,d.room?.stage,d.room?.phase_index,d.room?.decision_id,(d.players||[]).map(p=>[p.id,p.ready,p.role_id])]);if(!force&&sig===hLastSig)return;hLastSig=sig;routeHOnline(d)}catch(e){console.warn('heritage online sync',e.message);if(/expired|unauthorized/i.test(e.message||'')){clearHSession();toastX('La cellule HÉRITAGE a expiré.')}}}
function routeHOnline(d){const stage=d.room?.stage;if(stage==='lobby')return renderHLobby(d);if(stage==='role_reading')return renderHRole(d);if(stage==='play')return bridgeHPlay(d,'play');if(stage==='decision')return bridgeHPlay(d,'decision');if(stage==='reveal')return bridgeHPlay(d,'result');if(stage==='finished')return renderHFinished(d)}
function renderHLobby(d){const s=hSession(),host=!!s?.hostToken,count=d.players?.length||0;const m=heritageMeta(d.room.campaign_id),ch=m?.chapters?.[d.room.chapter-1];shellPut(`<main class="page hnet hplay-theme-${d.room.campaign_id}"><header class="hnet-head"><button class="btn ghost small" data-hnet="leave">← Quitter</button><span>${esc(m?.title||'HÉRITAGE')} · DOSSIER 0${d.room.chapter}</span></header><section class="hnet-lobby"><div class="hnet-code"><span>CODE DE CELLULE</span><strong>${esc(d.room.code)}</strong><small>Les autres joueurs : Rejoindre une partie → ${esc(d.room.code)}</small></div><div class="hnet-title"><span>MULTIJOUEUR EN LIGNE</span><h1>${esc(ch?.title||'')}</h1><p>${count}/7 joueurs · minimum 5</p></div><div class="hnet-players">${(d.players||[]).map((p,i)=>`<div><span>${i+1}</span><b>${esc(p.pseudo)}</b><small>${p.is_host?'HÔTE':'CONNECTÉ'}</small></div>`).join('')}</div>${host?`<button class="btn primary block" data-hnet="start" ${count<5?'disabled':''}>${count<5?`ENCORE ${5-count} JOUEUR${5-count>1?'S':''}`:'LANCER LE DOSSIER'}</button>`:`<div class="hnet-wait">En attente de l’hôte…</div>`}</section></main>`)}
async function startHeritageOnline(){const s=hSession();if(!s?.hostToken)return;try{await rpc('igr_heritage_online_start',{p_code:s.code,p_host_token:s.hostToken});await syncHeritageOnline(true)}catch(e){console.error(e);toastX('Il faut 5 à 7 joueurs pour lancer.') }}
function bridgeBase(d,stage){const s=hSession(),players=(d.players||[]).map(p=>({id:p.id,name:p.pseudo,roleId:p.role_id}));return {version:2,campaignId:d.room.campaign_id,chapter:Number(d.room.chapter),players,revealIndex:Math.max(0,players.findIndex(p=>p.id===d.player.id)),revealed:[],phaseIndex:Number(d.room.phase_index||0),stage,decision:d.room.decision_id||null,result:d.room.decision_id?heritageResult(d.room.campaign_id,d.room.chapter,d.room.decision_id):null,practice:!!s?.practice,startedAt:new Date().toISOString(),finished:false}}
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
        next.textContent=Number(d.room.phase_index)<3?'PHASE SUIVANTE →':'PASSER À LA DÉCISION →';
      }
    }
    const mode=$('.hplay-mode');
    if(mode)mode.textContent=`EN LIGNE · PHASE ${Number(d.room.phase_index)+1}/4`;
  }
  if(stage==='decision'){
    const info=document.createElement('div');
    info.className='hnet-decision-note';
    info.textContent=host?'Vous êtes l’hôte : verrouillez le choix du groupe.':'Discutez ensemble. Seul l’hôte peut verrouiller la décision.';
    const options=$('.hplay-options');
    if(options){options.before(info);if(!host)$$('button',options).forEach(b=>b.disabled=true)}
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
async function decideHeritageOnline(decision){const s=hSession();if(!s?.hostToken)return toastX('Seul l’hôte verrouille la décision.');try{await rpc('igr_heritage_online_decide',{p_code:s.code,p_host_token:s.hostToken,p_option_id:decision});await syncHeritageOnline(true)}catch(e){console.error(e);toastX('Décision non confirmée.')}}
async function leaveHeritageOnline(){const s=hSession();if(!s)return;try{await rpc('igr_heritage_online_leave',{p_code:s.code,p_player_token:s.token})}catch{}clearHSession();del(HERITAGE_LIVE_KEY);try{renderHome()}catch{location.reload()}}
async function finishHeritageOnlineHost(){const s=hSession();if(!s?.hostToken)return;try{await rpc('igr_heritage_online_finish',{p_code:s.code,p_host_token:s.hostToken})}catch(e){console.warn(e)}clearHSession()}
function renderHFinished(d){clearHSession();del(HERITAGE_LIVE_KEY);shellPut(`<main class="page hnet hplay-theme-${d.room.campaign_id}"><section class="hnet-finished"><span>PARTIE TERMINÉE</span><h1>Le dossier est clos.</h1><p>L’hôte a inscrit la conséquence dans sa campagne HÉRITAGE.</p><button class="btn primary" id="hnetHome">RETOUR À L’ACCUEIL</button></section></main>`);$('#hnetHome')?.addEventListener('click',()=>renderHome())}
function resumeHeritageOnline(){if(!hSession())return toastX('Aucune cellule HÉRITAGE à reprendre.');startHWatcher(true)}

function interceptHeritageOnline(e){const s=hSession();if(!s)return;const hp=e.target.closest?.('[data-hp-action],[data-hp-option]');if(!hp)return;const a=hp.dataset.hpAction;if(a==='hide-next'){e.preventDefault();e.stopImmediatePropagation();readyHeritageOnline();return}if(a==='phase-next'||a==='decision'){e.preventDefault();e.stopImmediatePropagation();advanceHeritageOnline();return}if(a==='phase-prev'){e.preventDefault();e.stopImmediatePropagation();return}if(hp.dataset.hpOption){e.preventDefault();e.stopImmediatePropagation();decideHeritageOnline(hp.dataset.hpOption);return}if(a==='abort'||a==='session-menu'){e.preventDefault();e.stopImmediatePropagation();leaveHeritageOnline();return}if(a==='finish'){if(!s.hostToken){e.preventDefault();e.stopImmediatePropagation();clearHSession();del(HERITAGE_LIVE_KEY);renderHome();return}void finishHeritageOnlineHost();/* allow the existing Heritage result handler to persist host campaign */}}
function handleHNetClick(e){const b=e.target.closest?.('[data-hnet]');if(!b)return;e.preventDefault();if(b.dataset.hnet==='start')startHeritageOnline();if(b.dataset.hnet==='leave')leaveHeritageOnline()}

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
  window.IGR_PLAY_MODES=Object.freeze({version:BUILD,openLocal:renderStandardLocalSetup,resumeHeritageOnline});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
