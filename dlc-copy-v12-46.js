/* Inside Grey Room — DLC copy pass v12.46
   Uniform, cold, concise collection descriptions. */
(() => {
  'use strict';

  const COPY = Object.freeze({
    omerta: {
      eyebrow: 'DLC CONFIDENTIEL',
      text: '5 dossiers liés. Une Famiglia. Jusqu’au Don.'
    },
    terror: {
      eyebrow: 'DLC DE CRISE',
      text: 'Bloqués dans la Grey Room. Un groupe terroriste s’empare de la ville. Le périmètre se referme.'
    },
    cartel: {
      eyebrow: 'DLC SOUS PRESSION',
      text: 'Le cartel frappe l’enquête, achète la justice et remonte jusqu’à vos proches.'
    },
    regime: {
      eyebrow: 'DLC APRÈS LA CHUTE',
      text: 'Le régime est tombé. Les archives restent. Identifiez ceux qui ont ordonné, couvert et profité.'
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
    section.dataset.copyV1246 = '1';
  }

  function apply(){
    CONFIG.forEach(applyOne);
    document.querySelectorAll('.terror-access-pill').forEach(el => {
      el.hidden = true;
      el.setAttribute('aria-hidden','true');
    });
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
