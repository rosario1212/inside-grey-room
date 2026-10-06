# Finale, durées et protections — v58

## Finale

La consigne v51 était réinsérée toutes les 1,8 secondes puis supprimée par v52 chaque seconde. Ce conflit modifiait la hauteur au-dessus des onglets et déplaçait la cible tactile. V51 ne rend plus de consigne pendant les quatre phases finales. Chaque module conserve son nœud tant que son contenu reste identique. Les actions finales sont aussi accessibles dans Enquête. Le choix d'un onglet reste conservé pendant une même phase.

## Durées

| Étape | Court | Long |
|---|---:|---:|
| Interrogatoire | 6 min | 6 min |
| Assemblée I | 2 min 30 | 5 min |
| Assemblées II et III | 2 min chacune | 4 min chacune |
| Événements par cycle II/III | 1 | 3 |
| Audience par rôle | 1 min | 2 min |
| Défense par suspect, avocat inclus | 2 min | 5 min |
| Avis final par avocat | 1 min | 2 min |

Pour le groupe de référence de sept joueurs avec trois suspects, enquêteur, analyste, juge et avocat : le court dispose de 30 min maximum d'interrogatoires, 6,5 min d'assemblées et 10 min de finale, soit 46,5 min hors lecture, transitions et consultations. La marge restante jusqu'à 55 min couvre ces étapes usuelles. Le long permet jusqu'à 48 min d'événements d'enquête, 13 min d'assemblées et 23 min de finale, soit 84 min avant transitions. Les estimations 40–55 / 70–90 sont des objectifs de jeu, pas des limites absolues : les pauses manuelles, décisions sans chrono et groupes plus grands peuvent les dépasser. Les campagnes Héritage ont leurs propres parcours et ne sont pas remaniées ici.

## Protections et victoire

Quota serveur et affichage : six protections consommées par partie. Une septième nouvelle protection est refusée sans terminer la partie. Protéger à nouveau le même élément ne consomme pas une seconde utilisation. L'ouverture ultérieure d'un élément ne rembourse pas une protection.

| Rôle | Défaite automatique au-delà de trois protections ? | Critère observé dans le calcul serveur |
|---|---|---|
| Juge | Non | Exactitude de sa lecture finale ; le quota ne change pas `success`. |
| Enquêteur | Non | Lecture personnelle des responsabilités. |
| Analyste | Non | Lecture personnelle des responsabilités. |
| Procureur | Non | Lecture personnelle ou protection de sa cible selon son objectif privé. |
| Suspect | Non | Responsabilité reconnue par la décision faisant autorité. |
| Avocat | Non | Responsabilité exacte de son client officiel. |
| Inspecteur | Non | Action de terrain et résultat de l'enquête. |
| Expert | Non | Analyse technique et résultat de l'enquête. |
| Journaliste | Non | Publication et conclusion ; pénalités de conduite distinctes. |
| Témoin | Non | Absence de requalification formelle en suspect. |
| Espion secret | Non | Reconstruction imparfaite de l'enquête. |

Le quota peut influencer indirectement les informations accessibles et donc les décisions. Il n'est jamais une condition directe de défaite d'un rôle. Ancien score de continuation du juge : pénalité automatique de cinq points par protection, supprimée ici. Badge de discrétion : victoire et au maximum trois protections sur six ; ce badge reste un bonus facultatif.

Le test a également découvert une erreur SQL réelle dans la révélation si un avocat terminait sans client : `to_jsonb` recevait un littéral sans type. Le cast explicite `::text` corrige ce blocage.

## Vérification

- Test comportemental des deux modules ensemble : 120 tours de leurs fonctions périodiques, identité du nœud conservée, onglets stables, actions finales accessibles, libellés court/long.
- Test serveur transactionnel avec douze joueurs couvrant les dix rôles publics : protections 1 à 6 acceptées, doublon gratuit, septième refusée, victoire de chaque joueur identique avant/après les six protections. Transactions et joueurs de test annulés.
- Assertions sur assemblées, quotas d'événements, audiences, défenses et interrogatoires à 360 secondes dans les deux formats.
- Construction web et mobile avec les contrôles existants ; cache des modules modifiés renouvelé.

Limite : vérification comportementale en environnement simulé ; pas de partie complète jouée sur un iPhone physique. La migration doit être appliquée avec la livraison du client pour aligner les temps et le quota.

## Audit approfondi du 6 octobre — anomalies restantes

Périmètre : parcours standard de finale et chaîne de calcul `v52 → v47 → v50 → v44 → v4`, interfaces des rôles, formats et publication web/mobile. Les mécaniques internes de chaque campagne DLC ne sont pas intégralement simulées.

| Priorité | Constat confirmé | Conséquence | Correction recommandée |
|---|---|---|---|
| P1 | `igr_v44_assign_judge_integrity` donne parfois l'objectif « protéger une cible sans être détecté », mais `igr_v44_make_reveal` conserve la victoire basée sur toutes les responsabilités exactes. Les votes d'intégrité sont rapportés sans modifier cette victoire. | Un juge peut suivre sa carte corrompue et perdre selon un autre objectif. | Définir puis tester une victoire distincte pour le juge honnête et le juge corrompu, alignée sur sa carte. |
| P1 | `igr_v52_advance` enregistre automatiquement une note `Audience finale v52` comme conclusion du journaliste, y compris après PASSER. | Une publication peut suffire à valider sa victoire sans véritable angle final personnel. | Faire saisir et verrouiller son angle ; ne pas fabriquer une conclusion à sa place. |
| P1 | `igr_v52_maybe_finish` exige le verrouillage de tous les rôles du camp Enquête et tous les votes requis ; aucun délai de secours dans `locking`. Une audience en état `waiting` n'a pas de chrono non plus. | Un joueur déconnecté ou absent peut bloquer la partie indéfiniment. | Ajouter une reprise encadrée par l'hôte, avec trace et décision explicite pour les absents. |
| P2 | Le quorum de détection de corruption reste au moins deux votes « oui », même si une composition ne contient qu'un votant éligible. | La corruption devient impossible à déclarer dans cette composition. | Calculer le seuil sur les votants réellement présents et afficher ce seuil. |
| P2 | Inspecteur/Expert sont évalués dans le calcul de base selon la lecture de l'Enquêteur, tandis que la victoire de camp rapportée plus tard dépend du Juge, sinon du Procureur. | Résultat personnel et résultat du camp peuvent diverger ; l'interface doit expliquer les deux. | Nommer clairement l'axe individuel et l'axe collectif ou adopter une même autorité de référence. |
| P2 | Les fourchettes affichées sont fixes malgré le nombre variable de joueurs, les pauses et des sélections sans chrono. | 40–55 / 70–90 ne sont pas garantis pour toutes les compositions. | Estimation par composition et mention des pauses ; conserver une estimation, sans masquer une vraie limite absolue. |

La vérification des droits distingue les RPC publiques avec jeton de joueur des fonctions internes. `igr_v52_advance` et `igr_v52_maybe_finish` ne sont pas exécutables par `anon` ; les actions de finale publiques vérifient le jeton, le tour et la phase. Le verrouillage final valide les niveaux et refuse un second verrouillage. Le contrôle ne remplace pas un audit complet de sécurité de tous les RPC historiques.

Ces anomalies supplémentaires sont documentées, pas corrigées dans v58 : certaines nécessitent de fixer la règle de victoire ou la politique de reprise des absents. La v58 publiée ne doit donc pas être présentée comme un audit entièrement PASS de tous les rôles.
