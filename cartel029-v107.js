/* CARTEL 029 v107 — public objectives and role-authorized investigative report.
   No secret variants, private cards or culprit data are stored in this bundle. */
(()=>{
'use strict';
const state=()=>typeof STATE!=='undefined'?STATE:null;
const sync=()=>state()?.sync;
const active=()=>sync()?.room?.scenario_id==='029' && sync()?.room?.state?.cartel029_ready===true;
const member=()=>['enqueteur','analyste'].includes(sync()?.player?.public_role);
const lead=()=>sync()?.player?.public_role==='enqueteur';
const tr=(f,e)=>window.IGR_LOCALE==='en'?e:f;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fields=[
 ['santa_ceniza','Que s’est-il passé à Santa Ceniza ?','What happened at Santa Ceniza?','Captivité, morts et évasion.'],
 ['activities','Comment fonctionne Los Salcedo ?','How does Los Salcedo operate?','Activités, méthodes, autres sites.'],
 ['responsibilities','Qui dirige et qui est responsable ?','Who runs Los Salcedo and who is responsible?','Hiérarchie et faits étayés par des preuves.'],
 ['protection','Comment protéger les captifs ?','How can the captives be protected?','Trois rescapés, leurs proches et vingt captifs.']
];
let record=null,seen='',loading=false,last=0,dirty=false,message='';
const key=()=>[sync()?.room?.code,sync()?.player?.id,sync()?.room?.state?.match_no||1].join(':');
function reset(){if(seen!==key()){record=null;seen=key();loading=false;last=0;dirty=false;message=''}}
function mission(){
 return '<section class="igr029-mission"><small>029 · LE CYCLE MORT</small><h3>'+esc(tr('Trois questions à résoudre','Three questions to resolve'))+'</h3><ol>'+
 fields.slice(0,3).map(f=>'<li>'+esc(tr(f[1],f[2]))+'</li>').join('')+'</ol><p>'+esc(tr('En parallèle : protéger les rescapés, leurs familles et les vingt captifs. Une menace ne prouve pas qu’elle a été exécutée.','Also: protect the survivors, their families and the twenty captives. A threat is not evidence that harm has occurred.'))+'</p></section>';
}
function finalChoice(key,label,options){
 const disabled=record?.status==='submitted';
 const previous=record?.fields?.[key]||'unknown';
 return '<label class="igr029-field"><b>'+esc(label)+'</b><select data-igr029-field="'+key+'" '+(disabled?'disabled':'')+' onchange="igr029MarkDirty()">'+options.map(([v,t])=>'<option value="'+v+'" '+(v===previous?'selected':'')+'>'+esc(t)+'</option>').join('')+'</select></label>';
}
function reportBody(){
 if(!record)return '<p class="igr029-note">'+esc(message||tr('Chargement du rapport…','Loading report…'))+'</p>';
 const disabled=record.status==='submitted';
 return '<p class="igr029-note">'+esc(tr('Répondez simplement aux trois questions. Enregistrez à tout moment ; l’enquêteur et l’analyste partagent ce brouillon.','Answer the three questions. Save any time; the investigator and analyst share the draft.'))+'</p>'+
 fields.map((f,i)=>'<label class="igr029-field"><b>'+(i<3?i+1+'. ':'')+esc(tr(f[1],f[2]))+'</b><small>'+esc(f[3])+'</small><textarea data-igr029-field="'+f[0]+'" maxlength="1200" rows="3" '+(disabled?'readonly':'')+' oninput="igr029MarkDirty()">'+esc(record.fields?.[f[0]]||'')+'</textarea></label>').join('')+
 (Number(sync()?.room?.cycle)===3?'<div class="igr029-final-choices"><h4>'+esc(tr('Deux conclusions finales','Two final conclusions'))+'</h4>'+
 finalChoice('responsibility_choice',tr('Qui a décidé la représaille ?','Who ordered the reprisal?'),[
 ['unknown',tr('Preuves insuffisantes','Insufficient evidence')],['local',tr('Direction locale','Local leadership')],
 ['execution',tr('Exécutant sur le terrain','Field operative')],['finance',tr('Responsable financier','Financial controller')]])+
 finalChoice('witness4_assessment',tr('Que concluez-vous sur le quatrième témoin ?','What do you conclude about the fourth witness?'),[
 ['unknown',tr('Impossible à établir','Not established')],['innocent',tr('Témoin innocent','Innocent witness')],
 ['coerced',tr('Coopération sous contrainte','Coerced cooperation')],['voluntary',tr('Complicité volontaire','Voluntary involvement')],
 ['operative',tr('Agent du cartel infiltré','Cartel operative')]])+'</div>':'')+
 '<div class="igr029-buttons"><button class="btn ghost" type="button" onclick="igr029SaveReport()" '+(disabled?'disabled':'')+'>'+esc(tr('Enregistrer','Save'))+'</button>'+
 (lead()?'<button class="btn primary" type="button" onclick="igr029SubmitReport()" '+(disabled||Number(sync()?.room?.cycle)!==3?'disabled':'')+'>'+esc(tr('Remettre le rapport','Submit report'))+'</button>':'')+
 '</div><p class="igr029-note" role="status">'+esc(disabled?tr('Rapport remis.','Report submitted.'):message||tr('Brouillon confidentiel.','Confidential draft.'))+'</p>';
}
function repaint(){if(state()?.tab==='investigation'){const el=document.getElementById('igr029-report-body');if(el)el.innerHTML=reportBody()}}
async function load(force=false){
 if(!active()||!member()||!state()?.token||sync()?.room?.status==='lobby')return;
 reset();if(loading||(!force&&Date.now()-last<4500))return;
 const k=seen;loading=true;last=Date.now();
 try{
  const result=await rpc('igr_v107_029_report',{p_code:sync().room.code,p_player_token:state().token,p_patch:null,p_submit:false});
  if(k!==key())return;
  if(!result||!['draft','submitted'].includes(result.status))throw Error('Invalid report');
  if(!dirty){record=result;message='';repaint()}
 }catch(e){message=tr('Rapport momentanément indisponible.','Report unavailable.');repaint();console.warn('[029]',e?.message||e)}
 finally{loading=false}
}
function controls(){return '<section class="igr029-report"><h3>'+esc(tr('Rapport final · dossier 029','Final report · case 029'))+'</h3><div id="igr029-report-body">'+reportBody()+'</div></section>'}
async function save(submit){
 if(!active()||!member()||loading||!state()?.token)return;
 if(submit&&(!lead()||Number(sync()?.room?.cycle)!==3))return;
 const patch={};for(const el of document.querySelectorAll('[data-igr029-field]'))patch[el.dataset.igr029Field]=el.value;
 const k=key();loading=true;message=tr('Enregistrement…','Saving…');
 try{
  const value=await rpc('igr_v107_029_report',{p_code:sync().room.code,p_player_token:state().token,p_patch:patch,p_submit:!!submit});
  if(k!==key())return;
  if(!value||!['draft','submitted'].includes(value.status))throw Error('Invalid save');
  record=value;dirty=false;message=submit?tr('Rapport remis.','Report submitted.'):tr('Rapport enregistré.','Report saved.');repaint();
 }catch(e){message=tr('Échec de l’enregistrement : vérifiez les réponses et la phase.','Save failed: check answers and phase.');repaint();console.warn('[029 save]',e?.message||e)}
 finally{loading=false}
}
window.igr029MarkDirty=()=>{dirty=true};window.igr029SaveReport=()=>save(false);window.igr029SubmitReport=()=>save(true);
const original=typeof renderGameTab==='function'?renderGameTab:null;
if(original){const wrapped=function(){
 const html=original.apply(this,arguments);
 if(!active())return html;
 if(state()?.tab==='timeline')return mission()+String(html||'');
 if(state()?.tab==='investigation'&&member()){void load();return String(html||'')+controls()}
 return html;
};try{renderGameTab=wrapped}catch{}window.renderGameTab=wrapped;}
window.setInterval(()=>{if(active()&&member()&&state()?.tab==='investigation'&&!dirty)void load()},6500);
const style=document.createElement('style');style.id='igr029-v107-style';style.textContent=`
.igr029-mission,.igr029-report{border:1px solid rgba(199,166,141,.26);background:linear-gradient(140deg,rgba(51,23,23,.34),rgba(14,15,16,.94));padding:16px;border-radius:14px;margin-bottom:14px}
.igr029-mission small{font-size:10px;letter-spacing:.14em;color:#c7a68d}.igr029-mission h3,.igr029-report h3{font-size:17px;margin:8px 0;color:#e9e0d7}
.igr029-mission ol{padding-left:18px;margin:10px 0;display:grid;gap:8px}.igr029-mission li{font-size:13px;line-height:1.5}.igr029-mission p,.igr029-note{font-size:12px;line-height:1.5;color:#c9c1b8}
.igr029-field{display:grid;gap:6px;margin:13px 0;font-size:13px}.igr029-field small{color:#aba29a}
.igr029-field textarea{min-height:85px;width:100%;box-sizing:border-box;border:1px solid #544943;border-radius:8px;background:#171616;color:#f2eae3;font:inherit;padding:11px;resize:vertical;line-height:1.45}
.igr029-field textarea:focus{outline:2px solid #b99375} .igr029-field select{width:100%;padding:10px;border-radius:8px;background:#171616;color:#f2eae3;border:1px solid #544943}.igr029-final-choices{border-top:1px solid #544943;margin:18px 0;padding-top:12px}.igr029-final-choices h4{font-size:14px;color:#dcc3a5}.igr029-buttons{display:flex;flex-wrap:wrap;gap:9px}
@media(max-width:600px){.igr029-mission,.igr029-report{padding:12px}.igr029-buttons .btn{flex:1}}
`;document.head.appendChild(style);
// The four playable witnesses continue using the legacy suspect protocol
// internally until the investigation engine is fully replaced. Only neutral
// role labels change, and only for the server-certified 6–11 player roster.
const futureRoster=()=>sync()?.room?.scenario_id==='029' &&
  ((Number(sync()?.room?.min_players)===6&&Number(sync()?.room?.max_players)===11) ||
   sync()?.room?.state?.cartel029_ready===true);
const roleLabel0=typeof displayRole==='function'?displayRole:null;
if(roleLabel0){const f=function(r,...args){
  if(futureRoster()&&r==='suspect')return tr('Témoin','Witness');
  return roleLabel0.call(this,r,...args);
};try{displayRole=f}catch{}window.displayRole=f;}
const roleInfo0=typeof roleInfo==='function'?roleInfo:null;
if(roleInfo0){const f=function(r,...args){
  const existing=roleInfo0.call(this,r,...args);
  if(futureRoster()&&r==='suspect')return {...existing,
     label:tr('Témoin','Witness'),
     body:tr('Tu connais une partie de l’affaire. Dis ce que tu sais, cache ou révèle ton secret, mais ne fabrique pas de preuve.','You know part of the case. Share what you choose, keep or disclose your secret, but do not invent evidence.'),
     win:tr('Poursuis ton objectif personnel. Tu peux consulter ta fiche à tout moment pendant la partie.','Pursue your private objective; your role card remains accessible throughout play.')};
  return existing;
};try{roleInfo=f}catch{}window.roleInfo=f;}
const interrogation0=typeof renderInterrogationSelect==='function'?renderInterrogationSelect:null;
if(interrogation0){const f=function(...args){
  const html=String(interrogation0.apply(this,args)||'');
  if(!futureRoster())return html;
  return html.replace('Suspects restant à entendre',tr('Témoins restant à entendre','Witnesses awaiting questioning'))
      .replace('Tous les suspects ont été entendus.',tr('Les quatre témoins ont été entendus.','All four witnesses have been questioned.'));
};try{renderInterrogationSelect=f}catch{}window.renderInterrogationSelect=f;}
window.IGR_CARTEL_029_V107=Object.freeze({version:'v107',mission,controls});
})();