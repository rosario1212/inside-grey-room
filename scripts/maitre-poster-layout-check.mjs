import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';

// Exercise the actual campaign card and dossier renderers with local artwork only.
// No campaign is started and no backend or account is contacted.
export async function runMaitrePosterChecks({page,css,read,check,report,target}){
  const scope={window:{}};
  vm.runInNewContext(await read('heritage-maitre-data-v34.js'),scope);
  vm.runInNewContext(await read('heritage-maitre-assets-v34.js'),scope);
  const {META,PACK}=scope.window.IGR_HERITAGE_MAITRE_DATA;
  const source=await read('heritage-maitre-v34.js');
  const extract=(start,end)=>{
    const from=source.indexOf(start),to=source.indexOf(end,from);
    assert(from>=0&&to>from,'MAÎTRE renderer must be present: '+start);
    return source.slice(from,to);
  };
  const hubRenderer=extract('function injectHubCard(){','function patchPremiumCopy(');
  const chapterRenderer=extract('function renderChapter(n){','function renderSetup(');
  let dossier='';
  vm.runInNewContext(chapterRenderer+';renderChapter(1);',{
    META,PACK,current:()=>1,completed:()=>false,carryForChapter:()=>[],chapterCondition:()=>'',readLive:()=>null,
    esc:value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char])),
    shellPut:html=>{dossier=html}
  });
  const posterPath=META.cover.split('?')[0].replace(/^\//,'');
  const poster=await readFile(path.join(target,posterPath));
  assert(poster.length<350000,'Restored poster must remain a lightweight mobile asset');
  assert.equal(META.cover,META.chapters[0].poster,'Hub and dossier must use the same restored artwork');
  assert(META.cover.includes('-hd-v77.webp'),'MAÎTRE must use the high resolution source');
  const dataUri='data:image/webp;base64,'+poster.toString('base64');
  for(const [name,width,height] of [['small-phone',320,568],['phone',393,852],['desktop',1280,900]]){
    for(const view of ['hub','dossier'])await check('maitre-'+view+'-'+name,async()=>{
      await page.setViewportSize({width,height});
      const content=view==='hub'?'<main class="page hplay hplay-hub"><section class="hplay-hub-grid"></section></main>':dossier.replaceAll(META.cover,dataUri);
      await page.setContent(`<!doctype html><html><head><style>${css}</style></head><body><div id="app">${content}</div></body></html>`);
      if(view==='hub')await page.addScriptTag({content:`(()=>{
        const META=${JSON.stringify({...META,cover:dataUri})},PACK=${JSON.stringify(PACK)};
        const $=s=>document.querySelector(s),extendEngine=()=>{},progress=()=>0,esc=v=>String(v??'');
        ${hubRenderer}injectHubCard();
      })();`});
      // The mobile recovery layer must agree with the canonical map, without
      // repeatedly reverting a sharp source to the old thumbnail after a render.
      const recovery=await read('heritage-maitre-mobile-v34-5.js');
      assert(recovery.includes(META.cover),'Mobile recovery must retain the restored source');
      const selector=view==='hub'?'.maitre-hub-card>img':'.hplay-poster img';
      await page.locator(selector).evaluate(img=>img.decode());
      const image=await page.locator(selector).evaluate(img=>{
        const r=img.getBoundingClientRect(),s=getComputedStyle(img);
        return {naturalWidth:img.naturalWidth,naturalHeight:img.naturalHeight,width:r.width,height:r.height,left:r.left,right:r.right,filter:s.filter};
      });
      assert.equal(image.naturalWidth,941,'The decoded source must be the restored poster, not the 320px thumbnail');
      assert.equal(image.naturalHeight,1672);
      assert(image.naturalWidth/image.width>=(width<=760?2:1),'Use a Retina-quality source on phones and avoid upscaling on desktop');
      assert(image.left>=-.5&&image.right<=width+.5,'The artwork must stay inside the viewport');
      assert(!image.filter.includes('blur('),'The poster must not be blurred by CSS');
      if(view==='dossier')assert(Math.abs(image.width/image.height-941/1672)<.002,'The dossier must preserve the complete poster proportions');
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'MAÎTRE must not overflow horizontally');
      if(name==='phone')await page.screenshot({path:path.join(report,`maitre-${view}.png`),fullPage:true});
    });
  }
}
