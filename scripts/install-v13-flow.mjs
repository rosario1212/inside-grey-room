import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const write=(f,s)=>fs.writeFileSync(path.join(root,f),s);
const must=(cond,msg)=>{if(!cond)throw new Error(msg)};

const required=['index.html','service-worker.js','gameplay-clean-v12.js','app-v11.js'];
for(const f of required)must(fs.existsSync(path.join(root,f)),`Fichier requis absent: ${f}`);
for(const f of [
  'scenario-flow-v13.js','gameplay-flow-v13.js','gameplay-flow-v13.css',
  'dlc-experience-v13.js','dlc-experience-v13.css','scenario-replay-contracts-v13.json',
  'lobby-ui-fix-v13.js','lobby-ui-fix-v13.css'
])must(fs.existsSync(path.join(root,f)),`Copie d’abord ${f} à la racine du dépôt.`);

let index=read('index.html');

// Upgrade an already installed v13.1 bundle without duplicating tags.
index=index.replaceAll('?v=v13.1-final','?v=v13.2-final');

if(!index.includes('gameplay-flow-v13.css')){
  const anchor='<link rel="stylesheet" href="ui-polish-v12.css?v=v12.22-mobile-ui">';
  must(index.includes(anchor),'Ancre CSS inconnue: index.html a changé, arrêt de sécurité.');
  index=index.replace(anchor,`${anchor}\n  <link rel="stylesheet" href="gameplay-flow-v13.css?v=v13.2-final">\n  <link rel="stylesheet" href="dlc-experience-v13.css?v=v13.2-final">`);
}

if(!index.includes('lobby-ui-fix-v13.css')){
  const lateCss='<link rel="stylesheet" href="dlc-copy-v12-46.css?v=v12.46-copy">';
  if(index.includes(lateCss)){
    index=index.replace(lateCss,`${lateCss}\n  <link rel="stylesheet" href="lobby-ui-fix-v13.css?v=v13.2-lobby-fix">`);
  }else{
    must(index.includes('</head>'),'Balise </head> absente: arrêt de sécurité.');
    index=index.replace('</head>','  <link rel="stylesheet" href="lobby-ui-fix-v13.css?v=v13.2-lobby-fix">\n</head>');
  }
}

if(!index.includes('scenario-flow-v13.js')){
  const anchor='<script src="language-v12.js?v=v12.22-mobile-ui"></script>';
  must(index.includes(anchor),'Ancre JS inconnue: index.html a changé, arrêt de sécurité.');
  index=index.replace(anchor,`<script src="scenario-flow-v13.js?v=v13.2-final"></script>\n  <script src="gameplay-flow-v13.js?v=v13.2-final"></script>\n  <script src="dlc-experience-v13.js?v=v13.2-final"></script>\n  ${anchor}`);
}

if(!index.includes('lobby-ui-fix-v13.js')){
  const lateJs='<script src="dlc-copy-v12-46.js?v=v12.46-copy"></script>';
  if(index.includes(lateJs)){
    index=index.replace(lateJs,`${lateJs}\n  <script src="lobby-ui-fix-v13.js?v=v13.2-lobby-fix"></script>`);
  }else{
    must(index.includes('</body>'),'Balise </body> absente: arrêt de sécurité.');
    index=index.replace('</body>','  <script src="lobby-ui-fix-v13.js?v=v13.2-lobby-fix"></script>\n</body>');
  }
}
write('index.html',index);

let sw=read('service-worker.js');
must(/const CACHE='igr-[^']+';/.test(sw),'CACHE service worker introuvable.');
sw=sw.replace(/const CACHE='igr-[^']+';/,"const CACHE='igr-v13-2-final-lobby-fix';");
sw=sw.replaceAll('?v=v13.1-final','?v=v13.2-final');

if(!sw.includes('/scenario-flow-v13.js?v=v13.2-final')){
  const anchor="'/apple-ui-stability-v12.js?v=v12.22-mobile-ui','/gameplay-clean-v12.js?v=v12.22-mobile-ui'";
  must(sw.includes(anchor),'Ancre SHELL inconnue: service-worker.js a changé, arrêt de sécurité.');
  sw=sw.replace(anchor,`${anchor},'/scenario-flow-v13.js?v=v13.2-final','/gameplay-flow-v13.js?v=v13.2-final','/gameplay-flow-v13.css?v=v13.2-final','/dlc-experience-v13.js?v=v13.2-final','/dlc-experience-v13.css?v=v13.2-final','/scenario-replay-contracts-v13.json?v=v13.2-final'`);
}
if(!sw.includes('/lobby-ui-fix-v13.js?v=v13.2-lobby-fix')){
  const marker="'/scenario-replay-contracts-v13.json?v=v13.2-final'";
  if(sw.includes(marker)){
    sw=sw.replace(marker,`${marker},'/lobby-ui-fix-v13.js?v=v13.2-lobby-fix','/lobby-ui-fix-v13.css?v=v13.2-lobby-fix'`);
  }else{
    must(/const SHELL=\[[\s\S]*?\];/.test(sw),'Tableau SHELL introuvable: arrêt de sécurité.');
    sw=sw.replace(/const SHELL=\[([\s\S]*?)\];/,(_,inside)=>`const SHELL=[${inside},'/lobby-ui-fix-v13.js?v=v13.2-lobby-fix','/lobby-ui-fix-v13.css?v=v13.2-lobby-fix'];`);
  }
}
write('service-worker.js',sw);

console.log('v13.2 final installé dans index.html + service-worker.js.');
console.log('Correctifs inclus: retour lobby → scénarios + sélection de rôle neutre sur 001–020.');
console.log('Étapes suivantes: migrer les SQL v13 sur une base de test puis faire une régression iPhone/PWA.');
