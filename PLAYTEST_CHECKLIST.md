# Checklist terrain — Inside Grey Room

Objectif : tester le jeu comme un vrai produit avant App Store / Play Store, sans transformer les sessions en séance de QA permanente.

## Avant la partie
- appareil de chaque joueur : iPhone PWA / Safari / Android / desktop ;
- scénario, collection (base / OMERTÀ / TERREUR / CARTEL / LE RÉGIME), nombre de joueurs et rôles présents ;
- noter si l’entrée, l’accueil, la création/rejointure de cellule et le lobby sont compris sans explication extérieure ;
- vérifier que la palette du scénario/DLC est cohérente partout et qu’aucun accent d’un autre DLC n’apparaît ;
- tester au moins une fois : choix manuel d’un rôle, rôle au hasard, changement de rôle puis Retirer.

## Pendant la partie
Après chaque cycle, noter rapidement :
- compréhension des cartes privées après 30 secondes puis après 5 minutes ;
- moments où un joueur ne savait pas quoi faire ;
- interrogatoires trop courts ou trop longs ;
- trame trop révélatrice, inutile ou parfaitement dosée ;
- rôle spécial amusant / frustrant / trop puissant / inutile ;
- cohérence des timers, transitions, révélations et verrouillages ;
- problème de synchronisation, double tap, double action, écran figé, reconnexion, audio ou vidéo ;
- reprise après verrouillage d’écran, passage en arrière-plan ou changement de réseau ;
- qualité du briefing d’ouverture et lisibilité des informations privées ;
- hypothèse dominante du groupe après chaque cycle et raison de son évolution.

## Fin de partie
- verdict final et vérité réelle ;
- compréhension de la révélation, des responsabilités et des scores ;
- cohérence du résultat avec ce que les joueurs pensent avoir accompli ;
- qualité du vote/scénario suivant et continuité de la cellule ;
- ce que les joueurs voudraient immédiatement rejouer ;
- ce qu’ils supprimeraient ou raccourciraient ;
- note rapide de 1 à 5 pour : clarté, tension, rythme, équité, envie de rejouer, qualité visuelle.

## Tests techniques obligatoires à répartir sur plusieurs sessions
- iPhone avec Dynamic Island + iPhone plus ancien ;
- Android récent avec Chrome / build natif lorsque disponible ;
- partie minimum de joueurs et partie proche du maximum ;
- reconnexion après refresh / fermeture / retour arrière-plan ;
- passage Wi‑Fi ↔ 4G/5G ;
- rôle au hasard sous concurrence de plusieurs joueurs ;
- scénario base + au moins un scénario de chaque DLC ;
- page Règles, Rejoindre, Profil, filtres, Accueil fixe, choix de rôle et Retirer ;
- orientation portrait/paysage pour les écrans qui l’utilisent ;
- audio activé/désactivé, reprise après verrouillage ;
- anglais/français ;
- test final sans aucune explication du créateur : si les joueurs bloquent, l’interface ou le texte doit être amélioré.

## Critères de feu vert bêta
Aucune session ne doit présenter :
- blocage empêchant de terminer une partie ;
- fuite d’information privée ;
- thème/DLC incohérent ou palette qui se mélange ;
- rôle impossible à sélectionner/retirer ;
- perte de session après simple mise en arrière-plan ;
- action critique déclenchée deux fois ;
- écran sans moyen clair de retour ou de sortie.

Les problèmes sont classés : **Critique** (bloque ou fuit une information), **Important** (dégrade clairement une partie), **Polish** (confort/esthétique sans impact gameplay).
