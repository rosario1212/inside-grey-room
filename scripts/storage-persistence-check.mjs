import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const html=await readFile('index.html','utf8');
const script=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]).find(s=>s.includes('Storage.prototype'));
assert(script,'Storage routing must be tested from the shipped entry page');
function check({native=false,standalone=false}={}){
 class Storage{
  constructor(){this.values=new Map()}
  getItem(key){return this.values.get(String(key))??null}
  setItem(key,value){if(arguments.length<2)throw TypeError('Storage.setItem requires key and value');this.values.set(String(key),String(value))}
  removeItem(key){this.values.delete(String(key))}
 }
 const localStorage=new Storage(),sessionStorage=new Storage();
 vm.runInNewContext(script,{Storage,localStorage,sessionStorage,location:{protocol:native?'file:':'https:',hostname:'test.local',search:''},navigator:{},matchMedia:()=>({matches:standalone})});
 for(const key of ['igr_casino_identity_v1','igr_social_identity_v1','ordinary-preference']){
  localStorage.setItem(key,'value-'+key);assert.equal(localStorage.getItem(key),'value-'+key);assert.equal(sessionStorage.getItem(key),null);
 }
 for(const key of ['igr_v11_session','igr_v11_notes_room']){
  localStorage.setItem(key,'private-session');assert.equal(localStorage.getItem(key),'private-session');
  if(!native&&!standalone){assert.equal(localStorage.values.has(key),false);assert.equal(sessionStorage.getItem(key),'private-session')}
  else assert.equal(localStorage.values.get(key),'private-session');
 }
}
check();check({native:true});check({standalone:true});
console.log('Storage persistence: Casino/profile values survive writes; browser session privacy and native/PWA behavior preserved.');
