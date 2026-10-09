/* Inside Grey Room v69 — native store commerce boundary
   Native App Store / Google Play builds use store billing for digital content.
   The permanent entitlement belongs to the HOST. Guests joining that host's
   room do not need to own the DLC themselves.
*/
(()=>{
  'use strict';

  const VERSION='69.0-host-pays-store-boundary';
  const catalog=()=>window.IGR_STORE_CATALOG||null;
  const fallbackKeys=['omerta','terror','cartel','regime','heritage'];
  const productKeys=()=>catalog()?.keys||fallbackKeys;

  const LEGACY_SELECTORS=Object.freeze([
    '.igr-dlc-access-action',
    '.igr-dlc-access-modal',
    '.omerta-access-modal',
    '.heritage-access-code-modal',
    '[data-action="heritage-code"]',
    '#omertaUnlockCode',
    '#omertaInviteDays',
    '#omertaInviteResult'
  ]);

  window.IGR_NATIVE_STORE_BUILD=true;

  function adapter(){
    const value=window.IGR_STORE_COMMERCE_ADAPTER;
    return value&&typeof value==='object'?value:null;
  }

  function product(key){return catalog()?.product?.(key)||null}

  function displayPrice(key){
    key=String(key||'').trim().toLowerCase();
    const a=adapter();
    const live=a?.products?.[key]||a?.productInfo?.[key]||null;
    return live?.displayPrice||live?.formattedPrice||live?.priceString||product(key)?.fallbackPrice||'';
  }

  async function invoke(method,...args){
    const a=adapter();
    if(!a||typeof a[method]!=='function')throw new Error('native_store_billing_not_configured');
    return a[method](...args);
  }

  async function purchase(key){
    key=String(key||'').trim().toLowerCase();
    if(!productKeys().includes(key))throw new Error('unknown_store_product');
    const result=await invoke('purchase',key,product(key));
    window.dispatchEvent(new CustomEvent('igr:store-entitlement-changed',{detail:{key,action:'purchase'}}));
    return result;
  }

  async function restore(){
    const result=await invoke('restore');
    window.dispatchEvent(new CustomEvent('igr:store-entitlement-changed',{detail:{action:'restore'}}));
    return result;
  }

  async function refresh(){
    const result=await invoke('refresh');
    window.dispatchEvent(new CustomEvent('igr:store-entitlement-changed',{detail:{action:'refresh'}}));
    return result;
  }

  window.IGR_STORE_COMMERCE=Object.freeze({
    version:VERSION,
    model:'host_pays_guests_free',
    productKeys:Object.freeze([...productKeys()]),
    catalog:catalog(),
    product,
    displayPrice,
    isConfigured:()=>Boolean(adapter()?.configured),
    purchase,
    restore,
    refresh
  });

  function stripLegacyAccessUi(){
    for(const selector of LEGACY_SELECTORS){
      document.querySelectorAll(selector).forEach(node=>node.remove());
    }
  }

  function blockLegacyUnlockFunctions(){
    const blocked=[
      'igrDlcOpenAccess','igrDlcCreateInvite','igrDlcRedeemInvite','igrDlcRevokeAccess',
      'igrOmertaRedeem','igrOmertaCreateInvite','igrOmertaRevoke'
    ];
    for(const name of blocked){
      try{
        if(typeof window[name]==='function')window[name]=()=>Promise.reject(new Error('legacy_unlock_disabled_in_store_build'));
      }catch(_){/* no-op */}
    }
  }

  function harden(){stripLegacyAccessUi();blockLegacyUnlockFunctions()}

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',harden,{once:true});
  else harden();

  const observer=new MutationObserver(()=>queueMicrotask(harden));
  observer.observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('pageshow',harden,{passive:true});
  window.dispatchEvent(new CustomEvent('igr:native-store-ready'));
})();
