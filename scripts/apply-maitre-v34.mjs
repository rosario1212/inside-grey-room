import { cp, mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root=process.cwd();
const out=path.resolve(root,process.argv[2]||'dist');
const runtime=['heritage-maitre-data-v34.js','heritage-maitre-v34.css','heritage-maitre-v34.js'];
async function exists(file){try{await stat(file);return true}catch{return false}}
if(!(await exists(out)))throw new Error(`MAÎTRE target does not exist: ${out}`);
for(const name of runtime){
  const src=path.join(root,name);
  if(!(await exists(src)))throw new Error(`Missing MAÎTRE runtime: ${name}`);
  await cp(src,path.join(out,name));
}

const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const poster=(roman,title,kind)=>{
  const motifs={
    client:`<path d="M82 652L242 486 242 230 458 146 458 652Z" fill="#11100f"/><path d="M272 662L272 246 458 174 458 662Z" fill="#6d211e" opacity=".78"/><path d="M90 654L206 540 208 362 256 304 262 654Z" fill="#efe8da"/><path d="M95 655H448" stroke="#11100f" stroke-width="7"/><rect x="326" y="422" width="86" height="62" fill="#120f0e"/><path d="M326 422h86M340 448h58M340 462h42" stroke="#efe8da" stroke-width="4" opacity=".55"/>`,
    deal:`<path d="M62 640H478" stroke="#11100f" stroke-width="8"/><path d="M105 458L428 244" stroke="#11100f" stroke-width="30" stroke-linecap="round"/><path d="M391 269l58-38-27 65z" fill="#6d211e"/><rect x="114" y="392" width="250" height="180" rx="4" fill="#d9cdbb" stroke="#11100f" stroke-width="6"/><path d="M139 436h194M139 464h158M139 492h181M139 520h108" stroke="#11100f" stroke-width="7" opacity=".75"/><path d="M330 392L364 426 364 572 330 572Z" fill="#6d211e" opacity=".82"/>`,
    choices:`<path d="M76 660H466" stroke="#11100f" stroke-width="7"/><path d="M150 650L240 314H302L392 650" fill="#11100f"/><path d="M271 246c-28 0-46 19-46 44s18 44 46 44 46-19 46-44-18-44-46-44z" fill="#11100f"/><path d="M271 334v214" stroke="#efe8da" stroke-width="8" opacity=".65"/><path d="M271 484L166 594" stroke="#6d211e" stroke-width="10"/><path d="M271 484L376 594" stroke="#6d211e" stroke-width="10"/><path d="M98 650h346" stroke="#6d211e" stroke-width="9" opacity=".8"/>`,
    trial:`<path d="M270 226V590" stroke="#11100f" stroke-width="14"/><path d="M135 336H405" stroke="#11100f" stroke-width="11"/><path d="M154 336L100 470M386 336l54 134" stroke="#11100f" stroke-width="8"/><path d="M72 470h112c-4 54-26 88-56 88s-52-34-56-88z" fill="#11100f"/><path d="M356 470h112c-4 54-26 88-56 88s-52-34-56-88z" fill="#6d211e"/><path d="M386 532c20 18 34 45 41 83" stroke="#6d211e" stroke-width="18" stroke-linecap="round"/><path d="M208 650h124" stroke="#11100f" stroke-width="22"/>`,
    honor:`<path d="M126 640V352c0-70 48-116 144-116s144 46 144 116v288" fill="#11100f"/><rect x="166" y="300" width="208" height="246" rx="28" fill="#241f1c" stroke="#0c0b0b" stroke-width="8"/><path d="M236 260l-38 318M304 260l38 318" stroke="#efe8da" stroke-width="42"/><path d="M205 452c44 18 92 31 132 62M208 512c54-16 94-10 128 9" stroke="#6d211e" stroke-width="22" stroke-linecap="round" opacity=".88"/>`
  };
  return `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="540" height="960" viewBox="0 0 540 960"><defs><filter id="grain"><feTurbulence baseFrequency=".68" numOctaves="3" seed="17" type="fractalNoise"/><feColorMatrix values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 .045 0"/></filter></defs><rect width="540" height="960" fill="#efe8da"/><rect x="22" y="22" width="496" height="916" fill="none" stroke="#11100f" stroke-width="2" opacity=".68"/><text x="270" y="78" text-anchor="middle" font-family="Georgia,serif" font-size="18" letter-spacing="5" fill="#11100f">INSIDE GREY ROOM</text><text x="270" y="128" text-anchor="middle" font-family="Georgia,serif" font-size="16" letter-spacing="6" fill="#6d211e">HÉRITAGE</text><text x="270" y="188" text-anchor="middle" font-family="Georgia,serif" font-size="52" letter-spacing="3" fill="#11100f">MAÎTRE</text>${motifs[kind]||''}<text x="270" y="738" text-anchor="middle" font-family="Georgia,serif" font-size="25" fill="#6d211e">${esc(roman)}</text><text x="270" y="806" text-anchor="middle" font-family="Georgia,serif" font-size="34" font-weight="700" letter-spacing="1" fill="#11100f">${esc(title)}</text><path d="M150 838H390" stroke="#6d211e" stroke-width="3"/><rect width="540" height="960" filter="url(#grain)" opacity=".28"/></svg>`;
};
const posters=[
 ['heritage-maitre-01-le-client.svg','I','LE CLIENT','client'],
 ['heritage-maitre-02-le-deal.svg','II','LE DEAL','deal'],
 ['heritage-maitre-03-deux-choix.svg','III','DEUX CHOIX','choices'],
 ['heritage-maitre-04-le-proces.svg','IV','LE PROCÈS','trial'],
 ['heritage-maitre-05-l-honneur.svg','V','L’HONNEUR','honor']
];
const assetDir=path.join(out,'assets');
await mkdir(assetDir,{recursive:true});
for(const [name,roman,title,kind] of posters)await writeFile(path.join(assetDir,name),poster(roman,title,kind),'utf8');
const dataFile=path.join(out,'heritage-maitre-data-v34.js');
let data=await readFile(dataFile,'utf8');
data=data.replace(/heritage-maitre-(01-le-client|02-le-deal|03-deux-choix|04-le-proces|05-l-honneur)\.webp/g,'heritage-maitre-$1.svg');
await writeFile(dataFile,data,'utf8');

const css='  <link rel="stylesheet" href="heritage-maitre-v34.css?v=v34-maitre">';
const dataTag='  <script src="heritage-maitre-data-v34.js?v=v34-maitre"></script>';
const js='  <script src="heritage-maitre-v34.js?v=v34-maitre"></script>';
for(const page of ['index.html','en.html']){
  const file=path.join(out,page);let html=await readFile(file,'utf8');
  if(!html.includes('heritage-maitre-v34.css'))html=html.replace('</head>',`${css}\n</head>`);
  if(!html.includes('heritage-maitre-data-v34.js'))html=html.replace('</body>',`${dataTag}\n${js}\n</body>`);
  else if(!html.includes('heritage-maitre-v34.js'))html=html.replace('</body>',`${js}\n</body>`);
  await writeFile(file,html,'utf8');
}
console.log(`HÉRITAGE — MAÎTRE v34 applied to ${out} with 5 lightweight poster assets`);
