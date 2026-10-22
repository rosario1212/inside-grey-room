# Avocat de Los Salcedo — dossiers 030 et 031 ; aucun avocat dans le 029

Los Salcedo mandate et paie l’avocat. Il intervient comme défenseur extérieur à la Grey Room et reçoit son unique client officiel dès le début de la partie. Ce mandat suit le personnage le plus haut placé parmi les suspects du dossier, indépendamment de la place du joueur, de sa culpabilité et de la variante privée. Le client et l’avocat ne peuvent pas changer le mandat.

Les échanges avec les autres suspects restent libres selon les règles ordinaires. Le joueur choisit son tempérament et sa manière de négocier ; Saul Goodman reste une inspiration, sans personnalité imposée.

Le mandat ne révèle aucun secret du client ni aucune intention cachée du cartel. Le résumé automatique n’extrait plus d’informations de la fiche privée du suspect. L’avocat doit obtenir ses informations pendant la partie ; il ne reçoit aucun accès supplémentaire aux preuves réservées au bureau.

## Distribution

| Dossier | Avocat | Configuration |
| --- | --- | --- |
| 029 | Aucun | 6–11 joueurs : enquêteur, analyste, quatre témoins ; puis procureur, juge, journaliste, Don et bras droit. |
| 030 | Dès 8 joueurs | 7–9 joueurs. Client : chef du commando. Distribution des taupes : 1, 1, 2. |
| 031 | Obligatoire | 6–8 joueurs. Client : cadre supérieur des trois suspects. |

Les quatre témoins, leurs cartes et leurs objectifs restent présents dans le 029. L’avocat est retiré du catalogue, du salon, des capacités et de la distribution côté serveur, ainsi que des notes de rôle du dossier. Aucun autre rôle n’est supprimé.

Pour la nouvelle intrigue du 031 en cours d’écriture, le vote pour désigner le membre du bureau à livrer est secret et contraignant à la majorité. Seuls les membres du bureau votent. L’avocat ne vote pas, ignore les intentions cachées d’El Luto et n’a pas de proche parmi les otages. Cette décision d’écriture est distincte du mandat automatique livré ici.

## Vérification

La migration `20261022135950_cartel_lawyer_assigned_client.sql` vérifie 27 démarrages : tous les effectifs des trois dossiers en durées courte et longue, deux nouvelles manches et une partie hors CARTEL conservant demande/acceptation. Elle vérifie les quatre témoins sans avocat du 029, l’identité du client des 030/031, l’absence de demande préalable, le refus de changement ou de renvoi, l’ignorance des secrets et la confidentialité des synchronisations. Toutes les parties de contrôle sont annulées.

Les contrôles du 029 couvrent les salons, les rôles et la confidentialité/reprise pour les effectifs 6–11. `scripts/cartel-lawyer-assignment-check.mjs` exerce les rendus réels en français et en anglais pour les 030/031 et un dossier conservant les règles ordinaires. La compilation et les contrôles de séparation narrative et de publication sont exécutés ; ces contrôles automatisés ne constituent pas un test physique entre joueurs.

Le finaliseur utilise `v169-cartel-lawyer-assignment` pour invalider les scripts modifiés et le cache PWA.
