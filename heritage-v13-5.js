(()=>{
'use strict';

const VERSION='13.5-heritage-integrated';
const STORAGE_KEY='igr_heritage_v1';
const MAX_HISTORY=120;
const CAMPAIGNS=Object.freeze({
  cendres:Object.freeze({
    id:'cendres', title:'CENDRES', subtitle:'Contre-espionnage · Vesper', cover:'assets/heritage-cendres-01-personne-n-existe.webp?v=v13.5-heritage',
    promise:'Retrouvez CERBÈRES avant que vos erreurs ne condamnent Vesper.',
    heritage:'Héritage de l’information',
    mechanic:'DOSSIER CERBÈRES',
    chapters:Object.freeze([
      Object.freeze({n:1,scenarioId:'035',title:'PERSONNE N’EXISTE',poster:'assets/heritage-cendres-01-personne-n-existe.webp?v=v13.5-heritage',note:'Un massacre. Une piste qui n’aurait jamais dû exister.'}),
      Object.freeze({n:2,scenarioId:'036',title:'04:17',poster:'assets/heritage-cendres-02-04-17.webp?v=v13.5-heritage',note:'Un faux drapeau transforme l’enquête en crise internationale.'}),
      Object.freeze({n:3,scenarioId:'037',title:'LA CHAMBRE',poster:'assets/heritage-cendres-03-la-chambre.webp?v=v13.5-heritage',note:'Captures, interrogatoires et informations impossibles à recouper.'}),
      Object.freeze({n:4,scenarioId:'038',title:'CENDRES',poster:'assets/heritage-cendres-04-cendres.webp?v=v13.5-heritage',note:'Le réseau se dévoile. ORPHÉE cesse d’être une rumeur.'}),
      Object.freeze({n:5,scenarioId:'039',title:'POINT ZÉRO',poster:'assets/heritage-cendres-05-point-zero.webp?v=v13.5-heritage',note:'Tous les choix précédents convergent.'})
    ])
  }),
  kuroi:Object.freeze({
    id:'kuroi', title:'KUROI', subtitle:'Japon · Police × Yakuza', cover:'assets/heritage-kuroi-01-l-oyabun.webp?v=v13.5-heritage',
    promise:'Une alliance contre nature. Des dettes qui survivront à chaque dossier.',
    heritage:'Héritage des relations',
    mechanic:'ARBRE & DETTES',
    chapters:Object.freeze([
      Object.freeze({n:1,scenarioId:'040',title:'L’OYABUN',poster:'assets/heritage-kuroi-01-l-oyabun.webp?v=v13.5-heritage',note:'Le chef Kurokawa est assassiné. Police et clan coopèrent.'}),
      Object.freeze({n:2,scenarioId:'041',title:'GIRI',poster:'assets/heritage-kuroi-02-giri.webp?v=v13.5-heritage',note:'Les services rendus deviennent des obligations.'}),
      Object.freeze({n:3,scenarioId:'042',title:'LES MAINS SALES',poster:'assets/heritage-kuroi-03-les-mains-sales.webp?v=v13.5-heritage',note:'La police réclame ce qu’elle ne peut pas faire elle-même.'}),
      Object.freeze({n:4,scenarioId:'043',title:'LA DETTE',poster:'assets/heritage-kuroi-04-la-dette.webp?v=v13.5-heritage',note:'Le meurtre et les obligations anciennes se rejoignent.'}),
      Object.freeze({n:5,scenarioId:'044',title:'LE CONSEIL',poster:'assets/heritage-kuroi-05-le-conseil.webp?v=v13.5-heritage',note:'La vérité est connue. Reste à décider qui doit payer.'})
    ])
  })
});

function nowISO(){return new Date().toISOString()}
function clampInt(v,min,max){v=Number.parseInt(v,10);return Number.isFinite(v)?Math.max(min,Math.min(max,v)):min}
function clone(v){return JSON.parse(JSON.stringify(v))}
function text(v,max=180){return String(v??'').trim().slice(0,max)}
function uid(){
  try{return crypto.randomUUID()}catch{}
  const a=new Uint32Array(4);try{crypto.getRandomValues(a)}catch{for(let i=0;i<a.length;i++)a[i]=Math.floor(Math.random()*0xffffffff)}
  return [...a].map(v=>v.toString(16).padStart(8,'0')).join('-');
}
function safeParse(raw,fallback){try{return JSON.parse(raw)}catch{return fallback}}
function readStore(){
  try{
    const raw=localStorage.getItem(STORAGE_KEY);
    const parsed=safeParse(raw,{});
    return parsed&&typeof parsed==='object'&&!Array.isArray(parsed)?parsed:{};
  }catch{return {}}
}
function writeStore(store){
  try{localStorage.setItem(STORAGE_KEY,JSON.stringify(store));return true}catch(err){console.warn('[Heritage] save failed',err);return false}
}
function defaultCampaign(id){
  const base={
    schema:1,id,saveId:uid(),createdAt:nowISO(),updatedAt:nowISO(),status:'active',currentChapter:1,completed:[],history:[]
  };
  if(id==='cendres'){
    base.cendres={
      network:{nodes:[],links:[]},
      crisis:{level:0,label:'SOUS CONTRÔLE',events:[]},
      countdown:null,
      flags:{}
    };
  }else{
    base.kuroi={
      clans:{
        kurokawa:{label:'KUROKAWA',members:[],status:'active'},
        arakida:{label:'ARAKIDA',members:[],status:'active'},
        police:{label:'POLICE',members:[],status:'active'},
        intermediaries:{label:'INTERMÉDIAIRES',members:[],status:'active'}
      },
      debts:[],chronicle:[],flags:{}
    };
  }
  return base;
}
function sanitizeCampaign(raw,id){
  const base=defaultCampaign(id);
  if(!raw||raw.id!==id)return base;
  base.saveId=text(raw.saveId,80)||base.saveId;
  base.createdAt=text(raw.createdAt,64)||base.createdAt;
  base.updatedAt=text(raw.updatedAt,64)||base.updatedAt;
  base.status=raw.status==='completed'?'completed':'active';
  base.currentChapter=clampInt(raw.currentChapter,1,5);
  base.completed=Array.from(new Set((Array.isArray(raw.completed)?raw.completed:[]).map(v=>clampInt(v,1,5)))).sort((a,b)=>a-b);
  base.history=(Array.isArray(raw.history)?raw.history:[]).slice(-MAX_HISTORY);
  if(id==='cendres'&&raw.cendres){
    base.cendres.network.nodes=(Array.isArray(raw.cendres.network?.nodes)?raw.cendres.network.nodes:[]).slice(-80);
    base.cendres.network.links=(Array.isArray(raw.cendres.network?.links)?raw.cendres.network.links:[]).slice(-120);
    base.cendres.crisis.level=clampInt(raw.cendres.crisis?.level,0,4);
    base.cendres.crisis.label=text(raw.cendres.crisis?.label,50)||crisisLabel(base.cendres.crisis.level);
    base.cendres.crisis.events=(Array.isArray(raw.cendres.crisis?.events)?raw.cendres.crisis.events:[]).slice(-50);
    base.cendres.countdown=raw.cendres.countdown&&typeof raw.cendres.countdown==='object'?raw.cendres.countdown:null;
    base.cendres.flags=raw.cendres.flags&&typeof raw.cendres.flags==='object'?raw.cendres.flags:{};
  }
  if(id==='kuroi'&&raw.kuroi){
    for(const key of Object.keys(base.kuroi.clans)){
      const src=raw.kuroi.clans?.[key];
      if(src){
        base.kuroi.clans[key].members=(Array.isArray(src.members)?src.members:[]).slice(-40);
        base.kuroi.clans[key].status=text(src.status,40)||'active';
      }
    }
    base.kuroi.debts=(Array.isArray(raw.kuroi.debts)?raw.kuroi.debts:[]).slice(-80);
    base.kuroi.chronicle=(Array.isArray(raw.kuroi.chronicle)?raw.kuroi.chronicle:[]).slice(-80);
    base.kuroi.flags=raw.kuroi.flags&&typeof raw.kuroi.flags==='object'?raw.kuroi.flags:{};
  }
  return base;
}
function getCampaign(id,create=false){
  if(!CAMPAIGNS[id])return null;
  const store=readStore();
  if(!store[id]&&!create)return null;
  const campaign=sanitizeCampaign(store[id],id);
  if(create&&!store[id]){store[id]=campaign;writeStore(store)}
  return campaign;
}
function saveCampaign(campaign){
  if(!campaign||!CAMPAIGNS[campaign.id])return false;
  campaign.updatedAt=nowISO();
  const store=readStore();store[campaign.id]=campaign;return writeStore(store);
}
function log(campaign,type,payload={}){
  campaign.history.push({id:uid(),at:nowISO(),type:text(type,50),payload:clone(payload)});
  if(campaign.history.length>MAX_HISTORY)campaign.history=campaign.history.slice(-MAX_HISTORY);
}
function crisisLabel(level){return ['SOUS CONTRÔLE','TENSION','CRISE','ALERTE NATIONALE','POINT DE RUPTURE'][clampInt(level,0,4)]}
function completeChapter(id,chapter,payload={}){
  const c=getCampaign(id,true);chapter=clampInt(chapter,1,5);
  if(chapter>c.currentChapter)return {ok:false,reason:'locked',campaign:c};
  if(!c.completed.includes(chapter))c.completed.push(chapter);
  c.completed.sort((a,b)=>a-b);
  if(chapter===5){c.status='completed';c.currentChapter=5}else c.currentChapter=Math.max(c.currentChapter,chapter+1);
  if(payload&&typeof payload==='object')applyPayload(c,payload);
  log(c,'chapter-completed',{chapter,payload});saveCampaign(c);renderIfOpen(id);return {ok:true,campaign:c};
}
function applyPayload(c,payload){
  if(c.id==='cendres'){
    if(Number.isFinite(Number(payload.crisisDelta))){c.cendres.crisis.level=clampInt(c.cendres.crisis.level+Number(payload.crisisDelta),0,4);c.cendres.crisis.label=crisisLabel(c.cendres.crisis.level)}
    if(payload.flags&&typeof payload.flags==='object')Object.assign(c.cendres.flags,payload.flags);
  }else if(payload.flags&&typeof payload.flags==='object')Object.assign(c.kuroi.flags,payload.flags);
}
function upsertCendresNode(input){
  const c=getCampaign('cendres',true),d=c.cendres.network;
  const id=text(input?.id,80)||uid();
  const idx=d.nodes.findIndex(n=>n.id===id);
  const node={id,label:text(input?.label,70)||'INCONNU',kind:text(input?.kind,30)||'personne',status:['unknown','watch','cleared','agent','missing','dead'].includes(input?.status)?input.status:'unknown',chapter:clampInt(input?.chapter||c.currentChapter,1,5),note:text(input?.note,240)};
  if(idx>=0)d.nodes[idx]={...d.nodes[idx],...node};else d.nodes.push(node);
  log(c,'cendres-node',node);saveCampaign(c);renderIfOpen('cendres');return node;
}
function linkCendres(from,to,label=''){
  const c=getCampaign('cendres',true),d=c.cendres.network;
  from=text(from,80);to=text(to,80);if(!from||!to||from===to)return null;
  const key=[from,to].sort().join('::');
  const existing=d.links.find(l=>l.key===key);
  const link={key,from,to,label:text(label,90),chapter:c.currentChapter};
  if(existing)Object.assign(existing,link);else d.links.push(link);
  log(c,'cendres-link',link);saveCampaign(c);renderIfOpen('cendres');return link;
}
function addCrisisEvent(label,delta=0){
  const c=getCampaign('cendres',true);delta=Number.isFinite(Number(delta))?Number(delta):0;
  c.cendres.crisis.level=clampInt(c.cendres.crisis.level+delta,0,4);c.cendres.crisis.label=crisisLabel(c.cendres.crisis.level);
  const event={id:uid(),at:nowISO(),chapter:c.currentChapter,label:text(label,160),delta};c.cendres.crisis.events.push(event);
  log(c,'crisis-event',event);saveCampaign(c);renderIfOpen('cendres');return event;
}
function setCountdown(data){
  const c=getCampaign('cendres',true);c.cendres.countdown=data&&typeof data==='object'?{...data}:null;log(c,'countdown',c.cendres.countdown||{});saveCampaign(c);renderIfOpen('cendres');return c.cendres.countdown;
}
function upsertClanMember(group,input){
  const c=getCampaign('kuroi',true);if(!c.kuroi.clans[group])return null;
  const members=c.kuroi.clans[group].members,id=text(input?.id,80)||uid(),idx=members.findIndex(m=>m.id===id);
  const member={id,name:text(input?.name,70)||'INCONNU',role:text(input?.role,70),status:['active','dead','missing','hamon','detained','promoted'].includes(input?.status)?input.status:'active',chapter:clampInt(input?.chapter||c.currentChapter,1,5),note:text(input?.note,220)};
  if(idx>=0)members[idx]={...members[idx],...member};else members.push(member);
  log(c,'kuroi-member',{group,...member});saveCampaign(c);renderIfOpen('kuroi');return member;
}
function addDebt(input){
  const c=getCampaign('kuroi',true);const debt={id:text(input?.id,80)||uid(),type:input?.type==='giri'?'giri':'on',from:text(input?.from,70)||'INCONNU',to:text(input?.to,70)||'INCONNU',reason:text(input?.reason,220),status:['due','paid','refused','broken'].includes(input?.status)?input.status:'due',private:!!input?.private,chapter:clampInt(input?.chapter||c.currentChapter,1,5)};
  c.kuroi.debts.push(debt);log(c,'kuroi-debt',debt);saveCampaign(c);renderIfOpen('kuroi');return debt;
}
function updateDebt(id,patch={}){
  const c=getCampaign('kuroi',true),d=c.kuroi.debts.find(x=>x.id===id);if(!d)return null;
  if(['due','paid','refused','broken'].includes(patch.status))d.status=patch.status;
  if(patch.reason!=null)d.reason=text(patch.reason,220);
  log(c,'kuroi-debt-update',{id,patch});saveCampaign(c);renderIfOpen('kuroi');return d;
}
function addChronicle(label,visibility='public'){
  const c=getCampaign('kuroi',true);const entry={id:uid(),at:nowISO(),chapter:c.currentChapter,label:text(label,220),visibility:visibility==='private'?'private':'public'};
  c.kuroi.chronicle.push(entry);log(c,'kuroi-chronicle',entry);saveCampaign(c);renderIfOpen('kuroi');return entry;
}
function resetCampaign(id){
  if(!CAMPAIGNS[id])return false;
  const store=readStore();delete store[id];writeStore(store);renderHub();return true;
}
function exportCampaign(id){const c=getCampaign(id,false);return c?JSON.stringify(c,null,2):null}
function importCampaign(id,json){
  if(!CAMPAIGNS[id])return {ok:false,reason:'campaign'};
  const raw=typeof json==='string'?safeParse(json,null):json;if(!raw||raw.id!==id)return {ok:false,reason:'invalid'};
  const c=sanitizeCampaign(raw,id);saveCampaign(c);renderIfOpen(id);return {ok:true,campaign:c};
}

const UI={screen:null,campaignId:null};
function locale(){return window.IGR_LOCALE==='en'?'en':'fr'}
function esc(v){return String(v??'').replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]))}
function app(){return document.getElementById('app')}
function canUseShell(){return typeof shell==='function'}
function put(html){
  const root=app();if(!root)return;
  root.innerHTML=canUseShell()?shell(html,false):`<div class="app"><div class="heritage-fallback-head"><button class="btn ghost small" onclick="renderHome()">←</button><b>INSIDE GREY ROOM</b></div>${html}</div>`;
  window.scrollTo({top:0,behavior:'auto'});
}
function backButton(){return `<button type="button" class="btn ghost small heritage-back" onclick="IGR_HERITAGE.home()">← ${locale()==='en'?'Home':'Accueil'}</button>`}
function hubButton(){return `<button type="button" class="btn ghost small heritage-back" onclick="IGR_HERITAGE.open()">← HÉRITAGE</button>`}
function progressLabel(c){return c?`${c.completed.length}/5`:'0/5'}
function statusLabel(c){if(!c)return locale()==='en'?'NEW CAMPAIGN':'NOUVELLE CAMPAGNE';if(c.status==='completed')return locale()==='en'?'CAMPAIGN COMPLETE':'CAMPAGNE TERMINÉE';return locale()==='en'?'CONTINUE':'CONTINUER'}
function campaignCard(meta){
  const c=getCampaign(meta.id,false),p=progressLabel(c);
  return `<article class="heritage-campaign heritage-${meta.id}" role="button" tabindex="0" data-heritage-campaign="${meta.id}" onclick="IGR_HERITAGE.openCampaign('${meta.id}')" onkeydown="IGR_HERITAGE.keyOpen(event,'${meta.id}')">
    <img src="${meta.cover}" alt="${esc(meta.title)}" loading="eager" decoding="async">
    <div class="heritage-campaign-shade"></div>
    <div class="heritage-campaign-copy"><span>${esc(meta.heritage)}</span><h2>${esc(meta.title)}</h2><p>${esc(meta.promise)}</p><div class="heritage-campaign-foot"><b>${p} DOSSIERS</b><em>${statusLabel(c)} →</em></div></div>
  </article>`;
}
function renderHub(){
  UI.screen='hub';UI.campaignId=null;
  put(`<main class="page heritage-page"><div class="page-head heritage-head"><div><div class="kicker">INSIDE GREY ROOM</div><h1>HÉRITAGE</h1><p>Vos décisions survivent à la partie.</p></div>${backButton()}</div>
    <section class="heritage-intro"><b>UNE CAMPAGNE. CINQ DOSSIERS.</b><span>Chaque campagne conserve un état différent. CENDRES retient ce que vous savez. KUROI retient ce que vous devez.</span></section>
    <div class="heritage-campaign-grid">${campaignCard(CAMPAIGNS.cendres)}${campaignCard(CAMPAIGNS.kuroi)}</div>
  </main>`);
  try{if(typeof ensureAmbient==='function')ensureAmbient('menu')}catch{}
}
function chapterClass(c,n){if(c?.completed.includes(n))return 'done';if(!c&&n===1)return 'current';if(c&&n===c.currentChapter)return 'current';return 'locked'}
function chapterRows(meta,c){return meta.chapters.map(ch=>{
  const st=chapterClass(c,ch.n),label=st==='done'?'TERMINÉ':st==='current'?'DISPONIBLE':'VERROUILLÉ';
  return `<button type="button" class="heritage-chapter ${st}" ${st==='locked'?'disabled':''} onclick="IGR_HERITAGE.openChapter('${meta.id}',${ch.n})"><span class="heritage-chapter-poster"><img src="${ch.poster}" alt="" loading="lazy" decoding="async"></span><span class="heritage-chapter-n">0${ch.n}</span><span class="heritage-chapter-main"><b>${esc(ch.title)}</b><small>${esc(ch.note)}</small></span><em>${label}</em></button>`;
}).join('')}
function renderCampaign(id){
  const meta=CAMPAIGNS[id];if(!meta)return renderHub();UI.screen='campaign';UI.campaignId=id;
  const c=getCampaign(id,false),p=progressLabel(c);
  put(`<main class="page heritage-page heritage-campaign-page heritage-${id}">
    <div class="page-head heritage-head"><div><div class="kicker">HÉRITAGE · ${esc(meta.heritage)}</div><h1>${esc(meta.title)}</h1><p>${esc(meta.promise)}</p></div>${hubButton()}</div>
    <section class="heritage-hero"><img src="${meta.cover}" alt="${esc(meta.title)}"><div><span>${p} DOSSIERS</span><b>${c?statusLabel(c):'PRÊT À COMMENCER'}</b></div></section>
    <div class="heritage-layout"><section class="panel heritage-panel"><div class="section-title"><h2>Dossiers</h2><span>progression séquentielle</span></div><div class="heritage-chapters">${chapterRows(meta,c)}</div></section>${renderMechanic(id,c)}</div>
    <div class="heritage-actions">${!c?`<button class="btn primary" onclick="IGR_HERITAGE.begin('${id}')">COMMENCER ${esc(meta.title)}</button>`:`<button class="btn" onclick="IGR_HERITAGE.backup('${id}')">COPIER LA SAUVEGARDE</button><button class="btn ghost heritage-reset" onclick="IGR_HERITAGE.reset('${id}')">RÉINITIALISER</button>`}</div>
  </main>`);
}
function renderMechanic(id,c){
  if(id==='cendres'){
    const d=c?.cendres,level=d?.crisis?.level??0,nodes=d?.network?.nodes??[],links=d?.network?.links??[];
    const visibleNodes=nodes.slice(-6);
    return `<section class="panel heritage-panel heritage-mechanic"><div class="section-title"><h2>Dossier CERBÈRES</h2><span>état persistant</span></div>
      <div class="heritage-crisis"><span>ÉTAT DE CRISE</span><b>${esc(d?.crisis?.label||crisisLabel(level))}</b><div class="heritage-crisis-bars" aria-label="Niveau de crise">${[0,1,2,3,4].map(i=>`<i class="${i<=level?'on':''}"></i>`).join('')}</div></div>
      <div class="heritage-network-mini">${visibleNodes.length?visibleNodes.map(n=>`<div class="heritage-node status-${esc(n.status)}"><b>${esc(n.label)}</b><small>${esc(n.status)}</small></div>`).join(''):`<div class="heritage-empty">Aucun agent classifié. Le réseau se construira au fil de la campagne.</div>`}</div>
      <div class="heritage-meta-row"><span>${nodes.length} identités</span><span>${links.length} connexions</span></div>
    </section>`;
  }
  const d=c?.kuroi,debts=d?.debts??[],open=debts.filter(x=>x.status==='due').length;
  return `<section class="panel heritage-panel heritage-mechanic"><div class="section-title"><h2>Arbre & dettes</h2><span>état persistant</span></div>
    <div class="heritage-clan-mini" tabindex="0"><div><b>KUROKAWA</b><small>${d?.clans?.kurokawa?.members?.length||0} personnes</small></div><span>↔</span><div><b>ARAKIDA</b><small>${d?.clans?.arakida?.members?.length||0} personnes</small></div><span>↔</span><div><b>POLICE</b><small>${d?.clans?.police?.members?.length||0} personnes</small></div></div>
    <div class="heritage-debt-summary"><span>DETTES NON ACQUITTÉES</span><b>${open}</b><small>${d?.chronicle?.length||0} faits inscrits dans la chronique</small></div>
  </section>`;
}
function renderChapter(id,n){
  const meta=CAMPAIGNS[id],c=getCampaign(id,false);if(!meta)return renderHub();
  if(!c){return begin(id,true)}
  n=clampInt(n,1,5);if(n>c.currentChapter&&!c.completed.includes(n))return renderCampaign(id);
  const ch=meta.chapters[n-1];UI.screen='chapter';UI.campaignId=id;
  put(`<main class="page heritage-page heritage-dossier heritage-${id}"><div class="page-head heritage-head"><div><div class="kicker">${esc(meta.title)} · DOSSIER 0${n}</div><h1>${esc(ch.title)}</h1><p>${esc(ch.note)}</p></div><button type="button" class="btn ghost small" onclick="IGR_HERITAGE.openCampaign('${id}')">← ${esc(meta.title)}</button></div>
    <section class="heritage-dossier-poster"><img src="${ch.poster}" alt="Affiche ${esc(ch.title)}" decoding="async"></section>
    <section class="panel heritage-dossier-card"><span class="heritage-dossier-label">${esc(meta.mechanic)}</span><h2>${n===c.currentChapter&&!c.completed.includes(n)?'DOSSIER ACTIF':'DOSSIER ARCHIVÉ'}</h2><p>${id==='cendres'?'Les classifications, connexions et erreurs de renseignement de ce dossier doivent être écrites dans le tableau CERBÈRES avant de passer au suivant.':'Les faveurs, ruptures, dettes et changements de hiérarchie de ce dossier doivent être inscrits dans l’arbre et le registre avant de passer au suivant.'}</p>
      <div class="heritage-dossier-notice"><b>Socle Héritage prêt</b><span>Le moteur de persistance est actif. Le pack de gameplay privé de ce dossier se branche ici sans modifier les scénarios 001–034.</span></div>
    </section>
  </main>`);
}
function begin(id,openFirst=false){const c=getCampaign(id,true);log(c,'campaign-start',{});saveCampaign(c);if(openFirst)renderChapter(id,1);else renderCampaign(id)}
function home(){UI.screen=null;UI.campaignId=null;try{if(typeof renderHome==='function')renderHome()}catch{location.reload()}}
function keyOpen(e,id){if(e?.key==='Enter'||e?.key===' '){e.preventDefault();renderCampaign(id)}}
function reset(id){if(!confirm(`Réinitialiser ${CAMPAIGNS[id]?.title||'cette campagne'} ? Cette sauvegarde locale sera effacée.`))return;resetCampaign(id)}
async function backup(id){
  const raw=exportCampaign(id);if(!raw)return;
  try{await navigator.clipboard.writeText(raw);if(typeof toast==='function')toast('Sauvegarde Héritage copiée.')}catch{if(typeof toast==='function')toast('Copie impossible sur cet appareil.')}
}
function renderIfOpen(id){if(UI.screen==='campaign'&&UI.campaignId===id)renderCampaign(id);if(UI.screen==='chapter'&&UI.campaignId===id)renderChapter(id,getCampaign(id,true).currentChapter)}

function enhanceHome(){
  const actions=document.querySelector('.home-actions-v10-13,.home-actions');if(!actions||actions.querySelector('.heritage-home-action'))return;
  const create=Array.from(actions.querySelectorAll('.home-action')).find(el=>/créer une partie|create a game/i.test(el.textContent||''))||actions.querySelector('.home-action');
  if(!create)return;
  const card=document.createElement('div');card.className='home-action heritage-home-action';card.setAttribute('role','button');card.tabIndex=0;
  card.innerHTML=`<div class="icon heritage-home-icon">◇</div><div><h3>Héritage</h3><p>${locale()==='en'?'Persistent campaigns · CENDRES · KUROI':'Campagnes persistantes · CENDRES · KUROI'}</p></div><span class="heritage-home-mark">05×2</span>`;
  card.addEventListener('click',renderHub);card.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();renderHub()}});
  create.insertAdjacentElement('afterend',card);
}

try{
  const base=typeof renderHome==='function'?renderHome:null;
  if(base){renderHome=function(){const out=base.apply(this,arguments);queueMicrotask(enhanceHome);requestAnimationFrame(enhanceHome);return out}}
}catch(err){console.warn('[Heritage] home hook failed',err)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(enhanceHome,0),{once:true});else setTimeout(enhanceHome,0);

window.IGR_HERITAGE=Object.freeze({
  version:VERSION,campaigns:CAMPAIGNS,open:renderHub,home,openCampaign:renderCampaign,openChapter:renderChapter,begin,keyOpen,
  get:id=>clone(getCampaign(id,false)),completeChapter,reset,backup,exportCampaign,importCampaign,
  cendres:Object.freeze({upsertNode:upsertCendresNode,link:linkCendres,addCrisisEvent,setCountdown}),
  kuroi:Object.freeze({upsertClanMember,addDebt,updateDebt,addChronicle})
});
})();
