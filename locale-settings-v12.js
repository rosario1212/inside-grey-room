/* Inside Grey Room v12.21 — unified in-app locale selector. */
(()=>{
  const KEY='igr_locale';
  const locale=()=>window.IGR_LOCALE==='en'?'en':'fr';
  window.igrSetLocale=(next)=>{
    const value=next==='en'?'en':'fr';
    try{localStorage.setItem(KEY,value)}catch(_){}
    window.IGR_LOCALE=value;
    document.documentElement.lang=value;
    // Re-enter the same application shell: no separate English edition/page.
    location.replace('./');
  };

  function languageSetting(){
    const en=locale()==='en';
    return `<div class="setting locale-setting" style="align-items:flex-start;gap:14px">
      <div><h4>${en?'Language':'Langue'}</h4><p>${en?'Change the language of the whole game.':'Change la langue de toute l’application.'}</p></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end">
        <button type="button" class="btn small ${!en?'primary':'ghost'}" aria-pressed="${!en}" onclick="igrSetLocale('fr')">Français</button>
        <button type="button" class="btn small ${en?'primary':'ghost'}" aria-pressed="${en}" onclick="igrSetLocale('en')">English</button>
      </div>
    </div>`;
  }

  function inject(){
    const modal=document.querySelector('.modal-box');
    if(!modal||modal.querySelector('.locale-setting'))return;
    const grid=modal.querySelector('.settings-grid');
    if(grid)grid.insertAdjacentHTML('afterbegin',languageSetting());
    else modal.querySelector('.modal-actions')?.insertAdjacentHTML('beforebegin',`<div class="settings-grid">${languageSetting()}</div>`);
  }

  try{
    const base=openSettings;
    openSettings=function(){const result=base.apply(this,arguments);queueMicrotask(inject);return result};
  }catch(_){}

  // Remove the legacy one-button language control from the old English layer.
  const clean=()=>document.querySelectorAll('.modal-box > .security-settings-actions.locale-setting').forEach(el=>el.remove());
  new MutationObserver(()=>{clean();inject()}).observe(document.documentElement,{childList:true,subtree:true});
})();
