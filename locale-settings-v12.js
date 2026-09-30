/* Inside Grey Room v12.22 — locale persistence only. */
(()=>{
  const KEY='igr_locale';
  window.igrSetLocale=(next)=>{
    const value=next==='en'?'en':'fr';
    try{localStorage.setItem(KEY,value)}catch(_){}
    try{STORAGE?.setItem?.(KEY,value)}catch(_){}
    window.IGR_LOCALE=value;
    document.documentElement.lang=value;
    document.documentElement.dataset.locale=value;
    // Reload the same application shell. The menu remains the launch destination.
    location.reload();
  };
})();
