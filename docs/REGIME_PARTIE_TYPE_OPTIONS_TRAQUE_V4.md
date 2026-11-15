# LE RÉGIME — Partie type, actions de traque et décisions des dirigeants (v4)

**Statut : DOCUMENT DE CONCEPTION NON ACTIF.** Il précise et prolonge `docs/REGIME_TRAQUES_IDENTITES_VICTOIRES_RESPONSABILITES_V3.md`. Ni la traque, ni ses captures, ni le Juge obligatoire, ni les fiches de responsabilité n'ont été activés côté serveur. La PR #495 demeure en brouillon.

## 1. Le titre doit résumer la mécanique, pas seulement l'ambiance

| Dossier | Début narratif | Deux fugitifs | Mécanique vraiment propre | Ce que l'enquêteur tente d'établir |
| --- | --- | --- | --- | --- |
| **032 — LES ARCHIVES DU PALAIS** | Le palais contient des archives de transfert de Vahran et des visas ministériels contradictoires | Directeur de Vahran + ministre de l'Intérieur | **CHAÎNE CARCÉRALE** : relier décrets, registres, administration et derniers correspondants des deux dirigeants | Quel document relie individuellement chaque fugitif à un relais vérifiable et à une piste actuelle ? |
| **033 — LA DYNASTIE** | La famille présidentielle se fragmente après la guerre et les massacres | Fils héritier + cousin ministre de la Défense | **ARBRE DE FIDÉLITÉ** : distinguer parenté, loyauté déclarée et soutien vérifié, en observant les ruptures | Quel appui familial ou institutionnel est encore actif pour chaque dirigeant et lequel peut mener à sa capture ? |
| **034 — LES NOMS QU'ILS PORTAIENT** | Le président et son gendre ont disparu derrière des surnoms de pouvoir et des relais changeants | Président + chef de la sécurité présidentielle | **IDENTITÉS SOUS COUVERTURE** : attacher un nom de code à une personne, une opération et une période, puis recouper les pistes | Qui se cache derrière quel code **à cette date**, et quelle chaîne documentaire permet d'identifier sa présence ? |

Chaque dossier conserve la dictature de Karsane, ses 15 millions d'habitants avant-guerre, sa guerre d'agression, le génocide des Veyrins, la prison de Vahran et le clan exclusivement masculin. **Les noms de TOUS les personnages joués proviennent de leurs joueurs** ; seuls les identifiants de rôle et les noms de personnages non joués restent des référents de canon.

## 2. Base de six joueurs, sans Chercheur artificiel

- **Enquêteur (camp enquête)** : fixe la question de recherche du cycle et choisit la piste/opération à soumettre après discussion collective. Il ne connaît ni les caches ni le résultat à l'avance.
- **Analyste (camp enquête)** : tient une matrice d'indices (source / date / cible / contradiction), distingue signaux de preuves et conseille l'Enquêteur. Il participe activement à la recherche et aux fiches de responsabilité.
- **Juge (institutionnel, indépendant sur les procédures)** : accorde ou refuse un mandat sur des critères préétablis, statue sur une contestation, préside l'audience. Il ne choisit pas les lieux de recherche ni les conclusions de l'accusation. Son objectif personnel est la qualité procédurale ; la capture réussie n'autorise pas le favoritisme.
- **Fugitif A (camp du régime)** : cible recherchée, 1 décision stratégique + 1 réaction à un renseignement chaque cycle avant arrestation ; défense et confrontations après.
- **Fugitif B (camp du régime)** : les mêmes droits, mais ressources, informations et objectifs **distincts** selon le dossier.
- **Troisième suspect (camp du régime avec objectif individuel possible)** : présent pour les interrogatoires dès C1, détenteur de pièces partielles ; peut négocier, mentir, protéger ou compromettre les fugitifs, toujours sous des contraintes de variante.

**Procureur facultatif** : lorsqu'il est là, construit le dossier de charges avec l'Analyste et prépare les contradictions. Sans lui, l'Enquêteur présente les charges et le Juge reste neutre. Le Témoin/Journaliste facultatif apporte une source prévue dans la variante ; son absence doit être compensée.

**Ne pas ajouter de Chercheur pour v1 de production.** Le rôle découperait inutilement l'Enquêteur. Si les simulations révèlent une surcharge, tester une délégation d'action à l'Analyste, puis seulement une place optionnelle sans accroître le minimum.

## 3. Comment l'arrestation marche : une règle déterministe et compréhensible

Chaque cible possède un **dossier de recherche privé au serveur**, dont seuls certains indices sont affichés aux joueurs :
1. **Relais ou identité** : l'enquête a relié cette personne à un réseau vérifiable, pas seulement à son titre.
2. **Piste temporelle** : une source permet de rattacher une action ou présence à la période courante de recherche, sans se contenter d'un vieux document.
3. **Corroboration indépendante** : une deuxième source distincte confirme la piste, ou bien contredit explicitement un alibi.

L'Enquêteur propose une **opération d'interpellation** sur une piste autorisée ; l'Analyste indique les pièces disponibles ; le Juge examine le mandat ; **le serveur** vérifie la relation probante et calcule immédiatement capture ou échec motivé. Le joueur choisit réellement ; aucun bouton ne révèle par avance la réponse correcte.

**Budget de tentatives proposé** : au plus **une demande d'interpellation par cible et par cycle**. Il est donc possible d'arrêter les deux personnes au même cycle si les deux dossiers sont suffisants (une seule localisation commune ne suffit pas pour deux mandats). Les enquêtes ordinaires et dialogues restent possibles. Les demandes erronées sont journalisées et consomment le créneau de la cible pour ce cycle ; pas de pénalité aléatoire supplémentaire.

**États par cible :** RECHERCHÉ → PISTE ACTIVE → IDENTIFIÉ/LOCALISÉ (si preuve autorisée) → CAPTURÉ (défaite personnelle irréversible) ; ou toujours EN FUITE à la fin de C3. Les enquêteurs voient l'état des preuves *autorisées*, pas une jauge magique affichant le vrai refuge ou la probabilité de réussite.

- **Capture C1** : des indices accessibles au premier cycle peuvent suffire, notamment un document initial et une déposition indépendante correctement choisis. Les deux variantes difficiles ne doivent pas être rendues impossibles par construction.
- **Échec de mandat** : refus procédural documenté si incohérence ou provenance insuffisante ; si mandat valide mais piste factuellement contredite, l'opération échoue et la justification est rendue après l'action dans la limite des informations publiables, sans révéler toute la variante.
- **Capture 2/2 en C1 ou C2** : victoire de traque du camp enquête verrouillée ; les cycles restants basculent en confrontation et jugement des responsabilités sans éliminer les joueurs capturés.

## 4. Menus du camp enquête : vrais choix, coût et gain

### 032 — CHOISIR UN CIRCUIT CARCÉRAL
- **REGISTRES** : recouper numéros de transfert, horaires et anomalies ; révèle une piste documentaire sur le directeur.
- **VISAS DU PALAIS** : comparer signatures et destinataires ; peut ouvrir une piste sur l'Intérieur.
- **AUDITION DE RELAIS** : confronter la version du troisième suspect avec une entrée de registre ; peut corroborer ou démolir une hypothèse.

Un document ancien ne localise pas automatiquement son signataire dans le présent. Le titre « Les Archives du Palais » est justifié parce que les pièces qui permettent de *comprendre et ouvrir* la traque ont été retrouvées dans le palais.

### 033 — CHOISIR UNE BRANCHE DU CLAN
- **SOUTIENS FAMILIAUX** : retrouver des relations vérifiables dans le graphe de parenté et de loyauté.
- **RESSOURCES DU RÉGIME** : confronter une dépense ou un décret avec une déposition authentique pour suivre la branche du ministre.
- **DÉCLARATIONS DE RUPTURE** : interroger le troisième suspect sur la loyauté du fils et du cousin ; une trahison peut créer un nouvel indice, pas une capture gratuite.

Le tableau est un **arbre de fidélité**, pas une carte de prison ni une simple liste de cachettes.

### 034 — CHOISIR UNE IDENTITÉ ET SON RÉSEAU
- **DÉCODER UN NOM** : confronter « Notaire / Tour / Héritier » à une période et une fonction ; ne localise personne à lui seul.
- **RECROISER LES RELAIS** : confronter deux contacts attribués à une même personne ; certaines pistes deviennent exploitables.
- **CONFRONTATION DU PALAIS** : interroger le troisième suspect sur des versions incohérentes, permettant éventuellement une demande de capture au même cycle.

Le tableau représente des identités et des sources de première main. L'existence d'un pseudonyme ne fait pas automatiquement tomber un mandat.

Les trois menus sont des **catégories de décisions narratives**, pas des opérations physiques ou des guides de recherche réelle de personnes.

## 5. Menus des dirigeants et pression sur l'enquête

Chaque fugitif dispose de deux décisions stratégiques contextuelles par cycle ; **une seule est sélectionnée**. Chaque décision annonce un risque et un effet limité, préécrits au serveur, et n'efface aucun fait historique. Il doit aussi répondre à un microquestionnaire (deux questions maximum) sur l'une des révélations reçues. La réponse prend la forme d'une **déclaration de personnage**, pas d'une preuve certifiée.

### 032 — Directeurs et ministère
- **ACCUSER LE BUREAU SUPÉRIEUR** : détourner publiquement la responsabilité d'un transfert, mais ouvrir une contradiction documentaire qui peut mener à son supérieur.
- **PRÉSERVER LE SECRET DE SERVICE** : retarder une piste secondaire pendant une phase au prix d'une déclaration plus difficile à défendre.
- **LIVRER UN RELAIS** (conditionnel) : sacrifier un ancien subordonné ou un protecteur ; expose une source exploitable contre l'autre cible.
  
### 033 — Héritier et Défense
- **APPEL À LA LOYAUTÉ** : choisir la branche du clan que l'on défend ; un proche soutient la version publique, mais son implication devient recoupable.
- **ROMPRE AVEC LE COUSIN / LE FILS** : révéler un fait réel au détriment de l'autre, contre un risque de perte de protection.
- **REVENDIQUER UN ACTE OFFICIEL** : assumer une décision secondaire pour contester l'accusation principale ; peut servir ou desservir la défense.

### 034 — Président et sécurité
- **MAINTENIR LA VERSION COMMUNE** : répondre de façon coordonnée sur un acte déjà attesté ; cela renforce une alliance mais multiplie les contradictions testables.
- **DÉSAVEU PUBLIC** : déclarer que l'autre personnage a outrepassé ses fonctions ; permet à l'enquête de confronter cette assertion à un document.
- **ROMPRE UN CONTACT** : perdre volontairement une relation dans le tableau des fidèles ; une trace indépendante demeure disponible, si sa variante l'a prévue.

Chaque action comprend un **contrat d'effets par variante**. Elle ne désactive jamais toutes les sources d'une cible, ne donne pas de GPS omniscient et n'invente jamais un témoignage irréfutable. Éviter toute véritable procédure d'évasion applicable au monde réel : les effets restent abstraits, fictionnels et liés à l'interface.

**Après capture :** le joueur ne choisit plus d'action de fuite ; il répond aux charges, choisit son argument de défense, peut négocier ou contredire un ancien fidèle. Sa défaite de survie est actée ; sa présence en partie demeure jusqu'à la révélation. Mort/exécution seulement dans l'épilogue et distincte des constatations du tribunal.

## 6. Variantes A/B/C : les scénarios doivent être jouables et pas juste cosmétiques

- **A, ENSEMBLE** : les deux fugitifs partagent un même relais et une protection ; il faut néanmoins une preuve spécifique pour chacun. Possibilité de deux captures rapides si le camp enquête est méthodique.
- **B, SÉPARÉS** : deux circuits de protection indépendants ; l'enquête peut concentrer ses efforts sur un chef ou disperser ses ressources, mais deux captures restent accessibles.
- **C, ALLIANCE FRAGILE** : départ ensemble ; l'un des joueurs peut, par décision C1, rompre leur alliance et modifier les pistes du C2. Sa décision a une conséquence visible et des contre-preuves existantes.

Les trois variantes doivent conserver l'unité du monde : 15 millions avant-guerre, Vahran, crimes d'État, génocide et structure des fonctions. Les noms affichés viennent des joueurs. **La responsabilité des crimes** est elle aussi diversement attribuée selon les pièces de la variante, mais les morts/victimes historiques du monde ne changent pas pour créer un coup de théâtre.

## 7. Comment se déroule une partie (respect du moteur v52)

### Carte privée, avant Assemblée I
- Deux joueurs découvrent leurs fonctions de dignitaires fugitifs, le troisième son rôle de suspect interrogeable. Chaque personne jouée affiche le nom/pseudo de son joueur. Les deux fugitifs **ne savent pas automatiquement ce que l'autre sait** ; même s'ils sont ensemble au départ, leurs cartes privées ne sont pas partagées.
- L'Enquêteur lit trois pistes initiales, l'Analyste lit les sources à distinguer, le Juge ses règles de recevabilité. L'organigramme public révèle les liens de famille et de fonction, pas les refuges.
- Si Procureur absent, l'Enquêteur prend en charge la rédaction des charges en fin de partie.

### Assemblée I — 05:00 (durée moteur v52)
- Enquêteur propose une stratégie ; Analyste présente les premières contradictions ; camp d'enquête choisit une branche d'investigation.
- Le Juge ne participe pas à une discussion sur la culpabilité pour préserver son impartialité, mais examine les demandes de procédure.

### Cycle 1 — Première traque, possible capture immédiate
- Enquête : ouvre un circuit spécifique au scénario, interroge le troisième suspect, obtient les pièces du cycle.
- Fugitifs : chacun prend son choix stratégique et répond au microquestionnaire ; le réseau peut changer immédiatement.
- Enquête : jusqu'à **une demande de capture par cible** si les indices le permettent ; le Juge examine, le serveur décide.
- Capturé : continue en phase de défense ; libre : continue à agir sur ses liaisons.

### Assemblée II — 04:00
- L'Analyste compare les hypothèses, le groupe répartit l'attention entre les cibles encore libres, et le Procureur éventuellement présent prépare les charges.

### Cycle 2 — Rupture, défection ou confrontation
- Les chefs non capturés peuvent s'entraider ou s'affaiblir. De nouvelles pièces disponibles permettent de confirmer ou d'écarter les pistes.
- Les captifs déposent une défense et peuvent confronter l'autre fugitif ou le troisième suspect par les mécanismes autorisés.
- Nouvelles demandes de capture, dans les mêmes limites.

### Assemblée III — 04:00
- Choisir ce qui reste à chercher, contrôler les deux sources indépendantes, préparer l'audience. Ne pas révéler artificiellement les bons refuges.

### Cycle 3 — Dernières captures et dossiers de responsabilité
- Derniers choix des fugitifs, nouvelles auditions, dernier mandat possible pour chaque personne encore libre.
- Camp enquête établit les **actes attribués, connaissances et forme de participation** avec des preuves plutôt qu'un niveau 0/1/2.

### Audience finale — procès du régime
- Juge rend les décisions motivées sur les **personnages accessibles au tribunal** ; les personnes restées en fuite ne sont pas jouées fictivement comme si elles avaient comparu.
- Une capture vaut **défaite de fuite immédiate** et exécution fictionnelle différée en épilogue par les factions de transition, indépendamment du verdict de responsabilité.
- Le serveur révèle : capture 0/2, 1/2 ou 2/2 (objectif de traque), gagnant collectif, résultat individuel de chaque fugitif, qualité des responsabilités reconstituées, et épilogue.

## 8. Exemple de partie simulée — 034, variante C, six joueurs

**Les noms sont des exemples de pseudonymes, aucun dossier canonique effectif n'est encore écrit.**
- Alex — Président déchu, fugitive A ; Sami — Gendre / chef de sécurité, fugitif B ; Hugo — Ancien responsable des transmissions, troisième suspect ; Léa — Enquêteur ; Yanis — Analyste ; Camille — Juge.
- Début C1 : Alex et Sami partagent un réseau, mais chacun cache certaines traces à l'autre. Les enquêteurs disposent de trois sources initiales, dont deux peuvent converger si la bonne branche est examinée.
- **C1** : Léa privilégie la confrontation des noms de code et les contacts du cabinet. Hugo reconnaît une correspondance, tout en cachant une autre information. Sami choisit de protéger sa propre position en désavouant Alex ; Alex maintient sa version officielle. Yanis recoupe deux pièces qui rendent possible la capture du **Président**, et le Juge vérifie le mandat. Alex est capturé dès C1 (défaite de fuite acquise), mais Sami reste libre.
- **C2** : Alex, détenu, conteste une pièce et témoigne sur l'autorité de Sami. Sami répond par un démenti préécrit et sacrifie une relation. La traque de Sami progresse mais la demande de capture n'est pas encore justifiée : il échappe au C2.
- **C3** : le camp enquête exploite la contradiction avec une seconde source. Mandat valide puis capture de Sami. **2/2 : victoire de traque** pour l'enquête. Les deux joueurs capturés ont perdu individuellement, mais participent à l'audience et contestent les actes qui leur sont reprochés.
- **Audience** : le Juge détermine quels actes sont corroborés, contestés ou insuffisants ; le verdict de responsabilité n'est pas une simple conséquence de l'arrestation. L'épilogue décrit le sort fatal des captifs sous les factions de transition.
- **Autre issue possible de cette même variante** : Sami conserve sa liberté au C3 ; **1/2 : victoire collective de fuite du régime**, défaite personnelle d'Alex, victoire personnelle de Sami. La preuve des crimes reste évaluée distinctement.

**Simulation illustrative, non jouée ni validée dans le moteur.**

## 9. Risques d'équilibrage et prochaines étapes d'implémentation

1. Écrire pour **chaque scénario et chaque variante** un vrai graphe de pistes : sources, fausses pistes avec cause, deux corroborations indépendantes par cible, conséquences de chacune des options fugitives, effets du troisième suspect.
2. Encoder des conditions de capture et journal d'événements serveur, idempotence, quotas d'une tentative par cible/cycle, compatibilité avec la phase de jeu et reconnexion.
3. Refondre l'affectation des fonctions des trois suspects sans augmenter inutilement les effectifs ; conserver les six rôles de base et le Procureur facultatif, Juge toujours obligatoire.
4. Remplacer 0/1/2 **seulement dans LE RÉGIME** avec une fiche d'actes, connaissance/pouvoir effectif et forme de responsabilité, puis définir un score d'exactitude explicable.
5. Concevoir l'écran de réseau différent pour chaque dossier : chaîne carcérale 032, arbre des fidélités 033, identités et refuges 034.
6. Vérifier qu'en C1 on peut réellement capturer par preuves accessibles, et que la capture partagée en variante A ne devient pas automatique.
7. Tester au minimum ces issues par variante : 0/2, 1/2, 2/2 ; capture C1/C2/C3 ; ensemble/séparés/rupture ; un Procureur présent/absent ; plusieurs tailles de groupe.
8. Simuler toute la partie depuis 6 smartphones, l'exécution différée, l'audience et les reconnects ; ne pas publier sans le test du serveur.

