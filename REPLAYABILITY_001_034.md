# Inside Grey Room v13.1 — Rejouabilité 001–034

## Principe non négociable

> **Un joueur qui rejoue un scénario ne doit jamais pouvoir résoudre la partie de mémoire.**

La rejouabilité ne peut pas se limiter à changer les pseudos, l’ordre des trames ou l’attribution des cartes. À chaque nouvelle partie, le serveur choisit une **variante canonique complète** pré-écrite. Elle reste immuable jusqu’à la révélation et son identifiant n’est jamais envoyé au client.

Chaque variante doit pouvoir changer la responsabilité principale, les relations secrètes, une partie de la chronologie, les objectifs privés et les trames compatibles. Le MJ adaptatif choisit uniquement **comment** cette vérité sera découverte. Il ne peut jamais modifier **ce qui s’est réellement passé**.

## Contrat technique

- minimum **3 variantes canoniques** par scénario avant activation ;
- sélection serveur au lancement ;
- variante stockée uniquement côté serveur ;
- cartes privées, relations, trames, objectifs, événements et révélation proviennent du même `variant_id` ;
- aucune preuve d’une autre variante ne peut entrer dans la partie ;
- une reconnexion retrouve exactement la même variante ;
- une partie suivante peut sélectionner une autre variante ;
- éviter la répétition immédiate d’une variante lorsqu’une autre est disponible ;

## Contrats par scénario

### 001 — LA CHAMBRE 222
**Invariant :** Hôtel, horaires, passages, responsabilité.

- **Variante A :** L’intimidateur quitte Maël vivant; l’homme venu ensuite porte le geste mortel.
- **Variante B :** La première altercation provoque la blessure fatale; le visiteur suivant ne fait que dissimuler ce qu’il découvre.
- **Variante C :** Le troisième passage devient central: une intervention imprévue provoque la mort tandis que les deux premiers cachent chacun un autre fait.

### 002 — LE SILENCE DE LÉON
**Invariant :** Suicide, pression, responsabilité sans causalité simpliste.

- **Variante A :** Une pression directe et répétée pèse le plus lourd, les autres fautes restant périphériques.
- **Variante B :** La responsabilité principale vient d’une occasion concrète d’intervention volontairement ignorée.
- **Variante C :** Aucun acteur n’explique seul l’issue: les responsabilités se répartissent entre pression, abandon et dissimulation.

### 003 — LE DERNIER PROTOCOLE
**Invariant :** Chaîne scientifique et institutionnelle.

- **Variante A :** La rupture vient d’un ordre de poursuite malgré un signal d’arrêt.
- **Variante B :** La validation technique défaillante devient le maillon décisif.
- **Variante C :** Un transfert non autorisé crée la condition critique; les autres acteurs couvrent ensuite leur part.

### 004 — LES TROIS ABSENTS
**Invariant :** Overdose, appels, fenêtres d’intervention.

- **Variante A :** Une personne possédait une fenêtre réaliste de sauvetage et choisit de ne pas agir.
- **Variante B :** Deux personnes se coordonnent pour minimiser ce qu’elles ont compris pendant la nuit.
- **Variante C :** La chronologie des appels change le centre de gravité: celui qui semblait le plus absent n’est pas celui qui pouvait encore intervenir.

### 005 — LE MASQUE BLANC
**Invariant :** Mise en scène, faux coupable, recontextualisation.

- **Variante A :** Le rituel est entièrement postérieur au meurtre et sert à détourner l’enquête.
- **Variante B :** Le masque provient d’un événement antérieur sans lien avec la mort; l’erreur consiste à lui donner trop de poids.
- **Variante C :** Une intimidation mise en scène dégénère, puis un tiers reconstruit la scène pour protéger quelqu’un.

### 006 — LES CENDRES DU CHALET
**Invariant :** Mémoire collective, chute, secret de groupe.

- **Variante A :** La chute est accidentelle mais le groupe organise ensuite un mensonge collectif.
- **Variante B :** Une confrontation physique provoque réellement la chute; le pacte protège son auteur.
- **Variante C :** La victime survit d’abord; la responsabilité principale vient du refus volontaire d’appeler les secours.

### 007 — LE TESTAMENT GRIS
**Invariant :** Héritage, intérêts, renversement.

- **Variante A :** Un projet de modification du testament crée un mobile mais le décès vient d’un autre conflit.
- **Variante B :** Une dette dissimulée devient le vrai moteur de l’acte principal.
- **Variante C :** Une filiation cachée change le bénéficiaire réel et reconfigure totalement les intérêts de chacun.

### 008 — SOUS SERMENT
**Invariant :** Mensonge, témoignage, responsabilité distincte.

- **Variante A :** Le principal menteur protège une relation privée et n’est pas responsable du fait principal.
- **Variante B :** Le mensonge cache une faute procédurale qui a rendu l’événement possible.
- **Variante C :** Le témoin le plus cohérent porte la responsabilité réelle tandis qu’un autre ment seulement par peur.

### 009 — LE SUJET 17
**Invariant :** Consentement, mémoire, expertise.

- **Variante A :** Le retrait de consentement est ignoré par la direction du programme.
- **Variante B :** Le point critique vient d’une décision clinique individuelle prise après le retrait.
- **Variante C :** La chronologie de l’amnésie et des notes modifiées révèle une responsabilité institutionnelle différente de celle attendue.

### 010 — LE BRUIT DES MURS
**Invariant :** Accès, sons, enfermement, abandon.

- **Variante A :** Une personne verrouille volontairement la paroi.
- **Variante B :** La fermeture est accidentelle; la responsabilité vient de bruits volontairement ignorés.
- **Variante C :** Un acteur comprend exactement où se trouve Nora mais choisit de ne pas intervenir pour protéger un autre secret.

### 011 — 36 HEURES
**Invariant :** Chaîne de commandement.

- **Variante A :** Un ordre initial est illégal et sa transmission explique l’essentiel.
- **Variante B :** L’ordre initial est défendable mais un exécutant dépasse volontairement son cadre.
- **Variante C :** L’acte principal est suivi d’une réécriture du rapport qui redistribue la responsabilité vers le commandement.

### 012 — FIDÈLES
**Invariant :** Communauté fermée, rétention, emprise.

- **Variante A :** Le dirigeant donne réellement l’ordre de retenir Sacha.
- **Variante B :** Une consigne ambiguë est radicalisée par le groupe sans ordre explicite.
- **Variante C :** Un membre agit de sa propre initiative; le groupe devient responsable surtout lorsqu’il choisit ensuite de couvrir l’acte.

### 013 — LIGNE DE MIRE
**Invariant :** Assassinat, financement, accès, exécution.

- **Variante A :** Le tireur est recruté par une chaîne classique de commandement et financement.
- **Variante B :** Le financeur décide réellement de l’assassinat tandis que le coordinateur ignore la cible finale.
- **Variante C :** La faille de sécurité est volontairement créée de l’intérieur et devient le maillon central, le tireur restant matériellement responsable.

### 014 — SOUS SECRET
**Invariant :** Fuite, sources, contre-espionnage.

- **Variante A :** La fuite est volontaire et vise une source précise.
- **Variante B :** La catastrophe vient d’une protection de source mal exécutée plutôt que d’une trahison directe.
- **Variante C :** Une fausse piste de contre-espionnage fait croire à une fuite interne alors qu’un accès légitime a été détourné.

### 015 — AVANT LA MORT
**Invariant :** Hôpital, programme, décisions institutionnelles.

- **Variante A :** La direction maintient le programme malgré les alertes.
- **Variante B :** Le clinicien devient le décideur principal en outrepassant une recommandation d’arrêt.
- **Variante C :** La chaîne administrative retarde une sortie possible puis réécrit le dossier, déplaçant la responsabilité principale.

### 016 — LE DERNIER ÉTAGE
**Invariant :** Violence filmée, meurtre hors caméra.

- **Variante A :** L’exécutant resté après la coupure choisit seul le meurtre.
- **Variante B :** L’organisateur revient après la vidéo et prend lui-même la décision létale.
- **Variante C :** La mort résulte du dispositif d’humiliation et de sédation sans geste meurtrier distinct; la dissimulation devient ensuite collective.

### 017 — LE PRIX DU SILENCE
**Invariant :** Enlèvement, témoin, accords.

- **Variante A :** Un captif est tué par un exécutant qui dépasse la consigne initiale.
- **Variante B :** La victime pouvait être libérée mais un acteur choisit de prolonger la rétention.
- **Variante C :** Une négociation conclue en cours de séquestration modifie les responsabilités: celui qui semblait secondaire devient le maillon décisif.

### 018 — LES ASSIETTES VIDES
**Invariant :** Ancien foyer, scène déplacée, terrain.

- **Variante A :** Un ancien résident tue l’ancien directeur et déplace ensuite la scène.
- **Variante B :** La mort précède la mise en scène: une personne innocente du meurtre déplace le corps pour produire un message.
- **Variante C :** Un projet collectif d’intimidation dérape lorsqu’un participant agit seul, puis les autres réorganisent la scène.

### 019 — LE GRAND BAL
**Invariant :** Gala, institutions, sécurité, influence.

- **Variante A :** Le chef de sécurité décide seul du meurtre après avoir reçu une demande de pression.
- **Variante B :** La figure d’influence donne cette fois un ordre suffisamment précis pour devenir commanditaire principal.
- **Variante C :** L’intermédiaire institutionnel agit de sa propre initiative pour protéger le système puis organise la dissimulation.

### 020 — L’APOTHÉOSE
**Invariant :** Incendie, système, responsabilités superposées.

- **Variante A :** Un feu volontaire devient catastrophe à cause des sorties verrouillées et des systèmes défaillants.
- **Variante B :** Le départ de feu est accidentel; la responsabilité principale devient entièrement systémique et décisionnelle.
- **Variante C :** Une diversion volontaire reste limitée au départ mais le retard d’évacuation, cette fois délibéré, devient le facteur humain dominant.

### 021 — L’ENVELOPPE
**Invariant :** OMERTÀ — argent, fuite, cercle de connaissance.

- **Variante A :** Paolo détourne volontairement l’enveloppe après avoir découvert un paiement caché.
- **Variante B :** Luca modifie l’itinéraire sur pression d’un supérieur; Paolo est seulement celui qui comprend ensuite la fraude.
- **Variante C :** Il n’y a pas de vol initial: une double comptabilité crée un manque apparent que quelqu’un transforme ensuite en occasion de chantage.

### 022 — OMERTÀ
**Invariant :** OMERTÀ — ordre ambigu, meurtre interne, silence.

- **Variante A :** Luca tue après une formulation ambiguë de Rinaldi.
- **Variante B :** L’ordre est cette fois transmis par un intermédiaire et devient suffisamment explicite pour engager le sommet local.
- **Variante C :** Le meurtre est une initiative personnelle; l’omertà postérieure donne l’illusion d’un ordre hiérarchique qui n’existait pas.

### 023 — LA TABLE
**Invariant :** OMERTÀ — négociation, fuite, attaque contre Adriano.

- **Variante A :** La fuite vient du cercle familial proche des négociations.
- **Variante B :** La chaise vide correspond à un intermédiaire qui vend l’itinéraire d’Adriano.
- **Variante C :** La sécurité connaît une faille avant la réunion; un rival ne fait que l’exploiter, ce qui déplace la responsabilité.

### 024 — IL PENTITO
**Invariant :** OMERTÀ — coopération, protection, source.

- **Variante A :** Paolo devient la source principale et doit choisir jusqu’où remonter.
- **Variante B :** Nico détient l’information décisive tandis que Paolo sert de diversion involontaire.
- **Variante C :** Deux sources coopèrent séparément; la Famiglia croit chercher une seule taupe et interprète mal les fuites.

### 025 — IL DON
**Invariant :** OMERTÀ — commandement, tolérance, initiatives.

- **Variante A :** Vittorio a réellement autorisé plusieurs méthodes sans dicter chaque violence.
- **Variante B :** Les intermédiaires ont systématiquement radicalisé ses demandes et utilisé son nom pour obtenir l’obéissance.
- **Variante C :** Adriano prend plusieurs décisions en invoquant son père sans accord préalable, créant une fausse chaîne de commandement.

### 026 — LA VILLE TOMBE
**Invariant :** TERREUR — ville qui chute, autorité extérieure, responsabilité.

- **Variante A :** La figure idéologique connaît l’objectif visant le périmètre judiciaire.
- **Variante B :** Le coordinateur, et non la figure idéologique, détient l’information centrale sur la continuité du réseau.
- **Variante C :** Le soutien administratif possède la seule information permettant de comprendre pourquoi certains secteurs tombent institutionnellement, sans être l’auteur principal des atrocités.

### 027 — LA ZONE ROUGE
**Invariant :** TERREUR — vérité sélectionnée, décision sous pression.

- **Variante A :** Le cadre supérieur donne beaucoup de vérités pour faire disparaître ses rivaux.
- **Variante B :** Le coopérant intermédiaire sélectionne les vérités pour protéger une autre branche du groupe.
- **Variante C :** La source principale est sincère, mais ses informations sont devenues obsolètes; un autre suspect exploite cette erreur sans mentir directement.

### 028 — DERNIER PÉRIMÈTRE
**Invariant :** TERREUR — cellule intérieure, coopération, effondrement.

- **Variante A :** Le troisième suspect a validé le maintien d’une présence clandestine intérieure.
- **Variante B :** Le premier suspect a fourni auparavant un accès qu’il pensait désactivé et cache désormais sa responsabilité.
- **Variante C :** Le deuxième a livré des données administratives utilisées pour maintenir une présence interne; il coopère sincèrement mais minimise ce rôle.

### 029 — LE CYCLE MORT
**Invariant :** CARTEL — représailles, source, chaîne de décision.

- **Variante A :** Le responsable local lance l’intimidation qui devient meurtrière.
- **Variante B :** L’exécutant dépasse volontairement une consigne limitée et devient le principal responsable.
- **Variante C :** Le financier autorise directement une représaille après avoir prétendu ne gérer que les paiements.

### 030 — LA COUR ACHETÉE
**Invariant :** CARTEL — justice contaminée, argent, décisions.

- **Variante A :** L’intermédiaire institutionnel participe consciemment à une décision achetée.
- **Variante B :** La décision judiciaire contestée reste juridiquement défendable; la corruption réelle se situe dans la menace contre un témoin.
- **Variante C :** La chaîne financière vise surtout le parquet et non le juge, déplaçant complètement la lecture institutionnelle.

### 031 — LA DETTE
**Invariant :** CARTEL — enlèvement, négociation, engagement.

- **Variante A :** Le responsable violent initie l’enlèvement et fixe les exigences.
- **Variante B :** Le gardien poursuit la rétention après le retrait de l’ordre initial et devient le maillon principal.
- **Variante C :** Le négociateur conditionne sciemment la libération à une concession et transforme son rôle supposé secondaire en responsabilité centrale.

### 032 — LES ARCHIVES DU PALAIS
**Invariant :** LE RÉGIME — archives, ordres, appareil d’État.

- **Variante A :** Le responsable de sécurité transforme des directives générales en détentions abusives.
- **Variante B :** Le conseiller du palais désigne précisément les cibles et porte la responsabilité politique principale.
- **Variante C :** L’administrateur modifie consciemment les listes après avoir appris les abus, devenant un acteur décisionnel plutôt qu’un simple exécutant.

### 033 — LA DYNASTIE
**Invariant :** LE RÉGIME — famille, titres, pouvoir réel.

- **Variante A :** Le conseiller sans titre exerce le pouvoir réel le plus important.
- **Variante B :** Le ministre, présenté comme simple protecteur, contrôle en réalité les décisions essentielles.
- **Variante C :** Le financier familial devient le centre de pouvoir par le contrôle des ressources et des nominations indirectes.

### 034 — LES NOMS QU’ILS PORTAIENT
**Invariant :** LE RÉGIME — surnoms rotatifs, fonctions, pouvoir.

- **Variante A :** Les fonctions NOTAIRE / TOUR / HÉRITIER correspondent à une première répartition sur les opérations critiques.
- **Variante B :** Les surnoms tournent entre deux opérations et rendent fausse toute attribution permanente à une personne.
- **Variante C :** Une fausse hiérarchie volontaire utilise les mêmes surnoms pour masquer qui décide réellement; seule la fonction exercée à chaque opération est fiable.

## Critère QA anti-mémoire

Pour chaque scénario, un testeur qui connaît parfaitement la variante A doit pouvoir lancer la variante B ou C sans déduire le responsable principal à partir du titre, du premier briefing ou d’une trame générique. Si la mémoire de l’ancienne partie donne la solution, la variante n’est pas assez différente.

## Important

Le fichier `scenario-replay-contracts-v13.json` décrit les **directions canoniques à authorer**. Une direction n’est activable en production qu’une fois ses cartes privées, relations, objectifs, trames et révélation finale entièrement cohérents. L’application ne doit jamais fabriquer automatiquement des preuves pour combler un manque.