import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
const migration=await readFile('supabase/migrations/20261018044050_casino_durable_sessions.sql','utf8');
assert.match(migration,/create schema if not exists igr_casino_private/);
assert.doesNotMatch(migration,/grant usage on schema igr_private/i,'Casino must not open the existing narrative schema to a new role');
assert.doesNotMatch(migration,/security definer/i);
assert.equal((migration.match(/enable row level security/gi)||[]).length,3);
assert.equal((migration.match(/revoke all on function/g)||[]).length,5);
assert.doesNotMatch(migration,/grant (?:select|execute|usage).* to (?:public|anon|authenticated)/i);
const worker=await readFile('cloudflare-worker.mjs','utf8'),edge=await readFile('casino/edge.mjs','utf8');
assert.doesNotMatch(worker+edge,/ACCESS_VERIFIER|X-IGR-Private-Code/,'Room capabilities authenticate Casino without restoring the website passcode');
assert.match(edge,/casinoService\(storage,options\)/);
for(const dir of process.argv.slice(2).length?process.argv.slice(2):['dist']){
 let names;try{names=await readdir(dir,{recursive:true})}catch{continue}
 for(const file of names){
  assert(!/^casino\//.test(file)&&!/(?:^|\/)(?:edge\.mjs|service\.mjs|runtime\.mjs|games\.mjs|campaign-core\.mjs|casino-fixtures|casino-releases)/.test(file),'Server-only Casino material in '+dir+': '+file);
  if(/\.(js|html|json|mjs)$/.test(file)){
   const source=await readFile(join(dir,file),'utf8');
   assert(!/SUPABASE_SERVICE_ROLE_KEY|sb_secret_/.test(source),'Privileged key reference in browser asset '+file);
  }
 }
 for(const client of ['casino-client-v105.js','heritage-casino-v91.js']){
  const syntax=spawnSync(process.execPath,['--check',join(dir,client)],{encoding:'utf8'});
  assert.equal(syntax.status,0,'Invalid Casino runtime '+client+': '+syntax.stderr);
 }
 // The optimized release may fold each public Casino asset into an exact,
 // hash-addressed bundle. v702-runtime-check proves byte-for-byte inclusion.
 let optimization=null;
 try{optimization=JSON.parse(await readFile(join(dir,'igr-v702-optimization-report.json'),'utf8'))}catch{}
 const mainHtml=await readFile(join(dir,'index.html'),'utf8');
 for(const page of ['index.html','en.html']){
  const pageHtml=await readFile(join(dir,page),'utf8');
  const redirect=page==='en.html'&&/location\.replace\(['"]\.\/['"]\)/.test(pageHtml);
  if(redirect)assert.match(pageHtml,/localStorage\.setItem\(['"]igr_locale['"],['"]en['"]\)/,
   'The English redirect must preserve its locale before loading the main page');
  const html=redirect?mainHtml:pageHtml;
  for(const [kind,url] of [['js','casino-client-v105.js?v=105.13-live-drafts-20261126'],['css','casino-client-v105.css?v=105.13-v821-layout']]){
   const direct=kind==='js'
     ?html.includes('src="'+url+'"'):html.includes('href="'+url+'"');
   const packed=(optimization?.bundles||[]).filter(item=>item.kind===kind&&
     item.sourceUrls.includes(url)&&html.includes((kind==='js'?'src="':'href="')+item.file+'"'));
   if(Number(direct)+packed.length!==1){
    const related=(optimization?.bundles||[]).filter(item=>
      item.sourceUrls?.some(u=>u.includes('casino-client-v105')));
    console.error('[CASINO ASSET DIAG]',JSON.stringify({page,kind,url,direct,
      related:related.map(item=>({file:item.file,kind:item.kind,urls:item.sourceUrls,
        inHtml:html.includes('src="'+item.file+'"')||html.includes('href="'+item.file+'"')})),
      hasLiteral:html.includes('casino-client-v105'),
      scriptTags:[...html.matchAll(/<script\s+src="([^"]+)"/g)].map(m=>m[1]).slice(-15)
    }));
   }
   assert.equal(Number(direct)+packed.length,1,
    'Public Casino '+kind+' must be loaded exactly once by '+page+' or its redirect destination');
  }
 }
}
console.log('Casino release: server modules excluded, privileged keys absent, RPCs service-only, existing narrative permissions preserved.');
