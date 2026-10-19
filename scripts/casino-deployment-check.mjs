import assert from 'node:assert/strict';
const origin='https://inside-grey-room-last.alial-khafaji2002.workers.dev';
const get=path=>fetch(origin+path,{cache:'no-store',signal:AbortSignal.timeout(15000)});
const home=await get('/');assert.equal(home.status,200);
const html=await home.text();assert.match(html,/casino-client-v105\.js\?v=105\.4/);
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
for(const poster of ['campagne','scenario-1','scenario-2','scenario-3']){
 const response=await get('/assets/casino/'+poster+'.webp');assert.equal(response.status,200);
 assert.match(response.headers.get('Content-Type'),/image\/webp/);
}
const sheet=await get('/assets/casino/approved-posters-v105-2.webp');assert.equal(sheet.status,200);assert((await sheet.arrayBuffer()).byteLength>100000);
const anonymous=await fetch(origin+'/api/casino',{method:'POST',headers:{'Content-Type':'application/json'},body:'{"op":"sync"}',signal:AbortSignal.timeout(15000)});
assert.equal(anonymous.status,400);assert.deepEqual(await anonymous.json(),{error:'invalid_session_token'});
console.log('Deployed Casino verified: public game, playable catalog, four posters, authenticated service; commit '+meta.commit);
