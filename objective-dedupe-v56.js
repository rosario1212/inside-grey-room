/* Inside Grey Room v56 — role objective dedupe */
(()=>{'use strict';
const VERSION='56.0-objective-dedupe';
const ROLE_IDS=['enqueteur','analyste','suspect','maitre','procureur','juge','inspecteur','expert','journaliste','temoin'];
const fr=()=>window.IGR_LOCALE!=='en',copy=(a,b)=>fr()?a:b;
const norm=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[’']/g,"'").replace(/\s+/g,' ').trim().toLowerCase();
const S=()=>{try{return typeof STATE!=='undefined'?STATE:(window.STATE||null)}catch{return window.STATE||null}};
const me=()=>S()?.sync?.player||null,role=()=>me()?.public_role||S()?.role||'';
function primary(card){const ps=me()?.private_state||{};if(ps.omerta_objective)return String(ps.omerta_objective);if(role()==='juge'&&ps.judge_integrity_objective)return String(ps.judge_integrity_objective);if(ps.objective_main)return String(ps.objective_main);return card.querySelector('.role-summary span')?.textContent||''}
function secondary(){return String(me()?.private_state?.objective_secondary||'').trim()}
function removeLegacy(card){
 const j=card.querySelector('#igr44JudgeRoleHelper');if(j){const p=j.querySelector('p'),s=card.querySelector('.role-summary span');if(p?.textContent?.trim()&&s)s.textContent=p.textContent.trim();p?.remove();const l=j.querySelector('small');if(l)l.textContent=copy('CABINET DU JUGE','JUDGE CHAMBER')}
 const p=card.querySelector('#igr47RoleHelper');if(p){p.querySelectorAll('p').forEach(x=>x.remove());const l=p.querySelector('small');if(l)l.textContent=copy('OUTILS DU PARQUET','PROSECUTOR TOOLS')}
 card.querySelectorAll('.omerta-private-role p').forEach(x=>{const l=norm(x.querySelector('b')?.textContent);if(l==='objectif'||l==='objective')x.remove()});
 const o=card.querySelector('.omerta-objective-card');if(o){const l=norm(o.querySelector(':scope > span')?.textContent);if(l==='objectif'||l==='objective'){o.querySelector(':scope > b')?.remove();const h=o.querySelector(':scope > span');if(h)h.textContent=copy('CONSÉQUENCES FIXES','FIXED CONSEQUENCES')}}
}
function ensureSecondary(card,p){
 card.querySelectorAll('.v13-objectives,.igr56-objectives').forEach(x=>x.remove());
 const s=secondary();if(!s||norm(s)===norm(p))return;
 const box=document.createElement('div');box.className='igr56-objectives';
 const item=document.createElement('div');item.className='igr56-objective-secondary';
 const b=document.createElement('b');b.textContent=copy('OBJECTIF SECONDAIRE','SECONDARY OBJECTIVE');
 const q=document.createElement('p');q.textContent=s;item.append(b,q);box.appendChild(item);
 const foot=card.querySelector('.private-foot');foot?card.insertBefore(box,foot):card.appendChild(box);
}
function clean(card){
 if(!card)return;const r=role();if(r&&!ROLE_IDS.includes(r))return;
 removeLegacy(card);const sum=card.querySelector('.role-summary'),lab=sum?.querySelector('b'),val=sum?.querySelector('span'),p=primary(card);
 if(lab)lab.textContent=copy('OBJECTIF','OBJECTIVE');if(val&&p)val.textContent=p;
 ensureSecondary(card,p);
}
let queued=false;function refresh(){document.querySelectorAll('.private-card-v11').forEach(clean)}
function schedule(){if(queued)return;queued=true;queueMicrotask(()=>{queued=false;refresh()})}
new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule()});window.addEventListener('pageshow',schedule,{passive:true});schedule();
window.IGR_OBJECTIVE_DEDUPE_V56=Object.freeze({version:VERSION,refresh});
})();