import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root=process.cwd();
const manifestPath=path.join(root,'android','app','src','main','AndroidManifest.xml');
const variablesPath=path.join(root,'android','variables.gradle');
let manifest=await readFile(manifestPath,'utf8');
const permissions=[
  '<uses-permission android:name="android.permission.CAMERA" />',
  '<uses-permission android:name="android.permission.RECORD_AUDIO" />',
  '<uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />'
];
for(const p of permissions){if(!manifest.includes(p))manifest=manifest.replace(/<manifest([^>]*)>/,`<manifest$1>\n    ${p}`)}
if(!/android:usesCleartextTraffic=/.test(manifest))manifest=manifest.replace('<application','<application android:usesCleartextTraffic="false"');
if(!/android:allowBackup=/.test(manifest))manifest=manifest.replace('<application','<application android:allowBackup="false"');
manifest=manifest.replace(/android:configChanges="([^"]*)"/g,(all,value)=>value.split('|').includes('density')?all:`android:configChanges="${value}|density"`);
await writeFile(manifestPath,manifest);
let variables=await readFile(variablesPath,'utf8');
variables=variables
  .replace(/minSdkVersion\s*=\s*\d+/,'minSdkVersion = 24')
  .replace(/compileSdkVersion\s*=\s*\d+/,'compileSdkVersion = 36')
  .replace(/targetSdkVersion\s*=\s*\d+/,'targetSdkVersion = 36');
await writeFile(variablesPath,variables);
console.log('Android hardened for Play Store: API 36, camera/mic permissions, cleartext disabled.');
