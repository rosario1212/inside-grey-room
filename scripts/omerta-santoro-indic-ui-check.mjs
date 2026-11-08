import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../omerta-money-intel-v1.js',import.meta.url),'utf8');
new vm.Script(source);

class Element {
  constructor(tag) {
    this.tagName=tag;this.children=[];this.parent=null;this.className='';this.textContent='';
    this.listeners={};this.value='';this.isConnected=false;this.disabled=false;
  }
  addEventListener(name,fn){this.listeners[name]=fn;}
  appendChild(child){
    if(child?.parent)child.remove();
    this.children.push(child);child.parent=this;child.isConnected=this.isConnected;
    if(this.tagName==='select'&&!this.value)this.value=child.value;
    return child;
  }
  append(...children){for(const child of children)this.appendChild(child);}
  insertBefore(child,target){if(!target)return this.appendChild(child);const at=this.children.indexOf(target);this.appendChild(child);this.children.splice(this.children.indexOf(child),1);this.children.splice(at,0,child);return child;}
  replaceChildren(...children){for(const child of this.children){child.parent=null;child.isConnected=false;}this.children=[];this.textContent='';this.append(...children);}
  remove(){if(!this.parent)return;const at=this.parent.children.indexOf(this);if(at>=0)this.parent.children.splice(at,1);this.parent=null;this.isConnected=false;}
  setAttribute(name,value){this[name]=value;}
  querySelectorAll(query){
    const classes=query.split(',').map(x=>x.trim()).filter(Boolean);
    const result=[];
    const scan=parent=>{for(const child of parent.children){
      if(classes.some(x=>x.startsWith('.')&&child.className.split(/\s+/).includes(x.slice(1))))result.push(child);
      scan(child);
    }};
    scan(this);return result;
  }
  querySelector(query){return this.querySelectorAll(query)[0]||null;}
  click(){return this.listeners.click?.({target:this});}
  allText(){return [this.textContent,...this.children.map(child=>child.allText())].join(' ');}
}

function sandbox(role,status){
 const handlers={};const calls=[];const body=new Element('body');body.isConnected=true;
 const dock=new Element('div');dock.className='omerta-decision-dock';body.appendChild(dock);
 const document={
  readyState:'loading',body,createElement:tag=>new Element(tag),
  addEventListener:(name,fn)=>{handlers[name]=fn;},
  querySelector:selector=>body.querySelector(selector)
 };
 const sync={
  room:{code:'QA',scenario_id:'024',status:'playing',cycle:2,phase:'discussion',state:{omerta_standalone:true,match_no:1}},
  player:{id:role==='enqueteur'?'investigator-id':'source-id',public_role:role},
  players:[{id:'source-id',pseudo:'Source Santoro',public_role:'suspect'}],events:[]
 };
 const data={status:structuredClone(status)};
 const scope={
  document,STATE:{sync,room:'QA',token:'qa-secret'},MutationObserver:class{observe(){}},
  window:{addEventListener(){}},console:{warn(){},error(){}},
  confirm:()=>true,syncNow:async()=>{},
  rpc:async(name,args)=>{
   calls.push({name,args});
   if(name==='igr_omerta_santoro_indic_status')return structuredClone(data.status);
   if(name==='igr_omerta_santoro_indic_action'){
    if(args.p_kind==='offer')data.status={available:true,offered:true,accepted:null,source_id:'source-id',can_offer:false};
    if(args.p_kind==='spoken'){
     for(const t of data.status.topics||[])if(t.id===args.p_topic_id)t.logged=true;
    }
    return {ok:true};
   }
   throw Error('Legacy or unexpected RPC was called: '+name);
  }
 };
 vm.runInNewContext(source,scope);
 handlers.DOMContentLoaded();
 return {document,body,dock,calls,data,button:text=>{
  const all=[];const scan=el=>{if(el.tagName==='button')all.push(el);for(const c of el.children)scan(c);};scan(body);
  const item=all.find(el=>el.textContent.includes(text));
  assert.ok(item,'Missing button '+text+' in '+all.map(x=>x.textContent).join(', '));
  return item;
 }};
}

const enq=sandbox('enqueteur',{available:true,offered:false,can_offer:true});
assert.ok(enq.dock.querySelector('.igr-santoro-indic-entry'));
assert.equal(enq.dock.querySelector('.igr-indic-offer-button'),null);
await enq.button('Indic · Pacte et protection').click();
await enq.button('Proposer le pacte secret').click();
assert.ok(enq.calls.some(x=>x.name==='igr_omerta_santoro_indic_action'&&x.args.p_kind==='offer'&&x.args.p_target==='source-id'));
assert.ok(enq.calls.every(x=>x.name.startsWith('igr_omerta_santoro_')),'An old Verri RPC was called by the standalone UI');

const investigator=sandbox('enqueteur',{available:true,offered:true,accepted:true,is_investigator:true,protected:true,
 source_id:'source-id',topics:[{title:'Témoin',detail:'PRIVATE_SECRET_MUST_NEVER_BE_SHOWN',logged:true}]});
await investigator.button('Indic · Pacte et protection').click();
assert.ok(!investigator.body.allText().includes('PRIVATE_SECRET_MUST_NEVER_BE_SHOWN'));

const informant=sandbox('suspect',{available:true,offered:true,is_source:true,accepted:true,protected:false,
 topics:[
  {id:'t1',title:'Mon fait privé',detail:'PRIVATE_ROLE_FACT',investigative_value:'actionable_candidate',logged:false,signaled:false},
  {id:'t2',title:'Contexte',detail:'BACKGROUND_FACT',investigative_value:'context_only',logged:false,signaled:false}
 ]});
assert.ok(!informant.body.allText().includes('PRIVATE_ROLE_FACT'),'The page must not leak role facts before opening the private dossier');
await informant.button('Indic · Mes renseignements').click();
assert.match(informant.body.allText(),/Fait potentiellement exploitable/);
assert.match(informant.body.allText(),/Élément de contexte/);
await informant.button("J'en ai déjà parlé · consigner").click();
assert.ok(informant.calls.some(x=>x.name==='igr_omerta_santoro_indic_action'&&x.args.p_kind==='spoken'&&x.args.p_topic_id==='t1'));
assert.ok(informant.calls.every(x=>x.name.startsWith('igr_omerta_santoro_')),'The standalone informant sent a legacy RPC');

console.log('OMERTÀ Santoro client: independent pact, secret UI, relevance labels and canonical spoken action OK');
