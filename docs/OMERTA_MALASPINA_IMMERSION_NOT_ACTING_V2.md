> **ARCHIVE / SUPPLANTÉ :** la direction éditoriale actuelle est [OMERTA_LA_COSA_NOSTRA_REALISM_V3.md](OMERTA_LA_COSA_NOSTRA_REALISM_V3.md). Les références apostoliques ne sont pas centrales; *Malaspina* a été rejeté et *Lucifora* reste une possibilité non confirmée. Le nouveau canon n'est pas intégré en production.

# INSIDE GREY ROOM — OMERTÀ V2
## Famiglia Malaspina / concept d'immersion sans interprétation

**Date :** 25 octobre 2026
**Statut :** direction créative proposée, **non intégrée aux scénarios jouables**, sans modification de Supabase.
**Remplace la direction narrative** du document `OMERTA_ITALO_AMERICAN_WORLD_BIBLE_V1.md` là où les deux divergent, notamment sur l'incarnation de personnages fixes. Protéger les variantes privées et ne jamais toucher au DLC CARTEL.

## 1. Fondement : le joueur EST inclus dans le dossier

Le joueur ne doit ni *incarner* un personnage préécrit ni jouer une scène ni adopter un accent / des répliques mafieuses.

- L'identifiant libre de joueur (pseudo) désigne celui qui participe à l'affaire.
- Le **poste** dans la situation (associé d'un crew, personne ayant accès aux comptes, témoin d'une réunion, protecteur d'un proche, intermédiaire) est assigné par le jeu, de manière cohérente avec les preuves et la variante. Il ne devient pas un nouveau personnage canonique obligé d'avoir une biographie.
- Une fiche privée répond aux questions : **Que sais-tu de manière certaine ? Quel fait te concerne ? Que veux-tu éviter ou obtenir ? Que peux-tu faire / ne pas faire ?** Elle ne demande jamais « comment se comporte ton personnage ? ».
- Les autres membres de la Famiglia avec noms fixes, dont Don Vittorio et des capos, sont des **personnes de l'affaire (PNJ / sources de dossier)**, pas automatiquement les rôles à jouer.
- Le joueur choisit librement son langage, ses alliances et son comportement, et les autres le jugent sur ces décisions.
- La preuve, l'implication et la possibilité de verdict doivent rester correctes pour toute taille autorisée de groupe, sans exiger la présence de douze joueurs.
- À petites tables, il faut une distribution des **positions d'affaire**, non la nécessité de contrôler tous les personnages de la biographie. Éviter de faire dépendre un révélateur garanti de la parole libre d'un joueur.

### Exemple, 021

**Ancienne logique :** « Tu incarnes Paolo Serra. Tu veux quitter le groupe depuis longtemps… »

**Logique visée :**
> « Tu travailles pour le crew Rinaldi. Il t'a confié une remise d'argent. Le montant initial et ton passage au lieu de collecte sont attestés; une autre partie du trajet reste contestée. Enzo Rinaldi veut que tu lui expliques cet écart, et la Grey Room demande ce que tu savais avant la disparition. Ta manière de répondre n'est pas prescrite. »

Ceci est seulement un **prototype de fiche**; il faut garantir ensuite qu'elle ne contredit aucune variante A/B/C et les éléments matériels qui lui sont associés.

### Attention : conversion narrative et technique de fond

Les packs existants 021–025 contiennent actuellement des tableaux `suspects` en noms propres, avec `place`, `hide`, `chronology`, `anchors`, `relations`, `truth.levels` et `role_notes`. Les variantes A/B/C contiennent des `private_cards`, `relationships` et `revelations`. Un remplacement naïf « Paolo » → pseudo rendrait les versions incohérentes.

Faire un **découplage explicite** :
1. Personnes fixes du monde (identités historiques et responsabilités prouvées).
2. Positions jouables et raisons de détention / convocation.
3. Sources de preuve et liens vers chaque joueur, déterminés sans fuite du canon.
4. Relations interjoueurs prévalidées, sans biographies imposées.
5. Dénouement différenciant les faits des personnes du monde et les choix des joueurs.

Exiger QA 1–7 joueurs + hôte, plusieurs répartitions de rôles, A/B/C, FR/EN, reconnexions et saga complète; aucune activation avant conversion cohérente.

## 2. Nouveau nom : Famiglia Malaspina

**Malaspina** est un véritable nom de famille italien; étymologie `mala` (« mauvaise ») + `spina` (« épine »). Une dynastie historique Malaspina exista dans la Lunigiana. L'association avec la **couronne d'épines** du Christ est un **choix de lecture symbolique du jeu**, non une prétendue signification chrétienne officielle du patronyme.

Le nom réunit :
- **vice** : mauvaise épine, loyauté transformée en emprise, gain économique présenté comme honneur;
- **pouvoir** : une couronne, un lignage, un homme placé au centre de la table;
- **religion** : le symbole chrétien de souffrance / couronne d'épines utilisé à contre-emploi par une organisation cupide;
- **double-famille** : le nom de sang des Malaspina n'est pas le nom porté par chaque soldat ou associé.

Changements de nom envisagés : **Vittorio Verri → Vittorio Malaspina**, **Adriano Verri → Adriano Malaspina**, **Elena Verri → Elena Malaspina**, **Famiglia Verri → Famiglia Malaspina**. Autres noms inchangés : **Enzo Rinaldi (caporegime)**, **Matteo Bellini (consigliere)**, **Luca Moretti (soldato)**, **Paolo Serra (associato)**, **Salvatore Greco (financier associé)**, tant qu'ils sont des individus présents dans la fiction; ne pas présumer qu'ils doivent être incarnés.

**Audit préliminaire de propagation (en base actuelle)** : les cinq packs publics 021–025 mentionnent « Verri » ; les 15 manuscrits A/B/C correspondants le mentionnent également, statut `review`. L'intégration exigera une migration transactionnelle et revue et des recherches dans l'application/documentation, pas un simple changement du titre affiché. Aucune de ces références n'a été modifiée dans cette proposition.

## 3. Le Christ et les douze apôtres : une grammaire symbolique, pas de faux grades mafieux

La famille voit son pouvoir comme une **fausse communion**; elle demande dévouement, silence et sacrifices et distribue les bénéfices selon la hiérarchie.

### Deux couches à ne pas confondre

**Hiérarchie réaliste** : boss → underboss (poste convoité par Adriano, pas acquis) et consigliere → plusieurs caporegimes, dont Rinaldi → soldats initiés, dont Luca → associés non initiés, dont Paolo et Greco. Elena est **famille de sang**, hors organigramme criminel.

**Arbre de sens (« Il Cenacolo »)** : un vieux tableau / schéma de douze sièges autour d'une place centrale, image récurrente dans des pièces d'enquête ou le décor. Ce n'est **PAS** la structure administrative officielle. Les douze places n'imposent pas douze capos, ni douze joueurs, ni douze personnages nouveaux. Aucune correspondance d'apôtre ne doit indiquer à l'avance la culpabilité d'un joueur.

### Place centrale : **La Corona / le faux sauveur**

Le Don Vittorio Malaspina revendique l'image du protecteur/père — **inversion de la place centrale du Christ**, pas identité divine littérale. Les membres le servent parce qu'ils attendent protection, solidarité et statut; son pouvoir peut au contraire les exposer à l'emprisonnement ou à la mort. Le motif de **la couronne d'épines** est l'emblème subtil : on croit y voir une couronne royale, on découvre douze épines.

### Douze sièges secondaires (motifs de dossier, non grades)

| Référence apostolique | Motif original pour le jeu | Question / thème psychologique |
|---|---|---|
| Pierre | LA PIERRE | Qui prétend soutenir la succession ? |
| André | LE LIEN | Qui a introduit qui dans ce cercle ? |
| Jacques le Majeur | LE ZÈLE | Quel acte a été fait par empressement ? |
| Jean | LE FAVORI | Le sang et l'affection donnent-ils un privilège ? |
| Philippe | LA QUESTION | Qui exige une explication impossible ? |
| Barthélemy | LE TÉMOIN | Qui rapporte ce qu'il a vu, et non ce qu'on lui a dit ? |
| Thomas | LE DOUTE | Quelle source mérite d'être mise à l'épreuve ? |
| Matthieu | LE COMPTE | Qui a la preuve matérielle des flux d'argent ? |
| Jacques le Mineur | L'OUBLIÉ | Qui paie pour des décisions qui le dépassent ? |
| Simon le Zélote | LA LOYAUTÉ | Jusqu'où va l'obéissance avant de devenir initiative ? |
| Jude/Thaddée | LA PAROLE | Qui promet une chose mais en transmet une autre ? |
| Judas Iscariote | LA MONNAIE | Qui est **accusé** d'avoir vendu quelqu'un — et est-ce prouvé ? |

**Tous ces thèmes sont des interprétations de fiction**, pas les qualités personnelles ou actes établis de chaque apôtre historique. La fiction ne désigne PAS un joueur comme « Judas » secret à démasquer; une accusation de trahison peut être fausse et une fuite peut être juridiquement ou moralement justifiée.

### Règle de cohérence

Le vrai organigramme reste celui de Cosa Nostra. Le *Cenacolo* est une manière pour la Famiglia de **se raconter**; il peut être mensonger. Un motif ne remplace jamais une pièce d'enquête. Les « douze » sont une grammaire à travers les dossiers, pas un mécanisme de vote ou un privilège ludique. Un tableau de 13 chaises dans le bureau d'un boss serait trop littéral : privilégier un **ancien tableau d'atelier de 13 silhouettes** ou une photo de repas de famille dont la place centrale et douze figures sont visibles, discrètement; ce n'est pas un objet nécessaire à chaque scénario.

### Iconographie recommandée

- Marque : anneau de **douze fines épines** autour d'une place centrale blanche; un sceau noir usé sur facture, photographie ou dossier. Ni crucifix spectaculaire ni lueur surnaturelle.
- Le nom **MALASPINA** en typographie sobre et légèrement ancienne, pas gothique de jeu de rôle.
- Aucun nouveau chant, serment, costume ou scénette obligatoire.
- Les jurons religieux et crucifix peuvent appartenir à des décors sociaux réalistes, mais sans réduire les Italo-Américains ou la religion catholique à la criminalité.

## 4. Les cinq dossiers et leur écho symbolique

| Épisode | Mécanique réelle | Écho symbolique (non obligatoire pour comprendre la preuve) |
|---|---|---|
| 021 L'ENVELOPPE | circuits d'argent, cercle de connaissance, fuite; ne pas identifier magiquement la source | **La Monnaie** : prix de la loyauté; Judas est une accusation, pas une solution |
| 022 OMERTÀ | ordres indirects, interprétation, couverture d'un meurtre | **Le Reniement** : avoir su, puis prétendre ne pas avoir entendu |
| 023 LA TABLE | sit-down, chaise vide, attaque et positions | **Le Cenacolo** : être assis ensemble n'implique pas la confiance |
| 024 IL PENTITO | coopération judiciaire, protection, révélation partielle | **Le Baiser** : trahison apparente vs révélation utile à la vérité |
| 025 IL DON | responsabilité systémique, sommet du commandement | **La Couronne** : qu'a produit le système que le Don exigeait qu'on serve ? |

À aucun moment on ne doit publier « Tu es Judas » sur la carte d'un participant. Les cinq dossiers conservent des modes d'enquête distincts; les symboles lient les épisodes sans transformer les joueurs en acteurs.

## 5. Authenticité : mafieux, pas imitation de télévision

- Les relations formelles suivent **La Cosa Nostra** : un capo contrôle un crew; les associates ne deviennent pas des *made men* parce qu'ils ont gagné la confiance de son chef.
- La « Famiglia » criminelle et la famille biologique ne sont pas la même chose.
- **Les cinq familles de New York** restent Gambino, Genovese, Lucchese, Bonanno, Colombo. Pas de sixième grande famille authentifiée fictivement; placer les Malaspina dans le **nord du New Jersey** avec des relations à Brooklyn, comme un groupe de fiction distinct. Ne pas utiliser le nom d'un mafieux historique dans un rôle de commanditaire inventé.
- Les affaires, les commerces de quartier, les conflits de rang, les accords pénaux, la fatigue du secret et les rapports aux proches précèdent les fusillades dans la dramaturgie.
- Authenticité n'impose pas un rite obligatoire d'initiation aux joueurs; les récits documentent des rites à références religieuses, mais ils ne sont pas un principe universel de comportement individuel.
- La saga se place **vers 2006**, date éditoriale proposée à vérifier contre les preuves et toutes les variantes.
- Le **bureau de la Grey Room** reste libre à chaque partie, nom réel ou imaginaire saisi par l'hôte; c'est une règle à **implémenter**, pas à prétendre fonctionnelle. Il n'est pas le lieu où les crimes des scénarios se sont produits.

## 6. Critères d'acceptation de la refonte

1. Chaque joueur peut jouer naturellement comme lui-même, sans accent, costume, texte à réciter ou imitation psychologique.
2. Sa carte sait déterminer son implication à partir de données canoniques et de preuves, pas en improvisant des faits.
3. Les PNJ nommés restent identifiables et les joueurs savent s'ils sont interrogés comme suspects, témoins, enquêteurs, informateurs ou représentants.
4. Chaque rôle fournit une décision, un renseignement ou une relation utile et équitable, sans « joueur-poteau ».
5. Le mécanisme judiciaire est fictif (Grey Room) et n'est jamais annoncé comme reproduction fidèle d'une procédure fédérale.
6. La métaphore apostolique n'est ni un rang mafieux, ni un puzzle de « quel joueur est Judas », ni une obligation de 12 participants.
7. Les A/B/C doivent être re-rédigées avec répartition des faits et cartes compatibles pour 021–025 sans qu'une variante devenue célèbre révèle les suivantes.
8. Procéder au renommage simultané des noms de sang et des références internes dans un futur correctif complet, seulement après tests.
9. La branche documentaire peut être relue et commentée; aucun contenu secret A/B/C ne sort des espaces privés.

## Sources de recherche

- Dictionary of American Family Names via FamilySearch, étymologie Malaspina : https://www.familysearch.org/en/surname?surname=malaspina
- Treccani, maison médiévale Malaspina : https://www.treccani.it/enciclopedia/malaspina_%28Enciclopedia-Dantesca%29/
- DOJ, organisation hiérarchique d'une famille La Cosa Nostra : https://www.justice.gov/sites/default/files/opa/legacy/2011/01/20/1-20-2011-alesi.pdf
- La Cène, composition avec les douze apôtres : https://cenacolovinciano.org/en/story/a-powerful-theatrical-machine/
- Archives judiciaires : https://www.ojp.gov/pdffiles1/Digitization/70066NCJRS.pdf

**Aucune mise à jour du gameplay, aucun changement de nom en production, aucun changement du DLC CARTEL.**
