// Generate self-contained CARTEL posters from the approved original artwork.
// Embedded WebP keeps the approved images intact; the single enlarged lower dossier label stays sharp SVG vector text.
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';

const POSTERS=[
  ['029','cartel-029-le-cycle-mort.webp'],
  ['030','cartel-030-la-cour-achetee.webp'],
  ['031','cartel-031-la-dette.webp']
];

export async function buildCartelPosterAssets(root=process.cwd()){
  const folder=path.join(root,'assets');
  await mkdir(folder,{recursive:true});
  for(const [id,original] of POSTERS){
    const image=(await readFile(path.join(folder,original))).toString('base64');
    const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="724" height="724" viewBox="0 0 724 724" role="img" aria-label="Inside Grey Room CARTEL dossier ${id}">
<defs>
<linearGradient id="dossierBackdrop" x1="0" y1="0" x2="1" y2="0">
<stop offset="0" stop-color="#100b07" stop-opacity="0"/>
<stop offset=".13" stop-color="#100b07" stop-opacity="1"/>
<stop offset=".87" stop-color="#100b07" stop-opacity="1"/>
<stop offset="1" stop-color="#100b07" stop-opacity="0"/>
</linearGradient>
</defs>
<image width="724" height="724" href="data:image/webp;base64,${image}"/>
<!-- Only one dossier label, enlarged directly above the poster title.
     No number or dossier caption below the CARTEL masthead. -->
<rect x="205" y="565" width="314" height="44" fill="url(#dossierBackdrop)"/>
<text x="362" y="601" text-anchor="middle" fill="#e9c56e"
 font-family="Georgia,Times New Roman,serif" font-size="36" font-weight="700"
 letter-spacing="1.6" text-rendering="geometricPrecision"
 stroke="#0b0805" stroke-width="1" paint-order="stroke fill">DOSSIER ${id}</text>
</svg>`;
    await writeFile(path.join(folder,`cartel-${id}-poster-v2.svg`),svg,'utf8');
  }
}

if(process.argv[1]&&path.resolve(process.argv[1])===new URL(import.meta.url).pathname){
  await buildCartelPosterAssets();
  console.log('CARTEL 029–031 posters generated');
}
