import fs from 'node:fs';

const mustContain=(file,needles)=>{const text=fs.readFileSync(file,'utf8');for(const needle of needles)if(!text.includes(needle))throw new Error(`${file} missing regression marker: ${needle}`)};
const mustNotContain=(file,needles)=>{const text=fs.readFileSync(file,'utf8');for(const needle of needles)if(text.includes(needle))throw new Error(`${file} contains forbidden regression marker: ${needle}`)};

mustContain('index.html',['omerta-v12-30.css?v=v12.33-omerta-regression','omerta-v12-30.js?v=v12.33-omerta-regression']);
mustContain('omerta-v12-30.js',[
  "typeof STATE!=='undefined'?STATE:null",
  "'021':'assets/omerta-021-l-enveloppe.webp?v=12.33-hq'",
  "'025':'assets/omerta-025-il-don.webp?v=12.33-hq'",
  'crypto.getRandomValues','limit=max-(max%length)','randomBusy','igr_omerta_choose_role','role_assignment_conflict',
  "enqueteur:{body:'Tu conduis les interrogatoires","analyste:{body:'Tu repères les contradictions","suspect:{body:'Tu protèges ta position",
  "maitre:{label:'Avocat'","procureur:{body:'Tu exploites les contradictions","juge:{body:'Tu arbitres les décisions","informateur:{label:'Informateur'",
  "origin='base'","collection='original'","collection='modern'","collection='omerta'",
  "FILTER_KEY='igr_scenario_filter_v1'",'data-filter','data-dlc-filter','omerta-tree-v1233',"objectFit='cover'","imageRendering='auto'"
]);
mustNotContain('omerta-v12-30.js',['Math.random(','-hd.svg']);
mustContain('omerta-v12-30.css',[
  '--omerta-red:#a92f35','--omerta-red-strong:#c53d43','--omerta-red-selected:rgba(118,17,24,.58)',
  '.igr-omerta-active .omerta-role-status','linear-gradient(135deg,var(--omerta-red-bg-1),var(--omerta-red-bg-2))',
  'image-rendering:auto!important','.igr-scenario-filter','min-height:44px','omerta-tree-v1233'
]);
mustNotContain('omerta-v12-30.css',['image-rendering:pixelated','image-rendering:crisp-edges']);
mustContain('service-worker.js',["igr-v12-33-omerta-regression",'/omerta-v12-30.js?v=v12.33-omerta-regression','/assets/omerta-025-il-don.webp?v=12.33-hq']);

const posterFiles=['assets/omerta-021-l-enveloppe.webp','assets/omerta-022-omerta.webp','assets/omerta-023-la-table.webp','assets/omerta-024-il-pentito.webp','assets/omerta-025-il-don.webp'];
function webpSize(file){const b=fs.readFileSync(file);if(b.subarray(0,4).toString()!=='RIFF'||b.subarray(8,12).toString()!=='WEBP')throw new Error(`${file} is not a valid WebP`);const kind=b.subarray(12,16).toString();if(kind==='VP8 ')return[b.readUInt16LE(26)&0x3fff,b.readUInt16LE(28)&0x3fff];if(kind==='VP8L'){const bits=b.readUInt32LE(21);return[(bits&0x3fff)+1,((bits>>14)&0x3fff)+1]}if(kind==='VP8X')return[1+b.readUIntLE(24,3),1+b.readUIntLE(27,3)];throw new Error(`${file} has unsupported WebP chunk ${kind}`)}
for(const file of posterFiles){const [w,h]=webpSize(file);if(w<1000||h<1300)throw new Error(`${file} is too small for iPhone poster use: ${w}x${h}`);if(w*4!==h*3)throw new Error(`${file} is not 3:4: ${w}x${h}`)}

console.log('v12.33 targeted OMERTA regression markers and poster dimensions OK');
