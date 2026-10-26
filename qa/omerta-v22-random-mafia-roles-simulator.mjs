// OMERTA rank allocation — TEST-ONLY reference. NOT wired into rooms or Supabase.
// Server must provide CSPRNG, private facts, validated A/B/C slots and target cast.
const VALID = new Set(['associato','soldato','contabile','capo','consigliere','sottocapo','don']);
export function assignRandomSantoroPosts({playerIds,slots,random}={}){
 if(!Array.isArray(playerIds)||playerIds.length<1||playerIds.some(x=>typeof x!=='string'||!x.trim()))throw Error('invalid mafia players');
 if(new Set(playerIds).size!==playerIds.length)throw Error('duplicate players');
 if(!Array.isArray(slots)||slots.length<playerIds.length)throw Error('not enough authored role slots');
 if(typeof random!=='function')throw Error('server random source required');
 const seatIds=new Set(),goalIds=new Set(),factsIds=new Set();
 let donors=0;const caposByCrew=new Set();
 for(const seat of slots){
  if(!seat||typeof seat.slotId!=='string'||!seat.slotId||seatIds.has(seat.slotId))throw Error('duplicate or missing role slot');
  seatIds.add(seat.slotId);
  if(!VALID.has(seat.rank))throw Error('invalid rank: generic suspect not playable');
  if(seat.rank==='don'&&++donors>1)throw Error('one Don maximum');
  if(seat.rank==='capo'){
   if(!seat.crewId||caposByCrew.has(seat.crewId))throw Error('Capos must command different crews');
   caposByCrew.add(seat.crewId);
  }
  for(const k of ['initialGoalId','informantGoalId','privateFactsId']){
   const val=seat[k];const set=k==='privateFactsId'?factsIds:goalIds;
   if(typeof val!=='string'||!val||set.has(val))throw Error('duplicate or missing private objective/facts');
   set.add(val);
  }
  if(!seat.variantValidated||!seat.scoringValidated)throw Error('unvalidated variant role slot');
 }
 // Fisher–Yates uniform shuffle of ALREADY APPROVED positions, not ranks.
 const ordered=slots.slice();
 for(let i=ordered.length-1;i>0;i--){
  const unit=random();
  if(typeof unit!=='number'||!Number.isFinite(unit)||unit<0||unit>=1)throw Error('bad random');
  const j=Math.floor(unit*(i+1));
  [ordered[i],ordered[j]]=[ordered[j],ordered[i]];
 }
 return playerIds.map((playerId,i)=>({
  playerId,
  slotId:ordered[i].slotId,
  rank:ordered[i].rank,
  // Strictly illustrative private IDs. Public tree uses only pseudo+rank.
  initialGoalId:ordered[i].initialGoalId,
  informantGoalId:ordered[i].informantGoalId,
  privateFactsId:ordered[i].privateFactsId,
  isInformant:false
 }));
}
export function publicSantoroRanks(assignments){
 return assignments.map(({playerId,rank})=>({playerId,rank}));
}
