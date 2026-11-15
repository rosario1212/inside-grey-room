# IGR v694 — Équilibrage des rôles et commandement militaire

Statut : contrat des rôles, amendé après fusion avec les mécaniques TERREUR v695. Les tests SQL sont transactionnels et annulés, pas des playtests humains. Publication uniquement après PR, CI, synchronisation backend/client et contrôle Cloudflare.

## Règles canoniques corrigées
- **Juge** : trois **points** de protection maximum (certaines pièces coûtent 2), aucune convocation individuelle ordinaire chronométrée. La troisième protection peut faire échouer l'objectif personnel décrit sur la carte, sans annuler à elle seule la victoire collective.
- **Inspecteur** : trois lieux par cycle maximum, une exploration par lieu. Transmission automatique à l'Enquêteur, partage complémentaire au choix du joueur.
- **Analyste** : conserve les Assemblées et les recoupements; peut une fois par cycle publier une question de recoupement explicite (20–220 caractères). C'est une hypothèse non vérifiée, jamais une preuve.
- **Témoin** : une initiative volontaire par cycle : demande d'audition ou déclaration personnelle (minimum 20 caractères pour une déclaration). Message public et non corroboré, sans accès automatique à la Grey Room.
- **Expert** : une analyse par cycle, une contre-expertise par partie; rôle limité aux faits techniques. Le guide propose une priorité utile à chaque cycle; aucun faux résultat technique nouveau.
- **Journaliste** : rôle indépendant; les déclarations manuelles restent non vérifiées. La mécanique Breaking News existante demeure.
- **Procureur** : coopérations et argumentation, sans rendez-vous artificiel chronométré. Aucun pouvoir de verdict si un Juge est présent.
- **Avocat** : un client officiel et des consultations libres hors procédures; les pauses privées sous interrogation restent régies par le serveur.
- **Enquêteur / Suspect** : pouvoirs inchangés; guides de cycle non contraignants pour prévenir monopole et passivité.
- **Espion** : rôle secret indépendant conservé, aucun changement aux routes ni aux conditions de victoire.

## DLC TERREUR 026–028 — version canonique v695

**Officier** : le commandement de l'armée nationale appartient à un joueur distinct de l'Enquêteur et de l'Inspecteur. L'ancien prototype « Officier de liaison » et ses commandes sont désactivés dans TERREUR v695.

- Trois ordres militaires par cycle (neuf sur la partie). Les alertes sont espacées, chronométrées entre 60 et 120 secondes; leurs effets sur la capitale sont immédiatement publiés.
- Le minuteur militaire est suspendu pendant un interrogatoire ou une confrontation; les ordres expirés basculent vers un protocole de sécurité, sans compter comme des décisions personnelles.
- Un suspect différent peut être rejoint par cycle, dès le premier. Une confrontation indépendante est possible au cycle 2 et au cycle 3.
- Le verdict judiciaire et la survie militaire sont évalués indépendamment; les ordres personnels comptent pour la victoire de l'Officier.
- Chacune des trois enquêtes possède trois variantes A/B/C scellées côté serveur, chacune avec neuf investigations garanties et onze pistes facultatives; les vérités sont distinctes et ne sont dévoilées qu'à la révélation.

Le fichier `role-cadence-v694.js` reste chargé pour les repères et initiatives des autres rôles, **mais son ancien écran militaire ne s'active pas si `terror-command-v694.js` est présent**. Les anciens RPC militaires sont révoqués pour les clients publics.

## Garde-fous
- RPC avec jeton de joueur, vérification du rôle/scénario/cycle/phase, limitation de fréquence.
- Fonctions internes dans \`igr_private\`; droits d'exécution révoqués aux clients publics.
- Publication des notes personnelles avec \`verified=false\` et \`canonical_evidence=false\`.
- Reconquête limitée aux conditions de renseignement vérifié déjà en vigueur.
- Aucun entretien libre supprimé; aucune nouvelle convocation obligatoire; aucun verdict arbitraire.
- Les composants v694 sont copiés dans les bundles Web et mobile, précachés pour la PWA et couverts par un test statique.

## Validation requise avant certification
1. CI Web/mobile v694 + autres contrôles historiques réussis.
2. SQL migré et vérifié sur la base, puis production client alignée.
3. Playtest réel de 6 à 8 joueurs par DLC Terror; tester un ordre trop tardif, une intervention répétée, une reconquête mal informée, une déclaration de témoin et un recoupement d'analyste.
4. Contrôler les durées réelles des cycles (les trois fenêtres sont séquentielles) et la réactivité en cas de reconnexion.
5. Contrôler les écrans FR/EN : les nouveaux panneaux v694 sont actuellement rédigés en français; traduction EN reste à réaliser avant de qualifier le support bilingue de complet.

**Limite importante :** les notes et déclarations augmentent l'autonomie sociale, mais ne constituent pas de nouvelles preuves canoniques. Les notes de gameplay restent provisoires jusqu'à essais humains.
