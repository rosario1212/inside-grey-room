import { copyFile, readFile, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const root=process.cwd();
const appDir=path.join(root,'ios','App','App');
const infoPath=path.join(appDir,'Info.plist');
const projectPath=path.join(root,'ios','App','App.xcodeproj','project.pbxproj');
const privacySource=path.join(root,'PrivacyInfo.xcprivacy');
const privacyTarget=path.join(appDir,'PrivacyInfo.xcprivacy');
const launchPath=path.join(appDir,'Base.lproj','LaunchScreen.storyboard');
const iconSource=path.join(root,'assets','icon-512-v9.png');
const iconTarget=path.join(appDir,'Assets.xcassets','AppIcon.appiconset','AppIcon-512@2x.png');
const pkg=JSON.parse(await readFile(path.join(root,'package.json'),'utf8'));
const requestedVersion=String(process.env.IOS_MARKETING_VERSION||pkg.version||'1.0.0').trim();
const version=/^\d+(?:\.\d+){1,2}$/.test(requestedVersion)?requestedVersion:'1.0.0';
const parts=version.split('.').map(v=>Number.parseInt(v,10)||0);
const calculatedBuild=(parts[0]||1)*10000+(parts[1]||0)*100+(parts[2]||0);
const build=String(process.env.IOS_BUILD_NUMBER||calculatedBuild);
const bundleId=String(process.env.IOS_BUNDLE_ID||'com.insidegreyroom.game');

function plistEntry(key,valueXml){return `\n\t<key>${key}</key>\n\t${valueXml}\n`}
function setPlist(xml,key,valueXml){
  const pattern=new RegExp(`\\s*<key>${key}<\\/key>\\s*(?:<string>[\\s\\S]*?<\\/string>|<(?:true|false)\\s*\\/>)`);
  const entry=plistEntry(key,valueXml).trimEnd();
  if(pattern.test(xml))return xml.replace(pattern,entry);
  return xml.replace(/\n<\/dict>\s*<\/plist>\s*$/,`${plistEntry(key,valueXml)}</dict>\n</plist>\n`);
}

let info=await readFile(infoPath,'utf8');
info=setPlist(info,'CFBundleDisplayName','<string>Inside Grey Room</string>');
info=setPlist(info,'NSCameraUsageDescription','<string>Inside Grey Room utilise la caméra uniquement lorsque vous activez volontairement le flux vidéo en direct pendant un interrogatoire. Aucun enregistrement vidéo n’est effectué.</string>');
info=setPlist(info,'NSMicrophoneUsageDescription','<string>Inside Grey Room utilise le microphone uniquement lorsque vous activez volontairement le flux audio/vidéo en direct pendant un interrogatoire. Aucun enregistrement audio n’est conservé.</string>');
info=setPlist(info,'ITSAppUsesNonExemptEncryption','<false/>');
info=setPlist(info,'UIStatusBarHidden','<false/>');
await writeFile(infoPath,info);

await copyFile(privacySource,privacyTarget);

let launch=await readFile(launchPath,'utf8');
launch=launch
  .replace(/ image="Splash"/g,'')
  .replace('<color key="backgroundColor" systemColor="systemBackgroundColor"/>','<color key="backgroundColor" red="0.0" green="0.0" blue="0.0" alpha="1" colorSpace="custom" customColorSpace="sRGB"/>');
await writeFile(launchPath,launch);

if(process.platform==='darwin'){
  const icon=spawnSync('sips',['-z','1024','1024',iconSource,'--out',iconTarget],{stdio:'pipe',encoding:'utf8'});
  if(icon.status!==0)throw new Error(`Unable to prepare 1024px iOS icon: ${icon.stderr||icon.stdout||'sips failed'}`);
}

let project=await readFile(projectPath,'utf8');
project=project
  .replace(/IPHONEOS_DEPLOYMENT_TARGET = [^;]+;/g,'IPHONEOS_DEPLOYMENT_TARGET = 15.0;')
  .replace(/MARKETING_VERSION = [^;]+;/g,`MARKETING_VERSION = ${version};`)
  .replace(/CURRENT_PROJECT_VERSION = [^;]+;/g,`CURRENT_PROJECT_VERSION = ${build};`)
  .replace(/PRODUCT_BUNDLE_IDENTIFIER = [^;]+;/g,`PRODUCT_BUNDLE_IDENTIFIER = ${bundleId};`)
  .replace(/TARGETED_DEVICE_FAMILY = "?[0-9,]+"?;/g,'TARGETED_DEVICE_FAMILY = 1;');

const fileRef='A12800000000000000000001';
const buildRef='A12800000000000000000002';
if(!project.includes('PrivacyInfo.xcprivacy')){
  project=project.replace('/* Begin PBXBuildFile section */',`/* Begin PBXBuildFile section */\n\t\t${buildRef} /* PrivacyInfo.xcprivacy in Resources */ = {isa = PBXBuildFile; fileRef = ${fileRef} /* PrivacyInfo.xcprivacy */; };`);
  project=project.replace('/* Begin PBXFileReference section */',`/* Begin PBXFileReference section */\n\t\t${fileRef} /* PrivacyInfo.xcprivacy */ = {isa = PBXFileReference; lastKnownFileType = text.xml; path = PrivacyInfo.xcprivacy; sourceTree = "<group>"; };`);
  project=project.replace(/(\/\* App \*\/ = \{\s*isa = PBXGroup;\s*children = \(\s*)/,`$1\t\t\t\t${fileRef} /* PrivacyInfo.xcprivacy */,\n`);
  project=project.replace(/(\/\* Resources \*\/ = \{\s*isa = PBXResourcesBuildPhase;[\s\S]*?files = \(\s*)/,`$1\t\t\t\t${buildRef} /* PrivacyInfo.xcprivacy in Resources */,\n`);
}
await writeFile(projectPath,project);
console.log(`iOS hardened for App Store: iOS 15+, bundle ${bundleId}, version ${version} (${build}), camera/mic disclosure, privacy manifest, black launch, 1024px icon, iPhone target.`);
