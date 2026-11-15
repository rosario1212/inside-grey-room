# LE RÉGIME — Contrat v5 : doubles traques choisies, mandats, noms de code et vérité finale

**STATUT : PROPOSITION DE CONCEPTION NON IMPLÉMENTÉE.** Cette spécification prévaut sur les v1–v4 en cas de contradiction. Ne pas fusionner ou publier sans migrations serveur, cartes privées et tests complets. Le moteur actuel reste à 3 cycles et une audience finale de référence. Aucune réponse de formulaire client ne doit modifier une vérité criminelle déjà scellée.

## 1. L'identité du DLC

**Deux fugitifs incarnés par des joueurs + un troisième suspect actif + Enquêteur, Analyste et Juge** ; Procureur facultatif. Tous les noms de personnages incarnés prennent les noms de leurs joueurs, figés en session ; les identifiants de personnages et les liens familiaux restent stables. Les noms canoniques (Harb Kassar, etc.) ne sont utilisés que hors session pour la rédaction.

Le pays fictif de Karsane a eu 15 millions d'habitants avant la guerre, une dictature familiale masculine, la prison de Vahran, des massacres, une guerre d'agression contre Belvane et le génocide des Veyrins. Ces crimes sont des faits de l'univers. **Les responsabilités individuelles** sont découvertes et justifiées par les preuves propres à la variante.

| Scénario | Titre et noyau dramatique | Fugitifs | Mécanique de recherche |
| --- | --- | --- | --- |
| **032 LES ARCHIVES DU PALAIS** | Les documents retrouvés au palais révèlent la structure des détentions et les protecteurs de la prison de Vahran | Directeur de Vahran et ministre de l'Intérieur | **CHAÎNE CARCÉRALE** : transmissions, registres, hiérarchie et relais |
| **033 LA DYNASTIE** | Le clan familial se fracture dans l'effondrement du régime après guerre et extermination | Fils/héritier et cousin ministre de la Défense | **ARBRE DES FIDÉLITÉS** : allégeances, moyens, trahisons et dépendances |
| **034 LES NOMS QU'ILS PORTAIENT** | Les identités de couverture masquent la chaîne de pouvoir et les derniers contacts du président | Président et gendre chef de sécurité | **CODES DE POUVOIR** : identifier un auteur derrière un code, pour une période, puis suivre les traces corroborées |

### Nouveaux noms du 034, définitivement proposés

Remplacer **LE NOTAIRE**, **LA TOUR**, **L'HÉRITIER** dans le design courant par :
- **LE PORTRAIT** : émis dans les communications qui se réclament du culte présidentiel ; un émetteur peut être le président, son porte-parole ou un usurpateur.
- **LE SCEAU** : circuit d'authentification des décrets, visas et instructions sensibles.
- **LE REMPART** : circuit de protection et de renseignement de l'entourage présidentiel.

**Un code n'est ni un nom d'état civil ni un rang ni un coupable permanent.** Pour conclure, associer *(code, période, opération, auteur ou relais, preuve de l'identité)*. Une variante peut révéler la même appellation utilisée par plusieurs personnes à des dates différentes, mais toujours par des événements préécrits et corroborables. Éviter les changements arbitraires pour « surprendre ».

## 2. Choix stratégique des deux fugitifs : l'alliance existe parce qu'ils la choisissent

Les anciennes variantes A/B/C ne fixent PLUS « ensemble/séparés » automatiquement. Elles établissent les **ressources, rivalités, preuves, circuits disponibles et choix de fuite possibles**, mais la situation initiale commune est décidée par les joueurs.

### Décision secrète au préambule (45–60 s, dans le briefing existant)

Chaque fugitif choisit simultanément et sans voir l'autre décision :
- **SE REGROUPER** : accepter le même cercle de protection ;
- **SE SÉPARER** : recourir à son propre réseau et limiter les liens.

Règle simple et déterministe :
- **Deux consentements SE REGROUPER → ENSEMBLE**, partage de contacts et d'avantages mais risque d'exposition mutuelle. Les enquêteurs ne voient PAS directement cette décision ; ils ne peuvent déduire le regroupement qu'à partir de preuves révélées par leurs actions. Les deux restent des cibles différentes ; une seule source n'autorise pas deux arrestations.
- **Au moins un SE SÉPARER → SÉPARÉS**, réseaux distincts, autonomie accrue mais moins de capacité à se couvrir. Les enquêtes sur l'autre fugitif ne révèlent pas automatiquement ce refus.
- **Silence/timeout → SE SÉPARER par défaut annoncé** avant confirmation ; pour qu'une déconnexion ne prive pas un autre joueur d'un choix, faire une reprise de session ou un choix serveur neutre explicite.

**Chaque variante garantit que ces deux états restent matériellement jouables** : il existe des pistes et pièces pour les deux structures. La récompense et la faiblesse de chaque état varient par variante sans cacher une option « perdante à 100 % ». Dans certaines variantes, des alliances peuvent être rompues ultérieurement par des décisions C1/C2 ; aucun changement de réseau par hasard.

### Var A/B/C = contexte, pas résultat imposé
- **A — Loyauté institutionnelle** : réseaux fidèles mais dépendants de preuves administratives, regroupement efficace mais plus exposé si un document est saisi.
- **B — Rivalité préexistante** : réseaux concurrents, coopération coûteuse et soupçon de trahison ; se séparer limite les fuites mais prive de certaines confirmations.
- **C — Pacte fragile** : une opération ancienne les lie et une contradiction peut les pousser à dénoncer l'autre ; les deux stratégies ouvrent des pistes cohérentes.

Les choix « ensemble/séparés » doivent modifier les **relations actuelles, la disponibilité et le timing** de pistes fictives préécrites et le risque de révélation, pas les crimes historiques, la responsabilité scellée ou l'authenticité des preuves.

## 3. Une capture possible en C1 : que fait exactement le camp enquête ?

### Flux du mandat d'interpellation — aucun oracle caché

**Action principale par cible :** une tentative de mandat **maximum par cible et par cycle**, y compris C1. Possibilité de tenter deux captures au même cycle.

1. L'Enquêteur ouvre le panneau **TRAQUE** et choisit l'une des pistes découvertes pour **une cible précise**.
2. Il doit associer des **éléments de présence/liaison récents** et au moins deux sources distinctes indépendantes ou un équivalent probatoire clair prévu dans le scénario. Ces pièces sont visibles et exploitables par les enquêteurs ; le système ne révèle pas le bon lieu par un statut de bouton.
3. L'Analyste peut rendre un avis sur la cohérence de la piste. Son avis est consultatif, pas un veto, et ses citations deviennent une note du dossier commun.
4. L'Enquêteur clique **DÉPOSER UNE DEMANDE D'INTERPELLATION** (disponible sans révéler la solution ; ne pas désactiver à cause de vérités cachées).
5. Le Juge reçoit une **REQUÊTE N°...** avec cible, piste, pièce 1, pièce 2, motif et délai de réponse. Il choisit **AUTORISER** ou **REFUSER AVEC MOTIF** selon le contrat de recevabilité, **pas selon une connaissance du véritable refuge**.
6. Le serveur vérifie **d'abord la recevabilité observable** (preuves correctement identifiées, indépendantes et datées, action encore disponible, décisions non périmées), puis résout **la concordance de la piste avec l'état canonique**, y compris les effets bornés des choix fugitifs.
7. Résultat immédiatement affiché : **REQUÊTE IRRECEVABLE** (motif et coût annoncé), **MANDAT EXÉCUTÉ — CIBLE INTROUVABLE** (piste erronée, une contradiction rendue visible), ou **CIBLE CAPTURÉE** (défaite individuelle). La requête laisse une trace dans le Dossier commun.

La validation du Juge ne doit pas être discrétionnaire : au besoin le serveur corrige un refus manifestement non conforme au contrat et journalise l'incident. En l'absence ou déconnexion du Juge, un contrôle procédural automatique neutre évite de bloquer le tour ; le Juge ne gagne pas ou ne perd pas sur le succès aléatoire de la capture.

**Pas de mécanique physique ni de géolocalisation réelle.** Il s'agit d'une résolution documentaire fictive entre personnages, pas d'un guide de surveillance ou d'arrestation réelle.

### Démarrage C1 et sanctions d'erreurs

Le dossier initial et les choix de fugitifs peuvent déjà créer assez de preuves indépendantes en C1 pour déclencher **une ou deux captures**. Si les fugitifs font une déclaration contredite, trahissent un relais ou se regroupent malgré une piste déjà corroborée, ils deviennent plus faciles à identifier. Cependant, **regroupement ≠ double capture automatique**. Chaque cible doit être personnellement établie par les preuves.

Une tentative erronée occupe **la tentative de cette cible pour le cycle courant** ; le coût ne prive jamais l'enquête de toute chance sur l'autre cible. Un Juge ne peut ni arrêter sans preuve, ni bloquer arbitrairement une requête recevable.

## 4. Panneaux de décisions des fugitifs

À chaque cycle C1–C3 et dès le préambule, les deux fugitifs ont des actions privées ; aucune inactivité en attendant leur découverte.

| Décision | Si ensemble | Si séparés |
| --- | --- | --- |
| **MAINTENIR LE PACTE** | Bénéficier d'un soutien mutuel prévu, mais certains liens sont désormais corrélés et recoupables | Tentative de coopération à distance, sans regroupement automatique |
| **COUPER UN RELAIS** | Rompre une liaison partagée, au prix d'une perte de protection et d'un indice sur la rupture | Fermer une branche secondaire et révéler un changement de comportement |
| **LIVRER UN PROCHE** | Exposer une information sur l'autre fugitif, susceptible de rendre une piste plus fiable | Exposer un fidèle de son propre réseau ou de celui de l'autre selon la variante |
| **RÉAGIR À UNE PIÈCE** | Questionnaire court (2 réponses max) : reconnaître, préciser, nier, désavouer | Même type de réaction, mais sans alignement forcé des déclarations |

Les actions sont des **effets narratifs bornés et préécrits par variante** : aucune suppression de pièces essentielles, aucune création de faux document authentifié, aucune téléportation au hasard, aucune connaissance des projets privés de l'enquête. Une tentative de pression a un bénéfice ET un coût lisibles.

Les fugitifs peuvent échanger si les phases le permettent, mais **aucun accord privé hors de l'interface n'est présumé par le système**. La décision d'alliance est autoritative, indépendante de la qualité du chat.

## 5. Le troisième suspect : acteur majeur, pas figurant

Le troisième suspect est un **haut responsable disponible dès C1**, pouvant connaître certains ordres, certains relais et des actes qu'il a lui-même accomplis. Il est **interrogeable**, possède un dossier privé, et peut prendre **une décision politique par cycle**, parmi deux actions autorisées par sa variante :

- **COOPÉRER** : divulguer une information précise sur un circuit ou une décision (ce qui peut être recoupé et aider à la capture, sans la garantir) ;
- **PROTÉGER LES SIENS** : garder une information ou fournir une déclaration évasive, avec une contre-trace disponible ;
- à une étape pertinente et préécrite, **DÉNONCER UN DIRIGEANT** : sacrifier une relation pour défendre ses propres intérêts.

Il reçoit une **mission privée nette** dès le briefing, choisie par la variante, sans arbitraire :
- **Mission de coopération** : faire corroborer au moins **deux faits précis** de son dossier par des pièces indépendantes et déclarer sa propre implication avec une cohérence minimale ; il gagne individuellement s'il atteint ces objectifs, même si le camp des dirigeants perd.
- **Mission de protection** : éviter la divulgation d'un secret secondaire défini, tant que cette omission ne rend pas les preuves essentielles indisponibles ; il gagne si son secret reste non divulgué dans le dossier de jeu et si sa propre responsabilité n'est pas attribuée correctement par l'enquête.
- **Mission de désolidarisation** : faire établir par les pièces une responsabilité directe d'un autre dirigeant tout en démontrant qu'il n'avait pas personnellement le pouvoir effectif sur l'acte recherché ; victoire individuelle si les **deux conditions** sont satisfaites.

**Sa mission est connue de lui seul et sa réussite est vérifiée par des états serveur observables**, jamais par une appréciation du MJ, la sincérité de sa voix ou une accusation sans preuve. Il reste intéressant même si les deux dirigeants sont capturés au C1 : son témoignage et sa défense influent sur la reconstitution judiciaire.

**Côté victoire collective** : sa place de troisième suspect ne change pas la règle de traque 2/2 ; il dispose d'une réussite personnelle indépendante. Ne pas lui attribuer le pouvoir de décider seul une capture ni de falsifier les responsabilités.

## 6. La deuxième épreuve : ÉTABLIR QUI A ORDONNÉ QUOI

**Ne pas ajouter un quatrième cycle de fuite.** Conserver les trois cycles actuels, mais ajouter après C3 une **audience finale approfondie** (proposition de durée : **10–12 minutes** pour une table de 6–9, ajustable après playtests ; ce temps est ajouté aux paramètres d'audience existants et ne crée pas une minuterie parallèle).

### Quatre actes charnières par dossier

Chaque dossier possède exactement **quatre décisions criminelles majeures** documentées par variantes, dont le joueur doit reconstituer les chaînes :
- **032** : détention arbitraire d'un groupe ; prolongation illégale ; transfert vers un lieu de torture ; falsification/dissimulation du sort des détenus.
- **033** : déclenchement d'une opération de guerre ; ciblage des villages ; contrôle des troupes et des alertes reçues ; propagande ou financement de la campagne criminelle.
- **034** : adoption de la Circulaire 17 ; transmission d'un ordre sensible ; autorisation d'une opération répressive ; dissimulation des comptes-rendus au sommet.

Pour chaque acte, le camp d'enquête établit **ordre donné / ordre transmis / actes exécutés / connaissance ou contrôle / dissimulation** et nomme l'auteur ou **NON ÉTABLI**. Les pièces doivent étayer le lien à la personne ; le titre ou la parenté ne suffit pas. Il est permis de retenir plusieurs personnes à des niveaux d'implication distincts.

### Victoire nette et résultats mixtes

- **Victoire TACTIQUE de l'enquête** : deux captures valides avant ou à la clôture de C3.
- **Victoire JUDICIAIRE de l'enquête** : au moins **3 des 4 actes charnières** correctement attribués au niveau de l'acte et du responsable clé, avec justification par les sources corroborées. Le seuil 3/4 est une **proposition d'équilibrage à playtester**, pas une condamnation de l'ensemble des suspects ou une formule juridique.
- **VICTOIRE TOTALE DE L'ENQUÊTE** : victoire tactique **ET** judiciaire. Le jeu doit annoncer distinctement les deux composantes.
- **Victoire totale du camp des dirigeants** : au moins une cible libre à fin C3 **ET** reconstruction judiciaire insuffisante. Le succès individuel des fugitifs dépend séparément de leur propre liberté.
- **Résultats mixtes** : (2 captures / responsabilité insuffisante) = victoire tactique, défaite judiciaire ; (moins de 2 captures / responsabilité établie) = échec tactique, réussite judiciaire. **Aucun camp n'obtient une victoire totale.**

### Garde-fous pour les responsabilités

Le 3/4 n'est pas une échelle de culpabilité 0/1/2 : il mesure la **qualité d'une reconstruction factuelle**. Les quatre actes sont préécrits, les responsabilités scellées et les preuves accessibles. Une décision judiciaire peut conclure que l'identité est **non établie**, si c'est la bonne réponse. Ne jamais annoncer qu'une personne a été reconnue coupable de génocide uniquement parce qu'une fiche atteint 3/4. Les qualifications pénales restent qualitatives et motivées ; le mécanisme d'exécution politique en épilogue demeure **distinct** des conclusions du Juge.

### Si capture anticipée

Si les deux fugitifs sont arrêtés en C1/C2, la phase de traque est finie pour eux et les cycles restants se transforment en **enquête judiciaire** : documents supplémentaires, contradictions, confrontations et déclarations de défense. **Ne jamais terminer la partie prématurément.** Le troisième suspect, le Juge et l'Analyste gagnent même en importance.

## 7. Exemple de partie 034 — fidélité et mauvais choix dès C1

- **Briefing :** le Président (joueur A) et son Gendre (joueur B) cochent tous deux « se regrouper ». Dans la variante A, ils partagent une protection prévue avec un risque documentaire spécifique, inconnu des enquêteurs.
- **C1 :** le président choisit une déclaration qui le lie à un communiqué dont une copie authentique est déjà dans les archives ; le gendre sacrifie un contact commun pour protéger son dossier personnel. Le troisième suspect choisit de coopérer, et sa déclaration corrobore indépendamment une source sur l'un des deux. Les enquêteurs choisissent la bonne piste, présentent deux pièces, le Juge autorise un mandat recevable, le serveur valide la **capture du président au C1**. Le gendre reste libre, faute de deuxième preuve personnelle.
- **C2 :** le président capturé dénonce l'utilisation de son nom, le gendre réagit, le troisième suspect peut être interrogé à nouveau, l'Analyste établit l'origine d'une transmission et l'Enquêteur demande une nouvelle capture.
- **C3 :** le gendre peut être capturé ou rester libre suivant les pièces et les décisions. Les joueurs continuent à reconstruire quatre actes charnières.
- **Audience finale :** pour chaque acte, ils déterminent qui ordonnait, transmettait, exécutait ou dissimulait et rattachent leurs choix aux preuves. **2 captures + 3/4 actes reconstruits = victoire totale de l'enquête** ; 2/2 + 1/4 = seule victoire tactique. Résultat du troisième suspect annoncé séparément.

Cette simulation est illustrative ; elle n'a pas été jouée ou validée dans l'application.

## 8. Parcours individuel et UX

Le briefing de chaque rôle doit contenir **ce que tu sais / ce que tu peux faire à C1, C2, C3 / ce qui te fait gagner / ce que tu risques**.

- **Enquêteur :** « Je choisis une branche, j'interroge, je dépose un mandat, je prépare quatre chaînes de responsabilité ; je gagne pleinement par 2 captures et 3/4 actes reconstruits. »
- **Analyste :** « Je recoupe les pièces, alerte sur les liens faibles et propose une attribution justifiée pour chacune des quatre décisions. »
- **Juge :** « Je contrôle la recevabilité des demandes, sans connaître le refuge réel ni décider à la place de l'enquête, puis je motive les responsabilités à l'audience. »
- **Fugitif :** « Je choisis ensemble/séparés, une action de réseau et une réaction par cycle ; si capturé je perds ma survie, mais je conserve mes droits de défense jusqu'à la fin. »
- **Troisième suspect :** « J'ai une mission personnelle vérifiable, je peux coopérer, dissimuler ou dénoncer ; je suis interrogeable dès le premier cycle. »
- **Procureur optionnel :** « Je rassemble et soutiens les charges sur les quatre actes ; sans moi l'Enquêteur s'en charge. »

Écran de mandats côté enquête : **CIBLE → PISTE → PIÈCE 1 → PIÈCE 2 → MOTIF → SOUMETTRE**, puis historique des refus/mandats/captures. Juge : **REQUÊTE → vérifier la provenance / temporalité / compétence → AUTORISER ou REFUSER avec motif**. Ne jamais signaler qu'une mauvaise piste est « incorrecte » avant la soumission.

## 9. Critères d'acceptation

1. Pour chacune des variantes A/B/C des 3 scénarios, tester les deux décisions initiales ensemble et séparés, ainsi que les divergences (au moins un refuse).
2. Chaque fugitif a plusieurs options pertinentes, les comprend, peut perdre dès C1 s'il joue mal, peut aussi survivre sans effet miraculeux.
3. Le Juge n'a pas de vote arbitraire ni d'accès à la vérité scellée ; les demandes sont traçables et non répétables indéfiniment.
4. Le troisième suspect a une mission personnelle atteignable et des actions de C1 à C3 même si les deux dirigeants sont pris immédiatement.
5. Quatre actes charnières réellement écrits par variante, avec preuves, responsables, options « non établi » et règles de correction explicables.
6. Les trois cycles et l'audience prolongée restent fluides, sans répétition inutile d'interrogatoires ; mesurer durée à 6, 7, 8, 9 joueurs avant de figer 10–12 min.
7. Fin tactique/fin judiciaire/décès d'épilogue distinguées ; toutes les fins ont des paragraphes narratifs cohérents selon le résultat.
8. Compatibilité de l'ancien système 0/1/2 et des autres DLC, rôles minimums, synchronisation mobile, noms de joueurs, confidentialité des variantes serveur.
9. Aucun changement purement client ne doit promettre le fonctionnement du serveur. Pas de fusion avant end-to-end tests.
