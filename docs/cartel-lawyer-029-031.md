# Avocat de Los Salcedo — dossiers 029, 030 et 031

La fiche privée précise que l’avocat est mandaté et payé par Los Salcedo pour défendre ses intérêts. Il intervient comme défenseur extérieur à la Grey Room. Le joueur choisit librement son tempérament et sa manière de négocier ; le modèle Saul Goodman est une inspiration, pas une personnalité imposée.

Le mandat ne donne aucun accès automatique aux secrets, aux fiches des suspects ou aux pièces réservées à l’enquête. La représentation officielle reste limitée à un client ; les échanges avec les autres personnages suivent les règles ordinaires.

## Distribution

| Dossier | Disponibilité de l’avocat | Configuration |
| --- | --- | --- |
| 029 | Dès 7 joueurs | 6–12 joueurs. Quatre témoins conservés ; puis avocat, procureur, juge, journaliste, Don et bras droit. |
| 030 | Dès 8 joueurs | 7–9 joueurs. Distribution des taupes inchangée : 1, 1, 2. |
| 031 | Obligatoire | 6–8 joueurs. Seule la fiche de l’avocat est actualisée par cette livraison. |

Dans le 029, son objectif évalué demande un mandat officiel accepté et une chaîne de responsabilité du cartel laissée non établie. Son affiliation ne lui attribue aucune connaissance de la variante. Les cartes et objectifs des témoins sont conservés. Les interfaces reconnaissent aussi l’ancien format 6–11 pour la continuité d’affichage.

## Vérification

La migration `20261022050317_cartel_lawyer_029_031.sql` vérifie 26 démarrages réels côté serveur, couvrant tous les effectifs des trois dossiers en durées courte et longue : rôles/capacités, fiches privées, absence de secrets d’autrui, nombre de taupes du 030 et acceptation effective d’un client. Elle vérifie également l’évaluation de l’avocat du 029 dans le dénouement. Toutes les parties de contrôle sont annulées par une sous-transaction ; aucune cellule de test n’est conservée.

Les régressions existantes couvrent 76 affichages du salon, 64 contrôles des rôles et 63 écrans de confidentialité/reprise. La compilation et les contrôles de séparation narrative et de publication sont exécutés. Ces vérifications automatisées ne constituent pas un test physique de partie entre joueurs.

Le finaliseur utilise `v167-cartel-lawyer` pour invalider les scripts modifiés et le cache PWA.
