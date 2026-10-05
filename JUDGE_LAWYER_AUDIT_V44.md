# Inside Grey Room — Audit Juge + Avocat v44

## Verdict

**PASS** sur les règles serveur et le flux de fin de partie testés le 5 octobre 2026.

La v44 remplace les derniers héritages incompatibles avec le design actuel : Juge à 5 points, Avocat multi-clients préassignés, consultations libres en salle d’attente et événements judiciaires artificiels dans les slots d’enquête.

## Avocat

### Représentation officielle
- Un seul client officiel par avocat.
- Entretien préalable de 1 minute maximum avant **Accepter ou Refuser**.
- Refus non définitif : le suspect peut redemander tant qu’aucun conflit de représentation ne l’empêche.
- Acceptation irréversible pour le reste de l’affaire.
- L’ancien champ serveur `clients` préassigné est supprimé des nouvelles cartes privées.

### Consultation d’un non-client
- Chaque suspect non représenté dispose d’**une seule** consultation sur toute la partie.
- Elle n’est disponible que pendant **son propre interrogatoire**.
- La demande suspend le chrono d’interrogatoire.
- L’Avocat reçoit la demande et démarre la consultation.
- Consultation : **60 secondes maximum**.
- Fin anticipée ou expiration : le chrono d’interrogatoire reprend avec le temps restant mémorisé.
- Un client officiel n’utilise pas cette mécanique : son avocat l’accompagne déjà dans les phases concernées.
- Les anciennes consultations libres en salle d’attente sont masquées en v44.

## Juge

### Début de partie
- Aucune activité artificielle pendant la lecture des cartes ou le débrief initial.
- Le Juge lit son dossier et son objectif privé.
- Le Cabinet devient réellement actif à partir du cycle 1.
- Le Juge conserve l’accès au flux déjà prévu par le jeu.

### Saisines
Peuvent saisir le Juge :
- Enquêteur : accès à un élément d’enquête protégé.
- Avocat : confidentialité / limitation d’un élément, validation d’un accord.
- Procureur : exploitation d’un élément, audition, validation d’un accord.
- Journaliste : accès, publication, protection d’une source. Le Journaliste reste hors de tous les camps.

Le Juge n’invente jamais de preuve. Il décide de l’accès ou de l’usage d’un élément prévu par le scénario.

### Protections
- Maximum **3 protections consommées par partie**.
- Une protection déjà consommée n’est jamais remboursée si l’élément est ensuite ouvert.
- Protéger deux fois le même élément ne consomme pas une deuxième protection.
- Le modèle historique à 5 points est retiré.

### Réexamen
- Un seul réexamen conjoint par partie.
- Initié par l’Enquêteur après un refus / accès partiel sur un élément protégé.
- L’Analyste doit confirmer.
- Le Juge doit ensuite entendre Enquêteur + Analyste pendant **2 minutes** lorsque les trois sont libres.
- Aucun nouvel élément ne peut être introduit pendant ce réexamen.

### Convocations
- Le Juge peut convoquer n’importe quel autre joueur.
- Seuls les joueurs **LIBRES** apparaissent comme sélectionnables.
- Même personne : maximum **1 fois par cycle**.
- Pas de quota global de convocations.
- Le joueur convoqué reçoit une notification et doit confirmer depuis son application.
- L’entretien commence à la confirmation et dure **2 minutes maximum**.
- Une personne engagée dans une phase active n’est pas sélectionnable.

### Assemblées
- Le Juge continue d’accéder aux Assemblées ordinaires.
- Au cycle 3, il reste excluable par l’Enquêteur via le mécanisme existant de sélection des participants.

## Fin de partie avec Juge

1. Conclusions / reconstruction de l’enquête.
2. Position du Procureur s’il est présent.
3. Défense de l’Avocat.
4. **Délibération obligatoire** : Juge + Enquêteur + Analyste + Procureur s’il est présent.
   - courte : **3:00** ;
   - longue : **4:00** ;
   - aucun nouvel élément.
5. Verrouillage des responsabilités par le Juge.
6. **Discours final du Juge**, dernière parole humaine avant la révélation.
7. Vote secret sur l’intégrité du Juge :
   - Enquêteur + Analyste : accusation uniquement si 2/2 ;
   - avec Procureur : majorité 2/3.
8. Révélation canonique avec comparaison **enquête / décision du Juge / vérité** et révélation du statut réel du Juge.

## Variante Juge corrompu

- Activée sur les dossiers principaux 014, 015, 016, 019 et 020 lorsqu’un Juge est présent.
- Probabilité v44 : **1/3**.
- Le statut reste dans l’état privé du Juge.
- En cas de corruption, il reçoit un suspect à protéger discrètement en utilisant uniquement ses pouvoirs normaux.
- Aucun bouton public ne révèle sa cible ou sa corruption.
- Les garde-fous restent : quota 3, réexamen conjoint, chemins alternatifs du scénario et évaluation finale de l’intégrité.

## Tests d’intégration exécutés en base

Tous les scénarios de test ont été exécutés dans des transactions avec **ROLLBACK**.

### Test A — pouvoirs en cours de partie : PASS
- attribution privée de l’intégrité du Juge ;
- absence de clients Avocat préassignés ;
- convocation d’un joueur libre ;
- confirmation et chrono 120 s ;
- interdiction de reconvoquer la même personne au même cycle ;
- joueur interrogé correctement marqué non libre ;
- consultation Avocat : pause du chrono, démarrage, fin, reprise du temps restant ;
- deuxième consultation du même suspect refusée ;
- 3 protections acceptées ;
- 4e protection refusée ;
- réexamen Enquêteur + Analyste + Juge ;
- délibération courte = 180 s ;
- délibération longue = 240 s.

Résultat serveur : `v44_role_integration_tests_ok`.

### Test B — révélation : PASS
- le niveau du Juge est ajouté à chaque responsabilité ;
- le succès du suspect est comparé à la décision officielle du Juge lorsqu’il existe ;
- l’Avocat est évalué sur son **client officiel v43**, plus sur l’ancienne répartition modulo ;
- l’évaluation de corruption est incluse dans la révélation.

Résultat serveur : `v44_reveal_tests_ok`.

### Test C — chaîne de fin complète : PASS
- verrouillages finaux ;
- passage automatique à `judge_speech` ;
- confirmation de fin de discours ;
- passage à `judge_integrity_vote` ;
- trois votes avec Procureur ;
- révélation uniquement après tous les votes ;
- partie marquée `finished`.

Résultat serveur : `v44_endgame_flow_tests_ok`.

## Contrôles statiques

- `judicial-runtime-v44.js` : vérification de syntaxe prévue dans le check de build.
- `scripts/apply-lawyer-v43.mjs` étendu pour injecter v44 après v43.1.
- `scripts/v43-lawyer-check.mjs` étendu avec les invariants v44.
- Le contrôle de build exige désormais l’ordre : **v42 < v43 < v43.1 < v44**.

## Points surveillés

- La corruption est volontairement limitée aux dossiers principaux où le Juge est déjà conçu comme rôle institutionnel ; les DLC sans éléments protégés ne reçoivent pas cette variante artificiellement.
- La protection ne doit jamais constituer l’unique chemin vers une information indispensable : cela reste une contrainte éditoriale des scénarios, en plus du garde-fou mécanique du réexamen.
