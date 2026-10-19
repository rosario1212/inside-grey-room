# CARTEL 030 — LA COUR ACHETÉE — Contrat de refonte v164

**Statut : proposition de conception non activée, destinée à revue.**
**Scope : uniquement 030.** Aucune modification des dossiers 029, 031, du moteur, des parties en cours ou des manuscrits privés A/B/C existants.

## Intention validée

La Grey Room instruit des crimes attribués à trois membres **extrêmement violents** de Los Salcedo et découvre qu'**au moins une personne de son propre bureau d'enquête** sert secrètement les intérêts du cartel. Le titre `La Cour achetée` peut survivre en tant que soupçon initial et façade judiciaire ; la véritable affaire porte sur la compromission de la Grey Room.

Questions jouées : quels actes peut-on prouver individuellement contre les trois hommes ; comment une information réservée est-elle sortie de la Grey Room ; quels membres du bureau ont sciemment trahi leur mission ; quelles conclusions résistent à la contamination du dossier ?

Préserver l'univers de Puerto Ceniza (Sinaloa), Los Salcedo et Ismael « Maelo » Salcedo conformément à `docs/cartel-los-salcedo-canon-v1.md`. Ne pas attribuer de nouvelles responsabilités criminelles précises aux membres nommés de la famille sans validation du canon privé. Ne pas résoudre par accident les dossiers 029 ou 031.

## Distribution et expérience

- **7 joueurs obligatoires** : Enquêteur, Analyste, Procureur, Juge et trois hommes de main suspects. Les quatre rôles institutionnels font partie de la Grey Room ; **exactement un** d'entre eux est compromis dans la configuration initiale équilibrée.
- **8 joueurs** : + Maître (avocat), défense et consultation distinctes de l'appartenance au bureau.
- **9 joueurs** : + Journaliste, publications contrôlées et sources identifiées. Ni Maître ni Journaliste ne deviennent automatiquement membres de l'équipe d'enquête.
- Rôle compromis répartissable entre **les quatre rôles institutionnels**, **y compris l'Enquêteur** : ne pas rendre un rôle systématiquement innocent sur les parties répétées. Toute affectation doit être couplée côté serveur à une piste probatoire distincte ; l'absence de piste compatible interdit son tirage.
- Une double compromission dans les configurations à 8–9 n'est **pas activée** par défaut ; elle requerrait des tests d'équilibrage et un contrat complet supplémentaires.

### Les trois suspects — archétypes non interchangeables

1. **Le Lieutenant** : bras droit de terrain très influent, accès au cercle dirigeant, réputation de violence et autorité sur d'autres exécutants. Son rang **ne prouve aucun fait précis** ; il sait négocier et peut disposer d'informations sur la fuite interne sans automatiquement connaître le traître.
2. **L'Exécuteur** : acteur de violences directes, expérience d'enlèvements et de représailles, connaît certaines opérations de première main mais pas nécessairement la chaîne complète des ordres ; il dispose d'une marge d'initiative propre.
3. **Le Traqueur** : repère et poursuit informateurs et personnes suspectées de trahison, utilise violence et intimidation, connaît des détails troublants sur la cellule mais l'origine de chaque information doit être vérifiable.

Leurs cartes doivent comprendre : position vécue, deux tensions jouables avec les autres suspects, éléments réellement connus/ignorés, chronologie, objectif privé, choses à dissimuler, questions qu'ils peuvent lancer. Les relations sont **dirigées**, compatibles mais non symétriques. Ne pas nommer les proches de personnages joueurs. Ni avatar, ni obligation d'échange écrit : l'oral reste le jeu.

## Double objectif de victoire : exactitude, pas simple quantité

### Volet A — trois dossiers d'accusation

- **Court** : >=2 **preuves indépendantes pertinentes** par suspect (six **liens probatoires** minimum).
- **Long** : >=3 preuves indépendantes pertinentes par suspect (neuf liens minimum).
- Lier chaque élément au suspect et à un **acte daté/identifiable** ; `pièce + implication précise + source`.
- Des indices multiples issus de la **même origine non corroborée** ne comptent qu'une fois contre le même fait. Un seul document peut servir plusieurs dossiers *s'il contient des éléments distincts réellement attributifs* ; il n'est jamais compté deux fois contre la même personne.
- Une déclaration brute, une rumeur, un profil psychologique, un lien familial, le rang dans Los Salcedo ou une décision judiciaire favorable ne suffisent pas seuls à incriminer.
- Les preuves peuvent être convaincantes sans prouver les **mêmes faits** dans toutes les variantes ; conserver la nuance d'implication individuelle.
- Pas de nouvelle jauge affichée en permanence ; utiliser les pièces existantes d'`Enquête`, la présentation du `Dossier commun` et l'écran d'accusation final.

### Volet B — corruption du bureau

- **Au moins un rôle de la Grey Room est réellement compromis**, même en mode court.
- Identifier et dénoncer correctement **tous** les compromis effectivement présents ; établir pour chacun **>=2 éléments indépendants, dont >=1 trace objective** imputant un acte de fuite, de dissimulation ou de favoritisme volontaire.
- Une anomalie de consultation ou une erreur de procédure n'est pas en soi une preuve de corruption. Différencier : négligence, contrainte, erreur sincère, intérêt personnel et collusion délibérée.
- L'app n'annonce ni le nombre ni l'identité des traîtres à la cellule honnête pendant la partie.
- Les décisions importantes des rôles institutionnels reçoivent un bref **motif écrit horodaté**. Montrer la succession des décisions, pas un badge `CORROMPU`.
- Les membres honnêtes ont une possibilité réelle de contester/faire contrôler une action suspecte. Un corrompu peut retarder, déformer, masquer temporairement mais jamais détruire l'unique preuve essentielle ni bloquer toutes les voies de confirmation.

### Verdict et équité

La victoire honnête requiert **les deux volets**, dans la limite des faits prouvables de la variante, plus une attribution correcte des responsabilités. Une accusation erronée contre un innocent entraîne une **pénalité proportionnée** et une explication finale, pas une défaite mécanique inconditionnelle sur une seule erreur.

**Important** : l'Enquêteur peut être corrompu, donc il ne doit **jamais** pouvoir seul invalider ou retenir le verdict de tous. Chaque rôle institutionnel dépose au final une lecture individuelle scellée ; la conclusion du camp honnête est établie par un mécanisme prédéfini de décision/recours sans veto solitaire et sans afficher qui est honnête. Ce mécanisme devra être prouvé équilibré par simulation pour 7, 8 et 9 joueurs.

Les suspects peuvent gagner personnellement en diminuant les responsabilités réellement imputées, en défendant une version exacte d'un fait ou en exploitant une accusation insuffisante. Leur culpabilité morale n'est pas une immunité procédurale et ils ne doivent pas tous perdre automatiquement en cas de victoire partielle des honnêtes. Le traître ne gagne pas seulement en empêchant tout jeu : il doit faire des choix risqués et traçables.

## Trois cycles (à implémenter, sans déduire de preuves de la parole)

1. **C1 — Une enquête ordinaire.** Les trois suspects sont présents dès le début et parlent librement. Les joueurs disposent d'un dossier factuel minimal et de premières pièces à examiner ; une décision contestable est explicable sans supposer une trahison.
2. **C2 — L'information impossible.** Une information qui aurait dû demeurer interne semble connue de Los Salcedo. Une piste de provenance objective peut contredire une explication. Faire émerger une menace et une piste de corruption sans dénoncer automatiquement.
3. **C3 — Le bureau sous accusation.** Vérification alternative des sources, contestation des décisions internes, confrontation des biographies et verrouillage des accusations distinctes : crimes des hommes de main / corruption des membres de la Grey Room. Une conclusion révèle les causes, les erreurs et les décisions, sans apporter de nouvelle preuve après la clôture.

**Mode court** : réduire durée, éléments obligatoires et nombre de confrontations, **pas** supprimer les voies de contrôle. **Mode long** : exiger une troisième preuve indépendante par suspect avec au moins une alternative réellement accessible si une piste échoue. Aucun indice critique uniquement conditionnel à un rôle traître et non détectable par les honnêtes.

## Variantes A/B/C — direction éditoriale sans divulgation publique

- **A : contrepartie financière** ; axe = établir les liens réels entre avantages reçus, décision interne et violences des trois suspects.
- **B : pression et contrainte** ; axe = retrouver qui a été menacé, qui a agi, quel dommage en a résulté ; l'explication humaine ne transforme pas l'acte en innocence automatique.
- **C : réputation et pouvoir interne** ; axe = distinguer dissimulation destinée à sauver l'institution et collusion criminelle consciente.

Ces titres sont des **directions de conception**, pas une résolution. Les auteurs, actes imputables, chronologies, fichiers de preuves, identités compromises et révélations sont **strictement privés**. Pour chaque direction, il faut résoudre une matrice de rôles compromis compatibles et indépendamment vérifiables, sans simple permutation d'étiquettes qui ferait mentir la chronologie. Mettre le canon en serveur privé et le figer **avant** la création des cartes individuelles ; ne jamais calculer/relâcher une variante secrète côté client.

Les manuscrits privés précédents sont historiques et restent en statut `review`. Aucun écrasement, aucune promotion en `approved`, aucun lancement tant que la nouvelle version n'a pas été revue.

## Contrat technique de sécurité et de fluidité

- **Serveur autoritaire** pour scénario, rôle caché, variabilité, objets de preuve, décision, chronologie et verdict ; le client n'a que les données autorisées.
- Une preuve contient au minimum : `evidence_id`, `variant_id`, `cycle_min`, `source_root`, `source_kind`, `fact_id`, `subject_id`, `visibility`, `release_condition`, `can_be_contested`. Les liens accusatoires réels et leur validité restent du côté serveur.
- Séparer **état du dossier commun**, **notes d'enquête** et **cartes privées** ; garder l'interface lisible. Aucune révélation par notifications, logs synchronisés, web socket, déconnexion/reconnexion ou rafraîchissement.
- Une trace de corruption est un **événement scénarisé et autorisé**, jamais l'espionnage de la vraie communication des joueurs, pas de microphone d'analyse ni de collecte réelle de coordonnées.
- Les preuves apparaissent par recoupements, interrogatoires et événements canoniques ; les joueurs doivent interpréter. L'outil ne dit pas « bon suspect » avant le verdict.
- Restauration/reconnexion et synchronisation hôte–iPhone–iPad–ordinateur sans actualisation manuelle ; changement de phase atomique et idempotent.
- Ne jamais exposer dans le dépôt public les manuscrits privés ou la cartographie des véritables traîtres.

## Tests d'acceptation avant activation

1. **3 variantes × 4 possibilités de rôle compromis = 12 familles de cas** testables ; rejeter toute assignation dépourvue de preuves spécifiques.
2. **7/8/9 joueurs × court/long**, rôles présents et permissions conformes (Maître n'est pas un enquêteur, Journaliste ne voit pas le canon).
3. Pour tout suspect et toute configuration : 2 liens indépendants accessibles en court ; 3 en long ; 2 liens distincts contre chaque rôle corrompu dont un objectif. Test de suppression des doublons de `source_root`.
4. Parcours heureux ; investigation totalement erronée ; soupçon injuste ; coupable se tait ; traître tente le sabotage maximal ; indices manqués ; joueur déconnecté à chaque phase ; reprise d'une partie.
5. Pas d'impasse si Enquêteur, Analyste, Procureur ou Juge est compromis ; aucune action monotone gagnante pour le traître.
6. Les variantes secrètes et les relations cachées ne sortent pas dans `sync`, le `Dossier commun`, les notifications, les URLs, les assets ni le profil social.
7. Dossier 029 inchangé, continuité 029→030→031 conditionnée à un état de campagne scellé, sans spoiler ni réécriture rétroactive.
8. Relecture humaine des 3 directions/12 familles, véritables parties complètes multi-appareils, validation éditoriale et activation explicitement autorisée.

## Limite de ce chantier

Ce document **n'est pas une mise en production**. Les règles nouvelles, les cartes, la matrice de preuves, le tirage de traître et les verdicts ne sont pas opérationnels dans le runtime actuel. Ne jamais présenter la signature narrative du 030 comme jouable avant le passage des contrôles ci-dessus.
