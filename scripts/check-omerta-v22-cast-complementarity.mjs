#!/usr/bin/env node
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {reviewRoleObjectiveAssignment} from '../qa/omerta-v22-cast-complementarity-auditor.mjs';

const db=JSON.parse(await readFile('qa/omerta-v22-coherent-role-goals.json','utf8'));
for(const c of db.scenarios){
 const available=c.outcome_tracks.map(t=>t.id);
 // Seven distinct rank holders: the same narrative spine is shared, while
 // each still needs genuinely personal information and independently scored goals.
 const cast=c.goals.slice(0,7).map((r,i)=>({
   playerId:'member'+i,role:r.role,hasUniqueFacts:true,
   winAndLoseReachable:true,outcomeScoringAuthenticated:true
 }));
 const ok=reviewRoleObjectiveAssignment({scenario:c,cast,availableOutcomeTracks:available});
 assert.equal(ok.participants.length,7,c.id);
 assert.equal(new Set(ok.participants.map(p=>p.preGoal)).size,7);
 assert.equal(new Set(ok.participants.map(p=>p.postGoal)).size,7);
 // One to seven players may be present; no rank is compulsory.
 for(let n=1;n<=7;n++){
   const small=reviewRoleObjectiveAssignment({scenario:c,cast:cast.slice(0,n),availableOutcomeTracks:available});
   assert.equal(small.participants.length,n);
 }
 // Same rank twice with the same stock template would conflate two players.
 assert.throws(()=>reviewRoleObjectiveAssignment({
  scenario:c,cast:[cast[1],{...cast[1],playerId:'new-member'}],availableOutcomeTracks:available
 }),/duplicate personal objective/);
 // Even when the editor supplies distinct goals, they must match a real
 // scenario variant and a verifiable win/loss outcome.
 assert.throws(()=>reviewRoleObjectiveAssignment({
  scenario:c,cast:[{...cast[0],winAndLoseReachable:false}],availableOutcomeTracks:available
 }),/verified personal stakes/);
 assert.throws(()=>reviewRoleObjectiveAssignment({
  scenario:c,cast:[{...cast[0],outcomeScoringAuthenticated:false}],availableOutcomeTracks:available
 }),/authenticated verdict/);
 assert.throws(()=>reviewRoleObjectiveAssignment({
  scenario:c,cast:[cast[0]],availableOutcomeTracks:available.slice(1)
 }),/outcome not verified/);
 // Cast does not require any informant, and this check never assigns one.
 assert.ok(!JSON.stringify(ok).includes('isInformant'));
}
console.log('OMERTA V22 CAST-SPECIMEN PASS: 5 independent cases, 1–7 sampled unique rank assignments, no duplicated same-rank goals, no missing outcome tracks and no unverifiable scorer.');
console.log('Fictional fixtures only: does not certify any true A/B/C scripts, real backend scorer, protection or actual multiplayer playtest.');
