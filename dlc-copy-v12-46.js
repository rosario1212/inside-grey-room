/* Inside Grey Room — DLC copy pass v12.47
   Uniform, cold, concise collection descriptions. */
(() => {
  'use strict';

  const COPY = Object.freeze({
    omerta: {
      eyebrow: 'DLC CONFIDENTIEL',
      text: 'La Famiglia protège ses secrets. L’enquête remonte la chaîne du silence jusqu’au Don.'
    },
    terror: {
      eyebrow: 'DLC DE CRISE',
      text: 'Le FDR a renversé les autorités dans presque tout le pays. Exécutions, enlèvements, prisons clandestines, familles déplacées : la capitale résiste, et la Grey Room cherche qui a ordonné, exécuté ou couvert ces crimes.'
    },
    cartel: {
      eyebrow: 'DLC SOUS PRESSION',
      text: 'Le cartel frappe l’enquête, achète la justice et remonte jusqu’à vos proches.'
    },
    regime: {
      eyebrow: 'DLC APRÈS LA CHUTE',
      text: 'Dix-neuf ans de dictature, une guerre d’agression et des milliers de prisonniers. Deux dirigeants en fuite, des alliances fragiles et un pays qui suit les arrestations. Les capturer ne suffit pas : il faut établir qui a ordonné les crimes, et la majorité collective du camp d’enquête détermine le verdict de responsabilité. Un fugitif capturé perd son objectif de survie.'
    }
  });

  const CONFIG = [
    { key:'omerta', section:'.omerta-dlc-section', head:'.omerta-head', eyebrow:'.omerta-eyebrow' },
    { key:'terror', section:'.terror-dlc-section', head:'.terror-head', eyebrow:'.terror-eyebrow' },
    { key:'cartel', section:'.cartel-dlc-section', head:'.dlc-suite-head', eyebrow:'.dlc-suite-eyebrow' },
    { key:'regime', section:'.regime-dlc-section', head:'.dlc-suite-head', eyebrow:'.dlc-suite-eyebrow' }
  ];

  function applyOne(cfg){
    const section = document.querySelector(cfg.section);
    if(!section) return;
    const copy = COPY[cfg.key];
    const head = section.querySelector(cfg.head) || section;
    const eyebrow = head.querySelector(cfg.eyebrow);
    const paragraph = head.querySelector('p');
    if(eyebrow && eyebrow.textContent !== copy.eyebrow) eyebrow.textContent = copy.eyebrow;
    if(paragraph && paragraph.textContent !== copy.text) paragraph.textContent = copy.text;
    section.dataset.copyV1247 = '1';
  }

  function fixTerrorDecisionOwnership(){
    const room=window.STATE?.sync?.room;
    if(String(room?.scenario_id||'')!=='027'||window.STATE?.view!=='game')return;
    const panel=document.getElementById('terrorRuntimeV33');
    if(!panel)return;
    // Historical Inspector-as-liaison UI must never compete with live Officer orders.
    for(const item of panel.querySelectorAll(
       '[data-v33-liaison-decision],[data-v33-liaison-note],.terror-v33-decision:not(.locked)')){
      item.remove();
    }
  }

  function apply(){
    CONFIG.forEach(applyOne);
    document.querySelectorAll('.terror-access-pill').forEach(el => {
      el.hidden = true;
      el.setAttribute('aria-hidden','true');
    });
    fixTerrorDecisionOwnership();
  }

  let queued = false;
  const schedule = () => {
    if(queued) return;
    queued = true;
    queueMicrotask(() => { queued = false; apply(); });
  };

  new MutationObserver(schedule).observe(document.documentElement, {childList:true,subtree:true});
  document.addEventListener('DOMContentLoaded', apply, {once:true});
  window.addEventListener('pageshow', apply, {passive:true});
  setTimeout(apply,0);
  setTimeout(apply,250);
})();
