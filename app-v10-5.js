const VERSION = 'v10.5-stable-audio-trames';
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

const STATE={view:'home',selectedScenario:'001',scenarioId:'001',room:null,token:null,hostToken:null,playerId:null,playerPseudo:'',role:'suspect',players:[],cycle:1,tab:'briefing',mjSuggestion:null,createListScrollY:0};


(function migrateAudioDefaultV104(){
 try{
   if(localStorage.getItem('igr_v10_4_audio_default_migrated')!=='1'){
     localStorage.setItem('igr_v9_sound_enabled','true');
     localStorage.setItem('igr_v10_4_audio_default_migrated','1');
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

function pref(k,f){try{const v=JSON.parse(localStorage.getItem(k));return v??f}catch{return f}}
function setPref(k,v){localStorage.setItem(k,JSON.stringify(v))}
function h(v=''){return String(v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function byId(id){return document.getElementById(id)}
function scenario(id){return SCENARIOS.find(s=>s.id===id)||SCENARIOS[0]}
function currentScenario(){return scenario(STATE.scenarioId||STATE.selectedScenario)}
function roleInfo(r){return ROLE_INFO[r]||ROLE_INFO.suspect}
function toast(msg){const el=byId('toast');if(!el)return;el.textContent=msg;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),2200)}
function sessionKey(){return'igr_v9_session'}
function storeKey(){return`igr_v9_room_${STATE.room}`}
function readStore(){try{return JSON.parse(localStorage.getItem(storeKey())||'null')||{cycle:1,events:[],notes:{},timerEndsAt:null,breaking:0}}catch{return{cycle:1,events:[],notes:{},timerEndsAt:null,breaking:0}}}
function writeStore(x){localStorage.setItem(storeKey(),JSON.stringify(x))}
function saveSession(){localStorage.setItem(sessionKey(),JSON.stringify({view:STATE.view,selectedScenario:STATE.selectedScenario,scenarioId:STATE.scenarioId,room:STATE.room,token:STATE.token,hostToken:STATE.hostToken,playerId:STATE.playerId,playerPseudo:STATE.playerPseudo,role:STATE.role,tab:STATE.tab}))}
function clearSession(){localStorage.removeItem(sessionKey())}
function newCode(){const c='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';let x='';for(let i=0;i<5;i++)x+=c[Math.floor(Math.random()*c.length)];return x}
function headers(){return{'apikey':SUPABASE_KEY,'Authorization':`Bearer ${SUPABASE_KEY}`,'Content-Type':'application/json'}}
async function rpc(name,payload){const r=await fetch(`${API}/rpc/${name}`,{method:'POST',headers:headers(),body:JSON.stringify(payload)});if(!r.ok)throw new Error(await r.text());return r.json()}

function shell(content){return`<div class="app"><div class="topbar"><div class="brand"><img src="assets/apple-touch-icon-v9.png?v=${VERSION}" alt="logo"><div><div class="brand-title">Inside Grey Room</div><div class="brand-sub">thriller psychologique</div></div></div><div class="top-actions"><button class="pill-btn" onclick="openSettings()">Paramètres</button></div></div>${content}</div>`}

function renderHome(){
 byId('app').innerHTML=shell(`<div class="home"><section class="home-card"><h1>Inside Grey Room</h1><p class="home-copy">Une porte se ferme. Chacun connaît une partie des faits. Personne ne dit tout.</p><div class="home-actions"><div class="home-action primary" onclick="goCreate()"><div class="icon">＋</div><div><h3>Ouvrir une partie</h3><p>Ouvrir un dossier et enfermer la table avec lui.</p></div></div><div class="home-action" onclick="goJoin()"><div class="icon">↳</div><div><h3>Rejoindre une partie</h3><p>Rejoindre la cellule. Récupérer ce que toi seul dois savoir.</p></div></div><div class="home-action" onclick="goRules()"><div class="icon">≣</div><div><h3>Règles du jeu</h3><p>Le cadre. Les rôles. Les limites. La manière dont l’affaire se referme.</p></div></div></div></section></div>`);
 if(SOUND.enabled)ensureAmbient('menu');
}
function goHome(){STATE.view='home';saveSession();renderHome()}
function goCreate(){STATE.view='create-list';saveSession();renderCreateList()}
function goJoin(){STATE.view='join';saveSession();renderJoin()}
function goRules(){STATE.view='rules';saveSession();renderRules()}

function renderCreateList(){
 byId('app').innerHTML=shell(`<main class="page"><div class="page-head"><div><div class="kicker">Ouvrir une partie</div><h1>Quel dossier ouvrez-vous ?</h1></div><button class="btn ghost small" onclick="goHome()">← Accueil</button></div><section class="panel"><div class="scenario-list">${SCENARIOS.map(sc=>`<article id="scenario-${sc.id}" class="scenario" onclick="selectScenario('${sc.id}')"><div class="scenario-id">Dossier ${h(sc.id)}</div><h3>${h(sc.title)}</h3><p>${h(sc.short)}</p><div class="tag-row"><span class="tag">${h(playerCountLabel(sc))}</span></div>${rolesBlock(sc)}</article>`).join('')}</div></section></main>`)
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
 const sc=scenario(STATE.selectedScenario);const remembered=localStorage.getItem('igr_v9_last_pseudo')||'';
 byId('app').innerHTML=shell(`<main class="page"><div class="page-head"><div><div class="kicker">Dossier ${h(sc.id)}</div><h1>${h(sc.title)}</h1></div><button class="btn ghost small" onclick="backToScenarioList()">← Scénarios</button></div><section class="panel"><div class="confirm"><p class="confirm-copy">${h(sc.context)}</p><div class="tag-row"><span class="tag">${h(playerCountLabel(sc))}</span><span class="tag">${h(sc.mood)}</span></div>${rolesBlock(sc)}<div class="field"><label>Ton pseudo</label><input id="createPseudo" maxlength="22" value="${h(remembered)}" placeholder="Votre pseudo"></div><button class="btn primary block" onclick="createRoom()">Ouvrir la cellule</button></div></section></main>`)
}
function renderJoin(){
 const remembered=localStorage.getItem('igr_v9_last_pseudo')||'';
 byId('app').innerHTML=shell(`<main class="page"><div class="page-head"><div><div class="kicker">Rejoindre</div><h1>La cellule vous attend</h1></div><button class="btn ghost small" onclick="goHome()">← Accueil</button></div><section class="panel"><div class="confirm"><div class="field"><label>Ton pseudo</label><input id="joinPseudo" maxlength="22" value="${h(remembered)}" placeholder="Votre pseudo"></div><div class="field"><label>Code</label><input id="joinCode" maxlength="5" placeholder="ABCDE" autocapitalize="characters"></div><button class="btn primary block" onclick="joinRoom()">Rejoindre</button></div></section></main>`)
}
function renderRules(){
 byId('app').innerHTML=shell(`<main class="page"><div class="page-head"><div><div class="kicker">Règles</div><h1>Cadre de jeu</h1></div><button class="btn ghost small" onclick="goHome()">← Accueil</button></div><section class="panel"><div class="rule-list">${RULES.map(r=>`<div class="rule"><h3>${h(r.title)}</h3><p>${r.items.map(i=>`• ${h(i)}`).join('<br>')}</p></div>`).join('')}</div></section></main>`)
}

function openSettings(){
 document.body.insertAdjacentHTML('beforeend',`<div class="modal" onclick="if(event.target===this)closeSettings()"><div class="modal-box"><div class="kicker">Paramètres</div><h2 style="margin:7px 0 16px;font-size:30px">Audio</h2><div class="settings-grid"><div class="setting"><div><h4>Activer le son</h4><p>Les réglages sont audibles immédiatement.</p></div><label class="sound-check"><input id="soundOn" type="checkbox" ${SOUND.enabled?'checked':''} onchange="liveSoundToggle(this.checked)"><span aria-hidden="true"></span></label></div><div class="setting"><div><h4>Volume général</h4><p id="masterValue">${Math.round(SOUND.master*100)} %</p></div><input id="master" type="range" min="0" max="1" step=".01" value="${SOUND.master}" oninput="liveSoundRange('master',this.value)"></div><div class="setting"><div><h4>Ambiance</h4><p id="ambienceValue">${Math.round(SOUND.ambience*100)} %</p></div><input id="ambience" type="range" min="0" max="1" step=".01" value="${SOUND.ambience}" oninput="liveSoundRange('ambience',this.value)"></div><div class="setting"><div><h4>Effets / alertes</h4><p id="effectsValue">${Math.round(SOUND.effects*100)} %</p></div><input id="effects" type="range" min="0" max="1" step=".01" value="${SOUND.effects}" oninput="liveSoundRange('effects',this.value)"></div></div><div class="modal-actions"><button class="btn primary small" onclick="saveSettings()">Terminé</button></div></div></div>`)
}
function closeSettings(){document.querySelector('.modal')?.remove()}
function activeSoundPreset(){
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
 primeAudioOutput();
 if(!SOUND.started||SOUND.preset!==preset||audioIsStale())startAmbient(preset);
 updateGains();
 if(SOUND.ctx.state!=='running'){
   try{SOUND.ctx.resume().catch(()=>{});}catch{}
 }
}
function liveSoundToggle(on){
 SOUND.enabled=!!on;
 ensureLiveAudio();
 updateGains();
 if(SOUND.enabled){
   ensureAmbient(activeSoundPreset());
   playLevelTick(.7);
 }else stopAmbient();
}
let lastFxPreview=0;
function liveSoundRange(kind,value){
 const v=Math.max(0,Math.min(1,+value||0));
 if(kind==='master')SOUND.master=v;
 if(kind==='ambience')SOUND.ambience=v;
 if(kind==='effects')SOUND.effects=v;
 const label=byId(`${kind}Value`);
 if(label)label.textContent=`${Math.round(v*100)} %`;
 if(!SOUND.enabled){
   SOUND.enabled=true;
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
 const pseudo=byId('createPseudo')?.value.trim();if(!pseudo)return toast('Entre un pseudo.');localStorage.setItem('igr_v9_last_pseudo',pseudo);
 try{const res=await rpc('igr_v2_create_room',{p_code:newCode(),p_scenario_id:STATE.selectedScenario,p_pseudo:pseudo});const row=Array.isArray(res)?res[0]:res;Object.assign(STATE,{room:row.room_code,token:row.player_token,hostToken:row.host_token,playerId:row.player_id,playerPseudo:pseudo,role:'enqueteur',scenarioId:STATE.selectedScenario,view:'lobby',players:[],tab:'briefing'});saveSession();renderLobby();pollLobby()}catch(e){console.error(e);toast('Impossible de créer la cellule.')}
}
async function joinRoom(){
 const pseudo=byId('joinPseudo')?.value.trim(),code=byId('joinCode')?.value.trim().toUpperCase();if(!pseudo||!code)return toast('Pseudo et code requis.');localStorage.setItem('igr_v9_last_pseudo',pseudo);
 try{const res=await rpc('igr_v2_join_room',{p_code:code,p_pseudo:pseudo});const row=Array.isArray(res)?res[0]:res;const lobby=await rpc('igr_v2_lobby',{p_code:row.room_code,p_player_token:row.player_token});Object.assign(STATE,{room:row.room_code,token:row.player_token,hostToken:null,playerId:row.player_id,playerPseudo:pseudo,role:'suspect',scenarioId:lobby.room.scenario_id,view:'lobby',players:lobby.players||[]});saveSession();renderLobby();pollLobby()}catch(e){console.error(e);toast('Partie introuvable, pleine ou déjà lancée.')}
}
async function lobbyData(){try{return await rpc('igr_v2_lobby',{p_code:STATE.room,p_player_token:STATE.token})}catch(e){console.error(e);return null}}
async function myState(){try{return await rpc('igr_v2_my_state',{p_code:STATE.room,p_player_token:STATE.token})}catch(e){console.error(e);return null}}
let LOBBY_WATCH_TIMER=null;
let LOBBY_WATCH_BUSY=false;
let LOBBY_SIGNATURE='';

function lobbySignature(d){
 const room=d?.room||{};
 const players=(d?.players||[]).map(p=>`${p.id}:${p.pseudo}:${p.is_host?1:0}`).join('|');
 return `${room.status||''}:${room.scenario_id||''}:${players}`;
}
function stopLobbyWatcher(){
 if(LOBBY_WATCH_TIMER)clearTimeout(LOBBY_WATCH_TIMER);
 LOBBY_WATCH_TIMER=null;
 LOBBY_WATCH_BUSY=false;
}
function startLobbyWatcher(){
 if(STATE.view!=='lobby'||LOBBY_WATCH_TIMER||LOBBY_WATCH_BUSY)return;
 LOBBY_WATCH_TIMER=setTimeout(runLobbyWatcher,750);
}
async function runLobbyWatcher(){
 LOBBY_WATCH_TIMER=null;
 if(STATE.view!=='lobby')return;
 if(LOBBY_WATCH_BUSY){startLobbyWatcher();return}
 LOBBY_WATCH_BUSY=true;
 const d=await lobbyData();
 LOBBY_WATCH_BUSY=false;
 if(STATE.view!=='lobby')return;
 if(!d){startLobbyWatcher();return}

 if(d.room?.status==='playing'){
   stopLobbyWatcher();
   await syncRole();
   seedStore();
   STATE.view='role';
   saveSession();
   ensureAmbient(activeSoundPreset());
   renderRole();
   return;
 }

 const sig=lobbySignature(d);
 if(sig!==LOBBY_SIGNATURE)await renderLobby(d);
 startLobbyWatcher();
}
async function renderLobby(prefetched=null){
 const d=prefetched||await lobbyData();
 if(!d){stopLobbyWatcher();clearSession();goHome();return}
 STATE.players=d.players||[];
 STATE.scenarioId=d.room.scenario_id;
 LOBBY_SIGNATURE=lobbySignature(d);
 const sc=currentScenario(),me=STATE.players.find(p=>p.id===STATE.playerId)||{},requiredMin=sc.min||d.room.min_players,allowedMax=Math.min(sc.max||d.room.max_players,d.room.max_players),missing=Math.max(0,requiredMin-STATE.players.length);
 byId('app').innerHTML=shell(`<main class="page"><div class="page-head"><div><div class="kicker">Dossier ${h(sc.id)}</div><h1>${h(sc.title)}</h1></div><button class="btn ghost small" onclick="leaveRoom()">← Quitter</button></div><div class="room-grid"><section class="panel"><div class="code-box"><div class="code-lab">Code de la cellule</div><div class="code-value">${h(STATE.room)}</div></div><div style="height:12px"></div><div class="mini"><h4>Contexte</h4><p>${h(sc.context)}</p></div></section><section class="panel"><div class="section-title"><h2>Participants</h2><span>${STATE.players.length} présent${STATE.players.length>1?'s':''}</span></div><div class="lobby-limits"><span>Minimum ${requiredMin}</span><span>Maximum ${allowedMax}</span></div><div class="players">${STATE.players.map((p,i)=>`<div class="player lobby-player-live"><div><strong>${h(p.pseudo)}</strong><small>${p.is_host?'Hôte':`Joueur ${i+1}`}</small></div><span class="chip">Rôle masqué</span></div>`).join('')}</div><div style="height:14px"></div>${me.is_host?`<button class="btn ${missing?'':'primary'} block" onclick="startGame()" ${missing?'disabled':''}>${missing?`Encore ${missing} joueur${missing>1?'s':''}`:'Lancer la partie'}</button>`:`<div class="mini"><p>En attente de l’hôte.</p></div>`}</section></div></main>`);
 ensureAmbient(activeSoundPreset());
 startLobbyWatcher();
}
function seedStore(){const s=readStore();if(s.events?.length)return;const sc=currentScenario();s.cycle=1;s.breaking=0;s.timerEndsAt=null;s.events=[{type:'system',title:'OUVERTURE DU DOSSIER',text:`Les cartes privées ont été distribuées pour ${sc.title}.`,at:new Date().toISOString()},{type:'urgent',title:'CONTEXTE',text:sc.context,at:new Date().toISOString()}];writeStore(s)}
async function startGame(){if(!STATE.hostToken)return toast('Seul l’hôte peut lancer.');try{stopLobbyWatcher();await rpc('igr_v2_start_game',{p_code:STATE.room,p_host_token:STATE.hostToken});await syncRole();seedStore();STATE.view='role';saveSession();renderRole()}catch(e){console.error(e);toast('Impossible de lancer la partie.')}}
async function syncRole(){const s=await myState();if(!s)return;STATE.scenarioId=s.room.scenario_id;STATE.role=s.player.secret_role||s.player.public_role||STATE.role;return s}
function pollLobby(){startLobbyWatcher()}
function renderRole(){const sc=currentScenario(),r=roleInfo(STATE.role);byId('app').innerHTML=shell(`<main class="page"><section class="role-card"><div class="kicker">Carte privée</div><h1>${h(displayRole(STATE.role,STATE.playerPseudo))}</h1><div class="role-section"><h4>Contexte commun</h4><p>${h(sc.context)}</p></div><div class="role-section"><h4>Ton rôle</h4><p>${h(r.body)}</p></div><div class="role-section"><h4>Comment tu gagnes</h4><p>${h(r.win)}</p></div><div style="height:16px"></div><button class="btn primary block" onclick="enterGame()">J’ai compris</button></section></main>`)}
function displayRole(r,p){if(r==='suspect')return`Suspect ${p}`;if(r==='maitre')return`Maître ${p}`;return`${roleInfo(r).label} ${p}`}
function enterGame(){stopLobbyWatcher();STATE.view='game';STATE.tab='briefing';saveSession();if(SOUND.enabled)ensureAmbient(currentScenario().sound);renderGame()}
function setTab(t){STATE.tab=t;saveSession();renderGame()}
function renderGame(){const sc=currentScenario(),store=readStore();STATE.cycle=store.cycle||1;const notes=store.notes?.[STATE.playerId]||'';byId('app').innerHTML=shell(`<main class="page"><div class="page-head"><div><div class="kicker">Dossier ${h(sc.id)} · cycle ${h(STATE.cycle)}</div><h1>${h(sc.title)}</h1></div><button class="btn ghost small" onclick="openSettings()">Son</button></div><div class="tabs"><button class="tab ${STATE.tab==='briefing'?'active':''}" onclick="setTab('briefing')">Briefing</button><button class="tab ${STATE.tab==='dossier'?'active':''}" onclick="setTab('dossier')">Dossier</button><button class="tab ${STATE.tab==='rules'?'active':''}" onclick="setTab('rules')">Règles</button><button class="tab ${STATE.tab==='mj'?'active':''}" onclick="setTab('mj')">IA MJ</button><button class="tab ${STATE.tab==='timeline'?'active':''}" onclick="setTab('timeline')">Fil</button></div><div class="game-grid"><section class="panel">${renderMain()}</section><section class="panel"><div class="section-title"><h2>Pilotage</h2><span>${h(displayRole(STATE.role,STATE.playerPseudo))}</span></div><div class="mini"><h4>Chrono</h4><p>${h(timerText())}</p></div><div style="height:10px"></div><div class="tag-row"><button class="btn small" onclick="launchTimer()">8 min</button><button class="btn small" onclick="stopTimer()">Stop</button><button class="btn small" onclick="nextCycle()">Cycle suivant</button></div><div style="height:12px"></div><div class="field"><label>Notes privées</label><textarea id="notesBox">${h(notes)}</textarea></div><div style="height:10px"></div><button class="btn small block" onclick="saveNotes()">Sauvegarder</button><div style="height:14px"></div><div class="tag-row"><button class="btn small" onclick="publishBreaking()">Breaking News</button><button class="btn danger small" onclick="finalPhase()">Phase finale</button></div></section></div></main>`)}
function renderMain(){const sc=currentScenario(),store=readStore();if(STATE.tab==='briefing')return`<div class="mini"><h4>Contexte</h4><p>${h(sc.context)}</p></div><div style="height:10px"></div><div class="mini"><h4>Ton rôle</h4><p>${h(roleInfo(STATE.role).body)}</p></div><div style="height:10px"></div><div class="mini"><h4>Condition de victoire</h4><p>${h(roleInfo(STATE.role).win)}</p></div>`;if(STATE.tab==='dossier')return`<div class="mini"><h4>Ambiance</h4><p>${h(sc.mood)}</p></div><div style="height:10px"></div><div class="mini"><h4>Mécaniques</h4><p>${h(sc.mechanics.join(' · '))}</p></div>`;if(STATE.tab==='rules')return`<div class="rule-list">${RULES.map(r=>`<div class="rule"><h3>${h(r.title)}</h3><p>${r.items.map(i=>`• ${h(i)}`).join('<br>')}</p></div>`).join('')}</div>`;if(STATE.tab==='mj')return renderMJ();return`<div class="timeline">${(store.events||[]).slice().reverse().map(e=>`<div class="event ${e.type==='trame'?'trame':e.type==='urgent'?'urgent':e.type==='news'?'news':''}"><div class="event-head">${h(e.title)} · ${clock(e.at)}</div><div class="event-body">${h(e.text)}</div></div>`).join('')}</div>`}
function renderMJ(){const allowed=['enqueteur','analyste','juge','inspecteur','procureur','journaliste','expert','maitre'].includes(STATE.role);if(!allowed)return`<div class="mini"><p>Le panneau MJ est réservé aux rôles qui structurent l’enquête.</p></div>`;const names=(STATE.players||[]).map(p=>p.pseudo);return`<div class="field"><label>Profil central</label><select id="mjCentral"><option value="">Choisir</option>${names.map(n=>`<option>${h(n)}</option>`).join('')}</select></div><div style="height:10px"></div><div class="field"><label>Axe</label><select id="mjAxis"><option>chronologie</option><option>mobile</option><option>pression</option><option>alliance</option><option>mensonge</option><option>preuve</option></select></div><div style="height:10px"></div><div class="field"><label>Observation</label><textarea id="mjFree"></textarea></div><div style="height:10px"></div><button class="btn primary block" onclick="generateTrame()">Générer une trame</button>${STATE.mjSuggestion?`<div style="height:10px"></div><div class="mini"><h4>${h(STATE.mjSuggestion.title)}</h4><p>${h(STATE.mjSuggestion.text)}</p></div><div style="height:8px"></div><button class="btn block" onclick="pushTrame()">Ajouter au fil</button>`:''}`}
function generateTrame(){const n=byId('mjCentral')?.value||'un joueur',a=byId('mjAxis')?.value||'chronologie',f=(byId('mjFree')?.value||'').trim();const bank={chronologie:[`Un horaire secondaire fragilise la version de ${n} sans prouver qu’il ment sur tout.`,`Un déplacement de ${n} semble se produire plus tôt qu’annoncé.`],mobile:[`Le lien entre ${n} et la victime devient plus personnel qu’il ne l’admettait.`,`Une raison concrète d’agir apparaît autour de ${n}, sans suffire à conclure.`],pression:[`${n} avait davantage à perdre cette nuit-là que ce qui a été dit.`,`Une contrainte plus lourde explique peut-être le silence de ${n}, sans l’excuser.`],alliance:[`Deux versions semblent s’ajuster discrètement autour de ${n}.`,`Une solidarité défensive apparaît, mais elle peut protéger un secret secondaire.`],mensonge:[`Le mensonge de ${n} ressemble davantage à une protection qu’à une attaque.`,`La version de ${n} paraît trop travaillée pour être spontanée.`],preuve:[`Une pièce partielle semble accabler ${n}, mais il manque encore la partie décisive.`,`Une preuve réapparaît, assez forte pour recadrer, pas assez pour conclure.`]};const arr=bank[a]||bank.chronologie;STATE.mjSuggestion={title:`TRAME · ${a.toUpperCase()}`,text:`${arr[Math.floor(Math.random()*arr.length)]}${f?' Observation intégrée : '+f:''}`};renderGame()}
function pushTrame(){if(!STATE.mjSuggestion)return;const s=readStore();s.events.push({type:'trame',title:STATE.mjSuggestion.title,text:STATE.mjSuggestion.text,at:new Date().toISOString()});writeStore(s);STATE.tab='timeline';playCue('trame');renderGame()}
function saveNotes(){const s=readStore();s.notes=s.notes||{};s.notes[STATE.playerId]=byId('notesBox')?.value||'';writeStore(s);toast('Notes sauvegardées.')}
function launchTimer(){const s=readStore();s.timerEndsAt=new Date(Date.now()+8*60*1000).toISOString();writeStore(s);renderGame()}
function stopTimer(){const s=readStore();s.timerEndsAt=null;writeStore(s);renderGame()}
function timerText(){const s=readStore();if(!s.timerEndsAt)return'Aucun chrono';const d=new Date(s.timerEndsAt).getTime()-Date.now();if(d<=0)return'Terminé';return`${String(Math.floor(d/60000)).padStart(2,'0')}:${String(Math.floor((d%60000)/1000)).padStart(2,'0')}`}
function nextCycle(){const s=readStore();s.cycle=(s.cycle||1)+1;s.events.push({type:'system',title:`CYCLE ${s.cycle}`,text:'Nouveau cycle. Les conséquences des décisions précédentes restent actives.',at:new Date().toISOString()});writeStore(s);playCue('cycle');renderGame()}
function publishBreaking(){const s=readStore();s.breaking=s.breaking||0;if(s.breaking>=3)return toast('Limite atteinte.');s.breaking++;s.events.push({type:'news',title:'BREAKING NEWS',text:`Publication ${s.breaking}/3. Une information publique modifie la pression autour de l’affaire.`,at:new Date().toISOString()});writeStore(s);playCue('news');STATE.tab='timeline';renderGame()}
function finalPhase(){const s=readStore();s.events.push({type:'urgent',title:'PHASE FINALE',text:'Enquête close. Conclusions orales provisoires, dernières défenses, dernier débrief puis verrouillage individuel.',at:new Date().toISOString()});writeStore(s);playCue('finale');STATE.tab='timeline';renderGame()}
function clock(iso){try{return new Date(iso).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}catch{return'--:--'}}
function leaveRoom(){stopLobbyWatcher();clearSession();Object.assign(STATE,{view:'home',scenarioId:STATE.selectedScenario,room:null,token:null,hostToken:null,playerId:null,playerPseudo:'',role:'suspect',players:[],tab:'briefing'});renderHome()}

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
 SOUND.masterGain.gain.value=SOUND.enabled?Math.min(1.35,SOUND.master*1.22):0;
 // Foreground notes are intentionally much louder than the bed.
 if(SOUND.melodyGain)SOUND.melodyGain.gain.value=Math.min(1.55,SOUND.ambience*1.42);
 SOUND.ambGain.gain.value=SOUND.ambience*.48;
 SOUND.fxGain.gain.value=SOUND.effects*.52;
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
     playPiano(noteFreq(p.root,bassSemi,1.12),.023*intensity,i*eighth+.008,-pan,.36);
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
     playInstrument(stage.shadow,f,.020*intensity,when+vi*.016,(vi-1)*.16,p.root);
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
   playCrackleBurst(.038*intensity,loopDuration*(.30+Math.random()*.30),.24+Math.random()*.10);
   if(step%6===5)playCrackleBurst(.022*intensity,loopDuration*(.70+Math.random()*.12),.12+Math.random()*.07);
 }
 SOUND.scheduleAnchor=previousAnchor;
 return loopDuration;
}

function ensureAmbient(preset='menu'){
 initAudio();
 if(!SOUND.ctx||!SOUND.enabled)return;
 if(SOUND.started && SOUND.preset===preset && !audioIsStale()){
   updateGains();
   return;
 }
 // Schedule immediately. On iOS the AudioContext may remain suspended until
 // the first real touch; the notes are already armed and begin as soon as it resumes.
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
 const targetMelody=Math.min(1.55,SOUND.ambience*1.42);
 const targetAmb=SOUND.ambience*.48;
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

async function restore(){try{stopLobbyWatcher();const s=JSON.parse(localStorage.getItem(sessionKey())||'null');if(!s?.room||!s?.token)return false;Object.assign(STATE,s);const m=await myState();if(!m)return false;STATE.scenarioId=m.room.scenario_id;if(m.room.status==='playing'){STATE.view=s.view==='game'?'game':'role';seedStore()}else STATE.view='lobby';return true}catch(e){console.error(e);clearSession();return false}}
function renderCurrent(){if(STATE.view==='home')renderHome();else if(STATE.view==='create-list')renderCreateList();else if(STATE.view==='create-confirm')renderCreateConfirm();else if(STATE.view==='join')renderJoin();else if(STATE.view==='rules')renderRules();else if(STATE.view==='lobby')renderLobby();else if(STATE.view==='role')renderRole();else if(STATE.view==='game')renderGame()}
restore().then(ok=>{if(ok){renderCurrent();if(SOUND.enabled)ensureAmbient(activeSoundPreset())}else renderHome()});
setInterval(()=>{if(STATE.view==='game'&&readStore().timerEndsAt)renderGame()},1000);
let LAST_AUDIO_GESTURE=0;
function unlockAudioFromGesture(){
 if(!SOUND.enabled)return;
 const now=performance.now();
 // iOS can emit touch + pointer for the same tap; only process it once.
 if(now-LAST_AUDIO_GESTURE<90)return;
 LAST_AUDIO_GESTURE=now;

 initAudio();
 if(!SOUND.ctx)return;
 const preset=activeSoundPreset();

 primeAudioOutput();
 if(!SOUND.started||SOUND.preset!==preset||audioIsStale())startAmbient(preset);
 updateGains();
 if(SOUND.ctx.state!=='running'){
   try{SOUND.ctx.resume().catch(()=>{});}catch{}
 }
}
window.addEventListener('pointerdown',unlockAudioFromGesture,{passive:true});
window.addEventListener('touchstart',unlockAudioFromGesture,{passive:true});
window.addEventListener('keydown',unlockAudioFromGesture);

if(navigator.mediaDevices?.addEventListener){
 navigator.mediaDevices.addEventListener('devicechange',()=>{
   if(!SOUND.enabled)return;
   // WebAudio follows the system-selected output (including Bluetooth).
   // Re-check the scheduler after an output route change without restarting the score.
   setTimeout(()=>ensureLiveAudio(),180);
 });
}

document.addEventListener('visibilitychange',()=>{
 if(document.visibilityState==='visible'&&SOUND.enabled){
   initAudio();
   const recover=()=>ensureAmbient(activeSoundPreset());
   if(SOUND.ctx?.state!=='running')SOUND.ctx.resume().then(recover).catch(()=>{});
   else recover();
 }
});
// Audio watchdog: catches rare iPhone/PWA cases where WebAudio stays alive but the scheduler stops.
setInterval(()=>{
 if(!SOUND.enabled||document.visibilityState!=='visible')return;
 if(!SOUND.ctx)return;
 if(SOUND.ctx.state==='running' && audioIsStale())ensureAmbient(activeSoundPreset());
},1400);

