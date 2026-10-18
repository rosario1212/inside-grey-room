// Verify that only CARTEL receives the dossier-detail gold typography in multiplayer.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve(process.argv[2]||'.');
const css=await readFile(path.join(root,'dlc-suite-v12-40.css'),'utf8');
const app=await readFile(path.join(root,'app-v11.js'),'utf8');
const dlc=await readFile(path.join(root,'dlc-suite-v12-37.js'),'utf8');
for(const selector of [
 'body.igr-theme-cartel #app .page-head.lobby-head h1',
 'body.igr-theme-cartel #app .page-head.game-head-v11 h1',
 'body.igr-theme-cartel #app .briefing-page .briefing-card h1'
])assert(css.includes(selector),'Missing scoped multiplayer heading: '+selector);
assert(css.includes('background:linear-gradient(180deg,#fff1ba,#c38a3b 72%,#e9b966)!important'),'Multiplayer gold must match the detail title');
assert(css.includes('-webkit-text-fill-color:transparent!important'),'Gradient text is missing');
assert(css.includes('max-width:100%'),'Title may overflow small screens');
assert(app.includes('class="page-head lobby-head"'),'Lobby heading markup changed');
assert(app.includes('class="page-head game-head-v11"'),'Game heading markup changed');
assert(app.includes('class="briefing-card"'),'Briefing heading markup changed');
assert(dlc.includes("if(n>=29&&n<=31)return 'cartel'")||app.includes("if(n>=29&&n<=31)return 'cartel'"),'CARTEL lobby theme missing');
assert(dlc.includes('body.classList.toggle(`igr-theme-${theme}`,theme===collection)'),'CARTEL body theme must follow the active room');
const section=css.slice(css.indexOf('/* CARTEL 029–031: keep the dossier-detail gold title'));
assert(section.startsWith('/* CARTEL 029–031:'),'Scoped CSS section missing');
assert(!/igr-theme-(terror|regime|omerta)/.test(section),'Other DLC themes must remain untouched');
console.log('CARTEL multiplayer title style verified: lobby, briefing, gameplay; other DLCs unchanged');
