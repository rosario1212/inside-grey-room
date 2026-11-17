/* IGR v772: one-minute selection feedback and public-only S1/S2/S3 aliases. */
(()=>{
'use strict';
if(window.IGR_INVESTIGATION_V772)return;
let roomKey='',cast={},casting=false,queued=false;
const state=()=>typeof STATE==='object'?STATE:null;
const game=()=>state()?.sync||null;
const allowed=()=>!!game()?.room&&state()?.view==='game';
async function loadCast(){
 const d=game(),s=state();if(!allowed()||!d?.room?.code||!s?.token||casting)return;
 const key=d.room.code+':'+(d.room.state?.match_no||1);
 if(key===roomKey)return;
 casting=true;
 try{
  const res=await rpc('igr_v772_public_cast',{p_code:d.room.code,p_player_token:s.token});
  if(!res||typeof res!=='object'||Array.isArray(res))throw Error('invalid cast');
  cast=Object.fromEntries(Object.entries(res).filter(([k,v])=>/^S[1-9]$/.test(k)&&typeof v==='string'&&v.length<60));
  roomKey=key;
 }catch(_){/* Never invent an S1 mapping if RPC is unavailable. */}
 finally{casting=false;decorate();}
}
function replaceAliases(root){
 const keys=Object.keys(cast);if(!root||!keys.length)return;
 const re=new RegExp('\\b('+keys.join('|')+')\\b','g');
 const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),nodes=[];
 while(walker.nextNode()){
  const n=walker.currentNode,p=n.parentElement;
  if(p&&!p.closest('script,style,textarea,option,input,[contenteditable="true"]')&&re.test(n.nodeValue||''))nodes.push(n);
  re.lastIndex=0;
 }
 for(const n of nodes){const updated=n.nodeValue.replace(re,k=>cast[k]||k);if(updated!==n.nodeValue)n.nodeValue=updated;}
}
function compact(root){
 for(const guide of root.querySelectorAll('.igr50-role-guide')){
  if(guide.closest('.igr772-guide'))continue;
  const details=document.createElement('details'),summary=document.createElement('summary');
  details.className='igr772-guide';summary.textContent='Rappels du rôle';
  guide.before(details);details.append(summary,guide);
 }
 for(const section of root.querySelectorAll('.igr001-reports')){
  const h=section.querySelector(':scope > h3');if(!h)continue;
  const count=(h.textContent.match(/\d+/)||[])[0];
  const header=section.closest('#igr634-evidence')?.querySelector('summary');
  if(header&&count&&!header.querySelector('.igr772-piece-count')){
    const badge=document.createElement('small');badge.className='igr772-piece-count';
    badge.textContent=count+' pièce'+(count==='1'?'':'s');header.appendChild(badge);
  }
  h.classList.add('igr772-repeated-title');
 }
}
function timer(){
 const d=game(),root=document.querySelector('#app .game-v11');if(!root)return;
 const ph=d?.room?.phase,active=['interrogation_select','event_select'].includes(ph);
 let n=root.querySelector('.igr772-choice-timer');
 if(!active||!d?.room?.phase_ends_at){n?.remove();return;}
 if(!n){
  n=document.createElement('aside');n.className='igr772-choice-timer';
  n.setAttribute('role','status');n.setAttribute('aria-live','off');
  const target=root.querySelector('.tabs-v11')||root.querySelector('.phase-explain');
  if(target)target.before(n);else root.prepend(n);
 }
 const deadline=Date.parse(d.room.phase_ends_at),offset=d.server_now?Date.parse(d.server_now)-Date.now():0;
 const remaining=Number.isFinite(deadline)?Math.max(0,Math.ceil((deadline-Date.now()-offset)/1000)):60;
 const label=ph==='interrogation_select'?'prochain interrogatoire':'prochain événement';
 const copy=remaining>0?'Choisis le '+label+' · '+String(Math.floor(remaining/60)).padStart(2,'0')+':'+String(remaining%60).padStart(2,'0'):'Sélection automatique en cours…';
 if(n.textContent!==copy)n.textContent=copy;
 n.classList.toggle('igr772-urgent',remaining<=15);
}
function decorate(){
 const root=document.querySelector('#app');if(!root||!allowed())return;
 replaceAliases(root);compact(root);timer();
}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;decorate();void loadCast();});}
function start(){
 const app=document.querySelector('#app');
 if(app&&window.MutationObserver)new MutationObserver(schedule).observe(app,{childList:true,subtree:true,characterData:true});
 setInterval(()=>{timer();const d=game(),key=d?.room?.code+':'+(d?.room?.state?.match_no||1);if(key&&key!==roomKey)void loadCast();},1000);
 schedule();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
window.IGR_INVESTIGATION_V772=Object.freeze({version:'v772',refresh:schedule});
})();