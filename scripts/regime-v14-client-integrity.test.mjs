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
 assert.match(lifecycleSql,/p_scenario='034' THEN 9 ELSE 8 END/);
 assert.match(lifecycleSql,/then 6/i);
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
 assert.ok(mobile.includes("'regime-live-v13.js'"));
 assert.ok(mobile.includes("'regime-live-v13.css'"));
 assert.ok(index.includes('terror-crisis-v696.css'));
 assert.ok(index.includes('analyst-profiling-v700.js'));

 assert.match(sw,/function isSensitiveServicePath/);
 assert.match(sw,/igr-v702/);
});

test('Regime court verdict is based on collective responsibility levels, never one investigator alone',()=>{
 assert.match(finalSql,/igr_v711_majority_levels\(r\.code\)/);
 assert.match(finalSql,/judicial:=accurate>=3 AND exact>=2/);
 assert.match(finalSql,/voter\.public_role IN \('enqueteur','analyste'\)/);
 assert.match(finalSql,/collective_accurate/);
 assert.doesNotMatch(finalSql,/SELECT coalesce\(\(m\.play_state->'reconstructions'->enq\.id::text->>'accurate'/);
});

test('enquiry roles can recover an unanswered Judge mandate after 90 seconds',()=>{
 assert.ok(ui.includes('function mandateRecovery(){'));
 assert.ok(ui.includes('data-regime-recover-at'));
 assert.ok(ui.includes('el.disabled=left>0'));
 assert.ok(ui.includes("action==='judge-fallback'"));
 assert.ok(judicialSql.includes("now()>=start_at+interval '90 seconds'"));
 assert.ok(ui.includes('refuge?.label'));
 assert.ok(!ui.includes("x.track_choice==='together'"));
});
test('published private manuscripts remain in the nine-variant QA matrix',async()=>{
 const qa=await read('supabase/tests/igr_regime_v14_nine_variant_server_qa.sql');
 assert.ok(qa.includes("status' IN ('draft','ready')"));
});
test('the shared trial keeps each suspect personal file available',()=>{
 assert.ok(ui.includes("phase==='regime_court'?myCard()+court()"));
 assert.ok(ui.includes('judge()+mandateRecovery()'));
});

test('Regime 8th witness and 034-only 9th journalist are selectable and active',async()=>{
 const catalog=await read('dlc-suite-v12-37.js');
 assert.match(catalog,/min:6,max:9,sound:/);
 assert.match(catalog,/Témoin \(8e\)/);
 assert.match(catalog,/Journaliste \(9e\)/);
 assert.match(ui,/function civicRole\(\)/);
 assert.match(ui,/igr_regime_v16_civic_statement/);
 assert.match(ui,/court-testimony/);
 assert.match(ui,/court-press/);
 assert.match(courtSql,/press_question/);
 assert.match(courtSql,/testimony/);
 assert.match(privateSql,/igr_regime_v16_civic_card/);
 assert.match(lifecycleSql,/igr_regime_v16_civic_card/);
 assert.match(index,/regime-v16-rosters-20261115/);
});
test('Regime expanded server capacity, tribunal and majority remain consistent',async()=>{
 const rosterMigration=await read('supabase/migrations/20261115230900_igr_regime_v16_optional_roster_limits.sql');
 assert.match(lifecycleSql,/p_scenario='034' THEN 9 ELSE 8 END/);
 assert.match(rosterMigration,/when 'temoin' then return case when p_count>=8/);
 assert.match(rosterMigration,/when 'journaliste' then return case when p_scenario='034' and p_count>=9/);
 assert.match(lifecycleSql,/\'temoin\',\'journaliste\'/);
 assert.match(judicialSql,/count\(\*\) FROM public\.igr_v4_players WHERE room_code=r\.code\)>=8/);
});


test('Regime optional roles use canonical lobby identifiers without numbered suffixes',async()=>{
 const catalog=await read('dlc-suite-v12-37.js');
 for(const id of ['032','033','034']){
  const line=catalog.split('\n').find(s=>s.includes("'"+id+"':{required:"));
  assert.ok(line,'missing role entry '+id);
  assert.ok(line.includes("optional:['Procureur','Témoin'"),'missing optional role '+id);
  assert.ok(!line.includes('(7e)')&&!line.includes('(8e)')&&!line.includes('(9e)'));
 }
 assert.ok(catalog.includes("'034':{required:['Enquêteur','Analyste','Juge','3 suspects'],optional:['Procureur','Témoin','Journaliste']}"));
 assert.ok(catalog.includes('min:6,max:9,sound:'));
});
test('Regime phone cards clamp copy and keep badges beneath the text',async()=>{
 const css=await read('dlc-suite-v12-40.css');
 for(const selector of [
  '.regime-scenario .scenario-body>p',
  '-webkit-line-clamp:3!important',
  '.regime-scenario .tag-row',
  'margin-top:auto!important',
  '.regime-scenario .scenario-thumb img',
  'position:absolute!important',
  '.roles-availability .roles-row',
  'white-space:normal!important'
 ])assert.ok(css.includes(selector),'missing responsive CSS: '+selector);
 assert.ok(index.includes('regime-v16-1-mobile-cards-20261115'));
 assert.ok(sw.includes('regime-v16-1-mobile-cards-20261115'));
});
