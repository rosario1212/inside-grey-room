#!/usr/bin/env node
// OMERTA V9 — public pseudo assignment. Never reads Supabase or private variants.
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
import assert from 'node:assert/strict';
const js=await readFile('omerta-santoro-family-v7.js','utf8');
let listeners={};
const document={
 readyState:'loading',
 documentElement:{lang:'fr'},
 addEventListener:(name,fn)=>{listeners[name]=fn}
};
const window={IGR_LOCALE:'fr'};
runInNewContext(js,{document,window,Set,Object,String,Array,console});
const api=window.IGR_OMERTA_SANTORO_PUBLIC_FAMILY;
assert.ok(api,'public family tree API should exist');
assert.equal(api.version,'v9-player-ranks');
const publicSync=[
 {pseudo:'Alice',preferred_role:'don'},
 {pseudo:'Brahim',preferred_role:'consigliere'},
 {pseudo:'Cyrus',preferred_role:'caporegime'},
 {pseudo:'Dina',preferred_role:'uomo_onore'},
 {pseudo:'Emil',preferred_role:'associato'},
 {pseudo:'Farah',preferred_role:'contabile'},
 {pseudo:'IndicConfidentiel',preferred_role:'informateur'},
 {pseudo:'PentitoSecret',preferred_role:'pentito'},
 {pseudo:'SpySecret',preferred_role:'espion'},
 {pseudo:'EnquêteurExt',preferred_role:'enqueteur'},
 {pseudo:'SansRole',preferred_role:''}
];
const assigned=api.holders(publicSync);
for(const [code,name] of [['don','Alice'],['consigliere','Brahim'],['caporegime','Cyrus'],['uomo_onore','Dina'],['associato','Emil'],['contabile','Farah']]){
 assert.equal(Array.from(assigned[code]).join(','),name,code);
}
const published=JSON.stringify(assigned);
for(const secret of ['IndicConfidentiel','PentitoSecret','SpySecret','EnquêteurExt','SansRole'])assert.ok(!published.includes(secret),'secret or external player leaked: '+secret);
assert.equal(assigned.sottocapo.length,0,'unassigned rank should stay empty');
assert.ok(!/Vittorio Santoro|Matteo Bellini|Enzo Rinaldi|Rocco Fiore/.test(js),'No fictional names allowed in playable rank nodes');
assert.match(js,/Don Santoro/);
assert.match(js,/Adriano Santoro/);
assert.match(js,/Elena Santoro/);
assert.match(js,/os9-tree-open/);
assert.doesNotMatch(js,/\.private_state\b|\.secret_role\b|\.omerta_campaign\b/,'family tree cannot consume secret state');
console.log('OMERTA V9 public player-rank mapping PASS: pseudonyms shown, secret roles hidden, Don Santoro only.');
