/* v814 — Protect the Terror city draft during live lobby updates, and
   explain how to move the wide Omerta family tree on a phone. */
(()=>{
  'use strict';
  const drafts=new Map();
  const cityId='terrorV681CityName';
  const cityField=()=>document.getElementById(cityId);
  const roomKey=()=>{
    try{
      const id=String(STATE?.sync?.room?.scenario_id||STATE?.scenarioId||'');
      const code=String(STATE?.sync?.room?.code||STATE?.room||'');
      return ['026','027','028'].includes(id)?code:'';
    }catch(_){return ''}
  };
  const savedCity=()=>{
    try{return String(STATE?.sync?.room?.state?.terror_v681?.city||'')}
    catch(_){return ''}
  };
  function remember(input){
    const key=roomKey();
    if(key&&input)drafts.set(key,String(input.value));
    if(drafts.size>15)drafts.delete(drafts.keys().next().value);
  }
  document.addEventListener('input',event=>{
    if(event.target?.id===cityId)remember(event.target);
  },true);

  const originalRender=window.renderLobby;
  if(typeof originalRender==='function'){
    window.renderLobby=function(...args){
      const previous=cityField(),focused=!!previous&&document.activeElement===previous;
      const start=focused?previous.selectionStart:null;
      const end=focused?previous.selectionEnd:null;
      if(previous)remember(previous);
      const result=originalRender.apply(this,args);
      const current=cityField(),key=roomKey();
      if(current&&key){
        if(savedCity()&&!focused)drafts.delete(key);
        else if(drafts.has(key))current.value=drafts.get(key);
        if(focused){
          try{
            current.focus({preventScroll:true});
            if(start!==null&&end!==null)current.setSelectionRange(start,end);
          }catch(_){}
        }
      }
      return result;
    };
  }

  const originalTree=window.igrOmertaOpenFamilyTree;
  if(typeof originalTree==='function'){
    window.igrOmertaOpenFamilyTree=function(...args){
      const result=originalTree.apply(this,args);
      const modal=document.querySelector('.omerta-tree-modal');
      const scroll=modal?.querySelector('.omerta-org-scroll');
      if(scroll){
        const english=window.IGR_LOCALE==='en';
        scroll.tabIndex=0;
        scroll.setAttribute('aria-label',english?
          'Family tree. Scroll horizontally to see every role.':
          'Arbre de la Famiglia. Glisse horizontalement pour voir tous les rôles.');
        if(!modal.querySelector('.omerta-tree-swipe-hint')){
          const hint=document.createElement('p');
          hint.className='omerta-tree-swipe-hint';
          hint.textContent=english?
            'Swipe sideways to explore the entire hierarchy.':
            'Glisse vers la gauche ou la droite pour explorer toute la hiérarchie.';
          scroll.before(hint);
        }
      }
      return result;
    };
  }
})();


/* v826 — prefetch nearby catalogue covers without eagerly loading the entire
   collection; clear stale notifications only when the screen actually changes. */
(()=>{
  'use strict';
  const root=document.getElementById('app');
  if(!root)return;
  const seen=new WeakSet();
  const warm=typeof IntersectionObserver==='function'?new IntersectionObserver(entries=>{
    for(const entry of entries){
      if(!entry.isIntersecting)continue;
      entry.target.loading='eager';
      warm.unobserve(entry.target);
    }
  },{rootMargin:'600px 0px'}):null;
  let previousScreen='', previousToast='', queued=false;
  function refresh(){
    queued=false;
    const main=root.querySelector('main');
    const screen=main?main.className+'|'+(main.querySelector('h1')?.textContent||''):'';
    const toast=document.getElementById('toast');
    if(previousScreen&&screen&&previousScreen!==screen&&toast?.classList.contains('show')&&toast.textContent===previousToast){
      toast.classList.remove('show');
    }
    previousScreen=screen;
    previousToast=toast?.classList.contains('show')?toast.textContent:'';
    if(warm){
      root.querySelectorAll('.page-create-v10-13 .scenario-thumb img.igr-poster-full').forEach(img=>{
        if(seen.has(img))return;
        seen.add(img);
        warm.observe(img);
      });
    }
    const modal=document.querySelector('.omerta-tree-modal');
    const tree=modal?.querySelector('.omerta-org-scroll');
    if(tree){
      const portrait=matchMedia('(max-width:760px) and (orientation:portrait)').matches;
      const english=window.IGR_LOCALE==='en';
      const label=portrait?(english?'Family hierarchy, in rank order.':'Hiérarchie de la Famiglia, par rang.'):
        (english?'Family tree. Scroll horizontally to see every role.':'Arbre de la Famiglia. Glisse horizontalement pour voir tous les rôles.');
      if(tree.getAttribute('aria-label')!==label)tree.setAttribute('aria-label',label);
      if(portrait)tree.scrollLeft=0;
    }
  }
  function schedule(){if(!queued){queued=true;requestAnimationFrame(refresh)}}
  new MutationObserver(schedule).observe(root,{childList:true,subtree:true});
  new MutationObserver(schedule).observe(document.body,{childList:true});
  const toast=document.getElementById('toast');
  if(toast)new MutationObserver(schedule).observe(toast,{attributes:true,attributeFilter:['class'],childList:true,characterData:true,subtree:true});
  window.addEventListener('resize',schedule,{passive:true});
  schedule();
})();
