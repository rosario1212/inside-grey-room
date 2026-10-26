// Validation reproductible du module de carte financière OMERTÀ 021.
// Exécution : node scripts/omerta-money-intel-021-check.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const js=fs.readFileSync('omerta-money-intel-v1.js','utf8');
const sql=fs.readFileSync('supabase/migrations/20261026233500_omerta_money_intel_021.sql','utf8');
const index=fs.readFileSync('index.html','utf8');
new vm.Script(js,{filename:'omerta-money-intel-v1.js'});
assert.match(index,/omerta-money-intel-v1\.js/);
assert.match(index,/omerta-money-intel-v1\.css/);
assert.match(sql,/p\.player_token|player_token=p_player_token/);
assert.match(sql,/for update/);
assert.match(sql,/r\.cycle<2/);
assert.match(sql,/p\.internal_slot=1/);
assert.match(sql,/p\.internal_slot=7/);
assert.match(sql,/one_intel_per_cycle/);
assert.match(sql,/intel_already_received/);
assert.match(sql,/first_official_delivery/);
assert.match(sql,/truth_verified/);
assert.match(sql,/match_no/);
assert.match(sql,/'private',receiver\.id/);
assert.match(sql,/revoke all on function public\.igr_omerta_money_intel_send/);
assert.doesNotMatch(js,/textarea|contenteditable/i); // Aucun renseignement libre non validable

function simulate({scenario_id='021',cycle=2,role='suspect',
  hide='Tu sais que l’argent devait en partie remonter vers le cercle de Rinaldi.'}={}){
  const created=[];
  const el=tag=>{
    const node={tag,textContent:'',className:'',children:[],events:{},isConnected:true,
      addEventListener(k,fn){this.events[k]=fn;},setAttribute(){},
      append(...xs){for(const x of xs){x.parent=this;this.children.push(x);}},
      appendChild(x){x.parent=this;this.children.push(x);return x;},
      replaceChildren(...xs){this.children=xs;for(const x of xs)x.parent=this;},
      insertBefore(x,y){const i=this.children.indexOf(y);this.children.splice(i<0?this.children.length:i,0,x);x.parent=this;},
      remove(){this.isConnected=false;if(this.parent)this.parent.children=this.parent.children.filter(x=>x!==this);},
      querySelector(sel){return sel==='.igr-money-intel-entry'?this.children.find(x=>x.className.includes('igr-money-intel-entry'))||null:null}
    };created.push(node);return node;
  };
  const dock=el('div'),body=el('body');
  const doc={body,readyState:'complete',createElement:el,addEventListener(){},
    querySelector:sel=>sel==='.omerta-decision-dock'?dock:body.children.find(x=>x.className==='modal igr-money-intel-modal')||null};
  const state={token:'TOKEN',sync:{room:{code:'TEST1',scenario_id,status:'playing',cycle,phase:'interrogation'},
    player:{id:'PLAYER1',public_role:role,private_state:{hide}}}};
  const calls=[];
  const rpc=async(name,args)=>{
    calls.push({name,args});
    return name==='igr_omerta_money_intel_options'
      ? {cards:[{id:'021_money_route',title:'Les transferts d’argent',detail:'Circuit financier'}]}
      : {ok:true};
  };
  vm.runInNewContext(js,{
    document:doc,window:{addEventListener(){}},MutationObserver:class{observe(){}},
    STATE:state,rpc,syncNow:async()=>{},confirm:()=>true,console
  });
  return {dock,created,calls};
}
const cases=[
  [{},true],
  [{cycle:1},false],
  [{scenario_id:'022'},false],
  [{role:'enqueteur'},false],
  [{hide:'Secret sans lien avec les paiements.'},false],
  [{hide:'Les comptes indiquent une somme supplémentaire qui ne figure dans aucun registre.'},true]
];
for(const [args,expected] of cases){
 const s=simulate(args);assert.equal(!!s.dock.children.find(x=>x.className.includes('igr-money-intel-entry')),expected);
}
const demo=simulate();
await demo.dock.children[0].events.click();
const send=demo.created.find(x=>x.textContent==='Transmettre à l’Enquêteur');
assert.ok(send);
await send.events.click();
assert.equal(demo.calls[0].name,'igr_omerta_money_intel_options');
assert.equal(demo.calls[1].name,'igr_omerta_money_intel_send');
assert.equal(demo.calls[1].args.p_card_id,'021_money_route');
console.log('OMERTÀ 021 — PASS : contrôles statiques + parcours client simulé');
