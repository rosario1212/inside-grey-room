# LE RÉGIME — Traques doubles adversariales 032–034 v2

**Statut : ARCHIVE DE CONCEPTION remplacée par `docs/REGIME_TRAQUES_IDENTITES_VICTOIRES_RESPONSABILITES_V3.md` ; NON IMPLÉMENTÉE au serveur et NON PUBLIÉE.** Les variantes, la personnalisation de TOUS les noms, l'issue fatale à l'épilogue et les responsabilités par actes sont définies dans v3. Toute règle contradictoire dans v2 est supplantée. Ce document remplace le modèle de capture assurée décrit dans `REGIME_JUGE_ET_TRAQUE_V1.md`. Ne pas modifier uniquement les textes publics ni présenter les règles ci-dessous comme jouables tant qu'aucun backend n'a été adapté et testé.

## 0. Intention centrale

**Chaque dossier : 2 dignitaires à retrouver, 3 cycles, 2 camps actifs.** Le camp d'enquête doit faire **capturer légalement les deux cibles** avant la fin du cycle 3. S'il obtient les deux captures valides, sa victoire principale est acquise. Si au moins une cible échappe aux poursuites à la fin du cycle 3, le camp des dirigeants remporte cet objectif. La réussite secondaire des enquêtes et les responsabilités pénales établies peuvent être distinguées par un score complémentaire non contradictoire.

**Interdiction de rendre les fugitifs inactifs jusqu'à leur arrestation.** Chaque cible est incarnée par un suspect-joueur **dès le premier cycle**, avec décisions privées de dissimulation et de pression. Le troisième suspect par partie est un ancien dignitaire ou relais **interrogeable dès C1**, qui dispose d'objectifs propres. Aucun quatrième suspect ni septième rôle n'est imposé aux parties à six joueurs.

Le Juge est **obligatoire dans les 3 dossiers** et ne peut agir comme seul arbitre du résultat. Procureur **optionnel** ; Enquêteur, Analyste, Juge et trois suspects **requis** (6 joueurs minimum cible ; vérifier contrats serveur et configuration publique historique de 034 à 7 joueurs). Aucun rôle nouveau dit Archiviste ou Transfuge n'est ajouté.

## 1. Six cibles, trois chasses dissemblables

| Dossier | Première cible | Deuxième cible | Troisième suspect actif dès C1 | Singularité |
| --- | --- | --- | --- | --- |
| 032 Archives du Palais | **Youssef Baran**, directeur de Vahran | **Mourad Kassar**, frère du président, ministre de l'Intérieur | **Hamza Daher**, secrétaire général du palais | « Le réseau carcéral » : registres, transferts, autorisations, chaîne de détention |
| 033 La Dynastie | **Darian Kassar**, fils et héritier, ministre de l'Information | **Fouad Kassar**, cousin, ministre de la Défense | **un ancien intendant financier du clan** (identité canonique et carte privée à créer) | « Le clan en déroute » : loyautés, financements, propagande, chaîne militaire |
| 034 Les Noms qu'ils portaient | **Harb Kassar**, président déchu, affiché sous le nom du joueur | **Ilyas Sayegh**, gendre, chef de la sécurité présidentielle | **un responsable ancien des transmissions et du cabinet** (identité et carte privées à créer, éviter de copier le personnage du 032) | « La chasse au chef » : relais du palais, fausses pistes, noms de code, dirigeants qui se dénoncent |

**Lien de parenté modifié :** Fouad = cousin et Défense, Mourad = frère et Intérieur. Ils ne deviennent pas automatiquement parents du joueur par leurs surnoms : le `character_key` président reste stable, seul le nom affiché est personnalisé.

**Chronologie commune :** C1 = jour 49 depuis la chute du palais ; C2 = jour 51 ; C3 = jour 53. L'ancienne affirmation « président capturé après 53 jours » est annulée : le président **peut être capturé dès C1**, pendant C2, pendant C3, ou échapper à la capture jusqu'à la fin de l'épisode. Ces dates sont des propositions éditoriales de mise en scène et ne doivent pas devenir des minuteries réelles. Les deux autres dossiers participent au même effondrement mais leurs poursuites peuvent commencer à un autre point dans cette fenêtre. Pas d'assertion de capture certaine dans la description publique.

## 2. La boucle commune, pas le même mini-jeu

**Enquête :** trouver la bonne liaison avec chaque cible, recouper au moins **deux sources distinctes dont les provenances ne sont pas identiques**, puis déclencher une demande de capture via le Juge. Il ne s'agit pas d'un puzzle aléatoire « choisir une des trois cachettes ». L'Analyste propose la convergence, l'Enquêteur choisit une piste et le Juge contrôle la recevabilité du mandat ; **les conditions probatoires sont validées côté serveur**. Une arrestation peut avoir lieu en C1 si les conditions sont remplies et les choix faits. Le Juge ne peut pas délibérément imposer un résultat contraire aux règles.

**Défense des fugitifs :** à chaque cycle, les joueurs des deux cibles choisissent une action privée prédéfinie par leur variante, par exemple :
- **DÉTOURNER LES SOUPÇONS** : choisir entre deux récits déjà prévus ; le public voit une version contestable, assortie d'une contre-piste.
- **PROTÉGER UN FIDÈLE** : retarder la disponibilité d'une source secondaire selon une règle explicite et bornée, jamais supprimer la preuve décisive.
- **BRISER UNE ALLIANCE** : révéler un élément réel sur l'autre dirigeant pour améliorer sa propre position ; le changement du réseau de fidélité est visible immédiatement.

Le camp du régime n'est pas un bloc uniforme : les deux cibles peuvent sacrifier leurs relations pour survivre, et le troisième suspect peut coopérer avec l'enquête à ses risques. La culpabilité de chacun dans les crimes passés varie uniquement selon le canon de la variante scellée, mais son statut de **personne recherchée** est fixe pour la partie.

### Activité garantie aux dirigeants fugitifs

**Pour éviter deux cycles à regarder un écran :** chaque fugitif reçoit, à chaque cycle, (a) **une décision stratégique** privée qui affecte une ressource ou une liaison, (b) **une réaction contextuelle** à une révélation de l'enquête, sous forme d'un questionnaire à deux réponses cohérentes avec sa variante, et (c) la possibilité d'émettre **une déclaration publique courte** préécrite ou de solliciter une confrontation à distance avec le troisième suspect. Une seule réaction par cycle, et aucune interaction ne doit bloquer le chrono d'autrui.

Exemples de décisions différenciées, **pas des cartes finales** :
- Baran (032) : conserver un lien avec son ancien ministère ou incriminer son adjoint ; en réaction, répondre ou esquiver la dernière trace de transfert révélée.
- Mourad (032) : défendre la légalité des arrestations ou reconnaître une dérive locale ; en réaction, protéger une relation dans la chaîne hiérarchique.
- Darian (033) : publier un appel à la fidélité au clan ou désavouer une branche du pouvoir ; en réaction, répondre à un rapprochement entre propagande et opérations de guerre.
- Fouad (033) : confirmer un ordre militaire ou le renvoyer à un échelon précis ; en réaction, choisir quel fidèle conserver.
- Président (034) : prendre ses distances avec un proche ou maintenir la solidarité familiale ; en réaction, nier ou préciser un contact attesté.
- Ilyas (034) : protéger une liaison du palais ou en dénoncer l'utilisation ; en réaction, exposer ou préserver un relais du président.

Les choix doivent utiliser des formulations compatibles avec la vérité de chaque variante. **Une déclaration mensongère peut être un acte de joueur, mais jamais une fausse preuve authentifiée.** Toute manœuvre laisse un indice contradictoire exploitable, et les effets sur la traque sont explicitement plafonnés. Pas de surveillance du chat vocal et pas de validation automatique de la sincérité.

### Avant capture et après capture, tous actifs

| État du dirigeant | Actions et interactions |
| --- | --- |
| EN FUITE | 1 décision secrète de contre-pression par cycle, messages ou déclarations préécrites diffusés à la session, choix de loyauté ; il peut être contredit à distance mais ne subit pas d'interrogatoire physique immédiat |
| SIGNALÉ | Sa piste devient visible aux enquêteurs ; il conserve une contre-action défensive préécrite, sans accès aux preuves secrètes du camp d'enquête |
| CAPTURÉ | Il ne choisit plus d'actions de fuite. Il reçoit une défense active : contester un document, négocier une déposition, confronter un ancien complice, déposer une requête au Juge et préparer l'audience |
| NON CAPTURÉ FIN C3 | Résultat de la traque déclaré sans inventer un procès du fugitif absent ; témoignages des autres et preuves conservées peuvent faire l'objet d'une décision procédurale distincte |

**Si les deux sont capturés en C1 ou C2 :** la victoire principale du camp d'enquête est **verrouillée immédiatement** et affichée. La partie ne se termine pas abruptement : les cycles restants passent en phase **TRIBUNAL**, avec défense des dirigeants, reconstitution des responsabilités et évaluation secondaire de la qualité judiciaire du dossier. Les dirigeants ont toujours des moyens de gagner leurs objectifs individuels (faire reconnaître l'absence de responsabilité sur un chef, protéger une relation, contester une pièce inexacte) sans annuler la victoire de capture.

**Si une seule cible est capturée :** les enquêtes et défenses continuent, la deuxième reste activement recherchée. À la fin du troisième cycle le résultat principal reflète la condition 2/2. Ne pas fabriquer une victoire partielle présentée comme une victoire complète.

## 3. Trois tableaux réellement spécifiques

### 032 — LES ARCHIVES DU PALAIS : LA CHAÎNE CARCÉRALE

**Affichage :** fiche prison de Vahran, bureaux de l'Intérieur, listes de transferts et circuits de signature. L'avancée de la traque est représentée par la **reconstitution de la chaîne** (qui autorisait quoi, qui reçoit quoi), pas par une carte de cachettes.

- **Cible Baran :** remontée des dernières transmissions enregistrées de la prison et des personnes capables d'identifier ses relais.
- **Cible Mourad :** reconstitution des validations ministérielles et des protections accordées par le palais.
- **C1 :** choix du registre/secteur à examiner ; confrontation d'un témoin détenu ou du responsable du cabinet. Capture possible si les sources indépendantes convergent.
- **C2 :** choix d'une opération de recoupement ; les dirigeants choisissent quel lien compromettre ou quel proche lâcher.
- **C3 :** dernière demande de capture, audience sur les détenus et les responsabilités.

**Tension propre :** Baran détient des informations sur des actes de l'Intérieur ; Mourad peut le compromettre. Les décisions doivent faire évoluer deux traques distinctes, pas une barre « prison 70 % ».

### 033 — LA DYNASTIE : LE CLAN QUI SE DÉCHIRE

**Affichage :** organigramme familial, finances, chaînes de commandement militaire, réseau de protection des dignitaires. Deux couches : **loyauté déclarée** et **loyauté prouvée** ; on ne révèle le pouvoir réel qu'après corroboration.

- **Cible Darian :** ses propagandistes, ses collaborateurs et les ressources encore disponibles pour le clan.
- **Cible Fouad :** rapports militaires et circuits de financement des opérations illégales.
- **C1 :** choisir entre suivre les ressources ou les fidélités. Les deux cibles ont un premier choix de protection susceptible d'être recoupé.
- **C2 :** possibilité de faire défection / dénoncer l'autre branche du clan, ce qui expose une preuve et crée un conflit de confiance.
- **C3 :** mandats finaux ; confrontation des décisions de guerre et des massacres.

**Tension propre :** si Darian livre un relais de Fouad, il peut gagner une protection personnelle mais affaiblit son propre réseau de soutien. Le clan est aussi son propre adversaire. Aucun joueur ne décide seul du succès par une trahison automatique.

### 034 — LES NOMS QU'ILS PORTAIENT : LA TRAQUE PRÉSIDENTIELLE

**Affichage :** carte narrative de trois pistes fictives préécrites, réseau du gendre et du palais, jour depuis la chute du régime. Deux cibles : le Président et Ilyas.

- **Cible Président :** cache, relais de fidélité et déclarations contradictoires ; le joueur utilise son propre pseudonyme comme nom du président dans les documents de sa session.
- **Cible Ilyas :** les transmissions et protections de la sécurité présidentielle. Il connaît certains circuits du président mais ses choix ne garantissent pas sa découverte.
- **C1 (jour 49) :** **capture du président possible immédiatement**, si le camp d'enquête a sélectionné une chaîne probante cohérente et demandé le mandat. Pas de résolution automatique par défaut.
- **C2 (jour 51) :** poursuivre la deuxième cible ou consolider un dossier ; les contre-mesures et trahisons de deux dirigeants influent sur les nouvelles pièces accessibles.
- **C3 (jour 53) :** dernier créneau de capture ; procès uniquement des personnages présents, et résultat de traque si une cible demeure libre.

**Tension propre :** Ilyas peut protéger le Président ou s'en désolidariser ; le Président peut démentir publiquement un soutien et provoquer une rupture. Toute version doit préserver l'accès à des pièces indépendantes permettant aux enquêteurs de réussir par déduction et non par chance.

## 4. Interface de traque et feuille de décisions

### Pour le camp d'enquête
Deux portraits de cibles, **état individuel** (inconnue / piste ouverte / piste recoupée / capturée), un historique des informations déjà publiées, et un panneau **PROPOSER UNE CAPTURE** qui n'est disponible que lorsque le moteur autorise les conditions d'enquête. Le joueur présente son hypothèse ; le système ne l'informe pas à l'avance si la localisation est correcte. Une demande prématurée consomme une possibilité de décision, avec justification compréhensible.

### Pour les dirigeants
Cartes séparées de « DÉCISIONS DU POUVOIR » : 2 choix à chaque cycle au maximum, chacun précisant le **risque** et l'**effet narratif** ; 1 décision retenue. Choix privés, effets publics différés ou immédiats selon la variante. Aucune modification manuelle du contenu des preuves. Un indicateur personnel montre les conséquences, et le camp d'enquête voit ce qu'il est censé observer.

### Pour le Juge
Écran **ORDONNANCE** distinct de l'accusation : vérification de la justification et de la provenance, choix procédural motivé dans les options autorisées. Le moteur valide sans révéler la vérité à un seul joueur. Le Juge a une action véritable pendant C1 même si aucune personne n'est capturée.

### Pour la troisième personne suspecte
Un interlocuteur accessible à l'interrogatoire à chaque cycle avec une information partielle, une loyauté en tension et une manière d'influencer **une seule** des deux traques ; il ne s'agit pas d'un personnage qui attend la fin de la chasse.

## 5. Score, équité et QA

- **Camp enquête gagne** si deux capturations valides enregistrées par le serveur avant la clôture de C3.
- **Camp dignitaires gagne l'objectif de fuite** si au moins une des deux cibles n'est pas capturée à la clôture de C3.
- **Aucun rôle mort** : les fugitifs jouent des choix de contre-pression dès C1 ; les captifs jouent activement leur défense.
- **Aucune décision arbitraire** du Juge ou de l'Enquêteur ne suffit ; minimum deux sources recoupées sans dépendance cachée, dans chaque variante.
- **Accessibilité** : traques jouables à 6 joueurs avec Procureur absent, et à 7–9 joueurs sans avantage disproportionné.
- **Équilibre** : en simulation, pour chaque variante, scénario et cible : vérifier qu'une capture en C1 est possible (pas forcément probable), qu'une capture prématurée est sanctionnée équitablement, que le camp des dignitaires peut réussir par ses choix, et qu'aucune absence de rôle optionnel ne rend une cible impossible.
- **Si 2/2 avant C3** : déclencher le tribunal anticipé, pas un arrêt de la session ; préserver les objectifs individuels, les audiences et le temps de parole de tous.
- **Confidentialité** : identités de personnages stables, noms du président de session échappés, preuves et branches de variantes autorisées côté serveur uniquement. Pas d'écoute automatique des conversations pour juger des objectifs.
- **Performance** : pas de polling additionnel à fréquence élevée ; réutiliser le canal d'actualisation actuel et états événementiels cohérents iOS / PWA.

## 6. Règle de publication

Ce texte constitue une décision narrative et fonctionnelle à implémenter et à tester. Il ne vaut ni migration Supabase, ni parties validées, ni déploiement. Mettre à jour les publicités de scénario pour ne jamais prétendre que le président est déjà capturé. Ne pas livrer de rôles de fuite si l'interface des suspects n'affiche pas les décisions pendant leur cavale.
