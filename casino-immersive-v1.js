/* HÉRITAGE / CASINO — immersive, accessible and presentation-only.
 * Never calculate winnings, change phase durations or infer hidden cards.
 * All displayed values come from the authenticated viewer projection.
 */
(()=>{'use strict';
 const $=(s,r=document)=>r.querySelector(s);
 const $$=(s,r=document)=>[...r.querySelectorAll(s)];
 const make=(tag,klass,label)=>{
   const node=document.createElement(tag);
   if(klass)node.className=klass;
   if(label!==undefined)node.textContent=String(label);
   return node;
 };
 function clock(){
   for(const display of $$('[data-casino-phase-clock]')){
     const seconds=Math.max(0,Math.ceil((Number(display.dataset.casinoPhaseClock)-Date.now())/1000));
     const value=String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0');
     if(display.textContent!==value)display.textContent=value;
     display.dataset.complete=seconds===0?'true':'false';
   }
 }
 function decorate(screen,state,tab){
   if(!screen)return;
   screen.dataset.casinoView=tab||'card';
   if(!state||state.status!=='playing')return;
   const personal=state.camp==='casino'?(state.characters||[]).find(c=>c.id===state.viewer):null;
   const chips=Number.isSafeInteger(personal?.chips)?personal.chips:null;
   const title=$(':scope > h1',screen);
   if(title){
     const hud=make('div','casino-immersive-hud');
     const brand=make('div','casino-house-brand');
     brand.append(make('span','casino-house-seal','I'),make('span','casino-house-name','L’IMPÉRIAL · MACAO'));
     brand.append(make('small','casino-house-chapter','DOSSIER '+state.chapter+'/3 · PHASE '+state.phase));
     hud.append(brand);
     if(state.camp==='casino'){
       const wallet=make('div','casino-wallet');
       wallet.setAttribute('aria-label',chips===null?'Jetons en cours de synchronisation':chips+' jetons virtuels disponibles');
       wallet.append(make('span','casino-chip-symbol','◆'));
       const amount=make('span','casino-wallet-reading');
       amount.append(make('small','','MON SOLDE'),make('strong','casino-wallet-total',chips===null?'—':chips.toLocaleString('fr-CH')),make('small','','JETONS VIRTUELS'));
       wallet.append(amount);hud.append(wallet);
     }else hud.append(make('span','casino-bureau-badge','BUREAU D’ENQUÊTE'));
     const caption=title.nextElementSibling;
     (caption?.tagName==='P'?caption:title).insertAdjacentElement('afterend',hud);
   }
   const phase=$('.casino-phase-positions',screen);
   if(phase){
     phase.classList.add('casino-phase-ceremony');
     const intro=$(':scope > div',phase);
     if(intro){
       if(!state.phaseReadiness){
         const text=$('p',intro);
         if(text)text.textContent='Positions des participants en cours de synchronisation…';
         for(const button of $$('.casino-phase-choice button',phase))button.disabled=true;
       }
       const timer=make('div','casino-phase-time');
       const label=make('span','casino-phase-clock-label','TEMPS MINIMAL D’ÉCHANGES');
       const remaining=make('strong','casino-phase-clock','00:00');
       remaining.dataset.casinoPhaseClock=String(Number(state.minimumSocialUntil)||Date.now());
       remaining.setAttribute('aria-label','Compte à rebours de la durée minimale');
       timer.append(label,remaining,make('small','casino-phase-note',
         state.chapter===1
           ?'Le poker d’ouverture et la durée minimale sont obligatoires. Les décisions restent validées par le serveur.'
           :'Les réponses des participants restent prises en compte. La procédure de continuité évite les blocages définitifs.'));
       intro.append(timer);
     }
   }
   if(tab==='table'){
     const sections=$$('.casino-content > .casino-box',screen);
     const poker=sections.find(s=>$('h2',s)?.textContent.includes('Poker fermé'));
     const hand=state.poker;
     if(poker&&hand){
       poker.classList.add('casino-salon-poker');
       const title=$('h2',poker);
       title?.insertAdjacentElement('afterend',make('div','casino-salon-plaque','✦ TABLE PRIVÉE · POKER FERMÉ ✦'));
       const vitals=make('div','casino-table-vitals');
       for(const [name,value] of [['POT COMMUN',hand.pot],['MISE D’ENTRÉE',hand.ante],['MISE EN COURS',hand.highestBet]]){
         const metric=make('div','casino-table-metric');
         metric.append(make('small','',name),make('strong','',value+' J'));
         vitals.append(metric);
       }
       const plaque=$('.casino-salon-plaque',poker);
       plaque?.insertAdjacentElement('afterend',vitals);
       const cards=$('.casino-cards',poker);
       if(cards){
         cards.classList.add('casino-felt');
         cards.insertAdjacentElement('beforebegin',make('div','casino-dealer-label','L’IMPÉRIAL · SALON RÉSERVÉ'));
         for(const card of $$('.casino-playing-card',cards))card.classList.toggle('casino-card-red',/[♥♦]/.test(card.textContent||''));
         if(state.camp==='casino'){
           const playerTurn=hand.turn===state.viewer,done=hand.stage==='settled';
           const currentName=state.characters?.find(c=>c.id===hand.turn)?.name||
             state.participants?.find(c=>c.id===hand.turn)?.name||'un autre joueur';
           const text=done?'MAIN TERMINÉE · RÉSULTATS DISPONIBLES':
             playerTurn?'C’EST TON TOUR · '+(hand.stage==='draw'?'ÉCHANGE TES CARTES':'DÉCIDE DE TA MISE'):
             'TOUR DE '+currentName+' · ATTENDS SA DÉCISION';
           cards.insertAdjacentElement('afterend',make('div','casino-turn-plaque',text));
           if(chips!==null)cards.nextElementSibling?.insertAdjacentElement('afterend',
             make('p','casino-table-balance','Solde actuel : '+chips+' jetons · La table contrôle chaque mise.'));
         }
       }
     }
     const slot=sections.find(s=>$('h2',s)?.textContent.includes('Machine à sous'));
     if(slot){
       slot.classList.add('casino-salon-slot');
       const cabinet=make('div','casino-slot-cabinet');
       cabinet.append(make('div','casino-slot-title','TROIS DRAGONS · SALLE PRIVÉE'));
       const reels=make('div','casino-slot-reels');
       for(const symbol of state.ownSlotResult?.reels||['◆','◆','◆'])reels.append(make('span','casino-slot-reel',symbol));
       cabinet.append(reels);
       const result=state.ownSlotResult,diff=result?result.payout-result.wager:null;
       cabinet.append(make('div','casino-slot-result',diff===null?'PREMIER TIRAGE EN ATTENTE':
         diff>0?'GAIN NET +'+diff+' J':diff<0?'PERTE '+Math.abs(diff)+' J':'MISE RENDUE'));
       slot.querySelector('p')?.insertAdjacentElement('afterend',cabinet);
       const wager=$('input[name="wager"]',slot);
       if(wager){
         wager.setAttribute('inputmode','numeric');
         wager.setAttribute('aria-label','Mise virtuelle de 1 à 20 jetons');
         if(chips!==null)wager.closest('label')?.append(make('small','casino-slot-note','Disponible : '+chips+' jetons · maximum 20'));
       }
     }
   }
   if(tab==='registry'){
     const names={alliance:'Alliance de pouvoir',non_aggression:'Pacte de non-agression',
       debt:'Reconnaissance de dette',territory:'Accord territorial',
       influence:'Pacte d’influence',succession:'Accord de succession',custom:'Autre engagement'};
     for(const item of $$('[data-casino-form="agreement"] select[name="kind"] option',screen)){
       if(Object.hasOwn(names,item.value))item.textContent=names[item.value];
     }
   }
   clock();
 }
 window.IGR_CASINO_IMMERSIVE=Object.freeze({version:'1.0',decorate,clock});
})();