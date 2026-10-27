/* Inside Grey Room — unified event notifications v12.7
   Every newly visible server event is recorded in the local notification center.
   Foreground: cinematic in-app banner. Background: native/web notification when enabled.
*/
(() => {
  const VERSION='12.8-attention';
  const PREF_KEY='igr_notify_prefs_v1';
  const ITEMS_PREFIX='igr_notify_items_';
  const CURSOR_PREFIX='igr_notify_cursor_';
  const DEFAULTS={inApp:true,system:false,sound:false,vibrate:false};
  const MAX_ITEMS=60;
  const state={roomKey:'',cursor:0,items:[],bannerQueue:[],pumping:false,native:null,nativeListener:false,lastSoundAt:0,bannerTimer:null,bannerStart:null};
  let focusRequest=null;const viewedSince=new Map(),tabDrafts=new Map();
  const tr=(fr,en)=>window.IGR_LOCALE==='en'?en:fr;
  const resolvedRoute=route=>{const allowed=['enqueteur','analyste','procureur','juge','inspecteur','expert'].includes(STATE?.sync?.player?.public_role);return route==='investigation'&&!allowed?'timeline':route;};

  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function readJson(key,fallback){try{const v=STORAGE.getItem(key);return v?JSON.parse(v):fallback}catch{return fallback}}
  function writeJson(key,value){try{STORAGE.setItem(key,JSON.stringify(value))}catch{}}
  function prefs(){return Object.assign({},DEFAULTS,readJson(PREF_KEY,{}))}
  function savePrefs(patch){const next=Object.assign({},prefs(),patch);writeJson(PREF_KEY,next);return next}
  function roomKey(){const d=typeof STATE!=='undefined'?STATE.sync:null;if(!d?.room?.code)return'';const match=Math.max(1,Number(d.room.state?.match_no||1));return `${d.room.code}_${match}_${d.player?.id||'unbound'}`}
  function cursorKey(key){return CURSOR_PREFIX+key}
  function itemsKey(key){return ITEMS_PREFIX+key}
  function ensureRoom(){
    const key=roomKey();
    if(!key){clearBanners();viewedSince.clear();tabDrafts.clear();focusRequest=null;state.roomKey='';state.cursor=0;state.items=[];renderBell();return false}
    if(state.roomKey===key)return true;
    try{
      const prefixRoom=String(STATE?.sync?.room?.code||'')+'_';
      for(let i=localStorage.length-1;i>=0;i--){
        const name=localStorage.key(i);
        if(!name)continue;
        const base=name.startsWith(ITEMS_PREFIX)?ITEMS_PREFIX:name.startsWith(CURSOR_PREFIX)?CURSOR_PREFIX:null;
        if(base&&name.startsWith(base+prefixRoom)&&name!==base+key)localStorage.removeItem(name);
      }
    }catch(_){}
    clearBanners();viewedSince.clear();tabDrafts.clear();focusRequest=null;
    state.roomKey=key;
    state.cursor=Math.max(0,Number(STORAGE.getItem(cursorKey(key))||0));
    state.items=readJson(itemsKey(key),[]).filter(x=>x&&Number.isFinite(+x.id)).map(x=>{
      if(['message','trame','field','expert','judge','reveal'].includes(x.eventType))
        return {...x,title:'Information de partie',body:'Consulte la rubrique autorisée dans la partie.'};
      return x;
    }).slice(0,MAX_ITEMS);
    renderBell();
    return true;
  }
  function persist(){if(!state.roomKey)return;STORAGE.setItem(cursorKey(state.roomKey),String(state.cursor||0));writeJson(itemsKey(state.roomKey),state.items.slice(0,MAX_ITEMS));renderBell()}

  const style=document.createElement('style');
  style.id='igr-notifications-v12-style';
  style.textContent=`
    .igr-alert-stack{position:fixed;z-index:890;top:calc(env(safe-area-inset-top,0px) + 12px);left:50%;transform:translateX(-50%);width:min(92vw,470px);display:grid;gap:8px;pointer-events:none}
    .igr-event-alert{pointer-events:auto;width:100%;border:1px solid rgba(255,255,255,.13);border-radius:13px;padding:11px 13px;background:rgba(7,10,12,.96);color:#eef2f4;box-shadow:0 14px 40px rgba(0,0,0,.38);backdrop-filter:blur(14px);text-align:left;display:grid;grid-template-columns:auto 1fr auto;gap:10px;align-items:start;animation:igrAlertIn .22s ease-out}
    .igr-event-alert[data-kind="trame"]{border-color:rgba(207,220,229,.3);background:linear-gradient(135deg,rgba(19,25,29,.98),rgba(5,7,9,.98))}
    .igr-event-alert[data-kind="message"]{border-color:rgba(160,188,207,.28)}
    .igr-event-alert[data-cycle="1"]{border-left:3px solid #a8a49c}
    .igr-event-alert[data-cycle="2"]{border-left:3px solid #c89f64}
    .igr-event-alert[data-cycle="3"]{border-left:3px solid #b96565}
    .igr-event-alert[data-kind="breaking_news"]{border-color:rgba(220,190,135,.3)}
    .igr-event-alert[data-kind="reveal"]{border-color:rgba(224,224,224,.38)}
    .igr-alert-open{display:grid;grid-template-columns:auto 1fr;gap:10px;border:0;padding:0;background:transparent;color:inherit;text-align:left;min-height:44px;cursor:pointer}.igr-event-alert{grid-template-columns:1fr auto}.igr-alert-close{min-width:44px;min-height:44px;padding:8px}.igr-tab-unread{display:inline-flex;align-items:center;justify-content:center;min-width:18px;height:18px;margin-left:6px;padding:0 5px;border-radius:9px;background:#dce3e7;color:#080a0c;font:700 10px system-ui}.igr-notification-row[aria-pressed="false"]{border-left:3px solid #c89f64}.igr-notification-row{display:block;width:100%;text-align:left;color:inherit;font:inherit;min-height:44px}.igr-notification-target{outline:2px solid #c89f64;outline-offset:4px;scroll-margin:110px 0 90px}.igr-notify-bell{position:relative!important;inset:auto!important;flex-shrink:0;width:44px!important;height:44px!important}.igr-notify-bell.igr-bell-floating{position:fixed!important;top:calc(env(safe-area-inset-top,0px) + 12px)!important;right:12px!important}
    .igr-alert-stack{top:auto!important;bottom:calc(env(safe-area-inset-bottom,0px) + 88px)}.igr-alert-copy b{font-size:13px}.igr-alert-copy span{font-size:12px}
    .igr-alert-icon{font:800 10px 'IBM Plex Mono',monospace;letter-spacing:.08em;color:#9ba8b1;min-width:48px;padding-top:2px}.igr-alert-copy{min-width:0}.igr-alert-copy b{display:block;font-size:11px;letter-spacing:.035em;text-transform:uppercase}.igr-alert-copy span{display:block;margin-top:4px;color:#aeb8bf;font-size:10px;line-height:1.42;white-space:normal}.igr-alert-close{border:0;background:transparent;color:#65727b;font-size:17px;line-height:1;cursor:pointer;padding:0 0 8px 8px}
    .igr-notify-bell{position:fixed;z-index:335;right:12px;top:calc(env(safe-area-inset-top,0px) + 12px);width:40px;height:40px;border-radius:50%;border:1px solid rgba(255,255,255,.12);background:rgba(6,9,11,.9);color:#dce3e7;display:grid;place-items:center;box-shadow:0 8px 24px rgba(0,0,0,.26);backdrop-filter:blur(12px);cursor:pointer}.igr-notify-bell[hidden]{display:none}.igr-notify-bell svg{width:17px;height:17px}.igr-notify-count{position:absolute;right:-4px;top:-4px;min-width:17px;height:17px;padding:0 4px;border-radius:10px;background:#d8e0e5;color:#07090b;font:900 9px/17px system-ui;text-align:center;box-sizing:border-box}.igr-notify-count:empty{display:none}
    .igr-notification-list{display:grid;gap:8px;max-height:52vh;overflow:auto;padding-right:2px}.igr-notification-row{border:1px solid rgba(255,255,255,.08);border-radius:11px;padding:10px 11px;background:rgba(255,255,255,.018);cursor:pointer}.igr-notification-row b{display:block;font-size:11px;color:#e6ebee}.igr-notification-row p{margin:4px 0 0;color:#98a4ac;font-size:10px;line-height:1.45}.igr-notification-row small{display:block;margin-top:5px;color:#59656d;font:700 8px 'IBM Plex Mono',monospace;letter-spacing:.05em}.igr-notification-empty{padding:18px;text-align:center;color:#65727b;font-size:10px}.igr-notify-setting{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:11px;border:1px solid rgba(255,255,255,.08);border-radius:11px;margin:8px 0}.igr-notify-setting span b{display:block;font-size:11px}.igr-notify-setting span small{display:block;margin-top:3px;color:#71808a;font-size:9px;line-height:1.4}.igr-notify-setting input{width:20px;height:20px;accent-color:#dce3e7}
    @keyframes igrAlertIn{from{opacity:0;transform:translateY(-8px) scale(.985)}to{opacity:1;transform:none}}
    @media(max-width:640px){.igr-alert-stack{top:calc(env(safe-area-inset-top,0px) + 8px);width:94vw}.igr-notify-bell{right:9px;top:calc(env(safe-area-inset-top,0px) + 9px);width:38px;height:38px}}
  `;
  document.head.appendChild(style);

  function stack(){let el=document.getElementById('igrAlertStack');if(!el){el=document.createElement('div');el.id='igrAlertStack';el.className='igr-alert-stack';el.setAttribute('aria-live','polite');el.setAttribute('aria-atomic','false');document.body.appendChild(el)}return el}
  function ensureBell(){let el=document.getElementById('igrNotifyBell');if(!el){el=document.createElement('button');el.id='igrNotifyBell';el.className='igr-notify-bell';el.type='button';el.setAttribute('aria-label','Notifications');el.onclick=()=>window.igrOpenNotificationCenter?.();el.innerHTML=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg><span class="igr-notify-count"></span>`;document.body.appendChild(el)}return el}
  function renderBell(){const el=ensureBell();const toolbar=document.querySelector('#app .top-actions');if(toolbar&&el.parentElement!==toolbar)toolbar.appendChild(el);el.classList.toggle('igr-bell-floating',!toolbar);const active=!!roomKey();el.hidden=!active;if(!active)return;const unread=state.items.filter(x=>x.unread).length;const badge=el.querySelector('.igr-notify-count');badge.textContent=unread?String(Math.min(99,unread)):'';el.setAttribute('aria-label',tr('Notifications','Notifications')+(unread?' · '+unread+' '+tr('non lues','unread'):''));decorateTabs()}

  function eventMeta(e,d){
    const p=e?.payload||{},type=String(e?.event_type||'event');
    const text=String(p.text||p.summary||'').trim();
    if(type==='message'){
      const personal=p.channel==='private';
      return{kind:'message',label:personal?'PRIVÉ':'CANAL',title:personal?'Message confidentiel':'Nouveau message du canal',body:'Consulte le canal dans la partie.',route:'channel',priority:3};
    }
    if(type==='trame'&&e.visibility==='public')return{kind:'trame',label:'DOSSIER',title:tr('Nouvelle information commune','New shared information'),body:tr('Consulte le Dossier commun.','Open the shared case file.'),route:'timeline',priority:2};
    if(type==='trame')return{kind:'trame',label:'TRAME',title:'Nouvel élément confidentiel',body:'Consulte les éléments autorisés dans Enquête.',route:'investigation',priority:3};
    if(type==='breaking_news')return{kind:'breaking_news',label:'NEWS',title:p.title||'Breaking News',body:text||'Une publication vient de tomber.',route:'timeline',priority:3};
    if(['field','field_result'].includes(type))return{kind:'field',label:'TERRAIN',title:'Retour du terrain',body:'Consulte les informations autorisées pendant la partie.',route:'investigation',priority:2};
    if(['expert','expert_result'].includes(type))return{kind:'expert',label:'EXPERT',title:'Résultat d’expertise',body:'Consulte les informations autorisées pendant la partie.',route:'investigation',priority:2};
    if(type==='judge')return{kind:'judge',label:'JUGE',title:'Information judiciaire',body:'Consulte les informations autorisées pendant la partie.',route:'investigation',priority:2};
    if(type==='reveal')return{kind:'reveal',label:'FINAL',title:'Révélation finale',body:'La fin du dossier est disponible dans le jeu.',route:'timeline',priority:4};
    if(type==='cycle')return{kind:'cycle',label:'CYCLE',title:`Cycle ${d?.room?.cycle||''}`,body:'Un nouveau cycle commence.',route:'timeline',priority:2};
    if(type==='roles_distributed')return{kind:'phase',label:'DOSSIER',title:p.title||'Ouverture du dossier',body:text||'Les cartes privées sont disponibles.',route:'card',priority:2};
    if(type==='evidence')return{kind:'evidence',label:'ÉLÉMENT',title:tr('Nouvel élément disponible','New finding available'),body:tr('Consulte les informations autorisées dans la partie.','Open your authorized findings.'),route:e.visibility==='public'?'timeline':'investigation',priority:2};
    if(type==='interrogation')return{kind:'phase',label:'PHASE',title:tr('Interrogatoire en cours','Interrogation in progress'),body:tr('Consulte la consigne de la phase.','Check the current phase instructions.'),route:'card',priority:2};
    if(type==='context')return{kind:'phase',label:'DOSSIER',title:p.title||'Contexte',body:text||'Le dossier vient de s’ouvrir.',route:'timeline',priority:1};
    if(type==='phase')return{kind:'phase',label:'PHASE',title:'Nouvelle phase',body:'La partie change de phase.',route:'timeline',priority:2};
    return{kind:type,label:'INFO',title:'Mise à jour de la partie',body:'Consulte tes informations autorisées dans le jeu.',route:'timeline',priority:1};
  }
  function shouldIgnore(e,d){
    if(!e||!Number.isFinite(+e.id))return true;
    if(['timer','ready','join','leave','room_created','player_joined','player_left','sync','phase','cycle','interrogation','roles_distributed','context'].includes(e.event_type))return true;
    if(e.event_type==='message'&&String(e.payload?.author_id||'')===String(d?.player?.id||''))return true;
    return false;
  }
  function makeItem(e,d){const m=eventMeta(e,d);return{id:+e.id,eventType:String(e.event_type||'event'),kind:m.kind,label:m.label,title:String(m.title||'').slice(0,100),body:String(m.body||'').slice(0,260),route:m.route,phase:String(e?.payload?.phase||d?.room?.phase||''),priority:m.priority,cycle:[1,2,3].includes(+e.cycle)?+e.cycle:null,createdAt:e.created_at||new Date().toISOString(),unread:true}}

  function playAlert(item){
    const p=prefs();if(!p.sound)return;
    const now=Date.now();if(now-state.lastSoundAt<420)return;state.lastSoundAt=now;
    try{
      if(item.kind==='message'&&typeof playLevelTick==='function')playLevelTick(.82);
      else if(['field','expert','judge','phase','cycle'].includes(item.kind)&&typeof playLevelTick==='function')playLevelTick(.55);
      // trame/news/reveal already receive their canonical cue from the main runtime.
    }catch{}
  }
  function vibrate(item){const p=prefs();if(!p.vibrate||item.priority<2)return;try{navigator.vibrate?.(item.priority>=3?[36,35,54]:[28])}catch{}}

  function clearBanners(){
    clearTimeout(state.bannerTimer);clearTimeout(state.bannerStart);state.bannerTimer=null;state.bannerStart=null;state.bannerQueue=[];state.pumping=false;
    document.getElementById('igrAlertStack')?.replaceChildren();
  }
  function enqueueBanner(item){
    if(!prefs().inApp||document.hidden||STATE?.view!=='game'||!['message','breaking_news','reveal'].includes(item.kind))return;
    state.bannerQueue.push(item);
    if(!state.pumping&&!state.bannerStart)state.bannerStart=setTimeout(()=>{state.bannerStart=null;pumpBanners()},180);
  }
  function pumpBanners(){
    if(state.pumping||!state.bannerQueue.length)return;
    state.pumping=true;const key=state.roomKey,first=state.bannerQueue.shift(),route=resolvedRoute(first.route);
    const group=[first,...state.bannerQueue.filter(x=>resolvedRoute(x.route)===route)];state.bannerQueue=state.bannerQueue.filter(x=>resolvedRoute(x.route)!==route);
    const el=document.createElement('div');el.className='igr-event-alert';el.dataset.kind=first.kind;el.dataset.cycle=String(first.cycle||0);
    const title=group.length>1?(route==='channel'?tr('Nouveaux messages','New messages'):tr('Nouvelles publications','New publications'))+' · '+group.length:first.title;
    el.innerHTML=`<button type="button" class="igr-alert-open"><span class="igr-alert-icon">${esc(first.label)}</span><span class="igr-alert-copy"><b>${esc(title)}</b><span>${esc(group.length>1?tr('Ouvrir les nouveautés de cette rubrique.','Open updates in this section.'):first.body)}</span></span></button><button type="button" class="igr-alert-close" aria-label="${tr('Masquer cette alerte','Dismiss this alert')}">×</button>`;
    const finish=()=>{el.remove();clearTimeout(state.bannerTimer);state.bannerTimer=null;state.pumping=false;if(key===state.roomKey)pumpBanners()};
    el.querySelector('.igr-alert-open').onclick=()=>{finish();if(key!==state.roomKey)return;if(group.length>1)window.igrOpenNotificationCenter(route);else openNotification(first.id)};
    el.querySelector('.igr-alert-close').onclick=finish;
    stack().appendChild(el);state.bannerTimer=setTimeout(finish,group.some(x=>x.priority>=3)?8500:6000);
  }

  function nativePlugin(){
    if(state.native)return state.native;
    try{
      const cap=globalThis.Capacitor;
      if(!cap?.isNativePlatform?.()||typeof cap.registerPlugin!=='function')return null;
      state.native=cap.registerPlugin('LocalNotifications');
      if(!state.nativeListener){state.nativeListener=true;state.native.addListener?.('localNotificationActionPerformed',ev=>{const extra=ev?.notification?.extra||ev?.action?.notification?.extra||{};if(extra?.eventId)openNotification(+extra.eventId);else if(extra?.route)routeTo(extra.route)})}
      return state.native;
    }catch{return null}
  }
  function nativeId(item){const room=String(state.roomKey||'');let h=2166136261;for(const c of `${room}:${item.id}`){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return Math.abs(h|0)%2147483000+1}
  async function systemNotify(item){
    const p=prefs();if(!p.system||!document.hidden)return;
    const native=nativePlugin();
    if(native){
      try{await native.schedule({notifications:[{id:nativeId(item),title:'Inside Grey Room · Nouvelle information',body:'Ouvre la partie pour consulter tes informations.',schedule:{at:new Date(Date.now()+450)},extra:{eventId:item.id,route:item.route,roomKey:state.roomKey}}]});return}catch(e){console.warn('local notification',e)}
    }
    try{if('Notification'in window&&Notification.permission==='granted')new Notification('Inside Grey Room · Nouvelle information',{body:'Ouvre la partie pour consulter tes informations.',tag:`igr-${state.roomKey}-${item.id}`,renotify:false})}catch{}
  }

  window.IGR_NOTIFICATIONS=Object.freeze({refreshBadges(){renderBell()},publicUpdates({roomCode,playerId,events}){if(!ensureRoom()||roomCode!==STATE.sync.room.code||playerId!==STATE.sync.player.id)return;for(const e of events||[]){if(!Number.isFinite(+e.id))continue;const item=makeItem({...e,visibility:'public',payload:{title:e.title,text:e.text}},STATE.sync);item.route='timeline';receive(item)}}});
  function receive(item){
    if(state.items.some(x=>+x.id===+item.id))return;
    state.items.unshift(item);state.items=state.items.slice(0,MAX_ITEMS);persist();enqueueBanner(item);playAlert(item);vibrate(item);systemNotify(item);
  }
  function scan(){
    try{
      if(!ensureRoom())return;
      if(!['game','role','briefing'].includes(STATE?.view))clearBanners();
      const d=STATE.sync,events=(d?.events||[]).filter(e=>Number.isFinite(+e.id)).sort((a,b)=>(+a.id)-(+b.id));
      if(!events.length){renderBell();trackVisible();return}
      const existingCursor=state.cursor;
      // First contact with an already-running room: do not replay a wall of historical alerts.
      if(existingCursor===0&&!STORAGE.getItem(cursorKey(state.roomKey))&&d.room.status!=='lobby'&&events.length>8){
        state.cursor=+events.at(-1).id;persist();
        const summary={id:state.cursor,eventType:'sync',kind:'phase',label:'SYNC',title:'Dossier synchronisé',body:'Les éléments partagés restent consultables dans le Dossier commun.',route:'timeline',priority:1,createdAt:new Date().toISOString(),unread:false};
        enqueueBanner(summary);return;
      }
      for(const e of events){if(+e.id<=state.cursor)continue;if(!shouldIgnore(e,d))receive(makeItem(e,d));state.cursor=Math.max(state.cursor,+e.id)}
      persist();trackVisible();focusPending();
    }catch(e){console.warn('notification scan',e)}
  }

  const originalSetTab=typeof setTab==='function'?setTab:null;
  if(originalSetTab){const withDrafts=function(){
    if(typeof captureDrafts==='function'){try{const draft=captureDrafts();tabDrafts.set(draft.scope,draft);if(tabDrafts.size>24)tabDrafts.delete(tabDrafts.keys().next().value)}catch{}}
    const result=originalSetTab.apply(this,arguments);
    if(typeof draftScope==='function'&&typeof restoreDrafts==='function'){const saved=tabDrafts.get(draftScope());if(saved)restoreDrafts(saved)}
    return result;
  };try{setTab=withDrafts}catch{}window.setTab=withDrafts;}
  function decorateTabs(){
    for(const button of document.querySelectorAll('#app .tabs-v11 .tab')){
      const id=button.getAttribute('onclick')?.match(/setTab\(['"]([^'"]+)['"]/ )?.[1];if(!id)continue;
      // On the public case tab, a number must equal the published entries
      // actually rendered by the authoritative dossier, NEVER general game events.
      const displayed= id==='timeline' ? window.IGR_COMMON_DOSSIER_V106?.visibleEventIds?.() : null;
      // Only a visible conversation can own a tab notification badge.
      // Public dossier publications already have their own authoritative list.
      const count=id==='channel'
        ? state.items.filter(x=>x.unread&&x.kind==='message'&&resolvedRoute(x.route)==='channel').length
        : 0;
      let badge=button.querySelector('.igr-tab-unread');
      if(!count){badge?.remove();button.removeAttribute('data-unread');button.removeAttribute('title');continue}
      if(!badge){badge=document.createElement('span');badge.className='igr-tab-unread';button.appendChild(badge)}
      // Non-dossier tabs show a discreet dot, not an ungrounded content total.
      const amount='•';
      const label=tr('Messages non lus','Unread messages');
      if(badge.textContent!==amount)badge.textContent=amount;
      badge.setAttribute('aria-label',label);
      button.setAttribute('title',label);
      button.dataset.unread=String(count);
    }
  }
  function visible(el){
    if(!el?.isConnected||!el.getClientRects().length)return false;
    const css=getComputedStyle(el);if(css.visibility==='hidden'||css.display==='none')return false;
    const r=el.getBoundingClientRect();let top=Math.max(0,r.top),bottom=Math.min(innerHeight,r.bottom),left=Math.max(0,r.left),right=Math.min(innerWidth,r.right);
    for(let p=el.parentElement;p&&p!==document.body;p=p.parentElement){const s=getComputedStyle(p);if(/auto|scroll|hidden|clip/.test(s.overflowY+s.overflowX)){const b=p.getBoundingClientRect();top=Math.max(top,b.top);bottom=Math.min(bottom,b.bottom);left=Math.max(left,b.left);right=Math.min(right,b.right)}}
    return bottom-top>=Math.min(r.height,100)&&right-left>=Math.min(r.width,80);
  }
  function trackVisible(){
    if(document.hidden||!['game','role','briefing'].includes(STATE?.view)||document.querySelector('.modal')){viewedSince.clear();return}
    const seen=new Set();let changed=false;
    const candidates=[...document.querySelectorAll('#app [data-igr-event-id]')].map(el=>({el,id:Number(el.dataset.igrEventId)}));
    for(const item of state.items.filter(x=>x.unread)){
      let el=null;
      if(item.eventType==='roles_distributed'&&(STATE.tab==='card'||STATE.view==='role'))el=document.querySelector('#app .private-card-v11');
      else if(item.eventType==='context'&&(STATE.tab==='timeline'||STATE.view==='briefing'))el=document.querySelector('#app .igr106-premise, #app .briefing-v11');
      else if(['phase','interrogation','cycle'].includes(item.eventType)&&item.phase===STATE.sync?.room?.phase)el=document.querySelector('#app .phase-strip');
      if(el)candidates.push({el,id:item.id});
    }
    for(const {el,id} of candidates){
      const item=state.items.find(x=>x.id===id&&x.unread);if(!item||!visible(el))continue;
      const key=state.roomKey+':'+id;seen.add(key);
      if(!viewedSince.has(key))viewedSince.set(key,Date.now());
      if(Date.now()-viewedSince.get(key)>=700){item.unread=false;changed=true}
    }
    for(const key of viewedSince.keys())if(!seen.has(key))viewedSince.delete(key);
    if(changed)persist();
  }
  function focusPending(){
    const f=focusRequest;if(!f)return;
    if(f.key!==state.roomKey||Date.now()>f.until){focusRequest=null;return}
    const item=state.items.find(x=>x.id===f.id);const el=document.querySelector('#app [data-igr-event-id="'+f.id+'"]')||(item?.kind==='phase'&&item.phase===STATE.sync?.room?.phase?document.querySelector('#app .phase-strip'):null);if(!el)return;
    for(let p=el.parentElement;p;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true;
    el.classList.add('igr-notification-target');el.tabIndex=-1;el.focus({preventScroll:true});el.scrollIntoView({block:'center',behavior:'auto'});
    setTimeout(()=>el.classList.remove('igr-notification-target'),4000);focusRequest=null;
  }
  function routeTo(route,id){
    try{
      if(!STATE?.sync)return;
      let target=resolvedRoute(route);
      const available=typeof gameTabs==='function'?gameTabs().map(x=>x.id):['channel','timeline','card','investigation','press50','field50','expert50'];
      if(!available.includes(target))target='timeline';
      if(id)focusRequest={id:Number(id),key:state.roomKey,until:Date.now()+8000};
      if(STATE.tab!==target){if(typeof setTab==='function')setTab(target);else{STATE.tab=target;if(typeof renderGame==='function')renderGame()}}
      if(target==='investigation'){
        const evidence=document.getElementById('igr634-evidence');
        if(evidence){evidence.open=true;evidence.scrollIntoView?.({block:'start'});}
      }
      focusPending();decorateTabs();
    }catch{}
  }
  function markAllRead(){state.items=state.items.map(x=>({...x,unread:false}));persist()}
  function openNotification(id){const item=state.items.find(x=>+x.id===+id);if(item){document.querySelector('.igr-notification-modal')?.remove();routeTo(item.route,item.id)}}
  window.igrOpenNotification=id=>openNotification(+id);
  window.igrMarkNotificationsRead=()=>markAllRead();
  window.igrClearNotificationHistory=()=>{state.items=[];persist();document.querySelector('.igr-notification-modal')?.remove();window.igrOpenNotificationCenter?.()};
  window.igrOpenNotificationCenter=function(route){
    ensureRoom();document.querySelector('.modal')?.remove();
    const list=state.items.filter(x=>!route||resolvedRoute(x.route)===route);
    const rows=list.length?list.map(x=>`<button type="button" class="igr-notification-row" aria-pressed="${!x.unread}" onclick="igrOpenNotification(${+x.id})"><b>${esc(x.label)} · ${esc(x.title)}</b><p>${esc(x.body)}</p><small>${x.unread?tr('NON LU · ','UNREAD · '):''}${esc(new Date(x.createdAt).toLocaleString('fr-CH',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}))}</small></button>`).join(''):'<div class="igr-notification-empty">'+tr('Aucune notification dans ce dossier.','No notifications in this case.')+'</div>';
    document.body.insertAdjacentHTML('beforeend',`<div class="modal igr-notification-modal" onclick="if(event.target===this)this.remove()"><div class="modal-box utility-modal" role="dialog" aria-modal="true" aria-label="${tr('Notifications de la partie','Game notifications')}"><div class="kicker">${tr('Centre de notifications','Notification center')}</div><h2>${tr('Dossier en direct','Live case')}</h2><div class="igr-notification-list">${rows}</div><div class="modal-actions"><button class="btn ghost" onclick="igrOpenNotificationSettings()">${tr('Réglages','Settings')}</button>${state.items.length?`<button class="btn ghost" onclick="igrMarkNotificationsRead();igrOpenNotificationCenter()">${tr('Tout marquer comme lu','Mark all as read')}</button>`:''}<button class="btn primary" onclick="this.closest('.modal').remove()">${tr('Fermer','Close')}</button></div></div></div>`);
  };

  async function requestSystemPermission(){
    const native=nativePlugin();
    if(native){
      try{let s=await native.checkPermissions();if(s.display!=='granted')s=await native.requestPermissions();const ok=s.display==='granted';savePrefs({system:ok});return ok}catch(e){console.warn(e);return false}
    }
    try{if('Notification'in window){const res=Notification.permission==='granted'?'granted':await Notification.requestPermission();const ok=res==='granted';savePrefs({system:ok});return ok}}catch{}
    return false;
  }
  window.igrEnableSystemNotifications=async function(){const ok=await requestSystemPermission();toast(ok?'Notifications système activées.':'Autorisation de notifications refusée ou indisponible.');document.querySelector('.igr-notification-modal')?.remove();window.igrOpenNotificationSettings()};
  window.igrSetNotifyPref=function(key,value){if(!Object.hasOwn(DEFAULTS,key))return;savePrefs({[key]:!!value});if(key==='system'&&value)window.igrEnableSystemNotifications()};
  window.igrOpenNotificationSettings=function(){
    const p=prefs();document.querySelector('.modal')?.remove();
    document.body.insertAdjacentHTML('beforeend',`<div class="modal igr-notification-modal" onclick="if(event.target===this)this.remove()"><div class="modal-box utility-modal"><div class="kicker">Alertes</div><h2>Notifications</h2><label class="igr-notify-setting"><span><b>Alertes dans le jeu</b><small>Bannière immédiate pour chaque nouvel élément visible.</small></span><input type="checkbox" ${p.inApp?'checked':''} onchange="igrSetNotifyPref('inApp',this.checked)"></label><label class="igr-notify-setting"><span><b>Son d’alerte</b><small>Messages et changements de phase utilisent les effets du jeu.</small></span><input type="checkbox" ${p.sound?'checked':''} onchange="igrSetNotifyPref('sound',this.checked)"></label><label class="igr-notify-setting"><span><b>Vibration</b><small>Retour haptique pour les événements importants, si l’appareil le permet.</small></span><input type="checkbox" ${p.vibrate?'checked':''} onchange="igrSetNotifyPref('vibrate',this.checked)"></label><div class="igr-notify-setting"><span><b>Notifications système</b><small>${p.system?'Autorisées sur cet appareil.':'À activer pour recevoir une bannière système lorsque l’application est en arrière-plan et reçoit un nouvel événement.'}</small></span><button class="btn small ${p.system?'ghost':'primary'}" onclick="igrEnableSystemNotifications()">${p.system?'Vérifier':'Activer'}</button></div><div class="store-note">Les messages que tu envoies toi-même ne créent jamais de notification. Les éléments déjà anciens lors d’une première connexion à une partie en cours restent consultables dans le Fil sans provoquer une rafale d’alertes.</div><div class="modal-actions"><button class="btn ghost" onclick="this.closest('.modal').remove();igrOpenNotificationCenter()">Centre</button><button class="btn primary" onclick="this.closest('.modal').remove()">Terminé</button></div></div></div>`)
  };

  function augmentSettings(){const host=document.querySelector('.security-settings-actions');if(!host||host.querySelector('[data-igr-notifications]'))return;const b=document.createElement('button');b.type='button';b.className='btn ghost block';b.dataset.igrNotifications='1';b.textContent='Notifications';b.onclick=()=>{try{closeSettings()}catch{document.querySelector('.modal')?.remove()}window.igrOpenNotificationSettings()};host.prepend(b)}
  const originalOpenSettings=window.openSettings;
  if(typeof originalOpenSettings==='function')window.openSettings=function(...args){const out=originalOpenSettings.apply(this,args);setTimeout(augmentSettings,0);return out};

  nativePlugin();
  state.timer=setInterval(scan,1400);
  window.addEventListener('online',()=>setTimeout(scan,100));
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')setTimeout(scan,60)});
  setTimeout(scan,120);
})();
