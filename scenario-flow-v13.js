(()=>{
'use strict';
const coreIds=Array.from({length:34},(_,i)=>String(i+1).padStart(3,'0'));
const signatures={
'001':{theme:'Convocation, contradiction, première confrontation',priority:['confrontation']},
'002':{theme:'Responsabilité morale ≠ causalité directe',priority:['confrontation']},
'003':{theme:'Responsabilité fragmentée',priority:['confrontation']},
'004':{theme:'Inaction et fenêtres d’intervention',priority:['confrontation']},
'005':{theme:'Première lecture trompeuse',priority:['confrontation']},
'006':{theme:'Secret collectif et mémoire',priority:['confrontation']},
'007':{theme:'Intérêts personnels et héritage',priority:['confrontation','assembly']},
'008':{theme:'Mensonge ≠ culpabilité',priority:['confrontation','assembly']},
'009':{theme:'Consentement, mémoire, expertise',priority:['expertise','assembly','confrontation']},
'010':{theme:'Accès, acoustique, abandon',priority:['expertise','confrontation']},
'011':{theme:'Chaîne de commandement',priority:['assembly','confrontation']},
'012':{theme:'Groupe fermé et salle d’attente',priority:['confrontation','assembly']},
'013':{theme:'Procureur, chaîne intention-finance-exécution',priority:['procureur','assembly','confrontation']},
'014':{theme:'Juge, secret, contre-espionnage',priority:['juge','assembly','confrontation']},
'015':{theme:'Journaliste, institution, conflit d’intérêts',priority:['enquete_journalistique','juge','assembly','confrontation']},
'016':{theme:'Avocat, vidéo, responsabilité exacte',priority:['negociation','confrontation','assembly']},
'017':{theme:'Accords, témoin, coopération',priority:['temoin','procureur','negociation','confrontation']},
'018':{theme:'Inspecteur, terrain, scène déplacée',priority:['retour_inspecteur','assembly','confrontation']},
'019':{theme:'Guerre institutionnelle',priority:['assembly','enquete_journalistique','negociation','requete','saisine','confrontation']},
'020':{theme:'Synthèse de tout le système',priority:['retour_inspecteur','expertise','assembly','enquete_journalistique','temoin','confrontation']},
'021':{theme:'Cercle de connaissance et pression de la Famiglia',priority:['signature','confrontation']},
'022':{theme:'Ordre, menace et responsabilité mafieuse',priority:['signature','confrontation']},
'023':{theme:'Positions, loyauté et chaise vide',priority:['signature','assembly']},
'024':{theme:'Coopération, protection et point de non-retour',priority:['signature','confrontation']},
'025':{theme:'Chaîne des ordres et audience du Don',priority:['signature','confrontation']},
'026':{theme:'Ville qui tombe et périmètre judiciaire',priority:['signature','confrontation']},
'027':{theme:'Crédibilité ≠ sincérité',priority:['signature','confrontation']},
'028':{theme:'Dernière liaison et confirmation extérieure',priority:['signature','confrontation']},
'029':{theme:'Source sous pression',priority:['signature','confrontation']},
'030':{theme:'Corruption institutionnelle et motif écrit',priority:['signature','assembly']},
'031':{theme:'Dette, pression intime et engagement',priority:['signature','confrontation']},
'032':{theme:'Archives fragmentées et chaîne d’ordre',priority:['signature','assembly']},
'033':{theme:'Titre officiel contre pouvoir réel',priority:['signature','assembly']},
'034':{theme:'Identité fonctionnelle et hiérarchie opaque',priority:['signature','confrontation']}
};
const cfg={
 version:'13.2-directed-cycles',
 coreScenarioIds:coreIds,
 allScenarioIds:[...coreIds],
 dlcScenarioIds:Array.from({length:14},(_,i)=>String(i+21).padStart(3,'0')),
 serverCompatibilityPhase:{preInvestigation:'initial_debrief'},
 durations:Object.freeze({preInvestigation:120,interrogation:360,cycleDebrief:120,finalDebrief:120,finalDefense:180,confrontation:240,assembly:240,judicialShort:120,judicialLong:180,witness:240}),
 cycles:Object.freeze({
  withAnalyst:Object.freeze({1:{interrogations:3,events:0},2:{actions:3,interrogationsMax:2},3:{actions:3,interrogationsMax:1}}),
  withoutAnalyst:Object.freeze({1:{interrogations:3,events:0},2:{actions:3,interrogationsMax:2},3:{actions:3,interrogationsMax:1}})
 }),
 debriefQuestions:Object.freeze([
  Object.freeze({key:'convergence',label:'Vous vous rapprochez d’une conclusion ?',choices:['Non','Un peu','Oui']}),
  Object.freeze({key:'confusion',label:'Le dossier reste difficile à relier ?',choices:['Non','Un peu','Oui']})
 ]),
 eventLabels:Object.freeze({
  interrogation:'INTERROGATOIRE',confrontation:'CONFRONTATION',assembly:'ASSEMBLÉE',analyse_dossier:'ANALYSE DU DOSSIER',signature:'ACTION SIGNATURE',
  expertise:'EXPERTISE',retour_inspecteur:'RETOUR INSPECTEUR',enquete_croisee:'ENQUÊTE CROISÉE',temoin:'TÉMOIN',enquete_journalistique:'ENQUÊTE JOURNALISTIQUE',
  procureur:'ENTRETIEN PROCUREUR',juge:'DÉCISION DU JUGE',negociation:'NÉGOCIATION',requete:'REQUÊTE',saisine:'SAISINE'
 }),
 signatures:Object.freeze(signatures),
 principles:Object.freeze({
  app:'L’application est autoritaire sur les phases qu’elle ouvre, silencieuse sur les interactions qu’elle n’a pas ouvertes.',
  waitingRoom:'La Salle d’attente est un espace de jeu humain, jamais un écran d’attente.',
  suspect:'Le Suspect cherche d’abord à sauver sa peau.',
  institutions:'Les rôles institutionnels restent propres en apparence.',
  trames:'Le MJ adapte la pression, jamais la vérité.',
  fatigue:'La durée peut être longue. La fatigue ne doit jamais venir de la répétition.',
  replay:'Un joueur qui rejoue un scénario ne doit jamais pouvoir résoudre la partie de mémoire.',
  canon:'Chaque variante est sélectionnée au lancement, reste immuable et ne peut jamais être modifiée par le MJ adaptatif.'
 })
};
Object.freeze(cfg.coreScenarioIds);
window.IGR_V13_FLOW=cfg;
})();
