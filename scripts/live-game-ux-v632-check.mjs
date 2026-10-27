/* Offline smoke checks for generated web/PWA or Capacitor bundle. */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
const root=path.resolve(process.argv[2]||'dist');
const get=async x=>readFile(path.join(root,x),'utf8');
const html=await get('index.html'),css=await get('live-game-ux-v632.css');
const script=await get('live-game-ux-v632.js'),sw=await get('service-worker.js');
assert(html.includes('live-game-ux-v632.css?v=v632-iphone-live-ux'));
assert(html.includes('live-game-ux-v632.js?v=v632-iphone-live-ux'));
assert(html.lastIndexOf('live-game-ux-v632.css')>html.lastIndexOf('screen-polish-v73.css'),'new CSS must override legacy game presentation');
assert(html.lastIndexOf('live-game-ux-v632.js')>html.lastIndexOf('authoritative-runtime-v40.js'),'new UX script must run after gameplay wrappers');
assert(sw.includes('/live-game-ux-v632.css?v=v632-iphone-live-ux'));
assert(sw.includes('/live-game-ux-v632.js?v=v632-iphone-live-ux'));
assert(css.includes('body:has(.igr-settings-modal) > .live-session-controls'),'modal must hide floating controls');
assert(css.includes('grid-template-columns:repeat(3,minmax(0,1fr))'),'tabs must all be available');
assert(css.includes('safe-area-inset-top'),'notch space must be reserved');
let mounted=0,removed=0,appended=0,mode='none';
const next={id:'liveAdvanceBtn'};
const host={appendChild(el){assert.equal(el,next);appended++}};
const dock={querySelector(){return next},remove(){removed++}};
const game={querySelector(){return host}};
const document={
 readyState:'complete',
 querySelector(sel){if(sel==='#app .game-v11')return mode==='game'?game:null;if(sel==='body > .live-session-controls')return dock;return null}
};
const window={mountLiveSessionControls(){mounted++}};
vm.runInNewContext(script,{window,document});
mode='game';
window.mountLiveSessionControls();
assert.equal(mounted,1,'original mounting must still run');
assert.equal(appended,1,'existing host action must be moved, not recreated');
assert.equal(removed,1,'duplicate bottom dock must disappear on game screen');
mode='briefing';
window.mountLiveSessionControls();
assert.equal(appended,1,'non-game screens must keep their controls untouched');
console.log('iPhone live-game UX bundle and semantics OK: '+path.basename(root));
