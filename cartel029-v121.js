/* CARTEL 029 v121 · role-specific UI. No canonical branch or private truth stored here. */
(()=>{
'use strict';
const d=()=>typeof STATE!=='undefined'?STATE?.sync:null;
const me=()=>d()?.player||{};
const s=()=>typeof STATE!=='undefined'?STATE:null;
const inRoom=()=>d()?.room?.scenario_id==='029';
const upcoming=()=>inRoom()&&(+d()?.room?.min_players===6&&[11,12].includes(+d()?.room?.max_players));
const active=()=>upcoming()&&d()?.room?.state?.cartel029_ready===true;
const tr=(fr,en)=>window.IGR_LOCALE==='en'?en:fr;
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
function wrap(name,fn){
 const original=typeof window[name]==='function'?window[name]:null;
 const binding=typeof eval==='function'?null:null; // no dynamic evaluation in runtime
 if(!original)return;
 const newer=function(...args){return fn.call(this,original,...args)};
 try{window[name]=newer}catch(_){}
 // Most app-v11 functions are classic global declarations in sloppy mode.
 try{switch(name){
  case 'roleInfo':roleInfo=newer;break;
  case 'displayRole':displayRole=newer;break;
  case 'publicRoleLabel':publicRoleLabel=newer;break;
  case 'privateCardHtml':privateCardHtml=newer;break;
  case 'renderGameTab':renderGameTab=newer;break;
  case 'renderInterrogationSelect':renderInterrogationSelect=newer;break;
  case 'renderProvisionalForm':renderProvisionalForm=newer;break;
  case 'levelsForm':levelsForm=newer;break;
  case 'collectLevels':collectLevels=newer;break;
  case 'renderReveal':renderReveal=newer;break;
  case 'renderFinalLockForm':renderFinalLockForm=newer;break;
  case 'phaseLabel':phaseLabel=newer;break;
  } }catch(_){}
}
const roles={
 maitre:{label:'Avocat du cartel',win:'Obtiens un mandat officiel et empêche l’enquête d’établir la chaîne de responsabilité de Los Salcedo.',body:'Le cartel te mandate et te paie. Tu peux négocier et défendre ton client avec le tempérament de ton choix.'},
 don:{label:'Le Don',win:'Choisis entre garder le secret et coopérer sans violence automatique.',body:'Tu diriges Los Salcedo. Tu peux écrire à ton bras droit et décider de ta stratégie privée une fois par cycle.'},
 bras_droit:{label:'Bras droit',win:'Reste loyal ou coopère : ta décision oriente ton objectif final.',body:'Tu peux écrire au Don et décider de ta stratégie privée une fois par cycle.'},
 suspect:{label:'Témoin',win:'Contribue à l’enquête, protège tes proches et reste fidèle aux faits de ta fiche.',body:'Tu peux parler librement, mentir ou te taire. Tu n’as rien à apprendre par cœur.'},
 journaliste:{label:'Journaliste',win:'Publie une information avec une source déclarée, puis défends ton angle final.',body:'Publication libre de 40 caractères minimum avec une source déclarée ; angle final de 24 caractères minimum. Aucun article n’est déclaré vrai automatiquement.'}
};
wrap('roleInfo',(orig,role)=>upcoming()&&roles[role]?roles[role]:orig(role));
wrap('displayRole',(orig,role,pseudo)=>{
 if(!upcoming())return orig(role,pseudo);
 if(roles[role])return roles[role].label+' · '+pseudo;
 return orig(role,pseudo);
});
wrap('publicRoleLabel',(orig,role)=>upcoming()&&roles[role]?roles[role].label:orig(role));
function part(title,body,secret=false){
 if(!String(body||'').trim())return '';
 return '<details class="igr029-detail'+(secret?' igr029-secret':'')+'"><summary>'+esc(title)+'</summary><p>'+esc(body)+'</p></details>';
}
wrap('privateCardHtml',(orig)=>{
 if(!active())return orig();
 const p=me(),x=p.private_state||{},r=p.public_role;
 if(!['suspect','don','bras_droit'].includes(r))return orig();
 const title=r==='suspect'?'Témoin '+(x['029_witness_index']||''):r==='don'?'Le Don':'Le bras droit';
 const origin=String(x.position||x.chronology||'');
 return '<div class="private-card-v11 igr029-card"><div class="kicker">DOSSIER 029 · TA FICHE PRIVÉE</div>'+
   '<h2>'+esc(title)+'</h2><p class="igr029-story">'+esc(origin)+'</p>'+
   '<p class="igr029-purpose"><b>Ton objectif</b> '+esc(x.objective_main||'Comprendre les faits et défendre ton rôle.')+'</p>'+
   '<p class="igr029-hint">Tu peux commencer à jouer. Les détails restent consultables pendant l’interrogatoire.</p>'+
   '<div class="igr029-folds">'+
   part('Ce que tu sais',x.anchors)+part('Ton secret',x.hide,true)+
   part('Tes proches',x['029_family'])+
   part('Ce que tu ignores',x.unknown)+
   part('Tes repères pour répondre',x['029_qprompts'])+
   part('Ta chronologie',x.chronology)+
   part('Tes relations',r==='suspect'?(Number(x['029_witness_index'])===4?
   'Tu ne connaissais pas les trois personnes évadées de Santa Ceniza avant de venir à la Grey Room. Tu affirmes venir d’une autre installation.':
   'Tu étais prisonnier à Santa Ceniza avec les deux autres rescapés. Vous vous connaissez et vous avez fui ensemble. Le quatrième fugitif a été repris.'):
   r==='don'?'Ton bras droit coordonne des responsables de Los Salcedo. Il connaît des circuits que tu ne surveilles pas tous personnellement.':
   'Tu travailles pour le Don, mais tes décisions et les siennes ne doivent pas être confondues.')+
   '</div><p class="igr029-hint">Tu peux te tromper, mentir ou garder le silence, mais les faits du scénario ne changent pas.</p></div>';
});
wrap('renderInterrogationSelect',(orig)=>{
 const html=String(orig()||'');
 return upcoming()?html.replace(/Suspects restant à entendre/g,'Témoins restant à entendre')
 .replace(/Tous les suspects ont été entendus/g,'Les quatre témoins ont été entendus')
 .replace(/culpabilité ni le degré réel de responsabilité/g,'sincérité ni la responsabilité'):html;
});
wrap('levelsForm',(orig,prefix)=>{
 if(!active())return orig(prefix);
 return '<p class="igr029-hint">Les témoins ne sont pas des suspects à noter. Les conclusions se trouvent dans le rapport d’enquête.</p>';
});
wrap('collectLevels',(orig,prefix)=>{
 if(!active())return orig(prefix);
 const out={};for(const t of d()?.suspects||[])out[t.id]=0;return out;
});
wrap('renderProvisionalForm',(orig)=>{
 if(!active())return orig();
 if((d()?.my_actions||[]).some(a=>a.action_type==='provisional'))return '<p>Étape provisoire validée.</p>';
 return '<div class="igr029-purpose"><b>Bilan provisoire</b><p>Discutez de vos hypothèses avant de poursuivre. Il n’est pas nécessaire d’accuser les témoins.</p>'+
   '<button class="btn primary" type="button" onclick="setProvisional()">Passer à la suite</button></div>';
});
function observed(kind){return (d()?.events||[]).filter(e=>e.event_type===kind)}
const protect=[
 ['survivors','Protéger les trois rescapés'],
 ['relatives','Protéger leurs familles'],
 ['captives','Demander la libération des vingt captifs']
];
function protectionProgress(){
 const notices=(d()?.events||[]).filter(e=>e.event_type==='public_notice' && e.payload?.title==='PROTECTION');
 return {
   used:new Set(notices.map(e=>e.payload?.target).filter(Boolean)),
   thisCycle:notices.some(e=>+e.cycle===+d()?.room?.cycle)
 };
}
function permitted029Phase(){return ['investigation_assembly','interrogation_select','interrogation','cycle_debrief','trame'].includes(d()?.room?.phase)||/^(event_|annex_)/.test(d()?.room?.phase||'')}
function protectHtml(){
 if(!active()||!['enqueteur','analyste'].includes(me().public_role)||d()?.room?.status!=='playing'||!permitted029Phase())return '';
 const cycle=+d().room.cycle;
 if(cycle<1||cycle>3)return '';
 const status=protectionProgress();
 return '<section class="igr029-extras"><h3>Protection des personnes</h3>'+
  '<p>Une mesure maximum par cycle. '+status.used.size+' protection(s) enregistrée(s). Une menace ne prouve pas que quelqu’un a été blessé.</p>'+
  '<div class="igr029-actions">'+protect.map(([id,label])=>{
   const done=status.used.has(id),disabled=done||status.thisCycle;
   return '<button class="btn ghost small" type="button" '+(disabled?'disabled aria-disabled="true" ':'')+
     'onclick="igr029Protect(&quot;'+id+'&quot;)">'+esc(label)+(done?' · enregistrée':'')+'</button>';
  }).join('')+'</div></section>';
}
let protectionPending=false;
window.igr029Protect=async target=>{
 if(protectionPending||!active()||!permitted029Phase()||d()?.room?.status!=='playing'||!protect.some(([id])=>id===target))return;
 protectionPending=true;
 try{await rpc('igr_v118_029_protection',{p_code:d().room.code,p_token:s().token,p_target:target});
 toast('Mesure enregistrée.');await syncNow(true)}
 catch(e){console.warn('[029 protection]',e?.message);toast('Action non disponible ou déjà utilisée.')}
 finally{protectionPending=false}
};
function cartelWire(){
 if(!active()||!['don','bras_droit'].includes(me().public_role)||d()?.room?.status!=='playing')return '';
 // The 10-player configuration contains the Don but no right hand.
 // Never offer a chat composing box without an actual receiving role.
 const partner=me().public_role==='don'?'bras_droit':'don';
 if(!(d()?.players||[]).some(player=>player.public_role===partner))return '';
 const msgs=observed('cartel029_chat').slice(-12);
 return '<section class="igr029-extras"><h3>Liaison avec '+(me().public_role==='don'?'ton bras droit':'le Don')+'</h3>'+
 '<p>Messages de jeu privés au duo. Ce que tu écris ne déclenche aucune violence automatique.</p>'+
 '<div class="igr029-wire">'+(msgs.map(e=>'<p><b>'+esc(e.payload?.author||'')+'</b> '+esc(e.payload?.text||'')+'</p>').join('')||'<p>Aucun message reçu.</p>')+'</div>'+
 '<div class="igr029-compose"><input id="igr029-msg" maxlength="220" placeholder="Ton message (220 caractères)" aria-label="Message privé au cartel">'+
 '<button class="btn ghost" type="button" onclick="igr029Send()">Envoyer</button></div></section>';
}
let messagePending=false;
window.igr029Send=async ()=>{
 if(messagePending||!active()||!['don','bras_droit'].includes(me().public_role)||d()?.room?.status!=='playing')return;
 const text=document.getElementById('igr029-msg')?.value?.trim();if(!text)return;
 messagePending=true;
 try{await rpc('igr_v118_029_cartel_message',{p_code:d().room.code,p_token:s().token,p_text:text});
 toast('Message envoyé.');await syncNow(true)}
 catch(e){console.warn('[029 cartel]',e?.message);toast('Message non envoyé.')}
 finally{messagePending=false}
};
function leadershipHtml(){
 if(!active()||!['don','bras_droit'].includes(me().public_role)||d()?.room?.status!=='playing'||!permitted029Phase())return '';
 const cycle=+d()?.room?.cycle;
 if(cycle<1||cycle>3)return '';
 const found=(d()?.my_actions||[]).some(a=>a.action_type==='cartel029_leadership'&&+a.cycle===cycle);
 if(found)return '<section class="igr029-extras"><h3>Stratégie · cycle '+cycle+'</h3><p>Ta décision privée est enregistrée pour ce cycle.</p></section>';
 const don=me().public_role==='don';
 return '<section class="igr029-extras"><h3>Stratégie · cycle '+cycle+'</h3>'+
 '<p>'+esc(don?'Préserve le secret du réseau ou privilégie une coopération limitée, sans violence automatique.':'Reste loyal au Don ou coopère. Ton choix demeure confidentiel jusqu’à la révélation.')+'</p>'+
 '<div class="igr029-actions">'+(don?
 '<button class="btn ghost" onclick="igr029LeaderDecision(&quot;contain&quot;)">Préserver le secret</button>'+
 '<button class="btn ghost" onclick="igr029LeaderDecision(&quot;cooperate&quot;)">Coopérer</button>':
 '<button class="btn ghost" onclick="igr029LeaderDecision(&quot;loyal&quot;)">Rester loyal</button>'+
 '<button class="btn ghost" onclick="igr029LeaderDecision(&quot;cooperate&quot;)">Coopérer</button>')+
 '</div><p class="igr029-hint">Une décision par cycle. Le dernier choix enregistré détermine ta stratégie finale.</p></section>';
}
let leadershipPending=false;
window.igr029LeaderDecision=async choice=>{
 if(leadershipPending||!active()||!permitted029Phase()||d()?.room?.status!=='playing')return;
 const role=me().public_role;
 if(!((role==='don'&&['contain','cooperate'].includes(choice))||
       (role==='bras_droit'&&['loyal','cooperate'].includes(choice))))return;
 if((d()?.my_actions||[]).some(a=>a.action_type==='cartel029_leadership'&&+a.cycle===+d().room.cycle))return;
 leadershipPending=true;
 try{await rpc('igr_v155_029_leadership_decision',{p_code:d().room.code,p_token:s().token,p_choice:choice});
 toast('Ta stratégie a été enregistrée.');await syncNow(true)}
 catch(e){console.warn('[029 leadership]',e?.message);toast('Stratégie non disponible.')}
 finally{leadershipPending=false}
};
function journalistGuideHtml(){
 if(!active()||me().public_role!=='journaliste'||d()?.room?.status!=='playing')return '';
 return '<section class="igr029-extras"><h3>Ton objectif journalistique</h3>'+
 '<p>Publie au moins 40 caractères avec une source déclarée (document, observation, déclaration, information publique ou enquête). Conclus par un angle final d’au moins 24 caractères.</p>'+
 '<p class="igr029-hint">Une source déclarée n’est pas une preuve vérifiée. Présente tes informations non confirmées comme telles.</p></section>';
}
function choiceHtml(){
 const x=me().private_state||{};
 if(!active()||+x['029_witness_index']!==4||x['029_can_decide']!==true||+d()?.room?.cycle<2||!permitted029Phase()||d()?.room?.status!=='playing')return '';
 const found=(d()?.my_actions||[]).some(a=>a.action_type==='cartel029_position'&&+a.cycle===+d().room.cycle);
 if(found)return '<section class="igr029-extras"><h3>Ton choix personnel</h3><p>Ta décision pour ce cycle est enregistrée.</p></section>';
 return '<section class="igr029-extras"><h3>Ton choix personnel</h3><p>Tu peux rester loyal envers le cartel ou choisir de coopérer. Ce choix reste secret.</p>'+
 '<div class="igr029-actions"><button class="btn ghost" onclick="igr029Position(\'loyal\')">Rester loyal</button>'+
 '<button class="btn ghost" onclick="igr029Position(\'cooperate\')">Coopérer</button></div></section>';
}
let positionPending=false;
window.igr029Position=async c=>{
 if(positionPending||!active()||!permitted029Phase()||d()?.room?.status!=='playing'||+me()?.private_state?.['029_witness_index']!==4||!['loyal','cooperate'].includes(c))return;
 positionPending=true;
 try{await rpc('igr_v119_029_position',{p_code:d().room.code,p_token:s().token,p_choice:c});toast('Décision enregistrée.');await syncNow(true)}
 catch(e){console.warn('[029 choice]',e?.message);toast('Ce choix n’est pas disponible.')}
 finally{positionPending=false}
};
wrap('renderGameTab',(orig)=>{
 const result=orig();
 if(!active())return result;
 if(s()?.tab==='investigation')return String(result||'')+protectHtml()+journalistGuideHtml();
 if(s()?.tab==='card')return String(result||'')+cartelWire()+leadershipHtml()+choiceHtml();
 return result;
});
wrap('phaseLabel',(orig,phase)=>{
 if(!active())return orig(phase);
 if(phase==='final_suspect_defenses')return 'PAROLE FINALE DES TÉMOINS';
 if(phase==='locking')return 'CONCLUSIONS DU DOSSIER 029';
 if(phase==='final_audience')return 'AUDIENCE DU DOSSIER';
 return orig(phase);
});
wrap('renderFinalLockForm',(orig)=>{
 if(!active())return orig();
 if((d()?.my_actions||[]).some(a=>a.action_type==='final_lock'))return '<div class="locked-state">Ta conclusion est enregistrée.</div>';
 const role=me().public_role;
 if(role==='journaliste')return '<div class="final-form"><h3>Ton angle journalistique</h3>'+
 '<p>Défends ton angle à partir de ce que tu as réellement publié. 24 caractères minimum. Les sources déclarées ne sont pas certifiées automatiquement.</p>'+
 '<textarea id="finalText" maxlength="300" minlength="24" rows="4" placeholder="Quelle information peux-tu soutenir et quelles limites reconnais-tu ?"></textarea>'+
 '<button class="btn primary block" onclick="lockFinal()">Remettre ton angle</button></div>';
 if(['enqueteur','analyste','procureur','juge'].includes(role))return '<div class="final-form"><h3>Clôturer ta participation</h3>'+
 '<p>Les quatre témoins ne sont pas notés sur une échelle de culpabilité. Le rapport d’enquête sert de base au dénouement.</p>'+
 '<label for="finalText">Observation de clôture (facultative)</label>'+
 '<textarea id="finalText" maxlength="300" rows="3" placeholder="Que retiens-tu de l’enquête ?"></textarea>'+
 '<button class="btn primary block" onclick="lockFinal()">Confirmer ma conclusion</button></div>';
 return orig();
});
wrap('renderReveal',(orig)=>{
 if(!active()||d()?.room?.status!=='finished')return orig();
 const ev=[...(d()?.events||[])].reverse().find(e=>e.event_type==='reveal');
 const p=ev?.payload||{};
 if(!p['029_branch_resolved'])return orig();
 return '<section class="igr029-ending"><div class="kicker">029 · RÉVÉLATION</div><h2>Le Cycle Mort</h2>'+
 '<p>'+esc(p.summary||'')+'</p><h3>Issue de chaque personnage</h3>'+
 (p.results||[]).map(x=>'<article><b>'+esc(x.pseudo)+' · '+esc(roles[x.public_role]?.label||x.role||'')+'</b>'+
 '<span>'+esc(x.success?'Objectif atteint':'Objectif non atteint')+'</span><p>'+esc(x.text||'')+'</p></article>').join('')+
 '<p>Le rapport est une reconstruction : une accusation ne vaut jamais preuve.</p>'+
 '<button class="btn block" onclick="leaveRoom()">Quitter la cellule</button></section>';
});
const css=document.createElement('style');css.id='igr029-v121-css';css.textContent=`
.igr029-card .igr029-story{line-height:1.55;font-size:.95rem}.igr029-card .igr029-purpose{padding:13px 15px;border-radius:10px;background:rgba(255,255,255,.045)}
.igr029-hint{color:#a9a6a1;font-size:.77rem;line-height:1.5}.igr029-folds{display:grid;gap:8px;margin-top:16px}
.igr029-detail{background:rgba(255,255,255,.034);border:1px solid rgba(255,255,255,.11);border-radius:10px}.igr029-detail summary{cursor:pointer;padding:12px 14px;font-size:.86rem;font-weight:650}.igr029-detail p{margin:0;padding:0 14px 14px;line-height:1.55;font-size:.86rem}.igr029-secret{border-color:rgba(170,75,69,.28)}
.igr029-extras{margin:18px 0;padding:15px;border:1px solid rgba(197,166,141,.2);border-radius:12px;background:rgba(255,255,255,.022)}
.igr029-extras h3{margin:0 0 9px;font-size:1rem}.igr029-extras p{line-height:1.5;font-size:.85rem}
.igr029-actions{display:flex;flex-wrap:wrap;gap:8px}.igr029-wire{max-height:230px;overflow-y:auto;margin:10px 0;border:1px solid rgba(255,255,255,.08);padding:8px 12px;border-radius:8px}
.igr029-compose{display:flex;gap:6px}.igr029-compose input{flex:1;min-width:0;background:#191a1b;color:#f1eee9;border:1px solid #4a4440;border-radius:8px;padding:11px}
.igr029-ending article{padding:13px;border:1px solid rgba(255,255,255,.1);border-radius:10px;margin:8px 0;display:grid;gap:4px}
.igr029-ending article span{color:#c4a084;font-size:.78rem}.igr029-ending p{line-height:1.6}
`;document.head.appendChild(css);
window.IGR_CARTEL_029_V121=Object.freeze({version:'v121',active,upcoming});
})();
