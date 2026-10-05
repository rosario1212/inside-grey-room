/* Inside Grey Room v53 — gameplay / UI polish.
   Witness rosters and witness content are intentionally untouched. */
(()=>{
'use strict';
if(window.IGR_GAMEPLAY_POLISH_V53)return;
const VERSION='v53-gameplay-polish';
const DENSE_IDS=new Set(['016','019','020','023','024','025','027','030','034']);
const ROLE_MARKS={enqueteur:'⌕',analyste:'◇',suspect:'◌',maitre:'§',procureur:'⚑',juge:'⚖',journaliste:'◈',inspecteur:'⌖',expert:'⌬',temoin:'◍'};
const S=()=>typeof STATE!=='undefined'?STATE:(window.STATE||{});
const sync=()=>S()?.sync||{},room=()=>sync()?.room||{},me=()=>sync()?.player||{};
const players=()=>Array.isArray(sync()?.players)?sync().players:[];
const role=()=>String(me()?.public_role||S()?.role||'');
const sid=()=>String(room()?.scenario_id||S()?.scenarioId||S()?.selectedScenario||'');
const copy=(fr,en)=>window.IGR_LOCALE==='en'?en:fr;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dense=()=>players().length>=9||DENSE_IDS.has(sid());
function roleLabel(r){try{return typeof publicRoleLabel==='function'?publicRoleLabel(r):(typeof roleInfo==='function'?roleInfo(r)?.label:r)}catch{return r}}
function akey(){return `igr_v53_analyst_${room()?.code||S()?.room||'local'}_${room()?.state?.match_no||1}_${me()?.id||S()?.playerId||'analyst'}`}
function aread(){try{return JSON.parse(localStorage.getItem(akey())||'{}')}catch{return{}}}
function asave(){if(role()!=='analyste')return;const v={hypothesis:document.getElementById('igr53Hypothesis')?.value?.slice(0,220)||'',contradiction:document.getElementById('igr53Contradiction')?.value?.slice(0,180)||'',rehear:document.getElementById('igr53Rehear')?.value?.slice(0,80)||''};try{localStorage.setItem(akey(),JSON.stringify(v))}catch{};const x=document.getElementById('igr53AnalystSaved');if(x){x.textContent=copy('Enregistré','Saved');clearTimeout(asave.t);asave.t=setTimeout(()=>{if(x?.isConnected)x.textContent=copy('Privé','Private')},800)}}
window.igr53SaveAnalyst=asave;
window.igr53ClearAnalyst=()=>{if(!window.confirm?.(copy('Effacer cette synthèse privée ?','Clear this private synthesis?')))return;try{localStorage.removeItem(akey())}catch{};['igr53Hypothesis','igr53Contradiction','igr53Rehear'].forEach(id=>{const n=document.getElementById(id);if(n)n.value=''})};
function analyst(){const n=aread();return `<section class="igr53-analyst"><header><div><small>${copy('OUTIL PRIVÉ · ANALYSTE','PRIVATE TOOL · ANALYST')}</small><h2>${copy('Synthèse de travail','Working synthesis')}</h2></div><span id="igr53AnalystSaved">${copy('Privé','Private')}</span></header><p>${copy('Organise ton raisonnement sans créer de preuve. Rien ici n’est envoyé au serveur ni montré aux autres joueurs.','Organize your reasoning without creating evidence. Nothing here is sent to the server or shown to other players.')}</p><div class="igr53-analyst-grid"><label><span>${copy('Hypothèse actuelle','Current hypothesis')}</span><textarea id="igr53Hypothesis" maxlength="220" oninput="igr53SaveAnalyst()">${esc(n.hypothesis||'')}</textarea></label><label><span>${copy('Contradiction majeure','Main contradiction')}</span><textarea id="igr53Contradiction" maxlength="180" oninput="igr53SaveAnalyst()">${esc(n.contradiction||'')}</textarea></label><label><span>${copy('À réentendre','Re-hear')}</span><input id="igr53Rehear" maxlength="80" value="${esc(n.rehear||'')}" oninput="igr53SaveAnalyst()"></label></div><button class="btn ghost small" onclick="igr53ClearAnalyst()">${copy('Effacer la synthèse','Clear synthesis')}</button></section>`}
function evidence(){return (sync()?.events||[]).filter(e=>String(e?.payload?.title||e?.payload?.text||e?.payload?.summary||'').trim())}
function investigator(){const ev=evidence(),last=ev.at(-1)?.payload||{},suspects=players().filter(p=>p.public_role==='suspect').length;return `<section class="igr53-overview"><header><small>${copy('VUE SYNTHÈSE','CASE SNAPSHOT')}</small><b>${copy('Dossier dense','Dense case')}</b></header><div><span><strong>${room()?.cycle||0}</strong><small>cycle</small></span><span><strong>${suspects||'—'}</strong><small>${copy('suspects','suspects')}</small></span><span><strong>${ev.length}</strong><small>${copy('éléments','elements')}</small></span></div>${last.title||last.text||last.summary?`<p><b>${copy('Dernier élément :','Latest element:')}</b> ${esc(last.title||last.text||last.summary)}</p>`:''}</section>`}
function decorateJudge(){if(role()!=='juge')return;const page=document.querySelector('.igr44-page');if(!page)return;page.querySelectorAll('.igr44-card').forEach(c=>{if(/ÉLÉMENTS PROTÉGÉS|PROTECTED/i.test(c.querySelector('small')?.textContent||''))c.classList.add('igr44-protection-meter')});page.querySelectorAll('.igr44-section').forEach(s=>{const h=s.querySelector(':scope > h3')?.textContent||'';if(/Saisines|Requests/i.test(h))s.classList.add('igr44-priority');if(!/Joueurs LIBRES|FREE players/i.test(h)||s.matches('details'))return;const roster=s.querySelector('.igr44-roster'),count=roster?.children?.length||0,d=document.createElement('details');d.className='igr44-section igr44-fold';if(count<=4)d.open=true;d.innerHTML=`<summary><span>${esc(h)}</span><b>${count}</b></summary>`;if(roster)d.appendChild(roster);s.replaceWith(d)})}
function decorate(){const r=role();document.body.dataset.igr53Role=r;document.body.classList.toggle('igr53-dense-case',dense());document.querySelectorAll('.role-card,.private-card-v11').forEach(c=>{if(c.querySelector('.igr53-role-signature'))return;c.insertAdjacentHTML('afterbegin',`<div class="igr53-role-signature"><i>${esc(ROLE_MARKS[r]||'·')}</i><span>${esc(roleLabel(r))}</span></div>`)});decorateJudge()}
const baseTab=typeof renderGameTab==='function'?renderGameTab:window.renderGameTab;
if(baseTab){const f=function(){let html=String(baseTab.apply(this,arguments)??'');if(S()?.tab==='investigation'&&role()==='analyste'&&!html.includes('igr53-analyst'))html=analyst()+html;if(S()?.tab==='investigation'&&role()==='enqueteur'&&dense()&&!html.includes('igr53-overview'))html=investigator()+html;return html};try{renderGameTab=f}catch{}window.renderGameTab=f}
const baseGame=typeof renderGame==='function'?renderGame:window.renderGame;
if(baseGame){const f=function(){const out=baseGame.apply(this,arguments);requestAnimationFrame(decorate);return out};try{renderGame=f}catch{}window.renderGame=f}
addEventListener('pageshow',()=>requestAnimationFrame(decorate),{passive:true});setTimeout(decorate,250);
window.IGR_GAMEPLAY_POLISH_V53=Object.freeze({version:VERSION,denseCase:dense,analystStorageKey:akey});
console.info(`[IGR ${VERSION}] active`);
})();
