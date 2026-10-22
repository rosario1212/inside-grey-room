# Avocat de Los Salcedo — dossiers 030 et 031 ; aucun avocat dans le 029

Los Salcedo mandate et paie l’avocat. Il intervient comme défenseur extérieur à la Grey Room et reçoit son unique client officiel dès le début de la partie. Ce mandat suit le personnage le plus haut placé parmi les suspects du dossier, indépendamment de la place du joueur, de sa culpabilité et de la variante privée.

Dans tous les dossiers avec avocat, le suspect peut renvoyer son avocat et l’avocat peut cesser de représenter son client tant que la partie est en cours, y compris pendant un interrogatoire ou les conclusions. La rupture est immédiate. Il n’y a plus de limite d’un seul renvoi ni d’interdiction de redemander un avocat. Une nouvelle représentation exige une demande et une acceptation ; les délais ordinaires de demande restent applicables. Un avocat conserve un seul client officiel à la fois.

Dans les 030 et 031, le départ volontaire de l’avocat déclenche sa défaite personnelle définitive et le cartel fait tuer sa famille au dénouement. L’écran annonce cette conséquence et demande confirmation avant le départ ; le serveur exige aussi cet accord explicite. Reprendre le mandat n’efface pas la sanction. Le joueur continue à participer. Le renvoi décidé par le suspect ne provoque pas cette sanction : le client ne peut pas décider à lui seul de la défaite de l’avocat et de la mort de sa famille. Après une rupture, seul le personnage initialement désigné peut redemander ce mandat du cartel. Une nouvelle partie remet ces états à zéro.

Les échanges avec les autres suspects restent libres selon les règles ordinaires. Le joueur choisit son tempérament et sa manière de négocier ; Saul Goodman reste une inspiration, sans personnalité imposée.

Le mandat ne révèle aucun secret du client ni aucune intention cachée du cartel. Le résumé automatique n’extrait plus d’informations de la fiche privée du suspect. L’avocat doit obtenir ses informations pendant la partie ; il ne reçoit aucun accès supplémentaire aux preuves réservées au bureau.

## Distribution

| Dossier | Avocat | Configuration |
| --- | --- | --- |
| 029 | Aucun | 6–11 joueurs : enquêteur, analyste, quatre témoins ; puis procureur, juge, journaliste, Don et bras droit. |
| 030 | Dès 8 joueurs | 7–9 joueurs. Client : chef du commando. Distribution des taupes : 1, 1, 2. |
| 031 | Obligatoire | 6–8 joueurs. Client : cadre supérieur des trois suspects. |

Les quatre témoins, leurs cartes et leurs objectifs restent présents dans le 029. L’avocat est retiré du catalogue, du salon, des capacités et de la distribution côté serveur, ainsi que des notes de rôle du dossier. Aucun autre rôle n’est supprimé.

Pour la nouvelle intrigue du 031 en cours d’écriture, le vote pour désigner le membre du bureau à livrer est secret et contraignant à la majorité. Seuls les membres du bureau votent. L’avocat ne vote pas, ignore les intentions cachées d’El Luto et n’a pas de proche parmi les otages du bureau. La menace contre sa famille en cas d’abandon du mandat constitue une sanction distincte. Cette décision d’écriture est distincte des fonctionnalités d’avocat livrées ici.

## Vérification

La migration initiale `20261022135950_cartel_lawyer_assigned_client.sql` vérifiait l’affectation automatique et les règles de l’ancienne version. La migration `20261022144154_lawyer_mutual_termination.sql` remplace son interdiction de rupture. Elle exerce 20 démarrages et nouvelles manches dans les dix dossiers distribuant un avocat, avec 40 ruptures réparties entre suspect et avocat, en briefing, interrogatoire, défenses finales et verrouillage. Elle contrôle les confirmations du cartel, le résultat final même pour une taupe, les reprises de mandat, la confidentialité, le rétablissement du chronomètre et la préservation d’un second mandat indépendant. Toutes les parties de contrôle sont annulées.

Les contrôles du 029 couvrent les salons, les rôles et la confidentialité/reprise pour les effectifs 6–11. `scripts/cartel-lawyer-assignment-check.mjs` et `scripts/lawyer-mutual-termination-check.mjs` exercent les rendus réels et les décisions en français et en anglais : boutons, annulation, confirmation, partenaire périmé, paramètres RPC et sanction définitive. La compilation et les contrôles de séparation narrative et de publication sont exécutés ; ces contrôles automatisés ne constituent pas un test physique entre joueurs.

Le finaliseur utilise `v170-lawyer-mutual-termination` pour invalider les scripts modifiés et le cache PWA.
