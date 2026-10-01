/* Inside Grey Room v14 — native store commerce boundary
   Loaded only by the Capacitor mobile bundle.
   The web/PWA may keep owner/tester invite tools for private playtests.
   Native App Store / Google Play builds must never expose those code-based
   unlock controls as a substitute for StoreKit / Google Play Billing.
*/
(()=>{
  'use strict';

  const VERSION='14.0-store-boundary';
  const PRODUCT_KEYS=Object.freeze(['omerta','terror','cartel','regime','heritage']);
  const LEGACY_SELECTORS=Object.freeze([
    '.igr-dlc-access-action',
    '.igr-dlc-access-modal'
  ]);

  window.IGR_NATIVE_STORE_BUILD=true;

  function adapter(){
    const value=window.IGR_STORE_COMMERCE_ADAPTER;
    return value&&typeof value==='object'?value:null;
  }

  async function invoke(method,...args){
    const a=adapter();
    if(!a||typeof a[method]!=='function')throw new Error('native_store_billing_not_configured');
    return a[method](...args);
  }

  window.IGR_STORE_COMMERCE=Object.freeze({
    version:VERSION,
    productKeys:PRODUCT_KEYS,
    isConfigured:()=>Boolean(adapter()?.configured),
    purchase:key=>{
      key=String(key||'').trim().toLowerCase();
      if(!PRODUCT_KEYS.includes(key))return Promise.reject(new Error('unknown_store_product'));
      return invoke('purchase',key);
    },
    restore:()=>invoke('restore'),
    refresh:()=>invoke('refresh')
  });

  // Defense in depth: the source invite module is excluded by build-mobile.mjs.
  // If a future runtime accidentally recreates the legacy controls, remove them.
  function stripLegacyAccessUi(){
    for(const selector of LEGACY_SELECTORS){
      document.querySelectorAll(selector).forEach(node=>node.remove());
    }
  }

  function blockLegacyUnlockFunctions(){
    for(const name of ['igrDlcOpenAccess','igrDlcCreateInvite','igrDlcRedeemInvite','igrDlcRevokeAccess']){
      try{
        if(typeof window[name]==='function')window[name]=()=>Promise.reject(new Error('legacy_dlc_unlock_disabled_in_store_build'));
      }catch(_){/* no-op */}
    }
  }

  function harden(){stripLegacyAccessUi();blockLegacyUnlockFunctions()}

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',harden,{once:true});
  else harden();

  const observer=new MutationObserver(()=>queueMicrotask(harden));
  observer.observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('pageshow',harden,{passive:true});
})();
