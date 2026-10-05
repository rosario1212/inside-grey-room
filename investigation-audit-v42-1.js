/* Inside Grey Room v42.1 — audit hardening overlay.
   Loaded after investigation-runtime-v42.js.
   - Cycle-1 interrogation labels read the authoritative duration exposed by the server.
   - English context cards are complete for DLC scenarios 021–034.
*/
(()=>{
'use strict';
const VERSION='v42.1-investigation-audit';
const CORE=new Set(Array.from({length:34},(_,i)=>String(i+1).padStart(3,'0')));
const EN_DLC=new Set(Array.from({length:14},(_,i)=>String(i+21).padStart(3,'0')));
const S=()=>{try{return typeof STATE!=='undefined'?STATE:(window.STATE||null)}catch(_){return window.STATE||null}};
const sync=()=>S()?.sync||null;
const room=()=>sync()?.room||null;
const scenarioId=()=>String(room()?.scenario_id||S()?.scenarioId||'');
const core=()=>CORE.has(scenarioId());
const english=()=>window.IGR_LOCALE==='en';

const CONTEXT_SITUATIONS_EN=Object.freeze({
'021':'An envelope containing racket proceeds disappears before reaching Enzo Rinaldi. Some facts are already proven. The question is who will talk to save years in prison — and who will find out.',
'022':'An internal murder fractures the Verri Famiglia. Everyone holds part of the truth. Everyone has a reason to stay silent. One sentence can bring a man down — or expose the person who said it.',
'023':'A meeting is meant to prevent a war. One seat remains empty. Power, territory and succession are negotiated in low voices. Then a call comes in: Adriano Verri has been hit.',
'024':'An arrested member faces decades in prison. He can reduce his sentence, give up names and ask for protection. The more he talks, the more justice helps him. The more he talks, the closer the Famiglia gets.',
'025':'Four cases have left deaths, debts and betrayals. Vittorio Verri finally agrees to talk. The question is no longer who the Don is. It is what he actually ordered — and what his men did in his name.',
'026':'The city is falling. Three alleged members of a terrorist organisation have been captured as entire sectors slip from state control. The investigation first concerns atrocities already committed; then one fact becomes clear: an active terrorist cell is still operating and closing in on the Grey Room perimeter.',
'027':'After several massacres, the organisation controls part of the city. A military authority is considering a strike on an area that may contain the command core, but civilians and hostages may still be present. Three suspects give incompatible accounts. The Investigator must establish responsibility; after the verdict, the Liaison Officer carries the final external decision.',
'028':'The last perimeter still holds, but much of the city is outside government control and communications are becoming intermittent. An inside cell is suspected within the protected zone. Three prisoners are questioned. Two realise their own organisation now considers them expendable; the third seems to be waiting for something.',
'029':'An investigation into several executions linked to a fictional cartel begins to trigger retaliation against those conducting it. The emergency must never change the fixed truth of the case.',
'030':'The cartel has infiltrated part of the judicial system. The investigation must distinguish bought decisions, fear, opportunism and decisions that remain legally defensible.',
'031':'The network turns a legal procedure into a personal debt after someone close disappears. The suspects do not share the same degree of loyalty or responsibility.',
'032':'After the fall of a fictional regime, archives document arbitrary arrests, disappearances and partial orders. Each suspect can accuse another, but the documents remain the reference.',
'033':'An oligarchic family held key posts in a fallen government. Blood ties are not enough: the investigation must reconstruct where power actually lay.',
'034':'The final regime files use nicknames for actors whose influence changes from one operation to another. Official functions and internal names do not match.'
});

const CONTEXT_HINTS_EN=Object.freeze({
'021':'The envelope disappears before it reaches Enzo Rinaldi. Separate established facts from self-interested statements, and track who actually holds information valuable enough to bargain with justice.',
'022':'An internal murder fractures the Famiglia. Map what each person knows, what they witnessed directly and what they only heard from another member; an accusation is not evidence.',
'023':'A meeting was meant to prevent a war and one seat remains empty. Reconstruct the positions taken before the call announcing that Adriano Verri was hit, then separate succession, territory and violence.',
'024':'An arrested member can talk, bargain for a reduced sentence and request protection. Track separately what is given to justice, how the Famiglia reacts and what each side commits to.',
'025':'Four earlier cases converge. Separate orders truly attributable to Vittorio Verri from acts committed on his men’s own initiative and from accounts rebuilt after the fact.',
'026':'The city is partly out of control and three alleged members of the organisation are detained. The case concerns past atrocities while an active cell closes in: do not confuse the present emergency with responsibility for the established facts.',
'027':'First establish responsibility for the massacres. The later military decision about a possible strike must separately account for the possible presence of civilians and hostages.',
'028':'The protected perimeter still holds, communications are becoming intermittent and an inside cell is suspected. Compare the three prisoners’ accounts with perimeter events without assuming they all have the same information.',
'029':'Retaliation against the investigation creates pressure but never changes the truth of the case. Separate executions already carried out from threats or actions meant to derail the investigation.',
'030':'Judicial infiltration can take several forms: corruption, fear, opportunism or a legally defensible decision. Link each decision to its interest, context and available evidence.',
'031':'The disappearance of someone close turns procedure into a personal debt. Separate acts committed for the network, acts committed out of loyalty and acts driven by revenge or individual coercion.',
'032':'The archives are the shared reference: arrests, disappearances and partial orders. Cross-accusations must be checked against documents, dates and the chain of transmission.',
'033':'Family ties do not prove power. Reconstruct who held each position, who could actually decide and how orders moved through the oligarchic family.',
'034':'The files use nicknames whose meaning changes from one operation to another. Cross-check aliases, official roles, periods and decisions before attributing an act to a specific person.'
});

function interrogationSeconds(){
  const st=room()?.state||{};
  const direct=Number(st.interrogation_seconds);
  if(Number.isFinite(direct)&&direct>0)return direct;
  const opts=Array.isArray(st.event_options)?st.event_options:[];
  const option=opts.find(x=>String(x?.key||'')==='interrogation');
  const fromOption=Number(option?.seconds);
  if(Number.isFinite(fromOption)&&fromOption>0)return fromOption;
  if(room()?.phase==='interrogation'&&room()?.phase_started_at&&room()?.phase_ends_at){
    const start=new Date(room().phase_started_at).getTime();
    const end=new Date(room().phase_ends_at).getTime();
    const fromPhase=Math.round((end-start)/1000);
    if(Number.isFinite(fromPhase)&&fromPhase>0)return fromPhase;
  }
  return 360;
}
function durationLabel(seconds=interrogationSeconds()){
  const total=Math.max(1,Math.round(Number(seconds)||0));
  const minutes=Math.floor(total/60),secs=total%60;
  if(secs===0)return `${minutes} min`;
  if(minutes===0)return `${secs} s`;
  return `${minutes} min ${String(secs).padStart(2,'0')} s`;
}

const baseInterrogationSelect=typeof renderInterrogationSelect==='function'?renderInterrogationSelect:null;
if(baseInterrogationSelect){
  const v421InterrogationSelect=function(){
    let html=String(baseInterrogationSelect.apply(this,arguments)??'');
    if(!core())return html;
    const label=durationLabel();
    html=html.replace(/·\s*\d+\s*(?:min(?:ute)?s?)(?=\s*<)/gi,`· ${label}`);
    return html;
  };
  try{renderInterrogationSelect=v421InterrogationSelect}catch(_){}
  window.renderInterrogationSelect=v421InterrogationSelect;
}

function patchEnglishContext(html){
  if(!english()||!EN_DLC.has(scenarioId()))return html;
  try{
    const t=document.createElement('template');
    t.innerHTML=String(html??'');
    const cards=[...t.content.querySelectorAll('.v42-context-card')];
    if(cards.length<2)return html;
    const situation=cards[0].querySelector('p');
    const known=cards[1].querySelector('p');
    if(situation)situation.textContent=CONTEXT_SITUATIONS_EN[scenarioId()]||situation.textContent;
    if(known)known.textContent=CONTEXT_HINTS_EN[scenarioId()]||known.textContent;
    return t.innerHTML;
  }catch(_){return html}
}

const baseRenderGameTab=typeof renderGameTab==='function'?renderGameTab:null;
if(baseRenderGameTab){
  const v421RenderGameTab=function(){
    const html=baseRenderGameTab.apply(this,arguments);
    if(S()?.tab==='timeline')return patchEnglishContext(html);
    return html;
  };
  try{renderGameTab=v421RenderGameTab}catch(_){}
  window.renderGameTab=v421RenderGameTab;
}

window.IGR_INVESTIGATION_AUDIT_V42_1=Object.freeze({
  version:VERSION,
  interrogationSeconds,
  durationLabel,
  contextSituationsEn:CONTEXT_SITUATIONS_EN,
  contextHintsEn:CONTEXT_HINTS_EN
});
console.info(`[IGR ${VERSION}] active`);
})();