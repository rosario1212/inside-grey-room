import { spawnSync } from 'node:child_process';
import path from 'node:path';

if(process.platform!=='darwin'){
  console.error('Le build iOS natif nécessite macOS avec Xcode 26 ou plus récent. Le workflow GitHub Actions iOS peut valider le projet sans Mac local.');
  process.exit(1);
}

const mode=process.argv[2]||'simulator';
const root=process.cwd();
const project=path.join(root,'ios','App','App.xcodeproj');
const common=['-project',project,'-scheme','App'];
let args;
if(mode==='simulator'){
  args=[...common,'-configuration','Release','-destination','generic/platform=iOS Simulator','CODE_SIGNING_ALLOWED=NO','build'];
}else if(mode==='archive'){
  const archivePath=path.join(root,'build','InsideGreyRoom.xcarchive');
  args=[...common,'-configuration','Release','-destination','generic/platform=iOS','-archivePath',archivePath];
  if(process.env.IOS_TEAM_ID)args.push(`DEVELOPMENT_TEAM=${process.env.IOS_TEAM_ID}`);
  if(process.env.IOS_ALLOW_PROVISIONING_UPDATES==='1')args.push('-allowProvisioningUpdates');
  args.push('archive');
}else{
  console.error('Mode inconnu. Utilise simulator ou archive.');
  process.exit(1);
}
const out=spawnSync('xcodebuild',args,{stdio:'inherit'});
process.exit(out.status??1);
