// OMERTÀ V13 — In-memory behavior prototype, NOT a production API.
// Models informed choice and tests without modifying the actual game,
// user accounts, room state, Supabase data or private manuscripts.
export function makeTurncoatSimulation(playerIds = [], eligible = []) {
  const valid=new Set(playerIds);
  const canApply=new Set(eligible.filter(id=>valid.has(id)));
  const records=new Map(playerIds.map(id=>[id,{state:'none',offer:null,confirmationStarted:false}]));
  const fail=(m)=>{throw new Error(m)};
  let cycle=1,locked=false;
  const available=(id)=>{
    if(!valid.has(id)||!canApply.has(id))fail('ineligible');
    if(cycle<2)fail('before cycle 2');
    if(locked)fail('conclusions already locked');
  };
  const req=(id)=>{const x=records.get(id);if(!x)fail('unknown player');return x};
  const hasDisclosure=(offer)=>{
    const required=['fact_to_be_disclosed','potential_benefit','economic_and_social_risks','legal_risk_in_fiction','condition_of_protection','new_personal_win_condition','case_specific_exposure_route','what_is_unknown'];
    return offer&&required.every(k=>typeof offer[k]==='string'&&offer[k].trim().length>4);
  };
  return Object.freeze({
    cycle(n){if(!Number.isInteger(n)||n<cycle||n>3)fail('invalid cycle progression');cycle=n},
    preview(id){available(id);return Object.freeze({title:'Examine cooperation',cost:false,irreversible:false})},
    inspect(id,offer){
      available(id);
      if(!hasDisclosure(offer))fail('complete benefit/risk card required');
      const r=req(id);if(r.state==='committed')fail('already committed');
      r.offer=structuredClone(offer);
      r.state='inspected';r.confirmationStarted=false;
      return structuredClone(r.offer);
    },
    decline(id){
      available(id);
      const r=req(id);if(r.state==='committed')fail('committed cannot undo');
      r.state='none';r.offer=null;r.confirmationStarted=false;
      return {changed:false};
    },
    startConfirmation(id){
      available(id);
      const r=req(id);if(r.state!=='inspected')fail('must inspect risks first');
      r.confirmationStarted=true;
      return {confirmText:'I understand this transmission is irreversible',confirmRequired:true};
    },
    confirm(id,acknowledged){
      available(id);
      const r=req(id);if(r.state!=='inspected'||!r.confirmationStarted||acknowledged!==true)
        fail('explicit second confirmation required');
      r.state='committed';r.confirmationStarted=false;
      return {privateResult:true,irreversible:true};
    },
    privateState(id){return structuredClone(req(id))},
    publicSnapshot(){return {cycle,phaseLocked:locked,players:[...valid].map(id=>({id}))}},
    lock(){locked=true},
    countCommitted(){return [...records.values()].filter(x=>x.state==='committed').length}
  });
}
