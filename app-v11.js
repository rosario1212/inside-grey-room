const STORAGE = {
 memory:new Map(),
 getItem(k){if(this.memory.has(k))return this.memory.get(k);try{return window.localStorage.getItem(k)}catch{return null}},
 setItem(k,v){v=String(v);this.memory.set(k,v);try{window.localStorage.setItem(k,v)}catch{if(!this.warned){this.warned=true;setTimeout(()=>toast('Stockage indisponible : garde cette page ouverte pour conserver ta session.'),800)}}},
 removeItem(k){this.memory.set(k,null);try{window.localStorage.removeItem(k)}catch{}}
};
const VERSION = 'v12.1-security-store-candidate';
const NATIVE_SHELL = location.protocol === 'file:' || location.hostname === 'insidegreyroom.local' || /[?&]native=(android|ios)\b/.test(location.search);
const SUPABASE_URL = 'https://jtasbdiguhiswoyvobkn.supabase.co';
const SUPABASE_KEY = 'sb_publishable__I1lNSf1dyQRHz1jY8As1Q_zAwh8j13';
const API = `${SUPABASE_URL}/rest/v1`;

const SCENARIOS = [
{id:'001',title:'LA CHAMBRE 222',short:'Maël Sénéchal est retrouvé mort, poignardé, dans la chambre 222. Trois personnes ont traversé sa nuit. Aucune ne raconte exactement la même histoire.',context:'Maël Sénéchal est retrouvé mort, poignardé, dans une chambre d’hôtel. Trois personnes ont croisé sa nuit et chacune possède une version crédible — jusqu’à ce que les horaires, les passages et les détails matériels commencent à les opposer.',mood:'Huis clos froid, sec et policier.',min:4,max:5,sound:'hotel',mechanics:['Enquête classique','Trames matérielles','Permutation cachée']},
{id:'002',title:'LE SILENCE DE LÉON',short:'Léon s’est donné la mort. Personne ne l’a tué de ses mains — mais plusieurs personnes ont pesé sur les jours qui l’ont précédée.',context:'Après le suicide de Léon, l’enquête ne cherche pas un meurtrier classique. Elle doit mesurer ce que chacun a fait, encouragé, ignoré ou abandonné avant sa mort, et déterminer où commence une responsabilité réelle.',mood:'Intime, lourd, sans échappatoire.',min:5,max:6,sound:'mourning',mechanics:['Responsabilité morale','Comportement ambigu','Pas de causalité simpliste']},
{id:'003',title:'LE DERNIER PROTOCOLE',short:'Une attaque biologique frappe une gare. La piste remonte jusqu’au Centre Helios — où trop de décisions ont précédé la catastrophe.',context:'Une attaque biologique frappe une gare et ramène l’enquête vers le Centre Helios. Recherche, validation, transfert, ordre et omission forment une chaîne : il faut comprendre comment plusieurs décisions séparées ont pu rendre la catastrophe possible.',mood:'Institutionnel, froid, contaminé par la panique.',min:4,max:6,sound:'biohazard',mechanics:['Responsabilité fragmentée','Documents techniques','Brouillage politique']},
{id:'004',title:'LES TROIS ABSENTS',short:'Sofia est morte seule. Trois proches ont parlé, lu ou gardé le silence. Leurs horaires ne racontent pas la même nuit.',context:'Après la mort de Sofia, la Grey Room confronte trois proches. L’un a pu recevoir un appel clair, un autre un message ambigu, un troisième une information trop tardive. L’enquête doit établir les faits, pas imaginer ce qui aurait certainement empêché sa mort.',mood:'Une nuit vide où l’inaction devient un choix.',min:4,max:5,sound:'pulse',mechanics:['Fenêtres d’intervention','Culpabilité passive','Chronologie intime']},
{id:'005',title:'LE MASQUE BLANC',short:'Adrian Keller est retrouvé mort. Sur la scène : le masque d’une ancienne affaire. Sa présence ne prouve rien.',context:'Adrian Keller est retrouvé mort dans son studio. Un masque lié à d’anciens crimes se trouve sur la scène. A-t-il été apporté, laissé là depuis plusieurs jours ou déplacé après les faits ? Trois proches de l’affaire possèdent des fragments incompatibles.',mood:'Dérangeant, symbolique, brutal.',min:4,max:5,sound:'ritual',mechanics:['Trois vérités A/B/C','Origine du masque','Dépositions irrévocables']},
{id:'006',title:'LES CENDRES DU CHALET',short:'Cinq ans après la chute de Noé dans un chalet isolé, le dossier est rouvert. Ses anciens amis ont gardé le silence — mais pas la même version.',context:'Cinq ans après la chute de Noé dans un chalet isolé, ses anciens amis sont réunis à nouveau. Leurs souvenirs divergent, certains détails ont changé avec le temps, et pourtant tous semblent protéger le même morceau de cette nuit.',mood:'Neige, silence, mémoire sale.',min:4,max:5,sound:'embers',mechanics:['Réouverture','Secret collectif','Mémoire reconstruite']},
{id:'007',title:'LE TESTAMENT GRIS',short:'Un héritage divise une famille. Puis un décès inattendu transforme chaque intérêt en mobile possible.',context:'Une succession tendue réunit une famille déjà fracturée par l’argent, les rancunes et les secrets. Lorsqu’un décès bouleverse l’équilibre, les mêmes mensonges changent soudain de poids et chaque intérêt devient plus difficile à innocenter.',mood:'Famille fermée, patrimoine empoisonné.',min:5,max:5,sound:'estate',mechanics:['Héritage','Renversement avant C3','Secrets croisés']},
{id:'008',title:'SOUS SERMENT',short:'Ils ont juré de dire vrai. Leurs déclarations sont incompatibles. Quelqu’un ment — mais mentir ne suffit pas à dire qui est responsable.',context:'Plusieurs personnes témoignent sous serment sur les mêmes faits, mais leurs versions ne peuvent pas toutes être vraies. L’enquête doit distinguer mensonge défensif, faux témoignage, protection d’un tiers et responsabilité dans le fait principal.',mood:'Procédure froide, vérité sous pression.',min:5,max:6,sound:'court',mechanics:['Témoignages incompatibles','Preuve procédurale','Responsabilité distincte du mensonge']},
{id:'009',title:'LE SUJET 17',short:'Le Sujet 17 retire son consentement. L’expérience continue. Après l’incident, sa mémoire devient l’une des pièces les plus contestées du dossier.',context:'Le programme ORPHÉE est au cœur d’un incident impliquant le Sujet 17. Consentement retiré, protocole poursuivi, chute et amnésie réelle s’entremêlent : il faut séparer ce que la science établit de ce que l’institution cherche à justifier.',mood:'Clinique, rationnel, terrifiant.',min:5,max:6,sound:'clinical',mechanics:['Amnésie authentique','Consentement retiré','Preuves neuropsychologiques']},
{id:'010',title:'LE BRUIT DES MURS',short:'Nora Weiss est retrouvée derrière un mur technique. Quelqu’un l’y a enfermée — et quelqu’un a peut-être eu l’occasion de comprendre qu’elle était encore vivante.',context:'Nora Weiss est retrouvée enfermée derrière un mur technique. Accès, horaires, bruits et passages permettent de reconstruire qui pouvait savoir qu’elle était là, à quel moment, et ce que chacun a fait de cette information.',mood:'Étouffant, domestique, cruel.',min:5,max:5,sound:'walls',mechanics:['Porte 13:54','Identité à reconstruire','Abandon volontaire']},
{id:'011',title:'36 HEURES',short:'Pendant trente-six heures, des villages ont brûlé, des civils ont été tués et des familles ont disparu. Trois officiers se renvoient la faute.',context:'Une opération militaire fictive a duré trente-six heures. Des villages ont brûlé, des civils sont morts et des familles ont disparu. Trois officiers se renvoient la responsabilité. Qui a donné l’ordre, qui l’a dépassé et qui pouvait arrêter les violences ?',mood:'Administratif, lourd, moralement insoutenable.',min:5,max:6,sound:'war',mechanics:['Responsabilité graduée','Chaîne de commandement','Pas de coupable unique']},
{id:'012',title:'FIDÈLES',short:'Sacha voulait quitter la communauté. Il est battu, retenu et isolé pendant près de vingt heures avant de réussir à s’échapper.',context:'Sacha Morel tente de quitter une communauté fermée. Il est battu, retenu et isolé avant de s’échapper. Le dossier doit déterminer qui a voulu l’empêcher de partir, qui a exécuté les actes et qui a choisi de ne pas intervenir.',mood:'Emprise, foi de façade, peur réelle.',min:5,max:5,sound:'cult',mechanics:['Ordre ambigu','Exécution matérielle','Non-intervention']},
{id:'013',title:'LIGNE DE MIRE',short:'Le président Kessler est assassiné par un tireur payé. Le coup de feu est certain. Ceux qui l’ont voulu, financé ou rendu possible le sont beaucoup moins.',context:'Le président Kessler est assassiné par un tireur rémunéré. L’identité de l’exécutant ne suffit pas : l’enquête doit remonter la chaîne entre intention politique, financement, préparation et exploitation de l’attentat.',mood:'Politique, tendu, exposé.',min:5,max:6,sound:'sniper',mechanics:['Procureur','Réseau PERSEUS','Trois nœuds de responsabilité']},
{id:'014',title:'SOUS SECRET',short:'Une fuite expose onze informateurs et leurs familles. Dans un service fondé sur le secret, une seule information peut condamner plusieurs vies.',context:'Une fuite compromet onze informateurs et leurs familles. Entre ceux qui protègent les sources, ceux qui contrôlent l’information et ceux qui ont intérêt à la faire circuler, l’enquête doit reconstruire une responsabilité fragmentée.',mood:'Paranoïa froide, contre-espionnage.',min:5,max:6,sound:'intelligence',mechanics:['Couvertures croisées','Contre-information','Secret d’État']},
{id:'015',title:'AVANT LA MORT',short:'Un patient meurt après le maintien d’un programme hospitalier malgré plusieurs alertes. Qui pouvait encore le protéger ?',context:'Un patient meurt pendant le programme ÉLIGIBLES malgré des recommandations de suspension. Les décisions du directeur, du clinicien et de l’administration sont contestées, et des notes ont été modifiées après sa mort.',mood:'Hôpital silencieux, violence administrative.',min:5,max:7,sound:'hospital',mechanics:['Journaliste facultatif','Juge facultatif','Trames institutionnelles']},
{id:'016',title:'LE DERNIER ÉTAGE',short:'Une victime est droguée, humiliée et filmée. Plus tard, elle est retrouvée morte. Les circonstances exactes de sa mort restent hors champ.',context:'Une victime liée à un réseau de narcotiques est droguée, filmée et humiliée, puis retrouvée morte. La vidéo s’arrête avant que les circonstances de la mort soient établies : il faut distinguer ceux qui ont préparé les violences, ceux qui ont agi après la coupure et ceux qui auraient pu intervenir.',mood:'Règlement de compte sale, presque documentaire.',min:5,max:9,sound:'elevator',mechanics:['Avocat possible','Vidéo ≠ preuve du décès','Expert médico-légal facultatif']},
{id:'017',title:'LE PRIX DU SILENCE',short:'Deux personnes sont enlevées. L’une meurt. L’autre ressort libre. Entre les deux, un silence que personne ne veut expliquer.',context:'Deux personnes sont enlevées afin de faire pression sur un ancien comptable. L’une meurt pendant la détention, l’autre ressort sous la menace. La Grey Room doit séparer la violence initiale, les décisions qui ont prolongé la captivité et les efforts pour imposer le silence.',mood:'Trahison, négociation, loyauté impossible.',min:7,max:10,sound:'betrayal',mechanics:['Procureur jusqu’à 2 entretiens','Témoin obligatoire','Accords engageants']},
{id:'018',title:'LES ASSIETTES VIDES',short:'L’ancien directeur d’un foyer abusif est retrouvé mort au bout d’une table dressée pour neuf absents. Chaque assiette porte un nom.',context:'L’ancien directeur d’un foyer abusif est retrouvé mort devant neuf assiettes vides portant les noms d’anciens résidents. La scène ressemble à un message volontaire. Reste à comprendre ce qui appartient au meurtre — et ce qui a été disposé pour raconter autre chose.',mood:'Lieu vide, objets ordinaires, horreur matérielle.',min:6,max:9,sound:'forensics',mechanics:['Inspecteur terrain','Trois vérités différentes','Expert, Avocat et Journaliste facultatifs']},
{id:'019',title:'LE GRAND BAL',short:'Un lanceur d’alerte est retrouvé mort pendant un gala d’élite, quelques minutes avant de révéler un dossier compromettant.',context:'Lors d’un gala d’élite, un lanceur d’alerte prêt à révéler un détournement de fonds est retrouvé mort. Autour de lui, sécurité, influence, presse, justice et argent possèdent chacun une raison de contrôler ce qui sera découvert.',mood:'Élégant en surface, institutionnel et pourri dessous.',min:9,max:9,sound:'ball',mechanics:['Avocat obligatoire','Procureur','Juge','Journaliste']},
{id:'020',title:'L’APOTHÉOSE',short:'327 personnes meurent dans l’incendie du Bal des Fondateurs. Certaines portes pouvaient encore être ouvertes. Aucune décision n’explique seule le bilan.',context:'Un incendie dévaste le Bal des Fondateurs et fait 327 morts. Sorties, maintenance, alarme, matériaux, sécurité et décisions humaines se combinent. Le dossier ne cherche pas une cause unique, mais la chaîne qui a transformé un départ de feu en catastrophe.',mood:'Effondrement total, humain et moral.',min:13,max:16,sound:'inferno',mechanics:['Architecture complète','Expert','Inspecteur','Conséquences systémiques maximales']}
];

const SCENARIO_ROLES = {
'001':{required:['Enquêteur','3 suspects'],optional:['Analyste']},
'002':{required:['Enquêteur','4 suspects'],optional:['Analyste']},
'003':{required:['Enquêteur','3 suspects'],optional:['Analyste','Expert']},
'004':{required:['Enquêteur','3 suspects'],optional:['Analyste']},
'005':{required:['Enquêteur','3 suspects'],optional:['Analyste']},
'006':{required:['Enquêteur','3 suspects'],optional:['Analyste']},
'007':{required:['Enquêteur','Analyste','3 suspects'],optional:[]},
'008':{required:['Enquêteur','Analyste','3 suspects'],optional:['Juge']},
'009':{required:['Enquêteur','Analyste','3 suspects'],optional:['Expert']},
'010':{required:['Enquêteur','Analyste','3 suspects'],optional:[]},
'011':{required:['Enquêteur','Analyste','3 suspects'],optional:['Procureur']},
'012':{required:['Enquêteur','Analyste','3 suspects'],optional:[]},
'013':{required:['Enquêteur','Analyste','3 suspects'],optional:['Procureur']},
'014':{required:['Enquêteur','Analyste','3 suspects'],optional:['Juge']},
'015':{required:['Enquêteur','Analyste','3 suspects'],optional:['Journaliste','Juge']},
'016':{required:['Enquêteur','Analyste','3 suspects'],optional:['Avocat','Journaliste','Juge','Expert']},
'017':{required:['Enquêteur','Analyste','Procureur','3 suspects','1 témoin'],optional:['2e témoin','Avocat','Expert']},
'018':{required:['Enquêteur','Analyste','Inspecteur','3 suspects'],optional:['Expert','Avocat','Journaliste']},
'019':{required:['Enquêteur','Analyste','Procureur','Juge','Journaliste','Avocat','3 suspects'],optional:[]},
'020':{required:['Enquêteur','Analyste','Inspecteur','Procureur','Juge','Expert','4 suspects','Avocat','Journaliste','Témoin'],optional:['2e Avocat','2e Journaliste','2e Témoin']}
};

function playerCountLabel(sc){
 return sc.min===sc.max ? `${sc.min} joueur${sc.min>1?'s':''}` : `${sc.min}–${sc.max} joueurs`;
}
const ADVANCED_SCENARIO_IDS=new Set(['019','020','027','030','034']);
function scenarioDifficultyTag(sc){const id=String(sc?.id||sc||'');return ADVANCED_SCENARIO_IDS.has(id)?`<span class="tag advanced-tag">${window.IGR_LOCALE==='en'?'ADVANCED':'AVANCÉ'}</span>`:''}

function rolesBlock(sc){
 if(sc?.id==='029'){
   const en=window.IGR_LOCALE==='en';
   return '<div class="roles-availability"><div class="roles-row"><span>'+(en?'Required':'Obligatoires')+'</span><p>'+(en?'Investigator · Analyst · 4 witnesses':'Enquêteur · Analyste · 4 témoins')+'</p></div>'+
   '<div class="roles-row optional"><span>'+(en?'Optional':'Facultatifs')+'</span><p>'+(en?'Prosecutor · Judge · Journalist · Don · Right hand':'Procureur · Juge · Journaliste · Don · Bras droit')+'</p></div></div>';
 }
 const cfg=SCENARIO_ROLES[sc.id]||{required:[],optional:[]};
 const label=x=>h(x==='Avocat'?(cartelLawyerLabel(sc.id)||x):x);
 return `<div class="roles-availability"><div class="roles-row"><span>Obligatoires</span><p>${cfg.required.map(label).join(' · ')}</p></div>${cfg.optional.length?`<div class="roles-row optional"><span>Facultatifs</span><p>${cfg.optional.map(label).join(' · ')}</p></div>`:''}</div>`;
}

const ROLE_LABEL_TO_ID={
 'Enquêteur':'enqueteur','Analyste':'analyste','Suspect':'suspect','suspect':'suspect','suspects':'suspect',
 'Procureur':'procureur','Juge':'juge','Journaliste':'journaliste','Avocat':'maitre','Maître':'maitre',
 'Inspecteur':'inspecteur','Expert':'expert','Témoin':'temoin','témoin':'temoin','témoins':'temoin'
};
function expandRoleLabel(label){
 const x=String(label||'').trim();
 let m=x.match(/^(\d+)\s+suspects?$/i);if(m)return Array(+m[1]).fill('suspect');
 m=x.match(/^(\d+)(?:e|er)?\s+t[ée]moin$/i);if(m)return ['temoin'];
 if(/^2e Avocat$/i.test(x))return ['maitre'];
 if(/^2e Journaliste$/i.test(x))return ['journaliste'];
 if(/^2e T[ée]moin$/i.test(x))return ['temoin'];
 return [ROLE_LABEL_TO_ID[x]||ROLE_LABEL_TO_ID[x.toLowerCase()]||x.toLowerCase()];
}
function lobbyRoleSlots(sc,count){
 // 029: a room starts with one member, but all SIX mandatory seats must be
 // selectable immediately. The optional roles do not include a lawyer.
 // Restrict this to the actual four-witness server roster: legacy rooms differ.
 if(sc?.id==='029'&&Number(STATE?.sync?.room?.min_players)===6&&Number(STATE?.sync?.room?.max_players)===11){
  const roster=['enqueteur','analyste','suspect','suspect','suspect','suspect','procureur','juge','journaliste','don','bras_droit'];
  return roster.slice(0,Math.min(Number(STATE.sync.room.max_players),Math.max(6,count)));
 }
 const cfg=SCENARIO_ROLES[sc.id]||{required:[],optional:[]},slots=[];
 cfg.required.forEach(x=>slots.push(...expandRoleLabel(x)));
 const extras=Math.max(0,count-slots.length);
 cfg.optional.slice(0,extras).forEach(x=>slots.push(...expandRoleLabel(x)));
 return slots;
}
function roleCapacityMap(sc,count){return lobbyRoleSlots(sc,count).reduce((a,r)=>(a[r]=(a[r]||0)+1,a),{})}
function roleChoiceSummary(sc,count,players){
 const caps=roleCapacityMap(sc,count),taken={};(players||[]).forEach(p=>{if(p.preferred_role)taken[p.preferred_role]=(taken[p.preferred_role]||0)+1});
 return Object.entries(caps).map(([id,cap])=>({id,cap,taken:taken[id]||0,info:roleInfo(id)}));
}

const ROLE_INFO = {
enqueteur:{label:'Enquêteur',win:'Reconstruis correctement les faits, les responsabilités et le degré réel d’implication.',body:'Tu diriges les interrogatoires, choisis certaines décisions d’enquête et portes la reconstruction factuelle finale.'},
analyste:{label:'Analyste',win:'Produis la reconstruction psychologique la plus juste.',body:'Tu observes les interrogatoires, utilises le Canal Enquête et participes aux entretiens annexes avec l’Enquêteur.'},
suspect:{label:'Suspect',win:'Fais respecter la frontière réelle de ta responsabilité.',body:'Tu peux mentir, manipuler, accuser, minimiser ou admettre partiellement. Être compromis ne signifie pas automatiquement perdre.'},
maitre:{label:'Maître',win:'Protège la responsabilité exacte de ton unique client officiel.',body:'Tu peux parler librement aux suspects hors procédure. Tu accompagnes ton client dans les procédures officielles et partages son temps de défense finale. Chacun de vous peut mettre fin à la représentation pendant la partie.'},
procureur:{label:'Procureur',win:'Poursuis correctement les responsabilités sans surpayer tes accords.',body:'Tu parles directement aux joueurs disponibles, négocies des coopérations puis utilises l’application uniquement pour formaliser les accords et ta décision.'},
juge:{label:'Juge',win:'Rends une décision exacte sans sacrifier ton objectif personnel.',body:'Tu arbitres les saisines et les accès protégés. Tu peux consommer au maximum 3 protections ; la 3e fait échouer ton objectif personnel.'},
journaliste:{label:'Journaliste',win:'Publie utilement sans détruire ta crédibilité ni ton objectif.',body:'Tu enquêtes librement et peux publier jusqu’à 3 Breaking News par cycle, 6 sur toute la partie.'},
inspecteur:{label:'Inspecteur de terrain',win:'Choisis les bonnes pistes et aide à établir les faits matériels essentiels.',body:'Tu peux explorer jusqu’à 3 lieux par cycle ; les résultats matériels alimentent l’enquête sans désigner automatiquement un coupable.'},
expert:{label:'Expert / Médecin légiste',win:'Interprète correctement les éléments techniques essentiels.',body:'Une analyse complémentaire par cycle. Tu établis des faits techniques, jamais un coupable.'},
temoin:{label:'Témoin',win:'Reste cohérent avec ta vérité et ton éventuel objectif secondaire.',body:'Tu peux être entendu pendant la fenêtre témoins. Tu peux devenir personne d’intérêt puis suspect.'},
espion:{label:'Espion',win:'Accomplis ta mission sans être démasqué.',body:'Ton rôle public reste une couverture. Être Espion ne signifie pas être le responsable principal.'}
};

const RULES = [
{title:'1. ADN du jeu',items:['Inside Grey Room est une enquête psychologique asymétrique à informations cachées.','La vérité canonique ne change jamais ; les accès, réactions, relations, timings et trames disponibles peuvent changer.','Le système fournit les circonstances ; les joueurs produisent la tragédie.']},
{title:'2. Début de partie',items:['Chaque joueur reçoit : TON RÔLE, TES POUVOIRS / LIMITES, COMMENT TU GAGNES, puis sa carte privée.','Les lettres A/B/C/D sont internes et permutées. L’interface affiche les pseudonymes à leur place.','Les cartes restent courtes, relisibles en 20–30 secondes.']},
{title:'3. Structure standard',items:['Lecture de rôle puis première Assemblée du camp Enquête.','Maximum 3 cycles. Chaque interrogatoire officiel dure 6 minutes.','À partir du cycle 2, l’Enquêteur choisit seulement parmi les événements compatibles affichés par l’application.','Les trames structurent le dossier sans résoudre seules l’affaire.']},
{title:'4. MJ adaptatif',items:['À chaque cycle, l’Enquêteur et l’Analyste répondent à de très courts QCM.','Le MJ choisit parmi des trames préécrites compatibles avec le canon. Il n’invente jamais une preuve officielle.','Si le groupe converge trop vite, le MJ privilégie une vraie ambiguïté canonique ; s’il est perdu, il privilégie une trame structurante.','Une mauvaise décision réaliste n’est pas bloquée : elle modifie l’état de la partie. Seules les actions matériellement ou temporellement impossibles sont bloquées.']},
{title:'5. Communications',items:['Le Canal Enquête réunit les rôles d’enquête autorisés présents.','L’Analyste peut envoyer des observations silencieuses pendant les interrogatoires.','L’Enquêteur peut activer un flux vidéo en direct pour les rôles autorisés présents, sans enregistrement ni replay.','Une coupure confidentielle peut suspendre le flux pendant 60 secondes maximum par cycle.']},
{title:'6. Rôles spéciaux',items:['Procureur : échanges humains libres ; les coopérations formelles sont enregistrées dans l’application.','Juge : jusqu’à 3 protections ; consommer la 3e fait échouer son objectif personnel sans annuler à elle seule la victoire de son camp.','Journaliste : jusqu’à 3 Breaking News par cycle, 6 sur toute la partie.','Inspecteur : jusqu’à 3 lieux explorés par cycle.','Expert : 1 analyse canonique par cycle et 1 contre-expertise sur toute la partie.','Témoins : conversations libres hors convocation officielle.','Avocat : un seul client officiel ; la consultation privée de 1 minute existe pendant l’interrogatoire.']},
{title:'7. Fin de partie',items:['ENQUÊTE CLOSE : plus aucun nouvel élément ne peut entrer dans le dossier.','Audience finale : les rôles du camp Enquête peuvent résumer leur lecture ; le Juge doit parler.','Défenses : chaque suspect peut parler 2 min en COURT ou 3 min en LONG ; son Avocat officiel partage ce temps.','Décision finale : les rôles du camp Enquête verrouillent une seule fois 0 aucune, 1 secondaire ou 2 principale, puis révélation.','Pour le dossier 001, l’Enquêteur et l’Analyste qualifient également le geste : volontaire, involontaire ou intention impossible à déterminer. Volontaire signifie que le geste est voulu, sans conclure automatiquement à une volonté de tuer. Involontaire signifie que le geste n’était pas voulu ; impossible à déterminer signifie que les pièces ne permettent pas de trancher.','Barème du dossier 001 : responsabilités 60 % (20 % pour chacun des trois suspects), reconstitution 40 % (10 % par axe : moment, geste, circonstance et intention). Le pourcentage évalue le rapport, sans remplacer les conditions de victoire personnelles.','Pour qualifier l’intention, évalue le geste directement à l’origine de la blessure : geste volontaire = mouvement voulu ; geste involontaire = mouvement qui n’était pas voulu ; impossible à déterminer = preuves insuffisantes ou contradictoires. Un geste volontaire ne signifie pas nécessairement une intention de tuer. Il faut s’appuyer sur les éléments du dossier, pas sur l’impression donnée par un joueur.']},
{title:'8. Équilibre',items:['Égalité de chance ne signifie pas égalité de puissance apparente.','Un rôle spécial ajoute une route, un dilemme ou une pression — jamais une certitude gratuite.','Une responsabilité centrale exige normalement la convergence d’au moins deux voies indépendantes.','Un suspect responsable partiel peut gagner si l’enquête surestime ou déforme sa responsabilité.']},
{title:'9. Trames',items:['Une trame = un fait concret, clair, policier ou technique.','Favoriser horaires, badges, caméras, messages, portes, véhicules, objets manquants, rapports et contradictions.','Le comportement humain est une hypothèse, jamais une preuve.','Les fausses pistes sont factuellement vraies ; les trames tardives recontextualisent sans donner une solution magique.']},
{title:'10. Son et ambiance',items:['Le menu utilise une ambiance discrète et identifiable.','Au lancement du scénario, le menu s’arrête et la bande son spécifique du dossier prend le relais.','Trames, Breaking News, décisions judiciaires, découvertes terrain et révélation finale utilisent de courts signaux sonores distincts.','Le son peut être coupé ou réglé à tout moment dans Paramètres.']}
];


const HOME_ART = `assets/home-v10-14.webp?v=${VERSION}`;
const HOME_ART_ALT = `assets/home-v10-14.webp?v=${VERSION}`;
const SCENARIO_COVER_ART = `assets/scenario-cover-v10-13.webp?v=${VERSION}`;
const SCENARIO_POSTERS = {
 '001': `assets/scenario-001-v10-13.webp?v=${VERSION}`,
 '002': `assets/scenario-002-v10-13.webp?v=${VERSION}`,
 '003': `assets/scenario-003-v10-13.webp?v=${VERSION}`,
 '004': `assets/scenario-004-v10-13.webp?v=${VERSION}`,
 '005': `assets/scenario-005-v10-13.webp?v=${VERSION}`,
 '006': `assets/scenario-006-v10-13.webp?v=${VERSION}`,
 '007': `assets/scenario-007-v10-13.webp?v=${VERSION}`,
 '008': `assets/scenario-008-v10-13.webp?v=${VERSION}`,
 '009': `assets/scenario-009-v11-6.webp?v=${VERSION}`,
 '010': `assets/scenario-010-v11-6.webp?v=${VERSION}`,
 '011': `assets/scenario-011-v11-6.webp?v=${VERSION}`,
 '012': `assets/scenario-012-v11-6.webp?v=${VERSION}`,
 '013': `assets/scenario-013-v11-6.webp?v=${VERSION}`,
 '014': `assets/scenario-014-v11-6.webp?v=${VERSION}`,
 '015': `assets/scenario-015-v11-6.webp?v=${VERSION}`,
 '016': `assets/scenario-016-v11-6.webp?v=${VERSION}`,
 '017': `assets/scenario-017-v11-6.webp?v=${VERSION}`,
 '018': `assets/scenario-018-v11-6.webp?v=${VERSION}`,
 '019': `assets/scenario-019-v11-6.webp?v=${VERSION}`,
 '020': `assets/scenario-020-v11-6.webp?v=${VERSION}`
};
const SCENARIO_THUMBS = {
 '001': `assets/scenario-thumb-001.webp?v=${VERSION}`,
 '002': `assets/scenario-thumb-002.webp?v=${VERSION}`,
 '003': `assets/scenario-thumb-003.webp?v=${VERSION}`,
 '004': `assets/scenario-thumb-004.webp?v=${VERSION}`,
 '005': `assets/scenario-thumb-005.webp?v=${VERSION}`,
 '006': `assets/scenario-thumb-006.webp?v=${VERSION}`,
 '007': `assets/scenario-thumb-007.webp?v=${VERSION}`,
 '008': `assets/scenario-thumb-008.webp?v=${VERSION}`,
 '009': `assets/scenario-thumb-009-v11-6.webp?v=${VERSION}`,
 '010': `assets/scenario-thumb-010-v11-6.webp?v=${VERSION}`,
 '011': `assets/scenario-thumb-011-v11-6.webp?v=${VERSION}`,
 '012': `assets/scenario-thumb-012-v11-6.webp?v=${VERSION}`,
 '013': `assets/scenario-thumb-013-v11-6.webp?v=${VERSION}`,
 '014': `assets/scenario-thumb-014-v11-6.webp?v=${VERSION}`,
 '015': `assets/scenario-thumb-015-v11-6.webp?v=${VERSION}`,
 '016': `assets/scenario-thumb-016-v11-6.webp?v=${VERSION}`,
 '017': `assets/scenario-thumb-017-v11-6.webp?v=${VERSION}`,
 '018': `assets/scenario-thumb-018-v11-6.webp?v=${VERSION}`,
 '019': `assets/scenario-thumb-019-v11-6.webp?v=${VERSION}`,
 '020': `assets/scenario-thumb-020-v11-6.webp?v=${VERSION}`
};
function scenarioArt(id){ return SCENARIO_POSTERS[id] || SCENARIO_THUMBS[id] || SCENARIO_COVER_ART; }
function scenarioThumbArt(id){ return SCENARIO_THUMBS[id] || scenarioArt(id); }

const PUBLIC_LOBBY_SUMMARIES = {
 '001':'Maël Sénéchal est retrouvé mort, poignardé, dans la chambre 222. Trois personnes ont traversé sa nuit et leurs versions s’opposent. Les horaires et les traces devront décider ce que les récits ne peuvent pas concilier.',
 '002':'Léon s’est donné la mort. Le dossier ne cherche pas un meurtrier, mais la part réelle de ceux qui l’ont humilié, manipulé, abandonné ou laissé s’effondrer.',
 '003':'Une attaque biologique frappe une gare et mène au Centre Helios. Plusieurs décisions ont rendu la catastrophe possible ; l’enquête doit reconstruire la chaîne sans inventer de responsable unique.',
 '004':'Sofia est morte d’une overdose après avoir appelé trois personnes à l’aide. Toutes ont reçu son appel. Aucune n’est venue. Il faut comprendre ce que chacune savait et pouvait encore empêcher.',
 '005':'Une victime est retrouvée morte dans une mise en scène dominée par un masque blanc. Le décor paraît rituel, mais les indices matériels ne racontent pas tous la même intention.',
 '006':'Cinq ans après la chute de Noé dans un chalet isolé, le dossier est rouvert. Ses anciens amis partagent le même passé, mais leurs souvenirs et leurs silences ne coïncident plus.',
 '007':'Une famille se déchire autour d’un héritage. Puis un décès inattendu rebat les intérêts, les alliances et la valeur de chaque mensonge.',
 '008':'Plusieurs personnes ont juré de dire vrai, mais leurs déclarations sont incompatibles. Il faut distinguer qui ment pour se protéger, qui protège quelqu’un d’autre et qui est réellement responsable.',
 '009':'Le Sujet 17 retire son consentement au programme ORPHÉE. Après l’incident, une amnésie réelle complique tout : ce que la mémoire ne peut plus raconter devra être reconstruit par les preuves.',
 '010':'Nora Weiss est retrouvée enfermée derrière un mur technique. Les accès, horaires et bruits permettront de déterminer qui pouvait savoir qu’elle était là — et ce que chacun a choisi de faire.',
 '011':'Une opération militaire fictive laisse des villages détruits, des morts et des disparus. Ordres, exécution, omission et dissimulation forment une chaîne qu’il faudra démonter sans confondre les niveaux.',
 '012':'Sacha voulait quitter une communauté fermée. Il est battu, retenu et isolé avant de s’échapper. L’enquête doit séparer ceux qui ont voulu l’empêcher de partir, ceux qui ont agi et ceux qui ont laissé faire.',
 '013':'Le président Kessler est assassiné par un tireur payé. Le tir est établi ; la chaîne d’intention, de financement et de préparation qui l’a précédé reste à reconstruire.',
 '014':'Une fuite expose onze informateurs et leurs familles. Dans un service où chacun ne détient qu’une partie du secret, il faut déterminer qui a compromis quoi — et avec quelles conséquences.',
 '015':'Une médecin est retrouvée morte alors qu’elle enquêtait sur le programme ÉLIGIBLES. Ses recherches touchent à des patients encore récupérables et à des décisions que l’hôpital préférerait ne pas avoir à défendre.',
 '016':'Une victime est droguée, humiliée et filmée, puis retrouvée morte. Le film ne montre pas les circonstances de son décès. L’enquête devra établir ce qui s’est passé avant et après la coupure, sans présumer d’un nouvel acte mortel.',
 '017':'Deux personnes sont enlevées. L’une meurt, l’autre survit. Entre menaces, loyauté et survie, il faut comprendre ce qui a réellement déterminé leur sort.',
 '018':'L’ancien directeur d’un foyer abusif est retrouvé mort au bout d’une table dressée pour neuf anciens résidents absents. Chaque assiette porte un nom. Quelqu’un a voulu que cette scène soit lue.',
 '019':'Un lanceur d’alerte est retrouvé mort pendant un gala d’élite, juste avant de révéler un dossier compromettant. Dans la salle, plusieurs pouvoirs avaient quelque chose à perdre.',
 '020':'327 personnes meurent dans l’incendie du Bal des Fondateurs. Des sorties pouvaient encore être ouvertes, mais le bilan vient d’une chaîne de défaillances et de décisions qu’aucun acteur ne peut expliquer seul.'
};
const CANONICAL_BRIEFINGS = Object.freeze({...PUBLIC_LOBBY_SUMMARIES});
function publicScenarioSummary(id){return PUBLIC_LOBBY_SUMMARIES[id]||scenario(id).short}
function canonicalBriefingText(id){
 if(['029','030'].includes(String(id)))return publicScenarioSummary(id);
 return CANONICAL_BRIEFINGS[id]||publicScenarioSummary(id);
}

const STATE={view:'home',selectedScenario:'001',scenarioId:'001',room:null,token:null,hostToken:null,playerId:null,playerPseudo:'',role:'suspect',players:[],cycle:0,tab:'card',createListScrollY:0,sync:null,syncSig:'',syncBusy:false,watcher:null,lastEventId:0,lastRoleNoticeKey:'',syncPromise:null,serverOffset:0};
const VIDEO={pcs:new Map(),localStream:null,remoteStream:null,lastSignalId:0,poller:null,starting:false,lastViewerReadyAt:0};
const INTRO={active:true,playing:false,done:false,lastActivation:0,waitingForBoot:false};
const BOOT={ready:false};
const AVATARS={map:new Map(),sig:''};
const SAFETY={blocked:new Set(),loaded:false};
const BRIEFING={spokenKey:null,timer:null,scoreStarted:false};
const NARRATION={generation:0,enabled:false,primed:true,speaking:false,retryTimer:null};

function primeNarrationFromGesture(){return}
function frenchNarrationVoice(){
 if(!('speechSynthesis'in window))return null;
 const voices=window.speechSynthesis.getVoices?.()||[];
 const fr=voices.filter(x=>/^fr(?:-|_)/i.test(x.lang)||/^fr$/i.test(x.lang));
 const score=v=>{
  const n=(v.name||'').toLowerCase(),l=(v.lang||'').toLowerCase();let s=0;
  // Prefer Apple's higher quality installed voices first. A natural voice matters more than a deliberately low pitch.
  if(/premium|enhanced|amélie|amelie|audrey|thomas|nicolas|jacques|henri/.test(n))s+=14;
  if(/siri/.test(n))s+=10;
  if(v.localService)s+=4;
  if(l==='fr-fr')s+=5;else if(l==='fr-ch')s+=4;else if(l.startsWith('fr'))s+=2;
  if(/compact|eloquence/.test(n))s-=6;
  return s;
 };
 return fr.sort((a,b)=>score(b)-score(a))[0]||null;
}
function naturalBriefingText(text){
 return String(text||'')
  .replace(/\s+/g,' ')
  .replace(/\s*—\s*/g,' — ')
  .replace(/\.\s+/g,'.  ')
  .trim();
}
function speakCanonicalBriefing(text,onDone){
 if(!NARRATION.enabled||!SOUND.enabled||!('speechSynthesis'in window)){onDone?.();return}
 const generation=++NARRATION.generation;
 const synth=window.speechSynthesis;let completed=false,attempt=0,started=false;
 const finish=()=>{if(completed||generation!==NARRATION.generation)return;completed=true;NARRATION.speaking=false;if(NARRATION.retryTimer){clearTimeout(NARRATION.retryTimer);NARRATION.retryTimer=null}onDone?.()};
 const blocked=()=>{
  if(completed||generation!==NARRATION.generation)return;
  NARRATION.speaking=false;
  showAudioWakePrompt('Touchez pour écouter le briefing');
  onDone?.();completed=true;
 };
 const speak=()=>{
  if(completed||generation!==NARRATION.generation)return;attempt+=1;started=false;
  try{
   synth.cancel();synth.resume?.();
   const voice=frenchNarrationVoice();
   const u=new SpeechSynthesisUtterance(naturalBriefingText(text));
   u.lang=voice?.lang||'fr-FR';
   u.rate=.91;u.pitch=1;u.volume=Math.max(0,Math.min(1,SOUND.master));
   if(voice)u.voice=voice;
   u.onstart=()=>{if(generation!==NARRATION.generation)return;started=true;NARRATION.speaking=true;hideAudioWakePrompt();if(NARRATION.retryTimer){clearTimeout(NARRATION.retryTimer);NARRATION.retryTimer=null}};
   u.onend=finish;
   u.onerror=()=>{if(generation!==NARRATION.generation)return;if(attempt<2)setTimeout(speak,180);else blocked()};
   synth.speak(u);
   setTimeout(()=>{try{synth.resume?.()}catch{}},80);
   NARRATION.retryTimer=setTimeout(()=>{
    NARRATION.retryTimer=null;
    if(completed||started||synth.speaking)return;
    if(attempt<2)speak();else blocked();
   },1100);
  }catch(e){console.warn('briefing voice',e);if(attempt<2)setTimeout(speak,180);else blocked()}
 };
 const voices=synth.getVoices?.()||[];
 if(voices.length)speak();
 else{
  let launched=false;
  const launch=()=>{if(launched||completed)return;launched=true;try{synth.removeEventListener?.('voiceschanged',launch)}catch{}speak()};
  try{synth.addEventListener?.('voiceschanged',launch,{once:true})}catch{}
  setTimeout(launch,350);
 }
}

function showAudioWakePrompt(label='Touchez pour réactiver le son'){
 let el=byId('audioWakePrompt');
 if(!el){
  el=document.createElement('button');el.id='audioWakePrompt';el.type='button';el.className='audio-wake-prompt';
  el.addEventListener('click',activateInGameAudio);
  document.body.appendChild(el);
 }
 el.textContent=label;el.classList.add('show');
}
function hideAudioWakePrompt(){byId('audioWakePrompt')?.classList.remove('show')}
async function activateInGameAudio(){
 primeNarrationFromGesture();
 const ok=await wakeAudioFromGesture();
 if(!ok)return toast('Touchez à nouveau pour activer le son.');
 hideAudioWakePrompt();
 if(STATE.sync?.room?.phase==='briefing'){
  BRIEFING.spokenKey=null;BRIEFING.scoreStarted=false;
  runCanonicalBriefing(true);
 }else ensureAmbient(activeSoundPreset());
}

function setIntroHint(text){
 const hint=byId('introHint');
 if(hint)hint.textContent=text;
}
function setupIntro(){
 const gate=byId('introGate'),btn=byId('introEnterBtn');
 if(!gate||!btn)return;
 const activate=e=>{
   if(e){e.preventDefault?.();e.stopPropagation?.();}
   if(INTRO.playing||INTRO.done)return;
   const now=performance.now();
   if(now-INTRO.lastActivation<350)return;
   INTRO.lastActivation=now;
   const audioWake=wakeAudioFromGesture();
   startIntroSequence(audioWake);
 };
 // iOS Home Screen: launch on press, not release, so the door feels immediate
 // and the same gesture unlocks WebAudio + speech synthesis.
 if(window.PointerEvent)btn.addEventListener('pointerdown',activate,{passive:false});
 else btn.addEventListener('touchstart',activate,{passive:false});
 btn.addEventListener('click',e=>{if(e.detail===0)activate(e)});
 setIntroHint('TOUCHEZ POUR ENTRER');
}
function showIntroGate(message='TOUCHEZ POUR OUVRIR LA PORTE'){
 const gate=byId('introGate'),btn=byId('introEnterBtn');
 if(!gate)return;
 // Kill any stale scheduler before the next user gesture. This is important on iOS
 // after the PWA has been backgrounded or reopened from the Home Screen.
 if(SOUND.started)stopAmbient();
 INTRO.active=true;INTRO.playing=false;INTRO.done=false;INTRO.waitingForBoot=false;
 gate.classList.remove('done','opening','audio-error','boot-waiting');
 gate.setAttribute('aria-hidden','false');
 if(btn){btn.disabled=false;btn.removeAttribute('aria-busy')}
 byId('app').inert=true;
 setIntroHint(message);
}
function completeIntroEntry(){
 const gate=byId('introGate'),btn=byId('introEnterBtn');if(!gate)return;
 gate.classList.remove('opening','boot-waiting');
 gate.classList.add('done');gate.setAttribute('aria-hidden','true');gate.removeAttribute('aria-busy');
 INTRO.active=false;INTRO.done=true;INTRO.playing=false;INTRO.waitingForBoot=false;
 byId('app').inert=false;
 if(btn){btn.disabled=false;btn.removeAttribute('aria-busy')}
 byId('app').querySelector('button,[tabindex]')?.focus({preventScroll:true});
 if(SOUND.enabled){
   ensureLiveAudio();
   setTimeout(()=>{if(SOUND.ctx?.state==='running')ensureAmbient(activeSoundPreset())},220);
 }
}
function hideIntroImmediately(){
 const gate=byId('introGate');if(!gate)return;
 gate.classList.add('done');gate.setAttribute('aria-hidden','true');
 INTRO.active=false;INTRO.done=true;INTRO.playing=false;INTRO.waitingForBoot=false;byId('app').inert=false;
}
function needsManualAudioWake(){
 if(!SOUND.enabled)return false;
 if(!SOUND.ctx)return true;
 return SOUND.ctx.state!=='running'||!SOUND.started||audioIsStale();
}
function disposeAudioEngine(){
 clearAudio();
 const old=SOUND.ctx;
 try{if(old&&old.state!=='closed')old.close?.().catch?.(()=>{})}catch{}
 SOUND.ctx=null;SOUND.masterGain=null;SOUND.melodyGain=null;SOUND.ambGain=null;SOUND.fxGain=null;
 SOUND.noise=null;SOUND.crackle=null;SOUND.sources=[];SOUND.timers=[];
 SOUND.started=false;SOUND.starting=false;SOUND.schedulerTimer=null;SOUND.nextPhraseTime=0;
 SOUND.lastPhraseAt=0;SOUND.expectedLoopMs=0;SOUND.scheduleAnchor=null;SOUND.currentTarget=null;
}
async function wakeAudioFromGesture(){
 if(!SOUND.enabled)return true;
 let ctx;
 try{
   initAudio();ctx=SOUND.ctx;
   if(!ctx)return false;
   if(ctx.state!=='running')await ctx.resume();
   if(ctx.state!=='running')throw new Error('AudioContext not running');
   primeAudioOutput();
   updateGains();
   startAmbient(activeSoundPreset());
   return SOUND.ctx?.state==='running';
 }catch(err){
   console.warn('Audio wake retry',err);
   // A stale iOS AudioContext can survive a Home Screen relaunch. Rebuild it once.
   disposeAudioEngine();
   try{
     initAudio();ctx=SOUND.ctx;
     if(!ctx)return false;
     if(ctx.state!=='running')await ctx.resume();
     if(ctx.state!=='running')return false;
     primeAudioOutput();updateGains();startAmbient(activeSoundPreset());
     return true;
   }catch(err2){console.warn('Audio wake failed',err2);return false}
 }
}
function playDoorOpenFx(){
 if(!SOUND.enabled||!SOUND.ctx||SOUND.ctx.state!=='running')return;
 const ctx=SOUND.ctx,target=SOUND.fxGain||SOUND.masterGain;
 const start=ctx.currentTime+.012;
 // Latch: short metallic snap.
 try{
   const n=ctx.createBufferSource(),hp=ctx.createBiquadFilter(),g=ctx.createGain();
   n.buffer=SOUND.crackle||SOUND.noise;hp.type='highpass';hp.frequency.value=1400;
   g.gain.setValueAtTime(.0001,start);g.gain.exponentialRampToValueAtTime(.22,start+.006);g.gain.exponentialRampToValueAtTime(.0001,start+.12);
   n.connect(hp);hp.connect(g);g.connect(target);trackSource(n);n.start(start);n.stop(start+.14);
 }catch{}
 // Hinge/creak: filtered noise sweeping downward.
 try{
   const n=ctx.createBufferSource(),bp=ctx.createBiquadFilter(),g=ctx.createGain();
   n.buffer=SOUND.noise;bp.type='bandpass';bp.Q.value=2.4;bp.frequency.setValueAtTime(1180,start+.07);bp.frequency.exponentialRampToValueAtTime(260,start+.88);
   g.gain.setValueAtTime(.0001,start+.05);g.gain.exponentialRampToValueAtTime(.14,start+.17);g.gain.setValueAtTime(.105,start+.57);g.gain.exponentialRampToValueAtTime(.0001,start+.94);
   n.connect(bp);bp.connect(g);g.connect(target);trackSource(n);n.start(start+.05);n.stop(start+.98);
 }catch{}
 // Low physical movement + final heavy stop.
 const prev=SOUND.scheduleAnchor;SOUND.scheduleAnchor=start;
 withAudioTarget(target,()=>{
   playMetal(118,.075,.02,-.08);
   playDrum(31,.17,.70);
   playMetal(72,.055,.72,.10);
 });
 SOUND.scheduleAnchor=prev;
}
function startIntroSequence(){
 if(INTRO.playing||INTRO.done)return;
 const gate=byId('introGate'),btn=byId('introEnterBtn');if(!gate)return;
 INTRO.playing=true;
 if(btn){btn.disabled=true;btn.setAttribute('aria-busy','true')}
 setIntroHint('ENTRÉE…');
 gate.classList.remove('audio-error','boot-waiting');
 requestAnimationFrame(()=>gate.classList.add('opening'));
 void wakeAudioFromGesture().then(awake=>{
   if(!awake)return;
   if(INTRO.playing)playDoorOpenFx();
   setTimeout(()=>{if(!INTRO.active&&SOUND.enabled)ensureAmbient(activeSoundPreset())},720);
 }).catch(()=>{});
 const finishDoorEntry=()=>{
   if(!INTRO.playing)return;
   if(!BOOT.ready){
     INTRO.playing=false;INTRO.waitingForBoot=true;
     gate.classList.remove('opening');
     gate.classList.add('boot-waiting');gate.setAttribute('aria-busy','true');
     return;
   }
   completeIntroEntry();
 };
 setTimeout(finishDoorEntry,650);
}



(function migrateAudioDefaultV106(){
 try{
   if(STORAGE.getItem('igr_v10_6_audio_mix_migrated')!=='1'){
     STORAGE.setItem('igr_v9_sound_enabled','true');
     STORAGE.setItem('igr_v9_master','1');
     STORAGE.setItem('igr_v9_ambience','1');
     STORAGE.setItem('igr_v9_effects','0.9');
     STORAGE.setItem('igr_v10_6_audio_mix_migrated','1');
   }
 }catch{}
})();

(function repairAudioStateV109(){
 try{
   if(STORAGE.getItem('igr_v10_9_audio_repair')!=='1'){
     STORAGE.setItem('igr_v9_sound_enabled','true');
     STORAGE.setItem('igr_v10_9_audio_repair','1');
   }
 }catch{}
})();

const SOUND={
enabled:pref('igr_v9_sound_enabled',true),
master:pref('igr_v9_master',0.92),
ambience:pref('igr_v9_ambience',0.9),
effects:pref('igr_v9_effects',0.85),
ctx:null,masterGain:null,melodyGain:null,ambGain:null,fxGain:null,noise:null,crackle:null,sources:[],timers:[],started:false,starting:false,preset:'menu',scheduleAnchor:null,currentTarget:null,nextPhraseTime:0,schedulerStep:0,loopDuration:0,schedulerTimer:null
};

function pref(k,f){try{const v=JSON.parse(STORAGE.getItem(k));return v??f}catch{return f}}
function setPref(k,v){STORAGE.setItem(k,JSON.stringify(v))}
function h(v=''){return String(v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function byId(id){return document.getElementById(id)}
function scenario(id){return SCENARIOS.find(s=>s.id===id)||SCENARIOS[0]}
function currentScenario(){return scenario(STATE.scenarioId||STATE.selectedScenario)}
function cartelLawyerLabel(id=STATE.sync?.room?.scenario_id||STATE.selectedScenario||STATE.scenarioId){return ['030','031'].includes(String(id))?(window.IGR_LOCALE==='en'?'Cartel lawyer':'Avocat du cartel'):''}
function roleInfo(r){const info=ROLE_INFO[r]||ROLE_INFO.suspect,label=r==='maitre'?cartelLawyerLabel():'';if(String(STATE.sync?.room?.scenario_id||STATE.selectedScenario||'')==='031'&&['suspect','maitre'].includes(r))return {...info,label:label||info.label,win:window.IGR_LOCALE==='en'?(r==='suspect'?'Leave alive without prison.':'Get your client out alive without prison; never abandon the cartel appointment.'):(r==='suspect'?'Sors vivant et évite la prison.':'Fais sortir ton client vivant sans prison ; n’abandonne pas le mandat du cartel.'),body:info.body};return label?{...info,label,win:window.IGR_LOCALE==='en'?'Defend the client appointed by Los Salcedo.':'Défends le client que Los Salcedo t’a assigné.',body:window.IGR_LOCALE==='en'?'The cartel appoints your only official client at the start. You may speak freely with the other suspects. Your appointment reveals no hidden facts.':'Le cartel désigne ton unique client officiel dès le début. Tu peux parler librement avec les autres suspects. Ton mandat ne révèle aucun fait caché.'}:info}
function toast(msg){const el=byId('toast');if(!el)return;el.textContent=msg;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),2200)}
function sessionKey(){return'igr_v11_session'}
function storeKey(){return`igr_v11_notes_${STATE.room}`}
function readStore(){try{return JSON.parse(STORAGE.getItem(storeKey())||'null')||{cycle:1,events:[],notes:{},timerEndsAt:null,breaking:0}}catch{return{cycle:1,events:[],notes:{},timerEndsAt:null,breaking:0}}}
function writeStore(x){STORAGE.setItem(storeKey(),JSON.stringify(x))}
function saveSession(){if(!STATE.room||!STATE.token)return;STORAGE.setItem(sessionKey(),JSON.stringify({view:STATE.view,selectedScenario:STATE.selectedScenario,scenarioId:STATE.scenarioId,room:STATE.room,token:STATE.token,hostToken:STATE.hostToken,playerId:STATE.playerId,playerPseudo:STATE.playerPseudo,role:STATE.role,tab:STATE.tab}))}
function clearSession(){STORAGE.removeItem(sessionKey())}
function newCode(){const c='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';let x='';for(let i=0;i<5;i++)x+=c[Math.floor(Math.random()*c.length)];return x}
function headers(){return{'apikey':SUPABASE_KEY,'Authorization':`Bearer ${SUPABASE_KEY}`,'Content-Type':'application/json'}}
async function rpc(name,payload){
 const ctl=new AbortController(),started=Date.now(),timer=setTimeout(()=>ctl.abort(),12000);
 try{
  const r=await fetch(`${API}/rpc/${name}`,{method:'POST',headers:headers(),body:JSON.stringify(payload),signal:ctl.signal});
  if(!r.ok){const body=await r.json().catch(()=>({}));const e=new Error(body.message||`Erreur ${r.status}`);e.code=body.code;e.status=r.status;throw e}
  const data=await r.json();
  if((name==='igr_v4_sync'||name==='igr_omerta_standalone_safe_sync')&&data.server_now)STATE.serverOffset=Date.parse(data.server_now)-(started+Date.now())/2;
  return data;
 }finally{clearTimeout(timer)}
}

function shell(content,homeLocked=false){
 // A floating control must not survive switching screens or rooms.
 document.querySelector?.('body > .live-session-controls')?.remove();
 document.documentElement.classList.toggle('home-locked',homeLocked);
 document.body.classList.toggle('home-locked',homeLocked);
 return`<div class="app ${homeLocked?'app-home-locked':''}"><div class="topbar"><div class="brand"><img src="assets/apple-touch-icon-v9.png?v=${VERSION}" alt="logo"><div><div class="brand-title">Inside Grey Room</div><div class="brand-sub">thriller psychologique</div></div></div>${homeLocked?'':`<div class="top-actions"><button class="pill-btn" onclick="openSettings()">Paramètres</button></div>`}</div>${content}</div>`
}

function renderHome(){
 byId('app').innerHTML=shell(`
  <div class="home home-v10-13">
    <section class="hero-image hero-image-home hero-image-home-v10-13">
      <picture><source media="(min-width:901px)" srcset="assets/intro-v10-14.webp"><img src="${HOME_ART}" alt="Scénographie Inside Grey Room"></picture>
    </section>
    <section class="home-card home-card-v10-13">
      <div class="home-title-spaced">INSIDE<br>GREY ROOM</div>
      <div class="home-subcopy">Thriller psychologique</div>
      <div class="home-actions home-actions-v10-13">${STORAGE.getItem(sessionKey())?`<button class="btn primary block" onclick="resumeSession()">Reprendre ma cellule</button>`:''}
        <div class="home-action primary" role="button" tabindex="0" onclick="goCreate()"><div class="icon">＋</div><div><h3>Créer une partie</h3><p>Choisir un scénario.</p></div></div>
        <div class="home-action" role="button" tabindex="0" onclick="goJoin()"><div class="icon">↳</div><div><h3>Rejoindre une partie</h3><p>Entrer un code de cellule.</p></div></div>
        <div class="home-action" role="button" tabindex="0" onclick="goRules()"><div class="icon">≣</div><div><h3>Règles du jeu</h3><p>Flux, rôles et fin de partie.</p></div></div>
        <div class="home-action" role="button" tabindex="0" onclick="goProfile()"><div class="icon">◉</div><div><h3>Profil</h3><p>Photo, pseudo et progression.</p></div></div>
      </div>
      <div class="home-utility-links"><button class="home-settings-link" onclick="openSettings()">⚙ Paramètres</button><button class="home-settings-link" onclick="openPrivacy()">Confidentialité · Sécurité</button></div>
    </section>
  </div>`,true);
 if(SOUND.enabled)ensureAmbient('menu');
}
function goHome(){STATE.view='home';if(STATE.room)saveSession();renderHome()}
function goCreate(){STATE.view='create-list';saveSession();renderCreateList()}
function goJoin(){STATE.view='join';saveSession();renderJoin()}
function goRules(){STATE.view='rules';saveSession();renderRules()}
function goProfile(){STATE.view='profile';saveSession();renderProfile()}

// DOSSIER 007 NON PUBLIÉ: le client ne l'ouvre que si le serveur l'autorise.
// La création/le lancement refont une vérification fraîche; le serveur reste l'autorité. Ne pas supprimer ces gardes isolément.
// Release discovery is Boolean-only; manuscripts remain in the private schema.
// Every actual room creation and launch rechecks the server (fail closed).
const IGR007_PUBLISH={enabled:false,checkedAt:0,checking:false};
async function refresh007PublishState(force=false){
 if(IGR007_PUBLISH.checking||(!force&&Date.now()-IGR007_PUBLISH.checkedAt<30000))return;
 IGR007_PUBLISH.checking=true;
 try{
  IGR007_PUBLISH.enabled=(await rpc('igr_v291_007_catalog_enabled',{}))===true;
 }catch{
  IGR007_PUBLISH.enabled=false;
 }finally{
  IGR007_PUBLISH.checkedAt=Date.now();
  IGR007_PUBLISH.checking=false;
 }
 if(STATE.view==='create-list')renderCreateList();
}
function renderCreateList(){
 const release007=typeof IGR007_PUBLISH!=='undefined'&&IGR007_PUBLISH.enabled;
 byId('app').innerHTML=shell(`<main class="page page-create-v10-13"><div class="page-head"><div><div class="kicker">Créer une partie</div><h1>Choisissez un scénario</h1></div><button class="btn ghost small" onclick="goHome()">← Accueil</button></div><section class="panel scenario-panel-v10-13"><div class="scenario-list scenario-list-v10-13">${SCENARIOS.map(sc=>`<article id="scenario-${sc.id}" class="scenario scenario--art scenario--compact" role="${(sc.id!=='007'||release007)?'button':'group'}" ${(sc.id!=='007'||release007)?`tabindex="0" onclick="selectScenario('${sc.id}')"`:'aria-disabled="true"'}><div class="scenario-thumb compact"><img loading="lazy" decoding="async" src="${scenarioThumbArt(sc.id)}" alt="${h(sc.title)}"></div><div class="scenario-body compact"><div class="scenario-id">Dossier ${h(sc.id)}</div><h3>${h(sc.title)}</h3><p>${h(sc.short)}</p><div class="tag-row"><span class="tag">${h(playerCountLabel(sc))}</span>${scenarioDifficultyTag(sc)}${(sc.id!=='007'||release007)?'':'<span class="tag">EN PRÉPARATION</span>'}</div></div></article>`).join('')}</div></section></main>`)
 if(typeof refresh007PublishState==='function')void refresh007PublishState();
}
function selectScenario(id){
 if(id==='007'&&!(typeof IGR007_PUBLISH!=='undefined'&&IGR007_PUBLISH.enabled))return toast('Dossier en préparation : publication non autorisée.');
 STATE.createListScrollY=window.scrollY;
 STATE.selectedScenario=id;
 STATE.view='create-confirm';
 saveSession();
 window.scrollTo({top:0,behavior:'auto'});
 renderCreateConfirm();
}
function backToScenarioList(){
 const y=STATE.createListScrollY;
 STATE.view='create-list';
 saveSession();
 renderCreateList();
 requestAnimationFrame(()=>{
   if(Number.isFinite(y)&&y>0)window.scrollTo({top:y,behavior:'auto'});
   else byId(`scenario-${STATE.selectedScenario}`)?.scrollIntoView({block:'center',behavior:'auto'});
 });
}
function renderCreateConfirm(){
 const sc=scenario(STATE.selectedScenario);const remembered=loadProfile().pseudo||STORAGE.getItem('igr_v9_last_pseudo')||'';
 byId('app').innerHTML=shell(`<main class="page page-confirm-v10-13"><div class="page-head"><div><div class="kicker">Dossier ${h(sc.id)}</div><h1>${h(sc.title)}</h1></div><button class="btn ghost small" onclick="backToScenarioList()">← Scénarios</button></div><section class="panel confirm-panel-v10-13"><div class="confirm-art"><img src="${scenarioArt(sc.id)}" alt="${h(sc.title)}"></div><div class="confirm"><p class="confirm-copy">${h(sc.context)}</p><div class="tag-row"><span class="tag">${h(playerCountLabel(sc))}</span><span class="tag">${h(sc.mood)}</span>${scenarioDifficultyTag(sc)}</div>${rolesBlock(sc)}<div class="field"><label for="createPseudo">Ton pseudo</label><input id="createPseudo" maxlength="22" autocomplete="nickname" autocorrect="off" spellcheck="false" value="${h(remembered)}" placeholder="Votre pseudo"></div><button class="btn primary block" onclick="createRoom()">Ouvrir la cellule</button></div></section></main>`)
}
function renderJoin(){
 const remembered=loadProfile().pseudo||STORAGE.getItem('igr_v9_last_pseudo')||'';
 byId('app').innerHTML=shell(`<main class="page"><div class="page-head"><div><div class="kicker">Rejoindre</div><h1>La cellule vous attend</h1></div><button class="btn ghost small" onclick="goHome()">← Accueil</button></div><section class="panel"><div class="confirm"><div class="field"><label for="joinPseudo">Ton pseudo</label><input id="joinPseudo" maxlength="22" autocomplete="nickname" autocorrect="off" spellcheck="false" value="${h(remembered)}" placeholder="Votre pseudo"></div><div class="field"><label for="joinCode">Code</label><input id="joinCode" maxlength="5" placeholder="ABCDE" autocapitalize="characters"></div><button class="btn primary block" onclick="joinRoom()">Rejoindre</button></div></section></main>`)
}

const PROFILE_TITLES=[
 {id:'none',label:'Aucun titre',desc:'',hidden:true,ok:p=>true},
 {id:'vic_enqueteur',label:'Architecte du Verdict',desc:'Gagner une partie comme Enquêteur.',ok:p=>winsByRole(p,'enqueteur')>=1},
 {id:'vic_analyste',label:'Lecteur de Failles',desc:'Gagner une partie comme Analyste.',ok:p=>winsByRole(p,'analyste')>=1},
 {id:'vic_suspect',label:'Frontière Tenue',desc:'Gagner une partie comme Suspect.',ok:p=>winsByRole(p,'suspect')>=1},
 {id:'vic_avocat',label:'Maître de la Défense',desc:'Gagner une partie comme Avocat.',ok:p=>winsByRole(p,'maitre')>=1},
 {id:'vic_procureur',label:'Accusation Maîtrisée',desc:'Gagner une partie comme Procureur.',ok:p=>winsByRole(p,'procureur')>=1},
 {id:'vic_juge',label:'Balance Grise',desc:'Gagner une partie comme Juge.',ok:p=>winsByRole(p,'juge')>=1},
 {id:'vic_journaliste',label:'Voix sous Pression',desc:'Gagner une partie comme Journaliste.',ok:p=>winsByRole(p,'journaliste')>=1},
 {id:'vic_inspecteur',label:'Pisteur de Terrain',desc:'Gagner une partie comme Inspecteur.',ok:p=>winsByRole(p,'inspecteur')>=1},
 {id:'vic_expert',label:'Expert du Dossier',desc:'Gagner une partie comme Expert.',ok:p=>winsByRole(p,'expert')>=1},
 {id:'vic_temoin',label:'Témoin Inébranlable',desc:'Gagner une partie comme Témoin.',ok:p=>winsByRole(p,'temoin')>=1},
 {id:'vic_espion',label:'Ombre dans la Cellule',desc:'Gagner une partie comme Espion.',ok:p=>winsByRole(p,'espion')>=1}
];
const PROFILE_BADGES=[
 {id:'none',glyph:'',label:'Aucun badge',desc:'',hidden:true,ok:p=>true},
 {id:'enq_sans_correction',glyph:'◎',label:'Sans Correction',desc:'Enquêteur : verdict provisoire et verdict final entièrement exacts.',ok:p=>hasAchievement(p,'enq_sans_correction')},
 {id:'analyste_parfait',glyph:'◈',label:'Lecture Parfaite',desc:'Analyste : verrouillage final entièrement exact.',ok:p=>hasAchievement(p,'analyste_parfait')},
 {id:'suspect_sous_pression',glyph:'◆',label:'Sous Pression',desc:'Suspect : faire reconnaître exactement une responsabilité réelle importante ou centrale.',ok:p=>hasAchievement(p,'suspect_sous_pression')},
 {id:'avocat_double_defense',glyph:'⚖',label:'Défense Multiple',desc:'Avocat : protéger exactement au moins deux clients dans la même partie.',ok:p=>hasAchievement(p,'avocat_double_defense')},
 {id:'procureur_double_entretien',glyph:'▲',label:'Double Entretien',desc:'Badge historique de l’ancienne règle d’entretiens ciblés.',hidden:true,ok:p=>hasAchievement(p,'procureur_double_entretien')},
 {id:'juge_confidentiel',glyph:'◇',label:'Secret Maîtrisé',desc:'Juge : gagner en consommant au maximum 2 protections.',ok:p=>hasAchievement(p,'juge_confidentiel')},
 {id:'journaliste_trois_unes',glyph:'✦',label:'Trois Unes',desc:'Journaliste : gagner après avoir publié trois Breaking News.',ok:p=>hasAchievement(p,'journaliste_trois_unes')},
 {id:'inspecteur_trois_pistes',glyph:'▣',label:'Terrain Quadrillé',desc:'Inspecteur : gagner après au moins trois actions de terrain.',ok:p=>hasAchievement(p,'inspecteur_trois_pistes')},
 {id:'expert_trois_analyses',glyph:'⬡',label:'Analyse Croisée',desc:'Expert : gagner après au moins trois analyses techniques.',ok:p=>hasAchievement(p,'expert_trois_analyses')},
 {id:'temoin_intouchable',glyph:'○',label:'Hors de Cause',desc:'Témoin : gagner sans même devenir personne d’intérêt.',ok:p=>hasAchievement(p,'temoin_intouchable')},
 {id:'espion_ombre',glyph:'⬢',label:'Ombre Totale',desc:'Espion : gagner alors que l’enquête ne reconstruit pas plus de la moitié des responsabilités.',ok:p=>hasAchievement(p,'espion_ombre')}
];
function winsByRole(p,role){return (p.history||[]).filter(x=>x.won&&x.role===role).length}
function hasAchievement(p,id){return (p.history||[]).some(x=>(x.achievements||[]).includes(id))}
function unlockedTitles(p=loadProfile()){return PROFILE_TITLES.filter(x=>!x.hidden&&x.ok(p))}
function unlockedBadges(p=loadProfile()){return PROFILE_BADGES.filter(x=>!x.hidden&&x.ok(p))}
function profileTitle(id,p=loadProfile()){return unlockedTitles(p).find(x=>x.id===id)||PROFILE_TITLES[0]}
function profileBadge(id,p=loadProfile()){return unlockedBadges(p).find(x=>x.id===id)||PROFILE_BADGES[0]}

function playerCosmeticLine(player){
 if(!player)return'';
 const badge=PROFILE_BADGES.find(x=>x.id===player.equipped_badge)||PROFILE_BADGES[0];
 const title=PROFILE_TITLES.find(x=>x.id===player.equipped_title)||PROFILE_TITLES[0];
 return `<span class="player-cosmetic"><b>${h(badge.glyph)}</b>${h(title.label)}</span>`;
}

function loadProfile(){
 try{return Object.assign({pseudo:'',avatar:'',games:0,completed:0,wins:0,lastScenario:'',history:[],equippedTitle:'none',equippedBadge:'none'},JSON.parse(STORAGE.getItem('igr_v11_profile')||'{}'))}catch{return{pseudo:'',avatar:'',games:0,completed:0,wins:0,lastScenario:'',history:[],equippedTitle:'none',equippedBadge:'none'}}
}
function saveProfileData(p){STORAGE.setItem('igr_v11_profile',JSON.stringify(Object.assign(loadProfile(),p||{})))}
function initials(name='?'){return String(name||'?').trim().split(/\s+/).slice(0,2).map(x=>x[0]||'').join('').toUpperCase()||'?'}
function safeAvatar(src){return /^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(src||'')?src:''}
function avatarSource(id){return safeAvatar(AVATARS.map.get(id)||(id===STATE.playerId?loadProfile().avatar:''))}
function avatarHtml(id,pseudo,cls=''){const src=avatarSource(id);return src?`<span class="avatar ${cls}"><img src="${src}" alt="Photo de ${h(pseudo)}"></span>`:`<span class="avatar avatar-fallback ${cls}" aria-label="${h(pseudo)}">${h(initials(pseudo))}</span>`}
function equipProfileTitle(id){
 const p=loadProfile(),item=unlockedTitles(p).find(x=>x.id===id);
 if(!item)return toast('Ce titre n’est pas débloqué.');
 saveProfileData({equippedTitle:id});
 renderProfile();
 void pushProfileCosmetics();
 toast(`Titre équipé : ${item.label}`);
}
function equipProfileBadge(id){
 const p=loadProfile(),item=unlockedBadges(p).find(x=>x.id===id);
 if(!item)return toast('Ce badge n’est pas débloqué.');
 saveProfileData({equippedBadge:id});
 renderProfile();
 void pushProfileCosmetics();
 toast(`Badge équipé : ${item.label}`);
}
function renderProfile(){
 const p=loadProfile();p.avatar=safeAvatar(p.avatar);const titles=unlockedTitles(p),badges=unlockedBadges(p),equippedTitle=profileTitle(p.equippedTitle,p),equippedBadge=profileBadge(p.equippedBadge,p);
 const titleCards=titles.length?titles.map(x=>{const active=equippedTitle.id===x.id;return `<button class="reward-card ${active?'active':''}" onclick="equipProfileTitle('${x.id}')"><span class="reward-state">${active?'ÉQUIPÉ':'DÉBLOQUÉ'}</span><b>${h(x.label)}</b><small>${h(x.desc)}</small></button>`}).join(''):`<div class="empty-rewards">Aucun titre débloqué pour le moment.</div>`;
 const badgeCards=badges.length?badges.map(x=>{const active=equippedBadge.id===x.id;return `<button class="badge-card ${active?'active':''}" onclick="equipProfileBadge('${x.id}')"><span class="badge-glyph">${h(x.glyph)}</span><span><b>${h(x.label)}</b><small>${h(x.desc)}</small></span></button>`}).join(''):`<div class="empty-rewards">Aucun badge débloqué pour le moment.</div>`;
 byId('app').innerHTML=shell(`<main class="page profile-page"><div class="page-head"><div><div class="kicker">Profil joueur</div><h1>Ton identité</h1></div><button class="btn ghost small" onclick="goHome()">← Accueil</button></div><section class="panel profile-panel"><div class="profile-avatar-wrap"><div id="profilePreview">${p.avatar?`<span class="avatar avatar-profile"><img src="${p.avatar}" alt="Photo de profil"></span>`:`<span class="avatar avatar-fallback avatar-profile">${h(initials(p.pseudo||'?'))}</span>`}</div><div><h2>${h(p.pseudo||'Nouveau joueur')}</h2><div class="profile-equipped-line">${equippedBadge.id!=='none'?`<span class="equipped-badge">${h(equippedBadge.glyph)}</span>`:''}<span>${equippedTitle.id!=='none'?h(equippedTitle.label):'Aucun titre équipé'}</span></div><p>Tes titres et badges sont des trophées de victoire visibles dans ton profil. Ils restent hors de l’interface de partie.</p></div></div><div class="field"><label for="profilePseudo">Pseudo</label><input id="profilePseudo" maxlength="22" autocomplete="nickname" autocorrect="off" spellcheck="false" value="${h(p.pseudo)}" placeholder="Votre pseudo"></div><div class="profile-photo-actions"><label class="btn" for="profilePhoto">Choisir une photo</label><input id="profilePhoto" type="file" accept="image/*" hidden onchange="profilePhotoChanged(this.files?.[0])"><button class="btn ghost" onclick="removeProfilePhoto()">Supprimer la photo</button></div><div class="profile-stats"><div><b>${p.games||0}</b><span>parties lancées</span></div><div><b>${p.wins||0}</b><span>victoires</span></div><div><b>${p.completed||0}</b><span>dossiers terminés</span></div></div><div class="reward-section"><div class="section-title"><h2>Titres débloqués</h2><span>${titles.length} disponibles</span></div><div class="reward-grid">${titleCards}</div></div><div class="reward-section"><div class="section-title"><h2>Badges débloqués</h2><span>${badges.length} disponibles</span></div><div class="badge-grid">${badgeCards}</div></div>${(p.history||[]).length?`<div class="profile-history"><div class="section-title"><h2>Historique récent</h2><span>${Math.min((p.history||[]).length,8)} dossiers</span></div>${(p.history||[]).slice(0,8).map(x=>`<div class="history-row"><span>Dossier ${h(x.scenario||'—')} · ${h(x.title||'')}${x.role?` · ${h(publicRoleLabel(x.role))}`:''}</span><small>${h(x.date||'')}</small></div>`).join('')}</div>`:''}<button class="btn primary block" onclick="saveProfileForm()">Enregistrer le profil</button><div class="profile-privacy-actions"><button class="btn ghost block" onclick="openPrivacy()">Confidentialité et données</button><button class="btn ghost block" onclick="openSupport()">Support</button>${STATE.room&&STATE.token?`<button class="btn ghost block" onclick="openSafety()">Signaler ou bloquer un joueur</button>`:''}</div></section></main>`)
}

async function compressAvatar(file){
 if(!file||!/^image\/(jpeg|png|webp)$/i.test(file.type||''))throw new Error('invalid image');
 if(file.size>12*1024*1024)throw new Error('image too large');
 const url=URL.createObjectURL(file);
 try{
  const image=await new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=reject;im.src=url});
  const side=Math.min(image.naturalWidth||image.width,image.naturalHeight||image.height);if(!side)throw new Error('empty image');
  const sx=((image.naturalWidth||image.width)-side)/2,sy=((image.naturalHeight||image.height)-side)/2;
  for(const size of [256,224,192]){
   const c=document.createElement('canvas');c.width=c.height=size;const ctx=c.getContext('2d',{alpha:false});
   ctx.fillStyle='#101216';ctx.fillRect(0,0,size,size);ctx.drawImage(image,sx,sy,side,side,0,0,size,size);
   for(const q of [.82,.72,.62,.52]){const data=c.toDataURL('image/jpeg',q);if(data.length<=95000)return data}
  }
  throw new Error('compressed image too large');
 }finally{URL.revokeObjectURL(url)}
}

async function profilePhotoChanged(file){try{const avatar=await compressAvatar(file);saveProfileData({avatar});renderProfile();toast('Photo prête.')}catch(e){console.error(e);toast('Photo impossible à préparer.')}}
function removeProfilePhoto(){saveProfileData({avatar:''});renderProfile()}
function saveProfileForm(){const pseudo=(byId('profilePseudo')?.value||'').trim();if(!pseudo)return toast('Choisis un pseudo.');saveProfileData({pseudo});STORAGE.setItem('igr_v9_last_pseudo',pseudo);renderProfile();pushProfileCosmetics();toast('Profil enregistré.')}
async function pushProfileAvatar(){try{await rpc('igr_v4_set_avatar',{p_code:STATE.room,p_player_token:STATE.token,p_avatar:loadProfile().avatar||''});AVATARS.sig='';}catch(e){console.warn('avatar upload',e)}}
async function pushProfileCosmetics(){
 if(!STATE.room||!STATE.token)return;
 const p=loadProfile(),title=profileTitle(p.equippedTitle,p),badge=profileBadge(p.equippedBadge,p);
 try{await rpc('igr_v4_set_profile_cosmetics',{p_code:STATE.room,p_player_token:STATE.token,p_title:title.id,p_badge:badge.id})}catch(e){console.warn('profile cosmetics',e)}
}

async function refreshAvatars(d,force=false){
 if(!STATE.room||!STATE.token||!d)return;const sig=(d.players||[]).map(p=>`${p.id}:${p.avatar_rev||0}`).join('|');if(!force&&sig===AVATARS.sig)return;
 const room=STATE.room,token=STATE.token;
 if(AVATARS.pending?.room===room&&AVATARS.pending?.token===token&&AVATARS.pending?.sig===sig)return AVATARS.pending.promise;
 const pending={room,token,sig,promise:null};AVATARS.pending=pending;
 pending.promise=(async()=>{
  try{
   const arr=await rpc('igr_v4_get_avatars',{p_code:room,p_player_token:token});
   if(STATE.room!==room||STATE.token!==token||AVATARS.pending!==pending)return false;
   AVATARS.map=new Map((arr||[]).filter(x=>x.avatar).map(x=>[x.id,x.avatar]));AVATARS.sig=sig;return true;
  }catch(e){console.warn('avatars',e);return false}finally{if(AVATARS.pending===pending)AVATARS.pending=null}
 })();
 return pending.promise;
}
function matchNumber(d){return Math.max(1,Number(d?.room?.state?.match_no||1))}
function markGameStarted(d){
 if(!d?.room?.code||d.room.status!=='playing')return;
 const key=`igr_v11_started_${d.room.code}_${matchNumber(d)}`;if(STORAGE.getItem(key))return;
 STORAGE.setItem(key,'1');const p=loadProfile();saveProfileData({games:(p.games||0)+1,lastScenario:d.room.scenario_id});
}
function markGameCompleted(d){
 if(!d?.room?.code||d.room.status!=='finished')return;
 const reveal=(d.events||[]).filter(e=>e.event_type==='reveal').slice(-1)[0]?.payload;
 const result=(reveal?.results||[]).find(x=>String(x.player_id)===String(d.player?.id))
   ||(reveal?.results||[]).find(x=>x.pseudo===d.player?.pseudo);
 if(!result)return;
 const key=`igr_v11_completed_${d.room.code}_${matchNumber(d)}`;if(STORAGE.getItem(key))return;
 STORAGE.setItem(key,'1');
 const p=loadProfile(),sc=scenario(d.room.scenario_id),won=!!result.success,achievements=Array.isArray(result.achievements)?result.achievements:[];
 const strength=(d.room.state?.continuation?.winners||[]).find(x=>String(x.id)===String(d.player?.id))?.score||null;
 const history=[{scenario:sc.id,title:sc.title,role:result.role||d.player?.public_role||'',publicRole:d.player?.public_role||'',won,strength,achievements,date:new Intl.DateTimeFormat('fr-CH',{day:'2-digit',month:'2-digit',year:'numeric'}).format(new Date())},...(p.history||[])].slice(0,40);
 const before=new Set([...unlockedTitles(p).map(x=>'t:'+x.id),...unlockedBadges(p).map(x=>'b:'+x.id)]);
 saveProfileData({completed:(p.completed||0)+1,wins:(p.wins||0)+(won?1:0),lastScenario:d.room.scenario_id,history});
 const np=loadProfile(),newReward=[...unlockedTitles(np).map(x=>({k:'t:'+x.id,n:x.label})),...unlockedBadges(np).map(x=>({k:'b:'+x.id,n:x.label}))].find(x=>!before.has(x.k));
 if(newReward)setTimeout(()=>toast(`Récompense débloquée : ${newReward.n}`),700);
}


function renderRules(){
 byId('app').innerHTML=shell(`<main class="page"><div class="page-head"><div><div class="kicker">Règles</div><h1>Cadre de jeu</h1></div><button class="btn ghost small" onclick="goHome()">← Accueil</button></div><section class="panel"><div class="rule-list">${RULES.map(r=>`<div class="rule"><h3>${h(r.title)}</h3><p>${r.items.map(i=>`• ${h(i)}`).join('<br>')}</p></div>`).join('')}</div></section></main>`)
}

function openSettings(){
 if(document.querySelector('.modal'))return;
 document.body.insertAdjacentHTML('beforeend',`<div class="modal" onclick="if(event.target===this)closeSettings()"><div class="modal-box" role="dialog" aria-modal="true" aria-label="Paramètres" tabindex="-1"><div class="kicker">Paramètres</div><h2 style="margin:7px 0 16px;font-size:30px">Audio</h2><div class="settings-grid"><div class="setting"><div><h4>Activer le son</h4><p>Les réglages sont audibles immédiatement.</p></div><label class="sound-check"><input id="soundOn" aria-label="Activer le son" type="checkbox" ${SOUND.enabled?'checked':''} onchange="liveSoundToggle(this.checked)"><span aria-hidden="true"></span></label></div><div class="setting"><div><h4>Volume général</h4><p id="masterValue">${Math.round(SOUND.master*100)} %</p></div><input id="master" aria-label="Volume général" type="range" min="0" max="1" step=".01" value="${SOUND.master}" oninput="liveSoundRange('master',this.value)"></div><div class="setting"><div><h4>Ambiance</h4><p id="ambienceValue">${Math.round(SOUND.ambience*100)} %</p></div><input id="ambience" aria-label="Ambiance" type="range" min="0" max="1" step=".01" value="${SOUND.ambience}" oninput="liveSoundRange('ambience',this.value)"></div><div class="setting"><div><h4>Effets / alertes</h4><p id="effectsValue">${Math.round(SOUND.effects*100)} %</p></div><input id="effects" aria-label="Effets et alertes" type="range" min="0" max="1" step=".01" value="${SOUND.effects}" oninput="liveSoundRange('effects',this.value)"></div></div><div class="security-settings-actions"><button class="btn ghost block" onclick="closeSettings();openPrivacy()">Confidentialité et données</button><button class="btn ghost block" onclick="closeSettings();openSupport()">Support</button>${STATE.room&&STATE.token?`<button class="btn ghost block" onclick="closeSettings();openSafety()">Sécurité de la cellule · signaler / bloquer</button>`:''}</div><div class="modal-actions"><button class="btn primary small" onclick="saveSettings()">Terminé</button></div></div></div>`)
}
function closeSettings(){saveAudioPreferences();document.querySelector('.modal')?.remove();releaseDialogFocus()}
function saveAudioPreferences(){for(const k of ['master','ambience','effects'])setPref(`igr_v9_${k}`,SOUND[k]);setPref('igr_v9_sound_enabled',SOUND.enabled)}

function closeUtilityModal(){document.querySelector('.modal')?.remove();releaseDialogFocus()}
function privacyBody(){return `<div class="privacy-copy"><p><b>Inside Grey Room</b> utilise un pseudonyme, une photo de profil facultative, les données nécessaires à la partie et les messages envoyés dans une cellule. Les cellules de jeu sont supprimées automatiquement du backend après environ 12 heures d’inactivité.</p><p>La caméra et le microphone ne sont utilisés qu’après une action volontaire pour le flux WebRTC. Le jeu ne contient pas de fonction d’enregistrement du flux.</p><p>Les données multijoueurs transitent par Supabase. Les signalements de sécurité et demandes de support peuvent être conservés jusqu’à 180 jours afin de traiter les abus et incidents. Aucun SDK publicitaire ni vente de données n’est intégré.</p><p>Les statistiques, récompenses, notes privées et informations de reprise peuvent rester sur cet appareil. Tu peux les effacer ci-dessous.</p><h3>Règles de communauté</h3><p>Harcèlement, menaces, haine, contenu sexuel inapproprié, spam et atteintes à la vie privée sont interdits. Utilise les fonctions <b>Bloquer</b> et <b>Signaler</b> en cas d’abus. Un signalement n’altère jamais le résultat de la partie.</p></div>`}
function openPrivacy(){
 if(document.querySelector('.modal'))return;
 document.body.insertAdjacentHTML('beforeend',`<div class="modal" onclick="if(event.target===this)closeUtilityModal()"><div class="modal-box utility-modal" role="dialog" aria-modal="true" aria-label="Confidentialité et sécurité"><div class="kicker">Confidentialité</div><h2>Vos données</h2>${privacyBody()}<div class="safety-note">Pour un comportement abusif pendant une partie, ouvre <b>Sécurité de la cellule</b> afin de bloquer le joueur et d’envoyer un signalement au développeur.</div><div class="modal-actions utility-actions">${STATE.room&&STATE.token?`<button class="btn" onclick="closeUtilityModal();openSafety()">Sécurité de la cellule</button>`:''}<button class="btn ghost" onclick="closeUtilityModal();openSupport()">Contacter le support</button><button class="btn danger" onclick="clearLocalPlayerData()">Effacer mes données locales</button><button class="btn primary" onclick="closeUtilityModal()">Fermer</button></div></div></div>`)
}
function clearLocalPlayerData(){
 if(!confirm('Effacer le profil, les récompenses, l’historique, les notes privées et la session enregistrée sur cet appareil ?'))return;
 const keys=[];try{for(let i=0;i<localStorage.length;i++)keys.push(localStorage.key(i))}catch{}
 keys.filter(k=>k&&/^igr_/.test(k)).forEach(k=>STORAGE.removeItem(k));
 STORAGE.memory.clear();AVATARS.map.clear();AVATARS.sig='';SAFETY.blocked.clear();SAFETY.loaded=false;
 stopRoomWatcher();Object.assign(STATE,{view:'home',room:null,token:null,hostToken:null,playerId:null,playerPseudo:'',sync:null,syncSig:''});
 closeUtilityModal();renderHome();toast('Données locales effacées.');
}
async function loadSafetyState(){
 if(!STATE.room||!STATE.token)return SAFETY;
 try{const d=await rpc('igr_v4_get_safety_state',{p_code:STATE.room,p_player_token:STATE.token});SAFETY.blocked=new Set((d?.blocked_player_ids||[]).map(String));SAFETY.loaded=true}catch(e){console.warn('safety state',e)}
 return SAFETY;
}
async function openSafety(){
 if(!STATE.room||!STATE.token)return openPrivacy();
 document.querySelector('.modal')?.remove();await loadSafetyState();renderSafetyModal();
}
function renderSafetyModal(){
 const players=(STATE.sync?.players||[]).filter(p=>String(p.id)!==String(STATE.playerId));
 const rows=players.length?players.map(p=>{const blocked=SAFETY.blocked.has(String(p.id));return `<div class="safety-player"><span>${avatarHtml(p.id,p.pseudo,'avatar-small')}<span><b>${h(p.pseudo)}</b><small>${h(publicRoleLabel(p.public_role||p.preferred_role||'suspect'))}</small></span></span><span class="safety-buttons"><button class="btn small ${blocked?'primary':'ghost'}" onclick="togglePlayerBlock('${p.id}',${blocked?'false':'true'})">${blocked?'Débloquer':'Bloquer'}</button><button class="btn small danger" onclick="openReportForm('${p.id}')">Signaler</button></span></div>`}).join(''):'<div class="empty-state">Aucun autre joueur dans la cellule.</div>';
 document.body.insertAdjacentHTML('beforeend',`<div class="modal" onclick="if(event.target===this)closeUtilityModal()"><div class="modal-box utility-modal" role="dialog" aria-modal="true" aria-label="Sécurité de la cellule"><div class="kicker">Sécurité</div><h2>Cellule ${h(STATE.room)}</h2><p class="safety-note">Bloquer masque ses nouveaux messages pour toi, empêche les messages privés et coupe les nouvelles connexions vidéo entre vous. Le blocage ne modifie jamais son rôle ni le résultat de la partie.</p><div class="safety-list">${rows}</div><div class="modal-actions utility-actions"><button class="btn ghost" onclick="closeUtilityModal();openPrivacy()">Confidentialité</button><button class="btn primary" onclick="closeUtilityModal()">Fermer</button></div></div></div>`)
}
async function togglePlayerBlock(id,block){
 try{await rpc('igr_v4_block_player',{p_code:STATE.room,p_player_token:STATE.token,p_target:id,p_block:!!block});if(block){SAFETY.blocked.add(String(id));closePeer?.(id)}else SAFETY.blocked.delete(String(id));AVATARS.sig='';await refreshAvatars(STATE.sync,true);closeUtilityModal();renderSafetyModal();toast(block?'Joueur bloqué.':'Joueur débloqué.')}catch(e){console.error(e);toast('Action de sécurité impossible.')}
}
function openReportForm(id){
 const p=(STATE.sync?.players||[]).find(x=>String(x.id)===String(id));if(!p)return;
 closeUtilityModal();
 document.body.insertAdjacentHTML('beforeend',`<div class="modal" onclick="if(event.target===this)closeUtilityModal()"><div class="modal-box utility-modal" role="dialog" aria-modal="true" aria-label="Signaler un joueur"><div class="kicker">Signalement</div><h2>${h(p.pseudo)}</h2><div class="field"><label for="reportReason">Motif</label><select id="reportReason"><option value="harassment">Harcèlement</option><option value="hate">Discours haineux</option><option value="sexual">Contenu sexuel inapproprié</option><option value="threat">Menace</option><option value="spam">Spam</option><option value="privacy">Atteinte à la vie privée</option><option value="other">Autre</option></select></div><div class="field"><label for="reportDetails">Détails facultatifs</label><textarea id="reportDetails" maxlength="600" placeholder="Décris brièvement ce qui s’est passé."></textarea></div><label class="safety-check"><input id="reportBlock" type="checkbox" checked> Bloquer aussi ce joueur</label><div class="modal-actions utility-actions"><button class="btn ghost" onclick="closeUtilityModal();renderSafetyModal()">Annuler</button><button class="btn danger" onclick="submitPlayerReport('${p.id}')">Envoyer le signalement</button></div></div></div>`)
}
async function submitPlayerReport(id){
 const reason=byId('reportReason')?.value||'other',details=(byId('reportDetails')?.value||'').trim(),block=!!byId('reportBlock')?.checked;
 try{await rpc('igr_v4_report_player',{p_code:STATE.room,p_player_token:STATE.token,p_target:id,p_reason:reason,p_details:details});if(block){await rpc('igr_v4_block_player',{p_code:STATE.room,p_player_token:STATE.token,p_target:id,p_block:true});SAFETY.blocked.add(String(id));closePeer?.(id)}closeUtilityModal();toast('Signalement envoyé.')}catch(e){console.error(e);toast('Signalement impossible ou déjà envoyé récemment.')}
}


function deviceId(){
 let id=STORAGE.getItem('igr_v12_device_id');
 if(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id||''))return id;
 try{id=crypto.randomUUID()}catch{id='xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{const r=Math.random()*16|0,v=c==='x'?r:(r&3|8);return v.toString(16)})}
 STORAGE.setItem('igr_v12_device_id',id);return id;
}
function openSupport(){
 if(document.querySelector('.modal'))return;
 const p=loadProfile();
 document.body.insertAdjacentHTML('beforeend',`<div class="modal" onclick="if(event.target===this)closeUtilityModal()"><div class="modal-box utility-modal" role="dialog" aria-modal="true" aria-label="Support Inside Grey Room"><div class="kicker">Support</div><h2>Nous contacter</h2><p class="safety-note">Utilise ce formulaire pour un problème technique, une question de confidentialité ou un incident de sécurité. N’envoie jamais de mot de passe, numéro de carte ou document d’identité.</p><div class="field"><label for="supportCategory">Catégorie</label><select id="supportCategory"><option value="technical">Problème technique</option><option value="account">Profil / progression</option><option value="privacy">Confidentialité</option><option value="safety">Sécurité / abus</option><option value="other">Autre</option></select></div><div class="field"><label for="supportMessage">Message</label><textarea id="supportMessage" maxlength="1200" placeholder="Décris le problème et les étapes pour le reproduire si possible."></textarea></div><div class="modal-actions utility-actions"><button class="btn ghost" onclick="closeUtilityModal();openPrivacy()">Retour</button><button class="btn primary" onclick="submitSupportRequest()">Envoyer</button></div></div></div>`)
}
async function submitSupportRequest(){
 const category=byId('supportCategory')?.value||'other',message=(byId('supportMessage')?.value||'').trim();
 if(message.length<3)return toast('Décris brièvement ta demande.');
 const p=loadProfile();
 try{
  const out=await rpc('igr_v4_contact_support',{p_device_id:deviceId(),p_category:category,p_message:message,p_room_code:STATE.room||null,p_pseudo:STATE.playerPseudo||p.pseudo||null});
  closeUtilityModal();toast(`Demande envoyée${out?.request_id?` · #${out.request_id}`:''}.`);
 }catch(e){console.error(e);toast('Envoi impossible pour le moment. Réessaie plus tard.')}
}

function liveNarrationToggle(){NARRATION.enabled=false;cancelBriefingVoice()}
function activeSoundPreset(){
 if(STATE.sync?.room?.phase==='briefing'||STATE.view==='briefing')return 'silent';
 return (STATE.view==='game'||STATE.view==='role') ? currentScenario().sound : 'menu';
}
function audioIsStale(){
 if(!SOUND.started)return true;
 if(SOUND.ctx && SOUND.ctx.state!=='running')return false;
 if(!SOUND.lastPhraseAt||!SOUND.expectedLoopMs)return false;
 return performance.now()-SOUND.lastPhraseAt > Math.max(2400,SOUND.expectedLoopMs*2.15);
}
function primeAudioOutput(){
 if(!SOUND.ctx)return;
 try{
   const o=SOUND.ctx.createOscillator(),g=SOUND.ctx.createGain();
   g.gain.value=.00001;
   o.connect(g);g.connect(SOUND.masterGain);
   o.start();o.stop(SOUND.ctx.currentTime+.025);
 }catch{}
}
function ensureLiveAudio(){
 initAudio();
 if(!SOUND.ctx||!SOUND.enabled)return;
 const preset=activeSoundPreset();
 if(preset==='silent'){stopAmbient();return;}
 primeAudioOutput();
 if(!SOUND.started||SOUND.preset!==preset||audioIsStale())startAmbient(preset);
 updateGains();
 if(SOUND.ctx.state!=='running'){
   try{SOUND.ctx.resume().catch(()=>{});}catch{}
 }
}
async function liveSoundToggle(on){
 SOUND.enabled=!!on;
 setPref('igr_v9_sound_enabled',SOUND.enabled);
 if(SOUND.enabled){
   const ok=await wakeAudioFromGesture();
   updateGains();
   if(ok)playLevelTick(.7);
 }else{
   cancelBriefingVoice();hideAudioWakePrompt();stopAmbient();updateGains();
 }
}
let lastFxPreview=0;
function liveSoundRange(kind,value){
 const v=Math.max(0,Math.min(1,+value||0));
 if(kind==='master')SOUND.master=v;
 if(kind==='ambience')SOUND.ambience=v;
 if(kind==='effects')SOUND.effects=v;
 setPref(`igr_v9_${kind}`,v);
 const label=byId(`${kind}Value`);
 if(label)label.textContent=`${Math.round(v*100)} %`;
 if(!SOUND.enabled){
   SOUND.enabled=true;setPref('igr_v9_sound_enabled',true);
   const toggle=byId('soundOn');
   if(toggle)toggle.checked=true;
 }
 ensureLiveAudio();
 updateGains();
 const now=performance.now();
 if(now-lastFxPreview>150){lastFxPreview=now;playSliderPreview(kind)}
}
function saveSettings(){
 SOUND.enabled=byId('soundOn').checked;
 SOUND.master=+byId('master').value;
 SOUND.ambience=+byId('ambience').value;
 SOUND.effects=+byId('effects').value;
 setPref('igr_v9_sound_enabled',SOUND.enabled);
 setPref('igr_v9_master',SOUND.master);
 setPref('igr_v9_ambience',SOUND.ambience);
 setPref('igr_v9_effects',SOUND.effects);
 updateGains();
 if(SOUND.enabled){
   ensureAmbient(activeSoundPreset());
 }else stopAmbient();
 closeSettings();
 toast('Son enregistré.');
}
function previewSound(){
 SOUND.enabled=true;
 SOUND.master=+byId('master').value;
 SOUND.ambience=+byId('ambience').value;
 SOUND.effects=+byId('effects').value;
 updateGains();
 ensureAmbient(activeSoundPreset());
 playCue('trame');
}


async function createRoom(){
 primeNarrationFromGesture();wakeAudioFromGesture().catch?.(()=>{});
 const pseudo=(byId('createPseudo')?.value||'').trim();
 if(!pseudo)return toast('Entre ton pseudo.');
 const sc=scenario(STATE.selectedScenario);
 if(sc.id==='007'){
  let released=false;
  try{released=(await rpc('igr_v291_007_catalog_enabled',{}))===true}catch{}
  if(!released)return toast('Dossier 007 en préparation : création suspendue.');
 }
 let out=null,code=null;
 for(let attempt=0;attempt<5;attempt++){
  code=newCode();
  try{out=await rpc('igr_v4_create_room',{p_code:code,p_scenario_id:sc.id,p_pseudo:pseudo});break}catch(e){if(e.code!=='23505'||attempt===4){console.error(e);return toast('Création non confirmée. Vérifie ta connexion avant de réessayer.')}}
 }
 STORAGE.setItem('igr_v9_last_pseudo',pseudo);saveProfileData({pseudo});
 Object.assign(STATE,{view:'lobby',scenarioId:sc.id,room:out.room_code||code,token:out.player_token,hostToken:out.host_token,playerId:out.player_id,playerPseudo:pseudo,role:'en_attente',tab:'card',sync:null,syncSig:''});
 saveSession();
 // The room must open even if optional profile/avatar RPCs fail on desktop.
 // Start the room watchdog before cosmetic work instead of serializing them.
 startRoomWatcher();
 const fresh=await syncNow(true);
 if(fresh?.room?.status==='lobby')renderLobby(fresh);
 void pushProfileAvatar().catch(error=>console.warn('avatar upload',error));
 void pushProfileCosmetics().catch(error=>console.warn('profile cosmetics',error));
}
async function joinRoom(){
 primeNarrationFromGesture();wakeAudioFromGesture().catch?.(()=>{});
 const pseudo=(byId('joinPseudo')?.value||'').trim(),code=(byId('joinCode')?.value||'').trim().toUpperCase();
 if(!pseudo||code.length!==5)return toast('Pseudo et code requis.');
 try{
  const out=await rpc('igr_v4_join_room',{p_code:code,p_pseudo:pseudo});
  STORAGE.setItem('igr_v9_last_pseudo',pseudo);saveProfileData({pseudo});
  Object.assign(STATE,{view:'lobby',room:out.room_code||code,token:out.player_token,hostToken:null,playerId:out.player_id,playerPseudo:pseudo,role:'en_attente',tab:'card',sync:null,syncSig:''});
  saveSession();startRoomWatcher();
  const fresh=await syncNow(true);
  if(fresh?.room?.status==='lobby')renderLobby(fresh);
  void pushProfileAvatar().catch(error=>console.warn('avatar upload',error));
  void pushProfileCosmetics().catch(error=>console.warn('profile cosmetics',error));
 }catch(e){console.error(e);toast('Cellule introuvable, pleine ou déjà lancée.');}
}
function syncSignature(d){
 if(!d)return'';
 // Ignore the moving server clock, but include edits to existing events and
 // scenario/role data even when event counts and the last event ID stay equal.
 return JSON.stringify([d.room,d.player,d.players,d.events,d.my_actions,d.pending_requests,d.scenario,d.suspects]);
}
function draftScope(){return [STATE.sync?.room?.code,STATE.sync?.room?.state?.match_no,STATE.sync?.player?.id,STATE.view,STATE.tab,STATE.sync?.room?.phase].join(':')}
function captureDrafts(){
 const active=document.activeElement;
 const root=byId('app');
 const panels=['.tabs-v11','.message-list','.timeline-v11'].flatMap(selector=>[...root.querySelectorAll(selector)].map((el,index)=>({selector,index,left:el.scrollLeft,top:el.scrollTop})));
 return {scope:draftScope(),fields:[...root.querySelectorAll('input[id],textarea[id],select[id]')].filter(e=>e.type!=='file').map(e=>({id:e.id,value:e.value,checked:e.checked})),focus:active?.id,start:active?.selectionStart,end:active?.selectionEnd,scroll:window.scrollY,panels};
}
function restoreDrafts(draft){
 if(draft.scope!==draftScope())return;
 for(const f of draft.fields){const el=byId(f.id);if(el){if(el.tagName!=='SELECT'||[...el.options].some(option=>option.value===f.value))el.value=f.value;el.checked=f.checked}}
 const el=byId(draft.focus);if(el){el.focus({preventScroll:true});try{el.setSelectionRange(draft.start,draft.end)}catch{}}
 window.scrollTo(0,draft.scroll);
 for(const panel of draft.panels||[]){const el=byId('app').querySelectorAll(panel.selector)[panel.index];if(el){el.scrollLeft=panel.left;el.scrollTop=panel.top}}
}
function connectionStatus(failed){
 let el=byId('connectionStatus');
 if(!failed){el?.remove();return}
 if(!el){el=document.createElement('div');el.id='connectionStatus';el.className='connection-status';el.setAttribute('role','status');document.body.appendChild(el)}
 el.textContent='Connexion interrompue · reconnexion automatique…';
}
async function syncNow(force=false,fresh=false){
 if(!STATE.room||!STATE.token)return null;
 if(STATE.syncPromise){
  // A mutation or invalidation received after a fetch began needs another snapshot.
  // Merge concurrent requests without forcing unchanged screens to render again.
  if(force||fresh||STATE.syncRoom!==STATE.room||STATE.syncToken!==STATE.token){STATE.syncQueued=true;STATE.syncForce=STATE.syncForce||force}
  return STATE.syncPromise;
 }
 const pending=(async()=>{
  let render=force,result=null;
  do{
   STATE.syncQueued=false;STATE.syncForce=false;STATE.syncRoom=STATE.room;STATE.syncToken=STATE.token;
   result=await performSync(render);
   render=STATE.syncForce;
  }while(STATE.syncQueued&&STATE.room&&STATE.token);
  return result;
 })();STATE.syncPromise=pending;
 try{return await pending}finally{if(STATE.syncPromise===pending)STATE.syncPromise=null}
}
async function performSync(force=false){
 if(!STATE.room||!STATE.token||STATE.syncBusy)return STATE.sync;
 STATE.syncBusy=true;const room=STATE.room,token=STATE.token;
 try{
  // OMERTÀ standalone: the API removes all legacy-story metadata BEFORE
  // it reaches the client. Missing RPC (older server) uses historical sync,
  // but operational server errors never downgrade a released A/B/C game.
  const params={p_code:STATE.room,p_player_token:STATE.token};
  const omertaRoom=['021','022','023','024','025'].includes(String(
    STATE.sync?.room?.scenario_id||STATE.scenarioId||''));
  let d;
  if(omertaRoom){
   try{d=await rpc('igr_omerta_standalone_safe_sync',params)}
   catch(e){
    if(e.code==='PGRST202'||(e.status===404&&/function|not found/i.test(e.message||'')))
     d=await rpc('igr_v4_sync',params);
    else throw e;
   }
  }else d=await rpc('igr_v4_sync',params);
  if(STATE.room!==room||STATE.token!==token)return null;
  connectionStatus(false);
  const sig=syncSignature(d);
  // An authoritative snapshot and a successfully rendered screen are different
  // things. Recover even if the server data has already reached notifications.
  const root=typeof document==='undefined'?null:document.getElementById?.('app');
  const screenMatches=()=>{
   if(!root)return true;
   if(d.room.status==='lobby')return !!root.querySelector('.lobby-v11');
   if(d.room.phase==='briefing')return !!root.querySelector('.briefing-page');
   if(d.room.phase==='role_reading'&&!d.player.ready)return !!root.querySelector('.role-card-v11');
   return !!root.querySelector('.game-v11');
  };
  const changed=force||sig!==STATE.syncSig||!screenMatches();
  const draft=changed?captureDrafts():null;
  STATE.sync=d;
  STATE.scenarioId=d.room.scenario_id;STATE.playerId=d.player.id;STATE.playerPseudo=d.player.pseudo;STATE.role=d.player.public_role||STATE.role;STATE.players=d.players||[];STATE.cycle=d.room.cycle||0;
  saveSession();
  markGameStarted(d);markGameCompleted(d);
  let rendered=true;
  if(changed){
   try{
    routeFromServer();
    if(!screenMatches())throw new Error('room_screen_not_mounted');
    restoreDrafts(draft);
    STATE.syncSig=sig;STATE.uiRenderFailed=false;
    const last=(d.events||[]).at(-1);
    if(last&&last.id>STATE.lastEventId){
     if(STATE.lastEventId&&['trame','breaking_news','reveal'].includes(last.event_type))playCue(last.event_type==='breaking_news'?'news':last.event_type==='reveal'?'finale':'trame');
     STATE.lastEventId=last.id;
    }
    setTimeout(()=>maybeShowRoleNotice(d),60);
   }catch(error){
    rendered=false;
    STATE.uiRenderFailed=true;
    // Keep the previous acknowledged signature. The next server poll MUST
    // attempt rendering again even if there are no further phase events.
    console.error('Room UI failed to render; retrying automatically',error);
   }
  }
  if(rendered)STATE.lastSuccessfulSyncAt=Date.now();
  // Cosmetics/media are not allowed to invalidate an otherwise good room view.
  try{manageVideoState()}catch(error){console.warn('video state',error)}
  // Avatars are cosmetic: a slow image RPC must never hold a phase change or
  // prevent a newer gameplay snapshot from being fetched.
  void refreshAvatars(d,false).then(changed=>{
   if(changed&&STATE.room===room&&STATE.token===token&&STATE.sync===d){const draft=captureDrafts();routeFromServer();restoreDrafts(draft)}
  }).catch(e=>console.warn('avatars',e));
  return rendered?d:null;
 }catch(e){if(STATE.room===room&&STATE.token===token){connectionStatus(true);console.warn('sync',e.message)}return null}finally{STATE.syncBusy=false}
}
function routeFromServer(){
 const d=STATE.sync;if(!d)return;
 if(d.room.phase!=='briefing'&&BRIEFING.spokenKey)cancelBriefingVoice();
 if(d.room.status==='lobby'){
  if(STATE.view!=='lobby')STATE.view='lobby';renderLobby(d);return;
 }
 if(d.room.status==='finished'||d.room.phase==='reveal'){
  STATE.view='game';STATE.tab='investigation';renderGame();return;
 }
 if(d.room.phase==='briefing'){STATE.view='briefing';renderBriefing();return;}
 if(d.room.phase==='role_reading'&&!d.player.ready){cancelBriefingVoice();STATE.view='role';renderRole();return;}
 STATE.view='game';if(!['card','investigation','channel','video','timeline','rules'].includes(STATE.tab))STATE.tab='investigation';renderGame();
}
function stopRoomWatcher(){if(STATE.watcher){clearInterval(STATE.watcher);STATE.watcher=null}}
function startRoomWatcher(){
 stopRoomWatcher();
 const period=STATE.view==='lobby'?700:1100;
 STATE.watcher=setInterval(()=>syncNow(false),period);
}
function lobbyData(){return syncNow(true)}
function myState(){return syncNow(true)}
function lobbyThemeForScenario(id){
 const n=Number(id);
 if(n>=21&&n<=25)return 'omerta';
 if(n>=26&&n<=28)return 'terror';
 if(n>=29&&n<=31)return 'cartel';
 if(n>=32&&n<=34)return 'regime';
 return 'base';
}
function renderLobby(prefetched=null){
 const d=prefetched||STATE.sync;if(!d)return;
 const sc=scenario(d.room.scenario_id),count=d.players.length,min=d.room.min_players,max=d.room.max_players,remaining=Math.max(0,min-count);
 const me={...(d.players||[]).find(p=>p.id===d.player?.id),...d.player},roleMissing=d.players.filter(p=>!p.preferred_role).length;
 const choices=roleChoiceSummary(sc,count,d.players),canStart=!!STATE.hostToken&&count>=min;
 const launchLabel=count<min?`Encore ${remaining} joueur${remaining>1?'s':''}`:roleMissing?`Lancer · ${roleMissing} rôle${roleMissing>1?'s':''} attribué${roleMissing>1?'s':''} au hasard`:'Lancer le dossier';
 const randomRoleButton=`<button type="button" class="role-choice-card random-role-card" onclick="chooseRandomLobbyRole()"><span><b>Choix aléatoire</b><small>Tirage uniforme parmi les rôles publics encore disponibles. Chaque type de rôle a exactement une chance dans le tirage. L’Espion reste secret.</small></span><em>AU HASARD</em></button>`;
 const roleButtons=randomRoleButton+choices.map(x=>{const mine=me.preferred_role===x.id,full=x.taken>=x.cap&&!mine;return `<button type="button" class="role-choice-card ${mine?'selected':''} ${full?'full':''}" data-role-id="${h(x.id)}" aria-pressed="${mine}" ${full?'disabled':''} onclick="chooseLobbyRole('${x.id}')"><span><b>${h(x.info.label)}</b><small>${h(x.info.body)}</small></span><em>${mine?'TON RÔLE':full?'COMPLET':`${x.taken}/${x.cap}`}</em></button>`}).join('');
 const reservations=d.room.state?.victory_reservations||[];
 const myReservation=reservations.find(x=>String(x.player_id)===String(me.id));
 const victoryRoleNotice=myReservation
   ?`<div class="victory-privilege compact ${myReservation.awarded?'awarded':'lost'}"><b>${myReservation.awarded?'RÔLE RÉSERVÉ PAR VICTOIRE':'CONFLIT DE RÔLE'}</b><span>${myReservation.awarded?`${h(publicRoleLabel(myReservation.claimed_role))} t’est réservé · force de victoire ${h(myReservation.score)}/100.`:`Ta demande ${h(publicRoleLabel(myReservation.claimed_role))} n’a pas obtenu la priorité. Une victoire plus forte a gagné le conflit ; choisis un autre rôle disponible.`}</span></div>`:'';
 byId('app').innerHTML=shell(`<main class="page"><div class="page-head lobby-head"><div><div class="kicker">Cellule ${h(d.room.code)}</div><h1>${h(sc.title)}</h1><div class="lobby-case-preview"><span>APERÇU PUBLIC · SANS SPOILER</span><p class="lobby-scenario-summary">${h(publicScenarioSummary(sc.id))}</p></div></div><button class="btn ghost small" onclick="leaveRoom()">Quitter</button></div><section class="panel lobby-v11" data-igr-scenario-id="${h(sc.id)}" data-igr-lobby-theme="${lobbyThemeForScenario(sc.id)}"><div class="lobby-code"><span>CODE</span><strong>${h(d.room.code)}</strong></div><div class="lobby-status"><strong>${count} présent${count>1?'s':''}</strong><span>Minimum ${min} · Maximum ${max}</span></div><div class="player-list">${d.players.map((p,i)=>`<div class="player-line lobby-player-live"><span class="player-ident">${avatarHtml(p.id,p.pseudo,'avatar-small')}<span class="lobby-player-name"><b>${i+1}. ${h(p.pseudo)}</b>${p.preferred_role?`<span class="lobby-role-picked">${h(publicRoleLabel(p.preferred_role))}</span>`:'<span class="lobby-role-pending">Attribué au lancement</span>'}</span></span></div>`).join('')}</div><div class="role-choice-zone">${victoryRoleNotice}<div class="section-title"><h2>Choisis ton rôle</h2><span>Premier choix réservé</span></div><p class="role-choice-help">Choisis un rôle si tu as une préférence. Au lancement, chaque joueur sans choix reçoit automatiquement un rôle public disponible au hasard. Les identités secrètes et l’Espion restent cachés et attribués par le serveur.</p><div class="role-choice-grid">${roleButtons}</div></div>${STATE.hostToken?`<button class="btn primary block" ${canStart?'':'disabled'} onclick="startGame()">${launchLabel}</button>`:`<div class="waiting-pulse">En attente de l’hôte…</div>`}</section></main>`);
 if(SOUND.enabled)ensureAmbient('menu');
}
async function chooseLobbyRole(role){
 try{await rpc('igr_v4_choose_role',{p_code:STATE.room,p_player_token:STATE.token,p_role:role});await syncNow(true);toast(`Rôle choisi : ${publicRoleLabel(role)}`)}catch(e){console.error(e);toast('Ce rôle vient d’être pris ou n’est pas disponible.')}
}

function secureRandomIndex(length){
 if(!Number.isInteger(length)||length<1)return 0;
 try{
   const range=0x100000000,limit=range-(range%length),buf=new Uint32Array(1);
   do{crypto.getRandomValues(buf)}while(buf[0]>=limit);
   return buf[0]%length;
 }catch{
   return Math.floor(Math.random()*length);
 }
}
async function chooseRandomLobbyRole(){
 const d=STATE.sync;if(!d)return;
 const sc=scenario(d.room.scenario_id),count=d.players.length;
 const me={...(d.players||[]).find(p=>p.id===d.player?.id),...d.player};
 const choices=roleChoiceSummary(sc,count,d.players);
 const available=choices.filter(x=>x.taken<x.cap||me.preferred_role===x.id).map(x=>x.id);
 if(!available.length)return toast('Aucun rôle disponible.');
 const role=available[secureRandomIndex(available.length)];
 await chooseLobbyRole(role);
}

async function prepareLobbyAudio(){
 SOUND.enabled=true;NARRATION.enabled=false;setPref('igr_v9_sound_enabled',true);setPref('igr_v11_narration',false);
 primeNarrationFromGesture();
 const ok=await wakeAudioFromGesture();
 if(!ok)return toast('Touchez à nouveau : iOS n’a pas encore autorisé le son.');
 try{
  playLevelTick(.65);
  await rpc('igr_v4_set_audio_ready',{p_code:STATE.room,p_player_token:STATE.token,p_ready:true});
  await syncNow(true);toast('Audio prêt pour le briefing.');
 }catch(e){console.error(e);toast('Impossible de confirmer l’audio.');}
}
async function startGame(){
 if(!STATE.hostToken)return toast('Seul l’hôte peut lancer.');
 if(STATE.sync?.room?.scenario_id==='007'){
  let released=false;
  try{released=(await rpc('igr_v291_007_catalog_enabled',{}))===true}catch{}
  if(!released)return toast('Dossier 007 en préparation : lancement suspendu.');
 }
 const d=STATE.sync,autoCount=(d?.players||[]).filter(p=>!p.preferred_role).length;
 cancelBriefingVoice();stopAmbient();
 try{const result=await rpc('igr_v4_start_game',{p_code:STATE.room,p_host_token:STATE.hostToken});await syncNow(true);startRoomWatcher();if(autoCount||result?.auto_assigned_roles)toast(`${result?.auto_assigned_roles??autoCount} rôle${(result?.auto_assigned_roles??autoCount)>1?'s':''} attribué${(result?.auto_assigned_roles??autoCount)>1?'s':''} au hasard.`)}catch(e){console.error(e);toast('Impossible de lancer : vérifie le nombre de joueurs.')}
}
function cancelBriefingVoice(){
 NARRATION.generation++;hideAudioWakePrompt();
 try{if(BRIEFING.timer)clearTimeout(BRIEFING.timer)}catch{}
 try{if(NARRATION.retryTimer)clearTimeout(NARRATION.retryTimer)}catch{}
 BRIEFING.timer=null;BRIEFING.scoreStarted=false;NARRATION.retryTimer=null;NARRATION.speaking=false;
 try{speechSynthesis?.cancel?.()}catch{}BRIEFING.spokenKey=null
}
function startBriefingScenarioScore(){
 const d=STATE.sync;if(!d||d.room.phase!=='briefing'||BRIEFING.scoreStarted||!SOUND.enabled)return;
 BRIEFING.scoreStarted=true;const sc=scenario(d.room.scenario_id);
 initAudio();if(!SOUND.ctx)return;startAmbient(sc.sound);
 try{const now=SOUND.ctx.currentTime,target=Math.min(1.42,SOUND.master*1.28);SOUND.masterGain.gain.cancelScheduledValues(now);SOUND.masterGain.gain.setValueAtTime(.0001,now);SOUND.masterGain.gain.linearRampToValueAtTime(target,now+1.8)}catch{}
}
function runCanonicalBriefing(force=false){
 const d=STATE.sync;if(!d||d.room.phase!=='briefing')return;
 const key=`${d.room.code}:${d.room.phase_started_at||''}`;
 if(!force&&BRIEFING.spokenKey===key)return;
 BRIEFING.spokenKey=key;BRIEFING.scoreStarted=false;
 BRIEFING.timer=setTimeout(()=>{
   BRIEFING.timer=null;
   if(STATE.sync?.room?.phase!=='briefing')return;
   startBriefingScenarioScore();
 },260);
}

function renderBriefing(){
 const d=STATE.sync;if(!d)return;const sc=scenario(d.room.scenario_id),briefKey=`${d.room.code}:${d.room.phase_started_at||''}`;if(BRIEFING.spokenKey!==briefKey)stopAmbient();
 document.documentElement.classList.remove('home-locked');document.body.classList.remove('home-locked');
 byId('app').innerHTML=shell(`<main class="page briefing-page"><section class="briefing-cinematic"><div class="briefing-poster"><img src="${scenarioArt(sc.id)}" alt="${h(sc.title)}"><div class="briefing-poster-shade"></div><div class="briefing-stamp">DOSSIER ${h(sc.id)}</div></div><div class="briefing-card"><div class="briefing-eyebrow">MJ AUTOMATIQUE · OUVERTURE DU DOSSIER</div><h1>${h(sc.title)}</h1><div class="briefing-line"></div><p>${h(canonicalBriefingText(sc.id))}</p><aside class="igr-briefing-protocol" aria-label="${window.IGR_LOCALE==='en'?'Grey Room protocol':'Protocole Grey Room'}"><span class="igr-briefing-protocol-title">${window.IGR_LOCALE==='en'?'GREY ROOM PROTOCOL':'PROTOCOLE GREY ROOM'}</span><p>${window.IGR_LOCALE==='en'?'Secret and independent, the Grey Room works with judicial authorities worldwide. Its members remain vulnerable to pressure and retaliation.':'Secrète et indépendante, la Grey Room coopère avec les autorités judiciaires internationales. Ses membres restent vulnérables aux pressions et aux représailles.'}</p></aside><div class="briefing-meta"><span>BRIEFING PUBLIC · CANONIQUE</span><b id="phaseClock">${fmtSeconds(phaseSeconds())}</b></div><small>Aucune information secrète n’est révélée. La bande-son du dossier accompagne l’ouverture, puis les cartes privées s’ouvrent.</small></div></section>${liveSessionControls()}</main>`);
 mountLiveSessionControls();runCanonicalBriefing();updatePhaseClock();
}

function displayRole(r,p){if(r==='suspect')return`Suspect · ${p}`;if(r==='maitre')return`${cartelLawyerLabel()||'Maître'} · ${p}`;return`${roleInfo(r).label} · ${p}`}
function igr82RelationLink(entry,fact) {
  const fr=typeof window==='undefined'||window.IGR_LOCALE!=='en';
  const tr=(a,b)=>fr?a:b;
  const explicit=String((fr?entry?.link_fr:entry?.link_en) || entry?.link || '').trim();
  if(explicit)return explicit;
  const s=String(fact||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/œ/g,'oe').replace(/æ/g,'ae').replace(/’/g,"'").toLowerCase();
  
  if(/(?:est|c'est) ta soeur\b/.test(s))return tr('C’est ta sœur.','She is your sister.');
  if(/(?:est|c'est) ton frere\b/.test(s))return tr('C’est ton frère.','He is your brother.');
  if(/c'est ton ami le plus proche|c'est ta meilleure amie|c'est ton meilleur ami/.test(s))return tr('C’est ton ami le plus proche.','This is your closest friend.');
  if(/vous vous etes rencontres|tu l'as rencontre(?:e)?/.test(s))return tr('Vous vous êtes déjà rencontrés.','You have met before.');
  if(/vous vous opposez sur l'heritage/.test(s))return tr('Vous vous opposez sur l’héritage.','You are opposed over the inheritance.');
  if(/tu ne (?:le|la|les) connais pas|vous ne vous connaissez pas/.test(s))return tr('Tu ne le connais pas.','You do not know this person.');
  if(/tu (?:le|la) connais (?:peu|a peine)|tu (?:le|la) connais tres peu/.test(s))return tr('Tu le connais à peine.','You barely know this person.');
  if(/tu n'as aucun lien|aucun lien personnel|sans lien personnel/.test(s))return tr('Tu ne le connais pas personnellement.','You do not know this person personally.');
  if(/(?:tu n'as|vous n'avez) jamais rencontre|tu ne l'as pas rencontre|pas rencontre personnellement/.test(s))return tr('Tu ne l’as jamais rencontré.','You have never met this person.');
  if(/tu ne peux (?:pas )?l'identifier|sans identification certaine|tu ignores son identite|pas avec certitude l'identite/.test(s))return tr('Tu ne peux pas l’identifier avec certitude.','You cannot identify this person with certainty.');
  if(/(?:vous (?:travaillez|evoluez|exercez) (?:dans|au sein de)|vous etes (?:dans|issus de)) (?:la )?meme (?:structure|equipe|institution|entreprise|service|etablissement)|(?:ton|ta) collegue/.test(s))return tr('Vous travaillez dans la même structure, sans forcément vous connaître.','You work in the same organization, but may not know each other.');
  if(/tu lui as demande|il t'a confirme|elle t'a confirme|tu lui as confie|tu as negocie avec|vous avez echange/.test(s))return tr('Vous avez déjà échangé.','You have spoken before.');
  if(/tu (?:l'as|le|la) (?:apercu|observe)|tu as observe (?:ses|leurs)/.test(s))return tr('Tu l’as déjà aperçu, mais tu ne le connais pas personnellement.','You have seen this person, but do not know them personally.');
  if(/tu reconnais (?:un|le) circuit|fonds (?:qu'il|qu'elle) met|operations (?:qu'il|qu'elle) validait/.test(s))return tr('Vos affaires se croisent, mais tu ne sais pas vraiment qui il est.','Your activities overlap, but you do not really know this person.');
  return ''; // No established relationship: do not invent familiarity or absence of it.
}

/* v644: only established facts in relation cards; no suggested questions. */
function igr82RelationKnownOnly(raw){
 const text=String(raw||'').trim();
 return text.split(/\s*(?:Ce que tu peux lui demander|À mettre sur la table|Question à poser|À confronter|À lui demander|À éclaircir entre vous)\s*[—–:-]\s*/i)[0]
   .replace(/^\s*(?:Ce que tu sais|Ton point de départ)\s*[—–:-]\s*/i,'').trim();
}
function igr82RelationFact(raw){
 const fact=String(raw||'').trim()
  .replace(/\s*Tu ignores[^.!?]*[.!?]?/gi,'')
  .replace(/\s*Tu ne sais pas[^.!?]*[.!?]?/gi,'').trim();
 if(/^tu ignores que\b/i.test(fact)||/^tu ne sais pas que\b/i.test(fact))return '';
 const scenario=String(typeof STATE==='undefined'?'':STATE?.sync?.room?.scenario_id||'');
 if(scenario==='004'){
   const match=fact.match(/^tu connais la relation du suspect ([123]) avec Sofia, mais n.as pas lu ses échanges privés\.$/i);
   if(match)return {
     '1':'Tu sais que cette personne est l’ex-partenaire de Sofia.',
     '2':'Tu sais que cette personne est un ami proche de Sofia.',
     '3':'Tu sais que cette personne est un proche de Sofia qui habite le quartier.'
   }[match[1]];
 }
 return fact;
}
function igr82RelationPlayerTag(person){
 const roster=typeof STATE==='undefined'?[]:(STATE?.sync?.players||[]);
 const norm=x=>String(x||'').normalize('NFKC').toLocaleLowerCase();
 const near=roster.some(p=>{
  const a=norm(person),b=norm(p?.pseudo);
  return a!==b&&Math.min(a.length,b.length)>=4&&Math.abs(a.length-b.length)===1&&(a.startsWith(b)||b.startsWith(a));
 });
 if(!near)return '';
 const player=roster.find(p=>norm(p?.pseudo)===norm(person));
 const seat=Number(player?.seat_index);
 return Number.isInteger(seat)&&seat>=0?'Joueur '+(seat+1):'';
}

function igr82RelationsHtml(value) {
  const fr=typeof window==='undefined'||window.IGR_LOCALE!=='en', tr=(a,b)=>fr?a:b;
  const seen=new Set();
  const entries=value.map((entry,index)=>{
    if(typeof entry==='string'){
      const text=igr82RelationFact(igr82RelationKnownOnly(entry)),key='plain:'+text.toLocaleLowerCase();
      if(!text||seen.has(key))return'';
      seen.add(key);
      return `<div class="igr82-relation igr82-relation-plain"><p>${h(text)}</p></div>`;
    }
    const person=String(entry?.pseudo||entry?.label||tr('Personne '+(index+1),'Person '+(index+1)));
    const fact=igr82RelationFact(igr82RelationKnownOnly(entry?.text));
    const link=igr82RelationLink(entry,fact);
    // A repeated piece of the dossier must not create a second suspect card.
    const key=[person,fact,link].map(x=>x.toLocaleLowerCase().replace(/\s+/g,' ').trim()).join('|');
    if(seen.has(key))return'';
    seen.add(key);
    const playerTag=igr82RelationPlayerTag(person);
    const initial=person.trim().slice(0,1).toUpperCase()||'?';
    return `<article class="igr82-relation"><div class="igr82-relation-person"><span class="igr82-relation-avatar" aria-hidden="true">${h(initial)}</span><div class="igr82-relation-id"><b>${h(person)}</b>${playerTag?`<small class="igr82-player-tag">${h(playerTag)}</small>`:''}${link?`<small>${tr('VOTRE LIEN','YOUR CONNECTION')}</small><p class="igr82-relation-link">${h(link)}</p>`:''}</div></div><div class="igr82-relation-body">${fact?`<small class="igr82-relation-eyebrow">${tr('CE QUE TU SAIS DE LUI','WHAT YOU KNOW ABOUT THEM')}</small><p class="igr82-relation-fact">${h(fact)}</p>`:''}</div></article>`;
  });
  return `<section class="private-block igr82-relations"><h4>${tr('TES RELATIONS','YOUR CONNECTIONS')}</h4><p class="igr82-relation-hint">${tr('Une carte par personne. À toi de choisir les questions à poser.','One card per person. You decide which questions to ask.')}</p><div class="igr82-relation-list">${entries.join('')}</div></section>`;
}

function valueBlock(title,value,cls=''){
 if(value==null||value===''||(Array.isArray(value)&&!value.length))return'';
 if(title==='TES RELATIONS'&&Array.isArray(value))return igr82RelationsHtml(value);
 let body='';
 if(Array.isArray(value))body=value.map(v=>typeof v==='string'?`<div class="relation-line"><span>${h(v)}</span></div>`:`<div class="relation-line"><b>${h(v.pseudo||v.label||'')}</b><span>${h(v.text||JSON.stringify(v))}</span></div>`).join('');
 else if(typeof value==='object')body=Object.entries(value).map(([k,v])=>`<div class="relation-line"><b>${h(k)}</b><span>${h(typeof v==='string'?v:JSON.stringify(v))}</span></div>`).join('');
 else body=`<p>${h(value)}</p>`;
 const tone=title==='CE QUE TU CACHES'?'igr82-hidden':(title==='TES REPÈRES'||title==='CE QUE TU SAIS')?'igr82-known':(title==='TA POSITION'||title==='TA DÉFENSE')?'igr82-defense':title==='TA CHRONOLOGIE'?'igr82-timeline':'';
 return `<div class="private-block ${cls} ${tone}"><h4>${h(title)}</h4>${body}</div>`;
}
async function sendSpyDecision(choice){
 try{
  const d=STATE.sync,cycle=d?.room?.cycle,me=d?.player?.id||STATE.playerId;
  if(!me||![1,2,3].includes(cycle)){toast('Mission indisponible.');return;}
  const key='igr_spy_v631_'+STATE.room+'_'+me+'_'+cycle;
  if(STORAGE.getItem(key)==='1'){toast('Ton choix pour ce cycle est déjà scellé.');return;}
  const response=await rpc('igr_v631_spy_decide',{p_code:STATE.room,p_player_token:STATE.token,p_choice:choice});
  if(response?.ok){STORAGE.setItem(key,'1');toast('Décision confidentielle scellée.');await syncNow(true)}
  else toast('Décision indisponible pour ce cycle.');
 }catch(e){console.error(e);toast('Décision refusée ou déjà scellée par le serveur.');}
}
function privateCardHtml(){
 const d=STATE.sync,p=d?.player,ps=p?.private_state||{},pub=p?.public_role||STATE.role,secret=p?.secret_role;
 const spyPhase=d?.room?.phase||'';
 const canSpyDecide=secret==='espion'&&d?.room?.status==='playing'&&d.room.cycle>=1&&d.room.cycle<=3
  &&!['briefing','role_reading','closed','locking','reveal','final_debrief'].includes(spyPhase)&&!spyPhase.startsWith('final_');
 const spySealKey='igr_spy_v631_'+STATE.room+'_'+p?.id+'_'+d?.room?.cycle;
 const spySealed=typeof STORAGE!=='undefined'&&STORAGE.getItem(spySealKey)==='1';
 const spyChoices=d?.room?.cycle===3
  ?[{id:'protect',label:'Protéger la source'},{id:'verify',label:'Vérifier l’archive'}]
  :[{id:'source',label:'Contacter la source'},{id:'archive',label:'Sécuriser les archives'}];
 const spyChoiceUi=canSpyDecide
  ?(spySealed?'<p class="choice-helper">Ta décision confidentielle est scellée pour ce cycle.</p>'
  :'<div class="action-section"><div class="choice-helper">Sélectionne une seule piste. Le serveur verrouille immédiatement ton choix sans informer les autres joueurs.</div>'
     +spyChoices.map(c=>`<button type="button" class="btn secondary block" onclick="sendSpyDecision('${c.id}')">${h(c.label)}</button>`).join('')+'</div>')
  :'';
 const secretInfo=secret==='espion'?(valueBlock('MISSION SECRÈTE',ps.secret_mission||'Ta couverture publique reste inchangée.','secret-alert')+spyChoiceUi):'';
 const santoroStandalone=['021','022','023','024','025'].includes(String(d?.room?.scenario_id||''))
   &&d?.room?.state?.omerta_standalone===true;
 const santoroMyCard=santoroStandalone&&pub==='suspect'
   &&typeof ps.identity==='string'&&typeof ps.objective==='string'
   &&typeof ps.what_you_know==='string';
 const santoroChronology=santoroMyCard&&typeof ps.your_chronology==='string'
   ?ps.your_chronology.split(/\r?\n/).map(x=>x.trim()).filter(Boolean):[];
 const santoroQuestions=santoroMyCard&&Array.isArray(ps.conversation_hooks)
   ?ps.conversation_hooks.filter(x=>typeof x==='string'&&x.trim()).slice(0,4):[];
 const santoroPrivateCard=santoroMyCard?[
   valueBlock('TON IDENTITÉ DANS LA FAMILLE',ps.identity),
   valueBlock('CE QUE TU SAIS',ps.what_you_know),
   valueBlock('CE QUE TU GARDES POUR TOI',ps.what_you_hide,'danger-soft'),
   valueBlock('TA CHRONOLOGIE PERSONNELLE',santoroChronology),
   valueBlock('CE QUE TU PEUX DEMANDER',santoroQuestions),
   valueBlock('TON OBJECTIF PERSONNEL',ps.objective)
 ].join(''):'';
 const readableDossier=['001','002'].includes(String(d?.room?.scenario_id||''))&&pub==='suspect';
 const conciseDossier=['001','002','003','004'].includes(String(d?.room?.scenario_id||''))&&pub==='suspect'&&typeof ps.story==='string'&&!!ps.story.trim();
 const authoredObjective=String(ps.position||ps.objective||'').trim();
 const privateWin=santoroMyCard?ps.objective:((readableDossier||conciseDossier)&&authoredObjective?authoredObjective:roleInfo(secret==='espion'?'espion':pub).win);
 const concisePrivateCard=conciseDossier?[valueBlock('FONCTION',ps.place),valueBlock('TON HISTOIRE',ps.story),valueBlock('CETTE JOURNÉE-LÀ',ps.chronology),valueBlock('CE QUE TU SAIS',ps.anchors),valueBlock('CE QUE TU CACHES',ps.hide,'danger-soft'),valueBlock('TON OBJECTIF',authoredObjective),valueBlock('TES RELATIONS',ps.relations)].join(''):'';
 const cartel030Card=(currentScenario()?.id==='030'&&pub==='suspect'&&ps.variant_card)?[valueBlock('TON IDENTITÉ DANS LE DOSSIER',ps.variant_card.identity),valueBlock('CE QUE TU SAIS — DOSSIER 030',ps.variant_card.what_you_know),valueBlock('TON SECRET — DOSSIER 030',ps.variant_card.variant_secret,'danger-soft'),valueBlock('CE QUE TU CACHES — DOSSIER 030',ps.variant_card.what_you_hide,'danger-soft'),valueBlock('TA CHRONOLOGIE DÉTAILLÉE',ps.variant_card.your_chronology),valueBlock('TON OBJECTIF — DOSSIER 030',ps.variant_card.objective)].join(''):'';
 return `<div class="private-card-v11"><div class="kicker">CARTE PRIVÉE · NE PAS MONTRER</div><h2>${h(displayRole(pub,p?.pseudo||STATE.playerPseudo))}</h2>${conciseDossier?'':`<div class="role-summary"><b>COMMENT TU GAGNES</b><span>${h(privateWin)}</span></div>`}${santoroPrivateCard}${concisePrivateCard}${conciseDossier?'':readableDossier?(valueBlock('QUI TU ES',ps.place)+valueBlock('CETTE NUIT-LÀ',ps.chronology)+valueBlock('CE QUE TU SAIS',ps.anchors)+valueBlock('CE QUE TU CACHES',ps.hide,'danger-soft')+valueBlock('TES RELATIONS',ps.relations)):(valueBlock('TA PLACE',ps.place)+valueBlock('TA CHRONOLOGIE',ps.chronology)+valueBlock('CE QUE TU CACHES',ps.hide,'danger-soft')+valueBlock('TES REPÈRES',ps.anchors)+valueBlock('TES RELATIONS',ps.relations)+valueBlock('TA POSITION',String(ps.position||'').trim()===String(ps.anchors||'').trim()?'':ps.position))}${valueBlock('TES CLIENTS',ps.clients)}${cartel030Card}${secretInfo}<div class="private-foot">Les faits de cette carte sont canoniques. Tu peux mentir à l’oral si ton rôle le permet, mais tu ne modifies jamais la chronologie, les preuves ou les lieux.</div></div>`;
}
function renderRole(){
 const d=STATE.sync;if(!d)return;
 const me=(d.players||[]).find(x=>x.id===d.player.id),ready=!!me?.ready;
 byId('app').innerHTML=shell(`<main class="page"><section class="role-card role-card-v11">${privateCardHtml()}${ready?`<div class="waiting-pulse">Carte validée. En attente des autres joueurs…</div>`:`<button class="btn primary block" onclick="ackRole()">J’ai compris · verrouiller ma carte</button>`}</section>${liveSessionControls()}</main>`);
 mountLiveSessionControls();
 if(SOUND.enabled)ensureAmbient(currentScenario().sound);
}
async function ackRole(){
 try{await rpc('igr_v4_ack_role',{p_code:STATE.room,p_player_token:STATE.token});STATE.view='game';STATE.tab='investigation';await syncNow(true);startRoomWatcher()}catch(e){console.error(e);toast('Impossible de valider la carte.')}
}
function setTab(t){
 const previous=document.querySelector('#app .tabs-v11');
 const left=previous?.scrollLeft||0,top=previous?.scrollTop||0,focused=previous?.contains(document.activeElement);
 STATE.tab=t;saveSession();renderGame();
 const tabs=document.querySelector('#app .tabs-v11');if(!tabs)return;
 tabs.scrollLeft=left;tabs.scrollTop=top;
 const active=tabs.querySelector('.tab.active');if(!active)return;
 const box=tabs.getBoundingClientRect(),target=active.getBoundingClientRect();
 if(target.left<box.left)tabs.scrollLeft-=box.left-target.left;
 else if(target.right>box.right)tabs.scrollLeft+=target.right-box.right;
 if(target.top<box.top)tabs.scrollTop-=box.top-target.top;
 else if(target.bottom>box.bottom)tabs.scrollTop+=target.bottom-box.bottom;
 if(focused)active.focus({preventScroll:true});
}
function appConfirm({title='Confirmer',text='',confirmLabel='Continuer',danger=false}={}){
 return new Promise(resolve=>{
  if(byId('actionConfirmModal')){resolve(false);return}
  const modal=document.createElement('div');modal.id='actionConfirmModal';modal.className='modal action-confirm-modal';modal.style.zIndex='2000';
  modal.innerHTML=`<div class="modal-box action-confirm-box" role="dialog" aria-modal="true" aria-label="${h(title)}" tabindex="-1"><div class="kicker">ACTION DE PARTIE</div><h2>${h(title)}</h2><p>${h(text)}</p><div class="modal-actions"><button class="btn ghost" data-choice="cancel">Annuler</button><button class="btn ${danger?'danger':'primary'}" data-choice="ok">${h(confirmLabel)}</button></div></div>`;
  const finish=v=>{modal.remove();releaseDialogFocus();resolve(v)};modal.cancelDialog=()=>finish(false);
  modal.addEventListener('click',e=>{if(e.target===modal)finish(false);const c=e.target?.dataset?.choice;if(c==='cancel')finish(false);if(c==='ok')finish(true)});
  document.body.appendChild(modal);trapDialogFocus(modal);
  setTimeout(()=>modal.querySelector('[data-choice="ok"]')?.focus({preventScroll:true}),20);
 });
}
function rolePhaseNotice(d){
 const ph=d?.room?.phase,role=d?.player?.public_role,st=d?.room?.state||{};
 if(!ph||!role)return null;
 const active=(title,text)=>({title,text});
 if(ph==='briefing')return active('Briefing du dossier','Le briefing public commence sur tous les téléphones.');
 if(ph==='role_reading'&&!d.player.ready)return active('Carte privée disponible','Lis ta carte puis verrouille-la quand tu es prêt.');
 if(ph==='initial_debrief')return ['enqueteur','analyste'].includes(role)?active('À toi d’agir','Débrief initial : Enquêteur et Analyste.') : active('Enquête en cours','Le camp d’enquête prépare le premier cycle.');
 if(ph==='interrogation_select')return role==='enqueteur'?active('Choisis un interrogatoire','Sélectionne le prochain suspect à entendre.'):active('En attente','L’Enquêteur choisit le prochain interrogatoire.');
 if(ph==='interrogation'){
  const target=st.current_target;
  if(target===d.player.id)return active('Tu es appelé','Ton interrogatoire commence maintenant.');
  if(role==='enqueteur')return active('Interrogatoire en cours','Conduis l’entretien et termine-le quand tu le souhaites.');
  if(role==='analyste')return active('Observation active','Observe les contradictions et stratégies de défense.');
  return active('Interrogatoire en cours','Un suspect est actuellement entendu.');
 }
 if(ph==='cycle_debrief')return ['enqueteur','analyste'].includes(role)?active('Débrief du cycle','Réponds aux questions courtes pour calibrer la prochaine trame.'):active('Débrief privé','Aucune action requise pendant le débrief du camp d’enquête.');
 if(ph?.startsWith('annex_')){
  const annex=ph.replace('annex_','');
  if(role===annex||['enqueteur','analyste'].includes(role))return active('Fenêtre dédiée',`${phaseLabel(ph)} : ton rôle est concerné.`);
  return active('Fenêtre spécialisée',`${phaseLabel(ph)} est en cours.`);
 }
 if(ph==='trame')return canInvestigationChannel(role)?active('Nouvelle trame','Un nouvel élément canonique est disponible dans le canal d’enquête.'):active('Nouvel élément transmis','Le camp d’enquête vient de recevoir une nouvelle trame.');
 if(ph==='provisional_orals')return active('Conclusions provisoires','Écoute le rôle actuellement appelé à prendre la parole.');
 if(ph==='provisional_lock')return role==='enqueteur'?active('Accusations provisoires','Verrouille le degré de responsabilité provisoire de chaque suspect.'):active('Accusations en cours','L’Enquêteur établit ses accusations provisoires.');
 if(ph==='defense')return active('Dernières défenses','La phase de défense est en cours.');
 if(ph==='final_debrief')return ['enqueteur','analyste','procureur'].includes(role)?active('Dernier débrief','Dernière concertation avant les verrouillages finaux.'):active('Dernier débrief','Aucune nouvelle preuve ne peut désormais entrer dans le dossier.');
 if(ph==='locking')return ['enqueteur','analyste','procureur','juge','journaliste'].includes(role)?active('Action requise','Verrouille maintenant ton choix final.'):active('Verdicts en cours','Les rôles concernés verrouillent leurs choix finaux.');
 if(ph==='reveal')return active('Révélation','La vérité canonique du dossier est maintenant accessible.');
 return null;
}
function showRoleNotice(title,text){
 let el=byId('roleNotice');if(!el){el=document.createElement('div');el.id='roleNotice';el.className='role-notice';document.body.appendChild(el)}
 el.innerHTML=`<small>NOTIFICATION</small><b>${h(title)}</b><span>${h(text)}</span>`;el.classList.add('show');
 clearTimeout(showRoleNotice.t);showRoleNotice.t=setTimeout(()=>el.classList.remove('show'),4300);
}
function maybeShowRoleNotice(d){
 if(!d||!['playing','finished'].includes(d.room?.status))return;
 const pending=(d.pending_requests||[]).length;
 const key=[d.room.phase,d.room.phase_started_at,d.player.public_role,pending,d.room?.state?.current_target||''].join(':');
 if(key===STATE.lastRoleNoticeKey)return;STATE.lastRoleNoticeKey=key;
 if(pending>0){showRoleNotice('Demande reçue','Le Procureur demande un entretien ciblé. Réponds depuis ton écran.');return}
 const n=rolePhaseNotice(d);if(n)showRoleNotice(n.title,n.text);
}

function phaseLabel(ph){return({briefing:'BRIEFING DU DOSSIER',role_reading:'LECTURE DES CARTES',initial_debrief:'DÉBRIEF INITIAL',interrogation_select:'CHOIX DE L’INTERROGATOIRE',interrogation:'INTERROGATOIRE',cycle_debrief:'DÉBRIEF DU CYCLE',annex_inspecteur:'ENTRETIEN INSPECTEUR',annex_procureur:'ENTRETIEN PROCUREUR',annex_juge:'ENTRETIEN JUGE',annex_temoin:'FENÊTRE TÉMOINS',annex_journaliste:'ENTRETIEN JOURNALISTE',annex_expert:'ENTRETIEN EXPERT',trame:'TRAME DU MJ',closed:'ENQUÊTE CLOSE',provisional_orals:'CONCLUSIONS PROVISOIRES',provisional_lock:'ACCUSATIONS PROVISOIRES',defense:'DERNIÈRES DÉFENSES',final_debrief:'DERNIER DÉBRIEF',locking:'VERROUILLAGE FINAL',investigation_assembly:'ASSEMBLÉE D’ENQUÊTE',final_audience:'AUDIENCE FINALE',final_suspect_defenses:'DÉFENSES DES SUSPECTS',reveal:'RÉVÉLATION'})[ph]||ph?.toUpperCase()||'PARTIE'}
function timerIsPaused(){
 const room=STATE.sync?.room,st=room?.state;if(!room||!st?.timer_paused)return false;
 if(st.timer_paused_phase&&st.timer_paused_phase!==room.phase)return false;
 if(st.timer_paused_started_at&&room.phase_started_at){
  const a=new Date(st.timer_paused_started_at).getTime(),b=new Date(room.phase_started_at).getTime();if(Number.isFinite(a)&&Number.isFinite(b)&&a!==b)return false;
 }
 return true;
}
function phaseSeconds(){
 const room=STATE.sync?.room;if(!room)return null;
 if(timerIsPaused())return Math.max(0,+room.state?.timer_remaining_seconds||0);
 const end=room.phase_ends_at;if(!end||!Number.isFinite(Date.parse(end)))return null;return Math.max(0,Math.ceil((new Date(end).getTime()-(Date.now()+STATE.serverOffset))/1000));
}
function fmtSeconds(s){if(s==null)return'—';return`${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`}
function updatePhaseClock(){const el=byId('phaseClock');if(el)el.textContent=fmtSeconds(phaseSeconds())}
function phaseTimerControl(){
 const room=STATE.sync?.room,paused=timerIsPaused();
 if(!STATE.hostToken||!room||(!room.phase_ends_at&&!paused))return'';
 return `<button class="phase-timer-toggle ${paused?'paused':''}" onclick="togglePhaseTimer(${paused?'false':'true'})">${paused?'▶ Reprendre':'Ⅱ Pause'}</button>`;
}
async function togglePhaseTimer(pause){
 if(!STATE.hostToken)return;
 try{await rpc('igr_v4_timer_toggle',{p_code:STATE.room,p_host_token:STATE.hostToken,p_pause:!!pause});await syncNow(true)}catch(e){console.error(e);toast('Impossible de modifier ce chrono.')}
}
function phaseCanAdvance(){
 const room=STATE.sync?.room;
 return !!(STATE.hostToken&&room&&room.status==='playing'&&room.phase&&room.phase!=='reveal');
}
function hostPhaseControls(){
 if(!phaseCanAdvance())return'';
 return `<button class="phase-next-btn" id="phaseNextBtn" onclick="advancePhaseNow(event)">Étape suivante →</button>`;
}
function mountLiveSessionControls(){
 // Keep the controls outside #app: the game header has sticky/stacking contexts
 // which otherwise intercept clicks on some iPhone and tablet viewports.
 const controls=document.querySelector('#app .live-session-controls');
 if(controls)document.body.appendChild(controls);
}
function liveSessionControls(){
 if(!STATE.room)return'';
 return `<div class="live-session-controls"><button type="button" class="live-exit-btn" onclick="confirmLeaveGame(event)" aria-label="Quitter la partie">✕ Quitter</button>${phaseCanAdvance()?`<button class="live-advance-btn" id="liveAdvanceBtn" onclick="advancePhaseNow(event)">Étape suivante →</button>`:''}</div>`;
}
let ADVANCE_BUSY=false;
async function advancePhaseNow(ev){
 try{ev?.preventDefault?.();ev?.stopPropagation?.()}catch{}
 if(!phaseCanAdvance()||ADVANCE_BUSY)return;
 const ph=phaseLabel(STATE.sync?.room?.phase||'cette étape');
 const ok=await appConfirm({title:'Passer à l’étape suivante ?',text:`L’étape « ${ph} » sera terminée immédiatement pour tous les joueurs.`,confirmLabel:'Passer à la suite'});
 if(!ok)return;
 ADVANCE_BUSY=true;
 const buttons=[byId('phaseNextBtn'),byId('liveAdvanceBtn')].filter(Boolean);
 buttons.forEach(b=>{b.disabled=true;b.setAttribute('aria-busy','true');b.textContent='Passage…'});
 try{
  if(STATE.sync?.room?.phase==='briefing')cancelBriefingVoice();
  const before=STATE.sync?.room?.phase;
  const out=await rpc('igr_v4_advance_phase',{p_code:STATE.room,p_host_token:STATE.hostToken});
  await syncNow(true);
  const after=STATE.sync?.room?.phase;
  if(before===after&&after!=='reveal')toast('Transition en cours…');
  else if(out?.phase||after)toast(`Étape suivante : ${phaseLabel(out?.phase||after)}.`);
 }catch(e){console.error(e);toast('Impossible de passer cette étape.')}
 finally{ADVANCE_BUSY=false}
}
async function confirmLeaveGame(ev){
 try{ev?.preventDefault?.();ev?.stopPropagation?.()}catch{}
 const ok=await appConfirm({title:'Quitter la partie ?',text:'Tu retourneras à l’accueil. La partie continuera pour les autres joueurs.',confirmLabel:'Quitter',danger:true});
 if(ok)leaveRoom();
}
function canInvestigationChannel(role){return['enqueteur','analyste','procureur','juge','inspecteur','expert'].includes(role)}
function canVideo(role){return['enqueteur','analyste','procureur','juge','inspecteur'].includes(role)}
function gameTabs(){const role=STATE.sync?.player?.public_role||STATE.role;return [{id:'card',label:'Ma carte'},{id:'investigation',label:'Enquête'},...(canInvestigationChannel(role)||role==='journaliste'||role==='enqueteur'||role==='suspect'||role==='temoin'||role==='maitre'?[{id:'channel',label:role==='journaliste'?'Messages':'Canal'}]:[]),...(canVideo(role)?[{id:'video',label:'Flux'}]:[]),{id:'timeline',label:'Fil'},{id:'rules',label:'Règles'}]}
function renderGame(){
 const d=STATE.sync;if(!d)return;const sc=scenario(d.room.scenario_id),role=d.player.public_role||STATE.role;
 document.documentElement.classList.remove('home-locked');document.body.classList.remove('home-locked');
 byId('app').innerHTML=shell(`<main class="page game-v11"><div class="page-head game-head-v11"><div><div class="kicker">Dossier ${h(sc.id)} · ${d.room.cycle?`cycle ${d.room.cycle}/3`:'préparation'}</div><h1>${h(sc.title)}</h1><div class="game-player-ident">${avatarHtml(d.player.id,d.player.pseudo,'avatar-game')}<div class="game-ident-text"><div class="role-chip">${h(displayRole(role,d.player.pseudo))}</div></div></div></div></div><div class="phase-strip"><div><small>PHASE</small><strong>${h(phaseLabel(d.room.phase))}</strong></div><div class="server-authority">MJ AUTOMATIQUE</div><div class="phase-timer-box"><div class="phase-clock" id="phaseClock">${fmtSeconds(phaseSeconds())}</div><div class="phase-host-actions">${phaseTimerControl()}<button type="button" class="phase-exit-btn" onclick="confirmLeaveGame(event)" aria-label="Quitter la partie">✕ Quitter</button></div></div></div><div class="tabs tabs-v11">${gameTabs().map(x=>`<button class="tab ${STATE.tab===x.id?'active':''}" onclick="setTab('${x.id}')">${h(x.label)}</button>`).join('')}</div><section class="panel game-panel-v11">${renderGameTab()}</section>${liveSessionControls()}</main>`);
 mountLiveSessionControls();
 if(SOUND.enabled)ensureAmbient(sc.sound);updatePhaseClock();
}
function renderGameTab(){
 if(STATE.tab==='card')return renderCardTab();
 if(STATE.tab==='channel')return renderChannelTab();
 if(STATE.tab==='video')return renderVideoTab();
 if(STATE.tab==='timeline')return renderTimelineTab();
 if(STATE.tab==='rules')return `<div class="rule-list">${RULES.map(r=>`<div class="rule"><h3>${h(r.title)}</h3><p>${r.items.map(i=>`• ${h(i)}`).join('<br>')}</p></div>`).join('')}</div>`;
 return renderInvestigationTab();
}
function renderCardTab(){
 const noteKey=`igr_v11_note_${STATE.room}_${STATE.playerId}`,note=STORAGE.getItem(noteKey)||'';
 return `${privateCardHtml()}<div class="private-notes"><label for="privateNotes">Notes personnelles · uniquement sur cet appareil</label><textarea id="privateNotes" oninput="STORAGE.setItem('igr_v11_note_'+STATE.room+'_'+STATE.playerId,this.value)" maxlength="3000" placeholder="Tes notes ne modifient jamais le dossier.">${h(note)}</textarea><button class="btn small" onclick="savePrivateNotes()">Sauvegarder mes notes</button></div>`;
}
function savePrivateNotes(){STORAGE.setItem(`igr_v11_note_${STATE.room}_${STATE.playerId}`,byId('privateNotes')?.value||'');toast('Notes privées sauvegardées.')}
function save016EvidenceNote(section,value){if(!['visible','outside','cause'].includes(section)||STATE.sync?.room?.scenario_id!=='016'||!['enqueteur','analyste'].includes(STATE.sync?.player?.public_role))return;STORAGE.setItem('igr016_ledger_'+STATE.room+'_'+STATE.playerId+'_'+section,String(value||'').slice(0,650));}
function currentTarget(){const id=STATE.sync?.room?.state?.current_target;return (STATE.sync?.players||[]).find(p=>p.id===id)}
function latestEvent(type){return [...(STATE.sync?.events||[])].reverse().find(e=>!type||e.event_type===type)}
function renderInvestigationTab(){
 const d=STATE.sync,r=d.room,me=d.player,role=me.public_role,ph=r.phase,target=currentTarget();
 let body=`<div class="phase-explain"><h2>${h(phaseLabel(ph))}</h2>${phaseInstruction(role,ph,target)}</div>`;

 if(r.scenario_id==='016'&&['enqueteur','analyste'].includes(role)){
   const english=window.IGR_LOCALE==='en';
   const cells=english?[
     {id:'visible',title:'1 · What the footage shows',hint:'Describe only visible acts; do not assume how the victim died.'},
     {id:'outside',title:'2 · What happened off camera',hint:'Build a sourced timeline; separate testimony, contradictions and corroboration.'},
     {id:'cause',title:'3 · What caused the death',hint:'Distinguish medical findings, causal hypotheses and any proven intent.'}
   ]:[
     {id:'visible',title:'1 · Ce que montrent les images',hint:'Décris uniquement les actes visibles, sans conclure sur le décès.'},
     {id:'outside',title:'2 · Ce qui se passe hors caméra',hint:'Note une chronologie sourcée, et distingue témoignage, contradiction et élément corroboré.'},
     {id:'cause',title:'3 · Ce qui explique le décès',hint:'Sépare constat médico-légal, hypothèse causale et intention éventuellement prouvée.'}
   ];
   const prefix='igr016_ledger_'+STATE.room+'_'+STATE.playerId+'_';
   body+=`<details class="private-block igr016-ledger"><summary>${english?'EVIDENCE BOARD · 3 questions':'TABLE DE PREUVES · 3 questions à résoudre'}</summary><p class="choice-helper">${english?'Interviews can mislead. Genuine footage does not establish the cause of death. Record what each source actually proves. Notes remain on this device.':'Un interrogatoire peut être mensonger. Une vidéo peut être authentique sans établir la cause du décès. Classe les faits et leurs sources avant de décider. Ces notes restent sur cet appareil.'}</p>${cells.map(c=>`<div class="field"><label for="igr016_${c.id}">${h(c.title)}</label><p class="choice-helper">${h(c.hint)}</p><textarea id="igr016_${c.id}" maxlength="650" rows="2" placeholder="${english?'Fact · source · remaining uncertainty…':'Fait · source · ce qui demeure incertain…'}" oninput="save016EvidenceNote('${c.id}',this.value)">${h(STORAGE.getItem(prefix+c.id)||'')}</textarea></div>`).join('')}</details>`;
 }

 if(r.scenario_id==='003'){
  const statements=(d.events||[]).filter(e=>e.event_type==='statement_003');
  const statementAllowed=['investigation_assembly','interrogation_select','interrogation','cycle_debrief'].includes(ph)||ph?.startsWith('annex_');
  if(statements.length)body+=`<section class="private-block"><h3>PROCÈS-VERBAUX · DÉCLARATIONS IRRÉVOCABLES</h3><p class="choice-helper">Ces déclarations sont publiques. Une pièce officielle peut les contredire ; aucune ne devient automatiquement une preuve.</p><div class="timeline">${statements.map(e=>`<details class="event"><summary>CYCLE ${h(e.cycle)} · ${h(e.payload?.pseudo||'Suspect')}</summary><p>${h(e.payload?.text||'')}</p></details>`).join('')}</div></section>`;
  const submitted=(d.my_actions||[]).some(a=>a.action_type==='statement_003'&&a.cycle===r.cycle);
  if(role==='suspect'&&r.status==='playing'&&r.cycle>=1&&r.cycle<=3&&statementAllowed){
    body+=`<section class="action-section"><h3>DÉCLARATION OFFICIELLE · CYCLE ${h(r.cycle)}</h3><p class="choice-helper">Consigne une affirmation précise sur une décision ou un document. Elle sera visible de tous, verrouillée et opposable à tes paroles. Ne cite que ce que ton personnage peut savoir.</p>${submitted?'<div class="locked-state">Ta déclaration est enregistrée. Tu ne peux plus la modifier.</div>':'<div class="field"><label for="igr003Statement">Ta version officielle (20 à 220 caractères)</label><textarea id="igr003Statement" maxlength="220" rows="3" placeholder="Je maintiens que..."></textarea></div><button class="btn danger block" onclick="submit003Statement()">Consigner définitivement</button>'}</section>`;
  }
 }
 if(r.scenario_id==='004'){
  const statements=(d.events||[]).filter(e=>e.event_type==='statement_004');
  const statementAllowed=['investigation_assembly','interrogation_select','interrogation','cycle_debrief'].includes(ph)||ph?.startsWith('annex_');
  if(statements.length)body+=`<section class="private-block"><h3>PROCÈS-VERBAUX · VERSIONS HORODATÉES</h3><p class="choice-helper">Ces déclarations sont publiques. Une pièce officielle peut les contredire ; aucune ne devient automatiquement une preuve.</p><div class="timeline">${statements.map(e=>`<details class="event"><summary>CYCLE ${h(e.cycle)} · ${h(e.payload?.pseudo||'Suspect')}</summary><p>${h(e.payload?.text||'')}</p></details>`).join('')}</div></section>`;
  const submitted=(d.my_actions||[]).some(a=>a.action_type==='statement_004'&&a.cycle===r.cycle);
  if(role==='suspect'&&r.status==='playing'&&r.cycle>=1&&r.cycle<=3&&statementAllowed){
    body+=`<section class="action-section"><h3>VERSION OFFICIELLE · CYCLE ${h(r.cycle)}</h3><p class="choice-helper">Consigne exactement ce que tu savais d'un appel, d'un message ou d'une décision. Elle sera visible de tous, verrouillée et opposable à tes paroles. Ne cite que ce que ton personnage peut savoir.</p>${submitted?'<div class="locked-state">Ta déclaration est enregistrée. Tu ne peux plus la modifier.</div>':'<div class="field"><label for="igr004Statement">Ta version officielle (20 à 220 caractères)</label><textarea id="igr004Statement" maxlength="220" rows="3" placeholder="Je maintiens que..."></textarea></div><button class="btn danger block" onclick="submit004Statement()">Consigner définitivement</button>'}</section>`;
  }
 }
 if(r.scenario_id==='005'){
  const positions={added_after:'Ajouté après les violences',present_before:'Déjà au studio avant le meurtre',moved_after:'Porté pour intimider puis déplacé',undetermined:'Je ne peux pas dater le masque'};
  const statements=(d.events||[]).filter(e=>e.event_type==='statement_005');
  const statementAllowed=['investigation_assembly','interrogation_select','interrogation','cycle_debrief'].includes(ph)||ph?.startsWith('annex_');
  if(statements.length)body+=`<section class="private-block"><h3>PROCÈS-VERBAUX · DÉPOSITIONS IRRÉVOCABLES</h3><p class="choice-helper">Ces déclarations sont publiques. Une pièce officielle peut les contredire ; aucune ne devient automatiquement une preuve.</p><div class="timeline">${statements.map(e=>`<details class="event"><summary>CYCLE ${h(e.cycle)} · ${h(e.payload?.pseudo||'Suspect')}</summary><p>${h(e.payload?.text||'')}</p>${e.payload?.mask_thesis?`<p class="choice-helper">THÈSE SCELLÉE · ${h(positions[e.payload.mask_thesis]||'Sans position')}</p>`:''}</details>`).join('')}</div></section>`;
  const submitted=(d.my_actions||[]).some(a=>a.action_type==='statement_005'&&a.cycle===r.cycle);
  const positionField=r.cycle===2?`<div class="field"><label for="igr005Position">THÈSE SUR LE MASQUE · choix irrévocable</label><select id="igr005Position"><option value="">Choisir ta version…</option><option value="added_after">Ajouté après les violences</option><option value="present_before">Déjà présent avant le meurtre</option><option value="moved_after">Porté puis déplacé</option><option value="undetermined">Je refuse d'affirmer ce que j'ignore</option></select></div>`:'';
  if(role==='suspect'&&r.status==='playing'&&r.cycle>=1&&r.cycle<=3&&statementAllowed){
    body+=`<section class="action-section"><h3>VERSION OFFICIELLE · CYCLE ${h(r.cycle)}</h3><p class="choice-helper">Fixe une affirmation sur le masque, les heures ou une présence au studio. Elle sera visible de tous, verrouillée et opposable à tes paroles. Ne cite que ce que ton personnage peut savoir.</p>${submitted?'<div class="locked-state">Ta déclaration est enregistrée. Tu ne peux plus la modifier.</div>':'<div class="field"><label for="igr005Statement">Ta version officielle (20 à 220 caractères)</label><textarea id="igr005Statement" maxlength="220" rows="3" placeholder="Je maintiens que..."></textarea></div>${positionField}<button class="btn danger block" onclick="submit005Statement()">Consigner définitivement</button>'}</section>`;
  }
 }
 if(r.scenario_id==='006'){
  const pactThesisLabels={no_strike:'Aucun coup avant la chute',strike:'Un coup a précédé la chute',signs_alive:'Noé a réagi après la chute',help_refused:'Une demande d’aide a été refusée',undetermined:'Je refuse de conclure'};
  const statements=(d.events||[]).filter(e=>e.event_type==='statement_006');
  const statementAllowed=['investigation_assembly','interrogation_select','interrogation','cycle_debrief'].includes(ph)||ph?.startsWith('annex_');
  if(statements.length)body+=`<section class="private-block"><h3>PROCÈS-VERBAUX · DÉCLARATIONS DU PACTE</h3><p class="choice-helper">Ces déclarations sont publiques. Une pièce officielle peut les contredire ; aucune ne devient automatiquement une preuve.</p><div class="timeline">${statements.map(e=>`<details class="event"><summary>CYCLE ${h(e.cycle)} · ${h(e.payload?.pseudo||'Suspect')}</summary><p>${h(e.payload?.text||'')}</p>${e.payload?.pact_thesis?`<p class="choice-helper">POSITION SCELLÉE · ${h(pactThesisLabels[e.payload.pact_thesis]||'Non renseignée')}</p>`:''}</details>`).join('')}</div></section>`;
  const submitted=(d.my_actions||[]).some(a=>a.action_type==='statement_006'&&a.cycle===r.cycle);
  const thesisField=r.cycle===2?`<div class="field"><label for="igr006PactThesis">POSITION OFFICIELLE SUR LA NUIT · SCELLÉE</label><select id="igr006PactThesis"><option value="">Choisir une affirmation…</option><option value="no_strike">Aucun coup n'a précédé la chute</option><option value="strike">Un coup a précédé la chute</option><option value="signs_alive">Noé a réagi après la chute</option><option value="help_refused">Une demande d'aide a été refusée</option><option value="undetermined">Je refuse de conclure</option></select></div>`:'';
  if(role==='suspect'&&r.status==='playing'&&r.cycle>=1&&r.cycle<=3&&statementAllowed){
    body+=`<section class="action-section"><h3>VERSION OFFICIELLE · CYCLE ${h(r.cycle)}</h3><p class="choice-helper">Dépose ta version de la nuit. Au cycle 2, fixe aussi une affirmation scellée : les pièces finales pourront la confirmer, la contredire ou laisser la question ouverte. Ta déclaration sera publique et irrévocable.</p>${submitted?'<div class="locked-state">Ta déclaration est enregistrée. Tu ne peux plus la modifier.</div>':'<div class="field"><label for="igr006Statement">Ta version officielle (20 à 220 caractères)</label><textarea id="igr006Statement" maxlength="220" rows="3" placeholder="Je maintiens que..."></textarea></div>${thesisField}<button class="btn danger block" onclick="submit006Statement()">Consigner définitivement</button>'}</section>`;
  }
 }
 if(['001','002','003','004','005','006','007','008','009','010','011','012','013','014','015','016'].includes(r.scenario_id)&&['enqueteur','analyste'].includes(role)){
  const evidenceTag=r.scenario_id==='016'?'investigation_016':r.scenario_id==='015'?'investigation_015':r.scenario_id==='014'?'investigation_014':r.scenario_id==='013'?'investigation_013':r.scenario_id==='012'?'investigation_012':r.scenario_id==='011'?'investigation_011':r.scenario_id==='010'?'investigation_010':r.scenario_id==='009'?'investigation_009':r.scenario_id==='008'?'investigation_008':r.scenario_id==='007'?'investigation_007':r.scenario_id==='006'?'investigation_006':r.scenario_id==='005'?'investigation_005':r.scenario_id==='004'?'investigation_004':r.scenario_id==='003'?'investigation_003':r.scenario_id==='002'?'investigation_002':'investigation_001';const reports=(d.events||[]).filter(e=>e.event_type===evidenceTag);
  if(reports.length)body+=`<section class="private-block igr001-reports"><h3>CONSTATATIONS CIBLÉES · ${reports.length}</h3><div class="timeline">${reports.map(e=>`<details class="event"><summary>${h(e.payload?.title||'Constatation')}</summary><p>${h(e.payload?.text||'')}</p></details>`).join('')}</div></section>`;
  const eligible=['investigation_assembly','interrogation_select','interrogation','cycle_debrief'].includes(ph)||ph?.startsWith('annex_');
  if(eligible){
   const choices=d.scenario?.[evidenceTag]||[];
   const used=d.scenario?.[evidenceTag+'_used'];
   body+=`<section class="action-section igr001-actions"><h3>Investigations complémentaires · Cycle ${h(r.cycle)}</h3><p class="choice-helper">Une seule investigation complémentaire par cycle pour tout le camp Enquête. Cette pièce est facultative et ne remplace jamais l'indice canonique.</p>${used?'<div class="locked-state">L’enquête complémentaire de ce cycle a déjà été réalisée. Consulte le Fil.</div>':choices.map(o=>`<button type="button" class="choice-row" onclick="investigateByScenario('${h(o.id)}')"><span>${h(o.title)}</span><b>Examiner</b></button>`).join('')}</section>`;
  }
 }

 if(r.scenario_id==='017'&&['enqueteur','analyste'].includes(role)){
 const reports=(d.events||[]).filter(e=>e.event_type==='investigation_017');
 const choices=Array.isArray(d.scenario?.investigation_017)?d.scenario.investigation_017:[];
 const used=!!d.scenario?.investigation_017_used||reports.some(e=>+e.cycle===+r.cycle);
 const allowed=['investigation_assembly','interrogation_select','interrogation','cycle_debrief'].includes(ph)||String(ph).startsWith('annex_');
 if(reports.length)body+=`<section class="private-block"><h3>PIÈCES COMPLÉMENTAIRES · ${reports.length}</h3>${reports.map(e=>`<details class="event"><summary>${h(e.payload?.title||'Constat')}</summary><p>${h(e.payload?.text||'')}</p></details>`).join('')}</section>`;
 if(allowed&&r.cycle>=1&&r.cycle<=3)body+=`<section class="action-section"><h3>LE PRIX DU SILENCE · CYCLE ${h(r.cycle)}</h3><p class="choice-helper">Une seule piste par cycle pour tout le camp Enquête. Les trois pièces garanties restent automatiques. Le témoignage du survivant est un récit à recouper, pas une preuve de complicité.</p>${used?'<div class="locked-state">Investigation réalisée · résultat disponible ci-dessus.</div>':choices.map((choice,i)=>`<button type="button" class="choice-row" onclick="investigate017Index(${i+1})"><span>${h(choice.title||'Vérifier cette piste')}</span><b>Examiner</b></button>`).join('')}</section>`;
}

 if(r.scenario_id==='018'&&['enqueteur','analyste'].includes(role)){
  const reports=(d.events||[]).filter(e=>e.event_type==='investigation_018');
  const choices=Array.isArray(d.scenario?.investigation_018)?d.scenario.investigation_018:[];
  const used=!!d.scenario?.investigation_018_used||reports.some(e=>+e.cycle===+r.cycle);
  const enabled=['investigation_assembly','interrogation_select','interrogation','cycle_debrief'].includes(ph)||String(ph).startsWith('annex_');
  if(reports.length)body+=`<section class="private-block"><h3>LES ASSIETTES VIDES · INVESTIGATIONS</h3>${reports.map(e=>`<details class="event"><summary>${h(e.payload?.title||'Pièce examinée')}</summary><p>${h(e.payload?.text||'')}</p></details>`).join('')}</section>`;
  if(enabled&&r.cycle>=1&&r.cycle<=3)body+=`<section class="action-section"><h3>TROIS PISTES · CYCLE ${h(r.cycle)}</h3><p class="choice-helper">Une seule piste par cycle pour le camp Enquête. Sépare l'auteur du meurtre, l'auteur des assiettes et l'existence d'un éventuel projet commun. Les trois preuves essentielles arrivent automatiquement.</p>${used?'<div class="locked-state">Une piste a été examinée pendant ce cycle.</div>':choices.map((o,i)=>`<button type="button" class="choice-row" onclick="investigate018Index(${i+1})"><span>${h(o.title||'Piste matérielle')}</span><b>Examiner</b></button>`).join('')}</section>`;
 }
if(r.scenario_id==='019'&&['enqueteur','analyste'].includes(role)){
  const reports=(d.events||[]).filter(e=>e.event_type==='investigation_019');
  const choices=Array.isArray(d.scenario?.investigation_019)?d.scenario.investigation_019:[];
  const used=!!d.scenario?.investigation_019_used||reports.some(e=>+e.cycle===+r.cycle);
  const enabled=['investigation_assembly','interrogation_select','interrogation','cycle_debrief'].includes(ph)||String(ph).startsWith('annex_');
  if(reports.length)body+=`<section class="private-block"><h3>LE GRAND BAL · INVESTIGATIONS</h3>${reports.map(e=>`<details class="event"><summary>${h(e.payload?.title||'Pièce examinée')}</summary><p>${h(e.payload?.text||'')}</p></details>`).join('')}</section>`;
  if(enabled&&r.cycle>=1&&r.cycle<=3)body+=`<section class="action-section"><h3>TROIS PISTES · CYCLE ${h(r.cycle)}</h3><p class="choice-helper">Une seule piste par cycle pour le camp Enquête. Compare le commandement, les actes de la sécurité et la suppression du dossier. Les preuves principales sont automatiques. Les trois preuves essentielles arrivent automatiquement.</p>${used?'<div class="locked-state">Une piste a été examinée pendant ce cycle.</div>':choices.map((o,i)=>`<button type="button" class="choice-row" onclick="investigate019Index(${i+1})"><span>${h(o.title||'Piste matérielle')}</span><b>Examiner</b></button>`).join('')}</section>`;
 }
if(r.scenario_id==='020'&&['enqueteur','analyste'].includes(role)){
  const reports=(d.events||[]).filter(e=>e.event_type==='investigation_020');
  const choices=Array.isArray(d.scenario?.investigation_020)?d.scenario.investigation_020:[];
  const used=!!d.scenario?.investigation_020_used||reports.some(e=>+e.cycle===+r.cycle);
  const enabled=['investigation_assembly','interrogation_select','interrogation','cycle_debrief'].includes(ph)||String(ph).startsWith('annex_');
  if(reports.length)body+=`<section class="private-block"><h3>L’APOTHÉOSE · INVESTIGATIONS</h3>${reports.map(e=>`<details class="event"><summary>${h(e.payload?.title||'Pièce examinée')}</summary><p>${h(e.payload?.text||'')}</p></details>`).join('')}</section>`;
  if(enabled&&r.cycle>=1&&r.cycle<=3)body+=`<section class="action-section"><h3>QUATRE PISTES · CYCLE ${h(r.cycle)}</h3><p class="choice-helper">Une seule piste par cycle pour le camp Enquête. Compare le commandement, les actes de la sécurité et la suppression du dossier. Les preuves principales sont automatiques. Les six preuves garanties arrivent automatiquement.</p>${used?'<div class="locked-state">Une piste a été examinée pendant ce cycle.</div>':choices.map((o,i)=>`<button type="button" class="choice-row" onclick="investigate020Index(${i+1})"><span>${h(o.title||'Piste matérielle')}</span><b>Examiner</b></button>`).join('')}</section>`;
 }
 if(['030','031'].includes(currentScenario()?.id)&&canInvestigationChannel(role)){const pieces=(d.events||[]).filter(e=>e.event_type==='trame'&&e.payload?.evidence_id);if(pieces.length)body+=`<section class="private-block igr82-known"><h3>PIÈCES D’ENQUÊTE · ${pieces.length} reçues</h3><div class="timeline">${pieces.slice().reverse().map(e=>`<details class="event trame"><summary>${h(e.payload?.title||'Pièce')} · Cycle ${h(e.cycle||'')}</summary><p>${h(e.payload?.text||'')}</p></details>`).join('')}</div></section>`;}
 if((d.pending_requests||[]).length)body+=renderPendingRequests();
 if(ph==='interrogation_select'&&role==='enqueteur')body+=renderInterrogationSelect();
 if(ph==='interrogation'&&role==='enqueteur')body+=`<button class="btn danger block" onclick="endInterrogation()">Terminer cet interrogatoire</button>`;
 if(ph==='cycle_debrief'&&['enqueteur','analyste'].includes(role))body+=renderDebriefForm();
 if(ph==='annex_inspecteur'&&role==='inspecteur')body+=renderSpecialChoices('field',d.scenario.field_actions,'CHOISIR UNE ACTION DE TERRAIN');
 if(ph==='annex_expert'&&role==='expert')body+=renderSpecialChoices('expert',d.scenario.expert_actions,'CHOISIR UNE ANALYSE');
 if(ph==='annex_juge'&&role==='juge')body+=renderJudgeChoices();
 if(ph==='annex_procureur'&&role==='procureur')body+=renderProsecutorPanel();
 if(ph==='annex_temoin'&&role==='enqueteur')body+=renderWitnessPanel();
 if(role==='journaliste'&&['interrogation_select','interrogation','cycle_debrief','annex_inspecteur','annex_procureur','annex_juge','annex_temoin','annex_journaliste','annex_expert'].includes(ph))body+=renderBreakingPanel();
 if(ph==='provisional_lock'&&role==='enqueteur')body+=renderProvisionalForm();
 if(ph==='locking'&&['enqueteur','analyste','procureur','juge','journaliste'].includes(role))body+=renderFinalLockForm();
 if(ph==='reveal'||r.status==='finished')body+=renderReveal();
 return body;
}
function phaseInstruction(role,ph,target){
 const activeAnnex=ph.startsWith('annex_')?ph.replace('annex_',''):'';
 const roleActive=(activeAnnex===role)||(activeAnnex==='temoin'&&role==='temoin')||(['enqueteur','analyste'].includes(role)&&activeAnnex);
 if(ph==='role_reading')return`<p>Lis ta carte privée puis valide-la. Les autres joueurs ne voient pas son contenu.</p>`;
 if(ph==='initial_debrief')return ['enqueteur','analyste'].includes(role)?`<p>Débrief initial. Posez seulement les bases : chronologie, inconnues, ordre d’audition possible.</p>`:`<p>Prépare ta stratégie. Le débrief initial se déroule sans toi.</p>`;
 if(ph==='interrogation_select')return role==='enqueteur'?`<p>Choisis le prochain suspect. Chacun peut être interrogé une fois dans ce cycle.</p>`:`<p>L’Enquêteur choisit le prochain interrogatoire. Le MJ ne peut pas être piloté par un joueur.</p>`;
 if(ph==='interrogation'){
  if(role==='enqueteur')return`<p>Tu interroges <b>${h(target?.pseudo||'le suspect')}</b>. Tu peux terminer plus tôt si l’échange est réellement terminé.</p>`;
  if(role==='analyste')return`<p>Observe silencieusement <b>${h(target?.pseudo||'le suspect')}</b>. Utilise le Canal Enquête si une observation doit atteindre l’Enquêteur.</p>`;
  if(meIsTarget(target))return`<p><b>Tu es interrogé.</b> Réponds selon ta carte. Tu peux mentir si ton rôle le permet, mais jamais inventer une preuve officielle.</p>`;
  return`<p>Tu n’es pas interrogé actuellement. Prépare ta défense et échange oralement avec les autres joueurs disponibles.</p>`;
 }
 if(ph==='cycle_debrief')return ['enqueteur','analyste'].includes(role)?`<p>Réponds aux trois questions courtes. Le serveur choisira ensuite seul une trame canonique adaptée.</p>`:`<p>Le débrief est privé à l’enquête. Aucune action de ta part n’est requise.</p>`;
 if(activeAnnex)return roleActive?`<p>Fenêtre active pour ${h(phaseLabel(ph).toLowerCase())}. Respecte le temps commun affiché.</p>`:`<p>Cette fenêtre ne concerne pas directement ton rôle. Prépare la suite sans accéder aux informations réservées.</p>`;
 if(ph==='trame'){if(!canInvestigationChannel(role))return`<p>Le MJ transmet un nouvel élément canonique au camp d’enquête. Prépare la suite sans consulter son contenu.</p>`;const e=latestEvent('trame');return`<p>Le MJ vient de transmettre automatiquement une trame canonique au camp d’enquête.</p>${e?`<div class="trame-focus"><b>${h(e.payload?.title||'TRAME')}</b><span>${h(e.payload?.text||'')}</span></div>`:''}`}
 if(ph==='closed')return`<p><b>Plus aucune trame, expertise, Breaking News ou action de terrain.</b> L’enquête est définitivement close.</p>`;
 if(ph==='provisional_orals')return renderOralStatus();
 if(ph==='provisional_lock')return role==='enqueteur'?`<p>Attribue à chaque suspect un degré provisoire. Ces accusations déterminent qui dispose d’une dernière défense.</p>`:`<p>L’Enquêteur verrouille les accusations provisoires. Elles seront suivies des défenses.</p>`;
 if(ph==='defense')return renderDefenseStatus(role);
 if(ph==='final_debrief')return ['enqueteur','analyste','procureur'].includes(role)?`<p>Dernier débrief : 3 minutes. Aucun fait nouveau ne peut entrer dans le dossier.</p>`:`<p>Le dernier débrief se déroule sans toi. Le Juge reste à l’extérieur.</p>`;
 if(ph==='locking')return ['enqueteur','analyste','procureur','juge','journaliste'].includes(role)?`<p>Fin des échanges. Verrouille ton choix final sur ton téléphone. Il ne pourra plus être modifié.</p>`:`<p>Les verdicts finaux sont en cours de verrouillage. Attends la révélation.</p>`;
 if(ph==='reveal')return`<p>La vérité canonique et les responsabilités reconstruites sont révélées.</p>`;
 return`<p>La partie est synchronisée par le serveur.</p>`;
}
function meIsTarget(target){return target?.id===STATE.playerId}
function renderInterrogationSelect(){
 const d=STATE.sync,heard=d.room.state?.heard||[];const remaining=d.suspects.filter(s=>!heard.includes(s.id));
 return `<div class="action-section"><h3>Suspects restant à entendre</h3><p class="choice-helper">L’ordre affiché est tiré au sort à chaque cycle. Il ne reflète ni la culpabilité ni le degré réel de responsabilité.</p>${remaining.length?remaining.map(s=>`<button class="choice-row" onclick="startInterrogation('${s.id}')"><span>${h(s.pseudo)}</span><b>Interroger · 6 min</b></button>`).join(''):`<p>Tous les suspects ont été entendus. Le débrief va s’ouvrir automatiquement.</p>`}</div>`;
}
async function startInterrogation(id){try{await rpc('igr_v4_start_interrogation',{p_code:STATE.room,p_player_token:STATE.token,p_target:id});await syncNow(true)}catch(e){console.error(e);toast('Interrogatoire impossible.') }}
async function endInterrogation(){try{await rpc('igr_v4_end_interrogation',{p_code:STATE.room,p_player_token:STATE.token});await syncNow(true)}catch(e){console.error(e);toast('Impossible de terminer cet interrogatoire.')}}
function myAction(type,cycle=STATE.sync?.room?.cycle){return (STATE.sync?.my_actions||[]).find(a=>a.action_type===type&&(cycle==null||a.cycle===cycle))}
function renderDebriefForm(){
 if(myAction('debrief'))return`<div class="locked-state">Tes réponses sont envoyées. Le MJ attend l’autre rôle d’enquête éventuel.</div>`;
 return `<div class="qcm-v11"><div class="field"><label for="qConvergence">1 · Le groupe converge-t-il déjà fortement ?</label><select id="qConvergence"><option value="0">Non</option><option value="1">Un peu</option><option value="2">Oui, très fortement</option></select></div><div class="field"><label for="qConfusion">2 · Le groupe est-il perdu ?</label><select id="qConfusion"><option value="0">Non</option><option value="1">Un peu</option><option value="2">Oui, fortement</option></select></div><div class="field"><label for="qAxis">3 · Quel axe manque le plus ?</label><select id="qAxis"><option value="chronologie">Chronologie</option><option value="acces">Accès / déplacements</option><option value="mobile">Mobile / relations</option><option value="materiel">Matériel / technique</option><option value="responsabilite">Degré de responsabilité</option></select></div><button class="btn primary block" onclick="submitDebrief()">Envoyer au MJ automatique</button></div>`;
}
async function submitDebrief(){try{await rpc('igr_v4_submit_debrief',{p_code:STATE.room,p_player_token:STATE.token,p_convergence:+byId('qConvergence').value,p_confusion:+byId('qConfusion').value,p_axis:byId('qAxis').value});await syncNow(true)}catch(e){console.error(e);toast('Réponse déjà envoyée ou phase terminée.')}}
function renderSpecialChoices(kind,items,title){
 const used=myAction(kind);if(used)return`<div class="locked-state">Ton choix de ce cycle est verrouillé. Le résultat apparaît dans le Fil pour les rôles autorisés.</div>`;
 if(!items?.length)return`<div class="locked-state">Aucune option disponible dans ce dossier.</div>`;
 return `<div class="action-section"><h3>${h(title)}</h3>${items.map(x=>`<button class="choice-row" onclick="specialAction('${kind}','${h(x.id)}')"><span>${h(x.title)}</span><b>Choisir</b></button>`).join('')}</div>`;
}
async function submit003Statement(){
 const txt=(byId('igr003Statement')?.value||'').trim();
 if(txt.length<20||txt.length>220){toast('Écris entre 20 et 220 caractères.');return;}
 try{await rpc('igr_v222_003_statement',{p_code:STATE.room,p_token:STATE.token,p_text:txt});await syncNow(true)}
 catch(e){console.error(e);toast('Déclaration indisponible ou déjà verrouillée.')}
}
async function submit004Statement(){
 const txt=(byId('igr004Statement')?.value||'').trim();
 if(txt.length<20||txt.length>220){toast('Écris entre 20 et 220 caractères.');return;}
 try{await rpc('igr_v233_004_statement',{p_code:STATE.room,p_token:STATE.token,p_text:txt});await syncNow(true)}
 catch(e){console.error(e);toast('Version indisponible ou déjà verrouillée.')}
}
async function submit005Statement(){
 const text=(byId('igr005Statement')?.value||'').trim();
 if(text.length<20||text.length>220){toast('Dépose entre 20 et 220 caractères.');return;}
 const position=STATE.sync?.room?.cycle===2?(byId('igr005Position')?.value||''):'undetermined';
 if(!position){toast('Choisis une thèse, ou indique que tu ne peux pas conclure.');return;}
 try{await rpc('igr_v260_005_statement',{p_code:STATE.room,p_token:STATE.token,p_text:text,p_position:position});await syncNow(true)}
 catch(e){console.error(e);toast('Déposition indisponible ou déjà verrouillée.')}
}
async function submit006Statement(){
 const statement=(byId('igr006Statement')?.value||'').trim();
 if(statement.length<20||statement.length>220){toast('Écris entre 20 et 220 caractères.');return;}
 const isSecond=STATE.sync?.room?.scenario_id==='006'&&STATE.sync?.room?.cycle===2;
 const thesis=isSecond?(byId('igr006PactThesis')?.value||''):null;
 if(isSecond&&!thesis){toast('Choisis une position scellée, même si tu refuses de conclure.');return;}
 try{if(isSecond)await rpc('igr_v270_006_statement',{p_code:STATE.room,p_token:STATE.token,p_text:statement,p_thesis:thesis});
 else await rpc('igr_v263_006_statement',{p_code:STATE.room,p_token:STATE.token,p_text:statement});
 await syncNow(true)}
 catch(e){console.error(e);toast('Déclaration indisponible ou déjà enregistrée.')}
}
async function investigate020Index(i){try{await rpc('igr_v606_020_investigate_index',{p_code:STATE.room,p_player_token:STATE.token,p_index:i});await syncNow(true)}catch(e){console.error(e);toast('Enquête indisponible pour ce cycle.')}}
async function investigate019Index(i){try{await rpc('igr_v576_019_investigate_index',{p_code:STATE.room,p_player_token:STATE.token,p_index:i});await syncNow(true)}catch(e){console.error(e);toast('Cette investigation n’est pas disponible pour ce cycle.')}}
async function investigate018Index(i){try{await rpc('igr_v546_018_investigate_index',{p_code:STATE.room,p_player_token:STATE.token,p_index:i});await syncNow(true)}catch(e){console.error(e);toast('Cette piste n’est plus accessible pendant ce cycle.')}}
async function investigate017Index(i){try{await rpc('igr_v526_017_investigate_index',{p_code:STATE.room,p_player_token:STATE.token,p_index:i});await syncNow(true)}catch(e){console.error(e);toast('Cette investigation n’est plus disponible pour ce cycle.')}}
async function investigateByScenario(choice){
 try{await rpc(STATE.sync?.room?.scenario_id==='016'?'igr_v485_016_investigate':STATE.sync?.room?.scenario_id==='015'?'igr_v455_015_investigate':STATE.sync?.room?.scenario_id==='014'?'igr_v435_014_investigate':STATE.sync?.room?.scenario_id==='013'?'igr_v415_013_investigate':STATE.sync?.room?.scenario_id==='012'?'igr_v395_012_investigate':STATE.sync?.room?.scenario_id==='011'?'igr_v375_011_investigate':STATE.sync?.room?.scenario_id==='010'?'igr_v355_010_investigate':STATE.sync?.room?.scenario_id==='009'?'igr_v335_009_investigate':STATE.sync?.room?.scenario_id==='008'?'igr_v305_008_investigate':STATE.sync?.room?.scenario_id==='007'?'igr_v292_007_investigate':STATE.sync?.room?.scenario_id==='006'?'igr_v262_006_investigate':STATE.sync?.room?.scenario_id==='005'?'igr_v252_005_investigate':STATE.sync?.room?.scenario_id==='004'?'igr_v232_004_investigate':STATE.sync?.room?.scenario_id==='003'?'igr_v223_003_investigate':STATE.sync?.room?.scenario_id==='002'?'igr_v203_002_investigate':'igr_v187_001_investigate',{p_code:STATE.room,p_player_token:STATE.token,p_choice:choice});await syncNow(true)}
 catch(e){console.error(e);toast('Investigation indisponible, déjà demandée ou phase terminée.')}
}
async function specialAction(kind,choice){try{await rpc('igr_v4_special_action',{p_code:STATE.room,p_player_token:STATE.token,p_kind:kind,p_choice:choice});await syncNow(true)}catch(e){console.error(e);toast('Action impossible ou déjà utilisée.')}}
function renderJudgeChoices(){
 const spent=(STATE.sync?.my_actions||[]).filter(a=>a.action_type==='judge').reduce((s,a)=>s+(+a.payload?.cost||0),0),left=5-spent;
 return `<div class="gauge"><span>CONFIDENTIALITÉ</span><b>${left}/5 restant${left>1?'s':''}</b></div>${renderSpecialChoices('judge',STATE.sync.scenario.protected,'INFORMATION PROTÉGÉE')}`;
}
function renderProsecutorPanel(){
 const d=STATE.sync,cycle=d.room.cycle,success=(d.my_actions||[]).filter(a=>a.action_type==='prosecutor_success'&&a.cycle===cycle),max=d.room.scenario_id==='017'?2:1,pending=(d.my_actions||[]).find(a=>a.action_type==='prosecutor_request'&&a.cycle===cycle&&a.payload?.status==='pending');
 if(success.length>=max)return`<div class="locked-state">Quota d’entretien réussi atteint pour ce cycle.</div>`;
 if(pending)return`<div class="locked-state">Une demande d’entretien est en attente de réponse.</div>`;
 const blocked=new Set(success.map(a=>a.payload?.target));
 return `<div class="action-section"><h3>Demander un entretien ciblé · 3 min</h3>${d.players.filter(p=>p.id!==d.player.id&&!blocked.has(p.id)).map(p=>`<button class="choice-row" onclick="prosecutorRequest('${p.id}')"><span>${h(p.pseudo)} · ${h(publicRoleLabel(p.public_role))}</span><b>Demander</b></button>`).join('')}</div>`;
}
async function prosecutorRequest(id){try{await rpc('igr_v4_prosecutor_request',{p_code:STATE.room,p_player_token:STATE.token,p_target:id});await syncNow(true)}catch(e){console.error(e);toast('Demande impossible.')}}
function renderPendingRequests(){return `<div class="request-box"><h3>Demande du Procureur</h3>${STATE.sync.pending_requests.map(r=>`<p>${h(r.from_pseudo)} demande un entretien ciblé de 3 minutes.</p><div class="tag-row"><button class="btn primary small" onclick="respondProsecutor(${r.request_id},true)">Accepter</button><button class="btn small" onclick="respondProsecutor(${r.request_id},false)">Refuser</button></div>`).join('')}</div>`}
async function respondProsecutor(id,accept){try{await rpc('igr_v4_prosecutor_respond',{p_code:STATE.room,p_player_token:STATE.token,p_request_id:id,p_accept:accept});await syncNow(true)}catch(e){console.error(e);toast('Cette demande n’est plus active.')}}
function renderWitnessPanel(){
 const ws=STATE.sync.players.filter(p=>p.public_role==='temoin');if(!ws.length)return'';
 return `<div class="action-section"><h3>Statut des témoins</h3>${ws.map(w=>`<div class="choice-row static"><span>${h(w.pseudo)}</span><div class="tiny-actions"><button onclick="witnessStatus('${w.id}','interest')">Personne d’intérêt</button><button onclick="witnessStatus('${w.id}','suspect')">Placer comme suspect</button></div></div>`).join('')}</div>`;
}
async function witnessStatus(id,status){try{await rpc('igr_v4_witness_status',{p_code:STATE.room,p_player_token:STATE.token,p_target:id,p_status:status});await syncNow(true)}catch(e){console.error(e);toast('Changement impossible.')}}
function renderBreakingPanel(){
 const d=STATE.sync,cycle=d.room.cycle,already=(d.my_actions||[]).some(a=>a.action_type==='breaking_news'&&a.cycle===cycle),total=(d.my_actions||[]).filter(a=>a.action_type==='breaking_news').length,used=new Set(Object.keys(d.room.state?.used_news||{}));
 if(already||total>=3)return`<div class="locked-state">Breaking News : ${total}/3 · quota de ce cycle utilisé.</div>`;
 const choices=(d.scenario.news||[]).filter(n=>!used.has(n.id));if(!choices.length)return'';
 return `<div class="action-section breaking-panel"><h3>BREAKING NEWS · ${total}/3</h3><p>Choisis une publication canonique. Tu ne peux pas écrire une fausse preuve officielle.</p>${choices.map(n=>`<button class="choice-row" onclick="publishBreaking('${h(n.id)}')"><span><b>${h(n.title)}</b><small>${h(n.text)}</small></span><b>Publier</b></button>`).join('')}</div>`;
}
async function publishBreaking(choice){try{await rpc('igr_v4_publish_breaking',{p_code:STATE.room,p_player_token:STATE.token,p_choice:choice});await syncNow(true)}catch(e){console.error(e);toast('Breaking News impossible ou quota atteint.')}}
function renderOralStatus(){const st=STATE.sync.room.state||{},q=st.oral_queue||[],i=+st.oral_index||0,item=q[i];return item?`<div class="speaker-card">${avatarHtml(item.player_id,item.pseudo,'avatar-small')}<small>${h(publicRoleLabel(item.role))}</small><strong>${h(item.pseudo)}</strong><span>${item.seconds}s · conclusion provisoire</span></div>`:`<p>Conclusions provisoires en cours.</p>`}
function renderDefenseStatus(role){const st=STATE.sync.room.state||{},q=st.defense_queue||[],i=+st.defense_index||0,item=q[i];if(!item)return`<p>Défenses en cours.</p>`;const active=STATE.playerId===item.id||role==='maitre';return`<div class="speaker-card ${active?'active':''}">${avatarHtml(item.id,item.pseudo,'avatar-small')}<small>DERNIÈRE DÉFENSE</small><strong>${h(item.pseudo)}</strong><span>3 minutes maximum en LONG · l’Avocat officiel partage ce temps.</span></div>`}
function levelsForm(prefix='lvl'){return STATE.sync.suspects.map(s=>`<div class="level-row"><span>${h(s.pseudo)}</span><select id="${prefix}_${s.id}"><option value="0">0 · aucune responsabilité</option><option value="1">1 · responsabilité secondaire</option><option value="2">2 · responsabilité principale</option></select></div>`).join('')}
function collectLevels(prefix='lvl'){const o={};STATE.sync.suspects.forEach(s=>o[s.id]=+byId(`${prefix}_${s.id}`).value);return o}
function renderProvisionalForm(){if(myAction('provisional'))return`<div class="locked-state">Accusations provisoires verrouillées.</div>`;return`<div class="action-section"><h3>Degré provisoire de responsabilité</h3>${levelsForm('prov')}<button class="btn danger block" onclick="setProvisional()">Verrouiller les accusations provisoires</button></div>`}
async function setProvisional(){try{await rpc('igr_v4_set_provisional',{p_code:STATE.room,p_player_token:STATE.token,p_levels:collectLevels('prov')});await syncNow(true)}catch(e){console.error(e);toast('Accusations incomplètes ou déjà verrouillées.')}}
function renderFinalLockForm(){
 const role=STATE.sync.player.public_role;if(myAction('final_lock',null))return`<div class="locked-state">Ton choix final est verrouillé. Il ne peut plus être modifié.</div>`;
 if(role==='journaliste')return`<div class="final-form"><div class="field"><label for="finalText">Angle final publié</label><textarea id="finalText" maxlength="300" placeholder="Quel angle assumes-tu après l’enquête ?"></textarea></div><button class="btn danger block" onclick="lockFinal()">Verrouiller définitivement</button></div>`;
 const twoReconstruction=STATE.sync?.room?.scenario_id==='002'&&['enqueteur','analyste'].includes(role)?`<section class="action-section igr002-reconstruction"><h3>RECONSTITUER LES FAITS · DOSSIER 002</h3><p class="choice-helper">Ce que chacun a fait, ce qu'il savait et les limites de l'enquête. Trois questions. Aucun meurtrier inventé.</p>
<div class="field"><label for="igr002Central">Quel fait central distingue cette enquête ?</label><select id="igr002Central"><option value="">Sélectionner…</option><option value="repeated_public_humiliation">Des humiliations publiques répétées</option><option value="explicit_help_request_unanswered">Une demande explicite d'aide comprise et ignorée</option><option value="distinct_acts_without_single_culprit">Des manquements distincts, sans responsable unique</option></select></div>
<div class="field"><label for="igr002Evidence">Quelle preuve tranche la chronologie ?</label><select id="igr002Evidence"><option value="">Sélectionner…</option><option value="repeated_publications">L'historique de plusieurs publications</option><option value="unmade_call_after_note">Une note d'appel jamais suivie d'une demande d'aide</option><option value="unread_apology_and_unverified_help">Une excuse non confirmée et une assistance seulement supposée</option></select></div>
<div class="field"><label for="igr002Boundary">Quelle erreur l'enquête doit-elle éviter ?</label><select id="igr002Boundary"><option value="">Sélectionner…</option><option value="no_unique_cause">Attribuer une cause unique à la mort</option><option value="no_certain_outcome">Affirmer qu'une aide aurait certainement changé l'issue</option><option value="separate_knowledge">Prêter à chacun les mêmes connaissances</option></select></div></section>`:'';
 const threeReconstruction=STATE.sync?.room?.scenario_id==='003'&&['enqueteur','analyste'].includes(role)?`<section class="action-section"><h3>RECONSTITUTION · LE DERNIER PROTOCOLE</h3><p class="choice-helper">Retrouve l'acte central, l'information déterminante et la pièce qui renverse la version officielle. Les réponses restent privées jusqu'au verdict.</p>
<div class="field"><label for="igr003Central">Quelle décision a rompu la chaîne institutionnelle ?</label><select id="igr003Central"><option value="">Choisir…</option><option value="maintained_order">Poursuite malgré l'avertissement</option><option value="signed_false_document">Dossier signé malgré l'avertissement</option><option value="transfer_without_agreement">Transport déclaré sans accord</option></select></div>
<div class="field"><label for="igr003Knowledge">Quelle information était déterminante ?</label><select id="igr003Knowledge"><option value="">Choisir…</option><option value="active_warning">Le danger avait été signalé</option><option value="conflicting_records_known">Le dossier signé contredisait l'avertissement</option><option value="unsigned_receipt">L'accord de réception n'avait jamais été donné</option></select></div>
<div class="field"><label for="igr003Reversal">Quel élément renverse la version présentée ?</label><select id="igr003Reversal"><option value="">Choisir…</option><option value="omitted_reservation">Un avertissement a été retiré du dossier</option><option value="deliberate_false_dossier">Le dossier signé contredit l'avertissement</option><option value="warning_hidden_before_departure">Un avertissement décisif n'a pas été transmis</option></select></div></section>`:'';
 const fourReconstruction=STATE.sync?.room?.scenario_id==='004'&&['enqueteur','analyste'].includes(role)?`<section class="action-section"><h3>RECONSTITUER LES APPELS · DOSSIER 004</h3><p class="choice-helper">Les heures, les connaissances, les décisions. Le verdict porte sur ce qui est établi, pas sur une issue médicale hypothétique.</p>
<div class="field"><label for="igr004Signal">Quel élément remet les versions en cause ?</label><select id="igr004Signal"><option value="">Choisir…</option><option value="explicit_first_call">Le premier appel était explicite</option><option value="parallel_messages">Deux messages ont été reçus par deux proches</option><option value="misdated_passage">La rumeur inverse l'heure d'un passage</option></select></div>
<div class="field"><label for="igr004Decision">Quelle décision centrale a été établie ?</label><select id="igr004Decision"><option value="">Choisir…</option><option value="refused_referral">La demande d'aide comprise n'a pas été relayée</option><option value="mutual_waiting">Deux proches ont attendu sans prise en charge convenue</option><option value="early_refusal">Une première demande a été refusée avant les autres événements</option></select></div>
<div class="field"><label for="igr004Limit">Quelle conclusion doit rester limitée ?</label><select id="igr004Limit"><option value="">Choisir…</option><option value="no_certain_prevention">On ne peut pas garantir qu'une intervention aurait empêché le décès</option><option value="no_rescue_assigned">Aucun relais d'assistance n'a été réellement convenu</option><option value="late_visit_no_early_knowledge">Le proche passé tardivement n'avait pas reçu l'alerte antérieure</option></select></div></section>`:'';
 const fiveReconstruction=STATE.sync?.room?.scenario_id==='005'&&['enqueteur','analyste'].includes(role)?`<section class="action-section"><h3>RECONSTITUER LE MASQUE · DOSSIER 005</h3><p class="choice-helper">Qui a tué Keller ? Que faisait le masque ? Quelle pièce permet de le démontrer ?</p>
<div class="field"><label for="igr005Author">Auteur des coups mortels</label><select id="igr005Author"><option value="">Choisir…</option><option value="first_suspect">Suspect 1</option><option value="second_suspect">Suspect 2</option><option value="third_suspect">Suspect 3</option></select></div>
<div class="field"><label for="igr005Mask">Fonction réelle du masque</label><select id="igr005Mask"><option value="">Choisir…</option><option value="added_after">Ajouté après le meurtre pour détourner l'enquête</option><option value="present_before">Présent avant la mort comme accessoire</option><option value="moved_after">Porté pour intimider, puis déplacé après les violences</option></select></div>
<div class="field"><label for="igr005Proof">Preuve décisive</label><select id="igr005Proof"><option value="">Choisir…</option><option value="late_entry_and_staging">Entrée tardive et indice de mise en scène</option><option value="inventory_and_appointment">Inventaire antérieur et rendez-vous sur les lettres</option><option value="separate_entries_and_shift">Deux entrées distinctes et masque déplacé</option></select></div></section>`:'';
 const sixReconstruction=STATE.sync?.room?.scenario_id==='006'&&['enqueteur','analyste'].includes(role)?`<section class="action-section"><h3>LE PACTE DES CINQ ANS · DOSSIER 006</h3><p class="choice-helper">Tu dois expliquer la chute, ce que les trois amis ont décidé après celle-ci et l'information supprimée de leurs témoignages.</p>
<div class="field"><label for="igr006Fall">Qu'est-ce qui a provoqué la chute de Noé ?</label><select id="igr006Fall"><option value="">Choisir…</option><option value="accidental">Une perte d'équilibre sans coup préalable</option><option value="strike">Un coup brusque avant la chute</option></select></div>
<div class="field"><label for="igr006Response">Quelle réaction a suivi ?</label><select id="igr006Response"><option value="">Choisir…</option><option value="presumed_dead">Les amis ont supposé que Noé était mort, sans vérification suffisante</option><option value="help_blocked">Des signes de vie ont été perçus ; une demande d'aide a été refusée</option></select></div>
<div class="field"><label for="igr006Lie">Sur quoi portait le pacte ?</label><select id="igr006Lie"><option value="">Choisir…</option><option value="coordinated_presence">Effacer la présence et organiser une version collective</option><option value="concealed_strike">Effacer le coup précédant la chute</option><option value="suppressed_signs">Effacer les signes de vie et le refus d'assistance</option></select></div></section>`:'';
 const sevenReconstruction=STATE.sync?.room?.scenario_id==='007'&&['enqueteur','analyste'].includes(role)?`<section class="action-section"><h3>RECONSTITUER LA SUCCESSION · DOSSIER 007</h3><p class="choice-helper">Le testament donne des mobiles ; seules les pièces et les heures permettent d'attribuer la chute. Identifie le dernier conflit, l'acte documenté et la fausse piste.</p>
<div class="field"><label for="igr007Cause">Quel différend a déterminé la dernière confrontation ?</label><select id="igr007Cause"><option value="">Sélectionner…</option><option value="separate_dispute">Une seconde dispute, distincte de la signature</option><option value="debt_confrontation">La récupération de preuves d'une dette</option><option value="lineage_document">La remise d'un document de filiation</option></select></div>
<div class="field"><label for="igr007Actor">Quel geste est établi lors du dernier affrontement ?</label><select id="igr007Actor"><option value="">Sélectionner…</option><option value="second_confrontation">Le gardien des documents provoque la chute lors d'un second entretien</option><option value="third_file_struggle">Le débiteur provoque la chute dans une lutte pour un dossier</option><option value="second_document_struggle">Le gardien provoque la chute en reprenant un original familial</option></select></div>
<div class="field"><label for="igr007Decoy">Quelle apparence a faussé les premières accusations ?</label><select id="igr007Decoy"><option value="">Sélectionner…</option><option value="forced_signature">La signature sous pression</option><option value="concealed_debt">Le justificatif de dette disparu</option><option value="hidden_lineage">Le secret de filiation</option></select></div></section>`:'';
 const eightReconstruction=STATE.sync?.room?.scenario_id==='008'&&['enqueteur','analyste'].includes(role)?`<section class="action-section"><h3>SOUS SERMENT · DOSSIER 008</h3><p class="choice-helper">Un faux témoignage n'établit pas à lui seul un acte matériel. Reconstruis le fait central, la responsabilité démontrée et le mensonge qui a détourné l'enquête.</p>
<div class="field"><label for="igr008Incident">Quel fait central est établi ?</label><select id="igr008Incident"><option value="">Sélectionner…</option><option value="authorised_removal_confirmed">Le retrait régulier de D-14 est corroboré malgré un faux horaire</option><option value="custody_gap">Une pièce est restée sans garde pendant treize minutes</option><option value="document_displacement">D-14 a été déplacé vers un autre casier</option></select></div>
<div class="field"><label for="igr008Responsible">Quelle responsabilité est établie ?</label><select id="igr008Responsible"><option value="">Sélectionner…</option><option value="slot2_witness_pressure">Une consigne a tenté de faire taire un manquement</option><option value="slot1_custody_breach">Le premier témoin a rompu la chaîne de conservation</option><option value="slot3_deliberate_move">Le troisième témoin a déplacé la pièce</option></select></div>
<div class="field"><label for="igr008Decoy">Quel mensonge a créé la fausse piste ?</label><select id="igr008Decoy"><option value="">Sélectionner…</option><option value="slot3_private_arrival">L'heure d'arrivée maquillée pour cacher une relation privée</option><option value="slot3_early_arrival">La présence anticipée, confondue avec un accès au local</option><option value="slot1_false_timesheet">La feuille de présence mensongère sur une tâche annexe</option></select></div></section>`:'';
 const nineReconstruction=STATE.sync?.room?.scenario_id==='009'&&['enqueteur','analyste'].includes(role)?`<section class="action-section"><h3>LE SUJET 17 · DOSSIER 009</h3><p class="choice-helper">L'amnésie du médecin est authentique. Distingue les propos du Sujet 17, la décision qui a maintenu le protocole et la fausse piste. Une mémoire absente n'efface pas les décisions antérieures consignées.</p>
<div class="field"><label for="igr009Withdrawal">Quel fait est établi concernant le consentement ?</label><select id="igr009Withdrawal"><option value="">Sélectionner…</option><option value="explicit_before_continuation">Le retrait explicite précède la poursuite</option><option value="original_note_confirmed_explicit">La note originale confirme un retrait explicite</option></select></div>
<div class="field"><label for="igr009Decision">Qui a pris la décision déterminante ?</label><select id="igr009Decision"><option value="">Sélectionner…</option><option value="director_ordered_continuation">La direction a imposé la continuation</option><option value="clinician_signed_continuation">Le médecin a personnellement signé la continuation</option><option value="director_rewrote_and_blocked_stop">La direction a réécrit la note et bloqué l'arrêt</option></select></div>
<div class="field"><label for="igr009Decoy">Quelle apparence trompeuse doit être écartée ?</label><select id="igr009Decoy"><option value="">Sélectionner…</option><option value="amnesia_does_not_erase_prior_order">L'amnésie ne fait pas disparaître un ordre antérieur</option><option value="supervision_recommended_stop">La supervision recommandait de suspendre</option><option value="unauthorized_copy_not_source_of_refusal">La copie irrégulière n'invente pas le refus initial</option></select></div></section>`:'';
 const tenReconstruction=STATE.sync?.room?.scenario_id==='010'&&['enqueteur','analyste'].includes(role)?`<section class="action-section"><h3>LE BRUIT DES MURS · DOSSIER 010</h3><p class="choice-helper">Nora était vivante à 13 h 54. Distingue l'origine de son enfermement, la décision prise à l'ouverture, et ce qu'un témoin savait réellement.</p>
<div class="field"><label for="igr010Origin">Comment l'enfermement a-t-il commencé ?</label><select id="igr010Origin"><option value="">Sélectionner…</option><option value="manual_confinement_by_first">Le premier suspect a volontairement verrouillé la porte</option><option value="accidental_latch_after_maintenance">La porte s'est bloquée pendant une intervention</option><option value="knowledge_and_order_by_first">Le premier suspect connaissait le lieu et a ordonné son maintien</option></select></div>
<div class="field"><label for="igr010Door">Que s'est-il passé à l'ouverture de 13 h 54 ?</label><select id="igr010Door"><option value="">Sélectionner…</option><option value="independent_reclose_after_contact">La personne a volontairement refermé de sa propre initiative</option><option value="panic_reclose_after_contact">La personne a refermé par panique sans demander secours</option><option value="pressured_reclose_after_contact">La personne a refermé sous la pression d'un autre</option></select></div>
<div class="field"><label for="igr010Signal">Quel rôle ont joué les signes d'alerte ?</label><select id="igr010Signal"><option value="">Sélectionner…</option><option value="noise_witness_without_identification">Un témoin a entendu des coups sans les identifier</option><option value="credible_warning_read_ignored">Un témoin a lu une alerte crédible et l'a ignorée</option><option value="unauthorized_presence_misdirection">Le mensonge du témoin concerne sa présence interdite</option></select></div></section>`:'';
 const elevenReconstruction=STATE.sync?.room?.scenario_id==='011'&&['enqueteur','analyste'].includes(role)?`<section class="action-section"><h3>36 HEURES · DOSSIER 011</h3><p class="choice-helper">Reconstruis séparément la décision initiale, le dépassement sur le terrain et le comportement du bureau chargé de suspendre. Un ordre risqué ne couvre pas automatiquement toutes les violences commises après.</p>
<div class="field"><label for="igr011Order">Quel était le contenu de l'ordre initial ?</label><select id="igr011Order"><option value="">Sélectionner…</option><option value="informed_illegal_authorization">L'officier a signé malgré une alerte civile précise</option><option value="explicit_civilian_limits">L'ordre établissait explicitement des limites protectrices</option><option value="general_risk_no_specific_authorization">L'ordre connaissait un risque général sans autoriser l'extension</option></select></div>
<div class="field"><label for="igr011Field">Qui a décidé et dissimulé les initiatives du terrain ?</label><select id="igr011Field"><option value="">Sélectionner…</option><option value="abusive_execution_with_local_discretion">Le terrain a aggravé une opération déjà autorisée en connaissance du risque</option><option value="unauthorized_expansion_with_self_edited_report">Le commandant local a dépassé l'ordre puis retouché son propre rapport</option><option value="unauthorized_expansion_with_coverup_by_control">Le commandant local a dépassé l'ordre ; le contrôle a réécrit le rapport</option></select></div>
<div class="field"><label for="igr011Halt">Qu'a fait l'officier chargé de suspendre l'opération ?</label><select id="igr011Halt"><option value="">Sélectionner…</option><option value="delayed_despite_first_alert">Il a attendu malgré une première alerte crédible</option><option value="delayed_after_repeated_warnings">Il a attendu malgré plusieurs avertissements successifs</option><option value="delayed_and_directed_coverup">Il a tardé à agir puis fait réécrire les responsabilités</option></select></div></section>`:'';
 const twelveReconstruction=STATE.sync?.room?.scenario_id==='012'&&['enqueteur','analyste'].includes(role)?`<section class="action-section"><h3>FIDÈLES · DOSSIER 012</h3><p class="choice-helper">Sépare l'ordre de départ, les violences commises et la réaction du dirigeant après les faits. La rétention et les coups peuvent relever de décisions différentes.</p>
<div class="field"><label for="igr012Directive">Quelle était la consigne initiale ?</label><select id="igr012Directive"><option value="">Sélectionner…</option><option value="ordre_explicite_de_retenir">Le dirigeant a ordonné de retenir Sacha</option><option value="consigne_de_discussion_detournee">Une demande de discussion a été détournée en rétention</option><option value="aucun_ordre_initial">Le responsable a agi sans ordre initial</option></select></div>
<div class="field"><label for="igr012Violence">D'où proviennent les violences ?</label><select id="igr012Violence"><option value="">Sélectionner…</option><option value="coups_ajoutes_hors_ordre">Les coups ont été ajoutés à un ordre de rétention</option><option value="coups_pour_imposer_consigne">Les coups ont servi à imposer une consigne déformée</option><option value="violences_et_retention_autonomes">Les coups et l'enfermement ont été décidés individuellement</option></select></div>
<div class="field"><label for="igr012Reaction">Quelle est la responsabilité du dirigeant ?</label><select id="igr012Reaction"><option value="">Sélectionner…</option><option value="direction_assume_retention">Il assume la rétention qu'il a ordonnée</option><option value="chef_averti_mais_inactif">Il a été averti de l'enfermement mais n'a pas agi</option><option value="chef_organise_couverture">Il a découvert les faits puis organisé le silence</option></select></div></section>`:'';
 const thirteenReconstruction=STATE.sync?.room?.scenario_id==='013'&&['enqueteur','analyste'].includes(role)?`<section class="action-section"><h3>LIGNE DE MIRE · DOSSIER 013</h3><p class="choice-helper">Distingue ce que le coordinateur savait, qui a désigné la victime et ce que le responsable de sécurité a réellement fait. Ne confonds pas contribution, connaissance de la cible et décision de tuer.</p>
<div class="field"><label for="igr013Knowledge">Que savait le coordinateur ?</label><select id="igr013Knowledge"><option value="">Sélectionner…</option><option value="logistique_savait_violence">Il connaissait la nature violente de la mission, sans choisir la victime</option><option value="logistique_risque_sans_cible">Il connaissait un risque grave sans savoir qui serait visé</option><option value="logistique_alerte_et_suspension">Il a participé puis tenté trop tard de suspendre l'opération</option></select></div>
<div class="field"><label for="igr013Command">Comment la décision de viser Kessler a-t-elle circulé ?</label><select id="igr013Command"><option value="">Sélectionner…</option><option value="ordre_nominatif_transmis">Le tireur a reçu un ordre nominatif de son intermédiaire</option><option value="financeur_nomme_cible_separement">Le financeur a désigné la victime par un circuit distinct</option><option value="suspension_jamais_confirmee">Une demande de suspension n'est jamais parvenue de façon confirmée</option></select></div>
<div class="field"><label for="igr013Security">Qu'établit la responsabilité du cadre de sécurité ?</label><select id="igr013Security"><option value="">Sélectionner…</option><option value="acces_vendu_et_journal_retouche_apres">Il a vendu l'accès puis retouché les traces après le meurtre</option><option value="securite_payee_separement">Son implication était financée par un circuit séparé</option><option value="acces_prepare_et_logs_alteres_avant">Il avait déjà falsifié des traces avant le meurtre</option></select></div></section>`:'';
 const fourteenReconstruction=STATE.sync?.room?.scenario_id==='014'&&['enqueteur','analyste'].includes(role)?`<section class="action-section"><h3>SOUS SECRET · DOSSIER 014</h3><p class="choice-helper">Onze informateurs et leurs familles ont été exposés. Reconstitue séparément l'origine de l'accès, le mode de transmission et la conduite du service de sécurité. Une fuite volontaire n'est pas la seule possibilité.</p>
<div class="field"><label for="igr014Source">Comment les données ont-elles été initialement compromises ?</label><select id="igr014Source"><option value="">Sélectionner…</option><option value="export_irregulier">Une extraction non autorisée a ouvert la chaîne</option><option value="procedure_urgence_incomplete">Une procédure urgente de protection incomplète a exposé les sources</option><option value="acces_autorise_detourne">Un accès pourtant autorisé a été détourné de son mandat</option></select></div>
<div class="field"><label for="igr014Transmission">Qu'est-il advenu des identités des onze informateurs ?</label><select id="igr014Transmission"><option value="">Sélectionner…</option><option value="vente_volontaire">La liste a été volontairement vendue</option><option value="canal_secours_non_verifie">Elle a été remise à un canal de secours non vérifié, sans vente démontrée</option><option value="mandat_emploie_hors_mission">Le détenteur d'un mandat a communiqué les données hors de sa mission</option></select></div>
<div class="field"><label for="igr014Concealment">Quel acte de dissimulation les pièces établissent-elles ?</label><select id="igr014Concealment"><option value="">Sélectionner…</option><option value="logs_retouches_pour_cacher_faille">Des journaux ont été retouchés pour dissimuler une autre faille</option><option value="alerte_ignoree">Une alerte a été écartée malgré le risque connu</option><option value="fausse_piste_intrusion">Une fausse piste d'intrusion extérieure a été entretenue</option></select></div></section>`:'';
 const fifteenReconstruction=STATE.sync?.room?.scenario_id==='015'&&['enqueteur','analyste'].includes(role)?`<section class="action-section"><h3>AVANT LA MORT · DOSSIER 015</h3><p class="choice-helper">Un patient meurt alors qu’ÉLIGIBLES continue malgré les alertes. Distingue la décision institutionnelle, celui qui a réellement maintenu la prise en charge, puis les modifications du dossier. Une signature ne dit pas toujours qui a ordonné.</p>
<div class="field"><label for="igr015Authority">Quelle décision a été prise par la direction ?</label><select id="igr015Authority"><option value="">Sélectionner…</option><option value="direction_refuse_suspension">Elle a refusé une suspension malgré l'alerte</option><option value="direction_autorise_arret">Elle avait autorisé la suspension</option><option value="direction_absente_blocage_admin">Elle avait accepté une réévaluation, sans en contrôler l'exécution</option></select></div>
<div class="field"><label for="igr015Continuation">Pourquoi ÉLIGIBLES s'est-il poursuivi ?</label><select id="igr015Continuation"><option value="">Sélectionner…</option><option value="ordre_de_poursuite_impose">La direction a imposé de poursuivre</option><option value="clinicien_poursuit_malgre_arret">Le clinicien a maintenu le protocole malgré l'arrêt autorisé</option><option value="sortie_bloquee_administrativement">La sortie a été bloquée dans le circuit administratif</option></select></div>
<div class="field"><label for="igr015Records">Qu'établissent les modifications du dossier ?</label><select id="igr015Records"><option value="">Sélectionner…</option><option value="alertes_attenuees_apres_deces">Les alertes ont été minimisées après le décès</option><option value="compromis_clinique_masque">La contradiction entre arrêt et poursuite a été masquée</option><option value="delai_sortie_efface">Le retard à la sortie a été effacé ou justifié artificiellement</option></select></div></section>`:'';
 const sixteenReconstruction=STATE.sync?.room?.scenario_id==='016'&&['enqueteur','analyste'].includes(role)?`<section class="action-section igr016-reconstruction"><h3>LE DERNIER ÉTAGE · RECONSTITUTION</h3><p class="choice-helper">La vidéo n'explique pas la mort. Retrouve ce qui est établi hors caméra, ce qui a causé le décès et la connaissance de chacun. Trois réponses indépendantes, aucune accusation automatique.</p>
<div class="field"><label for="igr016After">Que s'est-il passé après la coupure ?</label><select id="igr016After"><option value="">Sélectionner…</option><option value="executant_reste_seul">L'exécutant est resté seul</option><option value="organisateur_revient_clandestinement">L'organisateur est revenu en secret</option><option value="executant_n_appelle_pas_les_secours">L'exécutant n'a pas appelé les secours</option></select></div>
<div class="field"><label for="igr016Death">Quelle cause est établie pour le décès ?</label><select id="igr016Death"><option value="">Sélectionner…</option><option value="executant_homicide_volontaire">Un acte homicide volontaire de l'exécutant</option><option value="organisateur_homicide_volontaire">Un acte homicide volontaire de l'organisateur</option><option value="deces_violences_sedation_sans_geste_distinct">Le cumul de la sédation et des violences, sans nouveau geste homicide distinct</option></select></div>
<div class="field"><label for="igr016Warning">Que savait l'intermédiaire ?</label><select id="igr016Warning"><option value="">Sélectionner…</option><option value="intermediaire_message_trop_tard">Sa demande d'arrêt est arrivée trop tard</option><option value="intermediaire_ignore_retour">Il ignorait le retour de l'organisateur</option><option value="intermediaire_a_ete_induit_en_erreur">Il avait été trompé sur les risques</option></select></div></section>`:'';
 const seventeenReconstruction=STATE.sync?.room?.scenario_id==='017'&&['enqueteur','analyste'].includes(role)?`<section class="action-section"><h3>LE PRIX DU SILENCE · RECONSTITUTION</h3><p class="choice-helper">Reconstitue le geste initial, la décision déterminante et l'heure d'intervention de l'intermédiaire. L'existence de menaces ne démontre pas une complicité du survivant.</p>
<div class="field"><label for="igr017Act">Que prouve la violence initiale ?</label><select id="igr017Act"><option value="">Choisir…</option><option value="force_de_garde_declenche_mort">Le geste du gardien déclenche la détresse mortelle</option><option value="force_grave_non_decisive">La violence est grave mais ne suffit pas à expliquer seule le décès</option></select></div>
<div class="field"><label for="igr017Decision">Quelle décision a été déterminante ?</label><select id="igr017Decision"><option value="">Choisir…</option><option value="gardien_declenche_la_detresse">La contrainte maintenue par le gardien</option><option value="organisateur_refuse_secours">Le refus de sortie ou de secours par l'organisateur</option><option value="financier_change_conditions">Une condition supplémentaire imposée par le financier</option></select></div>
<div class="field"><label for="igr017Cover">Quand le financier est-il intervenu ?</label><select id="igr017Cover"><option value="">Choisir…</option><option value="financier_post_deces">Après le décès, pour obtenir le silence</option><option value="financier_avant_deces">Avant le décès, pour faire prolonger la détention</option></select></div></section>`:'';
 const eighteenReconstruction=STATE.sync?.room?.scenario_id==='018'&&['enqueteur','analyste'].includes(role)?`<section class="action-section"><h3>LES ASSIETTES VIDES · VERDICT</h3><p class="choice-helper">Le symbole peut avoir été dressé par le meurtrier ou par une autre personne. Vérifie chaque décision avec les pièces et les horaires.</p>
<div class="field"><label for="igr018Killer">Qui a tué l'ancien directeur ?</label><select id="igr018Killer"><option value="">Choisir…</option><option value="resident_1">Le premier ancien résident</option><option value="resident_2">Le deuxième ancien résident</option></select></div>
<div class="field"><label for="igr018Tableau">Qui a installé les neuf assiettes ?</label><select id="igr018Tableau"><option value="">Choisir…</option><option value="resident_1">Le premier ancien résident</option><option value="resident_2">Le deuxième ancien résident</option></select></div>
<div class="field"><label for="igr018Plan">Que prouvent les contacts précédents ?</label><select id="igr018Plan"><option value="">Choisir…</option><option value="isolated_confrontation">Une confrontation isolée, sans projet commun vérifié</option><option value="joint_intimidation">Une intimidation préparée ensemble, mais sans ordre de tuer</option></select></div></section>`:'';
 const nineteenReconstruction=STATE.sync?.room?.scenario_id==='019'&&['enqueteur','analyste'].includes(role)?`<section class="action-section"><h3>LE GRAND BAL · RECONSTITUTION</h3><p class="choice-helper">Détermine l'origine de la décision de tuer, ce que savait le relais institutionnel et la chronologie des archives.</p>
<div class="field"><label for="igr019Mandate">Qui a décidé de faire tuer le lanceur d'alerte ?</label><select id="igr019Mandate"><option value="">Choisir…</option><option value="pressure_only">Le chef de sécurité décide seul, après une commande de pression</option><option value="explicit_kill_order_influencer">La figure d'influence donne un ordre meurtrier explicite</option><option value="secret_kill_order_institutional">Le relais institutionnel donne secrètement l'ordre</option></select></div>
<div class="field"><label for="igr019Knowledge">Que savait le relais institutionnel avant la mort ?</label><select id="igr019Knowledge"><option value="">Choisir…</option><option value="institutional_after_death">Il apprend le meurtre après les faits</option><option value="institutional_prior_partial">Il connaît un danger grave sans avoir donné l'ordre</option><option value="influencer_unaware_other_channel">Il commande via un autre canal, à l'insu de la figure d'influence</option></select></div>
<div class="field"><label for="igr019Cover">Comment les archives sont-elles manipulées ?</label><select id="igr019Cover"><option value="">Choisir…</option><option value="records_erased_after_death">Des dossiers sont effacés après la mort</option><option value="institutional_false_discovery">L'effacement est préparé et une découverte est feinte</option></select></div></section>`:'';
 const twentyReconstruction=STATE.sync?.room?.scenario_id==='020'&&['enqueteur','analyste'].includes(role)?`<section class="action-section"><h3>L’APOTHÉOSE · VERDICT</h3><p class="choice-helper">Reconstitue les quatre facteurs, indépendamment des responsabilités individuelles.</p><div class="field"><label for="igr020Ignition">Origine du feu</label><select id="igr020Ignition"><option value="">Choisir…</option><option value="intentional_diversion">Diversion volontaire</option><option value="accidental_equipment_fault">Défaillance accidentelle</option></select></div>
<div class="field"><label for="igr020Exits">Issues</label><select id="igr020Exits"><option value="">Choisir…</option><option value="known_restrictions">Restrictions connues maintenues</option><option value="final_check_waived">Dernier contrôle abandonné</option><option value="restrictions_kept_after_warnings">Restrictions maintenues malgré les alertes</option></select></div>
<div class="field"><label for="igr020Maintenance">Maintenance</label><select id="igr020Maintenance"><option value="">Choisir…</option><option value="known_repairs_deferred">Réparations différées</option><option value="overoptimistic_signoff">Rapport de conformité trompeur</option></select></div>
<div class="field"><label for="igr020Evacuation">Évacuation</label><select id="igr020Evacuation"><option value="">Choisir…</option><option value="risk_underestimated">Danger initial sous-estimé</option><option value="false_assurance_delay">Risque minimisé par un rapport rassurant</option><option value="deliberate_delay">Évacuation sciemment retardée</option></select></div></section>`:'';
 const extra=role==='juge'?`<div class="field"><label for="finalConsequence">Conséquence judiciaire</label><select id="finalConsequence"><option>Responsabilité non établie</option><option>Responsabilité partielle</option><option>Responsabilité majeure</option><option>Responsabilité centrale</option></select></div>`:'';
 return `<div class="final-form"><h3>${h(role==='enqueteur'?'Verdict final':role==='analyste'?'Lecture finale':role==='procureur'?'Position finale du Procureur':'Jugement final')}</h3>${STATE.sync?.room?.scenario_id==='001'&&['enqueteur','analyste'].includes(role)?`<p class="choice-helper">Rapport d’enquête · Responsabilités 60 % (20 % par suspect) ; reconstitution 40 % (10 % par question). La responsabilité décrit la participation aux faits ; l’intention qualifie le geste ayant causé la blessure.</p>`:''}${levelsForm('final')}${twoReconstruction}${threeReconstruction}${fourReconstruction}${fiveReconstruction}${sixReconstruction}${sevenReconstruction}${eightReconstruction}${nineReconstruction}${tenReconstruction}${elevenReconstruction}${twelveReconstruction}${thirteenReconstruction}${fourteenReconstruction}${fifteenReconstruction}${sixteenReconstruction}${seventeenReconstruction}${eighteenReconstruction}${nineteenReconstruction}${twentyReconstruction}${['enqueteur','analyste'].includes(role)&&STATE.sync?.room?.scenario_id==='001'?`<section class="action-section"><h3>Reconstituer les faits · Dossier 001</h3><p class="choice-helper">Évalue d’abord les responsabilités, puis reconstitue les faits à partir des pièces. La qualification du geste est distincte de l’intention de tuer. Barème du rapport : responsabilités 60 %, reconstitution 40 % (dont 10 % pour l’intention).</p><div class="field"><label for="igr001Moment">Quand la blessure mortelle survient-elle ?</label><select id="igr001Moment"><option value="">Choisir…</option><option value="first">Lors de la première dispute</option><option value="second">Lors de la seconde confrontation</option></select></div><div class="field"><label for="igr001Gesture">Quel geste a causé la blessure ?</label><select id="igr001Gesture"><option value="">Choisir…</option><option value="s1_intentional">Le premier visiteur est à l’origine du coup</option><option value="s2_intentional">Le visiteur arrivé ensuite est à l’origine du coup</option><option value="s3_accident">L’intervention du client provoque le mouvement de la lame</option></select></div><div class="field"><label for="igr001Reframe">Quelle circonstance explique les fausses apparences ?</label><select id="igr001Reframe"><option value="">Choisir…</option><option value="recording">L'enregistrement précipite l'affrontement final</option><option value="evidence_moved">Un indice tardif brouille le moment réel du coup</option><option value="third_intervention">Un tiers intervient et modifie le mouvement de la lame</option></select></div><div class="field"><label for="igr001Intent">Le geste ayant directement provoqué la blessure mortelle était-il volontaire ?</label><select id="igr001Intent"><option value="">Choisir…</option><option value="voluntary_act">Geste volontaire</option><option value="involuntary_act">Geste involontaire</option><option value="undetermined">Intention impossible à déterminer</option></select><details class="choice-helper igr001-intent-help"><summary>Comment qualifier le geste ?</summary><p><strong>Volontaire :</strong> le mouvement qui a causé la blessure était voulu, même si sa conséquence mortelle ne l’était pas forcément.</p><p><strong>Involontaire :</strong> le mouvement qui a causé la blessure n’était pas voulu.</p><p><strong>Impossible à déterminer :</strong> les pièces ne permettent pas de trancher ; ce n’est pas une réponse à choisir simplement par hésitation.</p><p>Fonde ta conclusion sur les faits établis. Le niveau 2 de responsabilité n’implique aucune de ces trois réponses à lui seul.</p></details></div></section>`:''}${extra}<div class="field"><label for="finalText">Note finale courte</label><textarea id="finalText" maxlength="300"></textarea></div><button class="btn danger block" onclick="lockFinal()">Verrouiller définitivement</button></div>`;
}
async function lockFinal(){
 const role=STATE.sync.player.public_role;let payload={note:(byId('finalText')?.value||'').trim()};if(role!=='journaliste'&&STATE.sync?.room?.scenario_id!=='029')payload.levels=collectLevels('final');if(role==='juge')payload.consequence=byId('finalConsequence')?.value||'';
 if(STATE.sync?.room?.scenario_id==='001'&&['enqueteur','analyste'].includes(role)){
  const moment=byId('igr001Moment')?.value||'',gesture=byId('igr001Gesture')?.value||'',reframe=byId('igr001Reframe')?.value||'',intent=byId('igr001Intent')?.value||'';
  if(!moment||!gesture||!reframe||!['voluntary_act','involuntary_act','undetermined'].includes(intent)){toast('Complète le rapport, y compris la qualification de l’intention.');return;}
  payload.reconstruction_001={moment,gesture,reframe,intent};
 }
 if(STATE.sync?.room?.scenario_id==='002'&&['enqueteur','analyste'].includes(role)){
  const central=byId('igr002Central')?.value||'',evidence=byId('igr002Evidence')?.value||'',boundary=byId('igr002Boundary')?.value||'';
  if(!central||!evidence||!boundary){toast('Reconstitue les faits avant de verrouiller le verdict.');return;}
  payload.reconstruction_002={central,evidence,boundary};
 }
 if(STATE.sync?.room?.scenario_id==='003'&&['enqueteur','analyste'].includes(role)){
  const central=byId('igr003Central')?.value||'',knowledge=byId('igr003Knowledge')?.value||'',reversal=byId('igr003Reversal')?.value||'';
  if(!central||!knowledge||!reversal){toast('Complète la reconstitution du protocole avant de verrouiller.');return;}
  // V232 keeps historical answer IDs for pinned sessions and server-side grading.
  // The visible selections use accurate meanings; only the outgoing transport IDs are legacy.
  const centralForServer={signed_false_document:'validation_erroneous'}[central]||central;
  const reversalForServer={
   deliberate_false_dossier:'error_not_proven_fraud',
   warning_hidden_before_departure:'postincident_rewrite'
  }[reversal]||reversal;
  payload.reconstruction_003={central:centralForServer,knowledge,reversal:reversalForServer};
 }
 if(STATE.sync?.room?.scenario_id==='004'&&['enqueteur','analyste'].includes(role)){
  const signal=byId('igr004Signal')?.value||'',decision=byId('igr004Decision')?.value||'',limit=byId('igr004Limit')?.value||'';
  if(!signal||!decision||!limit){toast('Complète la chronologie avant de verrouiller le verdict.');return;}
  payload.reconstruction_004={signal,decision,limit};
 }
 if(STATE.sync?.room?.scenario_id==='005'&&['enqueteur','analyste'].includes(role)){
  const author=byId('igr005Author')?.value||'',mask=byId('igr005Mask')?.value||'',proof=byId('igr005Proof')?.value||'';
  if(!author||!mask||!proof){toast('Reconstitue le geste, le masque et la preuve avant le verdict.');return;}
  payload.reconstruction_005={author,mask,proof};
 }
 if(STATE.sync?.room?.scenario_id==='006'&&['enqueteur','analyste'].includes(role)){
  const fall=byId('igr006Fall')?.value||'',response=byId('igr006Response')?.value||'',lie=byId('igr006Lie')?.value||'';
  if(!fall||!response||!lie){toast('Reconstitue la chute, la réaction et le pacte avant le verdict.');return;}
  payload.reconstruction_006={fall,response,lie};
 }
 if(STATE.sync?.room?.scenario_id==='007'&&['enqueteur','analyste'].includes(role)){
  const cause=byId('igr007Cause')?.value||'',actor=byId('igr007Actor')?.value||'',decoy=byId('igr007Decoy')?.value||'';
  if(!cause||!actor||!decoy){toast('Reconstitue les trois actes avant de verrouiller le verdict.');return;}
  payload.reconstruction_007={cause,actor,decoy};
 }
 if(STATE.sync?.room?.scenario_id==='008'&&['enqueteur','analyste'].includes(role)){
  const incident=byId('igr008Incident')?.value||'',responsible=byId('igr008Responsible')?.value||'',decoy=byId('igr008Decoy')?.value||'';
  if(!incident||!responsible||!decoy){toast('Reconstitue les trois éléments avant de verrouiller le verdict.');return;}
  payload.reconstruction_008={incident,responsible,decoy};
 }
 if(STATE.sync?.room?.scenario_id==='009'&&['enqueteur','analyste'].includes(role)){
  const withdrawal=byId('igr009Withdrawal')?.value||'',decision=byId('igr009Decision')?.value||'',decoy=byId('igr009Decoy')?.value||'';
  if(!withdrawal||!decision||!decoy){toast('Reconstitue les trois éléments avant de verrouiller le verdict.');return;}
  payload.reconstruction_009={withdrawal,decision,decoy};
 }
 if(STATE.sync?.room?.scenario_id==='010'&&['enqueteur','analyste'].includes(role)){
  const origin=byId('igr010Origin')?.value||'',door=byId('igr010Door')?.value||'',signal=byId('igr010Signal')?.value||'';
  if(!origin||!door||!signal){toast('Reconstitue les trois éléments avant de verrouiller le verdict.');return;}
  payload.reconstruction_010={origin,door,signal};
 }
 if(STATE.sync?.room?.scenario_id==='011'&&['enqueteur','analyste'].includes(role)){
  const order=byId('igr011Order')?.value||'',field=byId('igr011Field')?.value||'',halt=byId('igr011Halt')?.value||'';
  if(!order||!field||!halt){toast('Reconstitue les trois décisions avant de verrouiller le verdict.');return;}
  payload.reconstruction_011={order,field,halt};
 }
 if(STATE.sync?.room?.scenario_id==='012'&&['enqueteur','analyste'].includes(role)){
  const directive=byId('igr012Directive')?.value||'',violence=byId('igr012Violence')?.value||'',reaction=byId('igr012Reaction')?.value||'';
  if(!directive||!violence||!reaction){toast('Reconstitue les trois décisions avant de verrouiller le verdict.');return;}
  payload.reconstruction_012={directive,violence,reaction};
 }
 if(STATE.sync?.room?.scenario_id==='013'&&['enqueteur','analyste'].includes(role)){
  const knowledge=byId('igr013Knowledge')?.value||'',command=byId('igr013Command')?.value||'',security=byId('igr013Security')?.value||'';
  if(!knowledge||!command||!security){toast('Reconstitue les trois maillons avant de verrouiller le verdict.');return;}
  payload.reconstruction_013={knowledge,command,security};
 }
 if(STATE.sync?.room?.scenario_id==='014'&&['enqueteur','analyste'].includes(role)){
  const source=byId('igr014Source')?.value||'',transmission=byId('igr014Transmission')?.value||'',concealment=byId('igr014Concealment')?.value||'';
  if(!source||!transmission||!concealment){toast('Reconstitue les trois responsabilités avant de verrouiller le verdict.');return;}
  payload.reconstruction_014={source,transmission,concealment};
 }
 if(STATE.sync?.room?.scenario_id==='015'&&['enqueteur','analyste'].includes(role)){
  const authority=byId('igr015Authority')?.value||'',continuation=byId('igr015Continuation')?.value||'',records=byId('igr015Records')?.value||'';
  if(!authority||!continuation||!records){toast('Reconstitue les trois décisions avant de verrouiller le verdict.');return;}
  payload.reconstruction_015={authority,continuation,records};
 }
 if(STATE.sync?.room?.scenario_id==='016'&&['enqueteur','analyste'].includes(role)){
  const after_video=byId('igr016After')?.value||'',death=byId('igr016Death')?.value||'',warning=byId('igr016Warning')?.value||'';
  if(!after_video||!death||!warning){toast('Reconstitue les trois axes avant de verrouiller le verdict.');return;}
  payload.reconstruction_016={after_video,death,warning};
 }
 if(STATE.sync?.room?.scenario_id==='017'&&['enqueteur','analyste'].includes(role)){
  const act=byId('igr017Act')?.value||'',decision=byId('igr017Decision')?.value||'',cover=byId('igr017Cover')?.value||'';
  if(!act||!decision||!cover){toast('Reconstitue les trois axes avant de verrouiller le verdict.');return;}
  payload.reconstruction_017={act,decision,cover};
 }
 if(STATE.sync?.room?.scenario_id==='018'&&['enqueteur','analyste'].includes(role)){
  const killer=byId('igr018Killer')?.value||'',tableau=byId('igr018Tableau')?.value||'',prior_plan=byId('igr018Plan')?.value||'';
  if(!killer||!tableau||!prior_plan){toast('Complète les trois axes du verdict.');return;}
  payload.reconstruction_018={killer,tableau,prior_plan};
 }
 if(STATE.sync?.room?.scenario_id==='019'&&['enqueteur','analyste'].includes(role)){
  const mandate=byId('igr019Mandate')?.value||'',knowledge=byId('igr019Knowledge')?.value||'',cover=byId('igr019Cover')?.value||'';
  if(!mandate||!knowledge||!cover){toast('Reconstitue les trois axes avant de verrouiller le verdict.');return;}
  payload.reconstruction_019={mandate,knowledge,cover};
 }
 if(STATE.sync?.room?.scenario_id==='020'&&['enqueteur','analyste'].includes(role)){
 const ignition=byId('igr020Ignition')?.value||'',exits=byId('igr020Exits')?.value||'',maintenance=byId('igr020Maintenance')?.value||'',evacuation=byId('igr020Evacuation')?.value||'';
 if(!ignition||!exits||!maintenance||!evacuation){toast('Réponds aux quatre axes.');return;}
 payload.reconstruction_020={ignition,exits,maintenance,evacuation};
 }
 try{await rpc('igr_v4_lock_final',{p_code:STATE.room,p_player_token:STATE.token,p_payload:payload});await syncNow(true)}catch(e){console.error(e);toast('Choix déjà verrouillé ou phase terminée.')}}
function responsibilityLabel(level){return ({0:'Aucune responsabilité',1:'Responsabilité secondaire',2:'Responsabilité principale'})[+level]||'Non renseignée'}
function revealSummaryWithNames(summary,responsibilities=[]){
 let out=String(summary||'');
 responsibilities.slice(0,26).forEach((x,i)=>{const letter=String.fromCharCode(65+i);out=out.replace(new RegExp(`\\b${letter}\\b`,'g'),x.pseudo||letter)});
 return out;
}
function responsibilityDelta(truth,guess){
 if(+guess<0)return 'Non évaluée';
 const d=+guess-(+truth);if(d===0)return 'Évaluation exacte';
 return d>0?`Surestimée de ${d} niveau${d>1?'x':''}`:`Sous-estimée de ${Math.abs(d)} niveau${Math.abs(d)>1?'x':''}`;
}

function continuationWinner(cont,id){return (cont?.winners||[]).find(x=>String(x.id)===String(id))}
function myContinuationAction(type){
 return [...(STATE.sync?.my_actions||[])].reverse().find(x=>x.action_type===type)?.payload||null;
}
function compatibleNextScenarios(d){
 const count=(d.players||[]).length;
 const release007=typeof IGR007_PUBLISH!=='undefined'&&IGR007_PUBLISH.enabled;
 const all=SCENARIOS.filter(s=>(s.id!=='007'||release007)&&count>=s.min&&count<=s.max);
 const alternatives=all.filter(s=>s.id!==d.room.scenario_id);
 return alternatives.length?alternatives:all;
}
function renderContinuationPanel(){
 const d=STATE.sync,cont=d?.room?.state?.continuation;
 if(!cont||d.room.status!=='finished')return'';
 const winners=cont.winners||[],winner=continuationWinner(cont,d.player.id),isWinner=!!winner,wc=Number(cont.winner_count||winners.length||0);
 if(!wc)return `<div class="continuation-panel"><div class="kicker">SUITE DE LA CELLULE</div><h3>Aucun camp vainqueur</h3><p>Aucun privilège de continuité n’est attribué pour cette partie.</p></div>`;
 const winnerRows=winners.slice().sort((a,b)=>(b.score||0)-(a.score||0)).map(w=>`<div class="winner-score-row ${String(w.id)===String(d.player.id)?'me':''}"><span>${h(w.pseudo)} · ${h(publicRoleLabel(w.role))}</span><b>${h(w.score)}/100</b></div>`).join('');
 if(cont.stage==='scenario_vote'){
   const myVote=myContinuationAction('next_scenario_vote')?.scenario_id||'';
   const choices=compatibleNextScenarios(d);
   const voteBox=isWinner?`<div class="continuation-action"><label for="nextScenarioVote">Ton vote pour le prochain dossier</label><select id="nextScenarioVote">${choices.map(s=>`<option value="${s.id}" ${myVote===s.id?'selected':''}>${h(s.id)} · ${h(s.title)} · ${h(playerCountLabel(s))}</option>`).join('')}</select><button class="btn primary block" onclick="voteNextScenario()">${myVote?'Modifier mon vote':'Voter'}</button></div>`:`<p class="continuation-wait">Le camp vainqueur vote actuellement pour le prochain scénario.</p>`;
   const host=STATE.hostToken?`<button class="btn block" ${Number(cont.votes_received||0)<wc?'disabled':''} onclick="finalizeNextScenario()">Valider le vote · ${Number(cont.votes_received||0)}/${wc}</button>`:'';
   return `<div class="continuation-panel"><div class="kicker">CAMP VAINQUEUR</div><h3>Vote du prochain scénario</h3><p>Chaque vainqueur possède exactement une voix. En cas d’égalité entre scénarios, le serveur effectue un tirage aléatoire.</p><div class="winner-score-list">${winnerRows}</div>${voteBox}${host}</div>`;
 }
 if(cont.stage==='role_claims'){
   const selected=scenario(cont.selected_scenario),myClaim=myContinuationAction('next_role_claim')?.role||'';
   const count=(d.players||[]).length,roles=roleChoiceSummary(selected,count,[]);
   const claimBox=isWinner?`<div class="continuation-action"><div class="next-scenario-picked"><span>Scénario choisi</span><b>${h(selected.id)} · ${h(selected.title)}</b></div><p>Choisis maintenant le rôle que tu veux réserver pour la prochaine partie.</p><div class="role-choice-grid compact">${roles.map(x=>`<button class="role-choice-card ${myClaim===x.id?'selected':''}" onclick="claimNextRole('${x.id}')"><span><b>${h(x.info.label)}</b><small>${h(x.info.body)}</small></span><em>${myClaim===x.id?'TON CHOIX':x.cap>1?`${x.cap} PLACES`:'1 PLACE'}</em></button>`).join('')}</div></div>`:`<div class="next-scenario-picked"><span>Scénario choisi</span><b>${h(selected.id)} · ${h(selected.title)}</b></div><p class="continuation-wait">Les vainqueurs choisissent leurs rôles prioritaires.</p>`;
   const host=STATE.hostToken?`<button class="btn block" ${Number(cont.claims_received||0)<wc?'disabled':''} onclick="finalizeNextRoles()">Attribuer les priorités · ${Number(cont.claims_received||0)}/${wc}</button>`:'';
   return `<div class="continuation-panel"><div class="kicker">PRIORITÉ DES VAINQUEURS</div><h3>Choix du prochain rôle</h3><p>Si plusieurs vainqueurs demandent le même rôle et qu’il n’y a pas assez de places, la plus grande <b>force de victoire</b> obtient la priorité. À score parfaitement égal, le serveur tire au sort.</p><div class="winner-score-list">${winnerRows}</div>${claimBox}${host}</div>`;
 }
 return'';
}
async function voteNextScenario(){
 const id=byId('nextScenarioVote')?.value;if(!id)return;
 try{await rpc('igr_v4_vote_next_scenario',{p_code:STATE.room,p_player_token:STATE.token,p_scenario_id:id});await syncNow(true);toast('Vote enregistré.')}catch(e){console.error(e);toast('Vote impossible pour ce scénario.')}
}
async function finalizeNextScenario(){
 try{await rpc('igr_v4_finalize_next_scenario',{p_code:STATE.room,p_host_token:STATE.hostToken});await syncNow(true)}catch(e){console.error(e);toast('Tous les vainqueurs doivent voter avant la validation.')}
}
async function claimNextRole(role){
 try{await rpc('igr_v4_claim_next_role',{p_code:STATE.room,p_player_token:STATE.token,p_role:role});await syncNow(true);toast(`Rôle demandé : ${publicRoleLabel(role)}`)}catch(e){console.error(e);toast('Ce rôle n’existe pas dans le prochain scénario.')}
}
async function finalizeNextRoles(){
 try{await rpc('igr_v4_finalize_next_roles',{p_code:STATE.room,p_host_token:STATE.hostToken});await syncNow(true)}catch(e){console.error(e);toast('Tous les vainqueurs doivent choisir leur rôle avant l’attribution.')}
}
function renderReveal(){
 const e=latestEvent('reveal'),p=e?.payload||{};if(!p.summary&&STATE.sync.scenario.truth)p.summary=STATE.sync.scenario.truth.summary;
 const responsibilities=p.responsibilities||[],summary=revealSummaryWithNames(p.summary||'Révélation en cours…',responsibilities),cont=STATE.sync?.room?.state?.continuation;
 const strength=id=>(cont?.winners||[]).find(w=>String(w.id)===String(id))?.score;
 const currentCase=STATE.sync?.room?.scenario_id;
 const recName=currentCase==='020'?'reconstruction_020':currentCase==='019'?'reconstruction_019':currentCase==='018'?'reconstruction_018':currentCase==='017'?'reconstruction_017':currentCase==='016'?'reconstruction_016':currentCase==='015'?'reconstruction_015':currentCase==='014'?'reconstruction_014':currentCase==='013'?'reconstruction_013':currentCase==='012'?'reconstruction_012':currentCase==='011'?'reconstruction_011':currentCase==='010'?'reconstruction_010':currentCase==='009'?'reconstruction_009':currentCase==='008'?'reconstruction_008':currentCase==='007'?'reconstruction_007':currentCase==='006'?'reconstruction_006':currentCase==='005'?'reconstruction_005':currentCase==='004'?'reconstruction_004':currentCase==='003'?'reconstruction_003':currentCase==='002'?'reconstruction_002':'reconstruction_001';
 const myReconstruction=myAction('final_lock',null)?.payload?.[recName];
 const reconstructionKey=STATE.sync?.scenario?.truth?.[recName];
 const recAxes=currentCase==='020'?['ignition','exits','maintenance','evacuation']:currentCase==='019'?['mandate','knowledge','cover']:currentCase==='018'?['killer','tableau','prior_plan']:currentCase==='017'?['act','decision','cover']:currentCase==='016'?['after_video','death','warning']:currentCase==='015'?['authority','continuation','records']:currentCase==='014'?['source','transmission','concealment']:currentCase==='013'?['knowledge','command','security']:currentCase==='012'?['directive','violence','reaction']:currentCase==='011'?['order','field','halt']:currentCase==='010'?['origin','door','signal']:currentCase==='009'?['withdrawal','decision','decoy']:currentCase==='008'?['incident','responsible','decoy']:currentCase==='007'?['cause','actor','decoy']:currentCase==='006'?['fall','response','lie']:currentCase==='005'?['author','mask','proof']:currentCase==='004'?['signal','decision','limit']:currentCase==='003'?['central','knowledge','reversal']:currentCase==='002'?['central','evidence','boundary']:(currentCase==='001'&&!['voluntary_act','involuntary_act','undetermined'].includes(myReconstruction?.intent)?['moment','gesture','reframe']:['moment','gesture','reframe','intent']);
  // Qualification of intent is a separate judicial conclusion, not an automatic consequence
 // of the 0/1/2 responsibility label. Canonical 001 truth is variant-pinned.
 const canonicalIntent=currentCase==='001'&&reconstructionKey?
   (reconstructionKey.gesture==='s3_accident'?'involuntary_act':
    ['s1_intentional','s2_intentional'].includes(reconstructionKey.gesture)?'voluntary_act':null):null;
 const recScore=myReconstruction&&reconstructionKey?recAxes.filter(k=>
   k==='intent'?Boolean(canonicalIntent)&&myReconstruction.intent===canonicalIntent:myReconstruction[k]===reconstructionKey[k]
 ).length:null;
 const intentResultLabel=canonicalIntent==='involuntary_act'?'Geste involontaire':
   canonicalIntent==='voluntary_act'?'Geste volontaire':null;
 const recExplanation=['002','003','004','005','006','007','008','009','010','011','012','013','014','015','016','017','018','019','020'].includes(currentCase)?(STATE.sync?.scenario?.truth?.cinematic?.final_line||'La chronologie permet de distinguer les actes et les connaissances.'):reconstructionKey?.explanation||'';
 const recHtml=['001','002','003','004','005','006','007','008','009','010','011','012','013','014','015','016','017','018','019','020'].includes(currentCase)&&reconstructionKey?`<section class="private-block"><h3>RECONSTITUTION DES FAITS</h3><p>${h(recExplanation)}</p>${currentCase==='001'&&intentResultLabel?`<p><b>Qualification retenue :</b> ${h(intentResultLabel)}</p>`:''}<p>${recScore===null?'Pas de reconstitution personnelle enregistrée.':`Ton raisonnement : ${recScore}/${recAxes.length} axes correctement reconstitués (${Math.round(100*recScore/recAxes.length)} %).`}</p></section>`:'';
 const pactAuditHtml=currentCase==='006'&&STATE.sync?.room?.status==='finished'&&STATE.sync?.scenario?.truth?.pact_audit_006?(()=>{
  const audit=STATE.sync.scenario.truth.pact_audit_006;
  const names={no_strike:'Aucun coup avant la chute',strike:'Un coup a précédé la chute',signs_alive:'Noé a réagi après la chute',help_refused:'Une demande d’aide a été refusée',undetermined:'Je refuse de conclure'};
  const findings={confirmed:'CONFIRMÉE PAR LES PIÈCES',contradicted:'CONTREDITE PAR LES PIÈCES',not_established:'NON ÉTABLIE PAR LE DOSSIER',unasserted:'AUCUNE AFFIRMATION CATÉGORIQUE'};
  const events=(STATE.sync?.events||[]).filter(e=>e.event_type==='statement_006').slice().sort((a,b)=>(+a.cycle||0)-(+b.cycle||0));
  const cards=events.map(e=>{
    const thesis=e.payload?.pact_thesis;
    const finding=thesis?findings[audit[thesis]]||'NON ÉVALUABLE':'DÉCLARATION LIBRE — AUCUN VERDICT AUTOMATIQUE';
    return `<div class="event"><div class="section-title"><b>CYCLE ${h(e.cycle)} · ${h(e.payload?.pseudo||'Suspect')}</b></div><p>${h(e.payload?.text||'')}</p>${thesis?`<p class="choice-helper">POSITION SCELLÉE · ${h(names[thesis]||'Non renseignée')}</p>`:''}<strong>${h(finding)}</strong></div>`;
  }).join('');
  return `<section class="private-block igr006-pact-audit"><h3>LE PACTE · CINQ ANS DE VERSIONS</h3><p class="choice-helper">Les dépositions sont confrontées aux pièces, sans interpréter automatiquement les phrases libres.</p><p><strong>${h(audit.finding||'')}</strong></p><div class="timeline">${cards||'<p>Aucune déclaration enregistrée.</p>'}</div><p class="choice-helper">${h(audit.boundary||'')}</p></section>`;
 })():'';
 const maskAuditHtml=currentCase==='005'&&STATE.sync?.room?.status==='finished'&&reconstructionKey?(()=>{
   const labels={added_after:'Ajouté après les violences',present_before:'Déjà présent avant le meurtre',moved_after:'Porté pour intimider puis déplacé',undetermined:'Thèse non affirmée'};
   const finalMask=reconstructionKey.mask,canon=labels[finalMask]||'Chronologie non déterminée';
   const beats=STATE.sync?.scenario?.truth?.cinematic?.reframes||[];
   const statements=(STATE.sync?.events||[]).filter(x=>x.event_type==='statement_005').sort((a,b)=>(+a.cycle||0)-(+b.cycle||0));
   const rows=statements.map(x=>{
     const asserted=x.payload?.mask_thesis,match=asserted&&asserted!=='undetermined';
     const finding=!asserted?'Déposition libre, sans thèse scellée':!match?'Aucune affirmation catégorique sur le masque':asserted===finalMask?'CONFIRMÉE PAR LES PIÈCES':'RÉFUTÉE PAR LA CHRONOLOGIE';
     return `<div class="event"><div class="section-title"><b>CYCLE ${h(x.cycle)} · ${h(x.payload?.pseudo||'Suspect')}</b></div><p>${h(x.payload?.text||'')}</p>${asserted?`<p class="choice-helper">THÈSE · ${h(labels[asserted]||'Non renseignée')}</p>`:''}<strong>${h(finding)}</strong></div>`;
   }).join('');
   return `<section class="private-block igr005-archive"><h3>LE MASQUE · DOSSIER DES DÉPOSITIONS</h3><p class="choice-helper">Les pièces sont désormais publiques. Les dépositions sont reproduites sans interprétation automatique de leurs phrases libres.</p><div class="timeline">${beats.map((b,i)=>`<p><b>CONSTAT ${i+1}</b> · ${h(b)}</p>`).join('')}</div><p><strong>STATUT ÉTABLI DU MASQUE : ${h(canon)}</strong></p><div class="timeline">${rows||'<p>Aucune déposition enregistrée.</p>'}</div></section>`;
 })():'';


 return `<div class="reveal-v11"><div class="kicker">RÉVÉLATION</div><h2>La vérité</h2><p class="reveal-summary">${h(summary)}</p><div class="reveal-legend"><b>Lecture des responsabilités</b><span>« Réalité » = niveau canonique du dossier. « Verdict de l’Enquêteur » = niveau attribué lors du verrouillage final.</span></div>${responsibilities.map(x=>`<div class="responsibility responsibility-clear"><div class="responsibility-name">${h(x.pseudo)}</div><div class="responsibility-grid"><span><small>RÉALITÉ CANONIQUE</small><b>${x.truth_level}/2 · ${h(responsibilityLabel(x.truth_level))}</b></span><span><small>VERDICT DE L’ENQUÊTEUR</small><b>${x.enqueteur_level<0?'Non renseigné':`${x.enqueteur_level}/2 · ${h(responsibilityLabel(x.enqueteur_level))}`}</b></span></div><div class="responsibility-delta ${+x.truth_level===+x.enqueteur_level?'exact':''}">${h(responsibilityDelta(x.truth_level,x.enqueteur_level))}</div></div>`).join('')}${p.accuracy?`<div class="accuracy accuracy-clear"><span>Responsabilités évaluées exactement</span><b>${p.accuracy.exact} sur ${p.accuracy.total}</b><small>Une réponse est exacte uniquement si le niveau 0–2 correspond exactement au niveau canonique.</small></div>`:''}${currentCase==='001'&&p.camp_investigation?.report_score_total?`<div class="accuracy accuracy-clear"><span>POURCENTAGE DE RÉUSSITE DU RAPPORT FINAL</span><b>${h(p.camp_investigation.report_score_percent)} %</b><small>${h(p.camp_investigation.report_score_exact)} réponse(s) exacte(s) sur ${h(p.camp_investigation.report_score_total)}. ${h(p.camp_investigation.responsibility_score_percent??0)} % de réponses exactes en responsabilité ; ${h(p.camp_investigation.reconstruction_score_percent??0)} % sur la reconstitution. Responsabilités : 60 % (20 % par suspect). Reconstitution : 40 % (10 % pour chaque axe, dont l’intention). Ce pourcentage mesure la justesse du rapport, pas les conditions de victoire individuelles.</small></div>`:''}<div class="result-list">${(p.results||[]).map(x=>{const s=strength(x.player_id);return `<div class="result-line ${x.success?'winner':'loser'}"><b>${h(x.pseudo)} · ${h(publicRoleLabel(x.role))}</b><strong>${x.success?'VICTOIRE':'DÉFAITE'}</strong><span>${h(x.text)}</span>${x.success&&s!=null?`<small class="victory-strength">Force de victoire · ${h(s)}/100</small>`:''}</div>`}).join('')}</div>${recHtml}${maskAuditHtml}${pactAuditHtml}${renderContinuationPanel()}<button class="btn block" onclick="leaveRoom()">Quitter la cellule</button></div>`;
}

function publicRoleLabel(r){return r==='maitre'?(cartelLawyerLabel()||'Avocat / Maître'):roleInfo(r).label||r}
function renderChannelTab(){
 const d=STATE.sync,role=d.player.public_role,canInv=canInvestigationChannel(role),enq=d.players.find(p=>p.public_role==='enqueteur'),targets=role==='journaliste'?d.players.filter(p=>p.id!==d.player.id):role==='enqueteur'?d.players.filter(p=>p.id!==d.player.id):(enq?[enq]:[]);
 return `<div class="channel-v11">${canInv?`<div class="channel-box"><div class="section-title"><h2>Canal Enquête 🔒</h2><span>200 caractères</span></div><div class="message-list">${renderMessages('investigation')}</div><div class="message-compose"><input id="invMsg" maxlength="200" placeholder="Observation courte"><button onclick="sendMessage('investigation')">Envoyer</button></div></div>`:''}<div class="channel-box"><div class="section-title"><h2>Messages privés</h2><span>${role==='journaliste'?'libres':'centrés sur l’Enquêteur'}</span></div>${targets.length?`<div class="field"><label for="privateTarget">Destinataire</label><select id="privateTarget">${targets.map(p=>`<option value="${p.id}">${h(p.pseudo)} · ${h(publicRoleLabel(p.public_role))}</option>`).join('')}</select></div><div class="message-list">${renderMessages('private')}</div><div class="message-compose"><input id="privateMsg" maxlength="200" placeholder="Message privé"><button onclick="sendMessage('private')">Envoyer</button></div>`:`<p>Aucun destinataire disponible.</p>`}</div></div>`;
}
function renderMessages(channel){return (STATE.sync.events||[]).filter(e=>e.event_type==='message'&&e.payload?.channel===channel).slice(-12).map(e=>`<div class="msg"><b>${h(e.payload?.author||'')}</b>${e.payload?.to?` → ${h(e.payload.to)}`:''}<span>${h(e.payload?.text||'')}</span></div>`).join('')||'<div class="empty-state">Aucun message.</div>'}
async function sendMessage(channel){const input=byId(channel==='investigation'?'invMsg':'privateMsg'),text=(input?.value||'').trim();if(!text)return;const target=channel==='private'?byId('privateTarget')?.value:null;try{await rpc('igr_v4_send_message',{p_code:STATE.room,p_player_token:STATE.token,p_channel:channel,p_target:target||null,p_text:text});if(input)input.value='';await syncNow(true)}catch(e){console.error(e);const m=String(e?.message||'');toast(m.includes('blocked')?'Message bloqué par un réglage de sécurité.':m.includes('content')||m.includes('links')||m.includes('spam')?'Message refusé par le filtre de sécurité.':'Message non autorisé dans cette phase ou pour ce rôle.')}}
function renderTimelineTab(){const role=STATE.sync?.player?.public_role||STATE.role;const events=(STATE.sync.events||[]).filter(e=>e.event_type!=='trame'||canInvestigationChannel(role));return `<div class="timeline timeline-v11">${events.slice().reverse().map(e=>`<div class="event ${e.event_type==='trame'?'trame':e.event_type==='breaking_news'?'news':e.event_type==='reveal'?'urgent':''}"><div class="event-head">${h(e.payload?.title||e.event_type)} · ${clock(e.created_at)}</div><div class="event-body">${h(e.payload?.text||e.payload?.summary||'')}</div></div>`).join('')||'<div class="empty-state">Le fil se remplira pendant la partie.</div>'}</div>`}
function clock(iso){try{return new Date(iso).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}catch{return'--:--'}}

/* --- WebRTC: direct live stream, no recording, no replay --- */
function videoState(){return STATE.sync?.room?.state||{}}
async function ensureLocalVideo(){
 if(VIDEO.localStream?.getVideoTracks().some(t=>t.readyState==='live'))return VIDEO.localStream;
 if(!navigator.mediaDevices?.getUserMedia)throw new Error('Camera unavailable');
 const base={width:{ideal:720},height:{ideal:1280}};
 try{
  VIDEO.localStream=await navigator.mediaDevices.getUserMedia({video:{...base,facingMode:{exact:'environment'}},audio:true});
 }catch(primaryError){
  if(!['OverconstrainedError','NotFoundError'].includes(primaryError.name))throw primaryError;
  try{
   VIDEO.localStream=await navigator.mediaDevices.getUserMedia({video:{...base,facingMode:{ideal:'environment'}},audio:true});
  }catch(fallbackError){
   if(!['OverconstrainedError','NotFoundError'].includes(fallbackError.name))throw fallbackError;
   console.warn('Rear camera unavailable, using default camera.',primaryError,fallbackError);
   VIDEO.localStream=await navigator.mediaDevices.getUserMedia({video:base,audio:true});
  }
 }
 return VIDEO.localStream;
}
function closePeer(id){const pc=VIDEO.pcs.get(id);if(pc){try{pc.close()}catch{}VIDEO.pcs.delete(id)}}
function closeAllPeers(){[...VIDEO.pcs.keys()].forEach(closePeer);if(VIDEO.remoteStream){VIDEO.remoteStream.getTracks().forEach(t=>t.stop());VIDEO.remoteStream=null}}
async function activateVideo(){
 try{await ensureLocalVideo();await rpc('igr_v4_video_set',{p_code:STATE.room,p_player_token:STATE.token,p_active:true,p_confidential_cut:false});await syncNow(true);startSignalPoller()}catch(e){stopLocalCapture();console.error(e);toast('Caméra/micro refusés ou flux indisponible.')}
}
function stopLocalCapture(){
 VIDEO.localStream?.getTracks().forEach(t=>t.stop());VIDEO.localStream=null;closeAllPeers();
 if(VIDEO.poller){clearInterval(VIDEO.poller);VIDEO.poller=null}
}
async function stopVideo(){
 stopLocalCapture();
 try{await rpc('igr_v4_video_set',{p_code:STATE.room,p_player_token:STATE.token,p_active:false,p_confidential_cut:false});await syncNow(true)}catch(e){toast('Caméra arrêtée sur cet appareil. État du serveur non confirmé.')}
}
async function confidentialCut(){
 stopLocalCapture();
 try{await rpc('igr_v4_video_set',{p_code:STATE.room,p_player_token:STATE.token,p_active:false,p_confidential_cut:true});await syncNow(true)}catch(e){toast('Caméra arrêtée. Coupure serveur non confirmée ou déjà utilisée.')}
}
function renderVideoTab(){
 const d=STATE.sync,role=d.player.public_role,st=videoState(),active=!!st.video_active,cutUntil=st.video_cut_until?new Date(st.video_cut_until).getTime():0,cut=cutUntil>Date.now();
 if(!canVideo(role))return`<div class="empty-state">Ton rôle n’a pas accès au flux vidéo.</div>`;
 if(role==='enqueteur')return `<div class="video-panel"><div class="video-policy"><b>Flux direct uniquement</b><span>Aucun enregistrement · aucun replay · tous les observateurs autorisés reçoivent le même flux.</span></div><video id="localVideo" autoplay muted playsinline></video><div class="tag-row">${active?`<button class="btn danger small" onclick="stopVideo()">Arrêter</button><button class="btn small" onclick="confidentialCut()">Coupure confidentielle · 60 s</button>`:`<button class="btn primary small" onclick="activateVideo()">${cut?'Reprendre le flux':'Activer le flux'}</button>`}</div>${cut?`<div class="locked-state">Coupure confidentielle active. Reprise anticipée possible par l’Enquêteur.</div>`:''}</div>`;
 return `<div class="video-panel"><div class="video-policy"><b>Observation autorisée</b><span>Flux direct de l’Enquêteur, sans enregistrement.</span></div>${active&&!cut?`<video id="remoteVideo" autoplay playsinline controls></video><button class="btn primary block" onclick="joinVideoAsViewer()">Démarrer / réactiver le flux</button>`:`<div class="waiting-pulse">${cut?'Coupure confidentielle en cours…':'Flux vidéo inactif.'}</div>`}</div>`;
}
async function joinVideoAsViewer(){
 const enq=STATE.sync.players.find(p=>p.public_role==='enqueteur');if(!enq)return;
 try{await rpc('igr_v4_signal_send',{p_code:STATE.room,p_player_token:STATE.token,p_to:enq.id,p_type:'viewer_ready',p_payload:{}});startSignalPoller();toast('Connexion au flux…')}catch(e){console.error(e);toast('Flux indisponible.')}
}
function manageVideoState(){
 const d=STATE.sync;if(!d)return;const role=d.player.public_role,st=d.room.state||{},active=!!st.video_active,cut=st.video_cut_until&&new Date(st.video_cut_until)>new Date();
 if(d.room.status!=='playing'||!canVideo(role)||!active||cut){stopLocalCapture();if(VIDEO.poller){clearInterval(VIDEO.poller);VIDEO.poller=null}return}
 startSignalPoller();if(role!=='enqueteur'&&!VIDEO.pcs.size&&Date.now()-VIDEO.lastViewerReadyAt>4000){VIDEO.lastViewerReadyAt=Date.now();joinVideoAsViewer().catch(()=>{});}
 requestAnimationFrame(()=>{const lv=byId('localVideo');if(lv&&VIDEO.localStream)lv.srcObject=VIDEO.localStream;const rv=byId('remoteVideo');if(rv&&VIDEO.remoteStream)rv.srcObject=VIDEO.remoteStream;});
}
function startSignalPoller(){if(VIDEO.poller)return;VIDEO.poller=setInterval(pollSignals,700);pollSignals()}
async function pollSignals(){
 if(VIDEO.pollBusy||!STATE.room||!STATE.token||!STATE.sync||!videoState().video_active)return;
 VIDEO.pollBusy=true;const room=STATE.room;
 try{const arr=await rpc('igr_v4_signal_poll',{p_code:STATE.room,p_player_token:STATE.token,p_after:VIDEO.lastSignalId||0});for(const s of arr||[]){if(STATE.room!==room||!videoState().video_active)break;VIDEO.lastSignalId=Math.max(VIDEO.lastSignalId,s.id||0);await handleSignal(s)}}catch(e){/* temporary video polling errors are non-fatal */}finally{VIDEO.pollBusy=false}
}
function newPeer(remoteId,isBroadcaster){
 closePeer(remoteId);const pc=new RTCPeerConnection({iceServers:[{urls:['stun:stun.l.google.com:19302','stun:stun1.l.google.com:19302']} ]});VIDEO.pcs.set(remoteId,pc);
 pc.onicecandidate=e=>{if(e.candidate)rpc('igr_v4_signal_send',{p_code:STATE.room,p_player_token:STATE.token,p_to:remoteId,p_type:'ice',p_payload:e.candidate.toJSON()}).catch(()=>{})};
 pc.onconnectionstatechange=()=>{if(['failed','closed','disconnected'].includes(pc.connectionState))setTimeout(()=>{if(VIDEO.pcs.get(remoteId)===pc&&['failed','closed','disconnected'].includes(pc.connectionState))closePeer(remoteId)},2000)};
 if(isBroadcaster&&VIDEO.localStream)VIDEO.localStream.getTracks().forEach(t=>pc.addTrack(t,VIDEO.localStream));
 pc.ontrack=e=>{VIDEO.remoteStream=e.streams[0]||new MediaStream([e.track]);const rv=byId('remoteVideo');if(rv){rv.srcObject=VIDEO.remoteStream;rv.play().catch(()=>{})}};
 return pc;
}
async function handleSignal(s){
 const me=STATE.sync.player,role=me.public_role,from=s.from_player_id,type=s.signal_type,payload=s.payload||{};
 if(type==='viewer_ready'&&role==='enqueteur'){
  try{if(!VIDEO.localStream)return;const pc=newPeer(from,true),offer=await pc.createOffer();await pc.setLocalDescription(offer);await rpc('igr_v4_signal_send',{p_code:STATE.room,p_player_token:STATE.token,p_to:from,p_type:'offer',p_payload:{type:offer.type,sdp:offer.sdp}})}catch(e){console.error('offer',e)}
 }else if(type==='offer'&&role!=='enqueteur'){
  try{const pc=newPeer(from,false);await pc.setRemoteDescription(payload);const ans=await pc.createAnswer();await pc.setLocalDescription(ans);await rpc('igr_v4_signal_send',{p_code:STATE.room,p_player_token:STATE.token,p_to:from,p_type:'answer',p_payload:{type:ans.type,sdp:ans.sdp}})}catch(e){console.error('answer',e)}
 }else if(type==='answer'){
  const pc=VIDEO.pcs.get(from);if(pc)try{await pc.setRemoteDescription(payload)}catch{}
 }else if(type==='ice'){
  const pc=VIDEO.pcs.get(from);if(pc)try{await pc.addIceCandidate(payload)}catch{}
 }else if(type==='hangup')closePeer(from);
}
function leaveRoom(){
 stopRoomWatcher();clearSession();connectionStatus(false);VIDEO.lastSignalId=0;cancelBriefingVoice();AVATARS.map.clear();AVATARS.sig='';if(VIDEO.poller){clearInterval(VIDEO.poller);VIDEO.poller=null}VIDEO.localStream?.getTracks().forEach(t=>t.stop());VIDEO.localStream=null;closeAllPeers();Object.assign(STATE,{view:'home',scenarioId:STATE.selectedScenario,room:null,token:null,hostToken:null,playerId:null,playerPseudo:'',role:'suspect',players:[],tab:'card',sync:null,syncSig:'',cycle:0});renderHome();
}

function initAudio(){
 if(SOUND.ctx)return;
 const AC=window.AudioContext||window.webkitAudioContext;
 if(!AC)return;
 try{SOUND.ctx=new AC({latencyHint:'interactive'});}catch{SOUND.ctx=new AC();}
 SOUND.ctx.addEventListener?.('statechange',()=>{
   if(!SOUND.enabled||document.visibilityState!=='visible')return;
   if(SOUND.ctx.state==='running'&&SOUND.started){
     // Re-anchor only if the scheduler fell behind after an output route change.
     if(SOUND.nextPhraseTime<SOUND.ctx.currentTime-.08){
       SOUND.nextPhraseTime=SOUND.ctx.currentTime+.035;
       scheduleAmbientAhead();
     }
   }
 });
 SOUND.masterGain=SOUND.ctx.createGain();
 SOUND.melodyGain=SOUND.ctx.createGain();
 SOUND.ambGain=SOUND.ctx.createGain();
 SOUND.fxGain=SOUND.ctx.createGain();
 SOUND.melodyGain.connect(SOUND.masterGain);
 SOUND.ambGain.connect(SOUND.masterGain);
 SOUND.fxGain.connect(SOUND.masterGain);
 SOUND.masterGain.connect(SOUND.ctx.destination);
 updateGains();

 const b=SOUND.ctx.createBuffer(1,SOUND.ctx.sampleRate*2,SOUND.ctx.sampleRate);
 const d=b.getChannelData(0);let last=0;
 for(let i=0;i<d.length;i++){
   const w=Math.random()*2-1;
   last=(last+.03*w)/1.03;
   d[i]=last*3;
 }
 SOUND.noise=b;

 // Separate vinyl/static texture: mostly silence with short irregular spikes.
 const c=SOUND.ctx.createBuffer(1,SOUND.ctx.sampleRate,SOUND.ctx.sampleRate);
 const cd=c.getChannelData(0);
 for(let i=0;i<cd.length;i++){
   const spike=Math.random()<.011;
   cd[i]=spike ? (Math.random()*2-1)*.95 : (Math.random()*2-1)*.012;
 }
 SOUND.crackle=c;
}
function updateGains(){
 if(!SOUND.masterGain)return;
 SOUND.masterGain.gain.value=SOUND.enabled?Math.min(1.42,SOUND.master*1.28):0;
 // Melody remains in front, but the terrifying bed is deliberately restored.
 if(SOUND.melodyGain)SOUND.melodyGain.gain.value=Math.min(1.62,SOUND.ambience*1.48);
 SOUND.ambGain.gain.value=SOUND.ambience*.72;
 SOUND.fxGain.gain.value=SOUND.effects*.56;
}
function clearAudio(){
 SOUND.timers.forEach(id=>{clearInterval(id);clearTimeout(id)});
 SOUND.timers=[];
 SOUND.schedulerTimer=null;
 SOUND.nextPhraseTime=0;
 SOUND.sources.slice().forEach(s=>{try{s.stop?.()}catch{}try{s.disconnect?.()}catch{}});
 SOUND.sources=[];
}
const PROFILES={
 menu:{root:43,pattern:[0,7,3,7,8,7,3,7,0,7,3,7,10,8,7,3],counter:[12,10,8,7],bpm:132,mode:'minor',palette:'pianoStrings'},
 hotel:{root:46,pattern:[0,7,3,7,8,7,5,7,0,7,3,7,10,8,7,5],counter:[12,10,8,7],bpm:128,mode:'minor',palette:'pianoStrings'},
 mourning:{root:39,pattern:[0,7,3,7,5,7,3,7,0,7,3,7,8,7,5,3],counter:[12,10,8,7],bpm:116,mode:'minor',palette:'pianoCello'},
 biohazard:{root:53,pattern:[0,7,1,7,8,7,5,7,0,7,1,7,10,8,7,5],counter:[12,8,7,1],bpm:142,mode:'phrygian',palette:'metalStrings'},
 pulse:{root:45,pattern:[0,7,3,7,8,7,3,7,0,7,5,7,10,8,7,5],counter:[12,10,8,7],bpm:146,mode:'minor',palette:'drumPiano'},
 ritual:{root:35,pattern:[0,7,1,7,5,7,1,7,0,7,3,7,8,7,5,1],counter:[12,8,7,1],bpm:124,mode:'phrygian',palette:'bellOrgan'},
 embers:{root:40,pattern:[0,7,3,7,5,7,3,7,0,7,3,7,8,7,5,3],counter:[12,10,8,7],bpm:112,mode:'minor',palette:'pianoAir'},
 estate:{root:49,pattern:[0,7,3,7,8,7,5,7,0,7,3,7,10,8,7,5],counter:[12,10,8,7],bpm:122,mode:'minor',palette:'harpsichordStrings'},
 court:{root:52,pattern:[0,7,3,7,8,7,3,7,0,7,5,7,10,8,7,5],counter:[12,10,8,7],bpm:136,mode:'minor',palette:'staccato'},
 clinical:{root:60,pattern:[0,7,1,7,8,7,1,7,0,7,5,7,10,8,7,1],counter:[12,8,7,1],bpm:148,mode:'phrygian',palette:'glassPulse'},
 walls:{root:39,pattern:[0,7,3,7,5,7,3,7,0,7,3,7,8,7,5,3],counter:[12,10,8,7],bpm:126,mode:'minor',palette:'celloKnock'},
 war:{root:31,pattern:[0,7,3,7,8,7,5,7,0,7,3,7,10,8,7,5],counter:[12,10,8,7],bpm:132,mode:'minor',palette:'drumBrass'},
 cult:{root:36,pattern:[0,7,1,7,5,7,1,7,0,7,3,7,8,7,5,1],counter:[12,8,7,1],bpm:124,mode:'phrygian',palette:'organBell'},
 sniper:{root:56,pattern:[0,7,3,7,8,7,5,7,0,7,3,7,10,8,7,5],counter:[12,10,8,7],bpm:152,mode:'minor',palette:'pizzicato'},
 intelligence:{root:57,pattern:[0,7,3,7,8,7,5,7,0,7,3,7,10,8,7,5],counter:[12,10,8,7],bpm:144,mode:'minor',palette:'metalPiano'},
 hospital:{root:50,pattern:[0,7,3,7,5,7,3,7,0,7,3,7,8,7,5,3],counter:[12,10,8,7],bpm:134,mode:'minor',palette:'pianoGlass'},
 elevator:{root:44,pattern:[0,7,1,7,8,7,5,7,0,7,1,7,10,8,7,5],counter:[12,8,7,1],bpm:136,mode:'phrygian',palette:'celloMetal'},
 betrayal:{root:47,pattern:[0,7,3,7,8,7,5,7,0,7,3,7,10,8,7,5],counter:[12,10,8,7],bpm:130,mode:'minor',palette:'pianoCello'},
 forensics:{root:58,pattern:[0,7,1,7,8,7,5,7,0,7,1,7,10,8,7,5],counter:[12,8,7,1],bpm:146,mode:'phrygian',palette:'glassStrings'},
 ball:{root:42,pattern:[0,7,3,7,8,7,5,7,0,7,3,7,10,8,7,5],counter:[12,10,8,7],bpm:126,mode:'minor',palette:'waltz'},
 inferno:{root:29,pattern:[0,7,1,7,8,7,5,7,0,7,1,7,10,8,7,5],counter:[12,8,7,1],bpm:156,mode:'phrygian',palette:'inferno'}
};

const STAGE={
 pianoStrings:{lead:'piano',shadow:'strings',accent:'bell',impact:.46,air:.20},
 pianoCello:{lead:'piano',shadow:'cello',accent:'strings',impact:.34,air:.24},
 metalStrings:{lead:'piano',shadow:'strings',accent:'metal',impact:.62,air:.18},
 drumPiano:{lead:'piano',shadow:'strings',accent:'drum',impact:.78,air:.14},
 bellOrgan:{lead:'bell',shadow:'organ',accent:'piano',impact:.48,air:.26},
 pianoAir:{lead:'piano',shadow:'strings',accent:'bell',impact:.30,air:.34},
 harpsichordStrings:{lead:'harpsichord',shadow:'strings',accent:'piano',impact:.34,air:.16},
 staccato:{lead:'piano',shadow:'strings',accent:'pizz',impact:.52,air:.10},
 glassPulse:{lead:'glass',shadow:'piano',accent:'metal',impact:.55,air:.08},
 celloKnock:{lead:'piano',shadow:'cello',accent:'knock',impact:.48,air:.26},
 drumBrass:{lead:'piano',shadow:'brass',accent:'drum',impact:.74,air:.22},
 organBell:{lead:'organ',shadow:'strings',accent:'bell',impact:.50,air:.28},
 pizzicato:{lead:'pizz',shadow:'piano',accent:'metal',impact:.60,air:.08},
 metalPiano:{lead:'piano',shadow:'strings',accent:'metal',impact:.60,air:.10},
 pianoGlass:{lead:'piano',shadow:'glass',accent:'strings',impact:.44,air:.14},
 celloMetal:{lead:'piano',shadow:'cello',accent:'metal',impact:.60,air:.16},
 glassStrings:{lead:'glass',shadow:'strings',accent:'piano',impact:.54,air:.10},
 waltz:{lead:'piano',shadow:'strings',accent:'bell',impact:.40,air:.20},
 inferno:{lead:'piano',shadow:'strings',accent:'drum',impact:.92,air:.28}
};

function noteFreq(root,semitone,oct=2){return root*Math.pow(2,semitone/12)*oct}
function trackSource(source){
 if(!source)return source;
 SOUND.sources.push(source);
 const previous=source.onended;
 source.onended=()=>{
   SOUND.sources=SOUND.sources.filter(s=>s!==source);
   if(typeof previous==='function')try{previous()}catch{}
 };
 return source;
}
function soundTime(delay=0){return (SOUND.scheduleAnchor??SOUND.ctx.currentTime)+delay}
function withAudioTarget(target,fn){
 const prev=SOUND.currentTarget;
 SOUND.currentTarget=target;
 try{return fn()}finally{SOUND.currentTarget=prev}
}
function connectPan(node,pan=0,target=null){
 target=target||SOUND.currentTarget||SOUND.ambGain;
 if(SOUND.ctx.createStereoPanner){const p=SOUND.ctx.createStereoPanner();p.pan.value=Math.max(-.75,Math.min(.75,pan));node.connect(p);p.connect(target);return p}
 node.connect(target);return null
}
function playPiano(freq,level=.08,delay=0,pan=0,dur=.72){
 const now=soundTime(delay);
 const body=SOUND.ctx.createOscillator(),harm=SOUND.ctx.createOscillator(),filter=SOUND.ctx.createBiquadFilter(),g=SOUND.ctx.createGain();
 body.type='triangle';body.frequency.value=freq;
 harm.type='sine';harm.frequency.value=freq*2.01;harm.detune.value=4;
 filter.type='lowpass';filter.frequency.value=2450;filter.Q.value=.65;
 g.gain.setValueAtTime(.0001,now);
 g.gain.exponentialRampToValueAtTime(level,now+.008);
 g.gain.exponentialRampToValueAtTime(level*.22,now+.14);
 g.gain.exponentialRampToValueAtTime(.0001,now+dur);
 body.connect(filter);harm.connect(filter);filter.connect(g);connectPan(g,pan);
 trackSource(body);trackSource(harm);
 body.start(now);harm.start(now);body.stop(now+dur+.03);harm.stop(now+dur+.03);
}
function playString(freq,level=.045,delay=0,pan=0,dur=2.4){
 const now=soundTime(delay),o=SOUND.ctx.createOscillator(),f=SOUND.ctx.createBiquadFilter(),g=SOUND.ctx.createGain(),l=SOUND.ctx.createOscillator(),lg=SOUND.ctx.createGain();
 o.type='sawtooth';o.frequency.value=freq;f.type='lowpass';f.frequency.value=720;f.Q.value=1.1;
 l.frequency.value=4.7;lg.gain.value=1.8;l.connect(lg);lg.connect(o.frequency);
 g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(level,now+.18);g.gain.setValueAtTime(level*.82,now+dur*.62);g.gain.exponentialRampToValueAtTime(.0001,now+dur);
 o.connect(f);f.connect(g);connectPan(g,pan);trackSource(o);trackSource(l);o.start(now);l.start(now);o.stop(now+dur+.05);l.stop(now+dur+.05);
}
function playCello(freq,level=.05,delay=0,pan=-.12,dur=2.7){playString(freq*.5,level,delay,pan,dur)}
function playBell(freq,level=.038,delay=0,pan=.18){
 const now=soundTime(delay);
 [1,2.03,3.97].forEach((r,i)=>{const o=SOUND.ctx.createOscillator(),g=SOUND.ctx.createGain();o.type='sine';o.frequency.value=freq*r;g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(level*(i?0.28:1),now+.008+i*.004);g.gain.exponentialRampToValueAtTime(.0001,now+(i?1.2:2.2));o.connect(g);connectPan(g,pan+(i-1)*.08);trackSource(o);o.start(now);o.stop(now+2.25)});
}
function playGlass(freq,level=.03,delay=0,pan=.2){playBell(freq*1.45,level,delay,pan)}
function playOrgan(freq,level=.032,delay=0,pan=0){[0,7,12].forEach((s,i)=>playString(freq*Math.pow(2,s/12),level*(i?0.65:1),delay+i*.015,pan+(i-1)*.12,2.8))}
function playHarpsichord(freq,level=.055,delay=0,pan=0){
 const now=soundTime(delay),o=SOUND.ctx.createOscillator(),f=SOUND.ctx.createBiquadFilter(),g=SOUND.ctx.createGain();
 o.type='sawtooth';o.frequency.value=freq;f.type='highpass';f.frequency.value=620;
 g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(level,now+.004);g.gain.exponentialRampToValueAtTime(.0001,now+.34);
 o.connect(f);f.connect(g);connectPan(g,pan);trackSource(o);o.start(now);o.stop(now+.38);
}
function playMetal(freq,level=.026,delay=0,pan=.15){
 const now=soundTime(delay),o=SOUND.ctx.createOscillator(),g=SOUND.ctx.createGain(),f=SOUND.ctx.createBiquadFilter();
 o.type='square';o.frequency.value=freq*2.62;f.type='bandpass';f.frequency.value=Math.min(2600,freq*3.2);f.Q.value=7;
 g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(level,now+.005);g.gain.exponentialRampToValueAtTime(.0001,now+.48);
 o.connect(f);f.connect(g);connectPan(g,pan);trackSource(o);o.start(now);o.stop(now+.52);
}
function playPizz(freq,level=.042,delay=0,pan=0){
 const now=soundTime(delay),o=SOUND.ctx.createOscillator(),g=SOUND.ctx.createGain(),f=SOUND.ctx.createBiquadFilter();
 o.type='triangle';o.frequency.value=freq;f.type='lowpass';f.frequency.value=1050;
 g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(level,now+.004);g.gain.exponentialRampToValueAtTime(.0001,now+.22);
 o.connect(f);f.connect(g);connectPan(g,pan);trackSource(o);o.start(now);o.stop(now+.25);
}
function playDrum(root,level=.08,delay=0){
 const now=soundTime(delay),o=SOUND.ctx.createOscillator(),g=SOUND.ctx.createGain();
 o.type='sine';o.frequency.setValueAtTime(Math.max(52,root*2),now);o.frequency.exponentialRampToValueAtTime(Math.max(28,root*.62),now+.2);
 g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(level,now+.006);g.gain.exponentialRampToValueAtTime(.0001,now+.48);
 o.connect(g);g.connect(SOUND.currentTarget||SOUND.ambGain);trackSource(o);o.start(now);o.stop(now+.5);
}
function playKnock(root,level=.055,delay=0){playDrum(root*1.65,level,delay);playMetal(root*3.2,.014,delay+.012,-.1)}
function playBrass(freq,level=.036,delay=0,pan=0){playString(freq*.5,level,delay,pan,1.2)}
function playAir(level=.014,dur=1.1,delay=0){
 if(!SOUND.noise)return;const now=soundTime(delay),n=SOUND.ctx.createBufferSource(),bp=SOUND.ctx.createBiquadFilter(),g=SOUND.ctx.createGain();
 n.buffer=SOUND.noise;bp.type='bandpass';bp.frequency.value=980;bp.Q.value=.8;
 g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(level,now+.18);g.gain.exponentialRampToValueAtTime(.0001,now+dur);
 n.connect(bp);bp.connect(g);g.connect(SOUND.ambGain);trackSource(n);n.start(now);n.stop(now+dur+.04);
}
function playCrackleBurst(level=.045,delay=0,dur=.28){
 if(!SOUND.enabled||!SOUND.ctx||!SOUND.crackle)return;
 const now=soundTime(delay);
 const n=SOUND.ctx.createBufferSource(),hp=SOUND.ctx.createBiquadFilter(),bp=SOUND.ctx.createBiquadFilter(),g=SOUND.ctx.createGain();
 n.buffer=SOUND.crackle;
 hp.type='highpass';hp.frequency.value=760;
 bp.type='bandpass';bp.frequency.value=1850+Math.random()*850;bp.Q.value=.7;
 g.gain.setValueAtTime(.0001,now);
 g.gain.exponentialRampToValueAtTime(level,now+.018);
 g.gain.setValueAtTime(level*.72,now+Math.max(.03,dur*.38));
 g.gain.exponentialRampToValueAtTime(.0001,now+dur);
 n.connect(hp);hp.connect(bp);bp.connect(g);g.connect(SOUND.currentTarget||SOUND.ambGain);
 trackSource(n);n.start(now);n.stop(now+dur+.02);
}
function playInstrument(name,freq,level,delay,pan,root){
 if(name==='piano')return playPiano(freq,level,delay,pan);
 if(name==='strings')return playString(freq,level*.72,delay,pan,2.3);
 if(name==='cello')return playCello(freq,level*.82,delay,pan,2.6);
 if(name==='bell')return playBell(freq,level*.55,delay,pan);
 if(name==='glass')return playGlass(freq,level*.48,delay,pan);
 if(name==='organ')return playOrgan(freq,level*.52,delay,pan);
 if(name==='harpsichord')return playHarpsichord(freq,level*.74,delay,pan);
 if(name==='metal')return playMetal(freq,level*.42,delay,pan);
 if(name==='pizz')return playPizz(freq,level*.68,delay,pan);
 if(name==='drum')return playDrum(root,level*.92,delay);
 if(name==='knock')return playKnock(root,level*.72,delay);
 if(name==='brass')return playBrass(freq,level*.62,delay,pan);
}

function playForegroundInstrument(name,freq,level,delay,pan,root,noteDur=.32){
 return withAudioTarget(SOUND.melodyGain||SOUND.ambGain,()=>{
   if(name==='piano')return playPiano(freq,level,delay,pan,noteDur);
   if(name==='harpsichord')return playHarpsichord(freq,level,delay,pan);
   if(name==='pizz')return playPizz(freq,level,delay,pan);
   return playInstrument(name,freq,level,delay,pan,root);
 });
}

function currentMusicIntensity(){
 if(STATE.view!=='game')return .82;
 const c=Math.max(1,Math.min(3,STATE.cycle||1));
 return c===1?.88:c===2?1.0:1.12;
}

/*
 V9.8 — continuous horror pulse.
 Original score: coherent minor / Phrygian harmony, no long blank gaps.
*/
function playSlasherPhrase(preset,step=0,anchorTime=null){
 if(!SOUND.enabled||!SOUND.ctx)return;
 SOUND.lastPhraseAt=performance.now();
 const p=PROFILES[preset]||PROFILES.menu;
 const previousAnchor=SOUND.scheduleAnchor;
 SOUND.scheduleAnchor=anchorTime??(SOUND.ctx.currentTime+.012);
 const stage=STAGE[p.palette]||STAGE.pianoStrings;
 const intensity=currentMusicIntensity();
 const eighth=(60/p.bpm)/2;
 const loopDuration=p.pattern.length*eighth;

 // Continuous 16-note ostinato. Every subdivision has a note.
 p.pattern.forEach((semi,i)=>{
   const freq=noteFreq(p.root,semi,2.22);
   const strong=i%4===0;
   const medium=i%2===0;
   const launchBoost=(step===0&&i===0)?1.32:1;
   const level=(strong?.205:medium?.162:.136)*intensity*launchBoost;
   const pan=i%2===0?-.055:.055;
   playForegroundInstrument(stage.lead,freq,level,i*eighth,pan,p.root,Math.min(.34,eighth*1.38));

   // Low pedal glues the notes together and removes the empty feeling.
   if(i%2===0){
     const bassSemi=i%8<4?0:7;
     playPiano(noteFreq(p.root,bassSemi,1.12),.029*intensity,i*eighth+.008,-pan,.36);
   }
 });

 // Compatible chord bed: minor i -> VI -> v. Phrygian uses bII in the middle.
 const chords=p.mode==='phrygian'
   ? [[0,3,7],[1,5,8],[0,3,7]]
   : [[0,3,7],[8,12,15],[7,10,14]];
 chords.forEach((ch,ci)=>{
   const when=ci*(loopDuration/3);
   ch.forEach((semi,vi)=>{
     const f=noteFreq(p.root,semi,vi===0?.82:1.0);
     playInstrument(stage.shadow,f,.028*intensity,when+vi*.016,(vi-1)*.16,p.root);
   });
 });

 // Final-quarter lift, locked exactly to the grid.
 // We double existing notes one octave higher instead of inserting an off-grid
 // counter-line, so there is no moment where two unrelated notes cut into each other.
 [8,10,12,14].forEach((idx,j)=>{
   const semi=p.pattern[idx]+12;
   const f=noteFreq(p.root,semi,1.55);
   const level=(j===3?.034:.027)*intensity;
   playForegroundInstrument('piano',f,level,idx*eighth,(j-1.5)*.09,p.root,Math.min(.27,eighth*1.08));
 });

 // Sparse theatrical punctuation, harmonically anchored.
 if(step%2===1)playDrum(p.root,.042*stage.impact*intensity,loopDuration*.50);
 if(step%4===3)playBell(noteFreq(p.root,p.mode==='phrygian'?13:15,1.9),.015*intensity,loopDuration*.76,.22);

 if(preset==='ball'){
   [0,3,7].forEach((semi,i)=>playPiano(noteFreq(p.root,semi,1.6),.018*intensity,loopDuration*.52+i*.10,(i-1)*.10,.28));
 }
 if((preset==='clinical'||preset==='forensics')&&step%2===0){
   playGlass(noteFreq(p.root,p.mode==='phrygian'?13:15,1.9),.014*intensity,loopDuration*.63,.20);
 }
 if(preset==='ritual'||preset==='cult'){
   playOrgan(noteFreq(p.root,0,.78),.013*intensity,loopDuration*.08,0);
 }
 if(preset==='inferno'){
   playDrum(p.root,.064*intensity,loopDuration*.24);
   playDrum(p.root,.070*intensity,loopDuration*.74);
 }

 // Static appears only from time to time: clearly audible, but always shorter than the music.
 if(step%3===2){
   playCrackleBurst(.044*intensity,loopDuration*(.30+Math.random()*.30),.24+Math.random()*.10);
   if(step%6===5)playCrackleBurst(.026*intensity,loopDuration*(.70+Math.random()*.12),.12+Math.random()*.07);
 }
 SOUND.scheduleAnchor=previousAnchor;
 return loopDuration;
}

function repairAmbientScheduler(){
 if(!SOUND.ctx||!SOUND.enabled||!SOUND.started)return;
 // Repair only the future scheduler. Do not clear currently playing/scheduled
 // sources: this keeps the score continuous across phase/cycle changes.
 if(SOUND.schedulerTimer){try{clearInterval(SOUND.schedulerTimer)}catch{}}
 SOUND.schedulerTimer=null;
 SOUND.nextPhraseTime=Math.max(SOUND.nextPhraseTime||0,SOUND.ctx.currentTime+.035);
 SOUND.lastPhraseAt=performance.now();
 scheduleAmbientAhead();
 SOUND.schedulerTimer=setInterval(scheduleAmbientAhead,90);
 SOUND.timers=SOUND.timers.filter(t=>t!==SOUND.schedulerTimer);
 SOUND.timers.push(SOUND.schedulerTimer);
}
function ensureAmbient(preset='menu'){
 if(preset==='silent'){stopAmbient();return;}
 initAudio();
 if(!SOUND.ctx||!SOUND.enabled)return;
 if(SOUND.started && SOUND.preset===preset){
   updateGains();
   if(audioIsStale())repairAmbientScheduler();
   return;
 }
 // Only a real preset change or a stopped engine starts a new score.
 startAmbient(preset);
}
function scheduleAmbientAhead(){
 if(!SOUND.enabled||!SOUND.ctx||!SOUND.started)return;
 const horizon=SOUND.ctx.currentTime+.55;
 while(SOUND.nextPhraseTime<horizon){
   playSlasherPhrase(SOUND.preset,SOUND.schedulerStep++,SOUND.nextPhraseTime);
   SOUND.nextPhraseTime+=SOUND.loopDuration;
 }
}
function startAmbient(preset='menu'){
 if(preset==='silent'){stopAmbient();return;}
 initAudio();if(!SOUND.ctx||!SOUND.enabled)return;
 if(SOUND.starting && SOUND.preset===preset)return;
 clearAudio();
 SOUND.started=false;
 SOUND.starting=true;
 SOUND.preset=preset;
 updateGains();

 const p=PROFILES[preset]||PROFILES.menu;
 SOUND.loopDuration=p.pattern.length*((60/p.bpm)/2);
 SOUND.expectedLoopMs=SOUND.loopDuration*1000;
 SOUND.schedulerStep=0;
 SOUND.nextPhraseTime=SOUND.ctx.currentTime+.025;
 SOUND.lastPhraseAt=performance.now();
 SOUND.started=true;

 // Schedule ahead on the AudioContext clock. Bluetooth latency can delay output,
 // but it can no longer distort the relative timing between notes.
 scheduleAmbientAhead();
 SOUND.schedulerTimer=setInterval(scheduleAmbientAhead,90);
 SOUND.timers.push(SOUND.schedulerTimer);
 SOUND.starting=false;
}
function stopAmbient(){clearAudio();SOUND.started=false;SOUND.starting=false;SOUND.lastPhraseAt=0;SOUND.expectedLoopMs=0;if(SOUND.masterGain)SOUND.masterGain.gain.value=0}
function playSliderPreview(kind='master'){
 initAudio();if(!SOUND.enabled||!SOUND.ctx)return;
 const preset=activeSoundPreset();
 const p=PROFILES[preset]||PROFILES.menu;
 const note=noteFreq(p.root,p.pattern[2],2.2);
 if(kind==='effects')playBell(note*1.18,.035,0,.1);
 else{
   playPiano(note,.065,0,0,.38);
   playPiano(noteFreq(p.root,7,1.12),.022,0,-.08,.38);
 }
}
function playLevelTick(strength=1){
 initAudio();if(!SOUND.enabled||!SOUND.ctx)return;
 const p=PROFILES[activeSoundPreset()]||PROFILES.menu;
 playPiano(noteFreq(p.root,0,2.18),.048*Math.max(.3,strength),0,0,.28);
}
function duckScoreForCue(start,duration=.78){
 if(!SOUND.ctx)return;
 const mg=SOUND.melodyGain?.gain,ag=SOUND.ambGain?.gain;
 const targetMelody=Math.min(1.62,SOUND.ambience*1.48);
 const targetAmb=SOUND.ambience*.72;
 if(mg){
   mg.cancelScheduledValues(start);
   mg.setValueAtTime(mg.value,start);
   mg.linearRampToValueAtTime(targetMelody*.42,start+.045);
   mg.setValueAtTime(targetMelody*.42,start+duration*.68);
   mg.linearRampToValueAtTime(targetMelody,start+duration);
 }
 if(ag){
   ag.cancelScheduledValues(start);
   ag.setValueAtTime(ag.value,start);
   ag.linearRampToValueAtTime(targetAmb*.28,start+.045);
   ag.setValueAtTime(targetAmb*.28,start+duration*.68);
   ag.linearRampToValueAtTime(targetAmb,start+duration);
 }
}
function playCue(type){
 initAudio();if(!SOUND.enabled||!SOUND.ctx)return;
 if(SOUND.ctx.state!=='running')try{SOUND.ctx.resume().catch(()=>{})}catch{}
 const p=PROFILES[activeSoundPreset()]||PROFILES.menu;
 const start=SOUND.ctx.currentTime+.035;
 const previousAnchor=SOUND.scheduleAnchor;
 SOUND.scheduleAnchor=start;
 duckScoreForCue(start,type==='trame'?.84:.72);

 const sequences={
   trame:p.mode==='phrygian'?[0,1,7,12]:[0,3,7,12],
   cycle:[0,7,12],
   news:[12,10,7],
   finale:p.mode==='phrygian'?[0,1,-5,0]:[0,3,-5,0]
 };
 const seq=sequences[type]||sequences.trame;
 withAudioTarget(SOUND.fxGain,()=>{
   if(type==='trame')playDrum(p.root,.080,0);
   seq.forEach((semi,i)=>{
     const d=i*(type==='trame'?.105:.12);
     playPiano(noteFreq(p.root,semi,2.12),type==='trame'?.145:.115,d,(i-(seq.length-1)/2)*.08,.27);
   });
   if(type==='trame')playBell(noteFreq(p.root,12,1.92),.022,.36,.18);
 });
 SOUND.scheduleAnchor=previousAnchor;
}

function revealFocusedField(el,behavior='smooth'){
 if(!el?.getBoundingClientRect)return;const vv=window.visualViewport,rect=el.getBoundingClientRect();const top=(vv?.offsetTop||0)+18,bottom=(vv?.offsetTop||0)+(vv?.height||window.innerHeight)-24;let delta=0;if(rect.bottom>bottom)delta=rect.bottom-bottom+32;else if(rect.top<top)delta=rect.top-top-24;if(Math.abs(delta)>2)window.scrollBy({top:delta,behavior});
}
function setupKeyboardGuard(){
 const vv=window.visualViewport;
 const update=()=>{const kb=vv?Math.max(0,window.innerHeight-vv.height-vv.offsetTop):0;document.documentElement.style.setProperty('--keyboard-height',`${Math.round(kb)}px`);document.body.classList.toggle('keyboard-open',kb>80);const active=document.activeElement;if(active?.matches?.('input,textarea,select'))revealFocusedField(active,'auto')};
 vv?.addEventListener('resize',update);vv?.addEventListener('scroll',update);window.addEventListener('orientationchange',()=>setTimeout(update,120));
 document.addEventListener('focusin',e=>{if(!e.target.matches?.('input,textarea,select'))return;document.body.classList.add('field-focused');setTimeout(()=>{revealFocusedField(e.target);update()},90);setTimeout(()=>{revealFocusedField(e.target);update()},340)});
 document.addEventListener('focusout',()=>setTimeout(()=>{document.body.classList.remove('field-focused');update()},180));update();
}

async function restore(){
 try{
  stopRoomWatcher();
  const saved=JSON.parse(STORAGE.getItem(sessionKey())||'null');
  if(!saved?.room||!saved?.token)return false;
  Object.assign(STATE,saved);
  // iOS PWA may resume before connectivity is usable. Do not abandon the
  // saved room after a single transient failure.
  for(let attempt=0;attempt<3;attempt++){
    const snapshot=await syncNow(true,true);
    if(snapshot?.room&&snapshot?.player){startRoomWatcher();return true}
    if(!STATE.room||!STATE.token)break;
    if(attempt<2)await new Promise(done=>setTimeout(done,450+attempt*650));
  }
  // Keep the saved credentials so Reprendre ma cellule works without rejoining.
  STATE.room=null;STATE.token=null;STATE.hostToken=null;STATE.sync=null;
  connectionStatus(false);
  return false;
 }catch(e){console.error(e);return false}
}
function renderCurrent(){if(STATE.view==='home')renderHome();else if(STATE.view==='create-list')renderCreateList();else if(STATE.view==='create-confirm')renderCreateConfirm();else if(STATE.view==='join')renderJoin();else if(STATE.view==='rules')renderRules();else if(STATE.view==='profile')renderProfile();else if(STATE.view==='lobby')renderLobby();else if(STATE.view==='briefing')renderBriefing();else if(STATE.view==='role')renderRole();else if(STATE.view==='game')renderGame()}
setupKeyboardGuard();
// The identity screen is local and must never wait for Supabase.
setupIntro();
showIntroGate('TOUCHEZ POUR OUVRIR LA PORTE');
// Restore the real destination in parallel behind the cinematic.
restore().then(ok=>{
 if(ok)routeFromServer();else renderHome();
 BOOT.ready=true;
 if(INTRO.waitingForBoot)completeIntroEntry();
}).catch(err=>{
 console.error(err);
 renderHome();BOOT.ready=true;
 if(INTRO.waitingForBoot)completeIntroEntry();
});
setInterval(()=>{if(STATE.view==='game'||STATE.view==='briefing')updatePhaseClock()},1000);
let LAST_AUDIO_GESTURE=0;
function unlockAudioFromGesture(){
 primeNarrationFromGesture();
 if(!SOUND.enabled)return;
 const now=performance.now();if(now-LAST_AUDIO_GESTURE<90)return;LAST_AUDIO_GESTURE=now;
 initAudio();if(!SOUND.ctx)return;
 try{
   const p=SOUND.ctx.state==='running'?Promise.resolve():SOUND.ctx.resume();
   p?.then?.(()=>{
     primeAudioOutput();updateGains();
     if(!INTRO.active)ensureAmbient(activeSoundPreset());
   }).catch?.(()=>{});
 }catch{}
}
window.addEventListener('pointerdown',unlockAudioFromGesture,{passive:true,capture:true});
window.addEventListener('touchstart',unlockAudioFromGesture,{passive:true,capture:true});
window.addEventListener('mousedown',unlockAudioFromGesture,{passive:true,capture:true});
window.addEventListener('keydown',unlockAudioFromGesture,{capture:true});

if(navigator.mediaDevices?.addEventListener){
 navigator.mediaDevices.addEventListener('devicechange',()=>{
   if(!SOUND.enabled)return;
   // WebAudio follows the system-selected output (including Bluetooth).
   // Re-check the scheduler after an output route change without restarting the score.
   setTimeout(()=>ensureLiveAudio(),180);
 });
}

function handleVisibleApp(){
 if(!SOUND.enabled||document.visibilityState!=='visible')return;
 if(INTRO.active||INTRO.playing)return;
 initAudio();
 if(SOUND.ctx?.state==='running'){
   hideAudioWakePrompt();ensureAmbient(activeSoundPreset());
   return;
 }
 // Never send an active player back to the entrance just because iOS suspended audio.
 // Active sessions get an in-game audio recovery control instead.
 if(STATE.room&&['lobby','briefing','role','game'].includes(STATE.view)){
   showAudioWakePrompt(STATE.sync?.room?.phase==='briefing'?'Touchez pour écouter le briefing':'Touchez pour réactiver le son');
   return;
 }
 showAudioWakePrompt('Touchez pour réactiver le son');
}
const RUNNING_STANDALONE=window.matchMedia?.('(display-mode: standalone)')?.matches||navigator.standalone===true;
let APP_WAS_HIDDEN=false;
document.addEventListener('visibilitychange',()=>{
 if(document.visibilityState==='hidden'){
   APP_WAS_HIDDEN=true;
   return;
 }
 if(document.visibilityState==='visible'&&RUNNING_STANDALONE&&APP_WAS_HIDDEN){
   APP_WAS_HIDDEN=false;
   showIntroGate('TOUCHEZ POUR ENTRER');
   return;
 }
 if(document.visibilityState==='visible')setTimeout(handleVisibleApp,100);
});
window.addEventListener('pageshow',()=>setTimeout(()=>{if(!INTRO.active)handleVisibleApp()},120));
window.addEventListener('focus',()=>setTimeout(()=>{if(!INTRO.active)handleVisibleApp()},120));
// Audio watchdog: catches rare iPhone/PWA cases where WebAudio stays alive but the scheduler stops.
setInterval(()=>{
 if(!SOUND.enabled||document.visibilityState!=='visible'||INTRO.active||INTRO.playing)return;
 if(SOUND.ctx?.state==='running'&&audioIsStale())ensureAmbient(activeSoundPreset());
},1600);


document.addEventListener('keydown',e=>{
 if(e.key==='Enter' && INTRO.active && !e.defaultPrevented){
   startIntroSequence();
 }
});

// Prevent duplicate mutations from rapid taps without changing the game rules.
const BUSY_ACTIONS=new Set();
for(const name of ['createRoom','joinRoom','startGame','chooseLobbyRole','prepareLobbyAudio','ackRole','advancePhaseNow','togglePhaseTimer','startInterrogation','endInterrogation','submitDebrief','specialAction','prosecutorRequest','respondProsecutor','witnessStatus','publishBreaking','setProvisional','lockFinal','voteNextScenario','finalizeNextScenario','claimNextRole','finalizeNextRoles','sendMessage','activateVideo','stopVideo','confidentialCut']){
 const original=window[name];window[name]=async function(...args){
  if(BUSY_ACTIONS.has(name))return;BUSY_ACTIONS.add(name);
  const button=document.activeElement?.closest?.('button'),wasDisabled=button?.disabled;
  if(button){button.disabled=true;button.setAttribute('aria-busy','true')}
  try{return await original.apply(this,args)}finally{BUSY_ACTIONS.delete(name);if(button?.isConnected){button.disabled=wasDisabled;button.removeAttribute('aria-busy')}}
 };
}
let dialogReturnFocus=null;
function trapDialogFocus(modal){dialogReturnFocus=document.activeElement;byId('app').inert=true;modal.querySelector('button,input,[tabindex]')?.focus({preventScroll:true})}
function releaseDialogFocus(){byId('app').inert=INTRO.active;if(dialogReturnFocus?.isConnected)dialogReturnFocus.focus({preventScroll:true});dialogReturnFocus=null}
const baseOpenSettings=openSettings;openSettings=function(){baseOpenSettings();const m=document.querySelector('.modal');if(m)trapDialogFocus(m)};
document.addEventListener('keydown',e=>{
 const modal=document.querySelector('.modal');
 if(modal){
  if(e.key==='Escape'){e.preventDefault();modal.cancelDialog?modal.cancelDialog():closeSettings();return}
  if(e.key==='Tab'){
   const items=[...modal.querySelectorAll('button,input,select,textarea,[tabindex="0"]')].filter(x=>!x.disabled),first=items[0],last=items.at(-1);
   if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus()}
  }
 }else if((e.key==='Enter'||e.key===' ')&&e.target.matches('[role="button"][tabindex]')){e.preventDefault();e.target.click()}
});
async function resumeSession(){const ok=await restore();if(ok){hideIntroImmediately();routeFromServer()}else toast('Reconnexion impossible pour le moment. Réessaie après avoir vérifié la connexion.')}
window.addEventListener('online',()=>{if(STATE.room)syncNow(true)});
window.addEventListener('offline',()=>{if(STATE.room)connectionStatus(true)});
window.addEventListener('pagehide',()=>{stopLocalCapture();cancelBriefingVoice()});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&STATE.room)syncNow(true)});


/* v11-30-scenario-text-rewrite — PWA cache bootstrap */
if (!NATIVE_SHELL && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js?v=v12-store-candidate').catch(() => {});
  }, {once:true});
}
