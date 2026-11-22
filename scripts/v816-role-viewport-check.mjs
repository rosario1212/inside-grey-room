// v816: execute the real browser script with a deterministic, minimal DOM.
// No remote calls; tests viewport preservation across Heritage & Casino syncs.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const read=p=>readFileSync(p,'utf8');
const script=read('role-viewport-stability-v816.js');
const css=read('interface-consistency-v816.css');
const index=read('index.html');
const sw=read('service-worker.js');
const finalizer=read('scripts/finalize-cartel030-release.mjs');
const web=read('scripts/build-web.mjs'),mobile=read('scripts/build-mobile.mjs');
assert.equal(index.split('role-viewport-stability-v816.js?v=20261121-v816-1').length-1,1);
assert.equal(index.split('interface-consistency-v816.css?v=20261121-v816-1').length-1,1);
assert(sw.includes('/role-viewport-stability-v816.js?v=20261121-v816-1'));
assert(sw.includes('/interface-consistency-v816.css?v=20261121-v816-1'));
assert(sw.includes("const CACHE='igr-v831-mobile-ux-20261122'"));
assert(finalizer.includes("const pwaVersion='v831-mobile-ux-20261122'"));
for(const source of [web,mobile]){
 assert(source.includes("'role-viewport-stability-v816.js'"));
 assert(source.includes("'interface-consistency-v816.css'"));
}
assert(css.includes('overflow-anchor:none'));
assert(css.includes('prefers-reduced-motion:reduce'));

function simulate(kind){
 const handlers=new Map(),timers=new Map(),frames=new Map();
 let tid=0,fid=0,mo;
 const hnet=kind==='heritage';
 const original={isConnected:true};
 let lobby=original,key='ABCD';
 const main={className:hnet?'page hnet hplay-theme-kuroi':'casino-page casino-live',id:'casino-live-v105',
  querySelector(sel){
   if(sel==='.hnet-code > strong'||sel==='.casino-lobby-access h1')return {textContent:key};
   return null;
  }
 };
 const root={
  style:{minHeight:''},isConnected:true,
  getBoundingClientRect(){return {height:1100}},
  querySelector(sel){
   const wants=hnet?sel==='main.hnet .hnet-lobby':sel==='main.casino-live .casino-role-choice-zone';
   return wants?lobby:null;
  }
 };
 original.closest=()=>main;
 const target={disabled:false,closest(selector){
   const role=hnet?'[data-hnet="role"],[data-mnet="role"]':'[data-casino-action="select-role"]';
   const zone=hnet?'main.hnet .hnet-lobby':'main.casino-live .casino-role-choice-zone';
   if(selector===role)return target;
   if(selector===zone)return lobby;
   return null;
 }};
 const doc={
  readyState:'complete',documentElement:{style:{scrollBehavior:''}},
  getElementById(id){return id==='app'?root:null},
  addEventListener(type,listener){handlers.set(type,listener)}
 };
 const win={
  scrollY:610,innerHeight:800,
  scrollTo(position){
   this.scrollY=typeof position==='object'?position.top:arguments[1];
  },
  addEventListener(){},
 };
 const env={window:win,document:doc,MutationObserver:class {
   constructor(callback){this.callback=callback;mo=this}
   observe(){}
  },
  requestAnimationFrame:fn=>{frames.set(++fid,fn);return fid},
  cancelAnimationFrame:id=>frames.delete(id),
  setTimeout:(fn)=>{timers.set(++tid,fn);return tid},
  clearTimeout:id=>timers.delete(id),
  console,
 };
 vm.runInNewContext(script,env,{filename:'role-viewport-stability-v816.js'});
 assert.equal(win.IGR_ROLE_VIEWPORT_V816.isActive(),false);
 handlers.get('pointerdown')({target});
 assert.equal(win.IGR_ROLE_VIEWPORT_V816.isActive(),true);
 assert.equal(root.style.minHeight,'1426px');
 // Simulate Safari clamping a scroll position during an in-place RPC rerender.
 original.isConnected=false;
 lobby={isConnected:true,closest:()=>main};
 win.scrollY=0;
 mo.callback([{type:'childList',addedNodes:[{}],removedNodes:[{}]}]);
 assert.equal(win.scrollY,610,kind+' role choice must preserve absolute Y');
 for(const [id,fn] of [...frames]){frames.delete(id);fn()}
 for(const [id,fn] of [...frames]){frames.delete(id);fn()}
 assert.equal(win.scrollY,610,kind+' decorators must not move viewport');
 // After the user manually scrolls, stop protecting the old position.
 handlers.get('touchmove')();
 assert.equal(win.IGR_ROLE_VIEWPORT_V816.isActive(),false);
 assert.equal(root.style.minHeight,'');
 win.scrollY=740;
 mo.callback([{type:'childList',addedNodes:[{}],removedNodes:[{}]}]);
 assert.equal(win.scrollY,740,kind+' manual scroll must remain possible');
 // A navigation to another room must not be dragged back to the old viewport.
 lobby=original;original.isConnected=true;key='ROOM1';win.scrollY=320;
 handlers.get('click')({target});
 key='ROOM2';win.scrollY=0;
 mo.callback([{type:'childList',addedNodes:[{}],removedNodes:[{}]}]);
 assert.equal(win.scrollY,0,kind+' must not restore during real room navigation');
 assert.equal(win.IGR_ROLE_VIEWPORT_V816.isActive(),false);
 return true;
}
assert(simulate('heritage'));
assert(simulate('casino'));
console.log('PASS v816: stable role selection/draw scroll, manual scroll and room navigation, two native builds and PWA cache.');
