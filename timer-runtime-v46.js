/* Inside Grey Room v46.2 — canonical long-mode timer corrections.
   LONG: interrogation = 06:00; final debrief / judge deliberation = 04:00.
   Loaded after older duration layers so stale 08:00 values cannot overwrite the canonical durations.
*/
(()=>{
'use strict';
const VERSION='v46-2-six-minute-long';
const S=()=>{try{return typeof STATE!=='undefined'?STATE:(window.STATE||null)}catch(_){return window.STATE||null}};
const room=()=>S()?.sync?.room||null;
const localeEn=()=>String(window.IGR_LOCALE||document.documentElement.lang||'fr').toLowerCase().startsWith('en');
function mode(){
  const r=room();
  const v=r?.state?.duration_mode??r?.duration_mode??S()?.sync?.duration_mode;
  return v==='short'||v==='long'?v:'legacy';
}
const isLong=()=>mode()==='long';

// Keep the shared duration registry aligned for every renderer that reads it after v46 loads.
try{
  const long=window.IGR_DURATION_MODES_V35?.modes?.long;
  if(long){long.interrogation=360;long.finalDebrief=240}
}catch(_){/* no-op */}

const patchFinalCopy=html=>String(html??'')
  .replace(/DERNIER DÉBRIEF\s*·\s*0[23]:00/gi,'DERNIER DÉBRIEF · 04:00')
  .replace(/FINAL DEBRIEF\s*·\s*0[23]:00/gi,'FINAL DEBRIEF · 04:00')
  .replace(/Dernier débrief\s*:\s*(?:2|3)\s*minutes?/gi,'Dernier débrief : 4 minutes')
  .replace(/Final debrief\s*:\s*(?:2|3)\s*minutes?/gi,'Final debrief: 4 minutes');
const patchInterrogationCopy=html=>String(html??'')
  .replace(/Convoquer\s*·\s*8\s*min/gi,'Convoquer · 6 min')
  .replace(/Interrogatoire\s*·\s*08:00/gi,'Interrogatoire · 06:00')
  .replace(/Interrogation\s*·\s*08:00/gi,'Interrogation · 06:00')
  .replace(/Interrogatoire\s*:\s*8\s*minutes?/gi,'Interrogatoire : 6 minutes')
  .replace(/Interrogation\s*:\s*8\s*minutes?/gi,'Interrogation: 6 minutes');
const patchLongCopy=html=>isLong()?patchFinalCopy(patchInterrogationCopy(html)):String(html??'');

const basePhaseLabel=window.phaseLabel;
if(typeof basePhaseLabel==='function')window.phaseLabel=function(ph){
  if(isLong()&&ph==='final_debrief')return `${localeEn()?'FINAL DEBRIEF':'DERNIER DÉBRIEF'} · 04:00`;
  const out=basePhaseLabel.apply(this,arguments);
  return patchLongCopy(out);
};

const basePhaseInstruction=window.phaseInstruction;
if(typeof basePhaseInstruction==='function')window.phaseInstruction=function(role,phase,target){
  let out=String(basePhaseInstruction.apply(this,arguments)??'');
  if(!isLong())return out;
  if(phase==='interrogation')out=patchInterrogationCopy(out).replace(/08:00/g,'06:00');
  if(phase==='final_debrief')out=patchFinalCopy(out).replace(/0[23]:00/g,'04:00');
  return out;
};

const baseInterrogationSelect=window.renderInterrogationSelect;
if(typeof baseInterrogationSelect==='function')window.renderInterrogationSelect=function(){
  return patchLongCopy(baseInterrogationSelect.apply(this,arguments));
};
const baseInvestigationTab=window.renderInvestigationTab;
if(typeof baseInvestigationTab==='function')window.renderInvestigationTab=function(){
  return patchLongCopy(baseInvestigationTab.apply(this,arguments));
};

// Also repair an already-rendered card without waiting for the next app render.
let domQueued=false;
function patchVisibleCopy(){
  domQueued=false;
  if(!isLong()||!document.body)return;
  const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
  const nodes=[];let n;
  while((n=walker.nextNode())){
    const t=n.nodeValue||'';
    if(/DERNIER DÉBRIEF|FINAL DEBRIEF|Dernier débrief|Final debrief|Convoquer\s*·\s*8\s*min|Interrogatoire\s*[·:]|Interrogation\s*[·:]/i.test(t))nodes.push(n);
  }
  for(const node of nodes){
    const next=patchLongCopy(node.nodeValue);
    if(next!==node.nodeValue)node.nodeValue=next;
  }
}
function queuePatch(){if(domQueued)return;domQueued=true;queueMicrotask(patchVisibleCopy)}
new MutationObserver(queuePatch).observe(document.documentElement,{childList:true,subtree:true,characterData:true});
document.addEventListener('DOMContentLoaded',queuePatch,{once:true});
queuePatch();
window.IGR_TIMER_RUNTIME_V46={version:VERSION,long:{interrogation:360,finalDebrief:240}};
})();
