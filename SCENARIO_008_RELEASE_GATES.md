# Dossier 008 — SOUS SERMENT · Audit et refonte privée v300
> **Mise à jour : intégration serveur v301–v309 terminée, publication préparée.** Le dossier 008 dispose d'un tirage A/B/C aléatoire par salon, d'un instantané privé immuable, de cartes propres à chaque rôle, de trois révélations garanties, de neuf investigations par variante et d'un verdict à trois axes noté dans la révélation. Des tests automatisés sur le **vrai moteur Supabase** sont passés : 24 salons à cinq joueurs (A=13, B=7, C=4 ; 13 répartitions de rôles), puis 12 parties complètes jusqu'à la révélation (A=3, B=5, C=4), trois cycles avec quota commun et preuve invisible aux suspects, et reconstruction correcte/erronée. Aucune partie de QA ni instantané n'a été laissé. L'essai avec cinq personnes physiques n'a **pas** été effectué. Les sections historiques plus bas décrivent le travail avant raccordement, pas l'état actuel.


> **Statut au 24 octobre 2026 :** 3 manuscrits améliorés dans Supabase privé ; constructeur v300 opérationnel ; **pas de publication des nouvelles variantes**. Le gameplay public 008 conserve actuellement le pack historique, commun à toutes les parties. Ne jamais confondre la preuve de fonctionnement de la prévisualisation privée et celle du moteur multijoueur public.

## Identité et dilemme

Trois témoins ont prêté serment au sujet d'une pièce de procédure. Tous détiennent une part de vérité, mais tous ne mentent ni pour la même raison ni sur le même acte. Le camp Enquête doit **reconstituer les faits**, distinguer fausse déclaration, pression sur témoin et geste matériel, sans attribuer automatiquement la responsabilité à celui dont le mensonge paraît le plus spectaculaire.

**Invariant :** 5 joueurs, un Enquêteur, un Analyste et trois Suspects/Témoins. Un même scénario public ; trois vérités privées A/B/C indépendantes. Pas de jugement moral non étayé par les pièces du dossier.

## Variantes (description sans divulgation des réponses)

| Variante | Question de fond | Renversement recherché |
|---|---|---|
| A | Une déposition peut-elle rester exacte sur le fait principal malgré un faux horaire ? | Séparer pression institutionnelle, faute annexe et vie privée |
| B | Une rupture de garde constitue-t-elle déjà la preuve d'un vol ? | Responsabilité de conservation sans auteur de vol inventé |
| C | Un témoignage très détaillé prouve-t-il la sincérité ou une connaissance compromettante ? | Distinguer savoir exact, retour caché et acte matériel |

## Modifications réelles dans Supabase

La table privée `igr_private.igr_v99_variant_manuscripts`, uniquement pour `scenario_id='008'`, comporte maintenant pour chaque A/B/C :

- **3 trames garanties**, cycles 1, 2 et 3 ; la trame de cycle 3 contient des indices contradictoirement vérifiables permettant d'imputer les faits, sans exiger une investigation facultative ;
- **9 investigations facultatives**, trois par cycle, chacune avec un résultat vérifiable ; aucune ne constitue la seule preuve nécessaire à un verdict ;
- **un verdict privé à trois axes** (incident, responsable, diversion), distinct d'une variante à l'autre ;
- **3 cartes privées réécrites**, avec repères temporels, contradictions et objectifs spécifiques ;
- **6 relations dirigées et confrontations ciblées** entre les trois suspects.

Tous les détails narratifs restent dans le schéma privé Supabase. Les fichiers GitHub n'en contiennent aucun.

## Validation réellement effectuée

- `igr_private.igr_v300_008_build_pack('A'|'B'|'C')` installé en tant que prévisualisation privée ; privilèges `EXECUTE` révoqués pour `anon` et `authenticated`.
- Les **3 variantes** génèrent chacune 3 suspects, 3 trames, 9 investigations à identifiants uniques, 3 sources de relations et un verdict à 3 axes.
- **60 constructions privées aléatoires** : A=20, B=23, C=17, **60/60 validées**.
- Les trois manuscrits restent en `editorial_status='review'`, empreintes calculées vérifiées, `source_review='pending'` et `human_playtest_verified=false`.
- Test de non-régression transactionnel : **une partie du dossier 008 historique démarre avec 5 joueurs** ; aucun salon de test n'est conservé. Le moteur public n'utilise pas encore les variantes v300.

## Conditions avant publication de la refonte

1. Relier en sécurité le tirage A/B/C au salon et à son instantané privé immuable ; refuser tout nouveau lancement si une variante du paquet manque.
2. Distribuer une seule carte au suspect correspondant et publier uniquement les trames autorisées, sans révéler les deux autres dossiers ni les solutions.
3. Exposer les neuf choix d'investigation par cycle à l'Enquêteur/Analyste seulement, avec quota partagé, refus des autres rôles et vérifications de reconnexion.
4. Construire l'interface de verdict à trois axes et son contrôle serveur. Trois issues : correct, erroné et incomplet/refusé ; pas de révélation anticipée.
5. Vérifier des sessions à cinq joueurs sur A, B et C, les affectations aléatoires, la reprise réseau, les autorisations et l'absence de doublons ; vérifier le non-impact sur 001–007 et 009+.
6. Obtenir la décision d'approbation et la revue des sources fictives ; fusion et déploiement seulement après GO explicite du nouveau gameplay.

**Important :** la présente refonte v300 est intégrée aux données de conception privées. Le fait que la version historique du 008 soit déjà sélectionnable ne signifie **pas** que la nouvelle version est publiée.


## Intégration v301–v309 : mise en œuvre et vérification serveur

- **v301** : table `igr_private.igr_v301_008_room_snapshots` liée au salon, paquet figé à la création effective de la partie, et fonction privée d'autorisation. Une reconnexion ne tire pas une nouvelle variante.
- **v302** : `igr_v4_start_game` exige l'autorisation de publication et épingle le pack avant de répartir les rôles.
- **v303** : lecteurs des cartes privées, du suivi, des trames et des deux révélations finales lisent l'instantané 008 ; les dossiers 001–007 conservent leurs branches existantes.
- **v304** : `igr_v4_sync` expose uniquement les métadonnées des investigations du cycle en cours à l'Enquêteur et à l'Analyste ; solutions non exposées en cours de partie.
- **v305** : `public.igr_v305_008_investigate` contrôle jeton, rôle, cycle, phase, identité de la pièce et quota commun d'une investigation facultative par cycle.
- **v306** : verrouillage de la reconstruction à trois axes `incident/responsible/decoy`, trois valeurs possibles par axe ; une reconstitution incomplète ou mal formée est refusée.
- **v307** : comparaison de la reconstitution personnelle au secret de la variante **uniquement à la révélation** ; victoire individuelle du camp Enquête conditionnée à l'exactitude de son raisonnement.
- **v308** : contrat de non-régression du client ajouté au build ; l'interface fournit les trois sélections, les menus et le rapport.
- **v309** : garde-fou PostgreSQL au niveau `public.igr_v4_rooms` : un ancien client ne peut pas ouvrir une partie non publiée. Le contrôle direct refuse le 008 alors que le 006 et le 007 continuent d'ouvrir leurs salons.
- **PWA** : le `index.html` et le service worker utilisent la même révision `20261024-008-variants`.

### Tests réellement exécutés

| Test | Résultat |
|---|---|
| Construction privée A/B/C | 3/3 |
| Constructions aléatoires de packs | 60/60 |
| Salons réels Supabase, cinq joueurs | 24/24 |
| Répartition des variantes | A=13, B=7, C=4 |
| Distributions de rôles distinctes | 13 |
| Parties exécutées jusqu'à la révélation | 12/12, A=3, B=5, C=4 |
| Révélations de cycles 1, 2, 3 | 3/3 |
| Investigations valides des cycles 1, 2, 3 | 3/3 |
| Seconde investigation du même cycle | Refus |
| Investigation demandée par un suspect | Refus |
| Preuves d'investigation visibles au suspect | 0 |
| Verdict incomplet | Refus |
| Verdict exact / faux mais bien formé | Différenciés |
| Création directe 008 avant GO serveur | Refus |
| Création des dossiers 006 et 007 inchangée | Réussie |
| Salons/snapshots de QA persistants | 0 |
| Playtest à cinq humains | Non effectué |

Le feu vert éditorial est encore `eligible=false` tant que le propriétaire n'enregistre pas l'approbation du 008. Ne pas renseigner `human_playtest_verified=true` sans test réel.

