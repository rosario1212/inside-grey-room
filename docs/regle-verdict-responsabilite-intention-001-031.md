# Règle de verdict — responsabilité, geste et intention (dossiers 001–031)

**Principe éditorial** : les niveaux 0/1/2 évaluent l'étendue de la responsabilité, **jamais une intention de tuer implicite**. Le geste, la connaissance, l'ordre ou la volonté sont qualifiés uniquement quand une vérité canonique et des indices permettent une correction automatique. L'enquêteur ne doit pas juger librement la sincérité d'un joueur.

## Scénario 001 — mécanisme réalisable

- La victime s'appelle **Maël** dans le dossier actuel.
- Enquêteur : attribuer exactement un niveau 2, puis répondre à **« Comment Maël a-t-il été mortellement blessé ? »**
- Trois réponses déjà prises en charge par la reconstruction `reconstruction_001.gesture` : premier visiteur avec couteau volontaire (`s1_intentional`), visiteur rémunéré avec couteau volontaire (`s2_intentional`), client qui provoque involontairement la blessure en voulant séparer deux hommes (`s3_accident`).
- La question précise que le geste doit concerner le **seul suspect désigné au niveau 2**. Elle est conservée dans `final_lock.reconstruction_001.gesture`. **Attention :** les slots secrets sont attribués aléatoirement et ne correspondent pas nécessairement à l'ordre public des pseudonymes. La cohérence entre le niveau 2 et le slot du geste doit être validée côté serveur, sans révéler les slots privés ; elle n'est pas encore contrôlée par le moteur de production.
- La chronologie (`moment`) et la circonstance qui explique les apparences (`reframe`) restent nécessaires.
- **Limitation actuelle** : le moteur de victoire calcule d'abord les niveaux. La correction de `gesture` apparaît dans le score de reconstruction mais ne constitue pas encore un objectif distinct par suspect. Ne pas l'annoncer comme une victoire automatique.
- Les neuf fiches du dossier 001 ont été validées narrativement ; les objectifs du second personnage B et du premier personnage C exigent un arbitrage formel entre se disculper et faire constater sa responsabilité exacte.

## Application contextuelle : dossiers 002–031

| Dossier | Question intentionnelle pertinente, sans ajouter une seconde note de responsabilité |
|---|---|
| 002 | Une personne avait-elle connaissance d'une demande explicite d'aide ? Aucun meurtrier à identifier. |
| 003 | Décision consciente de poursuivre malgré un avertissement, validation fautive ou transfert sans accord ? |
| 004 | Quelle information de détresse était réellement parvenue à chacun, et quand ? |
| 005 | Qui a tué et qui a volontairement ajouté ou déplacé le symbole ? |
| 006 | Chute accidentelle, coup provoquant la chute ou décision de ne pas appeler les secours ? |
| 007 | Pression volontaire sur un testament ou geste causal distinct lors de la mort ? |
| 008 | Faux témoignage intentionnel, erreur d'horaire ou omission faute de connaissance ? |
| 009 | Qui savait que le Sujet 17 avait retiré son consentement, et qui a maintenu la procédure ? |
| 010 | Fermeture accidentelle, enfermement volontaire ou décision de laisser Nora encore vivante ? |
| 011 | Ordre initial sciemment illégal ou dépassement volontaire des limites par l'exécutant ? |
| 012 | Ordre de retenir Sacha, initiative violente non ordonnée ou couverture ultérieure ? |
| 013 | Commande de meurtre, préparation consciente, faille de sécurité sciemment créée ? |
| 014 | Vente volontaire de la liste, extraction mal sécurisée ou détournement d'accès ? |
| 015 | Qui a compris les alertes avant de maintenir la prise en charge, et qui a modifié les dossiers ? |
| 016 | Meurtre voulu après la coupure ou décès lié aux violences et à la sédation ? |
| 017 | Geste directement fatal ou décision distincte de refuser une libération / des secours ? |
| 018 | Qui a donné la mort et qui a installé la scène des assiettes ? |
| 019 | Volonté de faire taire et ordre explicite de tuer : sont-ils distincts ? |
| 020 | Départ du feu volontaire ou accidentel, restrictions connues, décision relative à l'évacuation ? |
| 021 | Détournement volontaire, consigne relayée de travers ou décalage comptable réel ? |
| 022 | Ordre explicite de tuer, interprétation d'une menace ou initiative personnelle ? |
| 023 | Transmission voulue du trajet, fuite involontaire ou faille indépendante de l'attaque ? |
| 024 | Coopération volontaire et vérifiable : quelle information a réellement été transmise et à qui ? |
| 025 | Quels actes furent expressément autorisés et quels actes furent décidés ensuite par les exécutants ? |
| 026 | Soutien terroriste conscient, adhésion idéologique et connaissance d'une menace encore active ? |
| 027 | Information sciemment manipulée, rétention délibérée ou renseignements devenus obsolètes ? |
| 028 | Participation volontaire aux violences, coopération réelle et connaissance de la cellule intérieure ? |
| 029 | Ordre de menacer, décision de tuer ou financement conscient de représailles ? |
| 030 | Commandement de l'assaut, exécutions effectivement ordonnées et dissimulation du registre ? |
| 031 | Ordre d'El Luto, initiative locale non autorisée et connaissance des consignes relatives aux proches ? |

### Règles de livraison

1. Conserver la reconstitution existante si elle distingue déjà les faits. Ne pas ajouter une deuxième saisie décorative.
2. Choisir une question concise et adaptée, deux ou trois réponses ancrées dans les manuscrits, une seule réponse canonique par variante.
3. Comparer les réponses à la variante **épinglée à la salle** (aucune modification rétroactive du canon d'une partie).
4. Aucun champ supplémentaire sans validation serveur et preuve que l'enquête peut raisonnablement répondre.
5. Contrôler la cohérence entre la fiche privée, les relations, les indices des cycles, les choix finaux et le calcul automatique de victoire.
6. Si l'intention est indémontrable, ne pas demander au joueur de la deviner : établir les seuls actes et connaissances démontrés.
7. Écrire toujours comme la variante 001-B : simple, direct, tutoiement, sans induire de fausses suspicions.

**État** : interface du scénario 001 adaptée sur une branche de révision et choix déjà sérialisé côté serveur ; contrôle sécurisé slot/niveau 2 et scoring de la victoire à intégrer avant publication ; extension des choix spécifiques des autres dossiers non encore publiée, à réaliser pendant leur audit et leur validation.
