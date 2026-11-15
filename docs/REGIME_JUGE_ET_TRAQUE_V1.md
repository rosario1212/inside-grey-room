# LE RÉGIME — décision de design : jugement permanent et traque du président v1

**Statut : proposition de refonte enregistrée, NON activée dans le runtime.** Prévaut sur l'idée d'un rôle exclusif de Transfuge et sur les anciens assemblages publics de rôles 032–034. Ne pas fusionner avant tests de compatibilité serveur.

## 1. Ne pas forcer un nouveau rôle

La singularité du DLC doit venir de l'interaction entre les rôles existants, les suspects politiques, la chaîne du pouvoir et une traque structurée. Le Transfuge n'est **pas retenu dans la composition cible**. Un ancien agent de renseignement peut exister comme témoin ou PNJ documenté, sans ajouter une action spéciale ni une place obligatoire.

### Composition cible des 3 dossiers

| Rôle | 032 | 033 | 034 | Consigne |
| --- | --- | --- | --- | --- |
| Enquêteur | requis | requis | requis | En l'absence de Procureur, énonce les charges proposées |
| Analyste | requis | requis | requis | Rapproche documents, dates, liens de commandement |
| Juge | requis | requis | requis | Contrôle procédure, arbitrage, verdict motivé |
| 3 suspects | requis | requis | requis | Anciens dignitaires, dont président dans 034 |
| Procureur | optionnel | optionnel | optionnel | Dépose et soutient les charges lorsqu'il est présent |
| Témoin / Journaliste | optionnel | optionnel | optionnel | Une place disponible, selon dossier et priorités |

Minimum cible **6** pour chaque dossier, mais 034 est actuellement configuré pour 7 ; ce changement doit être validé dans TOUS les contrats de nombre de joueurs et rôles, la sélection des rôles, les fonctions serveur, l'audience et les tests de déploiement. Ne pas modifier seulement SCENARIO_ROLES côté navigateur.

**Juge requis :** il assure une action de procédure pertinente à chaque cycle :
- C1 : arbitrer un périmètre de divulgation / une requête contradictoire, sans bloquer les indices indispensables ;
- C2 : statuer sur l'organisation d'une confrontation contestée, selon les règles du dossier ;
- C3 : présider l'audience, examiner les charges soutenues, motiver un verdict individuel.

**Procureur optionnel :** si absent, la partie ne simule pas un Procureur contrôlé par un ordinateur. L'Enquêteur présente les charges, l'Analyste fournit la chronologie et le Juge demeure indépendant. Il ne plaide jamais pour l'accusation. Si présent, le Procureur structure les chefs d'accusation et conteste les dénégations. Les deux modes ont des quotas et une expérience équivalents, sans avantage automatique aux grandes parties.

## 2. Mécanique signature proposée : LA TRAQUE

Inspirée du principe historique d'une chasse au dictateur à travers **ses relations, ses intermédiaires et des renseignements recoupés**, pas d'un GPS omniscient ni d'un événement aléatoire. Le modèle doit sentir l'isolement politique, l'effondrement du clan et les mensonges mutuels.

### Écran permanent : LE RÉSEAU DE FUITE

Trois onglets dans un même panneau, pas trois écrans lourds :
1. **CLAN** — liens de parenté et fonctions officielles connues au début ;
2. **FIDÈLES** — intermédiaires, refuges, itinéraires ou appuis documentés ; connexions découvertes pendant la partie ;
3. **TRAQUE** — statut de plusieurs pistes fictives préécrites : *signalée*, *corroborée*, *contredite*, *abandonnée*, *exploitable*.

Tout état provient du serveur après une action autorisée : déposition, enquête, confrontation, document. Il ne faut ni géolocaliser de vrais joueurs ni reproduire une opération militaire en temps réel.

### Utilisation différente selon le scénario

- **032 — LES ARCHIVES DU PALAIS : « LES FIDÈLES »**
  La police politique, les geôliers et les bureaux du palais se renvoient la responsabilité des détenus. Certaines pièces révèlent aussi quel secteur du clan a préparé la fuite ou protégé des dignitaires. Le tableau visualise surtout les **liaisons entre institutions**. Il ne doit pas voler la vedette aux crimes de Vahran.

- **033 — LA DYNASTIE : « LA CHUTE »**
  Les massacres et la guerre d'agression sont examinés à partir des décisions de Défense, de l'héritier et de la sécurité. Les réseaux de financement et de fidélité révèlent qui a abandonné qui lorsque le régime s'est effondré. Le tableau visualise surtout le **réseau d'alliances, de protections et de trahisons**. Les crimes demeurent centraux.

- **034 — LES NOMS QU'ILS PORTAIENT : « LA TRAQUE »**
  L'ancien président Harb Kassar (personnalisé par le nom du joueur) est fugitif au début du dossier. C1 et C2 reconstruisent et poursuivent plusieurs refuges possibles. Les joueurs corroborent des contacts, confrontent les proches et font des choix d'enquête. Le joueur-président dispose de **choix limités, préécrits par variante**, portant sur les personnes qu'il tente de protéger ou abandonner, et les traces qu'il laisse ; aucune action n'efface une preuve canonique.

### Comment tenir ensemble traque et procès ?

**Invariant historique : le président est capturé vivant avant l'audience finale.** Cela préserve la promesse d'un ancien président interrogé par les joueurs et la continuité avec les autres scénarios.

Ce qui varie selon les choix :
- qui a livré un renseignement, qui a résisté et qui s'est retourné ;
- quelle piste était fondée ou erronée ;
- quelles preuves supplémentaires ont été récupérées à la capture ;
- quel ministre ou proche est exposé et quelles contradictions sont disponibles à l'audience ;
- si le camp d'enquête a localisé le président par ses propres recoupements ou si la capture survient par l'intermédiaire de la commission externe à l'issue de C2.

Il n'existe **aucune fausse « victoire de capture »** : puisque la capture finale est fixée dans le canon, le vrai enjeu de jeu porte sur la qualité des preuves, les responsabilités identifiées et les confrontations obtenues. Si le camp a mal enquêté, il voit la capture se produire mais n'a pas établi comment le réseau fonctionnait ; il ne reçoit pas la même matière pour le procès.

### Timing recommandé

| Phase | Traque | Tribunal | Joueur-président |
| --- | --- | --- | --- |
| Préambule | Réseau familial et 3 pistes, statut inconnu | Juge ouvre la procédure | Identité du joueur affichée sur le dossier |
| Cycle 1 | Ouverture de pistes et témoignages | Contrôle des requêtes | Premier choix de protection ou de fuite |
| Cycle 2 | Recoupements, choix de la piste exploitée, capture | Confrontations, conservation des pièces | Choix de loyauté, réaction aux arrestations |
| Cycle 3 | Réseau de fuite figé, pièces récupérées | Interrogatoire du président et audience motivée | Stratégie de défense et dernière déclaration |

**Rythme :** animations brèves, changements de statut immédiatement visibles, pas de minuteur parallèle aux cycles existants. Tout choix doit produire un changement justifié et vérifiable.

### Garde-fous

- Trois variantes scellées côté serveur par dossier, chacune avec pistes préécrites, vraie chronologie, relais du président et pièces probantes.
- Un minimum de deux voies d'enquête indépendantes conduisent aux preuves indispensables. Aucune énigme « deviner le bon refuge sur trois ».
- Une fausse piste a une cause vérifiable (témoignage volontairement trompeur, mauvaise date, tiers confondu), pas un jet de chance inexpliqué.
- La carte montre seulement des informations autorisées ; l'alias du président reste figé par identifiant de rôle.
- Les décisions de la traque ne créent aucun événement fantastique ni faux témoignage.
- Le panel 034 doit rester jouable à **6 personnes**, sans Procureur, si et seulement si le moteur, les quotas et l'audience supportent ce mode.
- Les systèmes de score et les conditions de victoire ne doivent pas pénaliser automatiquement l'absence d'un Procureur.
- Le procès ne doit pas être une scène passive de 45 secondes après deux cycles de traque ; réserver une audience finale suffisamment longue et structurée. Vérifier le minutage réel dans le runtime.
- Tous les joueurs doivent participer chaque cycle ; même le Juge doit avoir une décision réelle et la défense doit rester possible.

## 3. Position de publication

**À présenter comme design, non comme fonctionnalité livrée.** L'organigramme familial public déjà présent dans la branche peut rester. Le rôle de Transfuge, documenté antérieurement, est mis en attente ; ne pas l'intégrer au runtime. Les matrices de rôles et la traque exigent d'abord un audit des fichiers serveur avant toute migration.
