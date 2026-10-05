# Inside Grey Room — Audit Procureur v47

## Verdict

**PASS backend / intégration** sur les mécaniques du Procureur testées le 5 octobre 2026. Le contrôle statique du runtime et le build sont intégrés au pipeline v47.

## Identité du rôle

Le Procureur appartient publiquement au **camp Enquête**, dispose déjà du **Flux** et du canal d’enquête, mais conserve une lecture finale personnelle des responsabilités.

Il ne remplace ni l’Enquêteur ni le Juge :
- Enquêteur : reconstruit les faits ;
- Procureur : fissure les alliances, compare les intérêts et construit sa propre lecture ;
- Juge : lorsqu’il existe, sa décision prime pour la victoire du camp.

## Début de partie

Le Procureur consulte sa carte et un **Dossier du Parquet**. Il reçoit des profils non canoniques :
- chaque suspect ;
- le Journaliste s’il est présent ;
- l’Avocat s’il est présent ;
- le Juge s’il est présent.

Ces profils proposent des angles d’entretien. Ils ne révèlent ni la vérité canonique, ni les secrets privés des autres cartes.

## Cabinet du Parquet

- Accessible du cycle 1 au cycle 3.
- Le Procureur voit uniquement les joueurs actuellement **LIBRES**.
- Il peut convoquer n’importe quel autre joueur libre.
- Même cible : maximum **une fois par cycle**.
- Une convocation lancée est obligatoire ; la cible doit la **confirmer depuis son application**.
- L’entretien dure **2 minutes maximum**.
- Il peut être terminé plus tôt par le Procureur, la cible ou l’Avocat accompagnant.
- Les entretiens arrivant à 0:00 sont terminés automatiquement côté serveur.
- Le Procureur doit terminer **au minimum un entretien par cycle** ; le serveur bloque le passage au cycle suivant ou à la clôture si ce minimum n’est pas rempli.

## Suspect représenté

Si la cible est un suspect avec un Avocat officiel :
- le suspect n’est sélectionnable que si son Avocat est également libre ;
- l’Avocat est automatiquement rattaché à la convocation ;
- il reçoit une notification privée ;
- il accompagne obligatoirement son client pendant l’entretien ;
- le Procureur ne peut pas contourner la représentation en convoquant le client seul.

## Coopérations et alliances

Pendant un entretien actif avec un suspect, le Procureur peut proposer une coopération contre un **autre suspect**.

Le suspect peut accepter ou refuser depuis son application. L’interface rappelle explicitement que **le Juge n’est jamais lié par cet accord**.

Cette mécanique sert à confronter les intérêts et à fissurer les alliances ; elle ne crée aucune preuve et ne modifie jamais la vérité canonique.

## Objectifs — Procureur loyal

### Objectif principal

**Établir correctement la responsabilité réelle de chaque suspect dans sa propre version finale.**

La réussite est personnelle : le Procureur peut avoir raison même si le Juge se trompe et fait perdre le camp Enquête.

### Objectif secondaire

**Obtenir au moins une coopération acceptée contre un autre suspect réellement impliqué.**

Une coopération contre une personne canoniquement sans responsabilité ne valide pas cet objectif.

## Objectifs — Procureur corrompu

La corruption est cachée et n’altère jamais son interface publique ni ses pouvoirs.

### Objectif principal

Réduire dans sa propre version finale la responsabilité attribuée à sa cible secrète.

### Objectif secondaire

Faire accepter une coopération qui crée une fausse piste crédible vers un autre suspect et amener la version qui fait autorité à **surestimer** cet autre suspect.

Le Procureur peut orienter, négocier, sélectionner et bluffer sur ses intentions. Il ne peut jamais inventer une preuve ou attribuer à l’application une information inexistante.

## Hiérarchie des versions finales

Chaque acteur garde sa propre réponse. Pour déterminer la **victoire du camp Enquête**, une seule version fait autorité selon cette priorité :

**Juge → Procureur → Enquêteur**

Donc :
- Juge présent : sa version détermine la victoire du camp ;
- pas de Juge mais Procureur présent : version du Procureur ;
- ni Juge ni Procureur : version de l’Enquêteur.

La révélation conserve néanmoins les trois lectures et les compare à la vérité canonique.

## Score du Procureur

Trois axes sont évalués :
1. victoire de son camp / intérêt caché ;
2. objectif principal ;
3. objectif secondaire.

Le rendu est :
- 0/3 = 0 % ;
- 1/3 = 33 % ;
- 2/3 = 67 % ;
- 3/3 = **100 %**.

Pour un Procureur loyal, le premier axe est la victoire du camp Enquête. Pour un Procureur corrompu, cet axe mesure la réussite de son intérêt caché dans la version qui fait autorité.

## Rendu final

La v47 expose pour chaque suspect :
- réalité canonique ;
- version de l’Enquêteur ;
- version du Procureur ;
- version du Juge s’il existe ;
- rôle dont la version fait autorité.

Le Procureur voit également ses trois axes et son pourcentage final.

## Tests d’intégration exécutés en base

Tests exécutés dans une transaction avec **ROLLBACK** sur un dossier 019 temporaire.

### Flux de jeu : PASS

- profils Procureur chargés ;
- suspect représenté affiché avec son Avocat ;
- convocation uniquement via le nouveau flux v47 ;
- Avocat automatiquement attaché à la convocation de son client ;
- confirmation depuis l’application ;
- durée exactement 120 secondes ;
- proposition de coopération pendant l’entretien ;
- acceptation par le suspect ;
- fin d’entretien par l’Avocat ;
- minimum d’un entretien reconnu pour le cycle ;
- passage de cycle autorisé après respect du minimum ;
- passage suivant bloqué sans entretien au cycle concerné.

### Procureur loyal : PASS

Avec Juge présent et toutes les responsabilités exactes :
- autorité du camp = **Juge** ;
- objectif principal du Procureur = réussi ;
- coopération utile = réussie ;
- camp = gagné ;
- score Procureur = **100 %**.

### Procureur corrompu : PASS

Test forcé pour audit :
- cible protégée sous-évaluée par le Procureur ;
- cible également sous-évaluée par le Juge ;
- coopération acceptée contre un autre suspect ;
- autre suspect surestimé par la version d’autorité ;
- trois axes corrompus réussis ;
- score = **100 %**.

Résultat serveur : `v47_prosecutor_integration_tests_ok`.

## Régressions protégées

Le check v47 refuse notamment :
- le retour de l’ancien entretien Procureur de 3 minutes ;
- le retour d’un système accepter/refuser la convocation ;
- l’absence du runtime Parquet ;
- un mauvais ordre de chargement v44 → v45 → v46 → v47 ;
- l’absence des RPC et tables v47 ;
- l’absence de la hiérarchie Juge → Procureur → Enquêteur.
