# INSIDE GREY ROOM — OMERTÀ V5
## CINQ AFFAIRES AUTONOMES · UNE FAMIGLIA SANTORO · ZÉRO CONTINUITÉ OBLIGATOIRE

**Décision de l'auteur (25 octobre 2026) :** OMERTÀ est un **DLC anthologique**, **pas** une campagne HÉRITAGE. Les cinq dossiers 021–025 appartiennent au même univers de La Cosa Nostra italo-américaine, mais leurs intrigues **ne se recoupent pas**. Quelques clins d'œil non essentiels sont acceptés.
**Cette V5 supplante les documents V1–V4 sur l'architecture narrative inter-scénarios.** Elle conserve leurs choix compatibles : **Famiglia Santoro**, contexte mafieux authentique, **personnalité du joueur intégralement libre**, aucune obligation d'acting, bureau de la Grey Room nommé librement à chaque partie (fonctionnalité à développer).
**Statut :** projet éditorial en PR brouillon. **Aucun jeu de production ni donnée Supabase modifiés. Aucun changement CARTEL 029–031.**

## Règle structurelle non négociable : pas une saga

- Le dossier 021 n'est **pas** le prologue du 022; 022 n'explique pas 023; 024 ne découle pas de 021; 025 n'est **pas** la conclusion de 021–024.
- Chaque partie commence **à zéro** sur le plan des actes, des morts, des arrestations, des preuves et des conséquences. **Aucun état de campagne partagé** entre les cinq numéros.
- L'hôte peut lancer 025 avant 021, ou ne jouer qu'à 023, sans manque de contexte ni intrigue incompréhensible.
- La variante A/B/C est choisie pour la **partie et le dossier en cours**, jamais liée aux cinq numéros par une branche commune. Les variantes ne doivent pas défaire la vérité de cet épisode.
- Le décor est persistant comme **univers social**, pas comme chaîne d'événements : même nom Santoro, même géographie d'ambiance, même grammaire du pouvoir mafieux, même hiérarchie de principe. Des individus secondaires peuvent être mentionnés en caméo sans état variable importé.
- Les clins d'œil ne doivent contenir **ni spoiler, ni information nécessaire, ni contradiction** : une enseigne, un nom de restaurant, un commentaire anodin, une photographie ancienne, un capo cité uniquement pour situer une relation. Pas un ancien décès, une condamnation, une coopération ou un héritage « conséquence ».
- Les fins de partie sont **autonomes et complètes**, jamais « à suivre dans le 025 ».

**Critère automatique de vérification éditoriale :** lire l'introduction, les 3 cycles et les objectifs du 025 sans connaître les 021–024. Si un élément y manque, le 025 échoue à la règle de DLC. Répéter pour chacun des cinq dossiers.

## Audit des liens actuels à supprimer ou refaire

**Constat à partir des packs publics en base au 25 octobre 2026 :**
- **021 :** affaire d'enveloppe autonome en potentiel, mais noms et références actuellement Verri.
- **022 :** Paolo, Enzo, Matteo et Luca ont des positions qui peuvent être interprétées comme l'après-021 (notamment Paolo « désormais sous forte pression »). Introduire tous ces intérêts **dans l'affaire 022** plutôt que les emprunter au 021; éviter de faire du meurtre la suite du détournement de 021.
- **023 :** « guerre », attaque contre Adriano et négociations peuvent vivre seules; préciser le différend propre au 023; ne pas dépendre d'un état de Paolo ou d'Enzo défini ailleurs.
- **024 :** plusieurs noms et preuves sont réemployés pour faire remonter des opérations au sommet. Le Pentito doit posséder **son propre dossier judiciaire et ses propres infractions**. Aucune coopération, peine ou secret issu de 021–023.
- **025 :** introduction explicite « quatre dossiers ont laissé... », trame « dossiers précédents convergent... » et objectifs « selon les choix précédents ». **Retirer entièrement ces formulations et leurs dépendances.** Le 025 doit porter sur **une affaire neuve et suffisante**, où la responsabilité du Don se reconstruit uniquement avec des pièces du 025.
- **Architecture ancienne :** documents de continuité OMERTÀ et manuscrits privés A/B/C mentionnent une `saga`, un `saga_track`, des `cross_episode_dependencies`, et un verrou de branche de campagne 021–025. Ces structures **ne doivent plus déterminer les vérités ou choix du DLC**. À auditer puis neutraliser/découpler par migration ciblée après étude des appels en production; ne pas supprimer des tables à l'aveugle.

## Formule « 10/10 » commune aux cinq dossiers

1. **Autonomie narrative parfaite** — présentation suffisante des personnes, de leurs intérêts et du litige, sans autre dossier.
2. **Authenticité Cosa Nostra** — hiérarchie boss/underboss/consigliere/capo/soldato/associato, pouvoirs non omniscients, monde de New York et NJ vers 2006, interactions sociales sans clichés.
3. **Contexte incarnant** — entreprise, amis, parentés, rang, dettes, fidélités, cadre américain, sans scène théâtrale obligatoire.
4. **Personnalité libre** — le joueur garde son pseudo, ses réactions, ses valeurs et son style; seul le fait canonique de son implication lui est donné.
5. **Rôles tous utiles** — chacun détient une information, une relation ou une décision; aucun slot-joueur-poteau, règles d'effectif testées.
6. **Trois cycles puissants** — C1 installe des faits et une asymétrie, C2 renverse une lecture par preuve, C3 rend une confrontation et une décision nécessaires, sans twist arbitraire.
7. **Preuves justes** — des éléments garantis de C1 à C3 rendent la solution possible même sans confession; faits ≠ soupçons ≠ conclusions. Un clue facultatif enrichit sans bloquer.
8. **Décisions sous pression** — des choix moraux et tactiques humains, une valeur à protéger, des sacrifices possibles, des conséquences lisibles **uniquement dans la partie**.
9. **Rejouabilité A/B/C réelle** — changement important de la responsabilité/causalité, 3 sets complets de cartes, relations, trames et révélations, aucune fuite prématurée de variante.
10. **Qualité validée** — FR/EN, sécurité du canon privé, tests multijoueurs et relectures humaines. « 10/10 » reste un **objectif**, jamais une note prouvée avant essais.

## Refonte dossier par dossier (nouveaux cas proposés, non canons activés)

### 021 — L'ENVELOPPE — LA PAROLE A UN PRIX

**Affaire autonome** : un apport d'argent exigé d'un crew du New Jersey/Brooklyn n'arrive pas au destinataire annoncé. Les registres attestent des passages, mais une instruction est disputée. Chacun se demande s'il s'agit d'un vol, d'un détournement autorisé ou d'un manque de comptabilité. L'enquête sur la source de la fuite **n'est pas** automatiquement l'enquête sur l'argent.
**Objectif de la Grey Room :** distinguer 1) mouvement matériel de l'enveloppe, 2) décision de la détourner / erreur de compte, 3) réel bénéficiaire, 4) sources ayant eu connaissance des instructions.
**Mécanique signature :** *LE CERCLE* — une information sortie réduit l'ensemble de ceux qui **pouvaient** la connaître, jamais l'identité d'un informateur par magie.
**C1** collecte et contradictions factuelles; **C2** destination et vrais droits d'accès à l'information; **C3** recoupement indépendant des montants et du trajet, révélations/orientations finales.
**Rôles facultatifs à forte valeur :** comptable / contabile, procureur, avocat, inspecteur, conseiller du crew selon effectif. Pas de poste « taupe » forcé pour inventer une trahison.
**Antipatterns :** confondre argent manquant et trahison; résoudre tout le dossier par une unique quittance; imposer à un participant de « jouer Paolo » au lieu de lui assigner une implication réelle dans ce 021.

### 022 — OMERTÀ — UN HOMME EST MORT, PERSONNE N'ASSUME LA PHRASE

**Affaire autonome :** un homme proche d'un crew a été tué après une discussion violente entre subordonnés et responsable. Ceux qui ont entendu la même phrase n'en ont pas la même interprétation. Des proches se sont ensuite coordonnés pour présenter des versions compatibles. Rien ne découle du 021.
**Objectif :** départager commandement, pression, initiative du tueur et coordination du silence **après** le meurtre.
**Mécanique signature :** *L'ORDRE* — quatre qualifications distinctes et motivées (ordre explicite / menace / autorisation implicite / initiative). Un joueur peut réfuter une qualification par des faits, pas par une performance.
**C1** versions et dernière rencontre; **C2** preuve du trajet/du véhicule et du timing des paroles; **C3** preuve du silence organisé et de ce qu'elle ne prouve pas sur la commande initiale.
**Rôles utiles :** enquêteur + analyste; avocat pour arguments de frontière; juge/procureur pour qualifications sans omniscience.
**Antipatterns :** transformer une phrase vague en preuve suffisante, imposer un seul traître, faire du meurtre la suite d'un vol d'un épisode antérieur.

### 023 — LA TABLE — LA PAIX COÛTE CHER

**Affaire autonome :** des représentants de plusieurs intérêts criminels doivent négocier un conflit local sur un territoire / activité et éviter une escalade. Une place reste vide, puis une attaque vise un personnage central de **cette affaire**. Le spectateur du 023 ne doit connaître aucune querelle du 021/022.
**Objectif :** identifier qui savait quoi des déplacements, qui a fait fuiter une information, qui a facilité l'attaque, et distinguer influence de responsabilité directe.
**Mécanique signature :** *LE SIT-DOWN* — les positions des joueurs peuvent être verrouillées **avant et après** un événement. Ce qui est enregistré est l'engagement ou changement déclaré, **pas la conversation**. Les joueurs ne « jouent » pas un dialogue.
**C1** intérêts concurrents + chaise vide; **C2** découverte d'une information sur la sécurité / itinéraire; **C3** attaque annoncée comme événement interne et double lecture des engagements (ne pas deviner l'issue en jouant à un autre dossier).
**Rôles utiles :** médiateur du crew, représentant d'un intérêt commercial, témoin de la réunion, avocat ou analyste. Aucun boss « droit de déduire le coupable ».
**Antipatterns :** faire de la table un théâtre à dialogues, confondre soupçons et preuves, imposer la politique d'une partie précédente.

### 024 — IL PENTITO — L'INFORMATION QUI NE PEUT PLUS ÊTRE RETIRÉE

**Affaire autonome :** une arrestation fédérale concerne un associé d'une opération **propre au 024**. Il peut négocier des charges, une protection et la révélation d'un fait vérifiable. Toutes les preuves et obligations sont introduites dans cette partie.
**Objectif :** tester la valeur *nouvelle* des renseignements, les limites de chaque témoin, et la responsabilité propre du coopérant. Ne pas automatiquement exposer son identité par une règle de magie mafieuse.
**Mécanique signature :** *LE POINT DE NON-RETOUR* — engagement confirmé et conséquence claire après qu'une information réellement nouvelle est livrée, avec conditions de protection annoncées. Une simple confession non corroborée n'est pas une preuve.
**C1** ce que les fédéraux savent déjà; **C2** l'élément vérifiable inédit, sa portée et sa source; **C3** choix de coopérer ou pas, protection et coût moral/judiciaire interne à la session.
**Rôles utiles :** informateur/associé sans acting, procureur, avocat, analyste, cible des révélations.
**Antipatterns :** Paolo coopère « parce qu'il a survécu au 021 »; seuls les joueurs qui ont vu une autre mission comprennent les opérations.

### 025 — IL DON — LE POUVOIR SANS ORDRE ÉCRIT

**Affaire entièrement nouvelle, NON FINALE DE DLC** : dans une opération interne **unique au 025**, des décisions de protection, d'exclusion, de paiement et d'intimidation ont débouché sur une grave violence ou un préjudice. Plusieurs membres disent avoir agi selon la volonté de Don Santoro. Son nom circule, mais aucun témoignage individuel ne permet de conclure seul qu'il a ordonné chaque fait.
**Objectif :** remonter une **chaîne de décisions dans ce seul dossier** : ce que le Don a explicitement demandé, ce que son consigliere a transmis, ce qu'un capo a interprété et ce qu'un soldato a décidé seul. On peut établir des responsabilités différentes pour des actes distincts.
**Mécanique signature :** *LA CHAÎNE DES ORDRES* — les auditeurs distinguent reçu du sommet / reformulé / interprété / initiative sans accéder aux vérités privées par rang. Le Don peut répondre de ses décisions, pas « consulter le canon ».
**C1** une affaire Santoro précise et ses ordres originaux; **C2** version du conseiller et du capo / écarts matérialisés; **C3** reconstitution de chaque maillon et verdict, qui clôt totalement le 025.
**Rôles utiles :** procureur, juge, analyste, avocat, subordonnés ayant accès à un seul maillon; l'absence du Don comme joueur ne doit pas rendre l'affaire insoluble.
**Antipatterns :** « quatre dossiers précédents », « selon les choix précédents », « dossiers précédents convergent », « la finale de la Famiglia » ou besoin de connaître une arrestation/mort d'une autre partie.

## Découplage de l'ancien système de campagnes

Le runtime et les documents existants présentaient OMERTÀ comme une saga avec une table `igr_omerta_campaigns`, une sélection de branche, des manuscrits privés décrivant `cross_episode_dependencies` et des écritures de campagne. Cette architecture est **incompatible si elle contrôle la vérité ou importe l'état narratif d'un autre scénario**.

**À faire, sans suppression aveugle :**
1. Inventorier les champs et RPC de création de cellule, de verrou de variantes, de résultats et de campagne.
2. Définir une identité **par partie** (`room_code` ou mieux ID de session immuable) et un canon déterminé pour le scénario sélectionné indépendamment de tout autre numéro.
3. Conserver une table de campagne seulement si elle sert à autre chose de non narratif; **aucune branche ni état multi-épisode OMERTÀ ne doit influencer le DLC**.
4. Refaire les 15 manuscrits A/B/C en retirant les `cross_episode_dependencies` effectives; publier des documents C3 approuvés et sourcés, non marqués fictivement « approved ».
5. S'assurer que le nom **Santoro** est cohérent dans les 5 packs, leurs variantes, le runtime, les relations et les traductions, sans fuite de secrets.
6. Test 025 lancé **en premier** puis 021, test mêmes numéros joués avec trois variantes et joueurs différents, test sorties/reconnexions et effectifs faibles.

## La forme d'immersion propre à INSIDE GREY ROOM

**Le jeu n'est pas du théâtre**. Un joueur reçoit une implication, des preuves et des intérêts, tout en gardant ses propres réactions et sa personnalité. Aucun rôle ne demande d'adopter un accent, des répliques, une psychologie préécrite ou des qualités morales de mafieux.

La culture américaine italo-mafieuse est **un contexte de pression**, pas un costume. Le procès et la Grey Room sont fictifs, indépendants du système réel; ne pas revendiquer reproduire une procédure fédérale exacte.

**Le nom du bureau de Grey Room reste libre à chaque partie**, indépendamment de New York/NJ 2006 — cette fonctionnalité doit encore être intégrée au démarrage, elle n'est pas active dans les RPC inspectées.

**CARTEL 029–031 : aucun changement.**

## Évaluation avant la qualification « 10/10 »

Chaque dossier est évalué sur 10 critères (voir ci-dessus), puis testé sur de vraies parties. Le nombre 10/10 n'est **pas** donné par simple rédaction; il requiert zéro dépendance à un autre numéro, 3 variantes jouables et confidentielles, réussite même sans acting, absence de softlock, aucune contradiction de canon et retours de joueurs confirmant la tension / clarté.
