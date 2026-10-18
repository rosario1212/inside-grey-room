// Generate self-contained CARTEL posters from the approved original artwork.
// Embedded WebP keeps the approved images intact; number labels remain native sharp SVG vectors.
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
<filter id="soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="17"/></filter>

</defs>
<image width="724" height="724" href="data:image/webp;base64,${image}"/>
<ellipse cx="362" cy="142" rx="112" ry="41" fill="#080705" opacity=".68" filter="url(#soft)"/>
<g text-anchor="middle" fill="#e6bf69" text-rendering="geometricPrecision">
<text x="362" y="149" font-family="Arial,Helvetica,sans-serif" font-size="52" font-weight="900" letter-spacing="1">${id}</text>
<text x="362" y="166" font-family="Arial,Helvetica,sans-serif" font-size="15" font-weight="900" letter-spacing="4">DOSSIER</text>
</g>
</svg>`;
    await writeFile(path.join(folder,`cartel-${id}-poster-v2.svg`),svg,'utf8');
  }
}

if(process.argv[1]&&path.resolve(process.argv[1])===new URL(import.meta.url).pathname){
  await buildCartelPosterAssets();
  console.log('CARTEL 029–031 posters generated');
}
