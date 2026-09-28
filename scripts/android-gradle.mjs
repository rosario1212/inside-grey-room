import { spawn } from 'node:child_process';
import path from 'node:path';

const task=process.argv[2]||'assembleDebug';
if(!/^[A-Za-z0-9:_-]+$/.test(task)){
  console.error('Invalid Gradle task.');
  process.exit(2);
}
const androidDir=path.join(process.cwd(),'android');
const gradle=process.platform==='win32'?'gradlew.bat':'./gradlew';
const child=spawn(gradle,[task],{cwd:androidDir,stdio:'inherit',shell:false});
child.on('error',error=>{console.error(error);process.exit(1)});
child.on('exit',code=>process.exit(code??1));
