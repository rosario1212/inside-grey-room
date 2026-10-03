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

  function fixTerrorDecisionOwnership(){
    const room=window.STATE?.sync?.room;
    if(String(room?.scenario_id||'')!=='027'||window.STATE?.view!=='game')return;
    const panel=document.getElementById('terrorRuntimeV33');
    if(!panel)return;
    const runtime=room?.state?.terror_runtime||{};
    if(runtime.decision)return;
    const role=String(window.STATE?.sync?.player?.public_role||window.STATE?.role||'');
    const assessments=runtime.assessments||{};
    const ready=!!assessments.credibility&&!!assessments.sincerity&&String(room?.phase||'')==='locking';

    panel.querySelectorAll('.terror-v33-decision:not(.locked):not([data-v33-liaison-decision])').forEach(el=>el.remove());
    const oldNote=panel.querySelector('[data-v33-liaison-note]');

    if(role==='inspecteur'){
      if(oldNote)oldNote.remove();
      if(ready&&!panel.querySelector('[data-v33-liaison-decision]')){
        const grid=panel.querySelector('.terror-v33-grid');
        const block=document.createElement('div');
        block.className='terror-v33-decision';
        block.dataset.v33LiaisonDecision='1';
        block.innerHTML='<small>OFFICIER DE LIAISON · RECOMMANDATION IRRÉVERSIBLE</small><p>Les évaluations sont verrouillées. Après consultation du groupe, transmets la recommandation extérieure. Elle reste institutionnelle et abstraite.</p><div class="terror-v33-actions"><button class="btn ghost small" type="button" onclick="terrorV33Decision(\'intervenir\')">Intervenir</button><button class="btn primary small" type="button" onclick="terrorV33Decision(\'retarder\')">Retarder</button><button class="btn ghost small" type="button" onclick="terrorV33Decision(\'annuler\')">Annuler</button></div>';
        (grid||panel).insertAdjacentElement('afterend',block);
      }else if(!ready&&!oldNote){
        const note=document.createElement('div');note.className='terror-v33-muted';note.dataset.v33LiaisonNote='1';note.textContent='La recommandation extérieure attend les évaluations indépendantes de l’Enquêteur et de l’Analyste.';panel.appendChild(note);
      }
      return;
    }

    panel.querySelector('[data-v33-liaison-decision]')?.remove();
    if(ready&&!oldNote){
      const note=document.createElement('div');note.className='terror-v33-muted';note.dataset.v33LiaisonNote='1';note.textContent='Les évaluations sont verrouillées. L’Officier de liaison doit maintenant transmettre la recommandation extérieure.';panel.appendChild(note);
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
