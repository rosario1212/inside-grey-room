/* Inside Grey Room — OMERTÀ v12.31 hotfix */
(()=>{
  'use strict';
  const IDS=['021','022','023','024','025'];
  const OMERTA=new Set(IDS);
  const ART={
    '021':'assets/omerta-021-l-enveloppe-hd.svg?v=12.31',
    '022':'assets/omerta-022-omerta-hd.svg?v=12.31',
    '023':'assets/omerta-023-la-table-hd.svg?v=12.31',
    '024':'assets/omerta-024-il-pentito-hd.svg?v=12.31',
    '025':'assets/omerta-025-il-don-hd.svg?v=12.31'
  };
  const tr=(fr,en)=>window.IGR_LOCALE==='en'?en:fr;
  const currentId=()=>String(window.STATE?.sync?.room?.scenario_id||window.STATE?.scenarioId||window.STATE?.selectedScenario||'');
  const isOmerta=id=>OMERTA.has(String(id||''));
  const campaign=()=>window.STATE?.sync?.room?.state?.omerta_campaign||null;

  /* 021–025 always use vector artwork, so cards stay sharp at any DPR/zoom. */
  const oldThumb=window.scenarioThumbArt;
  const oldArt=window.scenarioArt;
  if(typeof oldThumb==='function')window.scenarioThumbArt=id=>isOmerta(id)?ART[String(id)]:oldThumb(id);
  if(typeof oldArt==='function')window.scenarioArt=id=>isOmerta(id)?ART[String(id)]:oldArt(id);

  function repairArtwork(root=document){
    root.querySelectorAll?.('img').forEach(img=>{
      const src=String(img.getAttribute('src')||'');
      for(const id of IDS){
        if(img.closest?.(`#scenario-${id}`)||src.includes(`omerta-0${Number(id)-20}`)||src.includes(`omerta-${id}`)){
          if(img.getAttribute('src')!==ART[id])img.setAttribute('src',ART[id]);
          img.removeAttribute('srcset');
          img.decoding='async';
          img.style.imageRendering='auto';
          break;
        }
      }
    });
  }

  /* In OMERTÀ the fictional character is projected onto the real player:
     the player's pseudo becomes the visible in-world identity, while the
     character remains the narrative anchor for history and consequences. */
  function pairs(){
    const tree=Array.isArray(campaign()?.family_tree)?campaign().family_tree:[];
    return tree.filter(x=>x?.name&&x?.player).map(x=>({name:String(x.name),player:String(x.player)}));
  }
  function replaceCharacterNames(root){
    if(!root||!isOmerta(currentId()))return;
    const map=pairs();if(!map.length)return;
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
    for(const node of nodes){
      if(node.parentElement?.closest('script,style,textarea,input,select,option'))continue;
      let text=node.nodeValue||'';
      for(const p of map){
        text=text.split(p.name).join(p.player);
        const first=p.name.split(/\s+/)[0];
        if(first&&first.length>3)text=text.replace(new RegExp(`\\b${first.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}\\b`,'g'),p.player);
      }
      node.nodeValue=text;
    }
  }

  /* Keep v12.29's live-room-aware cryptographic draw. It refreshes the room,
     excludes full roles and retries reservation conflicts, with no failed RPC first. */
  const liveRandom=window.chooseRandomLobbyRole;
  if(typeof liveRandom==='function')window.chooseRandomLobbyRole=function(){return liveRandom.apply(this,arguments)};

  function styleRandomRole(){
    const btn=document.querySelector('.role-choice-zone .igr-random-role-cta');if(!btn)return;
    const mafia=isOmerta(currentId());
    btn.classList.toggle('is-omerta',mafia);
    btn.classList.toggle('is-base',!mafia);
    const zone=btn.closest('.role-choice-zone');
    zone?.classList.toggle('is-omerta-scenario',mafia);
    zone?.classList.toggle('is-base-scenario',!mafia);
  }

  /* Enhance the existing Famiglia modal instead of duplicating campaign logic. */
  const oldTree=window.igrOmertaOpenFamilyTree;
  if(typeof oldTree==='function')window.igrOmertaOpenFamilyTree=function(){
    const out=oldTree.apply(this,arguments);
    requestAnimationFrame(()=>{
      const modal=document.querySelector('.omerta-tree-modal');if(!modal)return;
      modal.classList.add('omerta-tree-responsive','omerta-tree-v1230');
      const subtitle=modal.querySelector('.omerta-tree-head p');
      if(subtitle)subtitle.textContent=tr(
        'Le personnage ne remplace pas le joueur : son histoire, sa place et ses conséquences deviennent celles du joueur.',
        'The character does not replace the player: their story, position and consequences become the player’s.'
      );
      replaceCharacterNames(modal);
      const scroll=modal.querySelector('.omerta-org-scroll');
      if(scroll){
        scroll.style.overflowX='auto';
        scroll.style.webkitOverflowScrolling='touch';
        requestAnimationFrame(()=>{scroll.scrollLeft=Math.max(0,(scroll.scrollWidth-scroll.clientWidth)/2)});
      }
    });
    return out;
  };

  function refresh(){repairArtwork(document);styleRandomRole();replaceCharacterNames(document.getElementById('app'))}
  const observer=new MutationObserver(()=>queueMicrotask(refresh));
  observer.observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener('DOMContentLoaded',refresh,{once:true});
  window.addEventListener('pageshow',refresh,{passive:true});
  setTimeout(refresh,0);setTimeout(refresh,250);
})();
