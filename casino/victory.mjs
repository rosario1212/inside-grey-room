/**
 * CASINO v718 — deterministic, server-only victory assessment.
 * The canonical organigram stays sealed; only end-of-game aggregates and
 * individual outcomes cross the browser projection boundary.
 * No judge, host, or single member can certify the investigative camp's win.
 */
const roleNames=['agent','investigator','analyst','prosecutor','judge'];
const normalized=v=>String(v??'').normalize('NFKC').trim().replace(/\s+/g,' ').toLocaleLowerCase('fr');
const key=(a,b,relation)=>[a,b,normalized(relation)].join('::');
const resolve=(s,id)=>s.cast?.[id]||id;
const independent=(s,ids,subject,offence)=>{
  const sources=(ids||[]).map(id=>s.evidence.find(e=>e.id===id&&e.subjectId===subject&&e.offence===offence&&e.validated));
  return sources.length>=2&&sources.every(Boolean)&&new Set(sources.map(e=>e.independenceGroup)).size>=2;
};
function accurateLinkSet(s){
  const canonical=new Set((s.privateCanon.organigram||[]).map(e=>key(resolve(s,e.subject),resolve(s,e.target),e.relation)));
  const seen=new Set();
  let accurate=0,unsupported=0;
  for(const e of s.organigram||[]){
    const k=key(e.subject,e.target,e.relation);
    if(seen.has(k))continue;
    seen.add(k);
    if(canonical.has(k)&&independent(s,e.evidenceIds,e.subject,e.offence))accurate++;
    else unsupported++;
  }
  return {accurate,unsupported,recorded:accurate+unsupported};
}
function verifiedWitness(s,viewer){
  return s.intel.some(i=>i.from===viewer&&i.checked===true&&!!i.reviewedBy&&
    Array.isArray(i.evidenceIds)&&i.evidenceIds.some(id=>s.evidence.some(e=>e.id===id&&e.validated&&e.subjectId===i.subjectId)));
}
function judicialFact(s,h){
  const rule=s.privateCanon.judicialRules.find(r=>r.offence===h.offence);
  if(!rule||h.defence===null||h.absentDefence||!independent(s,h.evidenceIds,h.subjectId,h.offence))return false;
  const sources=h.evidenceIds.map(id=>s.evidence.find(e=>e.id===id&&e.subjectId===h.subjectId&&e.offence===h.offence));
  return rule.requiredFacts.every(f=>sources.some(e=>e.admissible===true&&e.facts?.includes(f)));
}
export function casinoVictory(s){
  const bureau=Object.entries(s.bureau).filter(([role])=>roleNames.includes(role));
  const count=bureau.length,majority=Math.floor(count/2)+1;
  const ballots=s.bureauBallots||{};
  const established=bureau.filter(([,id])=>ballots[id]==='established').length;
  const insufficient=bureau.filter(([,id])=>ballots[id]==='insufficient').length;
  const sources=accurateLinkSet(s);
  // The claim must be voted by a strict majority of ALL bureau seats;
  // abstentions, a host, and a judge acting alone cannot grant victory.
  const reportApproved=established>=majority;
  const precisionEnough=sources.accurate>0&&sources.accurate*3 >= sources.recorded*2;
  const bureauWon=!!s.roomLocated&&reportApproved&&precisionEnough;
  const reason=bureauWon
    ?'Le dossier du bureau tient : une relation criminelle au moins a été identifiée par deux sources indépendantes, et les accusations retenues résistent au recoupement.'
    :!reportApproved?'Le bureau n’a pas réuni une majorité pour soutenir ses conclusions. Les désaccords resteront au dossier.'
    :sources.accurate===0?'Les noms circulent, mais aucune relation inscrite n’a été confirmée contre la structure réelle du réseau.'
    :'Les accusations dépassent les liens confirmés. Le dossier ne résiste pas à la contre-expertise.';
  const investigative={
    outcome:bureauWon?'victory':'defeat',title:bureauWon?'LE DOSSIER TIENT':'LE DOSSIER CÈDE',
    narrative:reason,majority,voters:count,established,insufficient,
    corroborated:sources.accurate,contested:sources.unsupported
  };
  const political={
    outcome:s.finale.political,successor:s.finale.successor||null,
    title:({recognised_claim:'UN NOUVEAU DRAGON',split:'YONGHE SE DÉCHIRE',
      dragon_retained:'LE DRAGON RESTE',collapse:'LE TRÔNE EST VIDE'})[s.finale.political]||'APRÈS LA DERNIÈRE MAIN',
    narrative:({
      recognised_claim:'Une nouvelle autorité tient les soutiens et les territoires. Ceux qui ont signé savent désormais ce que valent leurs promesses.',
      split:'La guerre n’a pas eu de vainqueur unique. Deux fidélités, deux registres, et des hommes qui connaissent les mêmes secrets.',
      dragon_retained:'Les prétendants se sont exposés. Le Dragon, lui, est resté debout. La dette de cette nuit n’est pas oubliée.',
      collapse:'Plus personne ne peut imposer son nom. Les accords existent encore ; personne ne garantit qu’ils seront honorés.'
    })[s.finale.political]||'Le pouvoir ne se mesure pas aux jetons laissés sur le tapis.'
  };
  return {investigative,political};
}
export function casinoPersonalVictory(s,viewer,final){
  const bureauRole=Object.entries(s.bureau).find(([,id])=>id===viewer)?.[0];
  if(bureauRole){
    const won=final.investigative.outcome==='victory';
    let fulfilled=false;
    let objective='';
    if(bureauRole==='agent'){
      fulfilled=s.roomLocated&&s.agentDecisions.length===5&&s.agentDecisions.every(d=>d.correct);
      objective='Localiser la salle sans recourir à la procédure de secours.';
    }else if(bureauRole==='investigator'){
      fulfilled=s.interpellationRequests.some(r=>r.requestedBy===viewer&&r.executed);
      objective='Obtenir une interpellation motivée et effectivement menée par l’Agent.';
    }else if(bureauRole==='analyst'){
      fulfilled=s.intel.some(i=>i.reviewedBy===viewer&&i.evidenceIds?.length)
        ||s.organigram.some(o=>o.filedBy===viewer&&accurateOwnLink(s,o));
      objective='Faire entrer une source vérifiée ou un lien exact dans le dossier.';
    }else if(bureauRole==='prosecutor'){
      fulfilled=s.hearings.some(h=>h.openedBy===viewer);
      objective='Soutenir personnellement une audience contradictoire fondée sur des sources indépendantes.';
    }else if(bureauRole==='judge'){
      const rulings=s.rulings.filter(r=>r.decidedBy===viewer);
      fulfilled=rulings.length>0&&rulings.every(r=>{
        const h=s.hearings.find(v=>v.id===r.hearingId);
        return h&&(r.decision==='convict'?judicialFact(s,h):!judicialFact(s,h));
      });
      objective='Rendre au moins une décision cohérente avec les éléments établis, sans condamnation non prouvée.';
    }
    const outcome=won&&fulfilled?'victory':won||fulfilled?'partial':'defeat';
    const title=outcome==='victory'?'LE DOSSIER ET TA MISSION':outcome==='partial'?'UNE MOITIÉ DE VÉRITÉ':'RIEN À PRÉSENTER';
    const narrative=outcome==='victory'?'Tu as rempli ta mission et le bureau a soutenu un dossier exact. Une victoire qui ne promet ni paix ni justice totale.'
      :outcome==='partial'?'Une partie du travail a été accomplie, mais la victoire collective et ta mission personnelle ne coïncident pas.'
      :'La vérité n’a pas trouvé de majorité et ta mission n’a pas atteint son seuil de réussite.';
    return {outcome,title,narrative,objective,objectiveFulfilled:fulfilled};
  }
  if(!s.players.includes(viewer))return null;
  const c=s.roster[viewer],free=c?.status==='free';
  const doubleCrossed=Object.values(s.agreements).some(a=>a.participants.includes(viewer)&&a.breachedBy?.length>0);
  const statusPrice={
    dead:'Tu ne verras jamais celui qui encaissera les dettes de la nuit.',
    detained:'La porte s’est refermée sur toi. Les autres négocient désormais sans demander ton accord.',
    interpellated:'La police t’a pris avant que la succession soit arrêtée.',
    deposed:'Ton nom a été rayé des décisions. Ceux qui avaient besoin de toi parlent déjà au passé.'
  }[c?.status]||'';
  if(s.undercoverIds.includes(viewer)){
    const delivered=verifiedWitness(s,viewer),won=delivered&&final.investigative.outcome==='victory';
    const outcome=won?'victory':delivered?'partial':'defeat';
    return {outcome,title:won?'TA COUVERTURE AVAIT UN PRIX':delivered?'LA SOURCE EST ARRIVÉE TROP TARD':'PERSONNE NE CONFIRME TES MOTS',
      narrative:(won?'Ton renseignement recoupé a servi à un dossier gagnant. Tu as rempli ta mission, mais personne ne t’a promis de sortie propre.':
        delivered?'Ton information a été vérifiée. Le bureau n’a pas remporté le dossier ; elle restera une pièce, pas un acquittement.':
        'Tu as traversé la nuit, mais aucun renseignement utilisable provenant de toi n’a été confirmé.')+(statusPrice?' '+statusPrice:''),
      objective:'Transmettre un renseignement recoupé qui contribue à une victoire collective du bureau.',objectiveFulfilled:won};
  }
  const kingpin=free&&final.political.outcome==='recognised_claim'&&s.finale.successor===viewer;
  const split=s.finale.split;
  const dissident=free&&final.political.outcome==='split'&&(split?.founder===viewer||split?.acceptedSupporters?.includes(viewer));
  const pact=Object.values(s.agreements).some(a=>a.status==='signed'&&a.breachedBy.length===0&&a.participants.includes(viewer)&&a.participants.includes(s.finale.successor));
  const kingmaker=free&&final.political.outcome==='recognised_claim'&&s.finale.successor!==viewer&&
    s.support[viewer]===s.finale.successor&&pact;
  const survival=free&&(Object.values(s.territories).some(t=>t.controller===viewer)
    ||Object.values(s.agreements).some(a=>a.status==='signed'&&a.breachedBy.length===0&&a.participants.includes(viewer)));
  const outcome=kingpin||dissident||kingmaker?'victory':survival?'partial':'defeat';
  const title=kingpin?'LE SIÈGE EST À TOI':dissident?'UNE FAMILLE DÉCHIRÉE':kingmaker?'LE ROI TE DOIT SON TRÔNE':
    survival?'TU AS SAUVÉ TA PEAU':'LE CASINO T’A AVALÉ';
  const narrative=kingpin?'Tu contrôles assez de soutiens et de territoires pour être reconnu. Chaque promesse faite pour monter peut désormais servir à te faire tomber.'
    :dissident?'Tu as fait survivre une faction autonome à la succession. Ce n’est pas la paix : c’est une frontière à défendre.'
    :kingmaker?'Tu n’as pas le trône. Mais le nouveau pouvoir tient aussi sur un accord que tu as signé et que tu peux encore rompre.'
    :survival?'Tu repars avec quelque chose : un droit, un accord ou une position. Ce n’est pas le pouvoir, et rien ne garantit que demain sera moins sale.'
    :'Tu n’as ni pouvoir reconnu ni levier durable. Les autres ont conservé tes promesses et repris tes mises.';
  const objective=kingpin?'Prendre le pouvoir.':dissident?'Établir une faction viable.':kingmaker?'Porter un allié au sommet avec un pacte encore valable.':
    'Conquérir le pouvoir, une scission ou une influence formalisée. Survivre seul n’est pas une victoire.';
  return {outcome,title,narrative:narrative+(doubleCrossed?' Un accord rompu restera consigné contre toi.':'')+(statusPrice?' '+statusPrice:''),
    objective,objectiveFulfilled:outcome==='victory'};
}
function accurateOwnLink(s,e){
  const mine=key(e.subject,e.target,e.relation);
  return (s.privateCanon.organigram||[]).some(c=>key(resolve(s,c.subject),resolve(s,c.target),c.relation)===mine);
}
