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
  cell:await read('cell-controls-stability-v23.js'),
  apply:await read('scripts/apply-interface-v14.mjs')
};

for(const rel of ['navigation-theme-v18.js','navigation-heritage-v19.js','cell-controls-stability-v23.js','scripts/apply-interface-v14.mjs']){
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

// gameplay-clean-v12 has a legacy document-wide MutationObserver whose callback
// rewrites child nodes and can therefore retrigger itself. The build wrapper
// must track/disconnect it on mobile/PWA too, not only desktop.
ok(files.apply.includes("'if(!nativeShell&&!mobile&&window.MutationObserver){'"),'Build patch must target the old desktop-only observer condition');
ok(files.apply.includes("'if(window.MutationObserver){'"),'Build patch must enable observer tracking on mobile too');

ok(files.apply.includes("igr-v24-gameplay-stability"),'Build/service-worker cache must be bumped to v24');
ok(files.apply.includes("cell-controls-stability-v23.js?v=v24-gameplay-stability"),'Built HTML must load the v24 cell stability asset');

// If this check runs after npm run build, validate the actual distribution too.
try{
  await stat(path.join(root,'dist','index.html'));
  const distIndex=await read('dist/index.html');
  const distSw=await read('dist/service-worker.js');
  ok(distIndex.includes('navigation-theme-v18.js?v=v24-gameplay-stability'),'dist/index.html has stale navigation-theme asset');
  ok(distIndex.includes('navigation-heritage-v19.js?v=v24-gameplay-stability'),'dist/index.html has stale navigation asset');
  ok(distIndex.includes('cell-controls-stability-v23.js?v=v24-gameplay-stability'),'dist/index.html has stale cell stability asset');
  ok(!distIndex.includes('if(!nativeShell&&!mobile&&window.MutationObserver){'),'dist/index.html still leaves gameplay MutationObserver running on mobile');
  ok(distIndex.includes('if(window.MutationObserver){const NativeObserver'),'dist/index.html does not track/disconnect gameplay observer on all clients');
  ok(distSw.includes("const CACHE='igr-v24-gameplay-stability';"),'dist/service-worker.js has stale cache version');
}catch{}

if(failures.length){
  console.error('\nGameplay stability regression check FAILED:\n- '+failures.join('\n- '));
  process.exit(1);
}
console.log('Gameplay stability regression check passed.');
