import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const origin='https://inside-grey-room-last.alial-khafaji2002.workers.dev';
// The final Cartel/RC postprocessors may rewrite app and SW revisions. Compare
// the deployed Worker against the ACTUAL finished dist bundle, never a guessed
// version string from an earlier build stage.
const [publishedHtml,publishedSw]=await Promise.all([
  readFile('dist/index.html','utf8'),readFile('dist/service-worker.js','utf8')
]);
const clientAsset='app-v11-eight-cases-v310-20261112.js';
const clientVersion=publishedHtml.match(/app-v11-eight-cases-v310-20261112\.js\?v=([^"'<>\s]+)/)?.[1]||'';
const cacheVersion=publishedSw.match(/const CACHE='igr-([^']+)'/)?.[1]||'';
assert.equal(clientVersion,'eight-cases-v310-20261112','The bundled 006 app release path is not current');
assert(cacheVersion.includes('santoro-display-audit-20261108'),
 'The bundled PWA cache is not the certified Santoro revision');
assert(publishedSw.includes('/'+clientAsset+'?v='+clientVersion),
 'Bundled app URL and service-worker cache disagree');
const get=path=>fetch(origin+path,{cache:'no-store',signal:AbortSignal.timeout(15000)});
// The unversioned edge cache can retain an earlier homepage after a Worker deploy.
// Verify the explicit current release URL (also used for direct beta invitations).
const versionedHome='/?release=omerta-editorial-20261109'+(process.env.IGR_EXPECTED_COMMIT?'&commit='+encodeURIComponent(process.env.IGR_EXPECTED_COMMIT):'');
const home=await get(versionedHome);assert.equal(home.status,200);
assert.equal(home.headers.get('X-Frame-Options'),'DENY','Cloudflare must block external UI framing');
assert.match(home.headers.get('Content-Security-Policy')||'',/frame-ancestors 'none'/);
assert.equal(home.headers.get('X-Content-Type-Options'),'nosniff');
assert.equal(home.headers.get('X-IGR-Release'),'igr-003-008-009-011-secure-20261025','Stale Worker version');
const html=await home.text();assert.match(html,/casino-client-v105\.js\?v=105\.5/);
assert.match(html,/app-v11-eight-cases-v310-20261112\.js\?v=eight-cases-v310-20261112/,'The edge homepage is using a stale Scenario 006 client');
assert.match(html,/investigation-accuracy-v284\.js\?v=006-detail-v284-20261112/,'The live questionnaire is missing');
assert.match(html,/investigation-deep-v286\.js\?v=eight-cases-v310-20261112/,'The live five-case questionnaire is missing');
const omertaScriptTag=html.match(/<script\s+src="omerta-v12-omerta-editorial-20261109\.js\?v=[^"]+"\s*><\/script>/);
assert(omertaScriptTag,'The live homepage has not loaded the immutable Omertà opening script');
const catalog=await get('/heritage-casino-v91.js');assert.equal(catalog.status,200);
assert.match(await catalog.text(),/launchReady:true/);
const expected=process.env.IGR_EXPECTED_COMMIT||'';
// A unique immutable URL per commit defeats cross-deployment edge cache reuse.
// The legacy endpoint remains available for clients not running production verification.
const releasePath=(name)=>expected?`/${name}-${expected.slice(0,12)}.json`:`/${name}.json`;
// Cloudflare assets may temporarily return the HTML fallback for a new,
// commit-addressed metadata path before propagation. Never parse that fallback
// as JSON, never accept a different commit, and fail closed after bounded retries.
const readVersionedRelease=async (name,accept)=>{
  const attempts=expected?18:1;
  let last='not fetched';
  for(let attempt=0;attempt<attempts;attempt++){
    const suffix='?commit='+encodeURIComponent(expected)+'&probe='+attempt;
    let response,parsed=null;
    try{
      response=await get(releasePath(name)+suffix);
      const body=await response.text();
      if(response.status===200&&body.trimStart().startsWith('{')){
        try{parsed=JSON.parse(body)}catch(_){parsed=null;}
      }
      last='HTTP '+response.status+', content-type '+String(response.headers.get('content-type'))+
        ', commit '+String(parsed?.commit||'unavailable').slice(0,12);
      if(parsed&&accept(parsed))return parsed;
    }catch(error){last=String(error?.message||error).slice(0,200);}
    if(attempt+1<attempts){
      console.log(name+' not propagated: '+last+'; retry '+(attempt+1)+'/'+attempts);
      await new Promise(resolve=>setTimeout(resolve,2200));
    }
  }
  throw new Error(name+' not verified for commit '+expected.slice(0,12)+': '+last);
};
const meta=await readVersionedRelease('casino-release',v=>v.version==='105.5'&&
 (!expected||v.commit===expected));
const cartel=await readVersionedRelease('cartel030-release',v=>
 v.version==='v173-cartel031-negotiation'&&(!expected||v.commit===expected));
assert.equal(cartel.scenario,'030');
assert.equal(cartel.version,'v173-cartel031-negotiation');
if(expected)assert.equal(cartel.commit,expected,'CARTEL 030 must match the deployed commit');
assert.deepEqual(cartel.moles,{'7':1,'8':1,'9':2});
assert.deepEqual(cartel.evidence_per_cycle,[6,7,10]);
let liveHomeVersion='';
for(let attempt=0;attempt<(expected?12:1);attempt++){
  const releaseQuery='?release='+encodeURIComponent(cartel.version)+'&commit='+encodeURIComponent(expected)+'&probe='+attempt;
  const cartelHome=await get('/'+releaseQuery);
  assert.equal(cartelHome.status,200);
  const text=await cartelHome.text();
  liveHomeVersion=text.match(/app-v11-eight-cases-v310-20261112\.js\?v=([^"'<>\s]+)/)?.[1]||'';
  if(liveHomeVersion===clientVersion)break;
  if(attempt<11)await new Promise(resolve=>setTimeout(resolve,2200));
}
assert.equal(liveHomeVersion,clientVersion,
  'Deployed HTML app cache does not match the fully built local bundle');
const cartelApp=await get('/'+clientAsset+'?v='+clientVersion);
assert.equal(cartelApp.status,200);
const cartelSource=await cartelApp.text();
const optionalRoles=await get('/natural-role-gameplay-v50.js?verify=003-008-009-011');
assert.equal(optionalRoles.status,200);
const optionalRolesSource=await optionalRoles.text();
assert(optionalRolesSource.includes('x.available===false'),'Cycle-aware Expert UI missing');
assert(optionalRolesSource.includes('expert.can_counter?'),'Expert final-phase control missing');
assert(optionalRolesSource.includes('prosecutor.case_strategy'),'011 Prosecutor strategy missing');
assert(cartelSource.includes('Procureur · Juge · Journaliste · Don · Bras droit'),'CARTEL 029 optional roles missing');
assert(!cartelSource.includes('Avocat du cartel · Procureur · Juge · Journaliste · Don · Bras droit'),'CARTEL 029 still offers a lawyer');
const cartelRoles=await get('/cartel029-v121.js?v='+cartel.version);
assert.equal(cartelRoles.status,200);
assert(!(await cartelRoles.text()).includes("maitre:{label:'Avocat du cartel'"),'CARTEL 029 still defines a cartel lawyer');
const cartelLawyer=await get('/lawyer-runtime-v43.js?v='+cartel.version);
assert.equal(cartelLawyer.status,200);
const lawyerSource=await cartelLawyer.text();
assert(lawyerSource.includes('CLIENT DÉSIGNÉ PAR LE CARTEL'),'Automatic cartel mandate UI missing');
assert(lawyerSource.includes('assignment_mode'),'Cartel appointment UI missing');
const terminationResponse=await get('/lawyer-dismissal-v45.js?v='+cartel.version);
assert.equal(terminationResponse.status,200);
const terminationSource=await terminationResponse.text();
assert(terminationSource.includes('igr_v170_end_representation'),'Mutual termination runtime missing');
assert(terminationSource.includes('p_acknowledge_cartel'),'Cartel consequence confirmation missing');
for(const field of ['what_you_know','variant_secret','what_you_hide','your_chronology','objective'])assert(cartelSource.includes('ps.variant_card.'+field),'Missing private field '+field);
assert(cartelSource.includes('e.payload?.evidence_id'),'CARTEL cycle evidence UI missing');
// Cloudflare's Worker is atomically published, but individual edge assets may
// briefly resolve through the previous release. Require matching files, not a
// transient first-response success or a permanently stale service worker.
const assertDeployedAsset=async (name,marker)=>{
  let content='',status=0;
  for(let attempt=0;attempt<(expected?15:1);attempt++){
    const url='/'+name+'?v='+cacheVersion+'&commit='+encodeURIComponent(expected)+'&probe='+attempt;
    const response=await get(url);status=response.status;
    content=status===200?await response.text():'';
    if(status===200&&content.includes(marker))return;
    if(attempt<14)await new Promise(resolve=>setTimeout(resolve,2200));
  }
  assert.equal(status,200,'Deployed asset unavailable: '+name);
  assert(content.includes(marker),'Deployed asset has not propagated: '+name+' ('+cacheVersion+')');
};
await assertDeployedAsset('service-worker.js',"const CACHE='igr-"+cacheVersion+"';");
await assertDeployedAsset(clientAsset,'investigation_006_adaptive');
await assertDeployedAsset('investigation-accuracy-v284.js','igr_v284_006_submit_detail');
await assertDeployedAsset('investigation-deep-v286.js','igr_v286_submit_detail');
await assertDeployedAsset('omerta-v12-omerta-editorial-20261109.js','Chaque vendredi, des commerçants du quartier remettent leur contribution');
await assertDeployedAsset('omerta-v12-omerta-editorial-20261109.js','Vittorio Santoro dirige une famille dont l’autorité repose sur des règles');
await assertDeployedAsset('investigation-workspace-v634.css','igr634-interviews');
await assertDeployedAsset('investigation-workspace-v634.js','igr634-priority');
await assertDeployedAsset('reading-stability-v635.css','igr82-relation:nth-child(odd)');
await assertDeployedAsset('notifications-v12.js','state.timer=setInterval(scan,1400)');
const liveUxStyle=await get('/live-game-ux-v632.css?v='+cacheVersion);
assert.equal(liveUxStyle.status,200);
assert((await liveUxStyle.text()).includes('safe-area-inset-top'),'Live iPhone layout patch missing from production');
const liveUxRuntime=await get('/live-game-ux-v632.js?v='+cacheVersion);
assert.equal(liveUxRuntime.status,200);
assert((await liveUxRuntime.text()).includes('mountLiveSessionControls'),'Live host action layout patch missing from production');
for(const poster of ['campagne','scenario-1','scenario-2','scenario-3']){
 const response=await get('/assets/casino/'+poster+'.webp');assert.equal(response.status,200);
 assert.match(response.headers.get('Content-Type'),/image\/webp/);
}
const sheet=await get('/assets/casino/approved-posters-v105-2.webp');assert.equal(sheet.status,200);assert((await sheet.arrayBuffer()).byteLength>100000);
const anonymous=await fetch(origin+'/api/casino',{method:'POST',headers:{'Content-Type':'application/json'},body:'{"op":"sync"}',signal:AbortSignal.timeout(15000)});
assert.equal(anonymous.status,400);assert.deepEqual(await anonymous.json(),{error:'invalid_session_token'});
console.log('Deployed Casino verified: public game, playable catalog, four posters, authenticated service; commit '+meta.commit);
console.log('Deployed CARTEL 030 verified: current application, private dossiers, evidence view, fresh PWA cache and commit '+cartel.commit);

const debtMeta=await readVersionedRelease('cartel031-release',v=>v.version==='v173-cartel031-negotiation'&&(!expected||v.commit===expected));assert.deepEqual(debtMeta.evidence_per_cycle,[4,5,4]);assert.deepEqual(debtMeta.variants,['A','B','C']);const debtRuntime=await get('/cartel031-v171.js?v='+debtMeta.version);assert.equal(debtRuntime.status,200);const debtSource=await debtRuntime.text();assert(debtSource.includes('igr_v171_031_act'));assert(debtSource.includes('igr_v171_031_state'));assert(debtSource.includes('renderLocal'));assert(!debtSource.includes('"canonical_truth":{'));console.log('Deployed CARTEL 031 verified: matching commit, private decisions and local runtime.');

const apiUrl=cartelSource.match(/const SUPABASE_URL = '([^']+)'/)?.[1];
const apiKey=cartelSource.match(/const SUPABASE_KEY = '([^']+)'/)?.[1];
assert(apiUrl&&apiKey);
const invalidState=await fetch(apiUrl+'/rest/v1/rpc/igr_v171_031_state',{method:'POST',headers:{apikey:apiKey,'Content-Type':'application/json'},body:JSON.stringify({p_code:'ZD999',p_player_token:'00000000-0000-0000-0000-000000000000'}),signal:AbortSignal.timeout(15000)});
assert.equal(invalidState.status,400);assert.equal((await invalidState.json()).message,'unauthorized');
console.log('Deployed CARTEL 031 private state RPC verified: invalid player token rejected.');
