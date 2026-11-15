/* Inside Grey Room — LE RÉGIME v13 shared trial and pursuit candidate.
 * GATED: without a server-pinned private Regime room this renders nothing.
 * Public UI cannot load the variant, sealed truth, active hiding network or
 * another player's private instructions.
 */
(()=>{
'use strict';
const VERSION='regime-v13-candidate';
const ids=new Set(['032','033','034']);
const me=()=>{try{return STATE?.sync?.player||null}catch{return null}};
const room=()=>{try{return STATE?.sync?.room||null}catch{return null}};
const session=()=>{try{return STATE||null}catch{return null}};
const esc=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const can=()=>ids.has(String(room()?.scenario_id||''))&&
 room()?.status==='playing'&&session()?.view==='game'&&
 room()?.state?.regime_v13_active===true;
let cache=null,lastPoll=0,lastKey='',inflight=false,lastRender='';
function key(){return [session()?.room,session()?.token,room()?.cycle,room()?.phase].join(':')}
function pending(){return (cache?.pending_mandates||[]).filter(x=>x.status==='awaiting_judge')}
const thisActor=()=>cache?.actor_id||'';
const isRole=r=>me()?.public_role===r;
const cast=()=>Array.isArray(cache?.cast)?cache.cast:[];
const person=id=>cast().find(p=>p.actor_id===id)?.pseudo||id;
const req=()=>globalThis.crypto?.randomUUID?.()||('igr-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2));
const rpcSafe=async(name,args)=>{
 if(typeof window.rpc!=='function')throw Error('Connexion au serveur indisponible');
 return window.rpc(name,{p_code:session().room,p_player_token:session().token,...args});
};
function toast(s){window.toast?.(s)}
async function call(name,args){
 try{const result=await rpcSafe(name,args);toast('Action enregistrée.');cache=null;lastRender='';
 await window.syncNow?.(true);await poll(true);return result}
 catch(e){toast(e?.message||'Action refusée par le serveur');return null}
}
async function poll(force=false){
 if(!can()){cache=null;document.getElementById('igr-regime-v13')?.remove();return}
 const k=key(),now=Date.now();
 if(!force&&inflight)return;
 if(!force&&k===lastKey&&now-lastPoll<3800)return;
 lastPoll=now;lastKey=k;inflight=true;
 try{
  const result=await rpcSafe('igr_regime_v13_state',{});
  if(k!==key())return;
  cache=result?.enabled===true?result:null;
  render();
 }catch(e){cache=null;document.getElementById('igr-regime-v13')?.remove()}
 finally{inflight=false}
}
function button(label,action,attrs=''){return '<button type="button" data-igr-regime="'+esc(action)+'" '+attrs+'>'+esc(label)+'</button>'}
function section(title,body,klass=''){return '<section class="igr-rg13-section '+klass+'"><h4>'+esc(title)+'</h4>'+body+'</section>'}
function labelFor(s){return ({enqueteur:'ENQUÊTEUR',analyste:'ANALYSTE',juge:'JUGE',procureur:'PROCUREUR',suspect:'SUSPECT'})[s]||s}
function myCard(){
 const c=cache?.my_card;if(!c)return '';
 let out='<p class="igr-rg13-muted"><b>'+esc(c.identity)+'</b></p>';
 out+='<details><summary>Ce que tu sais</summary><p>'+esc(c.what_you_know)+'</p></details>';
 out+='<details><summary>Ce que tu caches</summary><p>'+esc(c.what_you_hide)+'</p></details>';
 out+='<p><b>Ton objectif :</b> '+esc(c.objective)+'</p>';
 return section('TON PERSONNAGE',out);
}
function alliance(){
 if(!cache?.my_fugitive_options?.length&&!['vahran_director','interior_minister',
 'presidential_heir','defense_minister','fallen_president','presidential_security'].includes(thisActor()))return '';
 if(cache?.my_alliance_choice)return section('L’ALLIANCE','<p>Ton choix a été enregistré. Les décisions des autres fugitifs restent secrètes.</p>');
 if(Number(cache?.cycle)>1)return '';
 return section('ALLIANCE SECRÈTE',
 '<p>Rejoindre le même réseau uniquement si les deux dirigeants l’acceptent. Sinon, ils fuient séparément.</p>'+
 button('SE REGROUPER','alliance-together')+
 button('SE SÉPARER','alliance-apart'),'igr-rg13-alliance');
}
function actions(){
 if(!Array.isArray(cache?.my_fugitive_options)||!cache.my_fugitive_options.length)return '';
 if(cache.my_fugitive_decision_used)return section('CONTRE-DÉCISION','<p>Une décision a déjà été enregistrée pour ce cycle.</p>');
 return section('DÉCISION DE FUITE · CYCLE '+cache.cycle,
 '<p>Chaque décision présente un bénéfice et un coût. Le résultat peut modifier la traque immédiatement.</p>'+
 '<div class="igr-rg13-choices">'+cache.my_fugitive_options.map(a=>'<article><b>'+esc(a.label)+'</b>'+
 '<p>'+esc(a.effect_description||'')+'</p><small>CONTREPARTIE : '+esc(a.cost_description||'')+'</small>'+
 button('CONFIRMER','move','data-option-id="'+esc(a.id)+'"')+'</article>').join('')+'</div>');
}
function investigations(){
 if(!['enqueteur','analyste'].includes(cache?.role)||!Array.isArray(cache?.offered_investigations))return '';
 if(cache.investigation_used_this_cycle)return section('INVESTIGATION',
 '<p>Le camp Enquête a déjà sélectionné son investigation collective de ce cycle.</p>');
 return section('INVESTIGATIONS · CYCLE '+cache.cycle,
 '<p>Choisissez un seul axe. Les pièces garanties continuent de paraître indépendamment de vos choix.</p>'+
 '<div class="igr-rg13-choices">'+cache.offered_investigations.map(x=>
 '<article><b>'+esc(x.label)+'</b>'+button('EXAMINER','investigate','data-option-id="'+esc(x.id)+'"')+'</article>').join('')+'</div>');
}
function evidence(){
 const docs=Array.isArray(cache?.public_evidence)?cache.public_evidence:[];
 if(!docs.length)return '';
 return section('DOSSIER DES PREUVES · '+docs.length+' pièces',
 '<details><summary>Ouvrir les documents publiés</summary>'+
 docs.map(d=>'<div class="igr-rg13-proof"><small>'+esc(d.kind==='capture'?'PISTE DE TRAQUE':'PIÈCE D’ENQUÊTE')+
 ' · '+esc(d.source||d.origin||'Document public')+'</small><strong>'+esc(d.title||'Document')+'</strong>'+
 '<p>'+esc(d.text||'')+'</p></div>').join('')+'</details>');
}
function warrants(){
 if(!isRole('enqueteur'))return '';
 const suspects=cast().slice(0,2);
 const ids=(cache?.public_evidence||[]).filter(x=>x.kind==='capture');
 return section('MANDATS D’INTERPELLATION',
 '<p>Deux sources indépendantes par cible. Un mandat, par dirigeant et par cycle. Le Juge vérifie la demande avant sa résolution.</p>'+
 '<div class="igr-rg13-form"><label>Cible<select id="igrRgTarget">'+
 suspects.map(s=>'<option value="'+esc(s.actor_id)+'">'+esc(s.pseudo)+'</option>').join('')+'</select></label>'+
 '<label>Hypothèse de fuite<select id="igrRgTrack"><option value="apart">Séparés</option><option value="together">Ensemble</option></select></label>'+
 '<label>Première pièce<select id="igrRgE1">'+
 ids.map(x=>'<option value="'+esc(x.id)+'">'+esc(x.id)+' · '+esc(person(x.target_id))+'</option>').join('')+'</select></label>'+
 '<label>Deuxième pièce<select id="igrRgE2">'+
 ids.map(x=>'<option value="'+esc(x.id)+'">'+esc(x.id)+' · '+esc(person(x.target_id))+'</option>').join('')+'</select></label>'+
 button('DÉPOSER UN MANDAT','warrant')+'</div>');
}
function judge(){
 if(!isRole('juge'))return '';
 const list=pending();
 return section('CONTRÔLE JUDICIAIRE',
 list.length?list.map(x=>'<article class="igr-rg13-warrant"><b>'+esc(person(x.target_id))+'</b>'+
 '<p>Hypothèse : '+esc(x.track_choice==='together'?'Réseau commun':'Réseaux séparés')+
 ' · Pièces : '+esc((x.evidence_ids||[]).join(', '))+'</p>'+
 button('RECEVOIR LE MANDAT','judge-allow','data-mandate-id="'+esc(x.id)+'"')+
 button('ÉMETTRE UNE OBJECTION','judge-contest','data-mandate-id="'+esc(x.id)+'"')+
 '</article>').join(''):'<p>Aucun mandat en attente. Les preuves scellées demeurent inconnues du Juge.</p>');
}
function third(){
 if(!cache?.my_mission)return '';
 const m=cache.my_mission;
 if(cache.third_submitted)return section('MISSION PERSONNELLE','<p>Ta pièce ou ta défense a été enregistrée. Prépare ta déclaration au tribunal.</p>');
 const coop=m.assigned_path==='cooperate';
 return section('TROISIÈME SUSPECT · '+(coop?'COOPÉRATION':'PROTECTION'),
 '<p>Tu dois intervenir avant la fin du cycle 2. Ton résultat est indépendant des captures des dirigeants.</p>'+
 (coop?'<p>Remettre la pièce authentique issue de ton dossier. Sa publication pourra aussi te compromettre.</p>'+
 button('REMETTRE L’ORIGINAL','third-submit'):
 '<label>Ta défense sur l’acte désigné<textarea id="igrRgDefense" maxlength="600" rows="3" placeholder="Explique ta responsabilité et conteste les accusations précises"></textarea></label>'+
 button('DÉPOSER LA DÉFENSE','third-submit')));
}
function court(){
 if(cache?.phase!=='regime_court')return '';
 const c=cache?.court||{},long=Number(c.duration_minutes)===14;
 const calls=c.called||[];
 const arrested=cache?.arrests||{};
 const witnesses=cast().filter((s,i)=>i===2||Object.hasOwn(arrested,s.actor_id));
 const absent=cast().filter((s,i)=>i<2&&!Object.hasOwn(arrested,s.actor_id));
 const active=c.current?.actor_id,stage=c.stage||'opening';
 const judgeUI=isRole('juge')?'<div class="igr-rg13-call"><b>APPEL À LA BARRE</b>'+
 witnesses.filter(s=>!calls.includes(s.actor_id)).map(s=>
 button('APPELER '+s.pseudo,'court-call','data-actor-id="'+esc(s.actor_id)+'"')).join('')+'</div>':'';
 const docs=Array.isArray(cache?.public_evidence)?cache.public_evidence:[];
 const acts=Array.isArray(cache?.court_acts)?cache.court_acts:[];
 const options='<option value="unknown">NON ÉTABLI</option>'+cast().map(s=>
 '<option value="'+esc(s.actor_id)+'">'+esc(s.pseudo)+'</option>').join('');
 const select=(id,name)=>'<select data-court-act="'+esc(id)+'" data-court-field="'+name+'">'+options+'</select>';
 const proofOptions='<option value="">— Choisir une pièce —</option>'+
 docs.filter(x=>x.kind!=='capture').map(x=>'<option value="'+esc(x.id)+'">'+esc(x.title||x.id)+'</option>').join('');
 const reconstruction=['enqueteur','analyste'].includes(cache.role)?
 section('RECONSTITUTION DES QUATRE ACTES',
 '<p>La responsabilité doit être fondée sur deux sources indépendantes par acte. Le vote 0–2 habituel aura lieu après ce tribunal.</p>'+
 acts.map(x=>'<article class="igr-rg13-act"><h5>'+esc(x.title)+'</h5>'+
 '<div class="igr-rg13-grid"><label>Ordonne'+select(x.id,'orderedBy')+'</label>'+
 '<label>Transmet'+select(x.id,'transmittedBy')+'</label>'+
 '<label>Exécute'+select(x.id,'executedBy')+'</label>'+
 '<label>Sait et contrôle'+select(x.id,'knewAndControlledBy')+'</label>'+
 '<label>Source 1<select data-court-act="'+esc(x.id)+'" data-court-field="evidence1">'+proofOptions+'</select></label>'+
 '<label>Source 2<select data-court-act="'+esc(x.id)+'" data-court-field="evidence2">'+proofOptions+'</select></label></div></article>').join('')+
 button('DÉPOSER LA RECONSTITUTION','reconstruct')):'';
 return '<section class="igr-rg13-court"><header><small>TRIBUNAL SPÉCIAL · KARSANE</small>'+
 '<h2>LES ACCUSÉS À LA BARRE</h2><p>'+esc(long?'PROCÈS LONG · 14 MINUTES · 5 MINUTES DE CONFRONTATION':'PROCÈS COURT · 8 MINUTES')+'</p>'+
 '<strong id="igrRgCourtClock">—</strong></header>'+
 '<div class="igr-rg13-bench"><div class="igr-rg13-judge">⚖ JUGE<br><small>'+esc((me()?.public_role==='juge'?me()?.pseudo:'Présidence de séance')||'Tribunal')+'</small></div>'+
 '<div class="igr-rg13-sides"><div><b>ACCUSATION</b><p>Enquêteur · Analyste · Procureur si présent</p></div>'+
 '<div><b>MIS EN CAUSE</b>'+witnesses.map(x=>'<p>'+esc(x.pseudo)+(active===x.actor_id?' · À LA BARRE':'')+'</p>').join('')+
 absent.map(x=>'<p class="igr-rg13-absent">'+esc(x.pseudo)+' · EN FUITE (siège vide)</p>').join('')+'</div></div>'+
 '<div class="igr-rg13-bar">BARRE · '+esc(active?person(active):'En attente de l’appel')+
 '<span id="igrRgBarClock"></span></div></div>'+
 judgeUI+reconstruction+'</section>';
}
function events(){
 const rows=cache?.events||[];if(!rows.length)return '';
 return section('JOURNAL DE KARSANE',
 rows.slice(-5).reverse().map(x=>
 '<article class="igr-rg13-news"><small>'+esc(x.type==='public_bulletin'?'ÉDITION SPÉCIALE':'DÉPÊCHE')+'</small>'+
 '<b>'+esc(x.title||'Nouvel événement confirmé')+'</b><p>'+esc(x.text||x.description||'')+'</p></article>').join(''));
}
function render(){
 if(!can()||!cache?.enabled){document.getElementById('igr-regime-v13')?.remove();return}
 const k=key()+'|'+JSON.stringify(cache);
 if(k===lastRender){tick();return}lastRender=k;
 const after=document.querySelector('.phase-strip')||document.querySelector('#game');
 if(!after)return;
 document.getElementById('igr-regime-v13')?.remove();
 const root=document.createElement('div');
 root.id='igr-regime-v13';
 root.className='igr-rg13-root';
 const phase=cache.phase;
 root.innerHTML='<header class="igr-rg13-banner"><small>LE RÉGIME · '+esc(cache.scenario_id)+' · CYCLE '+esc(cache.cycle)+'/3</small>'+
 '<h3>'+esc(phase==='regime_court'?'LE TRIBUNAL DE KARSANE':'LA CHUTE DE KARSANE')+'</h3>'+
 '<p>Les décisions des joueurs influencent la traque. Les faits historiques restent scellés.</p></header>'+
 (phase==='regime_court'?court():myCard()+alliance()+actions()+investigations()+third()+warrants()+judge())+
 evidence()+events();
 after.insertAdjacentElement('afterend',root);
 tick();
}
function tick(){
 const clock=document.getElementById('igrRgCourtClock');
 if(clock&&room()?.phase_ends_at){
 const ms=Math.max(0,Date.parse(room().phase_ends_at)-Date.now());
 const s=Math.ceil(ms/1000);
 clock.textContent=String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');
 }
 const bar=document.getElementById('igrRgBarClock'),cur=cache?.court?.current;
 if(bar&&cur?.started_at){
 const s=Math.max(0,Math.ceil((Date.parse(cur.started_at)+Number(cur.seconds||0)*1000-Date.now())/1000));
 bar.textContent=' · '+Math.floor(s/60)+':'+String(s%60).padStart(2,'0');
 }
}
function control(id){return document.getElementById(id)?.value||''}
document.addEventListener('click',async(ev)=>{
 const el=ev.target?.closest?.('[data-igr-regime]');if(!el||!document.getElementById('igr-regime-v13')?.contains(el)||!cache?.enabled)return;
 const action=el.dataset.igrRegime;
 el.disabled=true;
 const id=req(),args={p_request_id:id};
 try{
  if(action==='alliance-together'||action==='alliance-apart'){
   await call('igr_regime_v13_action',{...args,p_kind:'alliance',p_payload:{choice:action.endsWith('together')?'together':'apart'}});
  }else if(action==='move'||action==='investigate'){
   await call('igr_regime_v13_action',{...args,p_kind:action==='move'?'fugitive_choice':'investigate',p_payload:{option_id:el.dataset.optionId}});
  }else if(action==='third-submit'){
   await call('igr_regime_v13_action',{...args,p_kind:'third_submission',p_payload:{defense:control('igrRgDefense')}});
  }else if(action==='warrant'){
   const e1=control('igrRgE1'),e2=control('igrRgE2'),target=control('igrRgTarget');
   if(!e1||!e2||e1===e2){toast('Sélectionne deux pièces distinctes.');return}
   await call('igr_regime_v13_warrant',{...args,p_target_id:target,p_track_choice:control('igrRgTrack'),p_evidence_ids:[e1,e2]});
  }else if(action==='judge-allow'||action==='judge-contest'){
   await call('igr_regime_v13_judge_review',{...args,p_mandate_id:el.dataset.mandateId,
    p_decision:action==='judge-allow'?'allow':'contest'});
  }else if(action==='court-call'){
   await call('igr_regime_v13_court_call',{...args,p_actor_id:el.dataset.actorId});
  }else if(action==='reconstruct'){
   const answers=(cache?.court_acts||[]).map(a=>{
    const row={actId:a.id};
    for(const field of ['orderedBy','transmittedBy','executedBy','knewAndControlledBy','evidence1','evidence2'])
      row[field]=document.querySelector('[data-court-act="'+CSS.escape(a.id)+'"][data-court-field="'+field+'"]')?.value||'';
    row.evidenceIds=[row.evidence1,row.evidence2].filter(Boolean);
    delete row.evidence1;delete row.evidence2;return row;
   });
   if(answers.length!==4||answers.some(a=>a.evidenceIds.length!==2||a.evidenceIds[0]===a.evidenceIds[1])){
    toast('Deux sources distinctes sont nécessaires pour chacun des quatre actes.');return;
   }
   await call('igr_regime_v13_reconstruct',{...args,p_answers:answers});
  }
 }finally{if(el.isConnected)el.disabled=false}
});
const currentGame=typeof window.renderGame==='function'?window.renderGame:(typeof renderGame==='function'?renderGame:null);
if(currentGame){
 const wrapped=function(){const result=currentGame.apply(this,arguments);setTimeout(()=>{render();poll(false)},0);return result};
 try{renderGame=wrapped}catch(_){}window.renderGame=wrapped;
}
setInterval(()=>{if(can()){tick();poll(false)}else document.getElementById('igr-regime-v13')?.remove()},1000);
window.IGR_REGIME_V13=Object.freeze({version:VERSION,refresh:()=>poll(true)});
})();