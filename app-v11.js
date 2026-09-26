const STORAGE = {
 memory:new Map(),
 getItem(k){if(this.memory.has(k))return this.memory.get(k);try{return window.localStorage.getItem(k)}catch{return null}},
 setItem(k,v){v=String(v);this.memory.set(k,v);try{window.localStorage.setItem(k,v)}catch{if(!this.warned){this.warned=true;setTimeout(()=>toast('Stockage indisponible : garde cette page ouverte pour conserver ta session.'),800)}}},
 removeItem(k){this.memory.set(k,null);try{window.localStorage.removeItem(k)}catch{}}
};
const VERSION = 'v11-20-store-candidate';
const SUPABASE_URL = 'https://jtasbdiguhiswoyvobkn.supabase.co';
const SUPABASE_KEY = 'sb_publishable__I1lNSf1dyQRHz1jY8As1Q_zAwh8j13';
const API = `${SUPABASE_URL}/rest/v1`;

const SCENARIOS = [
{id:'001',title:'LA CHAMBRE 222',short:'Une chambre d’hôtel. Un corps. Trois versions de la même nuit.',context:'Maël Sénéchal est retrouvé poignardé dans une chambre d’hôtel. Les horaires, les passages et les mensonges ne racontent pas la même nuit.',mood:'Huis clos froid, sec et policier.',min:4,max:5,sound:'hotel',mechanics:['Enquête classique','Trames matérielles','Permutation cachée']},
{id:'002',title:'LE SILENCE DE LÉON',short:'Léon s’est tué. Les autres doivent répondre de ce qu’ils lui ont fait.',context:'Léon meurt par suicide. Le dossier ne cherche pas un meurtrier, mais la responsabilité réelle de ceux qui l’ont humilié, manipulé, abandonné ou épuisé.',mood:'Intime, lourd, sans échappatoire.',min:5,max:6,sound:'mourning',mechanics:['Responsabilité morale','Comportement ambigu','Pas de causalité simpliste']},
{id:'003',title:'LE DERNIER PROTOCOLE',short:'Une gare contaminée. Un programme secret. Une chaîne de décisions.',context:'Une attaque biologique frappe une gare. L’agent est relié au Centre Helios. Personne n’a tout fait seul, mais plusieurs personnes ont rendu le massacre possible.',mood:'Institutionnel, froid, contaminé par la panique.',min:4,max:5,sound:'biohazard',mechanics:['Responsabilité fragmentée','Documents techniques','Brouillage politique']},
{id:'004',title:'LES TROIS ABSENTS',short:'Trois personnes ont reçu le même appel à l’aide. Personne n’est venu.',context:'Sofia demande de l’aide à trois personnes. Chacune hésite, refuse ou tarde. Elle meurt seule d’une overdose alcool-médicaments.',mood:'Une nuit vide où l’inaction devient un choix.',min:4,max:5,sound:'pulse',mechanics:['Fenêtres d’intervention','Culpabilité passive','Chronologie intime']},
{id:'005',title:'LE MASQUE BLANC',short:'Un masque blanc. Une scène fabriquée. Une intention qui refuse de rester unique.',context:'Une victime est retrouvée dans une mise en scène au masque blanc. Les indices donnent l’impression d’un rituel cohérent, mais plusieurs intentions peuvent se superposer.',mood:'Dérangeant, symbolique, brutal.',min:4,max:5,sound:'ritual',mechanics:['Faux coupable','Ancrage matériel tardif','Choc psychologique']},
{id:'006',title:'LES CENDRES DU CHALET',short:'Cinq ans de silence. Un chalet. Un souvenir que personne ne raconte pareil.',context:'Cinq ans après la chute de Noé dans un chalet isolé, le dossier est rouvert. Les anciens amis se contredisent tout en protégeant quelque chose de commun.',mood:'Neige, silence, mémoire sale.',min:4,max:5,sound:'embers',mechanics:['Réouverture','Secret collectif','Mémoire reconstruite']},
{id:'007',title:'LE TESTAMENT GRIS',short:'Un héritage empoisonné. Puis une mort qui change le sens de tout.',context:'Une affaire familiale se transforme lorsqu’un décès inattendu recontextualise les intérêts, les mensonges et le véritable enjeu de l’héritage.',mood:'Famille fermée, patrimoine empoisonné.',min:5,max:5,sound:'estate',mechanics:['Héritage','Renversement avant C3','Secrets croisés']},
{id:'008',title:'SOUS SERMENT',short:'Tout le monde a juré de dire vrai. Les versions, elles, sont incompatibles.',context:'Des déclarations sous serment sont incompatibles. Il faut distinguer mensonge défensif, faux témoignage et responsabilité dans le fait principal.',mood:'Procédure froide, vérité sous pression.',min:5,max:5,sound:'court',mechanics:['Témoignages incompatibles','Preuve procédurale','Responsabilité distincte du mensonge']},
{id:'009',title:'LE SUJET 17',short:'Il ne se souvient réellement pas. Cela ne change pas ce qu’il a fait.',context:'Le Dr Gabriel Varenne a poursuivi une expérience coercitive après retrait du consentement. Une chute provoque ensuite une véritable amnésie rétrograde péri-traumatique.',mood:'Clinique, rationnel, terrifiant.',min:5,max:5,sound:'clinical',mechanics:['Amnésie authentique','Consentement retiré','Preuves neuropsychologiques']},
{id:'010',title:'LE BRUIT DES MURS',short:'Quelqu’un a ouvert la porte. Quelqu’un a compris. Puis la porte s’est refermée.',context:'Nora Weiss est enfermée derrière un mur technique. Quelqu’un ouvre la porte bien plus tard, comprend qu’elle est vivante, puis la referme.',mood:'Étouffant, domestique, cruel.',min:5,max:5,sound:'walls',mechanics:['Porte 13:54','Identité à reconstruire','Abandon volontaire']},
{id:'011',title:'36 HEURES',short:'Des ordres, des omissions, des villages disparus. Personne ne porte la même part.',context:'Une opération militaire fictive laisse des villages détruits et des disparus. Le verdict doit distinguer autorité, connaissance, participation, omission et dissimulation.',mood:'Administratif, lourd, moralement insoutenable.',min:5,max:5,sound:'war',mechanics:['Responsabilité graduée','Chaîne de commandement','Pas de coupable unique']},
{id:'012',title:'FIDÈLES',short:'Une communauté dit protéger les siens. Sacha voulait simplement partir.',context:'Sacha Morel veut quitter une communauté fermée. Il est battu et enfermé pendant près de vingt heures avant de s’échapper.',mood:'Emprise, foi de façade, peur réelle.',min:5,max:5,sound:'cult',mechanics:['Ordre ambigu','Exécution matérielle','Non-intervention']},
{id:'013',title:'LIGNE DE MIRE',short:'Un président tombe. Le tireur n’explique pas qui a rendu le tir possible.',context:'Le président Kessler est assassiné par un tireur payé. Il faut distinguer qui a tiré, qui a voulu sa mort et qui a rendu l’opération possible.',mood:'Politique, tendu, exposé.',min:5,max:6,sound:'sniper',mechanics:['Procureur','Réseau PERSEUS','Trois nœuds de responsabilité']},
{id:'014',title:'SOUS SECRET',short:'Onze vies exposées. Un service contaminé par ses propres secrets.',context:'Une fuite met en danger onze informateurs et leurs familles. Les responsabilités se croisent entre protection, silence institutionnel et second crime.',mood:'Paranoïa froide, contre-espionnage.',min:5,max:6,sound:'intelligence',mechanics:['Couvertures croisées','Contre-information','Secret d’État']},
{id:'015',title:'AVANT LA MORT',short:'À l’hôpital, certains patients ont été traités comme des morts avant de l’être.',context:'Une médecin qui enquêtait sur le programme ÉLIGIBLES est tuée. Des patients encore récupérables ont été traités comme des morts en devenir.',mood:'Hôpital silencieux, violence administrative.',min:5,max:7,sound:'hospital',mechanics:['Journaliste facultatif','Juge facultatif','Trames institutionnelles']},
{id:'016',title:'LE DERNIER ÉTAGE',short:'Une humiliation filmée s’arrête. Le meurtre, lui, commence après.',context:'Une victime liée à un réseau de narcotiques est droguée, filmée et humiliée, puis tuée plus tard hors caméra. Quelqu’un peut aussi l’avoir abandonnée vivante.',mood:'Règlement de compte sale, presque documentaire.',min:5,max:8,sound:'elevator',mechanics:['Avocat possible','Humiliation ≠ meurtre','Abandon tardif']},
{id:'017',title:'LE PRIX DU SILENCE',short:'Un survivant est sorti. Quelqu’un d’autre a payé le prix de sa liberté.',context:'Un ancien comptable d’un réseau est enlevé avec un proche. Le comptable meurt. Le proche survit après avoir acheté sa liberté au prix d’un secret.',mood:'Trahison, négociation, loyauté impossible.',min:7,max:8,sound:'betrayal',mechanics:['Procureur jusqu’à 2 entretiens','Témoin obligatoire','Accords engageants']},
{id:'018',title:'LES ASSIETTES VIDES',short:'Neuf assiettes vides. Neuf noms. Une scène qui ment sur l’endroit où tout a commencé.',context:'L’ancien directeur d’un foyer abusif est retrouvé mort devant neuf assiettes vides portant les noms d’anciens résidents. La scène ment partiellement.',mood:'Lieu vide, objets ordinaires, horreur matérielle.',min:6,max:6,sound:'forensics',mechanics:['Inspecteur terrain','Scène déplacée','Choix de piste par cycle']},
{id:'019',title:'LE GRAND BAL',short:'Sous les lustres, un lanceur d’alerte meurt avant de remettre son dossier.',context:'Lors d’un gala d’élite, un homme prêt à révéler le détournement de fonds de reconstruction est retrouvé mort. Pouvoir, presse, justice et défense s’affrontent.',mood:'Élégant en surface, institutionnel et pourri dessous.',min:9,max:9,sound:'ball',mechanics:['Avocat obligatoire','Procureur','Juge','Journaliste']},
{id:'020',title:'L’APOTHÉOSE',short:'327 morts. Des portes encore ouvrables. Plusieurs décisions impossibles à isoler.',context:'Un incendie dévaste le Bal des Fondateurs. 327 personnes meurent. Les portes sont restées fermées alors qu’une ouverture restait possible.',mood:'Effondrement total, humain et moral.',min:13,max:16,sound:'inferno',mechanics:['Architecture complète','Expert','Inspecteur','Conséquences systémiques maximales']}
];

const SCENARIO_ROLES = {
'001':{required:['Enquêteur','3 suspects'],optional:['Analyste']},
'002':{required:['Enquêteur','4 suspects'],optional:['Analyste']},
'003':{required:['Enquêteur','3 suspects'],optional:['Analyste']},
'004':{required:['Enquêteur','3 suspects'],optional:['Analyste']},
'005':{required:['Enquêteur','3 suspects'],optional:['Analyste']},
'006':{required:['Enquêteur','3 suspects'],optional:['Analyste']},
'007':{required:['Enquêteur','Analyste','3 suspects'],optional:[]},
'008':{required:['Enquêteur','Analyste','3 suspects'],optional:[]},
'009':{required:['Enquêteur','Analyste','3 suspects'],optional:[]},
'010':{required:['Enquêteur','Analyste','3 suspects'],optional:[]},
'011':{required:['Enquêteur','Analyste','3 suspects'],optional:[]},
'012':{required:['Enquêteur','Analyste','3 suspects'],optional:[]},
'013':{required:['Enquêteur','Analyste','3 suspects'],optional:['Procureur']},
'014':{required:['Enquêteur','Analyste','3 suspects'],optional:['Juge']},
'015':{required:['Enquêteur','Analyste','3 suspects'],optional:['Journaliste','Juge']},
'016':{required:['Enquêteur','Analyste','3 suspects'],optional:['Avocat','Journaliste','Juge']},
'017':{required:['Enquêteur','Analyste','Procureur','3 suspects','1 témoin'],optional:['2e témoin']},
'018':{required:['Enquêteur','Analyste','Inspecteur','3 suspects'],optional:[]},
'019':{required:['Enquêteur','Analyste','Procureur','Juge','Journaliste','Avocat','3 suspects'],optional:[]},
'020':{required:['Enquêteur','Analyste','Inspecteur','Procureur','Juge','Expert','4 suspects','Avocat','Journaliste','Témoin'],optional:['2e Avocat','2e Journaliste','2e Témoin']}
};

function playerCountLabel(sc){
 return sc.min===sc.max ? `${sc.min} joueur${sc.min>1?'s':''}` : `${sc.min}–${sc.max} joueurs`;
}
function rolesBlock(sc){
 const cfg=SCENARIO_ROLES[sc.id]||{required:[],optional:[]};
 return `<div class="roles-availability"><div class="roles-row"><span>Obligatoires</span><p>${cfg.required.map(h).join(' · ')}</p></div>${cfg.optional.length?`<div class="roles-row optional"><span>Facultatifs</span><p>${cfg.optional.map(h).join(' · ')}</p></div>`:''}</div>`;
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
maitre:{label:'Maître',win:'Protège la responsabilité exacte de tes clients.',body:'Tu défends un ou plusieurs suspects compatibles. Tu n’inventes jamais de faits et tu partages le temps de défense finale de tes clients.'},
procureur:{label:'Procureur',win:'Poursuis correctement les responsabilités sans surpayer tes accords.',body:'Tu peux mener des entretiens ciblés, négocier des accords canoniques et créer de la pression procédurale.'},
juge:{label:'Juge',win:'Rends le bon jugement final sans dépasser ta jauge de confidentialité.',body:'Tu arbitres l’accès à certaines informations protégées et leur portée judiciaire. Ton éventuel intérêt secret reste secondaire.'},
journaliste:{label:'Journaliste',win:'Publie utilement sans détruire ta crédibilité ni ton objectif.',body:'Tu peux envoyer des messages privés et publier une Breaking News maximum par cycle.'},
inspecteur:{label:'Inspecteur de terrain',win:'Choisis les bonnes pistes et aide à établir les faits matériels essentiels.',body:'Une action de terrain par cycle. Une erreur peut coûter du temps, alerter quelqu’un ou retarder une trame.'},
expert:{label:'Expert / Médecin légiste',win:'Interprète correctement les éléments techniques essentiels.',body:'Une analyse complémentaire par cycle. Tu établis des faits techniques, jamais un coupable.'},
temoin:{label:'Témoin',win:'Reste cohérent avec ta vérité et ton éventuel objectif secondaire.',body:'Tu peux être entendu pendant la fenêtre témoins. Tu peux devenir personne d’intérêt puis suspect.'},
espion:{label:'Espion',win:'Accomplis ta mission sans être démasqué.',body:'Ton rôle public reste une couverture. Être Espion ne signifie pas être le responsable principal.'}
};

const RULES = [
{title:'1. ADN du jeu',items:['Inside Grey Room est une enquête psychologique asymétrique à informations cachées.','La vérité canonique ne change jamais ; les accès, réactions, relations, timings et trames disponibles peuvent changer.','Le système fournit les circonstances ; les joueurs produisent la tragédie.']},
{title:'2. Début de partie',items:['Chaque joueur reçoit : TON RÔLE, TES POUVOIRS / LIMITES, COMMENT TU GAGNES, puis sa carte privée.','Les lettres A/B/C/D sont internes et permutées. L’interface affiche les pseudonymes à leur place.','Les cartes restent courtes, relisibles en 20–30 secondes.']},
{title:'3. Structure standard',items:['Lecture de rôle : environ 5 min.','Débrief initial Enquêteur + Analyste : 3 min.','Maximum 3 cycles. Interrogation suspect : 8 min. Débrief : 3 min.','Les trames arrivent après le premier interrogatoire ; aucune trame ne résout seule l’affaire.']},
{title:'4. MJ adaptatif',items:['À chaque cycle, l’Enquêteur et l’Analyste répondent à de très courts QCM.','Le MJ choisit parmi des trames préécrites compatibles avec le canon. Il n’invente jamais une preuve officielle.','Si le groupe converge trop vite, le MJ privilégie une vraie ambiguïté canonique ; s’il est perdu, il privilégie une trame structurante.','Une mauvaise décision réaliste n’est pas bloquée : elle modifie l’état de la partie. Seules les actions matériellement ou temporellement impossibles sont bloquées.']},
{title:'5. Communications',items:['Le Canal Enquête réunit les rôles d’enquête autorisés présents.','L’Analyste peut envoyer des observations silencieuses pendant les interrogatoires.','L’Enquêteur peut activer un flux vidéo en direct pour les rôles autorisés présents, sans enregistrement ni replay.','Une coupure confidentielle peut suspendre le flux pendant 60 secondes maximum par cycle.']},
{title:'6. Rôles spéciaux',items:['Procureur : 1 entretien réussi par cycle en règle générale ; dans le dossier 017, jusqu’à 2 entretiens avec deux personnes différentes.','Juge : jauge de confidentialité de 5 points et jugement final propre.','Journaliste : 1 Breaking News maximum par cycle, 3 au total ; messages privés libres.','Inspecteur : 1 action de terrain par cycle.','Expert : 1 analyse complémentaire par cycle ; rôle joueur garanti dans le dossier 020.','Témoins : fenêtre globale de 4 minutes par cycle, partagée s’ils sont deux.','Avocat : peut défendre plusieurs clients compatibles ; obligatoire dans le dossier 019.']},
{title:'7. Fin de partie',items:['ENQUÊTE CLOSE : plus de nouvelles trames, analyses ou actions.','Conclusions orales provisoires : Analyste puis Enquêteur, puis Procureur s’il est présent.','Dernières défenses : environ 5 min par suspect formellement accusé ; l’Avocat partage ce temps avec son client.','Dernier débrief : Enquêteur + Analyste, avec Procureur si approprié.','Enfin, chacun verrouille son choix sur son propre téléphone avant la révélation.']},
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
 '001':'Un homme est retrouvé mort dans une chambre d’hôtel. Trois personnes liées à cette nuit donnent des versions qui ne s’accordent pas.',
 '002':'Après la mort de Léon, l’enquête porte moins sur un geste unique que sur les responsabilités de ceux qui l’entouraient.',
 '003':'Une attaque biologique frappe une gare et renvoie à un programme expérimental. Il faut reconstruire une chaîne de décisions avant qu’elle ne soit enterrée.',
 '004':'Sofia a appelé à l’aide. Trois personnes ont reçu son appel, mais aucune n’est venue. L’enquête doit comprendre pourquoi.',
 '005':'Une victime est découverte dans une mise en scène au masque blanc. Le décor paraît cohérent, mais les intentions derrière lui ne le sont peut-être pas.',
 '006':'Cinq ans après un drame dans un chalet isolé, d’anciens amis sont réunis autour d’un souvenir que personne ne raconte de la même façon.',
 '007':'Un héritage tendu rassemble une famille autour de secrets anciens. Puis un décès change brutalement le sens de l’affaire.',
 '008':'Plusieurs personnes ont juré de dire vrai, pourtant leurs déclarations sont incompatibles. Il faut distinguer mensonge, peur et responsabilité.',
 '009':'Le programme expérimental ORPHÉE est au cœur d’un incident impliquant le Sujet 17. Consentement, mémoire et responsabilité scientifique vont devoir être séparés.',
 '010':'Nora a été retrouvée après avoir été enfermée dans une pièce dissimulée. L’enquête doit reconstruire qui a perçu sa présence, qui savait quoi et à quel moment.',
 '011':'Une opération militaire fictive s’achève sur une catastrophe. Ordres, exécution, omissions et rapports se croisent sans désigner un responsable unique.',
 '012':'Sacha voulait quitter une communauté fermée. Ce qui s’est passé ensuite oblige chacun à répondre de sa loyauté, de son silence et de ses actes.',
 '013':'Un assassinat politique bouleverse une opération de renseignement. Le tireur n’est qu’une partie d’un réseau où commandement, manipulation et opportunisme se confondent.',
 '014':'Une fuite expose onze informateurs et leurs familles. Dans un service fondé sur le secret, chacun doit expliquer ce qu’il a protégé — ou laissé échapper.',
 '015':'Un médecin est retrouvé mort dans un hôpital où le programme ÉLIGIBLES soulève déjà des questions. Médecine, institution et pression publique s’entremêlent.',
 '016':'Une humiliation filmée précède un meurtre. Entre diffusion, représailles et abandon, l’enquête doit établir où commence la responsabilité de chacun.',
 '017':'Un enlèvement se termine par une mort et un survivant. La liberté obtenue sous menace laisse derrière elle un secret et une dette morale.',
 '018':'L’ancien directeur d’un foyer abusif est retrouvé mort devant neuf assiettes vides. La scène semble raconter une histoire, mais tout n’y est pas authentique.',
 '019':'Lors d’un grand gala, un lanceur d’alerte meurt avant de remettre un dossier compromettant. Sous les lustres, influence, justice, presse et argent se surveillent.',
 '020':'Un incendie fait 327 morts dans une grande salle. Plusieurs portes, systèmes et décisions deviennent les pièces d’un dossier où aucune preuve ne suffit seule.'
};
const CANONICAL_BRIEFINGS = Object.freeze({...PUBLIC_LOBBY_SUMMARIES});
function publicScenarioSummary(id){return PUBLIC_LOBBY_SUMMARIES[id]||scenario(id).short}
function canonicalBriefingText(id){return CANONICAL_BRIEFINGS[id]||publicScenarioSummary(id)}

const STATE={view:'home',selectedScenario:'001',scenarioId:'001',room:null,token:null,hostToken:null,playerId:null,playerPseudo:'',role:'suspect',players:[],cycle:0,tab:'card',createListScrollY:0,sync:null,syncSig:'',syncBusy:false,watcher:null,lastEventId:0,lastRoleNoticeKey:'',syncPromise:null,serverOffset:0};
const VIDEO={pcs:new Map(),localStream:null,remoteStream:null,lastSignalId:0,poller:null,starting:false,lastViewerReadyAt:0};
const INTRO={active:true,playing:false,done:false,lastActivation:0};
const AVATARS={map:new Map(),sig:''};
const BRIEFING={spokenKey:null,timer:null,scoreStarted:false};
const NARRATION={generation:0,enabled:pref('igr_v11_narration',true),primed:false,speaking:false,retryTimer:null};

function primeNarrationFromGesture(){
 if(!NARRATION.enabled||NARRATION.primed||STATE.view==='briefing'||!('speechSynthesis'in window))return;
 try{
  const synth=window.speechSynthesis;
  synth.resume?.();
  const u=new SpeechSynthesisUtterance('\u00a0');
  u.lang='fr-FR';u.volume=0;u.rate=10;u.pitch=1;
  u.onend=u.onerror=()=>{NARRATION.primed=true};
  synth.speak(u);NARRATION.primed=true;
 }catch(e){console.warn('narration prime',e)}
}
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
   startIntroSequence();
 };
 btn.addEventListener('click',activate);
 setIntroHint('TOUCHEZ POUR ENTRER');
}
function showIntroGate(message='TOUCHEZ POUR OUVRIR LA PORTE'){
 const gate=byId('introGate'),btn=byId('introEnterBtn');
 if(!gate)return;
 // Kill any stale scheduler before the next user gesture. This is important on iOS
 // after the PWA has been backgrounded or reopened from the Home Screen.
 if(SOUND.started)stopAmbient();
 INTRO.active=true;INTRO.playing=false;INTRO.done=false;
 gate.classList.remove('done','opening','audio-error');
 gate.setAttribute('aria-hidden','false');
 if(btn){btn.disabled=false;btn.removeAttribute('aria-busy')}
 byId('app').inert=true;
 setIntroHint(message);
}
function hideIntroImmediately(){
 const gate=byId('introGate');if(!gate)return;
 gate.classList.add('done');gate.setAttribute('aria-hidden','true');
 INTRO.active=false;INTRO.done=true;INTRO.playing=false;byId('app').inert=false;
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
 gate.classList.remove('audio-error');
 requestAnimationFrame(()=>gate.classList.add('opening'));
 void wakeAudioFromGesture().then(awake=>{if(awake&&INTRO.playing)playDoorOpenFx()}).catch(()=>{});
 const finishDoorEntry=()=>{
   if(!INTRO.playing)return;
   gate.classList.add('done');gate.classList.remove('opening');gate.setAttribute('aria-hidden','true');
   INTRO.active=false;INTRO.done=true;INTRO.playing=false;byId('app').inert=false;
   if(btn){btn.disabled=false;btn.removeAttribute('aria-busy')}
   byId('app').querySelector('button,[tabindex]')?.focus({preventScroll:true});
   if(SOUND.enabled)ensureAmbient(activeSoundPreset());
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
function roleInfo(r){return ROLE_INFO[r]||ROLE_INFO.suspect}
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
  if(name==='igr_v4_sync'&&data.server_now)STATE.serverOffset=Date.parse(data.server_now)-(started+Date.now())/2;
  return data;
 }finally{clearTimeout(timer)}
}

function shell(content,homeLocked=false){
 document.documentElement.classList.toggle('home-locked',homeLocked);
 document.body.classList.toggle('home-locked',homeLocked);
 return`<div class="app ${homeLocked?'app-home-locked':''}"><div class="topbar"><div class="brand"><img src="assets/apple-touch-icon-v9.png?v=${VERSION}" alt="logo"><div><div class="brand-title">Inside Grey Room</div><div class="brand-sub">thriller psychologique</div></div></div>${homeLocked?'':`<div class="top-actions"><button class="pill-btn" onclick="openSettings()">Paramètres</button></div>`}</div>${content}</div>`
}

function renderHome(){
 byId('app').innerHTML=shell(`
  <div class="home home-v10-13">
    <section class="hero-image hero-image-home hero-image-home-v10-13">
      <img src="${HOME_ART}" alt="Scénographie Inside Grey Room">
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
      <button class="home-settings-link" onclick="openSettings()">⚙ Paramètres</button>
    </section>
  </div>`,true);
 if(SOUND.enabled)ensureAmbient('menu');
}
function goHome(){STATE.view='home';if(STATE.room)saveSession();renderHome()}
function goCreate(){STATE.view='create-list';saveSession();renderCreateList()}
function goJoin(){STATE.view='join';saveSession();renderJoin()}
function goRules(){STATE.view='rules';saveSession();renderRules()}
function goProfile(){STATE.view='profile';saveSession();renderProfile()}

function renderCreateList(){
 byId('app').innerHTML=shell(`<main class="page page-create-v10-13"><div class="page-head"><div><div class="kicker">Créer une partie</div><h1>Choisissez un scénario</h1></div><button class="btn ghost small" onclick="goHome()">← Accueil</button></div><section class="panel scenario-panel-v10-13"><div class="scenario-list scenario-list-v10-13">${SCENARIOS.map(sc=>`<article id="scenario-${sc.id}" class="scenario scenario--art scenario--compact" role="button" tabindex="0" onclick="selectScenario('${sc.id}')"><div class="scenario-thumb compact"><img loading="lazy" decoding="async" src="${scenarioThumbArt(sc.id)}" alt="${h(sc.title)}"></div><div class="scenario-body compact"><div class="scenario-id">Dossier ${h(sc.id)}</div><h3>${h(sc.title)}</h3><p>${h(sc.short)}</p><div class="tag-row"><span class="tag">${h(playerCountLabel(sc))}</span></div></div></article>`).join('')}</div></section></main>`)
}
function selectScenario(id){
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
 byId('app').innerHTML=shell(`<main class="page page-confirm-v10-13"><div class="page-head"><div><div class="kicker">Dossier ${h(sc.id)}</div><h1>${h(sc.title)}</h1></div><button class="btn ghost small" onclick="backToScenarioList()">← Scénarios</button></div><section class="panel confirm-panel-v10-13"><div class="confirm-art"><img src="${scenarioArt(sc.id)}" alt="${h(sc.title)}"></div><div class="confirm"><p class="confirm-copy">${h(sc.context)}</p><div class="tag-row"><span class="tag">${h(playerCountLabel(sc))}</span><span class="tag">${h(sc.mood)}</span></div>${rolesBlock(sc)}<div class="field"><label for="createPseudo">Ton pseudo</label><input id="createPseudo" maxlength="22" autocomplete="nickname" autocorrect="off" spellcheck="false" value="${h(remembered)}" placeholder="Votre pseudo"></div><button class="btn primary block" onclick="createRoom()">Ouvrir la cellule</button></div></section></main>`)
}
function renderJoin(){
 const remembered=loadProfile().pseudo||STORAGE.getItem('igr_v9_last_pseudo')||'';
 byId('app').innerHTML=shell(`<main class="page"><div class="page-head"><div><div class="kicker">Rejoindre</div><h1>La cellule vous attend</h1></div><button class="btn ghost small" onclick="goHome()">← Accueil</button></div><section class="panel"><div class="confirm"><div class="field"><label for="joinPseudo">Ton pseudo</label><input id="joinPseudo" maxlength="22" autocomplete="nickname" autocorrect="off" spellcheck="false" value="${h(remembered)}" placeholder="Votre pseudo"></div><div class="field"><label for="joinCode">Code</label><input id="joinCode" maxlength="5" placeholder="ABCDE" autocapitalize="characters"></div><button class="btn primary block" onclick="joinRoom()">Rejoindre</button></div></section></main>`)
}

const PROFILE_TITLES=[
 {id:'recrue',label:'Recrue de la Cellule',desc:'Titre de départ.',ok:p=>true},
 {id:'enqueteur_gris',label:'Enquêteur Gris',desc:'Terminer un premier dossier.',ok:p=>(p.completed||0)>=1},
 {id:'lecteur_mensonges',label:'Lecteur de Mensonges',desc:'Terminer 3 dossiers.',ok:p=>(p.completed||0)>=3},
 {id:'veteran',label:'Vétéran de la Grey Room',desc:'Terminer 7 dossiers.',ok:p=>(p.completed||0)>=7},
 {id:'archiviste',label:'Archiviste des Ombres',desc:'Terminer 15 dossiers.',ok:p=>(p.completed||0)>=15},
 {id:'apotheose',label:'Survivant de l’Apothéose',desc:'Terminer le dossier 020.',ok:p=>(p.history||[]).some(x=>x.scenario==='020')},
 {id:'chef_enquete',label:'Chef d’Enquête',desc:'Terminer 3 dossiers comme Enquêteur.',ok:p=>(p.history||[]).filter(x=>x.role==='enqueteur').length>=3},
 {id:'profiler',label:'Profiler',desc:'Terminer 3 dossiers comme Analyste.',ok:p=>(p.history||[]).filter(x=>x.role==='analyste').length>=3}
];
const PROFILE_BADGES=[
 {id:'empreinte',glyph:'◉',label:'Empreinte Grise',desc:'Badge de départ.',ok:p=>true},
 {id:'dossier_scelle',glyph:'◆',label:'Dossier Scellé',desc:'Terminer 1 dossier.',ok:p=>(p.completed||0)>=1},
 {id:'oeil_doute',glyph:'◈',label:'Œil du Doute',desc:'Terminer 3 dossiers.',ok:p=>(p.completed||0)>=3},
 {id:'cellule_noire',glyph:'✦',label:'Cellule Noire',desc:'Terminer 7 dossiers.',ok:p=>(p.completed||0)>=7},
 {id:'apotheose_327',glyph:'⬢',label:'327',desc:'Terminer le dossier 020.',ok:p=>(p.history||[]).some(x=>x.scenario==='020')},
 {id:'veteran_15',glyph:'✧',label:'Dossier XV',desc:'Terminer 15 dossiers.',ok:p=>(p.completed||0)>=15}
];
function unlockedTitles(p=loadProfile()){return PROFILE_TITLES.filter(x=>x.ok(p))}
function unlockedBadges(p=loadProfile()){return PROFILE_BADGES.filter(x=>x.ok(p))}
function profileTitle(id,p=loadProfile()){return unlockedTitles(p).find(x=>x.id===id)||PROFILE_TITLES[0]}
function profileBadge(id,p=loadProfile()){return unlockedBadges(p).find(x=>x.id===id)||PROFILE_BADGES[0]}
function playerCosmeticLine(player){
 if(!player)return'';
 const badge=PROFILE_BADGES.find(x=>x.id===player.equipped_badge)||PROFILE_BADGES[0];
 const title=PROFILE_TITLES.find(x=>x.id===player.equipped_title)||PROFILE_TITLES[0];
 return `<span class="player-cosmetic"><b>${h(badge.glyph)}</b>${h(title.label)}</span>`;
}

function loadProfile(){
 try{return Object.assign({pseudo:'',avatar:'',games:0,completed:0,lastScenario:'',history:[],equippedTitle:'recrue',equippedBadge:'empreinte'},JSON.parse(STORAGE.getItem('igr_v11_profile')||'{}'))}catch{return{pseudo:'',avatar:'',games:0,completed:0,lastScenario:'',history:[],equippedTitle:'recrue',equippedBadge:'empreinte'}}
}
function saveProfileData(p){STORAGE.setItem('igr_v11_profile',JSON.stringify(Object.assign(loadProfile(),p||{})))}
function initials(name='?'){return String(name||'?').trim().split(/\s+/).slice(0,2).map(x=>x[0]||'').join('').toUpperCase()||'?'}
function safeAvatar(src){return /^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(src||'')?src:''}
function avatarSource(id){return safeAvatar(AVATARS.map.get(id)||(id===STATE.playerId?loadProfile().avatar:''))}
function avatarHtml(id,pseudo,cls=''){const src=avatarSource(id);return src?`<span class="avatar ${cls}"><img src="${src}" alt="Photo de ${h(pseudo)}"></span>`:`<span class="avatar avatar-fallback ${cls}" aria-label="${h(pseudo)}">${h(initials(pseudo))}</span>`}
function renderProfile(){
 const p=loadProfile();p.avatar=safeAvatar(p.avatar);const titles=unlockedTitles(p),badges=unlockedBadges(p),equippedTitle=profileTitle(p.equippedTitle,p),equippedBadge=profileBadge(p.equippedBadge,p);
 byId('app').innerHTML=shell(`<main class="page profile-page"><div class="page-head"><div><div class="kicker">Profil joueur</div><h1>Ton identité</h1></div><button class="btn ghost small" onclick="goHome()">← Accueil</button></div><section class="panel profile-panel"><div class="profile-avatar-wrap"><div id="profilePreview">${p.avatar?`<span class="avatar avatar-profile"><img src="${p.avatar}" alt="Photo de profil"></span>`:`<span class="avatar avatar-fallback avatar-profile">${h(initials(p.pseudo||'?'))}</span>`}</div><div><h2>${h(p.pseudo||'Nouveau joueur')}</h2><div class="profile-equipped-line"><span class="equipped-badge">${h(equippedBadge.glyph)}</span><span>${h(equippedTitle.label)}</span></div><p>Ta photo, ton badge et ton titre peuvent apparaître avec ton pseudo pendant les parties. Ils ne révèlent jamais ton rôle secret.</p></div></div><div class="field"><label for="profilePseudo">Pseudo</label><input id="profilePseudo" maxlength="22" autocomplete="nickname" autocorrect="off" spellcheck="false" value="${h(p.pseudo)}" placeholder="Votre pseudo"></div><div class="profile-photo-actions"><label class="btn" for="profilePhoto">Choisir une photo</label><input id="profilePhoto" type="file" accept="image/*" hidden onchange="profilePhotoChanged(this.files?.[0])"><button class="btn ghost" onclick="removeProfilePhoto()">Supprimer la photo</button></div><div class="profile-stats"><div><b>${p.games||0}</b><span>parties lancées</span></div><div><b>${p.completed||0}</b><span>dossiers terminés</span></div><div><b>${h(p.lastScenario||'—')}</b><span>dernier dossier</span></div></div><div class="reward-section"><div class="section-title"><h2>Titre affiché</h2><span>${titles.length}/${PROFILE_TITLES.length} débloqués</span></div><div class="reward-grid">${PROFILE_TITLES.map(x=>{const unlocked=x.ok(p),active=equippedTitle.id===x.id;return `<button class="reward-card ${active?'active':''} ${unlocked?'':'locked'}" ${unlocked?`onclick="equipProfileTitle('${x.id}')"`:'disabled'}><span class="reward-state">${active?'ÉQUIPÉ':unlocked?'DISPONIBLE':'VERROUILLÉ'}</span><b>${h(x.label)}</b><small>${h(x.desc)}</small></button>`}).join('')}</div></div><div class="reward-section"><div class="section-title"><h2>Badge affiché</h2><span>${badges.length}/${PROFILE_BADGES.length} débloqués</span></div><div class="badge-grid">${PROFILE_BADGES.map(x=>{const unlocked=x.ok(p),active=equippedBadge.id===x.id;return `<button class="badge-card ${active?'active':''} ${unlocked?'':'locked'}" ${unlocked?`onclick="equipProfileBadge('${x.id}')"`:'disabled'}><span class="badge-glyph">${h(x.glyph)}</span><span><b>${h(x.label)}</b><small>${h(x.desc)}</small></span></button>`}).join('')}</div></div>${(p.history||[]).length?`<div class="profile-history"><div class="section-title"><h2>Historique récent</h2><span>${Math.min((p.history||[]).length,8)} dossiers</span></div>${(p.history||[]).slice(0,8).map(x=>`<div class="history-row"><span>Dossier ${h(x.scenario||'—')} · ${h(x.title||'')}${x.role?` · ${h(publicRoleLabel(x.role))}`:''}</span><small>${h(x.date||'')}</small></div>`).join('')}</div>`:''}<button class="btn primary block" onclick="saveProfileForm()">Enregistrer le profil</button></section></main>`)
}
function equipProfileTitle(id){const p=loadProfile();if(!unlockedTitles(p).some(x=>x.id===id))return;saveProfileData({equippedTitle:id});renderProfile();toast('Titre équipé.');pushProfileCosmetics()}
function equipProfileBadge(id){const p=loadProfile();if(!unlockedBadges(p).some(x=>x.id===id))return;saveProfileData({equippedBadge:id});renderProfile();toast('Badge équipé.');pushProfileCosmetics()}

function readImageFile(file){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(file)})}
async function compressAvatar(file){
 if(!file||!file.type?.startsWith('image/'))throw new Error('invalid image');
 const data=await readImageFile(file),img=new Image();await new Promise((res,rej)=>{img.onload=res;img.onerror=rej;img.src=data});
 const size=192,canvas=document.createElement('canvas');canvas.width=size;canvas.height=size;const ctx=canvas.getContext('2d');
 const scale=Math.max(size/img.width,size/img.height),w=img.width*scale,hg=img.height*scale;ctx.drawImage(img,(size-w)/2,(size-hg)/2,w,hg);
 let q=.76,out=canvas.toDataURL('image/jpeg',q);while(out.length>105000&&q>.38){q-=.08;out=canvas.toDataURL('image/jpeg',q)}
 if(out.length>120000)throw new Error('image too large');return out;
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
 try{const arr=await rpc('igr_v4_get_avatars',{p_code:STATE.room,p_player_token:STATE.token});AVATARS.map=new Map((arr||[]).filter(x=>x.avatar).map(x=>[x.id,x.avatar]));AVATARS.sig=sig}catch(e){console.warn('avatars',e)}
}
function markGameStarted(d){if(!d?.room?.code||d.room.status!=='playing')return;const key=`igr_v11_started_${d.room.code}`;if(STORAGE.getItem(key))return;STORAGE.setItem(key,'1');const p=loadProfile();saveProfileData({games:(p.games||0)+1,lastScenario:d.room.scenario_id})}
function markGameCompleted(d){if(!d?.room?.code||d.room.status!=='finished')return;const key=`igr_v11_completed_${d.room.code}`;if(STORAGE.getItem(key))return;STORAGE.setItem(key,'1');const p=loadProfile(),sc=scenario(d.room.scenario_id),history=[{scenario:sc.id,title:sc.title,role:d.player?.public_role||'',date:new Intl.DateTimeFormat('fr-CH',{day:'2-digit',month:'2-digit',year:'numeric'}).format(new Date())},...(p.history||[])].slice(0,20);const before=new Set([...unlockedTitles(p).map(x=>'t:'+x.id),...unlockedBadges(p).map(x=>'b:'+x.id)]);saveProfileData({completed:(p.completed||0)+1,lastScenario:d.room.scenario_id,history});const np=loadProfile(),newReward=[...unlockedTitles(np).map(x=>({k:'t:'+x.id,n:x.label})),...unlockedBadges(np).map(x=>({k:'b:'+x.id,n:x.label}))].find(x=>!before.has(x.k));if(newReward)setTimeout(()=>toast(`Récompense débloquée : ${newReward.n}`),700)}

function renderRules(){
 byId('app').innerHTML=shell(`<main class="page"><div class="page-head"><div><div class="kicker">Règles</div><h1>Cadre de jeu</h1></div><button class="btn ghost small" onclick="goHome()">← Accueil</button></div><section class="panel"><div class="rule-list">${RULES.map(r=>`<div class="rule"><h3>${h(r.title)}</h3><p>${r.items.map(i=>`• ${h(i)}`).join('<br>')}</p></div>`).join('')}</div></section></main>`)
}

function openSettings(){
 if(document.querySelector('.modal'))return;
 document.body.insertAdjacentHTML('beforeend',`<div class="modal" onclick="if(event.target===this)closeSettings()"><div class="modal-box" role="dialog" aria-modal="true" aria-label="Paramètres audio" tabindex="-1"><div class="kicker">Paramètres</div><h2 style="margin:7px 0 16px;font-size:30px">Audio</h2><div class="settings-grid"><div class="setting"><div><h4>Activer le son</h4><p>Les réglages sont audibles immédiatement.</p></div><label class="sound-check"><input id="soundOn" aria-label="Activer le son" type="checkbox" ${SOUND.enabled?'checked':''} onchange="liveSoundToggle(this.checked)"><span aria-hidden="true"></span></label></div><div class="setting"><div><h4>Voix du briefing</h4><p>Lit uniquement le résumé canonique du dossier, sans IA générative.</p></div><label class="sound-check"><input id="narrationOn" aria-label="Voix du briefing" type="checkbox" ${NARRATION.enabled?'checked':''} onchange="liveNarrationToggle(this.checked)"><span aria-hidden="true"></span></label></div><div class="setting"><div><h4>Volume général</h4><p id="masterValue">${Math.round(SOUND.master*100)} %</p></div><input id="master" aria-label="Volume général" type="range" min="0" max="1" step=".01" value="${SOUND.master}" oninput="liveSoundRange('master',this.value)"></div><div class="setting"><div><h4>Ambiance</h4><p id="ambienceValue">${Math.round(SOUND.ambience*100)} %</p></div><input id="ambience" aria-label="Ambiance" type="range" min="0" max="1" step=".01" value="${SOUND.ambience}" oninput="liveSoundRange('ambience',this.value)"></div><div class="setting"><div><h4>Effets / alertes</h4><p id="effectsValue">${Math.round(SOUND.effects*100)} %</p></div><input id="effects" aria-label="Effets et alertes" type="range" min="0" max="1" step=".01" value="${SOUND.effects}" oninput="liveSoundRange('effects',this.value)"></div></div><div class="modal-actions"><button class="btn primary small" onclick="saveSettings()">Terminé</button></div></div></div>`)
}
function closeSettings(){saveAudioPreferences();document.querySelector('.modal')?.remove();releaseDialogFocus()}
function saveAudioPreferences(){for(const k of ['master','ambience','effects'])setPref(`igr_v9_${k}`,SOUND[k]);setPref('igr_v9_sound_enabled',SOUND.enabled)}
function liveNarrationToggle(on){NARRATION.enabled=!!on;setPref('igr_v11_narration',NARRATION.enabled);if(!on)cancelBriefingVoice()}
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
 let out=null,code=null;
 for(let attempt=0;attempt<5;attempt++){
  code=newCode();
  try{out=await rpc('igr_v4_create_room',{p_code:code,p_scenario_id:sc.id,p_pseudo:pseudo});break}catch(e){if(e.code!=='23505'||attempt===4){console.error(e);return toast('Création non confirmée. Vérifie ta connexion avant de réessayer.')}}
 }
 STORAGE.setItem('igr_v9_last_pseudo',pseudo);saveProfileData({pseudo});
 Object.assign(STATE,{view:'lobby',scenarioId:sc.id,room:out.room_code||code,token:out.player_token,hostToken:out.host_token,playerId:out.player_id,playerPseudo:pseudo,role:'en_attente',tab:'card',sync:null,syncSig:''});
 saveSession();
 await pushProfileAvatar();await pushProfileCosmetics();await syncNow(true);startRoomWatcher();renderLobby();
}
async function joinRoom(){
 primeNarrationFromGesture();wakeAudioFromGesture().catch?.(()=>{});
 const pseudo=(byId('joinPseudo')?.value||'').trim(),code=(byId('joinCode')?.value||'').trim().toUpperCase();
 if(!pseudo||code.length!==5)return toast('Pseudo et code requis.');
 try{
  const out=await rpc('igr_v4_join_room',{p_code:code,p_pseudo:pseudo});
  STORAGE.setItem('igr_v9_last_pseudo',pseudo);saveProfileData({pseudo});
  Object.assign(STATE,{view:'lobby',room:out.room_code||code,token:out.player_token,hostToken:null,playerId:out.player_id,playerPseudo:pseudo,role:'en_attente',tab:'card',sync:null,syncSig:''});
  saveSession();await pushProfileAvatar();await pushProfileCosmetics();await syncNow(true);startRoomWatcher();renderLobby();
 }catch(e){console.error(e);toast('Cellule introuvable, pleine ou déjà lancée.');}
}
function syncSignature(d){
 if(!d)return'';
 const r=d.room||{},p=d.player||{},ev=d.events||[],acts=d.my_actions||[];
 return JSON.stringify([r.status,r.cycle,r.phase,r.phase_ends_at,r.state,p.public_role,p.secret_role,p.ready,p.audio_ready,p.private_state,(d.players||[]).map(x=>[x.id,x.pseudo,x.public_role,x.preferred_role,x.ready,x.avatar_rev,x.audio_ready,x.equipped_title,x.equipped_badge]),ev.length,(ev.length?ev[ev.length-1].id:0),acts,(d.pending_requests||[])]);
}
function captureDrafts(){
 const active=document.activeElement;
 return {scope:[STATE.view,STATE.tab,STATE.sync?.room?.phase].join(':'),fields:[...byId('app').querySelectorAll('input[id],textarea[id],select[id]')].filter(e=>e.type!=='file').map(e=>({id:e.id,value:e.value,checked:e.checked})),focus:active?.id,start:active?.selectionStart,end:active?.selectionEnd,scroll:window.scrollY};
}
function restoreDrafts(draft){
 if(draft.scope!==[STATE.view,STATE.tab,STATE.sync?.room?.phase].join(':'))return;
 for(const f of draft.fields){const el=byId(f.id);if(el){el.value=f.value;el.checked=f.checked}}
 const el=byId(draft.focus);if(el){el.focus({preventScroll:true});try{el.setSelectionRange(draft.start,draft.end)}catch{}}
 window.scrollTo(0,draft.scroll);
}
function connectionStatus(failed){
 let el=byId('connectionStatus');
 if(!failed){el?.remove();return}
 if(!el){el=document.createElement('div');el.id='connectionStatus';el.className='connection-status';el.setAttribute('role','status');document.body.appendChild(el)}
 el.textContent='Connexion interrompue · reconnexion automatique…';
}
async function syncNow(force=false){
 if(STATE.syncPromise){await STATE.syncPromise;if(!force)return STATE.sync;}
 const pending=performSync(force);STATE.syncPromise=pending;
 try{return await pending}finally{if(STATE.syncPromise===pending)STATE.syncPromise=null}
}
async function performSync(force=false){
 if(!STATE.room||!STATE.token||STATE.syncBusy)return STATE.sync;
 STATE.syncBusy=true;const room=STATE.room,token=STATE.token;
 try{
  const d=await rpc('igr_v4_sync',{p_code:STATE.room,p_player_token:STATE.token});
  if(STATE.room!==room||STATE.token!==token)return null;
  connectionStatus(false);
  const draft=captureDrafts();
  const sig=syncSignature(d),changed=force||sig!==STATE.syncSig;
  STATE.sync=d;STATE.syncSig=sig;
  STATE.scenarioId=d.room.scenario_id;STATE.playerId=d.player.id;STATE.playerPseudo=d.player.pseudo;STATE.role=d.player.public_role||STATE.role;STATE.players=d.players||[];STATE.cycle=d.room.cycle||0;
  saveSession();
  await refreshAvatars(d,false);markGameStarted(d);markGameCompleted(d);
  if(changed){
   const last=(d.events||[]).at(-1);if(last&&last.id>STATE.lastEventId){if(STATE.lastEventId&&['trame','breaking_news','reveal'].includes(last.event_type))playCue(last.event_type==='breaking_news'?'news':last.event_type==='reveal'?'finale':'trame');STATE.lastEventId=last.id}
   routeFromServer();restoreDrafts(draft);
   setTimeout(()=>maybeShowRoleNotice(d),60);
  }
  manageVideoState();
  return d;
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
function renderLobby(prefetched=null){
 const d=prefetched||STATE.sync;if(!d)return;
 const sc=scenario(d.room.scenario_id),count=d.players.length,min=d.room.min_players,max=d.room.max_players,remaining=Math.max(0,min-count);
 const me={...(d.players||[]).find(p=>p.id===d.player?.id),...d.player},audioMissing=d.players.filter(p=>!p.audio_ready).length,allAudioReady=audioMissing===0,roleMissing=d.players.filter(p=>!p.preferred_role).length,allRolesReady=roleMissing===0;
 const choices=roleChoiceSummary(sc,count,d.players),canStart=!!STATE.hostToken&&count>=min&&allAudioReady&&allRolesReady;
 const launchLabel=count<min?`Encore ${remaining} joueur${remaining>1?'s':''}`:!allRolesReady?`Rôles à choisir · ${roleMissing}`:!allAudioReady?`Son à préparer · ${audioMissing}`:'Lancer le dossier';
 const roleButtons=choices.map(x=>{const mine=me.preferred_role===x.id,full=x.taken>=x.cap&&!mine;return `<button class="role-choice-card ${mine?'selected':''} ${full?'full':''}" ${full?'disabled':''} onclick="chooseLobbyRole('${x.id}')"><span><b>${h(x.info.label)}</b><small>${h(x.info.body)}</small></span><em>${mine?'TON RÔLE':full?'COMPLET':`${x.taken}/${x.cap}`}</em></button>`}).join('');
 const roleRecap=choices.map(x=>`<div class="role-recap-row"><div><b>${h(x.info.label)}</b><span>${h(x.info.body)}</span></div><small>${h(x.info.win)}</small></div>`).join('');
 byId('app').innerHTML=shell(`<main class="page"><div class="page-head lobby-head"><div><div class="kicker">Cellule ${h(d.room.code)}</div><h1>${h(sc.title)}</h1><div class="lobby-case-preview"><span>APERÇU PUBLIC · SANS SPOILER</span><p class="lobby-scenario-summary">${h(publicScenarioSummary(sc.id))}</p></div></div><button class="btn ghost small" onclick="leaveRoom()">Quitter</button></div><section class="panel lobby-v11"><div class="lobby-code"><span>CODE</span><strong>${h(d.room.code)}</strong></div><div class="lobby-status"><strong>${count} présent${count>1?'s':''}</strong><span>Minimum ${min} · Maximum ${max}</span></div><div class="player-list">${d.players.map((p,i)=>`<div class="player-line lobby-player-live"><span class="player-ident">${avatarHtml(p.id,p.pseudo,'avatar-small')}<span class="lobby-player-name"><b>${i+1}. ${h(p.pseudo)}</b>${playerCosmeticLine(p)}${p.preferred_role?`<span class="lobby-role-picked">${h(publicRoleLabel(p.preferred_role))}</span>`:'<span class="lobby-role-pending">Rôle à choisir</span>'}</span></span><small class="${p.audio_ready?'audio-ready':'audio-pending'}">${p.audio_ready?'SON PRÊT':'SON À ACTIVER'}</small></div>`).join('')}</div><div class="role-choice-zone"><div class="section-title"><h2>Choisis ton rôle</h2><span>Premier choix réservé</span></div><p class="role-choice-help">Chaque joueur choisit lui-même son rôle public avant le lancement. Un rôle complet devient indisponible. Les identités secrètes et l’Espion restent cachés et attribués par le serveur.</p><div class="role-choice-grid">${roleButtons}</div><details class="role-recap"><summary>Récapitulatif des rôles de ce dossier</summary><div>${roleRecap}</div></details></div><div class="lobby-audio-check ${me.audio_ready?'ready':''}"><div><b>${me.audio_ready?'Audio préparé':'Préparer le briefing audio'}</b><span>${me.audio_ready?'Cet appareil est prêt à lire le briefing.':'Chaque joueur doit toucher ce bouton sur son propre appareil avant le lancement.'}</span></div><button class="btn ${me.audio_ready?'ghost':'primary'} small" onclick="prepareLobbyAudio()">${me.audio_ready?'Tester le son':'Activer le son'}</button></div><div class="lobby-note">Le dossier ne peut démarrer que lorsque chaque joueur a choisi un rôle disponible et préparé son audio.</div>${STATE.hostToken?`<button class="btn primary block" ${canStart?'':'disabled'} onclick="startGame()">${launchLabel}</button>`:`<div class="waiting-pulse">En attente de l’hôte…</div>`}</section></main>`);
 if(SOUND.enabled)ensureAmbient('menu');
}
async function chooseLobbyRole(role){
 try{await rpc('igr_v4_choose_role',{p_code:STATE.room,p_player_token:STATE.token,p_role:role});await syncNow(true);toast(`Rôle choisi : ${publicRoleLabel(role)}`)}catch(e){console.error(e);toast('Ce rôle vient d’être pris ou n’est pas disponible.')}
}

async function prepareLobbyAudio(){
 SOUND.enabled=true;NARRATION.enabled=true;setPref('igr_v9_sound_enabled',true);setPref('igr_v11_narration',true);
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
 const d=STATE.sync;if((d?.players||[]).some(p=>!p.preferred_role))return toast('Chaque joueur doit d’abord choisir son rôle.');if((d?.players||[]).some(p=>!p.audio_ready))return toast('Chaque joueur doit d’abord activer le son sur son téléphone.');
 cancelBriefingVoice();stopAmbient();
 try{await rpc('igr_v4_start_game',{p_code:STATE.room,p_host_token:STATE.hostToken});await syncNow(true);startRoomWatcher()}catch(e){console.error(e);toast('Impossible de lancer : vérifie le nombre de joueurs et la préparation audio.')}
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
 const key=`${d.room.code}:${d.room.phase_started_at||''}`;if(!force&&BRIEFING.spokenKey===key)return;BRIEFING.spokenKey=key;BRIEFING.scoreStarted=false;
 const sc=scenario(d.room.scenario_id),brief=canonicalBriefingText(sc.id);
 BRIEFING.timer=setTimeout(()=>{
   BRIEFING.timer=null;if(STATE.sync?.room?.phase!=='briefing')return;
   if(NARRATION.enabled&&SOUND.enabled&&('speechSynthesis'in window)){
     speakCanonicalBriefing(`Dossier ${sc.id}. ${sc.title}. ${brief}`,()=>startBriefingScenarioScore());return;
   }
   startBriefingScenarioScore();
 },620);
}
function renderBriefing(){
 const d=STATE.sync;if(!d)return;const sc=scenario(d.room.scenario_id),briefKey=`${d.room.code}:${d.room.phase_started_at||''}`;if(BRIEFING.spokenKey!==briefKey)stopAmbient();
 document.documentElement.classList.remove('home-locked');document.body.classList.remove('home-locked');
 byId('app').innerHTML=shell(`<main class="page briefing-page"><section class="briefing-cinematic"><div class="briefing-poster"><img src="${scenarioArt(sc.id)}" alt="${h(sc.title)}"><div class="briefing-poster-shade"></div><div class="briefing-stamp">DOSSIER ${h(sc.id)}</div></div><div class="briefing-card"><div class="briefing-eyebrow">MJ AUTOMATIQUE · OUVERTURE DU DOSSIER</div><h1>${h(sc.title)}</h1><div class="briefing-line"></div><p>${h(canonicalBriefingText(sc.id))}</p><div class="briefing-meta"><span>BRIEFING PUBLIC · CANONIQUE</span><b id="phaseClock">${fmtSeconds(phaseSeconds())}</b></div><small>Aucune information secrète n’est révélée. La bande-son du dossier entre après la lecture, puis les cartes privées s’ouvrent.</small></div></section>${liveSessionControls()}</main>`);
 runCanonicalBriefing();updatePhaseClock();
}

function displayRole(r,p){if(r==='suspect')return`Suspect · ${p}`;if(r==='maitre')return`Maître · ${p}`;return`${roleInfo(r).label} · ${p}`}
function valueBlock(title,value,cls=''){
 if(value==null||value===''||(Array.isArray(value)&&!value.length))return'';
 let body='';
 if(Array.isArray(value))body=value.map(v=>typeof v==='string'?`<div class="relation-line"><span>${h(v)}</span></div>`:`<div class="relation-line"><b>${h(v.pseudo||v.label||'')}</b><span>${h(v.text||JSON.stringify(v))}</span></div>`).join('');
 else if(typeof value==='object')body=Object.entries(value).map(([k,v])=>`<div class="relation-line"><b>${h(k)}</b><span>${h(typeof v==='string'?v:JSON.stringify(v))}</span></div>`).join('');
 else body=`<p>${h(value)}</p>`;
 return `<div class="private-block ${cls}"><h4>${h(title)}</h4>${body}</div>`;
}
function privateCardHtml(){
 const d=STATE.sync,p=d?.player,ps=p?.private_state||{},pub=p?.public_role||STATE.role,secret=p?.secret_role;
 const secretInfo=secret==='espion'?valueBlock('MISSION SECRÈTE',ps.secret_mission||'Ta couverture publique reste Suspect.','secret-alert'):'';
 return `<div class="private-card-v11"><div class="kicker">CARTE PRIVÉE · NE PAS MONTRER</div><h2>${h(displayRole(pub,p?.pseudo||STATE.playerPseudo))}</h2><div class="role-summary"><b>COMMENT TU GAGNES</b><span>${h(roleInfo(secret==='espion'?'espion':pub).win)}</span></div>${valueBlock('TA PLACE',ps.place)}${valueBlock('TA CHRONOLOGIE',ps.chronology)}${valueBlock('CE QUE TU CACHES',ps.hide,'danger-soft')}${valueBlock('TES REPÈRES',ps.anchors)}${valueBlock('TES RELATIONS',ps.relations)}${valueBlock('TES CLIENTS',ps.clients)}${valueBlock('TA POSITION',ps.position)}${secretInfo}<div class="private-foot">Les faits de cette carte sont canoniques. Tu peux mentir à l’oral si ton rôle le permet, mais tu ne modifies jamais la chronologie, les preuves ou les lieux.</div></div>`;
}
function renderRole(){
 const d=STATE.sync;if(!d)return;
 const me=(d.players||[]).find(x=>x.id===d.player.id),ready=!!me?.ready;
 byId('app').innerHTML=shell(`<main class="page"><section class="role-card role-card-v11">${privateCardHtml()}${ready?`<div class="waiting-pulse">Carte validée. En attente des autres joueurs…</div>`:`<button class="btn primary block" onclick="ackRole()">J’ai compris · verrouiller ma carte</button>`}</section>${liveSessionControls()}</main>`);
 if(SOUND.enabled)ensureAmbient(currentScenario().sound);
}
async function ackRole(){
 try{await rpc('igr_v4_ack_role',{p_code:STATE.room,p_player_token:STATE.token});STATE.view='game';STATE.tab='investigation';await syncNow(true);startRoomWatcher()}catch(e){console.error(e);toast('Impossible de valider la carte.')}
}
function setTab(t){STATE.tab=t;saveSession();renderGame()}
function appConfirm({title='Confirmer',text='',confirmLabel='Continuer',danger=false}={}){
 return new Promise(resolve=>{
  if(byId('actionConfirmModal')){resolve(false);return}
  const modal=document.createElement('div');modal.id='actionConfirmModal';modal.className='modal action-confirm-modal';
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

function phaseLabel(ph){return({briefing:'BRIEFING DU DOSSIER',role_reading:'LECTURE DES CARTES',initial_debrief:'DÉBRIEF INITIAL',interrogation_select:'CHOIX DE L’INTERROGATOIRE',interrogation:'INTERROGATOIRE',cycle_debrief:'DÉBRIEF DU CYCLE',annex_inspecteur:'ENTRETIEN INSPECTEUR',annex_procureur:'ENTRETIEN PROCUREUR',annex_juge:'ENTRETIEN JUGE',annex_temoin:'FENÊTRE TÉMOINS',annex_journaliste:'ENTRETIEN JOURNALISTE',annex_expert:'ENTRETIEN EXPERT',trame:'TRAME DU MJ',closed:'ENQUÊTE CLOSE',provisional_orals:'CONCLUSIONS PROVISOIRES',provisional_lock:'ACCUSATIONS PROVISOIRES',defense:'DERNIÈRES DÉFENSES',final_debrief:'DERNIER DÉBRIEF',locking:'VERROUILLAGE FINAL',reveal:'RÉVÉLATION'})[ph]||ph?.toUpperCase()||'PARTIE'}
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
function liveSessionControls(){
 if(!STATE.room)return'';
 return `<div class="live-session-controls"><button class="live-exit-btn" onclick="confirmLeaveGame(event)">✕ Quitter</button>${phaseCanAdvance()?`<button class="live-advance-btn" id="liveAdvanceBtn" onclick="advancePhaseNow(event)">Étape suivante →</button>`:''}</div>`;
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
 byId('app').innerHTML=shell(`<main class="page game-v11"><div class="page-head game-head-v11"><div><div class="kicker">Dossier ${h(sc.id)} · ${d.room.cycle?`cycle ${d.room.cycle}/3`:'préparation'}</div><h1>${h(sc.title)}</h1><div class="game-player-ident">${avatarHtml(d.player.id,d.player.pseudo,'avatar-game')}<div class="game-ident-text"><div class="role-chip">${h(displayRole(role,d.player.pseudo))}</div>${playerCosmeticLine(d.player)}</div></div></div></div><div class="phase-strip"><div><small>PHASE</small><strong>${h(phaseLabel(d.room.phase))}</strong></div><div class="server-authority">MJ AUTOMATIQUE</div><div class="phase-timer-box"><div class="phase-clock" id="phaseClock">${fmtSeconds(phaseSeconds())}</div><div class="phase-host-actions">${phaseTimerControl()}</div></div></div><div class="tabs tabs-v11">${gameTabs().map(x=>`<button class="tab ${STATE.tab===x.id?'active':''}" onclick="setTab('${x.id}')">${h(x.label)}</button>`).join('')}</div><section class="panel game-panel-v11">${renderGameTab()}</section>${liveSessionControls()}</main>`);
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
function currentTarget(){const id=STATE.sync?.room?.state?.current_target;return (STATE.sync?.players||[]).find(p=>p.id===id)}
function latestEvent(type){return [...(STATE.sync?.events||[])].reverse().find(e=>!type||e.event_type===type)}
function renderInvestigationTab(){
 const d=STATE.sync,r=d.room,me=d.player,role=me.public_role,ph=r.phase,target=currentTarget();
 let body=`<div class="phase-explain"><h2>${h(phaseLabel(ph))}</h2>${phaseInstruction(role,ph,target)}</div>`;
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
 return `<div class="action-section"><h3>Suspects restant à entendre</h3><p class="choice-helper">L’ordre affiché est tiré au sort à chaque cycle. Il ne reflète ni la culpabilité ni le degré réel de responsabilité.</p>${remaining.length?remaining.map(s=>`<button class="choice-row" onclick="startInterrogation('${s.id}')"><span>${h(s.pseudo)}</span><b>Interroger · 8 min</b></button>`).join(''):`<p>Tous les suspects ont été entendus. Le débrief va s’ouvrir automatiquement.</p>`}</div>`;
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
function renderDefenseStatus(role){const st=STATE.sync.room.state||{},q=st.defense_queue||[],i=+st.defense_index||0,item=q[i];if(!item)return`<p>Défenses en cours.</p>`;const active=STATE.playerId===item.id||role==='maitre';return`<div class="speaker-card ${active?'active':''}">${avatarHtml(item.id,item.pseudo,'avatar-small')}<small>DERNIÈRE DÉFENSE</small><strong>${h(item.pseudo)}</strong><span>5 minutes · l’Avocat éventuel partage ce temps.</span></div>`}
function levelsForm(prefix='lvl'){return STATE.sync.suspects.map(s=>`<div class="level-row"><span>${h(s.pseudo)}</span><select id="${prefix}_${s.id}"><option value="0">0 · aucune responsabilité</option><option value="1">1 · secondaire / indirecte</option><option value="2">2 · importante</option><option value="3">3 · centrale</option></select></div>`).join('')}
function collectLevels(prefix='lvl'){const o={};STATE.sync.suspects.forEach(s=>o[s.id]=+byId(`${prefix}_${s.id}`).value);return o}
function renderProvisionalForm(){if(myAction('provisional'))return`<div class="locked-state">Accusations provisoires verrouillées.</div>`;return`<div class="action-section"><h3>Degré provisoire de responsabilité</h3>${levelsForm('prov')}<button class="btn danger block" onclick="setProvisional()">Verrouiller les accusations provisoires</button></div>`}
async function setProvisional(){try{await rpc('igr_v4_set_provisional',{p_code:STATE.room,p_player_token:STATE.token,p_levels:collectLevels('prov')});await syncNow(true)}catch(e){console.error(e);toast('Accusations incomplètes ou déjà verrouillées.')}}
function renderFinalLockForm(){
 const role=STATE.sync.player.public_role;if(myAction('final_lock',null))return`<div class="locked-state">Ton choix final est verrouillé. Il ne peut plus être modifié.</div>`;
 if(role==='journaliste')return`<div class="final-form"><div class="field"><label for="finalText">Angle final publié</label><textarea id="finalText" maxlength="300" placeholder="Quel angle assumes-tu après l’enquête ?"></textarea></div><button class="btn danger block" onclick="lockFinal()">Verrouiller définitivement</button></div>`;
 const extra=role==='juge'?`<div class="field"><label for="finalConsequence">Conséquence judiciaire</label><select id="finalConsequence"><option>Responsabilité non établie</option><option>Responsabilité partielle</option><option>Responsabilité majeure</option><option>Responsabilité centrale</option></select></div>`:'';
 return `<div class="final-form"><h3>${h(role==='enqueteur'?'Verdict final':role==='analyste'?'Lecture finale':role==='procureur'?'Position finale du Procureur':'Jugement final')}</h3>${levelsForm('final')}${extra}<div class="field"><label for="finalText">Note finale courte</label><textarea id="finalText" maxlength="300"></textarea></div><button class="btn danger block" onclick="lockFinal()">Verrouiller définitivement</button></div>`;
}
async function lockFinal(){
 const role=STATE.sync.player.public_role;let payload={note:(byId('finalText')?.value||'').trim()};if(role!=='journaliste')payload.levels=collectLevels('final');if(role==='juge')payload.consequence=byId('finalConsequence')?.value||'';
 try{await rpc('igr_v4_lock_final',{p_code:STATE.room,p_player_token:STATE.token,p_payload:payload});await syncNow(true)}catch(e){console.error(e);toast('Choix déjà verrouillé ou phase terminée.')}}
function responsibilityLabel(level){return ({0:'Aucune responsabilité',1:'Secondaire / indirecte',2:'Importante',3:'Centrale'})[+level]||'Non renseignée'}
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
function renderReveal(){
 const e=latestEvent('reveal'),p=e?.payload||{};if(!p.summary&&STATE.sync.scenario.truth)p.summary=STATE.sync.scenario.truth.summary;
 const responsibilities=p.responsibilities||[],summary=revealSummaryWithNames(p.summary||'Révélation en cours…',responsibilities);
 return `<div class="reveal-v11"><div class="kicker">RÉVÉLATION</div><h2>La vérité</h2><p class="reveal-summary">${h(summary)}</p><div class="reveal-legend"><b>Lecture des responsabilités</b><span>« Réalité » = niveau canonique du dossier. « Verdict de l’Enquêteur » = niveau attribué lors du verrouillage final.</span></div>${responsibilities.map(x=>`<div class="responsibility responsibility-clear"><div class="responsibility-name">${h(x.pseudo)}</div><div class="responsibility-grid"><span><small>RÉALITÉ CANONIQUE</small><b>${x.truth_level}/3 · ${h(responsibilityLabel(x.truth_level))}</b></span><span><small>VERDICT DE L’ENQUÊTEUR</small><b>${x.enqueteur_level<0?'Non renseigné':`${x.enqueteur_level}/3 · ${h(responsibilityLabel(x.enqueteur_level))}`}</b></span></div><div class="responsibility-delta ${+x.truth_level===+x.enqueteur_level?'exact':''}">${h(responsibilityDelta(x.truth_level,x.enqueteur_level))}</div></div>`).join('')}${p.accuracy?`<div class="accuracy accuracy-clear"><span>Responsabilités évaluées exactement</span><b>${p.accuracy.exact} sur ${p.accuracy.total}</b><small>Une réponse est exacte uniquement si le niveau 0–3 correspond exactement au niveau canonique.</small></div>`:''}${(p.results||[]).map(x=>`<div class="result-line"><b>${h(x.pseudo)} · ${h(publicRoleLabel(x.role))}</b><span>${h(x.text)}</span></div>`).join('')}<button class="btn primary block" onclick="leaveRoom()">Retour à l’accueil</button></div>`;
}
function publicRoleLabel(r){return r==='maitre'?'Avocat / Maître':roleInfo(r).label||r}
function renderChannelTab(){
 const d=STATE.sync,role=d.player.public_role,canInv=canInvestigationChannel(role),enq=d.players.find(p=>p.public_role==='enqueteur'),targets=role==='journaliste'?d.players.filter(p=>p.id!==d.player.id):role==='enqueteur'?d.players.filter(p=>p.id!==d.player.id):(enq?[enq]:[]);
 return `<div class="channel-v11">${canInv?`<div class="channel-box"><div class="section-title"><h2>Canal Enquête 🔒</h2><span>200 caractères</span></div><div class="message-list">${renderMessages('investigation')}</div><div class="message-compose"><input id="invMsg" maxlength="200" placeholder="Observation courte"><button onclick="sendMessage('investigation')">Envoyer</button></div></div>`:''}<div class="channel-box"><div class="section-title"><h2>Messages privés</h2><span>${role==='journaliste'?'libres':'centrés sur l’Enquêteur'}</span></div>${targets.length?`<div class="field"><label for="privateTarget">Destinataire</label><select id="privateTarget">${targets.map(p=>`<option value="${p.id}">${h(p.pseudo)} · ${h(publicRoleLabel(p.public_role))}</option>`).join('')}</select></div><div class="message-list">${renderMessages('private')}</div><div class="message-compose"><input id="privateMsg" maxlength="200" placeholder="Message privé"><button onclick="sendMessage('private')">Envoyer</button></div>`:`<p>Aucun destinataire disponible.</p>`}</div></div>`;
}
function renderMessages(channel){return (STATE.sync.events||[]).filter(e=>e.event_type==='message'&&e.payload?.channel===channel).slice(-12).map(e=>`<div class="msg"><b>${h(e.payload?.author||'')}</b>${e.payload?.to?` → ${h(e.payload.to)}`:''}<span>${h(e.payload?.text||'')}</span></div>`).join('')||'<div class="empty-state">Aucun message.</div>'}
async function sendMessage(channel){const input=byId(channel==='investigation'?'invMsg':'privateMsg'),text=(input?.value||'').trim();if(!text)return;const target=channel==='private'?byId('privateTarget')?.value:null;try{await rpc('igr_v4_send_message',{p_code:STATE.room,p_player_token:STATE.token,p_channel:channel,p_target:target||null,p_text:text});if(input)input.value='';await syncNow(true)}catch(e){console.error(e);toast('Message non autorisé dans cette phase ou pour ce rôle.')}}
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
 stopRoomWatcher();connectionStatus(false);VIDEO.lastSignalId=0;cancelBriefingVoice();AVATARS.map.clear();AVATARS.sig='';if(VIDEO.poller){clearInterval(VIDEO.poller);VIDEO.poller=null}VIDEO.localStream?.getTracks().forEach(t=>t.stop());VIDEO.localStream=null;closeAllPeers();Object.assign(STATE,{view:'home',scenarioId:STATE.selectedScenario,room:null,token:null,hostToken:null,playerId:null,playerPseudo:'',role:'suspect',players:[],tab:'card',sync:null,syncSig:'',cycle:0});renderHome();
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
  stopRoomWatcher();const s=JSON.parse(STORAGE.getItem(sessionKey())||'null');if(!s?.room||!s?.token)return false;Object.assign(STATE,s);const d=await syncNow(true);if(!d){STATE.room=null;STATE.token=null;STATE.hostToken=null;STATE.sync=null;connectionStatus(false);return false}startRoomWatcher();return true
 }catch(e){console.error(e);clearSession();return false}
}
function renderCurrent(){if(STATE.view==='home')renderHome();else if(STATE.view==='create-list')renderCreateList();else if(STATE.view==='create-confirm')renderCreateConfirm();else if(STATE.view==='join')renderJoin();else if(STATE.view==='rules')renderRules();else if(STATE.view==='profile')renderProfile();else if(STATE.view==='lobby')renderLobby();else if(STATE.view==='briefing')renderBriefing();else if(STATE.view==='role')renderRole();else if(STATE.view==='game')renderGame()}
setupKeyboardGuard();restore().then(ok=>{if(ok)routeFromServer();else renderHome();setupIntro();if(ok)hideIntroImmediately();else showIntroGate('TOUCHEZ POUR OUVRIR LA PORTE');});
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
document.addEventListener('visibilitychange',()=>{
 if(document.visibilityState==='visible')setTimeout(handleVisibleApp,100);
});
window.addEventListener('pageshow',()=>setTimeout(handleVisibleApp,120));
window.addEventListener('focus',()=>setTimeout(handleVisibleApp,120));
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
for(const name of ['createRoom','joinRoom','startGame','chooseLobbyRole','prepareLobbyAudio','ackRole','advancePhaseNow','togglePhaseTimer','startInterrogation','endInterrogation','submitDebrief','specialAction','prosecutorRequest','respondProsecutor','witnessStatus','publishBreaking','setProvisional','lockFinal','sendMessage','activateVideo','stopVideo','confidentialCut']){
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


/* v11-20-store-candidate — PWA cache bootstrap */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js?v=v11-20-store-candidate').catch(() => {});
  }, {once:true});
}
