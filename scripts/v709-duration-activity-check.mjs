import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source=readFileSync('duration-modes-v35.js','utf8');
const guide=readFileSync('self-guided-rules-v51.js','utf8');
const roster=roles=>roles.map((public_role,i)=>({id:String(i),public_role}));
const players=['enqueteur','analyste','juge','maitre','suspect','suspect','suspect'];
const STATE={sync:{room:{state:{duration_mode:'short'}},players:roster(players)}};
const document={
 documentElement:{lang:'fr'},
 addEventListener(){},querySelectorAll(){return[]},querySelector(){return null}
};
const c={STATE,document,localStorage:{getItem(){return'{}'},setItem(){}},
 setTimeout(){},setInterval(){},queueMicrotask(){},
 MutationObserver:class{observe(){}},console:{info(){}}
};
c.window=c;vm.createContext(c);
vm.runInContext(source,c);
assert.equal(c.IGR_DURATION_MODES_V35.estimate('short'),'≈ 45–70 min');
assert.equal(c.IGR_DURATION_MODES_V35.estimate('long'),'≈ 70–105 min');
STATE.sync.players.push({id:'additional',public_role:'expert'});
assert.equal(c.IGR_DURATION_MODES_V35.estimate('short'),'≈ 47–72 min');
assert.equal(c.IGR_DURATION_MODES_V35.estimate('long'),'≈ 72–107 min');
STATE.sync.players=roster(['enqueteur','analyste','procureur','maitre','suspect','suspect','suspect']);
assert.equal(c.IGR_DURATION_MODES_V35.estimate('short'),'≈ 40–55 min');
assert.equal(c.IGR_DURATION_MODES_V35.estimate('long'),'≈ 70–90 min');
for(const s of ['COURTROOM_ACTIVITY','activityRating(r,global)','stars(activityRating(r,global))','procureur:4','juge:4','maitre:4','analyste:4','expert:3','temoin:3']){
 assert.ok(guide.includes(s),'Missing contextual activity: '+s);
}
assert.ok(!source.includes('judicialAudienceCount'),'Timed judge hearing estimate must be gone');
console.log('v709 duration + role activity: COURT/LONG, judge/no-judge regressions OK');
