/* Inside Grey Room v34 — HÉRITAGE · MAÎTRE data */
(()=>{
'use strict';
const META=Object.freeze({
  id:'maitre',title:'MAÎTRE',subtitle:'Droit pénal · Réputation · Dossier vivant',
  cover:'/assets/heritage-maitre-campaign-intro.webp?v=20261122-maitre-intro-v2',
  promise:'Construisez une défense. Laissez des traces. Assumez ce qu’elles deviendront.',
  definition:'Vous incarnez les différents acteurs d’une affaire pénale : défense, accusation, enquête et justice, ainsi que les personnes impliquées dans le dossier. Votre objectif dépend de votre rôle : construire une stratégie, confronter les versions et distinguer les faits établis des hypothèses. Chaque prise de position laisse des traces qui peuvent resurgir dans les dossiers suivants et façonner la réputation de l’avocat.',
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
  {id:'avocat',name:'AVOCAT',short:'Défend le Client et construit sa stratégie.',activity:5,public:'Vous défendez le Client. Votre force vient de l’angle que vous construisez, pas d’une vérité fournie par l’application.'},
  {id:'client',name:'CLIENT',short:'Défend ses actes et décide de coopérer.',activity:4,public:'Vous êtes le point d’entrée du dossier. Vous n’êtes pas automatiquement le centre du réseau et vous ne dites pas forcément tout à votre avocat.'},
  {id:'enqueteur',name:'ENQUÊTEUR',short:'Établit les faits et les responsabilités.',activity:5,public:'Vous devez établir la place exacte du Client : proximité, connaissance, bénéfice, aveuglement, complicité ou responsabilité directe.'},
  {id:'procureur',name:'PROCUREUR',short:'Construit l’accusation à partir des preuves.',activity:4,public:'Vous transformez ce qui est légalement exploitable en théorie d’accusation, sans disposer de la vérité canonique complète.'},
  {id:'juge',name:'JUGE',short:'Préside l’audience et garantit les droits.',activity:4,public:'Vous ne connaissez jamais la vérité canonique. Vous présidez l’audience, classez les éléments selon leur force probante et garantissez que la délibération collective distingue preuve, hypothèse et interprétation.'},
  {id:'associe',name:'ASSOCIÉ',short:'Défend sa version et ses intérêts.',activity:4,public:'Vous appartenez à l’entourage du Client. À partir du dossier III, vous pouvez devenir le second mis en cause défendu par le même avocat.'},
  {id:'temoin',name:'TÉMOIN / EXPERT',short:'Éclaire le dossier par des faits vérifiables.',activity:3,public:'Vous détenez une pièce de contexte : comptabilité, chronologie, relation ou témoignage qui peut déplacer la lecture du dossier.'}
]);

const PACK=Object.freeze({
  min:5,max:7,theme:'DROIT PÉNAL / DÉFENSE',
  chapters:Object.freeze({
    1:Object.freeze({
      title:'LE CLIENT',
      briefing:"Une enquête fiscale révèle des espèces non déclarées et des rendez-vous avec des personnes soupçonnées de trafic. D’autres membres de l’entourage sont liés à des faits plus graves. Rien n’établit encore que le Client connaissait ces violences. Il faut distinguer ses actes, ses bénéfices et ses connaissances.",
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
      briefing:"Le parquet détient une nouvelle pièce reliant l’entourage du Client à une personne soupçonnée de crimes plus graves. Il propose une coopération en échange d’informations vérifiables. Le Client doit distinguer ce qu’il sait réellement de ce qu’il suppose.",
      question:'Quelle stratégie le Client et son Avocat inscrivent-ils dans l’Héritage ?',
      cycles:[
        ['CYCLE I · POSITION','L’Enquêteur présente ce qui a survécu au dossier I. Le Client doit décider ce qu’il reconnaît, ce qu’il conteste et ce qu’il refuse encore d’expliquer.'],
        ['CYCLE II · NÉGOCIATION','Le Procureur formule une offre. L’Avocat peut négocier les contours, proposer une coopération ciblée ou refuser. Le Client doit consentir à toute stratégie retenue : la délibération du groupe ne peut lui imposer une coopération.'],
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
      briefing:"L’Associé devient le second mis en cause. Les deux hommes partagent des opérations financières, mais pas nécessairement les mêmes informations. Ils avaient accepté une défense commune. Une nouvelle pièce fait apparaître un possible conflit d’intérêts, que l’Avocat doit examiner.",
      question:'Quelle ligne de défense commune peut encore survivre sans confondre les responsabilités ?',
      cycles:[
        ['CYCLE I · DÉFENSE COMMUNE','Avocat, Client, Associé et Enquêteur reconstituent les faits partagés. L’état de confiance hérité du DEAL est public dès le départ.'],
        ['CYCLE II · DIVERGENCE','Une pièce nouvelle attribue une connaissance différente à chacun. L’Avocat doit comparer les intérêts des deux clients et, s’ils deviennent incompatibles, annoncer la fin de la représentation commune plutôt que fabriquer un accord.'],
        ['CYCLE III · DEUX VOIX','L’accusation confronte les contradictions de la défense commune. Le Juge doit déterminer ce qui peut être attribué à chacun, séparément ; à 5 joueurs, l’Enquêteur porte les objections factuelles faute de Procureur dédié.']
      ],
      outcomes:[
        {id:'separate',title:'RESPONSABILITÉS SÉPARÉES',detail:'La représentation commune prend fin : des conseils distincts peuvent demander que les actes et connaissances du Client et de l’Associé soient appréciés séparément.',reputation:'PRÉCIS',facts:[['individual_responsibility','Responsabilités individuelles distinctes','established']],relations:{associe:'strained'},trace:'La défense commune survit, mais les responsabilités ne peuvent plus être fondues en une seule histoire.'},
        {id:'common',title:'DÉFENSE COMMUNE MAINTENUE',detail:'Les deux mis en cause, s’ils y consentent et qu’aucun conflit incompatible ne subsiste, maintiennent une ligne factuelle cohérente. Cela ne prouve pas qu’ils avaient la même connaissance des faits.',reputation:'LOYAL',facts:[['common_defense','Version commune maintenue','established']],relations:{associe:'aligned'},trace:'Le Client et l’Associé ont choisi de rester juridiquement liés.'},
        {id:'fracture',title:'LA DÉFENSE SE FISSURE',detail:'Le conflit d’intérêts rend la défense commune impossible. L’Avocat cesse de représenter simultanément les deux clients ; une affirmation antérieure peut néanmoins être opposée lors du procès.',reputation:'RISQUÉ',facts:[['defense_fracture','Contradiction entre les deux mis en cause','established']],relations:{associe:'broken'},trace:'Une contradiction interne devient une pièce du futur procès.'}
      ]
    }),
    4:Object.freeze({
      title:'LE PROCÈS',
      briefing:"Le procès réunit les flux, les déclarations et les décisions des trois dossiers précédents. Le parquet présente une théorie générale du réseau. La défense doit examiner chaque lien entre les faits établis et les crimes imputés au Client.",
      question:'Jusqu’où le procès permet-il juridiquement de relier le Client au réseau ?',
      cycles:[
        ['CYCLE I · THÉORIE DU PARQUET','Le Procureur présente une chaîne complète. L’Enquêteur doit expliquer les pistes abandonnées et les décisions prises depuis LE CLIENT.'],
        ['CYCLE II · DÉMONSTRATION','L’Avocat choisit son ANGLE final et peut construire une DÉMONSTRATION. Le Procureur dispose ensuite d’un droit de retournement : montrer que la démonstration confirme en réalité une partie de sa thèse.'],
        ['CYCLE III · JUGEMENT','Le Juge organise la délibération : les participants distinguent établi, probable et supposé. Leurs votes définissent la conclusion de jeu, sans se substituer à un jugement pénal réel. Les anciennes décisions restent des éléments de procédure, pas une vérité automatique.']
      ],
      outcomes:[
        {id:'narrow',title:'RESPONSABILITÉ LIMITÉE',detail:'Le tribunal retient certaines infractions ou aides précises mais rejette l’idée que le Client porte la responsabilité globale du réseau.',reputation:'TECHNIQUE',facts:[['trial_scope','Responsabilité du Client limitée à des faits précis','established']],trace:'La théorie globale du réseau est fragmentée au procès.'},
        {id:'network',title:'THÉORIE DU RÉSEAU RETENUE',detail:'La chaîne présentée par le parquet convainc sur une implication plus large du Client, sans confondre automatiquement celle-ci avec les crimes violents des autres.',reputation:'COMBATIF',facts:[['trial_network','Implication large dans le réseau','established']],trace:'Le procès consolide plusieurs liens qui étaient auparavant seulement probables.'},
        {id:'insufficient',title:'LIEN GLOBAL INSUFFISANT',detail:'Le tribunal refuse de transformer les relations et flux accumulés en responsabilité générale faute de chaîne probatoire suffisante.',reputation:'AUDACIEUX',facts:[['trial_network','Responsabilité globale dans le réseau','rejected']],trace:'Le parquet échoue à faire de la proximité une culpabilité globale.'}
      ]
    }),
    5:Object.freeze({
      title:'L’HONNEUR',
      briefing:"Une dernière pièce relie l’entourage du Client à des faits graves. Les conclusions précédentes restent au dossier. L’Avocat doit déterminer ce qu’il peut encore défendre sans présenter la proximité avec le réseau comme une preuve d’innocence générale.",
      question:'Quel héritage l’Avocat choisit-il de laisser ?',
      cycles:[
        ['CYCLE I · CE QUI RESTE','Relisez les Traces : ce qui est établi, ce qui reste contesté, qui a été protégé, qui a été exposé. Aucune ancienne conclusion ne peut être effacée.'],
        ['CYCLE II · LA LIMITE','L’Avocat choisit ce qu’il peut encore défendre légalement et moralement : contester ce qui n’est pas prouvé, rechercher une coopération encadrée ou refuser une stratégie qui exigerait de tromper la procédure.'],
        ['CYCLE III · L’HONNEUR','Le Juge expose les limites du dossier, puis le groupe délibère. Le choix de l’héritage professionnel exige aussi le consentement de l’Avocat : personne ne peut décider de ses engagements à sa place.']
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
