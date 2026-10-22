import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';

const target=path.resolve(process.argv[2]||'dist');
const source=await readFile(path.join(target,'cartel031-v171.js'),'utf8');
function harness(){
 const handlers={},nodes=new Map(),elements={};
 const document={addEventListener:(event,handler)=>(handlers[event]??=[]).push(handler),getElementById:id=>elements[id]||nodes.get(id)||null,
  head:{appendChild(){}},body:{appendChild(node){nodes.set(node.id,node)}},
  createElement:()=>({setAttribute(){},querySelector:()=>({addEventListener(){}}),remove(){nodes.delete(this.id)}})};
 const context=vm.createContext({document,setTimeout:()=>0,setInterval:()=>0,console,STATE:{}});
 Object.assign(context,{window:context,addEventListener(){},confirm:()=>true,renderGame(){},gameTabs:()=>[],renderGameTab:()=>'<p>OTHER TAB</p>',
  leaveRoom(){context.STATE={}},sessionStorage:{getItem:()=>null}});
 vm.runInContext(source,context);
 const set=(room='ROOM1',id='e',role='enqueteur',match=1)=>{context.STATE={room,token:'token-'+id,tab:'cartel031',sync:{room:{scenario_id:'031',status:'playing',state:{cartel031_ready:true,match_no:match}},player:{id,public_role:role}}}};
 const state=(marker='PRIVATE FIRST')=>({enabled:true,role:'enqueteur',open:true,crisis:true,proof:{title:marker,text:marker},crew:[{id:'e',pseudo:'E'},{id:'a',pseudo:'A'}],plan:{mode:'wait'},
  locations:[{id:'x',label:'X'},{id:'y',label:'Y'}],approaches:[{id:'direct',label:'DIRECT'},{id:'isolate',label:'ISOLATE'}],assault_options:[{id:'outside',label:'OUTSIDE'},{id:'chief',label:'CHIEF'}],suspects:[{id:'s1',pseudo:'S1'}]});
 const change=(id,value)=>{elements[id]={value};for(const handler of handlers.change||[])handler({target:{id,value}})};
 set();return {context,api:context.IGR_CARTEL031,set,state,change,nodes};
}
// Switching roles or players never renders an already fetched private dossier.
{
 const h=harness();h.context.rpc=async()=>h.state();await h.api.refresh();
 assert(h.context.renderGameTab().includes('PRIVATE FIRST'));
 h.set('ROOM1','s1','suspect');
 assert(!h.context.renderGameTab().includes('PRIVATE FIRST'),'previous player dossier survived a role change');
 assert(!h.nodes.has('igr031PrivateProof'),'previous player modal survived a role change');
}
// A late response for another session cannot overwrite the current session.
{
 const h=harness(),pending=[];h.context.rpc=()=>new Promise(resolve=>pending.push(resolve));
 const old=h.api.refresh();h.set('ROOM2','a','analyste');const fresh=h.api.refresh();
 assert.equal(pending.length,2,'old request blocked the new player');
 pending[1]({...h.state('PRIVATE CURRENT'),role:'analyste'});await fresh;
 pending[0](h.state('PRIVATE OLD'));await old;
 const html=h.context.renderGameTab();assert(html.includes('PRIVATE CURRENT'));assert(!html.includes('PRIVATE OLD'));
}
// A rematch clears the previous proof before its new server response arrives.
{
 const h=harness();h.context.rpc=async()=>h.state();await h.api.refresh();
 h.set('ROOM1','e','enqueteur',2);assert(!h.context.renderGameTab().includes('PRIVATE FIRST'));assert(!h.nodes.has('igr031PrivateProof'));
}
// Leaving a room removes its modal immediately, without waiting for a poll.
{
 const h=harness();h.context.rpc=async()=>h.state();await h.api.refresh();assert(h.nodes.has('igr031PrivateProof'));
 h.context.leaveRoom();assert(!h.nodes.has('igr031PrivateProof'));
}
// Polling preserves unsaved input, but never submits it without a button click.
{
 const h=harness();let revision=0,calls=0;h.context.rpc=async name=>{calls++;assert.equal(name,'igr_v171_031_state');return {...h.state(),votes_received:revision++}};
 await h.api.refresh();
 for(const [id,value] of Object.entries({c031Vote:'a',c031Mode:'intervene',c031Location:'y',c031Approach:'isolate',c031Assault:'chief','c031Terms-s1':'prison'}))h.change(id,value);
 await h.api.refresh();const html=h.context.renderGameTab();
 for(const value of ['a','intervene','y','isolate','chief','prison'])assert(html.includes('value="'+value+'" selected'),value+' draft was lost during polling');
 assert.equal(calls,2);
 h.set('ROOM2','e');assert(!h.context.renderGameTab().includes('value="a" selected'),'draft crossed rooms');
}
// Failed submissions retain the draft; successful ones use server confirmation.
{
 const h=harness();let submitted=false,fail=true;
 h.context.rpc=async(name)=>{if(name.endsWith('_act')){if(fail)throw Error('offline');submitted=true;return {ok:true}}return {...h.state(),own_ballot:submitted?'e':null}};
 await h.api.refresh();h.change('c031Vote','a');await h.api.act('vote',{});assert(h.context.renderGameTab().includes('value="a" selected'));
 fail=false;await h.api.act('vote',{});const html=h.context.renderGameTab();assert(html.includes('value="e" selected'));assert(!html.includes('value="a" selected'));
}
// Editing while an earlier submission travels over the network remains a draft.
{
 const h=harness();let acknowledge;h.context.rpc=async name=>name.endsWith('_act')?new Promise(resolve=>{acknowledge=resolve}):({...h.state(),own_ballot:'a'});
 await h.api.refresh();h.change('c031Vote','a');const saving=h.api.act('vote',{});h.change('c031Vote','e');acknowledge({ok:true});await saving;
 assert(h.context.renderGameTab().includes('value="e" selected'),'an older acknowledgement erased a newer draft');
}
console.log('CARTEL 031 session PASS: player changes, late responses, rematches, immediate exit privacy, draft preservation and submission acknowledgement.');
