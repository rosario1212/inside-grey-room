import assert from 'node:assert/strict';
const origin='https://inside-grey-room-last.alial-khafaji2002.workers.dev';
const get=path=>fetch(origin+path,{cache:'no-store',signal:AbortSignal.timeout(15000)});
const home=await get('/');assert.equal(home.status,200);
const html=await home.text();assert.match(html,/casino-client-v105\.js\?v=105\.5/);
const catalog=await get('/heritage-casino-v91.js');assert.equal(catalog.status,200);
assert.match(await catalog.text(),/launchReady:true/);
const expected=process.env.IGR_EXPECTED_COMMIT||'';
let meta=null;
for(let attempt=0;attempt<(expected?12:1);attempt++){
  // Edge assets can temporarily resolve to the previous Worker version.
  // Never accept an old commit; use a unique query and retry propagation.
  const suffix=expected?'?commit='+encodeURIComponent(expected)+'&probe='+attempt:'';
  const release=await get('/casino-release.json'+suffix);
  assert.equal(release.status,200);
  meta=await release.json();
  assert.equal(meta.version,'105.5');
  if(!expected||meta.commit===expected)break;
  console.log('Waiting for deployed assets: expected '+expected.slice(0,9)+' got '+String(meta.commit).slice(0,9));
  if(attempt<11)await new Promise(resolve=>setTimeout(resolve,2200));
}
if(expected)assert.equal(meta.commit,expected,'The deployed assets must match this commit');
let cartel=null;
for(let attempt=0;attempt<(expected?12:1);attempt++){
  const cartelResponse=await get('/cartel030-release.json?commit='+encodeURIComponent(expected)+'&probe='+attempt);
  assert.equal(cartelResponse.status,200);
  cartel=await cartelResponse.json();
  if(!expected||(cartel.commit===expected&&cartel.version==='v171-cartel031-la-dette'))break;
  console.log('Waiting for CARTEL assets: expected '+expected.slice(0,9)+' got '+String(cartel.commit).slice(0,9));
  if(attempt<11)await new Promise(resolve=>setTimeout(resolve,2200));
}
assert.equal(cartel.scenario,'030');
assert.equal(cartel.version,'v171-cartel031-la-dette');
if(expected)assert.equal(cartel.commit,expected,'CARTEL 030 must match the deployed commit');
assert.deepEqual(cartel.moles,{'7':1,'8':1,'9':2});
assert.deepEqual(cartel.evidence_per_cycle,[6,7,10]);
const cartelHome=await get('/?release='+encodeURIComponent(cartel.version));
assert.match(await cartelHome.text(),/app-v11\.js\?v=v171-cartel031-la-dette/);
const cartelApp=await get('/app-v11.js?v='+cartel.version);
assert.equal(cartelApp.status,200);
const cartelSource=await cartelApp.text();
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
const cartelWorker=await get('/service-worker.js?v='+cartel.version);
assert((await cartelWorker.text()).includes("const CACHE='igr-v171-cartel031-la-dette';"));
for(const poster of ['campagne','scenario-1','scenario-2','scenario-3']){
 const response=await get('/assets/casino/'+poster+'.webp');assert.equal(response.status,200);
 assert.match(response.headers.get('Content-Type'),/image\/webp/);
}
const sheet=await get('/assets/casino/approved-posters-v105-2.webp');assert.equal(sheet.status,200);assert((await sheet.arrayBuffer()).byteLength>100000);
const anonymous=await fetch(origin+'/api/casino',{method:'POST',headers:{'Content-Type':'application/json'},body:'{"op":"sync"}',signal:AbortSignal.timeout(15000)});
assert.equal(anonymous.status,400);assert.deepEqual(await anonymous.json(),{error:'invalid_session_token'});
console.log('Deployed Casino verified: public game, playable catalog, four posters, authenticated service; commit '+meta.commit);
console.log('Deployed CARTEL 030 verified: current application, private dossiers, evidence view, fresh PWA cache and commit '+cartel.commit);

const debtMetaResponse=await get('/cartel031-release.json?commit='+encodeURIComponent(expected));assert.equal(debtMetaResponse.status,200);const debtMeta=await debtMetaResponse.json();assert.equal(debtMeta.version,'v171-cartel031-la-dette');if(expected)assert.equal(debtMeta.commit,expected);assert.deepEqual(debtMeta.evidence_per_cycle,[4,5,4]);assert.deepEqual(debtMeta.variants,['A','B','C']);const debtRuntime=await get('/cartel031-v171.js?v='+debtMeta.version);assert.equal(debtRuntime.status,200);const debtSource=await debtRuntime.text();assert(debtSource.includes('igr_v171_031_act'));assert(debtSource.includes('igr_v171_031_state'));assert(debtSource.includes('renderLocal'));assert(!debtSource.includes('"canonical_truth":{'));console.log('Deployed CARTEL 031 verified: matching commit, private decisions and local runtime.');
