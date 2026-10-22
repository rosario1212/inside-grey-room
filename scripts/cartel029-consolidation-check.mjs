import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';

// No fake passing human QA: this test validates shipped role guards,
// client renderings and migration contracts, not real physical-device play.
const path='cartel029-v121.js';
const client=await readFile(path,'utf8');
const migrations=[
  '20261019190000_v154_cartel029_final_phases.sql',
  '20261019191000_v155_cartel029_leadership_decision.sql',
  '20261019192000_v156_cartel029_outcomes_roles.sql',
  '20261019193000_v157_cartel029_journalist_final_angle.sql'
];
const sql=await Promise.all(migrations.map(n=>readFile('supabase/migrations/'+n,'utf8')));
assert.equal(spawnSync(process.execPath,['--check',path],{encoding:'utf8'}).status,0);
assert(sql[0].includes("r.scenario_id='029'"));
assert(sql[0].includes('PAROLE FINALE DES TÉMOINS'));
assert(sql[0].includes('vote_req:=0'));
assert(sql[1].includes('public.igr_v155_029_leadership_decision'));
assert(sql[1].includes("action_type='cartel029_leadership'"));
assert(sql[1].includes("p_token")&&sql[1].includes("a.public_role"));
assert(sql[1].includes('REVOKE ALL')&&sql[1].includes('GRANT EXECUTE'));
assert(sql[2].includes('breaking_news_manual')&&sql[2].includes('source_basis'));
assert(sql[2].includes('final_angle_len,0)>=24'));
assert(sql[2].includes("leader_choice='contain'")&&sql[2].includes("leader_choice='loyal'"));
assert(sql[2].includes("leader_choice='cooperate'"));
assert(sql[3].includes('CASE WHEN is_029 THEN 24 ELSE 8 END'));
assert(!client.includes('P14-V5')&&!client.includes('La décision locale'),'Public client must not include private solution');

const mk = (role,count,phase='interrogation_select',cycle=2,actions=[])=>{
  const sync={room:{code:'TEST029',scenario_id:'029',status:'playing',phase,cycle,
    min_players:6,max_players:12,state:{cartel029_ready:true}},
    player:{public_role:role,private_state:role==='suspect'?{'029_witness_index':4,'029_can_decide':true}:{}},
    players:[],events:[],my_actions:actions,suspects:[]};
  const scope={
    STATE:{sync,tab:'card',token:'fake-test-token'},
    document:{createElement:()=>({textContent:'',id:''}),head:{appendChild(){}},getElementById:()=>null},
    console:{warn(){}},rpc:async()=>({ok:true}),syncNow:async()=>{},toast(){},
    IGR_LOCALE:'fr',
    renderGameTab(){return'<div>Base</div>'},
    renderReveal(){return'<div>Reveal</div>'},
    renderFinalLockForm(){return'<div>Legacy final</div>'},
    phaseLabel(v){return 'LEGACY '+v},
    roleInfo(v){return {label:v,body:'Legacy'}},
    displayRole(r,p){return r+' · '+p},
    publicRoleLabel(r){return r},
    privateCardHtml(){return '<div>Legacy private</div>'},
    renderInterrogationSelect(){return'<div>Suspects restant à entendre</div>'},
    levelsForm(){return '<p>Legacy levels</p>'},
    collectLevels(){return {}},
    renderProvisionalForm(){return'<p>Legacy provisional</p>'},
  };
  scope.window=scope;vm.createContext(scope);vm.runInContext(client,scope);
  return scope;
};
let checks=0;
for(let size=6;size<=12;size++){
  const roles=['enqueteur','analyste','suspect','maitre','procureur','juge','journaliste','don','bras_droit'];
  for(const role of roles){
    const s=mk(role,size);
    if(['don','bras_droit'].includes(role)){
      const html=s.renderGameTab();
      assert(html.includes('Stratégie · cycle 2'));
      assert(html.includes('igr029LeaderDecision'));
      assert(html.includes(role==='don'?'Préserver le secret':'Rester loyal'));
      if(role==='don'&&size===11)assert(!html.includes('igr029-compose'),
        'Do not show a leader-to-leader composer with no right-hand player');
      if(role==='don'&&size===12){
        s.STATE.sync.players=[{public_role:'bras_droit'}];
        assert(s.renderGameTab().includes('igr029-compose'),
          'Don/right-hand chat must appear when both roles are present');
      }
      const locked=mk(role,size,'interrogation_select',2,[{action_type:'cartel029_leadership',cycle:2}]);
      assert(locked.renderGameTab().includes('décision privée est enregistrée'));
      locked.STATE.sync.room.phase='locking';
      assert(!locked.renderGameTab().includes('igr029LeaderDecision'));
    }else if(role==='journaliste'){
      s.STATE.tab='investigation';
      assert(s.renderGameTab().includes('40 caractères'));
      assert(s.renderFinalLockForm().includes('minlength="24"'));
      assert(!s.renderFinalLockForm().includes('Responsabilité principale'));
    }else if(['enqueteur','analyste','procureur','juge'].includes(role)){
      assert(!s.renderFinalLockForm().includes('Legacy levels'));
      assert(s.renderFinalLockForm().includes('quatre témoins'));
    }
    assert.equal(s.phaseLabel('locking'),'CONCLUSIONS DU DOSSIER 029');
    assert.equal(s.phaseLabel('final_suspect_defenses'),'PAROLE FINALE DES TÉMOINS');
    checks++;
  }
}
const other=mk('journaliste',9);other.STATE.sync.room.scenario_id='028';
assert(other.renderFinalLockForm().includes('Legacy final'));
assert(other.phaseLabel('locking').includes('LEGACY locking'));
checks++;
console.log('CARTEL 029 consolidation PASS: '+checks+' role/render checks across 6–12 players; protected backend contracts, no private truth in client.');
