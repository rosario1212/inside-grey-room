# LE RÉGIME — Traque à deux fugitifs : identité, variantes, mort et responsabilité (v3)

**Statut : contrat historique de conception ; des règles sont désormais supplantées par `docs/REGIME_ALLIANCE_MANDATS_VERDICT_V5.md`. Gameplay NON implémenté au serveur, non fusionné et non publié.** Le déroulement d'une partie, les menus d'enquête, les contre-choix des fugitifs et la simulation 034 sont détaillés dans `docs/REGIME_PARTIE_TYPE_OPTIONS_TRAQUE_V4.md`. Ce texte supplante `docs/REGIME_DOUBLE_TRAQUE_032_034_V2.md` sur tous les points qu'il précise. Les règles actuelles 0/1/2 d'autres scénarios ne sont pas modifiées.

## 1. Règle absolue : chaque personnage incarné porte le nom du joueur

Les noms Harb Kassar, Youssef Baran, Mourad Kassar, Darian Kassar, Fouad Kassar, Ilyas Sayegh, Hamza Daher, etc. constituent des **identifiants de référence de la bible**, pas des noms imposés à l'écran. Pour chaque personnage joué — fugitif, troisième suspect, Enquêteur, Analyste, Juge et tout rôle optionnel — l'interface affiche le pseudonyme de son joueur, accompagné du titre : **« Alex — Président déchu »**, **« Thomas — Ministre de la Défense »**.

**Invariants techniques :**
- Identifiant serveur immuable `character_key` par fonction/personnage ; lien de parenté, identité au sein du gouvernement et vérité privée attachés à la clé, **jamais au pseudo**.
- Alias serveur `role_display_name` pris comme copie du pseudo du joueur au lancement, figé pour la partie ; filtrage des caractères de contrôle, longueur, HTML et unicode, pas de substitution globale des noms dans des chaînes non structurées.
- Toutes les cartes, archives, indices, organigrammes, demandes de capture, procès-verbaux, comptes rendus, convocations, objectifs, événements, verdicts et épilogues utilisent des références aux personnages pour générer les noms.
- Deux joueurs ayant le même pseudonyme se distinguent visuellement par leur **fonction** et leur identifiant interne ; ne pas les confondre.
- Les **personnes non incarnées**, témoins du passé, victimes et lieux conservent leurs identités fictives canoniques ; leur nom n'est jamais remplacé par celui d'un joueur.
- Les relations (« frère du président », « fils », « cousin », « gendre ») sont rendues à partir du graphe de parenté invariant, même si les pseudonymes des joueurs ne partagent aucun nom de famille.
- La fiche publique de préparation peut présenter les **fonctions** plutôt que les identités canoniques, afin de ne pas afficher des faux noms qui persisteraient en jeu.
- Les anciens titres et documents codés requièrent une migration serveur pour fonctionner : ne pas prétendre que le changement est actif à partir d'une simple modification du JavaScript de présentation.

## 2. Deux fugitifs actifs, trois variantes scellées par dossier

Les **deux fugitifs occupent les deux premières places de suspects** et ont des actions dès C1. La **troisième personne suspecte** est accessible aux auditions dès C1. Trois variantes par dossier, avec scripts, motivations, traces, relations, événements conditionnels et choix d'enquête **préécrits**. Aucun moteur ne génère à la volée une vérité à partir des joueurs.

| Variante | Situation de départ | Choix adverses structurants | Risque à équilibrer |
| --- | --- | --- | --- |
| **A — ENSEMBLE** | Les deux dirigeants partagent réellement un refuge ou une chaîne immédiate de protection | L'un peut couvrir l'autre ou coopérer pour se protéger ; une opération documentée peut ouvrir **deux demandes de capture** | Ne pas offrir 2/2 automatiquement sur un seul indice ; une corroboration propre à chaque personne reste nécessaire |
| **B — SÉPARÉS** | Chaque dirigeant suit un circuit de fuite distinct | Ils peuvent décider d'exposer l'autre réseau ou couper les communications | Les deux cibles doivent rester atteignables à C3 ; pas de piste impossible par absence de rôle |
| **C — ALLIANCE INSTABLE** | Les deux dirigeants commencent ensemble mais une rupture est **possible selon leurs décisions de C1** | Une trahison peut séparer le réseau, exposer un relais ou donner aux enquêteurs une chance anticipée | Pas de bifurcation aléatoire : cause, date et conséquence visibles dans les documents de variante |

**A/B/C ne signifie jamais trois solutions identiques avec des noms permutés.** Pour chaque scénario, les lieux, témoins, pièces et relations doivent être spécifiques et ne pas réutiliser un scénario complet sous un autre titre.

### Application différenciée

**032 — LES ARCHIVES DU PALAIS : prison et hiérarchie**
- Cible 1 : directeur de Vahran ; cible 2 : ministre de l'Intérieur.
- A : deux responsables liés à un même centre de transfert et à une couverture administrative ; le réseau institutionnel est leur faiblesse.
- B : le directeur fuit via d'anciens geôliers ; le ministre via le cabinet et les administrations provinciales.
- C : leur accord de silence s'effondre si l'un rejette la responsabilité des transferts sur l'autre ; des pièces de prison et des pièces ministérielles se confrontent.
- Support signature : **chaîne carcérale**, dates et transmissions ; pas de carte géographique de cachettes sans justification.

**033 — LA DYNASTIE : héritage et loyautés**
- Cible 1 : fils et héritier ; cible 2 : cousin et ministre de la Défense.
- A : protection d'un même cercle dynastique ; il faut deux justifications de présence avant une arrestation double.
- B : fils protégé par l'appareil de propagande et des fidèles du clan ; ministre par des relais militaires.
- C : alliance familiale initiale susceptible de se rompre, avec dénonciation volontaire d'un proche pour sauver ses propres relations.
- Support signature : **organigramme de loyautés et de ressources** ; pas de test de localisation simpliste.

**034 — LES NOMS QU'ILS PORTAIENT : chasse au sommet**
- Cible 1 : président déchu (nom du joueur) ; cible 2 : gendre et chef de sécurité.
- A : les deux se réfugient sous la protection d'un même cercle de fidèles.
- B : président et gendre sont volontairement séparés, ce qui crée de véritables pistes parallèles.
- C : ils commencent ensemble, mais le président peut rompre avec son gendre ou inversement sur une décision de C1.
- Support signature : **pistes de refuge, réseau de contacts et noms de code** ; le président peut être capturé dès C1 si la preuve préécrite et la stratégie des enquêteurs le permettent.

### Boucle de décisions des fugitifs dès C1

Pour chaque cycle, le dirigeant en fuite reçoit :
1. **Une décision stratégique** parmi deux ou trois actions prédéfinies, avec coûts visibles (préserver un relais, rompre une alliance, exposer un proche).
2. **Un court questionnaire réactif** lié aux nouvelles pièces de l'enquête (deux questions maximum, choix compatibles avec sa variante), dont la réponse devient une déclaration exploitable ; elle peut être mensongère, jamais convertie en preuve authentique.
3. **Une interaction sociale** possible avec l'autre fugitif ou le troisième suspect, dans les créneaux existants, avec limites pour ne pas monopoliser le jeu.

Une contre-mesure n'efface jamais une preuve historique, ne révèle jamais les objectifs secrets du camp d'enquête et ne rend pas une cible impossible à capturer.

## 3. Victoires, défaites et mort des dirigeants

### Victoire collective

- **Enquête gagne la TRAQUE :** les **deux** fugitifs sont validement capturés au plus tard à la clôture de C3.
- **Camp du pouvoir gagne la TRAQUE :** **au moins un** fugitif reste libre à la clôture de C3.
- À une seule capture, le camp d'enquête a un **résultat partiel**, pas une victoire complète. Le fugitif capturé a perdu individuellement et le fugitif libre a gagné individuellement. Le troisième suspect peut avoir un objectif privé distinct, non automatiquement synonyme de fuite.
- Une capture validée est un événement **irréversible pour ce personnage**. Elle peut arriver en C1 sans devoir attendre C2/C3.
- Si 2/2 en C1 ou C2, victoire collective annoncée et verrouillée ; les cycles suivants passent au **volet judiciaire** sans refaire jouer une traque artificielle.

### Défaite et issue fatale

Le choix d'auteur demandé est noir et explicite : **être découvert et capturé entraîne la défaite immédiate du fugitif et son exécution dans l'épilogue de cette partie**. On ne présente **jamais** la capture comme preuve automatique de génocide, meurtre ou responsabilité pénale.

Pour ne pas exclure un joueur capturé au C1, la **mort narrative a lieu au dénouement** (l'exécution est annoncée dans un paragraphe factuel, non un spectacle gore). Le joueur perd **son objectif de fuite à l'instant de la capture**, puis reste actif comme prisonnier de l'autorité de transition : il peut consulter son dossier, présenter une défense, confronter un autre suspect, répondre à ses contradictions et produire sa dernière déclaration au cours des cycles restants. Il n'a plus le droit de se déplacer ou de dissimuler de nouveaux relais.

**Important :** le tribunal chargé d'établir la responsabilité individuelle ne doit pas être décrit comme ayant prononcé légalement une condamnation à mort par le seul fait de la capture. Dans la fiction noire de Karsane, l'exécution peut être imposée **séparément par des factions de transition** ; elle constitue alors une violence politique extrajudiciaire, non un verdict de culpabilité du Juge. Le texte doit signaler cette distinction et la gravité de la situation. S'il est souhaité d'avoir un tribunal protecteur de la légalité, il faudra **renoncer à l'exécution automatique**, faute de cohérence procédurale.

**Affichage des résultats :**
- **CAPTURÉ C1 / C2 / C3 — DÉFAITE PERSONNELLE — SORT FATAL À L'ÉPILOGUE.**
- **EN FUITE FIN C3 — VICTOIRE PERSONNELLE** du dirigeant ; il n'est pas déclaré innocent.
- **CAMP D'ENQUÊTE : 0/2, 1/2 ou 2/2 capturés** comme compteur opérationnel (ce n'est *pas* un barème de responsabilité).
- **QUALIFICATIONS JUDICIAIRES : constat distinct** des crimes allégués et des éléments établis ; résultat interprétable même si la traque est gagnée ou perdue.

### Anti-arbitraire pour les captures

Une capture requiert des **liens probants** (au moins deux sources de provenances indépendantes), une piste temporellement cohérente et une décision de recherche prise par le camp enquête ; le serveur vérifie les conditions avant toute arrestation. Le Juge contrôle l'ordonnance procédurale, mais n'est pas libre de valider une capture illégale ni d'en empêcher une valide arbitrairement. Le succès ne dépend ni du hasard, ni du choix d'une cachette au hasard, ni de la majorité des joueurs mal informés.

En variante A, une seule opération dans le refuge partagé **ne capture pas automatiquement les deux personnes** : chaque cible doit être rattachée séparément aux preuves de présence. Une capture peut entraîner l'alerte de l'autre si les joueurs ont mal préparé l'opération.

## 4. Remplacer le 0/1/2 : fiche de responsabilité par actes

Le résultat du DLC est **bi-dimensionnel** :
- **Poursuite / survie :** capture de deux personnes ou non (objectif principal compétitif).
- **Responsabilité individuelle :** actes et implication démontrés pour chaque suspect, sans barème de culpabilité 0/1/2.

### Grille commune de responsabilité

Pour chaque personne susceptible d'être mise en cause, le camp d'enquête complète une **fiche de charges** avec trois entrées :

**Question A — QU'A-T-IL FAIT ?**
Sélectionner les **actes concrets** liés au dossier (sélection multiple, liste préécrite et variable par variante) : ordonné une arrestation, organisé un transfert, décidé une opération militaire, autorisé les moyens, dirigé une unité, falsifié un registre, dissimulé des preuves, demandé la protection d'un complice, etc. Un acte *non établi* doit pouvoir rester non retenu.

**Question B — QUE SAVAIT-IL ET QUE POUVAIT-IL FAIRE ?**
Choisir les éléments corroborés : a reçu un rapport, a donné un ordre, avait un contrôle effectif, était averti des crimes, pouvait les prévenir / les sanctionner, avait une intention spécifique (nécessaire notamment à une qualification de génocide). Plusieurs éléments peuvent coexister. Aucune parenté ou fonction ne suffit seule.

**Question C — QUELLE FORME DE RESPONSABILITÉ EST ÉTABLIE ?**
Choisir parmi les formes proposées par le dossier : auteur direct, instigateur/ordonnateur, aide ou participation, supérieur hiérarchique ayant manqué à prévenir ou réprimer malgré son contrôle et sa connaissance, **aucune participation suffisamment établie**. Ce n'est pas une hiérarchie automatique de « plus coupable » à « moins coupable » ; plusieurs qualifications doivent pouvoir être discutées et le Juge motiver ce qu'il retient.

L'interface présente pour chaque acte/élément la qualité de la preuve : **corroborée / contestée / insuffisante**, liée à des pièces préécrites, sans jauge ou score de moralité.

**Spécificité par dossier :**
- **032 :** arrestations, transferts, torture, disparitions, dissimulation, contrôle de la prison et de l'Intérieur.
- **033 :** planification de la guerre d'agression, bombardements de civils, campagne d'extermination, intention particulière contre les Veyrins, financement et falsification des rapports.
- **034 :** décisions et transmissions sous noms de code, commandement du sommet, ordres contradictoires, coordination et dissimulation.

L'Analyste propose des correspondances actes-preuves ; l'Enquêteur prépare les charges en l'absence du Procureur ; le Procureur optionnel les soutient quand il est présent ; le Juge valide uniquement les conclusions motivées au regard des éléments de sa session. Les responsabilités sont évaluées **après** les décisions de traque, sans modifier rétroactivement les captures.

### Décompte séparé de performance

- **Victoire traque :** condition 2/2, unique et non pondérée.
- **Qualité de reconstitution judiciaire :** exactitude des faits retenus, cohérence des liens entre actes et preuves et distinctions entre formes de responsabilité. Si besoin, le moteur attribue des points par éléments corrects et erreurs de preuve, sans les convertir en niveaux de culpabilité 0/1/2.
- **Objectifs personnels des dirigeants et du troisième suspect :** séparés et intelligibles (ne pas perdre son objectif de survie en raison d'une fausse accusation).

## 5. Faut-il un nouveau rôle de CHERCHEUR / TRAQUEUR ?

**Recommandation : NON, pas comme joueur supplémentaire dans la première version.** Il ferait doublon avec l'Enquêteur, augmenterait le nombre minimum de participants ou créerait une place facultative trop puissante lorsqu'elle est présente.

Créer à la place une **action spécialisée de l'Enquêteur : « DIRIGER LA TRAQUE »**.
- C1/C2/C3, dans un créneau existant de 1–2 minutes, l'Enquêteur **présente deux pistes** déjà autorisées ; l'Analyste indique laquelle a une corroboration suffisante (avis argumenté, sans dévoiler la vérité cachée).
- Le camp d'enquête **débat et valide la recherche**, puis l'Enquêteur confirme la piste retenue ; Juge supervise uniquement le mandat et la recevabilité, jamais la localisation.
- Dans une partie sans Procureur, l'Enquêteur peut cumuler la présentation des charges **mais pas** les décisions judiciaires. Ajuster les quotas pour ne pas le surcharger.
- Une décision sans justification probante est rejetée avec cause claire et coût borné ; aucune malchance aléatoire.
- Si tests réels montrent que l'Enquêteur est surchargé, envisager ensuite un Chercheur **en remplacement d'un rôle optionnel**, avec action distincte. Ne jamais l'ajouter juste pour meubler les trois cycles.

## 6. QA/contrat serveur indispensables

1. Trois variantes A/B/C **par scénario**, chacune capable d'atteindre 2/2 par recoupements cohérents et offrant des moyens réellement jouables de fuite.
2. Preuves pour chaque cible accessibles en C1 lorsque la capture anticipée est prévue ; **aucune révélation secrète de C2 indispensable** pour une capture C1.
3. Éviter les parties où variante A offre mécaniquement un double raid gagnant facile, où B est impossible en 3 cycles ou où C permet de disparaître sans contre-preuve.
4. Deux fugitifs actifs dès C1, et **tous les capturés participent jusqu'à C3** par le volet judiciaire ; test d'absence de joueurs inactifs.
5. Collision de noms, caractères Unicode, pseudonymes longs, reconnexion, documents historiques, partage et révélation.
6. Rôles obligatoires Enquêteur + Analyste + Juge + trois suspects ; Procureur optionnel ; **le minimum actuel de 034 est 7**, donc changer les contrats client et serveur ensemble si l'on veut passer à 6.
7. Le barème historique 0/1/2 d'autres packs ne doit pas être écrasé ; nouvelle grille spécifique au Régime à encoder et valider seulement après audit des tables, RPC et clients.
8. Différencier capture, exécution politique et responsabilité établie, y compris si la partie comporte un acquittement moral ou une charge insuffisante.
9. Simulations à 6/7/8/9 joueurs, avec Procureur absent/présent, captures C1, captures à C3, une seule capture, deux fugitifs libres, captures en variante A/B/C.
10. Les actions des fugitifs sont scellées côté serveur ; le client n'est pas source de vérité. Aucun déploiement avant tests.

