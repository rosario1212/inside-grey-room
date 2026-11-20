import assert from 'node:assert/strict';
import {readFile,mkdir} from 'node:fs/promises';
import {chromium} from 'playwright';
const read=n=>readFile(n,'utf8');
const app=await read('app-v11.js'),role=await read('role-tree-polish-v12-29.js'),ui=await read('lobby-ui-fix-v13.js');
const r0=app.indexOf('const ROLE_LABEL_TO_ID='),r1=app.indexOf('const ROLE_INFO =',r0);
const l0=app.indexOf('function lobbyThemeForScenario('),l1=app.indexOf('let LOBBY_KICK_BUSY=false',l0);
assert(r0>=0&&r1>r0&&l0>=0&&l1>l0);
assert(!role.includes('animateFrom(')&&!role.includes('restoreRoleAnchor('));
const runtime=app.slice(r0,r1)+'\n'+app.slice(l0,l1);
const wrapper=ui.slice(0,ui.indexOf('/* v13.5'));
const css=(await Promise.all(['styles-v11.css','role-tree-polish-v12-29.css','lobby-ui-fix-v13.css','screen-polish-v73.css'].map(read))).join('\n');
const setup="\nvar STATE={view:'lobby',hostToken:'H',token:'T',room:'QA',sync:null},SOUND={enabled:false};\nvar SCENARIO_ROLES=Object.fromEntries(['001','004','009'].map(id=>[id,{required:['Enquêteur','3 suspects'],optional:['Analyste','Expert']}]));\nwindow.IGR_LOCALE='fr';window.__qaCount=0;\nfunction h(x){return String(x??'').replace(/[&<>\"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[ch]));}\nfunction roleInfo(id){return {label:({enqueteur:'Enquêteur',analyste:'Analyste',suspect:'Suspect',expert:'Expert'}[id]||id),short:'Présentation courte du rôle.',body:'Fiche complète du rôle.'};}\nfunction scenario(id){return{id,title:'Dossier '+id}}\nfunction byId(id){return document.getElementById(id)}\nfunction shell(x){return x}\nfunction avatarHtml(){return '<span>●</span>'}\nfunction publicRoleLabel(id){return roleInfo(id).label}\nfunction publicScenarioSummary(){return 'Résumé public.'}\nfunction ensureAmbient(){}function toast(){}function leaveRoom(){}function kickLobbyPlayer(){}function startGame(){}\nfunction chooseFourPlayerMode(mode){STATE.sync.room.state.four_player_mode=mode;STATE.sync.players.forEach(p=>p.preferred_role=null);renderLobby(STATE.sync);}\nwindow.__qaSet=function(id,count,mode){\n const players=Array.from({length:count},(_,i)=>({id:'P'+i,pseudo:'Joueur '+i,preferred_role:null,is_host:i===0}));\n STATE.room='QA'+id;\n STATE.sync={room:{scenario_id:id,code:'QA123',status:'lobby',min_players:4,max_players:5,state:{four_player_mode:mode}},player:players[0],players};\n renderLobby(STATE.sync);\n};\nwindow.chooseLobbyRole=async function(role){\n const b=document.querySelector('.role-choice-card[data-role-id=\"'+role+'\"]');\n if(!b||b.disabled)throw Error('Rôle non disponible: '+role);\n b.classList.add('igr-role-pending');\n await new Promise(r=>setTimeout(r,120));\n STATE.sync.players[0].preferred_role=role;\n renderLobby(STATE.sync);\n window.__qaCount++;\n};\nwindow.chooseRandomLobbyRole=()=>window.chooseLobbyRole('suspect');\n";
await mkdir('layout-check-results',{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
let passed=0;
try{
 for(const width of [375,390]){
 const context=await browser.newContext({viewport:{width,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2});
 const page=await context.newPage();
 for(const id of ['001','004','009']){
  await page.goto('about:blank');
  await page.setContent('<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>'+css+'</style></head><body><div style="height:240px"></div><div id="app"></div></body></html>');
  await page.addScriptTag({content:setup+'\n'+runtime});
  await page.addScriptTag({content:role});
  await page.addScriptTag({content:wrapper});
  await page.evaluate(id=>window.__qaSet(id,1,'classic'),id);
  assert.equal(await page.locator('.igr-role-preview').count(),1,'Preview '+id+' 1 player');
  await page.evaluate(id=>window.__qaSet(id,4,'classic'),id);
  assert.equal(await page.locator('.igr-role-preview').count(),1,'Preview '+id+' classic');
  assert.equal(await page.locator('.igr-roster-variant').count(),2,'Composition cards '+id);
  await page.locator('.igr-four-mode .role-choice-card').filter({hasText:'Enquête en équipe'}).click();
  assert.equal(await page.locator('.igr-role-preview').count(),0,'Preview in team '+id);
  assert.equal(await page.locator('.role-choice-card[data-role-id="analyste"]').count(),1,'Analyste missing '+id);
  for(const choice of ['analyste','suspect','enqueteur']){
   const btn=page.locator('.role-choice-card[data-role-id="'+choice+'"]');
   await btn.scrollIntoViewIfNeeded();
   await page.waitForTimeout(80);
   const before=await btn.boundingBox(),startScroll=await page.evaluate(()=>scrollY);
   assert(before&&before.y>0&&before.y+before.height<844,'Tap out of view '+id+'/'+choice);
   await page.evaluate(roleName=>{
    window.__samples=[];window.__sampling=true;window.__roleName=roleName;
    function measure(){if(!window.__sampling)return;const e=document.querySelector('.role-choice-card[data-role-id="'+window.__roleName+'"]');if(e)window.__samples.push([e.getBoundingClientRect().top,scrollY]);requestAnimationFrame(measure)}requestAnimationFrame(measure);
   },choice);
   const clicks=await page.evaluate(()=>window.__qaCount);
   await page.touchscreen.tap(before.x+before.width/2,before.y+before.height/2);
   await page.waitForFunction(old=>window.__qaCount>old,clicks,{timeout:5000});
   await page.waitForTimeout(260);
   const after=await btn.boundingBox();
   const sample=await page.evaluate(()=>{
    window.__sampling=false;
    const tops=window.__samples.map(x=>x[0]),scrolls=window.__samples.map(x=>x[1]);
    return {top:Math.max(...tops)-Math.min(...tops),scroll:Math.max(...scrolls)-Math.min(...scrolls),role:document.querySelector('.role-choice-card.selected')?.dataset.roleId,frames:tops.length};
   });
   assert(after&&Math.abs(after.y-before.y)<=5,id+'/'+width+'/'+choice+' card jumped '+(after?.y-before.y)+'px');
   assert(sample.top<=5&&sample.scroll<=5,id+'/'+width+'/'+choice+' motion: '+JSON.stringify(sample));
   assert.equal(sample.role,choice,id+'/'+width+' wrong role selected');
   assert(Math.abs((await page.evaluate(()=>scrollY))-startScroll)<=5,'Scroll moved after role tap');
   console.log('PASS TOUCH',id,width,choice,JSON.stringify(sample));passed++;
  }
  await page.evaluate(id=>window.__qaSet(id,5,'classic'),id);
  assert.equal(await page.locator('.role-choice-card[data-role-id="analyste"]').count(),1,'Five-player Analyst missing '+id);
  assert.equal(await page.locator('.igr-four-mode').count(),0,'Team-4 choice should disappear at five');
  if(id==='001'&&width===390)await page.screenshot({path:'layout-check-results/iphone-001-team4.png',fullPage:true});
 }
 await context.close();
 }
 assert.equal(passed,18);
 console.log('PASS: 18 emulated tactile clicks at 375px and 390px; 001/004/009; no role-card jumps');
}catch(e){console.error('FAIL iPhone role selection QA:',e.stack);process.exitCode=1}finally{await browser.close()}
