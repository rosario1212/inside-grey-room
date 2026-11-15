# LE RÉGIME — Contrat v6 : La Tête / Le Sceau / La Tour, Journal de Karsane, audiences conditionnelles

**Statut : conception sur branche brouillon, NON jouable côté serveur et NON déployée.** Ce contrat supplante `docs/REGIME_ALLIANCE_MANDATS_VERDICT_V5.md` sur les codes du 034, le rythme de l'audience et les missions du troisième suspect. Le système de capture, d'alias joueur, de variantes et de reconstruction judiciaire doit encore être écrit/testé côté serveur. Ne jamais afficher une actualité inventée comme une vraie dépêche extérieure.

## 1. Trois codes définitifs du 034, ancrés dans la dictature

- **LA TÊTE** : appellation fonctionnelle des transmissions faites *au nom* de l'autorité suprême, utilisée par le président ou par un interlocuteur qui le représente. Un message étiqueté LA TÊTE ne prouve PAS que le président l'a personnellement écrit.
- **LE SCEAU** : circuit de visa des ordres, listes et décrets ; les détenteurs et les usages varient selon la période et le dossier.
- **LA TOUR** : appareil de surveillance, communications et protection de la sécurité présidentielle. Sa présence dans une note ne prouve PAS que le gendre en était personnellement l'émetteur.

L'ancien ensemble « Le Portrait / Le Sceau / Le Rempart » est **supplanté**. Les noms restent des références publiques de fonction, pas des pseudonymes imposés aux joueurs. Une vérité doit associer `(code, événement, date, auteur, pouvoir, pièce justificative)` pour attribuer un acte ; les personnes qui utilisent le code peuvent varier entre opérations sans rupture de continuité.

## 2. ÉVÉNEMENTS DU PAYS : LE JOURNAL DE KARSANE

**Type de contenu : journal de presse fictive EN DIRECT DANS LA PARTIE**, pas actualité du monde réel, aucune récupération de données réseau nécessaires. Les dépêches sont des paragraphes et manchettes **préécrits par scénario, variante et état réel de la session**, avec un canal d'événements du moteur déjà existant (pas de polling autonome). Le mot « direct » décrit la réaction immédiate à une transition de jeu, pas du direct journalistique véritable.

### Règles d'affichage
1. L'actualité est visible par TOUS les joueurs pour les événements publics confirmés ; jamais d'information privée d'un fugitif révélée par une dépêche accidentelle.
2. Une dépêche est émise **après** la transaction de changement d'état serveur, une seule fois par event_id ; ordre fiable et idempotence sur reconnexion.
3. Les récits de manifestations sont **des conséquences narratives fixes** des captures. Ils peuvent inclure une majorité de personnes réjouies dans la capitale, avec survivants demandant des comptes et fidèles exprimant de la colère. Éviter « 15 millions célèbrent » : la population est diversifiée.
4. L'annonce « PRÉSIDENT CAPTURÉ » ne se déclenche que lorsque la capture du rôle `president` est **validée** dans 034. Aucune annonce sur piste ouverte, mandat simplement autorisé, ou capture de son gendre.
5. Les captures des autres dossiers ont une portée régionale : prison et familles des détenus (032), effondrement des protections familiales et militaires (033).
6. En cas de capture 2/2, la presse peut annoncer **fin de la traque**, sans annoncer « condamnation pour génocide » avant toute reconstitution de responsabilité.
7. Pas de "flash" automatique à chaque clic ; au plus une manchette majeure par changement de statut et une synthèse de fin de cycle si des faits nouveaux sont publics. Éviter bruit et latence.

### Paquet de dépêches exemplaires (pas activées)

**032, pièces de Vahran dévoilées :**
> **DARSEN — DES REGISTRES DE VAHRAN RETROUVÉS AU PALAIS.** Des familles se rassemblent devant la prison et demandent à connaître le sort de leurs proches. Les autorités de transition confirment l'ouverture d'une enquête sur les transferts disparus.

**033, fils capturé :**
> **LE FILS DU PRÉSIDENT ARRÊTÉ.** Des groupes se réunissent devant les anciens bureaux du parti. Des alliés de la famille dénoncent l'arrestation. Le ministre de la Défense reste recherché.

**034, président capturé :**
> **FLASH — LE PRÉSIDENT DÉCHU A ÉTÉ CAPTURÉ.** La nouvelle déclenche des scènes de liesse à Darsen : habitants dans les rues, drapeaux brandis, portraits officiels abattus. Des associations de proches des disparus exigent que les archives soient préservées et les responsabilités établies. Les anciens fidèles dénoncent une arrestation politique.

**034, président échappe à C3 :**
> **LE PRÉSIDENT RESTE INTROUVABLE.** Les autorités de transition ferment la phase de recherche sans annoncer de capture. Des familles des victimes réclament la poursuite des investigations.

**Après audience, seulement si les résultats sont établis :**
> **LE TRIBUNAL RECONSTITUE LA CHAÎNE DES ORDRES.** Les pièces examinées permettent de relier plusieurs décisions aux responsables désignés ; l'attribution des autres actes demeure contestée.

Ces textes ne sont pas du "live news" réel, et les parties personnalisées doivent utiliser les noms de joueur avec un gabarit sûr.

### Un Journaliste facultatif ?
Le journal ne dépend JAMAIS d'un rôle Journaliste. Si une partie possède déjà un Journaliste optionnel, celui-ci peut choisir quel événement public authentique commenter et proposer une question à l'audience ; sa décision n'invente pas d'événement et ne filtre pas des informations indispensables. Pas de nouvelle place requise.

## 3. Les missions du TROISIÈME SUSPECT sont testables, précises et actives

Trois personnages non fugitifs déjà prévus : 032 secrétaire du palais, 033 responsable financier du clan, 034 responsable des transmissions. Un joueur incarne le troisième suspect dès C1, reçoit une **mission privée explicite** à deux conditions cumulatives dans sa variante. Il peut répondre en interrogatoire, faire une déclaration par cycle, négocier et préparer sa défense ; le serveur calcule sa réussite sur des **événements enregistrés**, jamais sur l'opinion d'un MJ ni l'analyse d'une conversation.

| Scénario | Mission de base proposée | Condition 1 (action personnelle) | Condition 2 (effet vérifiable) |
| --- | --- | --- | --- |
| **032 — Le dépositaire du cabinet** | **LE VISA DISPARU** | Remettre une copie authentique de la fiche de transfert définie dans sa carte **avant la fin de C2** (bouton `REMETTRE LA FICHE`) | Faire établir à l'audience **qui a autorisé le transfert** en reliant une preuve indépendante ; pas nécessairement la personne qu'il accuse |
| **033 — Le financier du clan** | **LES COMPTES DU POUVOIR** | Révéler une transaction de financement préétablie de sa variante **au plus tard en C2** (bouton `LIVRER LE REGISTRE`) | Faire relier correctement à l'audience cette transaction à **la décision criminelle financée et son donneur d'ordre** ; ce peut être défavorable à son propre personnage |
| **034 — Le dépositaire des transmissions** | **LE MESSAGE ORIGINAL** | Identifier et déposer la pièce authentique correspondant à **LA TÊTE / LE SCEAU / LA TOUR** pour une **opération précise** avant fin C2 | À l'audience, obtenir une attribution correcte et motivée du **signataire réel et du transmetteur** de cette opération (qui peuvent être différents) |

**Choix compétitif permis :** les variantes peuvent donner au troisième suspect une mission alternative explicite **PROTÉGER UN ACTE** s'il reste fidèle au régime, à la place d'une mission de divulgation. Deux conditions alors :
- **Action personnelle :** déposer avant fin C2 sa défense écrite sur un acte précis et demander un interrogatoire sur celui-ci (événement serveur enregistré), sans fabriquer de document ;
- **Résultat :** faire en sorte que la fiche finale des enquêteurs **n'attribue pas correctement son implication sur cet acte**, malgré la disponibilité indépendante des preuves, et sans qu'une déclaration officielle du personnage soit automatiquement considérée comme vraie.

La mission est assignée **à l'ouverture** par la variante, elle n'est pas changée selon l'état de la traque, et son critère de réussite est montré dans sa carte privée dès C1. Un objectif offensif peut bénéficier de la traque ; un objectif défensif peut la compromettre. **S'il ne fait rien, il ne gagne jamais automatiquement.** Il reste actif même si les fugitifs sont arrêtés au premier cycle. Son résultat reste distinct de la victoire collective et des qualifications judiciaires.

**Anti-arbitraire** : pièces et actes sont préécrits, noms de personnage par alias stable, objectifs non publics, échéances explicites, aucun contrôle d'une capture par ce personnage seul. L'action de dépôt n'abolit pas la possibilité de retrouver la preuve autrement. Pas de confusion entre accusation non établie et acquittement.

## 4. Tribunal final : long UNIQUEMENT si la double capture est achevée au C3

Conserver **3 cycles**, **toutes les possibilités de confrontation existantes**, et toujours la reconstitution de **4 décisions criminelles** avec l'attribution « a ordonné / transmis / exécuté / savait et contrôlait / a couvert », chaque rôle attribué à une personne ou `NON ÉTABLI`. Les chiffres 0/1/2 des autres packs ne sont pas réutilisés comme niveaux de responsabilité du Régime.

### Déclenchement de la durée (état calculé côté serveur)

| Résultat de traque | C2/C3 | Durée finale proposée |
| --- | --- | --- |
| **2 capturés à la fin de C1** | C2 et C3 déjà utilisés pour auditions, confrontations et reconstitution judiciaire | **Durée habituelle du moteur**, pas 10–12 minutes |
| **2e capture au C2** | C3 disponible pour auditions et reconstitution | **Durée habituelle du moteur**, pas 10–12 minutes |
| **2e capture au C3** (1er capturé en C1, C2 ou C3) | Au moins un fugitif n'a pas pu participer pleinement à l'audience contradictoire avant C3 | **10–12 minutes**, à tester ; c'est la SEULE condition d'audience prolongée |
| **Au moins un reste libre fin C3** | Il n'y a pas de comparution fictive du fugitif absent | **Durée habituelle**, adaptée à l'examen des responsabilités disponibles |

Dans cette logique « capturés au C3 » signifie **la double capture n'est acquise qu'au cycle 3**, pas nécessairement que deux arrestations surviennent à la même minute. Les conclusions judiciaires sur un fugitif absent sont limitées aux pièces et au témoignage des personnes réellement présentes ; le tribunal n'organise pas d'interrogatoire imaginaire.

Le procès final comporte : réquisitoire si Procureur présent, exposé des quatre chaînes par l'Enquêteur/Analyste, contestation par chaque accusé capturé et par le troisième suspect, arbitrage par le Juge, décisions motivées. Si aucune personne n'est capturée, une **commission de reconstitution** peut analyser les pièces sans simuler un procès en présence de fugitifs.

La victoire tactique est 2/2 captures ; le résultat judiciaire indépendant se mesure par l'attribution correcte d'au moins 3 des 4 actes (seuil provisoire, test à réaliser). La victoire totale exige les deux. Le décès/exécution narratif des capturés est situé dans l'épilogue et **n'est pas une condamnation automatique prononcée par le Juge à la capture**.

## 5. Simulation de transitions du journal et du tribunal (contrat)

- C1 : président capturé → diffuser immédiatement une seule manchette de liesse populaire à Darsen ; **pas** de proclamation d'innocence ou culpabilité. Le capturé continue ses déclarations.
- C1 : deux dirigeants capturés → victoire tactique verrouillée ; les deux prochains cycles passent en judiciaire, **audience normale**.
- C2 : deuxième dirigeant capturé → C3 judiciaire, **audience normale**.
- C3 : deuxième dirigeant capturé → **audience prolongée de 10–12 minutes**, après gel des mandats ; on n'enchaîne pas une phase de fuite.
- C3 : président toujours libre → manchette de fuite et maintien des objectifs personnels ; **audience normale** sans faux témoignage à la barre.
- Le journal doit toujours présenter la vérité des événements PUBLICS et le Juge doit toujours pouvoir distinguer la capture des actes criminels établis.

## 6. Prochaines tâches de développement

1. Écrire 3 variantes complètes pour 032–034, avec 4 actes charnières, 2 fugitifs et troisième suspect, pièces, faux renseignements contradictoires et événements de presse préécrits.
2. Implémenter côté serveur le système d'alias par rôle, le choix secret d'alliance, les actions adversariales, les mandats, états de captures et les conditions idempotentes du fil d'actualité.
3. Configurer le Juge requis et Procureur optionnel après audit de tous les contrats serveur/client ; 034 est actuellement limité à sept joueurs dans la configuration publique historique.
4. Ajouter l'affichage Journal de Karsane (fil d'événements) à côté de la carte du régime, sans polling supplémentaire, avec volet « événement confirmé ».
5. Ajouter la règle de temps d'audience exclusivement conditionnée à la **deuxième capture en C3**, calculée serveur, puis test du rythme avec six à neuf joueurs.
6. Tester au minimum 0/2, 1/2, 2/2 en C1/C2/C3 ; président capturé mais gendre libre ; dirigeants séparés/ensemble ; objectifs du troisième suspect satisfaits/ratés ; exactitude 0–4 actes et toutes les variantes.
7. Aucun rendu « EN DIRECT » ne doit porter à confusion avec une information provenant d'une agence de presse réelle. Pas de publication avant tests end-to-end.


## 7. Ajustement simplifié — audience et troisième suspect

**Règle UX : le tribunal est une simulation simple, pas un nouveau jeu procédural.**

- **Audience longue uniquement lorsque la deuxième capture intervient au C3** (durée totale cible 10–12 min à tester) : ouverture et charges très courtes par Enquêteur/Procureur, **2 minutes garanties à chacun des 3 suspects** pour présenter sa version et sa défense, conclusion du Juge, puis **vote final du camp d'enquête** sur le degré de responsabilité de chacun, selon la grammaire d'audience déjà présente dans v52 (échelle 0/1/2). Le Juge anime et arbitre selon les règles existantes ; aucune voix supplémentaire ou pouvoir arbitraire ne doit être inventé pour lui.
- **Audience normale lorsque les deux captures sont obtenues en C1 ou C2** : les confrontations des cycles suivants remplacent l'essentiel des longues défenses finales ; garder clôture et vote de responsabilité du moteur existant. Ne pas imposer artificiellement trois fois deux minutes si les interrogatoires ont déjà eu lieu.
- **Fiche des quatre actes charnières du Régime** : l'équipe peut rattacher des actes à des responsables avec preuves ; cela **complète** le vote v52 par degrés de responsabilité au lieu de créer un tribunal indépendant incompréhensible. Séparer le score de reconstitution des quatre actes et l'échelle v52 appliquée aux suspects. Les règles exactes du vote et les droits du Juge doivent être audités sur le runtime v52 avant modification.
- **Troisième suspect : deux voies uniquement et conditions vérifiables** :
  - **COOPÉRATION** : avant fin C2, remettre la pièce authentique spécifique de la carte privée **ET**, dans sa déclaration finale, désigner correctement le donneur d'ordre et reconnaître correctement sa propre implication. Score serveur indépendant des erreurs de vote du camp d'enquête.
  - **PROTECTION** : avant fin C2, déposer sa version défensive sur un acte précis désigné dans sa carte **ET** faire en sorte que le vote final du camp d'enquête **n'identifie pas correctement son degré de responsabilité concernant cet acte**. Les preuves restent accessibles et le juge ne décide pas arbitrairement de sa réussite.
- La voie est fixée par la variante avant C1, révélée au seul troisième suspect. S'il n'agit pas, il perd. Les deux voies peuvent être gagnées même si les deux fugitifs sont capturés tôt, par dialogue, confrontation et vote final.

**Statut : objectif de conception ; rien de ceci n'est fonctionnel dans le serveur à la seule lecture de ce document.**
