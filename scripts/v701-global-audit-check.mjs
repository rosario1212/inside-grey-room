// Global audit release gate: verify the restored 031 client and bounded HTTP backoff.
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import vm from 'node:vm';
import path from 'node:path';

const root=process.argv[2]||'dist';
const read=p=>readFileSync(p,'utf8');
const script='cartel031-v171.js';
const metadata=JSON.parse(read(path.join(root,'cartel031-release.json')));
assert.equal(metadata.version,'v173-cartel031-negotiation');
assert.equal(metadata.scenario,'031');
assert.deepEqual(metadata.evidence_per_cycle,[4,5,4]);
assert(existsSync(path.join(root,script)),'CARTEL 031 client absent from web build');
for(const page of ['index.html','en.html']){
  const html=read(path.join(root,page));
  if(page==='en.html' && /location\.replace\(['"]\.\/['"]\)/.test(html)&&!/<script\s+src=/.test(html)){
    // English intentionally redirects into the published main client. The
    // bilingual page must not download every gameplay module before leaving.
    assert.match(html,/localStorage\.setItem\(['"]igr_locale['"],['"]en['"]\)/,
      'English redirect must persist the requested locale');
    assert(!/<script\s+src=/.test(html),'English redirect must not download an extra runtime');
    continue;
  }
  const matches=html.split('cartel031-v171.js?v=v173-cartel031-negotiation').length-1;
  assert.equal(matches,1,page+' must load exactly one CARTEL 031 runtime');
  if(page==='index.html'){
    assert(html.includes('live-cell-v12-44.js?v=v701-network-resilience-20261115'),
      page+' still references the pre-fix live sync client');
    assert(html.includes('app-v11-terror-live-v694-20261115.js?v=terror-live-v694-20261115&sync=v701-network-resilience-20261115'),
      'Immutable app revision must be preserved with a fresh network cache key');
  }
}
if(existsSync(path.join(root,'service-worker.js'))){
 const sw=read(path.join(root,'service-worker.js'));
 assert(sw.includes("const CACHE='igr-santoro-display-audit-20261108-terror-live-v694-20261115';"),
  'The immutable PWA release cache must remain compatible');
 assert(sw.includes('live-cell-v12-44.js?v=v701-network-resilience-20261115'),
  'Service-worker asset list points to an old live sync client');
}
// The final release patcher, not the initial HTML/build lists, owns this client.
const finalizer=read('scripts/finalize-cartel030-release.mjs');
assert(finalizer.includes("copyFile(path.resolve('cartel031-v171.js')"),
  'The release finalizer does not package CARTEL 031');
assert(finalizer.includes('loaded.length>1'),
  'The finalizer must prevent duplicate 031 pollers');
const pkg=JSON.parse(read('package.json'));
for(const key of ['build','mobile:build','postinstall'])
  assert(pkg.scripts[key].includes('scripts/finalize-cartel030-release.mjs'),
    key+' does not run the canonical 031 release finalizer');
const client=read(script);
assert(client.includes("igr_v171_031_state")&&client.includes("igr_v171_031_act"),
  'Private 031 RPC handlers missing');
assert(client.includes("document.visibilityState==='hidden'"),
  'The private 031 endpoint must not be polled in a suspended tab');
assert(client.includes("navigator.onLine===false"),
  'The private 031 endpoint must not be polled while offline');
for(const file of [script,'live-cell-v12-44.js']){
  execFileSync(process.execPath,['--check',file],{stdio:'pipe'});
}

const live=read('live-cell-v12-44.js');
const from=live.indexOf('  function pollDelay(){');
const to=live.indexOf('  function schedulePoll(',from);
assert(from>=0&&to>from,'The authoritative poll scheduler is missing');
const scope={
  document:{visibilityState:'visible'},
  RT:{ready:true,ws:{readyState:1},failures:0},
  WebSocket:{OPEN:1},
  STATE:{sync:{room:{status:'lobby',phase:'briefing'}}},
  estimatedServerNow:()=>Date.now(),
  Date,Math,Number
};
vm.runInNewContext(live.slice(from,to)+'\nglobalThis.testPollDelay=pollDelay;',scope);
assert.equal(scope.testPollDelay(),1100,'Healthy lobby must remain responsive');
scope.RT.failures=1;const one=scope.testPollDelay();
scope.RT.failures=3;const three=scope.testPollDelay();
scope.RT.failures=8;const eight=scope.testPollDelay();
assert(one>1100&&three>one&&eight>three&&eight<=10000,
  'A healthy Realtime channel must still back off when HTTP snapshots fail');
scope.RT.failures=0;
scope.STATE.sync.room={status:'playing',phase:'investigation',state:{}};
assert.equal(scope.testPollDelay(),2500,'Healthy gameplay latency was regressed');
scope.document.visibilityState='hidden';
assert.equal(scope.testPollDelay(),30000,'Background network activity remains excessive');
scope.document.visibilityState='visible';scope.RT.ready=false;
assert(scope.testPollDelay()>=1200,'Fallback polling must remain active without WebSocket');
console.log('PASS global audit: 031 web/mobile integrity, private idle polling, healthy phase polling and bounded HTTP failure backoff.');
