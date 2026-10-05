# Inside Grey Room — règles autonomes v51

## Principe

Le jeu doit pouvoir être lancé sans superviseur humain. L’application fait autorité pour les phases officielles, les convocations, les chronomètres, les preuves, les résultats canoniques et le verrouillage final. En dehors de ces phases, les joueurs gèrent eux-mêmes leurs déplacements et leurs conversations.

## Avocat — règle canonique

- Un Avocat a un seul client officiel.
- Une fois accepté, ce client reste rattaché à cet Avocat pour l’affaire.
- L’Avocat accompagne son client lorsqu’une procédure officielle concerne ce client.
- Hors Grey Room, les échanges avec l’Avocat sont libres et sans chronomètre.
- Les autres suspects peuvent également parler librement à l’Avocat ; cela ne crée pas une représentation officielle.
- Pendant son propre interrogatoire, **tout Suspect**, client officiel ou non, peut demander une pause privée de **01:00**, **une fois par cycle**, si un Avocat est présent.
- Le chrono de l’interrogatoire est suspendu pendant la pause puis reprend avec exactement le temps restant.
- Pour le client officiel, la minute est un aparté confidentiel avec son propre Avocat.
- Pour un non-client, la minute est une consultation ponctuelle et ne crée pas de représentation.

Le backend v50 appliquait déjà la limite par suspect et par cycle. La v51 aligne l’interface et le règlement sur ce comportement.

## Guide autonome

L’onglet Règles v51 contient :

1. le déroulement complet de la partie ;
2. la règle générale des interactions libres ;
3. les règles d’accès à la Grey Room ;
4. la règle Avocat ci-dessus ;
5. l’explication de chaque onglet visible ;
6. une fiche concise pour chaque rôle public ;
7. les règles communes sur les preuves, le bluff, la confidentialité et les convocations.

Chaque fiche de rôle indique :

- le but du rôle ;
- les actions principales ;
- ce qu’il faut éviter ;
- le niveau d’activité moyen.

## Aide contextuelle

Une carte **QUE FAIRE MAINTENANT ?** apparaît sous la phase et adapte son texte à :

- lecture des cartes ;
- Assemblées I, II et III ;
- sélection d’interrogatoire ;
- sélection d’événement ;
- interrogatoire ;
- confrontation ;
- nouvelle trame ;
- verrouillage final ;
- décision finale du Juge ;
- vote d’intégrité ;
- révélation.

Elle tient compte du rôle du joueur et, quand nécessaire, du fait qu’il soit ou non la personne convoquée.

## Correction des résidus historiques

La v43 affichait encore des consultations ordinaires Avocat/Suspect limitées à 1 minute. La v51 remplace ce comportement côté interface :

- consultation ordinaire hors Grey Room = libre et sans chrono ;
- minute chronométrée = uniquement pendant l’interrogatoire officiel ;
- le bandeau historique « 1 utilisation par partie » est remplacé par « tous les suspects · 1 fois par cycle · pendant ton interrogatoire ».

## Couverture scénarios

Les `role_notes` des scénarios `001` à `034` ont été synchronisées en production. Vérification :

- 34/34 packs portent la règle Suspect explicite ;
- 34/34 packs portent la règle Avocat explicite.

## Règle de vérité

Les joueurs peuvent convaincre, bluffer ou mentir lorsque leur rôle le permet. Ils ne peuvent jamais inventer une preuve, un résultat technique ou une règle en prétendant que cette information vient de l’application, du Juge ou du règlement.
