# IGR v694 — Équilibrage des rôles et commandement militaire

Statut : modification proposée. Les tests SQL sont transactionnels et annulés, pas des playtests humains. Publication uniquement après PR, CI, synchronisation backend/client et contrôle Cloudflare.

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

## DLC Terror 026–028 — Officier de liaison
**Dénomination conservée : Officier de liaison**, représentant l'état-major national, pas Enquêteur ni Juge.

Trois ordres distincts par cycle, à décisions séparées :
1. **Front :** tenir / protéger / reconquérir si la synthèse précédente le permet.
2. **Civils :** ouvrir les abris (+1 service civil immédiat, coût territorial différé) / renforcer les positions (bénéfice territorial, aucun gain civil immédiat).
3. **Renseignement :** vérifier la synthèse / transmettre l'alerte urgente. Leur effet final dépend des réponses factuelles (notamment le seuil 5/6 pour l'urgence).

Une fenêtre s'ouvre immédiatement pour le premier ordre; la deuxième et la troisième apparaissent après un délai aléatoire de 25 à 85 secondes suivant la décision précédente ou la clôture de sa fenêtre. Chaque fenêtre dure **60 à 120 secondes** (horaire et verrouillage déterminés par le serveur). Les fenêtres manquées sont tracées sans ordre militaire fictif. Deux choix ne peuvent jamais être enregistrés pour un même volet.

Les ordres sont publics. Le volet « civils » change immédiatement les services civils; les volets « front » et « renseignement » publient une décision immédiate et influencent le prochain bilan territorial. Les calculs de responsabilité (0, 1, 2) et les secrets A/B/C ne sont pas modifiés.

L'Officier peut en outre intervenir une fois par cycle à partir du **cycle 2** dans une audition ou confrontation déjà ouverte; l'accès reste lié à cette séance. Son intervention du cycle 3 doit viser un autre suspect que celui du cycle 2.

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
