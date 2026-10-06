/* Inside Grey Room v34 — HÉRITAGE · MAÎTRE data */
(()=>{
'use strict';
const META=Object.freeze({
  id:'maitre',title:'MAÎTRE',subtitle:'Droit pénal · Réputation · Dossier vivant',
  cover:'assets/heritage-maitre-01-le-client.webp?v=v34-maitre',
  promise:'Construisez une défense. Laissez des traces. Assumez ce qu’elles deviendront.',
  heritage:'Héritage de la défense',mechanic:'LES TRACES · L’ANGLE · LA DÉMONSTRATION',
  chapters:Object.freeze([
    Object.freeze({n:1,title:'LE CLIENT',poster:'assets/heritage-maitre-01-le-client.webp?v=v34-maitre',note:'Fraude fiscale, soupçons de stupéfiants et entourage beaucoup plus sale que le dossier ne le laisse croire.'}),
    Object.freeze({n:2,title:'LE DEAL',poster:'assets/heritage-maitre-02-le-deal.webp?v=v34-maitre',note:'Un lien devient certain. Le parquet veut un nom en échange d’une porte de sortie.'}),
    Object.freeze({n:3,title:'DEUX CHOIX',poster:'assets/heritage-maitre-03-deux-choix.webp?v=v34-maitre',note:'Le second mis en cause vient du même réseau. Une défense commune commence à se fissurer.'}),
    Object.freeze({n:4,title:'LE PROCÈS',poster:'assets/heritage-maitre-04-le-proces.webp?v=v34-maitre',note:'Le parquet transforme quatre dossiers en une seule théorie. Chaque ancienne phrase peut revenir.'}),
    Object.freeze({n:5,title:'L’HONNEUR',poster:'assets/heritage-maitre-05-l-honneur.webp?v=v34-maitre',note:'Le résultat final juge autant le dossier que l’avocat que vous êtes devenu.'})
  ])
});

const VARIANTS=Object.freeze({
  fiscal:{label:'TRAME A',clientTruth:'Le Client a réellement dissimulé des revenus, mais l’entourage a utilisé sa proximité et certaines structures sans qu’il connaisse l’étendue des crimes.',clientKnowledge:'Connaissance fragmentaire : il sait que certaines affaires sont opaques, pas ce qu’elles recouvrent toutes.'},
  blind:{label:'TRAME B',clientTruth:'Le Client a volontairement fermé les yeux sur l’origine de certains flux et a profité d’un système dont il soupçonnait la nature criminelle.',clientKnowledge:'Aveuglement volontaire : il n’organise pas les crimes les plus graves, mais évite délibérément les questions.'},
  link:{label:'TRAME C',clientTruth:'Le Client a facilité une partie des flux liés au trafic et ment sur ce qu’il savait, sans être l’auteur des violences commises par son entourage.',clientKnowledge:'Complicité financière limitée : participation réelle sur certains flux, responsabilité distincte des crimes violents du réseau.'}
});

const ROLES=Object.freeze([
  {id:'avocat',name:'AVOCAT',public:'Vous défendez le Client. Votre force vient de l’angle que vous construisez, pas d’une vérité fournie par l’application.'},
  {id:'client',name:'CLIENT',public:'Vous êtes le point d’entrée du dossier. Vous n’êtes pas automatiquement le centre du réseau et vous ne dites pas forcément tout à votre avocat.'},
  {id:'enqueteur',name:'ENQUÊTEUR',public:'Vous devez établir la place exacte du Client : proximité, connaissance, bénéfice, aveuglement, complicité ou responsabilité directe.'},
  {id:'procureur',name:'PROCUREUR',public:'Vous transformez ce qui est légalement exploitable en théorie d’accusation, sans disposer de la réalité des faits complète.'},
  {id:'juge',name:'JUGE',public:'Vous ne connaissez jamais la réalité des faits. Vous tranchez uniquement sur ce qui vous a été présenté et ce qui a survécu à la discussion.'},
  {id:'associe',name:'ASSOCIÉ',public:'Vous appartenez à l’entourage du Client. À partir du dossier III, vous pouvez devenir le second mis en cause défendu par le même avocat.'},
  {id:'temoin',name:'TÉMOIN / EXPERT',public:'Vous détenez une pièce de contexte : comptabilité, chronologie, relation ou témoignage qui peut déplacer la lecture du dossier.'}
]);

const PACK=Object.freeze({
  min:5,max:7,theme:'DROIT PÉNAL / DÉFENSE',
  chapters:Object.freeze({
    1:Object.freeze({
      title:'LE CLIENT',
      briefing:'Une enquête fiscale sur l’activité du Client révèle des espèces non déclarées, plusieurs téléphones, des rendez-vous difficiles à expliquer et des liens avec des personnes soupçonnées de trafic. En remontant l’entourage, les enquêteurs découvrent aussi des personnes associées à des faits bien plus graves — financement de gangs, séquestration, exploitation ou violences — sans que ces crimes puissent être automatiquement imputés au Client. Le problème n’est pas de décider si le Client est « propre » : il faut déterminer exactement ce qu’il savait, ce dont il a profité et ce qu’il a réellement permis.',
      question:'Quelle place le dossier permet-il réellement d’attribuer au Client ?',
      cycles:[
        ['CYCLE I · AUDITION','Avocat, Client et Enquêteur ouvrent le dossier. Séparez chaque fait brut de l’interprétation qu’on lui donne. Le Client peut demander un entretien confidentiel avec son Avocat avant de répondre.'],
        ['CYCLE II · L’ANGLE','L’Enquêteur choisit la piste qu’il veut approfondir : argent, communications, déplacements ou entourage. L’Avocat formule ensuite son ANGLE et, s’il le souhaite, une DÉMONSTRATION qui rend cette lecture testable.'],
        ['CYCLE III · AUDIENCE','Le Procureur assemble les liens ; l’Avocat attaque les raccourcis ; l’Enquêteur justifie ses choix. Le Juge ne tranche que sur ce qui a été établi devant lui. Une démonstration fragile peut être retournée par le Procureur.']
      ],
      outcomes:[
        {id:'fiscal_only',title:'FAUTE FISCALE · LIEN CRIMINEL NON ÉTABLI',detail:'La dissimulation fiscale est retenue, mais le dossier ne démontre pas que le Client connaissait ou participait au trafic.',reputation:'TECHNIQUE',facts:[['fraude_fiscale','Fraude / dissimulation fiscale','established'],['trafic_client','Participation du Client au trafic','contested']],links:[['client_associe','CLIENT','ASSOCIÉ','probable','Relation financière réelle, connaissance du trafic non démontrée']],trace:'L’Avocat a séparé une faute réelle d’une accusation plus large.'},
        {id:'blindness',title:'AVEUGLEMENT VOLONTAIRE',detail:'Le Client n’est pas placé au centre du réseau, mais plusieurs éléments rendent crédible qu’il ait choisi de ne pas savoir.',reputation:'PRAGMATIQUE',facts:[['fraude_fiscale','Irrégularités fiscales','established'],['connaissance_opaque','Connaissance d’activités opaques','probable']],links:[['client_associe','CLIENT','ASSOCIÉ','established','Flux et relation établis ; contenu exact encore contesté']],trace:'La campagne retient que le Client a bénéficié d’une opacité qu’il n’a pas cherchée à dissiper.'},
        {id:'active_link',title:'LIEN ACTIF AU RÉSEAU',detail:'Le Juge considère qu’un lien actif avec certains flux criminels est suffisamment étayé, sans imputer au Client les crimes plus graves de son entourage.',reputation:'AUDACIEUX',facts:[['fraude_fiscale','Irrégularités fiscales','established'],['trafic_client','Participation à certains flux liés au trafic','probable']],links:[['client_associe','CLIENT','ASSOCIÉ','established','Coopération financière établie']],trace:'Le dossier distingue une implication financière des violences commises ailleurs dans le réseau.'}
      ]
    }),
    2:Object.freeze({
      title:'LE DEAL',
      briefing:'Un lien de l’entourage devient beaucoup plus solide. Le parquet possède désormais une pièce exploitable contre une personne plus dangereuse que le Client et propose une coopération. La question n’est plus seulement ce que le Client a fait : que savait-il, depuis quand, et qui est-il prêt à exposer pour réduire son propre risque ?',
      question:'Quelle stratégie le Client et son Avocat inscrivent-ils dans l’Héritage ?',
      cycles:[
        ['CYCLE I · POSITION','L’Enquêteur présente ce qui a survécu au dossier I. Le Client doit décider ce qu’il reconnaît, ce qu’il conteste et ce qu’il refuse encore d’expliquer.'],
        ['CYCLE II · NÉGOCIATION','Le Procureur formule une offre. L’Avocat peut négocier les contours, proposer une coopération ciblée ou refuser. Le Client garde le dernier mot.'],
        ['CYCLE III · VALIDATION','Le Juge vérifie ce que l’accord établit réellement. Une concession obtenue aujourd’hui peut devenir une déclaration opposable au dossier III.']
      ],
      outcomes:[
        {id:'deliver',title:'COOPÉRATION CONTRE L’ASSOCIÉ',detail:'Le Client fournit une information qui fragilise directement l’Associé. Il obtient une concession, mais la confiance est rompue.',reputation:'NÉGOCIATEUR',facts:[['deal_cooperation','Coopération du Client avec le parquet','established']],relations:{associe:'broken'},trace:'L’Associé a été exposé en échange d’une concession.'},
        {id:'protect',title:'REFUS · L’ASSOCIÉ EST PROTÉGÉ',detail:'Le Client refuse de livrer l’Associé. La défense reste plus unie, mais l’accusation conserve une théorie plus large contre les deux.',reputation:'LOYAL',facts:[['deal_refusal','Refus de coopération contre l’Associé','established']],relations:{associe:'aligned'},trace:'Le Client a accepté un risque supérieur pour ne pas compromettre l’Associé.'},
        {id:'targeted',title:'COOPÉRATION CIBLÉE',detail:'L’Avocat obtient que le Client coopère sur un autre maillon sans valider toute la théorie du parquet. L’Associé reste méfiant mais pas totalement sacrifié.',reputation:'STRATÈGE',facts:[['deal_targeted','Coopération limitée et ciblée','established']],relations:{associe:'conditional'},trace:'Une troisième voie a été négociée : information utile sans adhésion globale à la thèse du parquet.'}
      ]
    }),
    3:Object.freeze({
      title:'DEUX CHOIX',
      briefing:'L’Associé déjà présent dans la carte du réseau devient le second mis en cause. Il partage avec le Client des flux, des accès et plusieurs décisions passées. Les deux sont défendus par le même Avocat parce que leurs intérêts paraissent encore compatibles. Une nouvelle pièce montre pourtant qu’ils ne savaient peut-être pas les mêmes choses.',
      question:'Quelle ligne de défense commune peut encore survivre sans confondre les responsabilités ?',
      cycles:[
        ['CYCLE I · DÉFENSE COMMUNE','Avocat, Client, Associé et Enquêteur reconstituent les faits partagés. L’état de confiance hérité du DEAL est public dès le départ.'],
        ['CYCLE II · DIVERGENCE','Une pièce nouvelle attribue une connaissance différente à chacun. L’Avocat doit séparer responsabilité commune et responsabilité individuelle sans inventer une fausse preuve.'],
        ['CYCLE III · DEUX VOIX','Le Procureur tente de faire de toute contradiction une preuve de culpabilité commune. Le Juge doit déterminer ce qui peut être attribué à chacun, séparément.']
      ],
      outcomes:[
        {id:'separate',title:'RESPONSABILITÉS SÉPARÉES',detail:'La défense obtient que les actes et connaissances du Client et de l’Associé soient appréciés séparément.',reputation:'PRÉCIS',facts:[['individual_responsibility','Responsabilités individuelles distinctes','established']],relations:{associe:'strained'},trace:'La défense commune survit, mais les responsabilités ne peuvent plus être fondues en une seule histoire.'},
        {id:'common',title:'DÉFENSE COMMUNE MAINTENUE',detail:'Les deux mis en cause maintiennent une version commune. Elle les protège sur certains points mais les lie davantage pour le procès.',reputation:'LOYAL',facts:[['common_defense','Version commune maintenue','established']],relations:{associe:'aligned'},trace:'Le Client et l’Associé ont choisi de rester juridiquement liés.'},
        {id:'fracture',title:'LA DÉFENSE SE FISSURE',detail:'Le conflit d’intérêts devient visible. Une affirmation protège l’un en fragilisant l’autre ; le Procureur conservera cette contradiction.',reputation:'RISQUÉ',facts:[['defense_fracture','Contradiction entre les deux mis en cause','established']],relations:{associe:'broken'},trace:'Une contradiction interne devient une pièce du futur procès.'}
      ]
    }),
    4:Object.freeze({
      title:'LE PROCÈS',
      briefing:'Le parquet assemble les flux, les fréquentations, les déclarations et les choix précédents pour présenter une seule théorie du réseau. L’Avocat ne peut plus seulement contester des pièces isolées : il doit attaquer les enchaînements logiques qui prétendent transformer proximité et bénéfice en responsabilité pour les crimes des autres.',
      question:'Jusqu’où le procès permet-il juridiquement de relier le Client au réseau ?',
      cycles:[
        ['CYCLE I · THÉORIE DU PARQUET','Le Procureur présente une chaîne complète. L’Enquêteur doit expliquer les pistes abandonnées et les décisions prises depuis LE CLIENT.'],
        ['CYCLE II · DÉMONSTRATION','L’Avocat choisit son ANGLE final et peut construire une DÉMONSTRATION. Le Procureur dispose ensuite d’un droit de retournement : montrer que la démonstration confirme en réalité une partie de sa thèse.'],
        ['CYCLE III · JUGEMENT','Le Juge distingue ce qui est établi, probable et seulement supposé. Les décisions des trois dossiers précédents sont recevables comme histoire procédurale, pas comme vérité automatique.']
      ],
      outcomes:[
        {id:'narrow',title:'RESPONSABILITÉ LIMITÉE',detail:'Le tribunal retient certaines infractions ou aides précises mais rejette l’idée que le Client porte la responsabilité globale du réseau.',reputation:'TECHNIQUE',facts:[['trial_scope','Responsabilité du Client limitée à des faits précis','established']],trace:'La théorie globale du réseau est fragmentée au procès.'},
        {id:'network',title:'THÉORIE DU RÉSEAU RETENUE',detail:'La chaîne présentée par le parquet convainc sur une implication plus large du Client, sans confondre automatiquement celle-ci avec les crimes violents des autres.',reputation:'COMBATIF',facts:[['trial_network','Implication large dans le réseau','established']],trace:'Le procès consolide plusieurs liens qui étaient auparavant seulement probables.'},
        {id:'insufficient',title:'LIEN GLOBAL INSUFFISANT',detail:'Le tribunal refuse de transformer les relations et flux accumulés en responsabilité générale faute de chaîne probatoire suffisante.',reputation:'AUDACIEUX',facts:[['trial_network','Responsabilité globale dans le réseau','rejected']],trace:'Le parquet échoue à faire de la proximité une culpabilité globale.'}
      ]
    }),
    5:Object.freeze({
      title:'L’HONNEUR',
      briefing:'Le nom de l’Avocat est désormais attaché à cette affaire. Une dernière pièce rattache l’entourage du Client à des faits graves que les premiers dossiers ne permettaient pas d’attribuer proprement. Le Client revient avec une demande : le défendre encore, mais cette fois en sachant beaucoup mieux quel homme il est devenu aux yeux du dossier.',
      question:'Quel héritage l’Avocat choisit-il de laisser ?',
      cycles:[
        ['CYCLE I · CE QUI RESTE','Relisez les Traces : ce qui est établi, ce qui reste contesté, qui a été protégé, qui a été exposé. Aucune ancienne conclusion ne peut être effacée.'],
        ['CYCLE II · LA LIMITE','L’Avocat choisit ce qu’il peut encore défendre légalement et moralement : contester ce qui n’est pas prouvé, rechercher une coopération encadrée ou refuser une stratégie qui exigerait de tromper la procédure.'],
        ['CYCLE III · L’HONNEUR','Le Juge rend la dernière décision sur le dossier. L’épilogue, lui, porte sur l’Avocat : ce qu’il a gagné, ce qu’il a protégé et ce que son nom signifie désormais.']
      ],
      outcomes:[
        {id:'defender',title:'LE DÉFENSEUR',detail:'L’Avocat continue à exiger une preuve précise pour chaque responsabilité, même quand son Client est moralement difficile à défendre.',reputation:'DÉFENSEUR',facts:[['legacy','Héritage professionnel : défense exigeante et limites claires','established']],trace:'Le nom de l’Avocat reste associé à l’exigence de preuve plutôt qu’à l’innocence supposée de ses clients.'},
        {id:'negotiator',title:'LE NÉGOCIATEUR',detail:'L’Avocat obtient une sortie encadrée qui reconnaît une partie des responsabilités et permet d’éclaircir le rôle d’autres membres du réseau.',reputation:'NÉGOCIATEUR',facts:[['legacy','Héritage professionnel : négociation et responsabilité graduée','established']],trace:'Le cabinet est connu pour transformer des dossiers impossibles en accords précis.'},
        {id:'name',title:'LE NOM',detail:'L’Avocat remporte une bataille décisive sur la faiblesse du dossier, mais sa réputation devient indissociable des clients controversés qu’il accepte de défendre.',reputation:'LE NOM',facts:[['legacy','Héritage professionnel : victoire, réputation et coût personnel','established']],trace:'Le nom du cabinet est devenu une force — et une dette.'}
      ]
    })
  })
});

window.IGR_HERITAGE_MAITRE_DATA=Object.freeze({META,VARIANTS,ROLES,PACK});
})();
