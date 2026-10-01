import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root=process.cwd();
const manifestPath=path.join(root,'android','app','src','main','AndroidManifest.xml');
const variablesPath=path.join(root,'android','variables.gradle');
const appGradlePath=path.join(root,'android','app','build.gradle');
const iconSource=path.join(root,'assets','icon-master-v14.jpg');
const iconDir=path.join(root,'android','app','src','main','res','drawable-nodpi');
const iconTarget=path.join(iconDir,'igr_icon_v14.jpg');
const pkg=JSON.parse(await readFile(path.join(root,'package.json'),'utf8'));
const versionName=String(process.env.ANDROID_VERSION_NAME||pkg.version||'1.0.0').replace(/[^0-9A-Za-z._-]/g,'').slice(0,50)||'1.0.0';
const parts=versionName.split('.').map(x=>Number.parseInt(x,10)||0);
const derivedVersionCode=Math.max(1,(parts[0]||0)*10000+(parts[1]||0)*100+(parts[2]||0));
const requestedCode=Number.parseInt(process.env.ANDROID_VERSION_CODE||'',10);
const versionCode=Number.isFinite(requestedCode)&&requestedCode>0?requestedCode:derivedVersionCode;

await mkdir(iconDir,{recursive:true});
await copyFile(iconSource,iconTarget);

let manifest=await readFile(manifestPath,'utf8');
const permissions=[
  '<uses-permission android:name="android.permission.CAMERA" />',
  '<uses-permission android:name="android.permission.RECORD_AUDIO" />',
  '<uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />'
];
for(const p of permissions){if(!manifest.includes(p))manifest=manifest.replace(/<manifest([^>]*)>/,`<manifest$1>\n    ${p}`)}
if(!/android:usesCleartextTraffic=/.test(manifest))manifest=manifest.replace('<application','<application android:usesCleartextTraffic="false"');
if(!/android:allowBackup=/.test(manifest))manifest=manifest.replace('<application','<application android:allowBackup="false"');
if(/android:icon="[^"]*"/.test(manifest))manifest=manifest.replace(/android:icon="[^"]*"/,'android:icon="@drawable/igr_icon_v14"');
else manifest=manifest.replace('<application','<application android:icon="@drawable/igr_icon_v14"');
if(/android:roundIcon="[^"]*"/.test(manifest))manifest=manifest.replace(/android:roundIcon="[^"]*"/,'android:roundIcon="@drawable/igr_icon_v14"');
else manifest=manifest.replace('<application','<application android:roundIcon="@drawable/igr_icon_v14"');
manifest=manifest.replace(/android:configChanges="([^"]*)"/g,(all,value)=>value.split('|').includes('density')?all:`android:configChanges="${value}|density"`);
await writeFile(manifestPath,manifest);

let variables=await readFile(variablesPath,'utf8');
variables=variables
  .replace(/minSdkVersion\s*=\s*\d+/,'minSdkVersion = 24')
  .replace(/compileSdkVersion\s*=\s*\d+/,'compileSdkVersion = 36')
  .replace(/targetSdkVersion\s*=\s*\d+/,'targetSdkVersion = 36');
await writeFile(variablesPath,variables);

let appGradle=await readFile(appGradlePath,'utf8');
appGradle=appGradle
  .replace(/versionCode\s*(?:=\s*)?\d+/,`versionCode ${versionCode}`)
  .replace(/versionName\s*(?:=\s*)?["'][^"']*["']/,`versionName "${versionName}"`);
await writeFile(appGradlePath,appGradle);

console.log(`Android hardened for Play Store: API 36, camera/mic permissions, cleartext disabled, v14 app icon installed, version ${versionName} (${versionCode}).`);
