import { cp, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
const root=process.cwd(),out=path.join(root,'www');

const legacyStoreExcluded=new Set(['dlc-invites-v12-45.js','dlc-invites-v12-45.css']);
const files=[
 'index.html','en.html','styles-v11.css','polish-v12.css','ui-polish-v12.css','gameplay-flow-v13.css','dlc-experience-v13.css','lobby-ui-fix-v13.css','gameplay-clarity-v32.css','startup-stability-v13-3.css','heritage-v13-5.css','heritage-premium-v13-6.css','heritage-play-v13-7.css','play-modes-v13-8.css','omerta-v12.css','omerta-polish-v12.css','role-tree-polish-v12-29.css','omerta-v12-30.css','omerta-v12-40.css','terror-v12-40.css','dlc-suite-v12-40.css','live-cell-v12-44.css','dlc-profile-ui-v12-44.css','dlc-copy-v12-46.css','premium-access-sync-v17.css',
 'app-v11.js','qa-fixes-v12.js','investigation-sheet-v12.js','video-v12-3.js','turn-v12-4.js','profile-dossier-v12.js','playstore-ready-v12.js','social-v12.js','notifications-v12.js','native-lifecycle-v12.js','runtime-optimization-v12.js','gameplay-simple-v12.js','apple-ui-stability-v12.js','gameplay-clean-v12.js',
 'scenario-flow-v13.js','gameplay-flow-v13.js','dlc-experience-v13.js','lobby-ui-fix-v13.js','gameplay-clarity-v32.js','authoritative-runtime-v40.js','runtime-coordinator-v53.js','startup-stability-v13-3.js','heritage-v13-5.js','heritage-premium-v13-6.js','heritage-play-v13-7.js','play-modes-v13-8.js','premium-access-sync-v17.js','scenario-replay-contracts¶»§q«^