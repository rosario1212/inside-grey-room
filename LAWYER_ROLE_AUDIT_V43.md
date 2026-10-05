# Inside Grey Room — Audit Avocat v43

## Décision de design

Le rôle Avocat (`maitre` côté serveur) passe d’une logique ancienne de clients attribués automatiquement / multi-clients à une logique de **représentation choisie**.

Principe central : **un avocat ne peut avoir qu’un seul client officiel à la fois, et ce choix est verrouillé jusqu’à la fin de l’affaire**.

L’Avocat reste cependant disponible pour des consultations officieuses avec les autres suspects. Cette distinction entre représentation officielle et consultation officieuse est le cœur du recalibrage.

## Problèmes identifiés avant v43

1. La carte Avocat pouvait afficher plusieurs clients attribués automatiquement, sans moment de consentement clair du suspect ni choix réel de l’Avocat.
2. Une confrontation entre deux clients du même avocat créait un conflit de loyauté et une surcharge mentale difficile à jouer.
3. Le rôle manquait d’un moment d’entrée clair dans la partie : qui est réellement représenté, à partir de quand, et avec quelle confirmation ?
4. Un simple refus risquait de devenir une décision trop punitive si le joueur appuyait sur le mauvais bouton.
5. Les consultations avec les non-clients n’avaient pas d’intérêt mécanique/social suffisamment explicite.
6. Les anciennes règles et badges parlaient encore de défense multiple, ce qui contredisait la nouvelle direction.
7. L’Avocat n’avait pas de résumé court lui permettant d’évaluer rapidement la gravité de la situation d’un demandeur sans recevoir la vérité complète de sa carte.
8. La préparation avant les conclusions provisoires n’était pas suffisamment signalée.

## Flux v43

### 1. Lecture des cartes

Chaque suspect, si un Avocat est présent, peut demander une représentation depuis son téléphone.

- Une seule demande peut être en attente par suspect.
- Une demande refusée peut être envoyée à nouveau.
- Un refus ne crée jamais de blocage définitif.
- Les demandes restent possibles tant qu’un avocat disponible n’a pas verrouillé de client et jusqu’au cycle 3 inclus.

### 2. Liste de demandes de l’Avocat

Chaque demande affiche :

- le prénom / pseudo du suspect ;
- le nombre d’envois si le suspect a déjà redemandé ;
- une phrase courte décrivant l’exposition réelle du suspect sans révéler la solution ;
- `Rencontrer · 1 min` ;
- `Refuser` ;
- `Accepter`.

Le texte d’exposition parle toujours du suspect par son nom. Il n’utilise pas « tu », afin d’éviter toute ambiguïté sur la personne décrite.

### 3. Entretien préalable

L’Avocat doit avoir rencontré le suspect avant de pouvoir accepter sa représentation dans l’interface.

- Durée maximale : 60 secondes.
- L’entretien peut être terminé avant la fin du minuteur.
- Une rencontre déjà effectuée reste reconnue pour les nouvelles demandes du même suspect durant la session.

### 4. Refus

`Refuser` ferme uniquement la demande courante.

Tant qu’aucun client n’est verrouillé, le suspect peut immédiatement ou plus tard envoyer une nouvelle demande. Cela élimine le risque qu’un mauvais clic casse la partie.

### 5. Acceptation

`Accepter` est la seule décision irréversible.

L’application demande une deuxième confirmation avant le verrouillage. Une fois confirmé :

- le suspect devient le client officiel ;
- l’Avocat ne peut plus changer de client ;
- le client voit qui le représente ;
- l’Avocat voit le nom et le statut synthétique de son client ;
- les privilèges de représentation concernent uniquement ce client.

### 6. Consultations officieuses

Tous les suspects peuvent toujours parler à l’Avocat ou être reçus en salle d’attente, même lorsqu’ils ne sont pas clients.

Durée recommandée / affichée : 60 secondes maximum par consultation.

Avant le choix d’un client, ces entretiens permettent à l’Avocat de comprendre les positions et de décider qui représenter.

Après le choix d’un client, ils deviennent un outil social : l’Avocat peut recueillir de l’information, conseiller sincèrement, orienter ou bluffer pour protéger les intérêts de son client.

**Limite d’intégrité :** l’Avocat peut mentir en personnage, mais ne peut jamais fabriquer une information présentée comme provenant de l’application, du Juge, du MJ ou des règles.

Le non-client est explicitement averti qu’une consultation officieuse ne crée aucune obligation de loyauté.

## Statut synthétique du suspect

Le résumé affiché à l’Avocat est produit côté serveur à partir de la carte privée du suspect, mais ne transmet jamais cette carte.

Le moteur classe l’exposition dans quelques catégories jouables :

- implication directe dans le fait principal ;
- aide matérielle / logistique ;
- préparation, contrainte ou violence ;
- dissimulation postérieure ;
- inaction / retard d’intervention ;
- intérêt financier ;
- exposition générale si aucune catégorie plus précise n’est sûre.

Exemple pour le dossier 016 :

- organisateur de la violence : exposition forte liée à la préparation / violence, sans attribuer automatiquement le meurtre ;
- exécutant resté avec la victime : exposition très forte liée au fait principal ;
- intermédiaire matériel : exposition liée à l’aide logistique, distincte de la décision de tuer.

Cette formulation donne à l’Avocat une raison concrète de prioriser certains entretiens sans lui donner la solution de l’enquête.

## Interrogatoires et confrontations

Lorsque le client officiel est impliqué dans une phase concernée, l’interface Avocat affiche un bandeau contextuel.

Pour une confrontation, le bandeau indique les deux personnes convoquées et rappelle que l’Avocat assiste uniquement son client officiel.

Pour un interrogatoire, l’Avocat est informé que son client est convoqué et peut se concerter avec lui selon le rythme de la partie.

Le client reçoit également un rappel indiquant qu’une assistance est disponible.

## Conclusions provisoires et défense finale

Au passage vers la fin d’enquête / les conclusions provisoires :

- le client reçoit une notification l’invitant à se concerter avec l’Avocat ;
- l’Avocat reçoit la notification parallèle avec le nom du client ;
- le rappel reste visible dans l’interface pendant la phase pertinente.

Pendant la dernière défense, l’Avocat partage le temps uniquement avec son client officiel.

## Impact sur le gameplay

### Charge mentale

**Avant : élevée et ambiguë.** Plusieurs clients pouvaient créer des loyautés contradictoires et des confrontations impossibles à défendre proprement.

**Après : modérée et lisible.** Une seule décision structurante détermine la loyauté officielle de l’Avocat pour toute la partie.

### Activité en début de partie

L’Avocat n’est plus inactif pendant la lecture : il reçoit les demandes, sélectionne les personnes à rencontrer et mène les entretiens courts.

Il n’est pas obligé de rencontrer toutes les demandes avant de faire son choix. Cela évite qu’un scénario avec beaucoup de suspects transforme le début de partie en série obligatoire de consultations.

### Scénarios avec beaucoup de suspects

Le système ne fixe pas une limite arbitraire à trois demandes. Tous les suspects peuvent demander une représentation.

La protection contre la surcharge se fait autrement :

- une seule demande en attente par suspect ;
- entretiens de 60 secondes maximum ;
- l’Avocat choisit qui rencontrer ;
- le premier client officiellement confirmé verrouille la relation de cet avocat.

Cela garde la règle identique quelle que soit la taille du casting.

### Manipulation sociale

La consultation officieuse donne enfin une raison forte de continuer à jouer le rôle après le choix du client.

Elle augmente néanmoins la puissance sociale de l’Avocat. Deux garde-fous sont donc nécessaires et implémentés :

1. les non-clients savent explicitement que l’Avocat ne leur doit aucune loyauté ;
2. le bluff ne peut jamais falsifier une source système / règle / décision officielle.

### Information cachée

Les descriptions de gravité sont produites côté serveur et renvoyées uniquement par le RPC de l’Avocat. Les cartes privées complètes ne sont pas ajoutées à l’état public de la salle.

### Erreurs de manipulation

Le système traite asymétriquement les deux boutons :

- refus = réversible ;
- acceptation = confirmation supplémentaire + verrouillage.

C’est volontaire : une erreur de refus coûte au maximum une nouvelle demande, alors qu’un choix de client doit être sûr.

## Compatibilité avec les scénarios existants

Le dossier 016 contient un Avocat optionnel et trois suspects : le nouveau système remplace directement l’ancienne attribution de clients.

Le dossier 019 conserve l’Avocat obligatoire, mais celui-ci choisit désormais son client au lieu d’avoir plusieurs clients automatiques.

Le dossier 020 possède historiquement une variante de très grand casting pouvant contenir un deuxième Avocat. v43 reste techniquement compatible : **chaque Avocat ne peut avoir qu’un seul client officiel et un même suspect ne peut pas être représenté par deux Avocats**. Ce comportement évite de casser le roster historique tout en appliquant la règle de loyauté unique à chaque Avocat.

## Points à surveiller en playtest

- Temps réel ajouté pendant la lecture des cartes lorsque 4+ suspects demandent simultanément l’Avocat.
- Tendance éventuelle des suspects à interpréter une demande d’Avocat comme un aveu implicite.
- Puissance du bluff de l’Avocat auprès des non-clients.
- Fréquence réelle des nouvelles demandes après un refus.
- Lisibilité du résumé d’exposition : il doit aider à prioriser sans révéler la vérité.
- Utilité de l’Avocat lorsque son client est peu interrogé.
- Moment exact du rappel de concertation avant les conclusions provisoires.

## Critères de validation v43

1. Un suspect peut demander un Avocat pendant la lecture des cartes.
2. Deux clics rapides ne créent pas deux demandes simultanées.
3. Un refus permet une nouvelle demande.
4. L’Avocat ne peut pas accepter avant d’avoir rencontré le suspect dans l’interface.
5. L’acceptation demande une confirmation supplémentaire.
6. Un Avocat ayant un client ne peut pas en accepter un second.
7. Un suspect représenté ne peut pas être accepté par un second Avocat.
8. Le statut du client ne contient pas la vérité complète de sa carte.
9. Les consultations officieuses restent accessibles après le choix du client.
10. Les règles autorisent le bluff social mais interdisent la falsification d’une source système.
11. Une confrontation impliquant le client nomme clairement les personnes concernées.
12. Le client et l’Avocat reçoivent un rappel avant les conclusions provisoires.
13. L’ancienne mention « plusieurs clients » n’apparaît plus dans l’interface principale de l’Avocat.
14. Les versions web et mobile chargent le runtime v43 après les couches v41/v42.
