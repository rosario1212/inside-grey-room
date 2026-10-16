import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';

// Exercise the shipped renderers and both image recovery controllers together.
// All image requests are served from the built bundle; no backend is contacted.
export async function runMaitrePosterChecks({page,css,read,check,report,target}){
  const dataSource=await read('heritage-maitre-data-v34.js'),mapSource=await read('heritage-maitre-assets-v34.js');
  const scope={window:{}};
  vm.runInNewContext(dataSource,scope);vm.runInNewContext(mapSource,scope);
  const {META,PACK}=scope.window.IGR_HERITAGE_MAITRE_DATA;
  const source=await read('heritage-maitre-v34.js');
  const extract=(source,start,end)=>{
    const from=source.indexOf(start),to=source.indexOf(end,from);
    assert(from>=0&&to>from,'MAÎTRE renderer must be present: '+start);
    return source.slice(from,to);
  };
  const hubRenderer=extract(source,'function injectHubCard(){','function patchPremiumCopy(');
  const chapterRenderer=extract(source,'function renderChapter(n){','function renderSetup(');
  const chooserRenderers=[
    extract(await read('heritage-maitre-online-v34-4.js'),'function inject(){','function createView('),
    extract(await read('play-modes-v13-8.js'),'function enhanceHeritageChapter(){','function renderHeritageOnlineCreate(')
  ];
  const theme=extract(await read('navigation-theme-v18.js'),'function setModeTheme(','function apply(){');
  const recoveries=[await read('heritage-maitre-polish-v34.js'),await read('heritage-maitre-mobile-v34-5.js')];
  const files=new Map();
  for(const chapter of META.chapters){
    const file=chapter.poster.split('?')[0];
    const bytes=await readFile(path.join(target,file.slice(1)));
    assert(bytes.length<350000,'Each restored poster must remain a lightweight mobile asset');
    files.set(file,bytes);
  }
  assert.equal(META.cover,META.chapters[0].poster,'Hub and dossier must share their artwork');
  let requests=[];
  const imageRoute=async route=>{
    const url=new URL(route.request().url());requests.push(url.pathname);
    const bytes=files.get(url.pathname);
    if(bytes)await route.fulfill({contentType:'image/webp',body:bytes});else await route.abort();
  };
  await page.route('**/assets/heritage-maitre-*.webp*',imageRoute);
  const dossierHtml=n=>{
    let output='';
    vm.runInNewContext(chapterRenderer+`;renderChapter(${n});`,{
      META,PACK,current:()=>n,completed:()=>false,carryForChapter:()=>[],chapterCondition:()=>'',readLive:()=>null,
      esc:value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char])),
      shellPut:html=>{output=html}
    });return output;
  };
  try{
    for(const [name,width,height] of [['small-phone',320,568],['phone',393,852],['desktop',1280,900]]){
      for(const chapter of [0,1,2,3,4,5])await check(`maitre-${chapter?'dossier-'+chapter:'hub'}-${name}`,async()=>{
        requests=[];
        await page.setViewportSize({width,height});
        const content=chapter?dossierHtml(chapter):'<main class="page hplay hplay-hub"><section class="hplay-hub-grid"></section></main>';
        await page.setContent(`<!doctype html><html><head><base href="https://igr-layout.test/"><style>${css}</style></head><body><div id="app">${content}</div></body></html>`);
        await page.addScriptTag({content:dataSource});await page.addScriptTag({content:mapSource});
        if(!chapter)await page.addScriptTag({content:`(()=>{
          const {META,PACK}=window.IGR_HERITAGE_MAITRE_DATA;
          const $=s=>document.querySelector(s),extendEngine=()=>{},progress=()=>0,esc=v=>String(v??'');
          ${hubRenderer}injectHubCard();
        })();`});
        else await page.addScriptTag({content:`(()=>{
          const $=(s,root=document)=>root.querySelector(s),sess=()=>null,hSession=()=>null,esc=v=>String(v??'');
          ${chooserRenderers[name==='small-phone'?0:1]}
          document.querySelector('.hplay-launch').dataset.campaign='maitre';
          ${name==='small-phone'?'inject()':'enhanceHeritageChapter()'};
          ${theme}applyModeChooserTheme();
        })();`});
        const selector=chapter?'.hplay-poster img':'.maitre-hub-card>img';
        await page.locator(selector).evaluate(img=>img.decode());
        await page.evaluate(selector=>{
          window.posterChanges=[];
          new MutationObserver(records=>{for(const r of records)window.posterChanges.push({before:r.oldValue,after:r.target.getAttribute('src')})})
            .observe(document.querySelector(selector),{attributes:true,attributeFilter:['src'],attributeOldValue:true});
        },selector);
        for(const content of recoveries)await page.addScriptTag({content});
        // Trigger the actual microtask and animation-frame observers repeatedly.
        await page.evaluate(async()=>{
          for(let i=0;i<6;i++){
            const node=document.createElement('span');node.hidden=true;document.querySelector('#app').appendChild(node);
            await new Promise(requestAnimationFrame);node.remove();
          }
          await new Promise(requestAnimationFrame);
        });
        assert.deepEqual(await page.evaluate(()=>window.posterChanges),[],'Recovery controllers must never replace the canonical HD image after a render');
        assert(!requests.some(url=>url.includes('-final.webp')),'No thumbnail request may replace the restored poster');
        const expected=META.chapters[Math.max(0,chapter-1)].poster;
        assert.equal(await page.locator(selector).getAttribute('src'),expected);
        const image=await page.locator(selector).evaluate(img=>{
          const r=img.getBoundingClientRect(),s=getComputedStyle(img);
          return {naturalWidth:img.naturalWidth,naturalHeight:img.naturalHeight,width:r.width,height:r.height,left:r.left,right:r.right,filter:s.filter,position:s.objectPosition};
        });
        assert.equal(image.naturalWidth,941,'Decode the restored source rather than a 320px thumbnail');
        assert.equal(image.naturalHeight,1672);
        assert(image.naturalWidth/image.width>=(width<=760?2:1),'Retain Retina quality on phones without upscaling on desktop');
        assert(image.left>=-.5&&image.right<=width+.5,'Keep artwork inside the viewport');
        assert(!image.filter.includes('blur('),'Never blur the poster with CSS');
        if(!chapter)assert.equal(image.position,'50% 0%','Keep the title visible at the top of the campaign card');
        else{
          assert(Math.abs(image.width/image.height-941/1672)<.002,'Preserve the complete dossier poster proportions');
          const contrast=await page.locator('.hplay-launch-box>p').evaluate(p=>{
            const rgb=s=>(s.match(/[\d.]+/g)||[]).map(Number);
            const composite=(fg,bg)=>fg.slice(0,3).map((v,i)=>v*(fg[3]??1)+bg[i]*(1-(fg[3]??1)));
            let bg=[255,255,255];
            for(const el of [p,...function*(el){while(el=el.parentElement)yield el}(p)].reverse())bg=composite(rgb(getComputedStyle(el).backgroundColor),bg);
            const luminance=c=>c.map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0);
            const a=luminance(composite(rgb(getComputedStyle(p).color),bg)),b=luminance(bg);
            return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);
          });
          assert(contrast>=4.5,'Mode instructions need readable contrast on the paper background');
        }
        assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'No horizontal overflow in MAÎTRE');
        if(name==='phone')await page.screenshot({path:path.join(report,`maitre-${chapter?'dossier-'+chapter:'hub'}.png`),fullPage:true});
      });
    }
  }finally{await page.unroute('**/assets/heritage-maitre-*.webp*',imageRoute)}
}
