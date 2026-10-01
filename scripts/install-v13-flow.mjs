import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const write=(f,s)=>fs.writeFileSync(path.join(root,f),s);
const must=(cond,msg)=>{if(!cond)throw new Error(msg)};

const required=['index.html','service-worker.js','gameplay-clean-v12.js','app-v11.js'];
for(const f of required)must(fs.existsSync(path.join(root,f)),`Fichier requis absent: ${f}`);
for(const f of ['scenario-flow-v13.js','gameplay-flow-v13.js','gameplay-flow-v13.css','dlc-experience-v13.js','dlc-experience-v13.css','scenario-replay-contracts-v13.json'])must(fs.existsSync(path.join(root,f)),`Copie d’abord ${f} à la racine du dépôt.`);

let index=read('index.html');
if(!index.includes('gameplay-flow-v13.css')){
  const anchor='<link rel="stylesheet" href="ui-polish-v12.css?v=v12.22-mobile-ui">';
  must(index.includes(anchor),'Ancre CSS inconnue: index.html a changé, arrêt de sécurité.');
  index=index.replace(anchor,`${anchor}\n  <link rel="stylesheet" href="gameplay-flow-v13.css?v=v13.1-final">\n  <link rel="stylesheet" href="dlc-experience-v13.css?v=v13.1-final">`);
}
if(!index.includes('scenario-flow-v13.js')){
  const anchor='<script src="language-v12.js?v=v12.22-mobile-ui"></script>';
  must(index.includes(anchor),'Ancre JS inconnue: index.html a changé, arrêt de sécurité.');
  index=index.replace(anchor,`<script src="scenario-flow-v13.js?v=v13.1-final"></script>\n  <script src="gameplay-flow-v13.js?v=v13.1-final"></script>\n  <script src="dlc-experience-v13.js?v=v13.1-final"></script>\n  ${anchor}`);
}
write('index.html',index);

let sw=read('service-worker.js');
if(!sw.includes("const CACHE='igr-v13-1-final-replay-dlc'")){
  must(/const CACHE='igr-[^']+';/.test(sw),'CACHE service worker introuvable.');
  sw=sw.replace(/const CACHE='igr-[^']+';/,"const CACHE='igr-v13-1-final-replay-dlc';");
}
if(!sw.includes('/scenario-flow-v13.js?v=v13.1-final')){
  const anchor="'/apple-ui-stability-v12.js?v=v12.22-mobile-ui','/gameplay-clean-v12.js?v=v12.22-mobile-ui'";
  must(sw.includes(anchor),'Ancre SHELL inconnue: service-worker.js a changé, arrêt de sécurité.');
  sw=sw.replace(anchor,`${anchor},'/scenario-flow-v13.js?v=v13.1-final','/gameplay-flow-v13.js?v=v13.1-final','/gameplay-flow-v13.css?v=v13.1-final','/dlc-experience-v13.js?v=v13.1-final','/dlc-experience-v13.css?v=v13.1-final','/scenario-replay-contracts-v13.json?v=v13.1-final'`);
}
write('service-worker.js',sw);

console.log('v13.1 final installé dans index.html + service-worker.js.');
console.log('Étapes suivantes: migrer supabase/gameplay-flow-v13.sql puis supabase/replayability-dlc-v13.sql sur une base de test.');
