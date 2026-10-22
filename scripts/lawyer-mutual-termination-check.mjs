import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import path from 'node:path';

const source=await readFile(path.resolve(process.argv[2]||'dist','lawyer-dismissal-v45.js'),'utf8');
let checks=0;
for(const scenario of ['016','030','031'])for(const locale of ['fr','en'])for(const role of ['suspect','maitre']){
 let consent=false,requests=[],prompt='',response;
 const penalty=role==='maitre'&&scenario!=='016';
 const peer={id:'peer-id',pseudo:'PEER <img src=x>'};
 const context=vm.createContext({console,setInterval:()=>0,setTimeout:()=>0,
  document:{querySelector:()=>null,getElementById:()=>null},
  MutationObserver:class{observe(){}},addEventListener(){}});
 context.window=context;
 context.IGR_LOCALE=locale;
 context.STATE={room:'QA123',token:'OWN_TOKEN',sync:{room:{code:'QA123',scenario_id:scenario,status:'playing'},player:{id:'own-id',public_role:role}}};
 response={role,can_end_representation:true,cartel_penalty_on_withdraw:penalty,cartel_forfeit:false,[role==='maitre'?'client':'lawyer']:peer};
 context.confirm=value=>{prompt=value;return consent};
 context.rpc=async(name,args)=>{
  if(name==='igr_v45_lawyer_state')return response;
  requests.push({name,args});
  response={...response,can_end_representation:false,last_termination:{peer_pseudo:peer.pseudo}};
  return {ok:true,status:'ended'};
 };
 vm.runInContext(source,context);
 const api=context.IGR_LAWYER_TERMINATION_V170;
 await api.refresh(true);
 let html=api.renderControls();
 assert.match(html,role==='maitre'?/Cesser de représenter|Stop representing/:/Renvoyer l’avocat|Dismiss the lawyer/);
 assert.equal(/tuer ta famille|kill your family/.test(html),penalty);
 assert(html.includes('PEER &lt;img src=x&gt;'));
 assert(!html.includes('<img src=x>'));
 await api.endRepresentation('peer-id');
 assert.equal(requests.length,0,'Cancel must not call mutation');
 assert.equal(/définitive|final/.test(prompt),penalty);
 consent=true;
 await api.endRepresentation('stale-peer');
 assert.equal(requests.length,0,'Stale screen must not terminate another relationship');
 await api.endRepresentation('peer-id');
 assert.equal(requests.length,1);
 assert.equal(requests[0].name,'igr_v170_end_representation');
 assert.equal(requests[0].args.p_peer_id,'peer-id');
 assert.equal(requests[0].args.p_acknowledge_cartel,penalty);
 assert.equal(requests[0].args.p_player_token,'OWN_TOKEN');
 html=api.renderControls();
 assert.match(html,/REPRÉSENTATION TERMINÉE|REPRESENTATION ENDED/);
 assert(!html.includes('onclick='));
 assert(!html.includes('<img src=x>'));
 response={...response,cartel_forfeit:penalty};
 await api.refresh(true);
 html=api.renderControls();
 assert.equal(/DÉFAITE PERSONNELLE|PERSONAL DEFEAT/.test(html),penalty);
 response={...response,can_end_representation:false};
 await api.refresh(true);
 await api.endRepresentation('peer-id');
 assert.equal(requests.length,1,'No action once unavailable');
 assert(!/plus demander de nouvel avocat officiel/.test(source));
 checks++;
}
console.log(`LAWYER termination PASS: ${checks} FR/EN role/scenario flows, confirmation, stale partner, RPC acknowledgement and permanent defeat.`);
