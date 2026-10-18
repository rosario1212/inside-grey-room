import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {join} from 'node:path';
const migration=await readFile('supabase/migrations/20261018044050_casino_durable_sessions.sql','utf8');
assert.match(migration,/create schema if not exists igr_casino_private/);
assert.doesNotMatch(migration,/grant usage on schema igr_private/i,'Casino must not open the existing narrative schema to a new role');
assert.doesNotMatch(migration,/security definer/i);
assert.equal((migration.match(/enable row level security/gi)||[]).length,3);
assert.equal((migration.match(/revoke all on function/g)||[]).length,5);
assert.doesNotMatch(migration,/grant (?:select|execute|usage).* to (?:public|anon|authenticated)/i);
const worker=await readFile('cloudflare-worker.mjs','utf8'),edge=await readFile('casino/edge.mjs','utf8');
assert.equal(worker.match(/ACCESS_VERIFIER\s*=\s*'([^']+)'/)?.[1],edge.match(/ACCESS_VERIFIER\s*=\s*'([^']+)'/)?.[1]);
for(const dir of process.argv.slice(2).length?process.argv.slice(2):['dist']){
 let names;try{names=await readdir(dir,{recursive:true})}catch{continue}
 for(const file of names){
  assert(!/^casino\//.test(file)&&!/(?:^|\/)(?:edge\.mjs|service\.mjs|runtime\.mjs|games\.mjs|campaign-core\.mjs|casino-fixtures|casino-releases)/.test(file),'Server-only Casino material in '+dir+': '+file);
  if(/\.(js|html|json|mjs)$/.test(file)){
   const source=await readFile(join(dir,file),'utf8');
   assert(!/SUPABASE_SERVICE_ROLE_KEY|sb_secret_/.test(source),'Privileged key reference in browser asset '+file);
  }
 }
 for(const page of ['index.html','en.html']){
  const html=await readFile(join(dir,page),'utf8');
  assert.equal((html.match(/src="casino-client-v105.js\?v=105.0"/g)||[]).length,1);
  assert.equal((html.match(/href="casino-client-v105.css\?v=105.0"/g)||[]).length,1);
 }
}
console.log('Casino release: server modules excluded, privileged keys absent, RPCs service-only, existing narrative permissions preserved.');
