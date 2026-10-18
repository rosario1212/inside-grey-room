import assert from 'node:assert/strict';
const origin='https://inside-grey-room-last.alial-khafaji2002.workers.dev';
const get=path=>fetch(origin+path,{cache:'no-store',signal:AbortSignal.timeout(15000)});
// A new Worker and its HTML/assets can reach edge locations seconds apart.
// Retry the release identity only; the final exact-commit checks remain strict.
let html='',meta={},homeStatus=0,releaseStatus=0;
for(let attempt=0;attempt<12;attempt++){
 const [home,release]=await Promise.all([get('/'),get('/casino-release.json')]);
 homeStatus=home.status;releaseStatus=release.status;html=await home.text();
 try{meta=await release.json()}catch{meta={}}
 if(homeStatus===200&&releaseStatus===200&&/casino-client-v105\.js\?v=105\.3/.test(html)&&meta.version==='105.3'&&(!process.env.IGR_EXPECTED_COMMIT||meta.commit===process.env.IGR_EXPECTED_COMMIT))break;
 if(attempt<11)await new Promise(resolve=>setTimeout(resolve,5000));
}
assert.equal(homeStatus,200);assert.equal(releaseStatus,200);
assert.ok(/casino-client-v105\.js\?v=105\.3/.test(html),'Published HTML must reference Casino 105.3');
assert.equal(meta.version,'105.3');
if(process.env.IGR_EXPECTED_COMMIT)assert.equal(meta.commit,process.env.IGR_EXPECTED_COMMIT,'The deployed assets must match this commit');
const catalog=await get('/heritage-casino-v91.js');assert.equal(catalog.status,200);
assert.match(await catalog.text(),/launchReady:true/);
for(const poster of ['campagne','scenario-1','scenario-2','scenario-3']){
 const response=await get('/assets/casino/'+poster+'.webp');assert.equal(response.status,200);
 assert.match(response.headers.get('Content-Type'),/image\/webp/);
}
const sheet=await get('/assets/casino/approved-posters-v105-2.webp');assert.equal(sheet.status,200);assert((await sheet.arrayBuffer()).byteLength>100000);
const anonymous=await fetch(origin+'/api/casino',{method:'POST',headers:{'Content-Type':'application/json'},body:'{"op":"sync"}',signal:AbortSignal.timeout(15000)});
assert.equal(anonymous.status,400);assert.deepEqual(await anonymous.json(),{error:'invalid_session_token'});
console.log('Deployed Casino verified: public game, playable catalog, four posters, authenticated service; commit '+meta.commit);
