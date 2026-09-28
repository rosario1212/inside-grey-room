/* Inside Grey Room — unified event notifications v12.7
   Every newly visible server event is recorded in the local notification center.
   Foreground: cinematic in-app banner. Background: native/web notification when enabled.
*/
(() => {
  const VERSION='12.7';
  const PREF_KEY='igr_notify_prefs_v1';
  const ITEMS_PREFIX='igr_notify_items_';
  const CURSOR_PREFIX='igr_notify_cursor_';
  const DEFAULTS={inApp:true,system:false,sound:true,vibrate:true};
  const MAX_ITEMS=60;
  const state={roomKey:'',cursor:0,items:[],bannerQueue:[],pumping:false,native:null,nativeListener:false,lastSoundAt:0};

  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function readJson(key,fallback){try{const v=STORAGE.getItem(key);return v?JSON.parse(v):fallback}catch{return fallback}}
  function writeJson(key,value){try{STORAGE.setItem(key,JSON.stringify(value))}catch{}}
  function prefs(){return Object.assign({},DEFAULTS,readJson(PREF_KEY,{}))}
  function savePrefs(patch){const next=Object.assign({},prefs(),patch);writeJson(PREF_KEY,next);return next}
  function roomKey(){const d=typeof STATE!=='undefined'?STATE.sync:null;if(!d?.room?.code)return'';const match=Math.max(1,Number(d.room.state?.match_no||1));return `${d.room.code}_${match}`}
  function cursorKey(key){return CURSOR_PREFIX+key}
  function itemsKey(key){return ITEMS_PREFIX+key}
  function ensureRoom(){
    const key=roomKey();
    if(!key){state.roomKey='';state.cursor=0;state.items=[];renderBell();return false}
    if(state.roomKey===key)return true;
    state.roomKey=key;
    state.cursor=Math.max(0,Number(STORAGE.getItem(cursorKey(key))||0));
    state.items=readJson(itemsKey(key),[]).filter(x=>x&&Number.isFinite(+x.id)).slice(0,MAX_ITEMS);
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
    .igr-event-alert[data-kind="breaking_news"]{border-color:rgba(220,190,135,.3)}
    .igr-event-alert[data-kind="reveal"]{border-color:rgba(224,224,224,.38)}
    .igr-alert-icon{font:800 10px 'IBM Plex Mono',monospace;letter-spacing:.08em;color:#9ba8b1;min-width:48px;padding-top:2px}.igr-alert-copy{min-width:0}.igr-alert-copy b{display:block;font-size:11px;letter-spacing:.035em;text-transform:uppercase}.igr-alert-copy span{display:block;margin-top:4px;color:#aeb8bf;font-size:10px;line-height:1.42;white-space:normal}.igr-alert-close{border:0;background:transparent;color:#65727b;font-size:17px;line-height:1;cursor:pointer;padding:0 0 8px 8px}
    .igr-notify-bell{position:fixed;z-index:335;right:12px;top:calc(env(safe-area-inset-top,0px) + 12px);width:40px;height:40px;border-radius:50%;border:1px solid rgba(255,255,255,.12);background:rgba(6,9,11,.9);color:#dce3e7;display:grid;place-items:center;box-shadow:0 8px 24px rgba(0,0,0,.26);backdrop-filter:blur(12px);cursor:pointer}.igr-notify-bell[hidden]{display:none}.igr-notify-bell svg{width:17px;height:17px}.igr-notify-count{position:absolute;right:-4px;top:-4px;min-width:17px;height:17px;padding:0 4px;border-radius:10px;background:#d8e0e5;color:#07090b;font:900 9px/17px system-ui;text-align:center;box-sizing:border-box}.igr-notify-count:empty{display:none}
    .igr-notification-list{display:grid;gap:8px;max-height:52vh;overflow:auto;padding-right:2px}.igr-notification-row{border:1px solid rgba(255,255,255,.08);border-radius:11px;padding:10px 11px;background:rgba(255,255,255,.018);cursor:pointer}.igr-notification-row b{display:block;font-size:11px;color:#e6ebee}.igr-notification-row p{margin:4px 0 0;color:#98a4ac;font-size:10px;line-height:1.45}.igr-notification-row small{display:block;margin-top:5px;color:#59656d;font:700 8px 'IBM Plex Mono',monospace;letter-spacing:.05em}.igr-notification-empty{padding:18px;text-align:center;color:#65727b;font-size:10px}.igr-notify-setting{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:11px;border:1px solid rgba(255,255,255,.08);border-radius:11px;margin:8px 0}.igr-notify-setting span b{display:block;font-size:11px}.igr-notify-setting span small{display:block;margin-top:3px;color:#71808a;font-size:9px;line-height:1.4}.igr-notify-setting input{width:20px;height:20px;accent-color:#dce3e7}
    @keyframes igrAlertIn{from{opacity:0;transform:translateY(-8px) scale(.985)}to{opacity:1;transform:none}}
    @media(max-width:640px){.igr-alert-stack{top:calc(env(safe-area-inset-top,0px) + 8px);width:94vw}.igr-notify-bell{right:9px;top:calc(env(safe-area-inset-top,0px) + 9px);width:38px;height:38px}}
  `;
  document.head.appendChild(style);

  function stack(){let el=document.getElementById('igrAlertStack');if(!el){el=document.createElement('div');el.id='igrAlertStack';el.className='igr-alert-stack';el.setAttribute('aria-live','polite');el.setAttribute('aria-atomic','false');document.body.appendChild(el)}return el}
  function ensureBell(){let el=document.getElementById('igrNotifyBell');if(!el){el=document.createElement('button');el.id='igrNotifyBell';el.className='igr-notify-bell';el.type='button';el.setAttribute('aria-label','Notifications');el.onclick=()=>window.igrOpenNotificationCenter?.();el.innerHTML=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg><span class="igr-notify-count"></span>`;document.body.appendChild(el)}return el}
  function renderBell(){const el=ensureBell();const active=!!roomKey();el.hidden=!active;if(!active)return;const unread=state.items.filter(x=>x.unread).length;const badge=el.querySelector('.igr-notify-count');badge.textContent=unread?String(Math.min(99,unread)):''}

  function eventMeta(e,d){
    const p=e?.payload||{},type=String(e?.event_type||'event');
    const text=String(p.text||p.summary||'').trim();
    if(type==='message'){
      const channel=p.channel==='private'?'privé':'enquête';
      return{kind:'message',label:channel==='privé'?'PRIVÉ':'CANAL',title:`${channel==='privé'?'Message privé':'Canal Enquête'} · ${p.author||'Joueur'}`,body:text||'Nouveau message reçu.',route:'channel',priority:3};
    }
    if(type==='trame')return{kind:'trame',label:'TRAME',title:p.title||'Nouvelle trame',body:text||'Un nouvel élément est versé au dossier.',route:'timeline',priority:3};
    if(type==='breaking_news')return{kind:'breaking_news',label:'NEWS',title:p.title||'Breaking News',body:text||'Une publication vient de tomber.',route:'timeline',priority:3};
    if(type==='field')return{kind:'field',label:'TERRAIN',title:p.title||'Retour terrain',body:text||'Une action de terrain vient de produire un résultat.',route:'timeline',priority:2};
    if(type==='expert')return{kind:'expert',label:'EXPERT',title:p.title||'Résultat d’expertise',body:text||'Une analyse technique est disponible.',route:'timeline',priority:2};
    if(type==='judge')return{kind:'judge',label:'JUGE',title:p.title||'Information protégée',body:text||'Une information judiciaire est disponible.',route:'timeline',priority:2};
    if(type==='reveal')return{kind:'reveal',label:'FINAL',title:p.title||'Révélation',body:String(p.summary||text||'Le dossier est révélé.'),route:'investigation',priority:4};
    if(type==='cycle')return{kind:'cycle',label:'CYCLE',title:p.title||`Cycle ${d?.room?.cycle||''}`,body:text||'Un nouveau cycle commence.',route:'investigation',priority:2};
    if(type==='roles_distributed')return{kind:'phase',label:'DOSSIER',title:p.title||'Ouverture du dossier',body:text||'Les cartes privées sont disponibles.',route:'card',priority:2};
    if(type==='context')return{kind:'phase',label:'DOSSIER',title:p.title||'Contexte',body:text||'Le dossier vient de s’ouvrir.',route:'investigation',priority:1};
    if(type==='phase')return{kind:'phase',label:'PHASE',title:p.title||'Nouvelle phase',body:text||'La partie change de phase.',route:'investigation',priority:2};
    return{kind:type,label:'INFO',title:p.title||'Mise à jour du dossier',body:text||'Un nouvel élément est disponible.',route:'timeline',priority:1};
  }
  function shouldIgnore(e,d){
    if(!e||!Number.isFinite(+e.id))return true;
    if(e.event_type==='message'&&String(e.payload?.author_id||'')===String(d?.player?.id||''))return true;
    return false;
  }
  function makeItem(e,d){const m=eventMeta(e,d);return{id:+e.id,eventType:String(e.event_type||'event'),kind:m.kind,label:m.label,title:String(m.title||'').slice(0,100),body:String(m.body||'').slice(0,260),route:m.route,priority:m.priority,createdAt:e.created_at||new Date().toISOString(),unread:true}}

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

  function enqueueBanner(item){if(!prefs().inApp)return;state.bannerQueue.push(item);pumpBanners()}
  function pumpBanners(){
    if(state.pumping||!state.bannerQueue.length)return;state.pumping=true;
    const item=state.bannerQueue.shift(),host=stack();
    while(host.children.length>=3)host.firstElementChild?.remove();
    const el=document.createElement('button');el.type='button';el.className='igr-event-alert';el.dataset.kind=item.kind;el.innerHTML=`<span class="igr-alert-icon">${esc(item.label)}</span><span class="igr-alert-copy"><b>${esc(item.title)}</b><span>${esc(item.body)}</span></span><span class="igr-alert-close" aria-hidden="true">×</span>`;
    el.onclick=()=>openNotification(item.id);
    host.appendChild(el);
    const life=item.priority>=3?8500:6000;
    setTimeout(()=>{el.remove();state.pumping=false;pumpBanners()},Math.min(1100,life/4));
    setTimeout(()=>el.remove(),life);
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
      try{await native.schedule({notifications:[{id:nativeId(item),title:item.title,body:item.body||'Inside Grey Room',schedule:{at:new Date(Date.now()+450)},extra:{eventId:item.id,route:item.route,roomKey:state.roomKey}}]});return}catch(e){console.warn('local notification',e)}
    }
    try{if('Notification'in window&&Notification.permission==='granted')new Notification(item.title,{body:item.body,tag:`igr-${state.roomKey}-${item.id}`,renotify:false})}catch{}
  }

  function receive(item){
    if(state.items.some(x=>+x.id===+item.id))return;
    state.items.unshift(item);state.items=state.items.slice(0,MAX_ITEMS);persist();enqueueBanner(item);playAlert(item);vibrate(item);systemNotify(item);
  }
  function scan(){
    try{
      if(!ensureRoom())return;
      const d=STATE.sync,events=(d?.events||[]).filter(e=>Number.isFinite(+e.id)).sort((a,b)=>(+a.id)-(+b.id));
      if(!events.length){renderBell();return}
      const existingCursor=state.cursor;
      // First contact with an already-running room: do not replay a wall of historical alerts.
      if(existingCursor===0&&!STORAGE.getItem(cursorKey(state.roomKey))&&d.room.status!=='lobby'&&events.length>8){
        state.cursor=+events.at(-1).id;persist();
        const summary={id:state.cursor,eventType:'sync',kind:'phase',label:'SYNC',title:'Dossier synchronisé',body:`${events.length} éléments antérieurs sont disponibles dans le Fil.`,route:'timeline',priority:1,createdAt:new Date().toISOString(),unread:false};
        enqueueBanner(summary);return;
      }
      for(const e of events){if(+e.id<=state.cursor)continue;if(!shouldIgnore(e,d))receive(makeItem(e,d));state.cursor=Math.max(state.cursor,+e.id)}
      persist();
    }catch(e){console.warn('notification scan',e)}
  }

  function routeTo(route){
    try{
      if(!STATE?.sync)return;
      if(['channel','timeline','card','investigation'].includes(route))STATE.tab=route;
      if(typeof renderGame==='function'&&STATE.sync.room.status!=='lobby'&&STATE.sync.room.phase!=='briefing')renderGame();
    }catch{}
  }
  function markAllRead(){state.items=state.items.map(x=>({...x,unread:false}));persist()}
  function openNotification(id){const item=state.items.find(x=>+x.id===+id);if(item){item.unread=false;persist();document.querySelector('.igr-notification-modal')?.remove();routeTo(item.route)}}
  window.igrOpenNotification= id=>openNotification(+id);
  window.igrMarkNotificationsRead=()=>markAllRead();
  window.igrClearNotificationHistory=()=>{state.items=[];persist();document.querySelector('.igr-notification-modal')?.remove();window.igrOpenNotificationCenter?.()};

  window.igrOpenNotificationCenter=function(){
    ensureRoom();document.querySelector('.modal')?.remove();
    const rows=state.items.length?state.items.map(x=>`<div class="igr-notification-row" onclick="igrOpenNotification(${+x.id})"><b>${esc(x.label)} · ${esc(x.title)}</b><p>${esc(x.body)}</p><small>${esc(new Date(x.createdAt).toLocaleString('fr-CH',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}))}</small></div>`).join(''):'<div class="igr-notification-empty">Aucune notification dans ce dossier.</div>';
    document.body.insertAdjacentHTML('beforeend',`<div class="modal igr-notification-modal" onclick="if(event.target===this)this.remove()"><div class="modal-box utility-modal" role="dialog" aria-modal="true"><div class="kicker">Centre de notifications</div><h2>Dossier en direct</h2><div class="igr-notification-list">${rows}</div><div class="modal-actions"><button class="btn ghost" onclick="igrOpenNotificationSettings()">Réglages</button>${state.items.length?`<button class="btn ghost" onclick="igrClearNotificationHistory()">Effacer l’historique local</button>`:''}<button class="btn primary" onclick="this.closest('.modal').remove()">Fermer</button></div></div></div>`);
    markAllRead();
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
  state.timer=setInterval(scan,500);
  window.addEventListener('online',()=>setTimeout(scan,100));
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')setTimeout(scan,60)});
  setTimeout(scan,120);
})();
