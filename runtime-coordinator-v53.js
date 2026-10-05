/* Inside Grey Room v53 — shared runtime scheduler.
   Consolidates low-frequency UI polling and prevents overlapping jobs. */
(()=>{
'use strict';
if(window.IGR_RUNTIME_COORDINATOR)return;
const VERSION='v53-runtime-coordinator';
const jobs=new Map();let pulse=0;
const now=()=>Date.now();
function run(job,t){if(job.running)return;job.running=true;job.next=t+job.ms;Promise.resolve().then(job.fn).catch(error=>console.warn(`[IGR ${VERSION}] ${job.key}`,error)).finally(()=>{job.running=false})}
function tick(){const t=now(),hidden=document.hidden;for(const job of jobs.values()){if(t<job.next)continue;if(hidden&&!job.runWhenHidden){job.next=t+job.ms;continue}run(job,t)}}
function ensure(){if(!pulse)pulse=setInterval(tick,500)}
function every(key,ms,fn,options={}){key=String(key||'job');ms=Math.max(500,Number(ms)||1000);const job={key,ms,fn,next:now()+(options.immediate?0:ms),runWhenHidden:!!options.runWhenHidden,running:false};jobs.set(key,job);ensure();if(options.immediate)queueMicrotask(()=>{const current=jobs.get(key);if(current)run(current,now())});return()=>jobs.delete(key)}
function cancel(key){jobs.delete(String(key||''))}
document.addEventListener('visibilitychange',()=>{if(!document.hidden){const t=now();for(const job of jobs.values())job.next=Math.min(job.next,t+80)}},{passive:true});
window.IGR_RUNTIME_COORDINATOR=Object.freeze({version:VERSION,every,cancel,size:()=>jobs.size});
})();
