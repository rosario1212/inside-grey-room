import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const root=process.cwd();
const target=path.resolve(root,process.argv[2]||'dist');
const sourcePath=path.join(root,'duration-modes-v35.js');
const qaPath=path.join(root,'qa-fixes-v12.js');
const migrationPath=path.join(root,'supabase','migrations','20261005211500_long_interrogation_six_minutes_canonical.sql');
const builtPath=path.join(target,'duration-modes-v35.js');
const exists=async file=>{try{await stat(file);return true}catch{return false}};

const source=await readFile(sourcePath,'utf8');
const qa=await readFile(qaPath,'utf8');
const migration=await readFile(migrationPath,'utf8');

const requireMatch=(text,re,message)=>{if(!re.test(text))throw new Error(message)};
const forbidMatch=(text,re,message)=>{if(re.test(text))throw new Error(message)};
const branch=(mode)=>{
  const marker=`when '${mode}' then case p_kind`;
  const start=migration.indexOf(marker);
  if(start<0)throw new Error(`Database migration is missing the ${mode.toUpperCase()} duration branch`);
  const end=migration.indexOf('else null end',start);
  if(end<0)throw new Error(`Database migration has an unterminated ${mode.toUpperCase()} duration branch`);
  return migration.slice(start,end+'else null end'.length);
};

requireMatch(source,/short:\{[^}]*interrogation:360\b/,'SHORT interrogation must be 360 seconds in duration-modes-v35.js');
requireMatch(source,/long:\{[^}]*interrogation:360\b/,'LONG interrogation must be 360 seconds in duration-modes-v35.js');
requireMatch(source,/long:\{[^}]*finalDebrief:240\b/,'LONG final debrief must be 240 seconds in duration-modes-v35.js');
forbidMatch(source,/short:\{[^}]*interrogation:300\b/,'SHORT interrogation regressed to 300 seconds in duration-modes-v35.js');
forbidMatch(source,/long:\{[^}]*interrogation:480\b/,'LONG interrogation regressed to 480 seconds in duration-modes-v35.js');

const shortBranch=branch('short');
const longBranch=branch('long');
requireMatch(shortBranch,/when 'interrogation' then 360\b/,'Database migration must keep SHORT interrogation at 360 seconds');
requireMatch(longBranch,/when 'interrogation' then 360\b/,'Database migration must set LONG interrogation to 360 seconds');
requireMatch(longBranch,/when 'final_debrief' then 240\b/,'Database migration must set LONG final debrief to 240 seconds');
forbidMatch(longBranch,/when 'interrogation' then 480\b/,'Database migration regressed LONG interrogation to 480 seconds');

if(await exists(builtPath)){
  const built=await readFile(builtPath,'utf8');
  requireMatch(built,/short:\{[^}]*interrogation:360\b/,'Built runtime must expose SHORT interrogation as 360 seconds');
  requireMatch(built,/long:\{[^}]*interrogation:360\b/,'Built runtime must expose LONG interrogation as 360 seconds');
  requireMatch(built,/long:\{[^}]*finalDebrief:240\b/,'Built runtime must expose LONG final debrief as 240 seconds');
}

console.log('Duration mode regression check passed: SHORT interrogation=360s, LONG interrogation=360s, LONG final debrief=240s.');
