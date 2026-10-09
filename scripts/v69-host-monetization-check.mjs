import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const target=path.resolve(process.argv[2]||'www');
const failures=[];
const passes=[];

const read=(rel)=>fs.readFileSync(path.join(root,rel),'utf8');
const exists=(rel)=>fs.existsSync(path.join(root,rel));
const check=(cond,msg)=>{(cond?passes:failures).push(msg)};

const catalog=read('store-catalog-v69.js');
for(const [key,price] of [['omerta',3],['terror',2],['cartel',2],['regime',2],['heritage',15]]){
  const block=new RegExp(key+':\\{[\\s\\S]{0,420}?priceChf:'+price+'(?:,|\\n)');
  check(block.test(catalog),`catalogue: ${key} = CHF ${price}`);
}
check(/model:'host_pays_guests_free'/.test(catalog),'catalogue: host pays, guests free');
check((catalog.match(/type:'non_consumable'/g)||[]).length===5,'catalogue: five permanent non-consumable products');

const dlc=read('dlc-suite-v12-37.js');
check(/host-licensed: guests never need their own entitlement/.test(dlc),'DLC runtime: no guest entitlement requirement');
check(!/joining player's own entitlement/.test(dlc),'DLC runtime: legacy per-player ownership wording removed');
check(/rpc\('igr_dlc_join_room'/.test(dlc),'DLC runtime: premium guest join uses server host-licence route');

const omerta=read('omerta-v12.js');
check(/Licence hôte permanente/.test(omerta),'OMERTÀ: host licence presentation');
check(/store\.purchase\('omerta'\)/.test(omerta),'OMERTÀ: native purchase route');
check(!/Active une invitation avant de rejoindre/.test(omerta),'OMERTÀ: guest join no longer asks for entitlement');

const heritage=read('heritage-premium-v13-6.js');
check(/Licence hôte · 15 CHF/.test(heritage),'HÉRITAGE: CHF 15 host licence presentation');
check(/store\.purchase\('heritage'\)/.test(heritage),'HÉRITAGE: native purchase route');
check(/invités rejoignent gratuitement/i.test(heritage),'HÉRITAGE: free guest join explicitly documented');

const boundary=read('native-store-boundary-v14.js');
check(/host_pays_guests_free/.test(boundary),'native store boundary: host-pays model');
check(/igrOmertaRedeem/.test(boundary)&&/heritage-code/.test(boundary),'native store boundary: legacy code unlocks suppressed');

const migrationPaths=[
  'supabase/migrations/20261007235402_host_only_premium_access_v69.sql',
  'supabase/migrations/20261007235525_unify_host_premium_guest_join_v69.sql'
];
for(const rel of migrationPaths)check(exists(rel),`${rel}: recorded`);
if(exists(migrationPaths[0])){
  const sql=read(migrationPaths[0]);
  check(/igr_dlc_has_access\(v_host_profile,v_key\)/.test(sql),'server contract: standard DLC host licence checked');
  check(/igr_omerta_has_access\(v_host_profile\)/.test(sql),'server contract: OMERTÀ host licence checked');
  check(/igr_dlc_has_access\(v_room\.owner_profile_id,'heritage'\)/.test(sql),'server contract: HÉRITAGE host licence checked');
}
if(exists(migrationPaths[1])){
  const sql=read(migrationPaths[1]);
  check(/v_key not in \('omerta','terror','cartel','regime'\)/.test(sql),'server contract: one free guest route covers all four DLCs');
}

if(fs.existsSync(target)){
  for(const page of ['index.html','en.html']){
    const file=path.join(target,page);
    if(!fs.existsSync(file)){failures.push(`${page}: built page missing`);continue}
    const html=fs.readFileSync(file,'utf8');
    check(html.includes('store-catalog-v69.js?v=v69-host-pays'),`${page}: canonical store catalogue loaded`);
    if(path.basename(target)==='www'){
      check(html.includes('native-store-boundary-v14.js'),`${page}: native store boundary loaded`);
      check(!/dlc-invites-v12-45\.(?:js|css)/i.test(html),`${page}: DLC code UI excluded from native bundle`);
    }
  }
  if(path.basename(target)==='www'){
    check(!fs.existsSync(path.join(target,'heritage-access-code-v14.js')),'native bundle: HÉRITAGE access-code module excluded');
    check(!fs.existsSync(path.join(target,'dlc-invites-v12-45.js')),'native bundle: DLC access-code module excluded');
  }
}

console.log('\nInside Grey Room — v69 host monetization gate');
console.log('==============================================');
for(const item of passes)console.log('✓ '+item);
for(const item of failures)console.error('✗ '+item);
console.log(`\n${passes.length} checks passed, ${failures.length} failure(s).`);
if(failures.length)process.exit(1);
