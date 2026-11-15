// v702: conservative, order-preserving classic-script and stylesheet packaging.
// Runs only after the historical game/release checks; leaves original files intact.
// No eval, no module conversion, no private narrative assets, no runtime loader.
import {createHash} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
import {brotliCompressSync,constants as zlibConstants} from 'node:zlib';
import {Script} from 'node:vm';
import path from 'node:path';

const out=path.resolve(process.argv[2]||'dist');
const revision='v702';
const reports=[];
const bundles=new Map();
const hash=s=>createHash('sha256').update(s).digest('hex').slice(0,16);
const brotli=s=>brotliCompressSync(Buffer.from(s),{params:{[zlibConstants.BROTLI_PARAM_QUALITY]:5}}).length;
const scriptTag=/<script\s+src="([^"]+\.js(?:\?[^"]*)?)"\s*><\/script>/gi;
const styleTag=/<link\s+rel="stylesheet"\s+href="([^"]+\.css(?:\?[^"]*)?)"\s*\/?>/gi;
const localName=(url,extension)=>{
 const file=url.split(/[?#]/,1)[0].replace(/^\.\//,'');
 return new RegExp('^[A-Za-z0-9._-]+\\.'+extension+'$').test(file)&&!file.startsWith('igr-v702-')?file:null;
};
function isolatedIife(source){
 // These are classic, immediately invoked closures. Bundling must never hoist
 // a global declaration across scripts, alter ESM evaluation or move a loader.
 const clean=source.replace(/^\uFEFF/,'').replace(/^\s*(?:(?:\/\*[\s\S]*?\*\/|\/\/[^\n]*(?:\r?\n|$))\s*)*/,'').trim();
 return /^\(\s*(?:\(\s*\)\s*=>|function\s*\()/.test(clean)
  && /\)\s*\(\s*\)\s*;\s*$/.test(clean)
  && !/\bdocument\.currentScript\b|sourceMappingURL|sourceURL\b/.test(source);
}
function safeCss(source){
 // @import and @namespace must retain standalone CSS parsing contexts.
 return !/@(?:import|namespace|charset)\b/i.test(source);
}
async function optimize(html,kind){
 const regex=kind==='js'?scriptTag:styleTag;
 regex.lastIndex=0;
 const tags=[...html.matchAll(regex)].map(m=>({start:m.index,end:m.index+m[0].length,url:m[1]}));
 const maxBytes=kind==='js'?100*1024:128*1024;
 const changes=[];
 let group=[],size=0;
 async function flush(){
  if(group.length>=2){
   const payload=group.map(item=>kind==='js'
    ? '/* IGR v702 '+item.file+' */\n;'+item.content.trim()+'\n'
    : '/* IGR v702 '+item.file+' */\n'+item.content.trim()+'\n').join('\n');
   const file='igr-v702-'+kind+'-'+hash(payload)+'.'+kind;
   if(kind==='js')new Script(payload,{filename:file});
   await writeFile(path.join(out,file),payload,'utf8');
   // Legacy scenario QA inspects asset version markers in the HTML. Preserve
   // a non-loading provenance comment; v702-runtime-check verifies every
   // listed file is actually concatenated byte-for-byte into this chunk.
   const provenance='<!-- IGR v702 packaged: '+group.map(item=>item.url).join(' ')+' -->\n';
   const tag=provenance+(kind==='js'?'<script src="'+file+'"></script>':'<link rel="stylesheet" href="'+file+'">');
   changes.push({start:group[0].start,end:group.at(-1).end,tag});
   bundles.set(file,{file,kind,sourceUrls:group.map(item=>item.url),originalBytes:group.reduce((n,x)=>n+Buffer.byteLength(x.content),0),
    bundledBytes:Buffer.byteLength(payload),brotliOriginalBytes:group.reduce((n,x)=>n+brotli(x.content),0),
    brotliBundleBytes:brotli(payload),digest:hash(payload)});
  }
  group=[];size=0;
 }
 for(const tag of tags){
  const file=localName(tag.url,kind);
  let content=null;
  if(file){
   try{
    content=await readFile(path.join(out,file),'utf8');
    if(kind==='js'?!isolatedIife(content):!safeCss(content))content=null;
   }catch{content=null}
  }
  const gap=group.length?html.slice(group.at(-1).end,tag.start):'';
  if(group.length&&(content===null||gap.trim()!==''||size+Buffer.byteLength(content)>maxBytes))
   await flush();
  if(content!==null){group.push({...tag,file,content});size+=Buffer.byteLength(content)}
 }
 await flush();
 for(const change of changes.reverse())
  html=html.slice(0,change.start)+change.tag+html.slice(change.end);
 return html;
}
function count(html){
 return {js:[...html.matchAll(/<script\b[^>]*\bsrc=["'][^"']+\.js(?:\?[^"']*)?["'][^>]*><\/script>/gi)].length,
  css:[...html.matchAll(/<link\b[^>]*\brel=["']stylesheet["'][^>]*>/gi)].length};
}
const englishRedirect=[
 '<!doctype html>',
 '<html lang="en"><head>',
 '<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">',
 '<meta name="theme-color" content="#000000"><meta name="referrer" content="no-referrer">',
 '<title>Inside Grey Room</title>',
 "<script>try{localStorage.setItem('igr_locale','en')}catch(_){}location.replace('./');</script>",
 '</head><body style="margin:0;background:#000;color:#ddd;font-family:system-ui,sans-serif">',
 '<p>Opening Inside Grey Room…</p><noscript><a href="./">Open Inside Grey Room</a></noscript>',
 '</body></html>',''
].join('\n');
for(const page of ['index.html','en.html']){
 const file=path.join(out,page);
 const before=await readFile(file,'utf8'),baseline=count(before);
 let html=before;
 if(page==='en.html'){
  if(!before.includes("location.replace('./')")||!before.includes("localStorage.setItem('igr_locale','en')"))
   throw new Error('English entrypoint is no longer a simple redirect: refuse unsafe optimization');
  html=englishRedirect;
 }else{
  html=await optimize(html,'css');
  html=await optimize(html,'js');
 }
 await writeFile(file,html,'utf8');
 // The Cloudflare Worker serves these aliases, not dist/index.html directly.
 await writeFile(path.join(out,page.replace('.html','-latest-release.txt')),html,'utf8');
 const after=count(html);
 reports.push({page,before:baseline,after,requestReduction:baseline.js+baseline.css-after.js-after.css});
}
const result={revision,platform:path.basename(out),pages:reports,bundles:[...bundles.values()].sort((a,b)=>a.file.localeCompare(b.file))};
const saved=reports.find(p=>p.page==='index.html');
if(!saved||saved.before.js-saved.after.js<3||saved.before.css-saved.after.css<5)
 throw new Error('Insufficient safe bundle reduction; preserve unoptimized release and inspect scripts');
await writeFile(path.join(out,'igr-v702-optimization-report.json'),JSON.stringify(result,null,2)+'\n');
console.log('IGR v702 safe bundles:',reports.map(x=>x.page+': '+(x.before.js+x.before.css)+' -> '+(x.after.js+x.after.css)+' external scripts/styles').join(' | '),
 'bundles='+bundles.size);
