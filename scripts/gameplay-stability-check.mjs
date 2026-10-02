import { readFile, stat } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const root=process.cwd();
const failures=[];
const ok=(cond,msg)=>{if(!cond)failures.push(msg)};
const read=rel=>readFile(path.join(root,rel),'utf8');

const files={
  navTheme:await read('navigation-theme-v18.js'),
  nav:await read('navigation-heritage-v19.js'),
  navCss:await read('navigation-heritage-v19.css'),
  role:await read('role-tree-polish-v12-29.js'),
  roleCss:await read('role-tree-polish-v12-29.css'),
  localModeCss:await read('local-mode-theme-v25.css'),
  cell:await read('cell-controls-stability-v23.js'),
  apply:await read('scripts/apply-interface-v14.mjs')
};

for(const rel of ['navigation-theme-v18.js','navigation-heritage-v19.js','role-tree-polish-v12-29.js','cell-controls-stability-v23.js','scripts/apply-interface-v14.mjs']){
  const parsed=spawnSync(process.execPath,['--check',path.join(root,rel)],{encoding:'utf8'});
  ok(parsed.status===0,`${rel}: syntax check failed: ${parsed.stderr||parsed.stdout}`);
}

// The dock creator and dock scope must agree. This prevents the historical
// create/remove MutationObserver loop that could starve iPhone taps in cells.
ok(files.navTheme.includes('function dockAllowed()'),'navigation-theme-v18.js must define dockAllowed()');
ok(files.navTheme.includes('if(!appReady()||!dockAllowed())'),'navigation-theme-v18.js must not create the dock outside scenarios/profile');
ok(files.nav.includes("if(!home&&!allowed&&!dock)return"),'navigation-heritage-v19.js must go idle once a live cell has no dock');

// Accueil is fixed, bottom-right and still minimizes while scrolling.
ok(!files.nav.includes("makeDraggable(homeBtn,'home')"),'Accueil must not be draggable');
ok(!files.nav.includes("restorePosition(homeBtn,'home')"),'Accueil must ignore legacy drag coordinates');
ok(files.nav.includes('forgetHomePosition()'),'Legacy Accueil coordinates must be purged');
ok(files.navCss.includes('.igr-universal-dock .igr-dock-home{right:max(12px,env(safe-area-inset-right,0px))!important;left:auto!important;top:auto!important;bottom:calc(env(safe-area-inset-bottom,0px) + 12px)!important'),'Accueil must be anchored bottom-right');
ok(files.navCss.includes('body.igr-dock-scrolling .igr-dock-pill:not(.is-dragging){width:46px!important'),'Dock controls must minimize on scroll');
ok(files.navCss.includes('body.igr-dock-scrolling .igr-dock-pill:not(.is-dragging) b{display:none!important}'),'Dock text must hide on scroll');

// Notifications remain recorded by notifications-v12.js, but the bell itself
// is only exposed when the server says the game is actually playing.
ok(files.navCss.includes('#igrNotifyBell{display:none!important}'),'Notification bell must be hidden by default');
ok(files.navCss.includes('body.igr-game-active #igrNotifyBell:not([hidden])'),'Notification bell must be scoped to active gameplay');
ok(files.cell.includes("const gameActive=()=>inRoom()&&roomStatus()==='playing'"),'Only room status=playing may expose the bell');

// Live-cell synchronisation must stay bounded and the known stuck launch button
// must recover from the server-derived canStart state.
ok(files.cell.includes('__igrV24Stable'),'v24 sync guard marker missing');
ok(files.cell.includes('queuedForce=true'),'Forced realtime syncs must coalesce');
ok(files.cell.includes('healLobbyControls()'),'Lobby launch recovery is missing');
ok(files.cell.includes('button.disabled=!canStart'),'Launch button recovery must use server-derived canStart');
ok(files.cell.includes('__igrV24LaunchGuard'),'Launch calls must be deduplicated');
ok(files.cell.includes('requestAnimationFrame(syncGameUiState)'),'Launch completion must schedule an immediate UI recovery');
ok(files.cell.includes("document.getElementById('igrUniversalDock')?.remove()"),'Live cells must purge stale dock shells');
ok(!files.cell.includes("gate.style.pointerEvents='none'"),'Gameplay repair must not permanently disable the reusable intro gate');

// v25 role selection: the random draw must not re-render twice or move the
// viewport, and realtime changes from other players need a lightweight visual
// transition instead of a jarring role-grid jump.
ok(files.role.includes("const DRAW_MIN_MS=260"),'Random role draw timing guard missing');
ok(files.role.includes('restoreRoleAnchor(anchor)'),'Random role selection must preserve the role-zone viewport anchor');
ok(files.role.includes("animateFrom(beforeCards,'.role-choice-zone .role-choice-card'"),'Role card live-update animation missing');
ok(files.role.includes("animateFrom(beforePlayers,'.lobby-player-live'"),'Other-player live-update animation missing');
ok(!files.role.includes('renderLobby(STATE.sync)'),'Random role draw must not force a duplicate full lobby render');
ok(!files.role.includes('Math.random()'),'Random role draw must not fall back to Math.random');
ok(files.roleCss.includes('--igr-random-lock-w'),'Random draw geometry lock missing');
ok(files.roleCss.includes('.igr-random-role-cta.is-rolling'),'Random draw stable rolling state missing');
ok(files.roleCss.includes('.igr-role-updated'),'Role update transition missing');

// v26 role layout: once a role is selected, the duplicate choice summary must
// disappear and the selected role card becomes the single visual confirmation.
ok(files.roleCss.includes(':has(.role-choice-card.selected) .igr-choice-status'),'Selected role must hide the duplicate TON CHOIX summary');
ok(files.roleCss.includes(':has(.role-choice-card[aria-pressed="true"]) .igr-choice-status'),'ARIA-selected role must hide the duplicate TON CHOIX summary');

// Both launch choices must inherit the same selected DLC/campaign palette.
ok(files.navTheme.includes("document.querySelectorAll('#app .dual-mode-card')"),'Standard online/local mode theming hook missing');
ok(files.navTheme.includes("document.querySelectorAll('#app .heritage-local-btn,#app .heritage-online-btn')"),'Heritage online/local mode theming hook missing');
for(const theme of ['normal','omerta','terror','cartel','regime'])ok(files.localModeCss.includes(`data-igr-mode-theme="${theme}"`),`Play-mode theme ${theme} missing`);
for(const campaign of ['cendres','kuroi'])ok(files.localModeCss.includes(`data-igr-mode-theme="${campaign}"`),`Heritage play-mode theme ${campaign} missing`);
ok(files.localModeCss.includes('.dual-mode-card[data-igr-mode-theme]'),'Both standard play-mode cards must use the content theme');
ok(files.localModeCss.includes('.heritage-online-btn[data-igr-mode-theme]'),'Heritage online button must use the campaign theme');

// gameplay-clean-v12 has a legacy document-wide MutationObserver whose callback
// rewrites child nodes and can therefore retrigger itself. The build wrapper
// must track/disconnect it on mobile/PWA too, not only desktop.
ok(files.apply.includes("'if(!nativeShell&&!mobile&&window.MutationObserver){'"),'Build patch must target the old desktop-only observer condition');
ok(files.apply.includes("'if(window.MutationObserver){'"),'Build patch must enable observer tracking on mobile too');

ok(files.apply.includes("igr-v25-role-fluidity"),'Build/service-worker cache must be bumped to v25');
ok(files.apply.includes("navigation-theme-v18.js?v=v25-role-fluidity"),'Built HTML must load the v25 navigation-theme runtime');
ok(files.apply.includes("role-tree-polish-v12-29.js?v=v25-role-fluidity"),'Built HTML must load the v25 role-selection runtime');
ok(files.apply.includes("local-mode-theme-v25.css?v=v25-role-fluidity"),'Built HTML must load the v25 local-mode theme asset');
ok(files.apply.includes("cell-controls-stability-v23.js?v=v24-gameplay-stability"),'Built HTML must retain the v24 cell stability asset');

// If this check runs after npm run build, validate the actual distribution too.
try{
  await stat(path.join(root,'dist','index.html'));
  const distIndex=await read('dist/index.html');
  const distSw=await read('dist/service-worker.js');
  ok(distIndex.includes('navigation-theme-v18.js?v=v25-role-fluidity'),'dist/index.html has stale navigation-theme asset');
  ok(distIndex.includes('navigation-heritage-v19.js?v=v24-gameplay-stability'),'dist/index.html has stale navigation asset');
  ok(distIndex.includes('cell-controls-stability-v23.js?v=v24-gameplay-stability'),'dist/index.html has stale cell stability asset');
  ok(distIndex.includes('role-tree-polish-v12-29.js?v=v25-role-fluidity'),'dist/index.html has stale role-selection asset');
  ok(distIndex.includes('role-tree-polish-v12-29.css?v=v25-role-fluidity'),'dist/index.html has stale role-selection CSS');
  ok(distIndex.includes('local-mode-theme-v25.css?v=v25-role-fluidity'),'dist/index.html is missing the play-mode theme CSS');
  ok(!distIndex.includes('if(!nativeShell&&!mobile&&window.MutationObserver){'),'dist/index.html still leaves gameplay MutationObserver running on mobile');
  ok(distIndex.includes('if(window.MutationObserver){const NativeObserver'),'dist/index.html does not track/disconnect gameplay observer on all clients');
  ok(distSw.includes("const CACHE='igr-v25-role-fluidity';"),'dist/service-worker.js has stale cache version');
  ok(distSw.includes('/local-mode-theme-v25.css?v=v25-role-fluidity'),'dist/service-worker.js is missing play-mode theme CSS');
}catch{}

if(failures.length){
  console.error('\nGameplay stability regression check FAILED:\n- '+failures.join('\n- '));
  process.exit(1);
}
console.log('Gameplay stability regression check passed.');
