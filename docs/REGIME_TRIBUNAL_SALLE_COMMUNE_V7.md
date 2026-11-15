# LE RÉGIME — v7 : LA SALLE DU TRIBUNAL (expérience collective distincte de l'audience v52)

**Statut : contrat d'expérience proposé, NON implémenté et NON déployé.** Ce texte prévaut sur les descriptions de l'audience dans les documents v1–v6 lorsqu'elles contredisent la mise en scène ci-dessous. Ne pas substituer une audience v52 existante avec un simple chronomètre allongé. Intégration runtime, transitions de phase, synchronisation, règles du Juge et tests requis.

## 1. Intention

L'utilisateur veut une **simulation de procès véritablement collective, dans une seule pièce**, et pas trois monologues sur des écrans de conclusion. À la fin de la phase d'enquête, tous les clients entrent simultanément dans le même **salon partagé TRIBUNAL DE KARSANE**, avec représentation spatiale des places, un temps de parole commun, des échanges à la barre, objections, pièces versées au dossier et délibération/vote final. L'ambiance doit être celle d'un tribunal de transition après une dictature, sobre, sombre et crédible (pas de bruitages ou effets gore gratuits).

Cette salle est un environnement de jeu synchronisé : les participants peuvent se trouver physiquement ensemble ou à distance. **Ne pas prétendre fournir de voix/vidéo intégrée** si le moteur n'en dispose pas ; le mode de discussion existant (conversation en personne ou canal déjà supporté) porte les échanges, l'application gère les interventions, les preuves et le temps.

## 2. Disposition de la pièce

- **Tribune du Juge, au fond** : Juge nommé par le pseudonyme de son joueur, marteau/procédure/timer/objection.
- **Banc de l'accusation, à gauche** : Procureur s'il est présent ; sinon Enquêteur qui présente les charges ; Analyste à ses côtés pour déposer les pièces et signaler les contradictions.
- **Banc des mis en cause, à droite** : les deux dirigeants **capturés** et le troisième suspect, chaque siège affichant nom du joueur, fonction, statut ; les fugitifs non capturés sont signalés **ABSENT — EN FUITE** (le joueur observe l'interface mais son personnage ne comparaît pas physiquement).
- **Barre centrale** : siège actif de la personne appelée à répondre ; déplacement de son avatar et mise en avant de ses preuves / temps.
- **Grand dossier des preuves partagé** : on n'affiche que les pièces déjà ouvertes par la partie, classées par quatre décisions criminelles ; le Juge autorise la présentation d'une pièce suivant la procédure, sans créer de faits.
- **Journal de Karsane** : à l'extérieur de la salle. Une une peut être émise **après la clôture** sur la base de l'issue publique, sans révéler des votes privés en cours.

Tous les joueurs doivent voir **la même personne à la barre, la même pièce citée, le même décompte et la même phase**. Côté serveur : état de phase unique `regime_courtroom`, événements versionnés et idempotents pour reconnexion, pas de faux accès à des preuves privées.

## 3. Interactions qui rendent le procès différent d'un formulaire

1. **Appel à la barre** : le Juge sélectionne la personne mise en cause dans la liste autorisée ; les clients affichent le siège actif, le minuteur et les accusations publiées.
2. **Déposition** : le suspect explique sa version et peut sélectionner une pièce déjà publiée pour appuyer sa déclaration ; il a un temps de parole garanti. Le troisième suspect est mis à la barre comme les deux dirigeants.
3. **Contre-interrogatoire** : l'accusation confronte une déclaration précise à une pièce. Le suspect obtient automatiquement un droit de réponse ; un dirigeant capturé peut contredire un autre.
4. **Objection** : un joueur peut demander au Juge de statuer sur une question hors sujet, une pièce non recevable ou une intervention abusive ; les issues possibles sont bornées et **le Juge ne peut pas empêcher arbitrairement le droit minimal de défense**.
5. **Clôture / vote** : l'Enquêteur et l'Analyste rendent leur synthèse de quatre actes, puis le camp d'enquête utilise le **vote de degré de responsabilité du moteur v52 (0/1/2) pour chaque suspect**, selon le contrat existant ; le Juge supervise l'application des règles v52, pas le choix d'un camp ni la vérité historique.
6. **Révélation** : le serveur évalue séparément la victoire tactique (2/2 captures), la reconstitution des quatre décisions criminelles et les objectifs individuels du troisième suspect, sans laisser le Juge inventer un résultat.

**Différence essentielle** : la phase finale comprend un espace collectif et des échanges en tour de parole, pas seulement une nouvelle présentation graphique du formulaire v52.

## 4. Durées dynamiques, en respectant les décisions précédentes

### Deuxième capture enregistrée en C3 → PROCÈS LONG (14 min cible)

| Temps | Scène |
| --- | --- |
| 1 min | Juge ouvre la séance, accuse les réceptionnés, présente les quatre actes en litige |
| 6 min | **2 min garanties par chacun des trois suspects**, appelés à la barre successivement, avec droit de réponse intégré |
| 5 min | Contre-interrogatoire contradictoire : accusation, Analyste, confrontations entre accusés, objections éventuelles |
| 1 min | Réquisitoire final, synthèse des quatre actes et clôture orale par le Juge |
| 1 min | Vote final du camp enquête (0/1/2) et verrouillage des attributions documentées avant révélation |
| **14 min** | **Total cible** |

Les quatre actes et éléments de preuve doivent avoir été saisis **pendant les cycles**, pas entièrement reconstruits dans la dernière minute. Si le vote v52 requiert plus de 1 min dans les tests, prévoir un temps réaliste et ajuster la cible de 14 min.

### Deuxième capture enregistrée en C1 ou C2 → PROCÈS COURT EN SALLE COMMUNE

La scène **TRIBUNAL DE KARSANE existe toujours**, mais plus concise (cible à tester **7–8 min**) car les C2/C3 ont déjà donné l'occasion de longs interrogatoires et confrontations. Appel commun, trois prises de parole d'environ 1 min, une confrontation ciblée, clôture et vote selon le moteur. **Ce n'est jamais un simple écran de vote**, même en version courte.

### Une ou deux cibles toujours en fuite → CHAMBRE DE RECONSTITUTION

Tous les joueurs rejoignent visuellement le même espace, mais les sièges des fugitifs sont **vides / EN FUITE**. Les personnes non capturées **ne participent pas physiquement à l'audience** ; le joueur peut voir la scène en spectateur sans que le personnage absent soit automatiquement entendu. Le Juge et les personnes présentes examinent les actes sur pièces, sans faire comparaître fictivement les absents. Durée courte/standard à calibrer.

## 5. Répartition des droits

- **Juge** : préside, déclenche/appelle les interventions, tranche les objections procédurales selon des options autorisées, assure la clôture et supervise les votes existants. Il **n'attribue pas seul les responsabilités**.
- **Enquêteur** : accuse, pose les questions, mène la confrontation, présente les conclusions et le vote de son camp.
- **Analyste** : dépose les pièces et les rattache aux quatre actes, signale une contradiction documentaire.
- **Procureur (facultatif)** : assure le réquisitoire/contre-interrogatoire s'il est présent ; sinon ces étapes sont prises en charge par l'Enquêteur dans le même temps.
- **Suspect 1 et suspect 2 (capturés)** : parlent dans leur temps garanti, répondent aux questions et accusent ou disculpent un complice avec arguments et pièces ; pas de pouvoir de faire disparaître une preuve.
- **Troisième suspect** : comparaît et joue sa mission **COOPÉRATION** ou **PROTECTION**, avec critères v6 vérifiables. Il ne se réduit pas à un témoin passif.

Le Juge peut **réordonner les questions**, pas inventer une suspension illimitée qui ajoute 15 minutes. Un participant absent/déconnecté ne bloque pas le tribunal ; les garde-fous d'absence du moteur doivent être audités.

## 6. QA indispensable, pour vérifier l'immersion et la fluidité

- Joueurs 6/7/8/9, en local et à distance : chacun rejoint exactement une scène commune et voit la même barre, les mêmes pièces, le même temps.
- Deux capturés C1, C2 ou C3 : processus court vs long ; le juge gère la parole sans confisquer celle d'un accusé ; les objectifs du troisième suspect sont réalisables.
- 1/2 et 0/2 : sièges vides et bonne logique d'absence, sans faux interrogatoire ; les clients des fugitifs assistent sans usurper une présence physique fictive.
- Le vote 0/1/2 doit **réutiliser exactement le contrat v52 vérifié**, et la reconstitution des quatre actes est une composante complémentaire, pas une deuxième copie de l'écran d'audience.
- Idempotence, reconnexion, timer partagé, preuves rendues publiques et ordre des événements ; aucune fuite de variante serveur.
- La scène ne peut être annoncée comme jouable tant qu'elle n'a pas réellement été développée et testée en session synchronisée.
