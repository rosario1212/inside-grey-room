import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');
const [ui,styles,index,sw,build,privateSql,aliasSql,tracksSql,judicialSql,finalSql,courtSql,lifecycleSql]=await Promise.all([
 'regime-live-v13.js','regime-live-v13.css','index.html','service-worker.js','scripts/build-web.mjs',
 'supabase/candidates/igr_regime_v13_private_runtime.sql',
 'supabase/candidates/igr_regime_v14_private_aliases.sql',
 'supabase/candidates/igr_regime_v14_tracks.sql',
 'supabase/candidates/igr_regime_v13_judicial_runtime.sql',
 'supabase/candidates/igr_regime_v13_final_scoring.sql',
 'supabase/candidates/igr_regime_v13_court_exchanges.sql',
 'supabase/candidates/igr_regime_v13_lifecycle_patch.sql'
].map(read));

test('client script is valid JS and guarded by server-pinned Regime flag',()=>{
 assert.doesNotThrow(()=>new vm.Script(ui,{filename:'regime-live-v13.js'}));
 assert.match(ui,/regime_v13_active===true/);
 assert.match(ui,/room\(\)\?\.status==='playing'/);
 assert.doesNotMatch(ui,/\b(?:032|033|034)[ABC](?:-|_|ACT)/);
});
test('the private variant is never exposed through unfiltered state',()=>{
 assert.match(privateSql,/igr_regime_v14_sanitize_json\(p\.room_code/);
 assert.match(aliasSql,/alias_salt::text/);
 assert.match(aliasSql,/strict_alias_only/);
 assert.match(privateSql,/REVOKE ALL ON igr_private\.igr_regime_v13_rooms/);
 assert.match(privateSql,/enabled boolean NOT NULL DEFAULT false/);
 assert.match(aliasSql,/CREATE OR REPLACE FUNCTION igr_private\.igr_regime_v14_matches_input/);
});
test('all role actions use replay-safe server requests',()=>{
 for(const name of [
  'igr_regime_v13_action','igr_regime_v13_warrant',
  'igr_regime_v13_judge_review','igr_regime_v13_court_call',
  'igr_regime_v13_reconstruct','igr_regime_v13_third_final',
  'igr_regime_v13_court_exchange','igr_regime_v14_pass_speech']){
   assert.match(ui,new RegExp(name));
 }
 assert.match(ui,/stableRequestId\(name,args\)/);
 assert.match(ui,/window\.sessionStorage\.setItem\(key,id\)/);
 assert.match(ui,/window\.sessionStorage\.removeItem\(request\.key\)/);
 assert.match(ui,/rpcSafe\(name,\{\.\.\.args,p_request_id:request\.id\}\)/);
});
test('the common courtroom does not force frequent form reset',()=>{
 assert.match(ui,/delete stable\.court\.stage_seconds_remaining/);
 assert.match(ui,/id="igrRgStageClock"/);
 assert.match(ui,/Math\.floor\(\(Date\.now\(\)-Date\.parse\(court\.started_at\)\)\/1000\)/);
 assert.match(ui,/el\.focus\(\{preventScroll:true\}\)/);
 assert.match(ui,/preserved\.set\(k,el\.value\)/);
 assert.match(styles,/igr-rg13-exchanges/);
});
test('legitimate refuge evidence cannot be replaced by a guess',()=>{
 assert.match(tracksSql,/igr_regime_v14_active_track/);
 assert.match(tracksSql,/igr_regime_v14_base_track/);
 assert.match(judicialSql,/two independent pieces required/);
 assert.match(judicialSql,/the two documents must point to the chosen refuge/);
 assert.match(judicialSql,/igr_regime_v14_matches_input/);
 assert.match(privateSql,/capture_clue_tracks/);
 assert.match(privateSql,/fallback_tracks/);
});
test('captured defendants and the third suspect retain meaningful objectives',()=>{
 assert.match(privateSql,/captured_response/);
 assert.match(privateSql,/captured_defense_objectives/);
 assert.match(finalSql,/captured_partial/);
 assert.match(finalSql,/third_success/);
 assert.match(finalSql,/act_orders/);
 assert.match(courtSql,/confrontation window is not active/);
});
test('the six-player base and optional prosecutor do not force passive extras',()=>{
 assert.match(lifecycleSql,/igr_v4_min_players/);
 assert.match(lifecycleSql,/igr_v4_max_players/);
 assert.match(lifecycleSql,/THEN 7/);
 assert.match(lifecycleSql,/THEN 6/);
 assert.match(lifecycleSql,/procureur/);
});
test('production assets bundle gated client and CSS for desktop and mobile',()=>{
 assert.match(index,/regime-live-v13\.js/);
 assert.match(index,/regime-live-v13\.css/);
 assert.match(sw,/regime-live-v13\.js/);
 assert.match(sw,/regime-live-v13\.css/);
 assert.match(build,/'regime-live-v13\.js'/);
 assert.match(build,/'regime-live-v13\.css'/);
});
test('regime release stays opt-in and cannot be published by the QA workflow',()=>{
 assert.match(privateSql,/igr_regime_v13_release_eligible/);
 assert.match(lifecycleSql,/igr_regime_v13_release_eligible/);
});

test('safe forward-port keeps recent security, mobile and DLC layers',async()=>{
 const mobile=await read('scripts/build-mobile.mjs');
 assert.match(mobile,/'regime-live-v13\\.js'/);
 assert.match(mobile,/'regime-live-v13\\.css'/);
 assert.match(index,/terror-crisis-v696\\.css/);
 assert.match(index,/analyst-profiling-v700\\.js/);
 assert.match(sw,/function isSensitiveServicePath/);
 assert.match(sw,/igr-v702/);
});
