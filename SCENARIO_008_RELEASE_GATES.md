# Dossier 008 — SOUS SERMENT · Audit et refonte privée v300

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
