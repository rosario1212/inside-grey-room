/* Inside Grey Room — v43.1 lawyer role-reading bridge
   The complete lawyer desk must be usable while private cards are still being read.
   Loaded after lawyer-runtime-v43.js.
*/
(()=>{
'use strict';
const VERSION='v43.1-lawyer-reading';
const S=()=>{try{return typeof STATE!=='undefined'?STATE:(window.STATE||null)}catch(_){return window.STATE||null}};
const role=()=>S()?.sync?.player?.public_role||S()?.role||'';
let last='';

function readingOpen(){return role()==='maitre'&&!!document.querySelector('.role-card .private-card-v11')}
function syncDesk(){
  if(!readingOpen())return;
  const helper=document.getElementById('igr43RoleHelper');
  const api=window.IGR_LAWYER_V43;
  if(!helper||typeof api?.renderLawyerTab!=='function')return;
  const desk=String(api.renderLawyerTab()||'');
  if(!desk||desk===last)return;
  last=desk;
  helper.classList.add('igr43-reading-desk');
  helper.innerHTML=`<div class="igr431-reading-label">REPRÉSENTATION · PENDANT LA LECTURE DES CARTES</div>${desk}`;
}

const baseRenderRole=typeof window.renderRole==='function'?window.renderRole:(typeof renderRole==='function'?renderRole:null);
if(baseRenderRole){
  const v431RenderRole=function(){
    const out=baseRenderRole.apply(this,arguments);
    last='';
    setTimeout(()=>{window.IGR_LAWYER_V43?.refresh?.(false);syncDesk()},0);
    setTimeout(syncDesk,180);
    return out;
  };
  try{renderRole=v431RenderRole}catch(_){}window.renderRole=v431RenderRole;
}

// Requests can arrive while every player is still reading. Polling here is
// deliberately limited to the role-reading screen; the v43 runtime owns live play.
setInterval(()=>{
  if(!readingOpen())return;
  window.IGR_LAWYER_V43?.refresh?.(false);
  setTimeout(syncDesk,30);
},1200);

addEventListener('pageshow',()=>setTimeout(syncDesk,120),{passive:true});
setTimeout(syncDesk,400);

const style=document.createElement('style');
style.dataset.igrV431=VERSION;
style.textContent=`
.igr43-reading-desk{margin-top:14px!important;padding:0!important;border:0!important;background:transparent!important}.igr431-reading-label{margin:0 0 10px;padding:10px 12px;border:1px solid rgba(255,255,255,.12);border-radius:12px;font-size:10px;letter-spacing:.12em;font-weight:850;color:#a5afb8;background:rgba(255,255,255,.035)}.igr43-reading-desk .igr43-lawyer-page{margin:0}.igr43-reading-desk .igr43-lawyer-page>header h2{font-size:22px}.igr43-reading-desk .igr43-request-card{background:rgba(255,255,255,.045)}
`;
document.head.appendChild(style);
window.IGR_LAWYER_READING_V431={version:VERSION,sync:syncDesk};
})();
