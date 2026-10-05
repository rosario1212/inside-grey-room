import {copyFile,readFile,stat,writeFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
const root=process.cwd(),target=path.resolve(root,process.argv[2]||'dist');
const VERSION='v53-gameplay-polish',CACHE='igr-v53-gameplay-polish';
const runtime='gameplay-polish-v53.js',style='gameplay-polish-v53.css',coordinator='runtime-coordinator-v53.js',pages=['index.html','en.html'];
const exists=async f=>{try{await stat(f);return true}catch{return false}};
if(!(await exists(target)))throw new Error(`v53 target missing: ${target}`);
for(const name of [runtime,style,coordinator])if(!(await exists(path.join(root,name))))throw new Error(`v53 source missing: ${name}`);
for(const name of [runtime,coordinator]){const parsed=spawnSync(process.execPath,['--check',path.join(root,name)],{encoding:'utf8'});if(parsed.status!==0)throw new Error(parsed.stderr||parsed.stdout)}
await copyFile(path.join(root,runtime),path.join(target,runtime));await copyFile(path.join(root,style),path.join(target,style));if(!(await exists(path.join(target,coordinator))))await copyFile(path.join(root,coordinator),path.join(target,coordinator));
for(const name of pages){const file=path.join(target,name);if(!(await exists(file)))continue;let html=await readFile(file,'utf8');
 html=html.replace(/\s*<link[^>]+href=["']gameplay-polish-v53\.css[^"']*["'][^>]*>\s*/gi,'\n');html=html.replace('</head>',`  <link rel="stylesheet" href="${style}?v=${VERSION}">\n</head>`);
 html¶»§q«^