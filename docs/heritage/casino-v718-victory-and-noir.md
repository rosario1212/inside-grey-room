# CASINO v718 — La dernière dette : conditions de victoire et audit de jouabilité

Date : 16 novembre 2026 · HÉRITAGE IV · 3 scénarios, 8 phases, 7–12 participants.

## Direction artistique
Polar criminel hongkongais dur : loyauté sous pression, poker, dettes, expropriations, arrestations, trahisons, décès et pouvoir instable. L'ambiance prend pour référence générale la noirceur et les retournements de *Full Contact* (Ringo Lam, 1992), **sans emprunter ses dialogues, son intrigue ou ses personnages**. Aucun événement violent non joué ne doit être inventé dans les résultats.

La victoire n'est jamais un acquittement moral : gagner une fonction, une succession ou une enquête ne signifie pas survivre, avoir raison sur tout, ni échapper aux conséquences.

## I. Le bureau d'enquête — victoire collective objective

- En fin de scénario 3, phase 2, **Agent, Enquêteur, Analyste** et, lorsqu'ils existent, **Procureur et Juge** signent chacun leur bulletin personnel : « les liens sont établis » ou « dossier insuffisant ».
- La conclusion affirmative doit recevoir **une majorité absolue de tous les sièges du bureau** : 2/3, 3/4 ou 3/5. Un juge ne peut pas décider seul ; un hôte n'a pas de bulletin s'il n'est pas membre du bureau.
- Pour une victoire, le bureau doit avoir localisé la salle, puis inscrit **au moins un lien criminel authentique**, avec deux sources indépendantes du même sujet et de la même infraction.
- Les liens exacts doivent constituer **au moins les deux tiers des relations distinctes inscrites**. Les doublons ne rapportent rien. Une affirmation fausse ou imprécise peut faire échouer un rapport pourtant majoritaire.
- Le serveur compare les identités, la direction du lien et son libellé au canon privé fixé au début de la partie. Le vocabulaire de relations proposé dans l'interface est neutre et n'identifie jamais le bon couple de personnes.
- Si des membres ne répondent pas, la clôture est bloquée jusqu'à la participation de tous ou **trois délais sociaux minimaux** au dernier cycle ; les absents restent des abstentions et personne ne les remplace. Leur absence ne réduit **jamais** le seuil de majorité.
- Une condamnation n'est pas la condition de victoire de l'enquête ; une enquête bien recoupée peut réussir malgré l'acquittement d'un accusé. Une condamnation fondée sur des éléments disponibles ne rend pas automatiquement exact l'ensemble du schéma du bureau.

## II. Yonghe — les quatre fins politiques existantes demeurent
1. **Successeur reconnu** : prétendant encore libre, soutenu indépendamment et contrôlant au moins un territoire ; score départagé par les vrais soutiens, territoires, légitimité, influence, réputation et nomination valable.
2. **Scission crédible** : fondateur et soutien(s) encore actifs, avec ancrage territorial ; succès d'une faction, **pas** prise du pouvoir sur toute la triade.
3. **Dragon maintenu** : personne n'a conquis l'autorité effective ; la place ne revient pas automatiquement au plus riche au poker.
4. **Effondrement** : aucun centre de pouvoir ne tient.

Les accords politiques déjà signés conservent leur effet ; l'assassinat, la détention, la destitution et le transfert de territoire affectent toujours les règles existantes. **Aucune nouvelle règle n'annule le poker ou les choix politiques acquis.**

## III. Les destins personnels
L'objectif narratif privé demeure dans la fiche existante. Le résultat ci-dessous est un **critère ludique automatique**, pas une affirmation que l'intégralité de la psychologie ou de l'objectif secret du personnage a été résolue.

### Casino
- **Victoire du nouveau Dragon** : être personnellement reconnu comme successeur encore libre, sans scission générale.
- **Victoire dissidente** : être fondateur ou soutien actif d'une scission réellement reconnue et rester libre.
- **Victoire du faiseur de roi** : soutenir le nouveau chef, posséder un pacte signé non rompu avec lui, ne pas être soi-même le chef et demeurer libre.
- **Gain partiel** : survivre libre avec un véritable territoire ou un accord encore valable, sans avoir gagné politiquement.
- **Défaite** : aucun levier durable, mort, destitution, détention ou interpellation. Le texte précise le prix effectivement payé.

### Infiltrés (résultat strictement privé)
- **Victoire** : le bureau gagne et le joueur a lui-même transmis un renseignement ensuite vérifié à partir d'une pièce de provenance correspondante.
- **Gain partiel** : renseignement recoupé, mais dossier collectif perdu.
- **Échec** : renseignement non confirmé. Si l'infiltré est détenu ou mort, son dénouement porte cette conséquence, sans prétendre qu'il a été officiellement découvert.
- **Voie de rupture** : l'infiltré peut abandonner sa mission et gagner politiquement comme chef reconnu, dissident actif ou faiseur de roi avec pacte valide. Le jeu annonce **victoire politique, mission d'infiltration non accomplie**. Cette voie ne fait jamais gagner le bureau d'enquête.

### Bureau (mission de rôle + succès collectif)
- **Agent** : localise la salle à partir de cinq déductions exactes ; un raccourci de secours n'est pas présenté comme une prouesse.
- **Enquêteur** : obtient personnellement une demande d'interpellation corroborée, puis exécutée par l'Agent.
- **Analyste** : vérifie un renseignement par pièce ou inscrit une relation correcte.
- **Procureur** : ouvre une audience contradictoire fondée sur la preuve.
- **Juge** : rend une décision cohérente avec les éléments établis, sans condamnation non prouvée. Il n'influence **pas seul** le résultat collectif.

Une mission de rôle accomplie sans succès collectif donne **un gain partiel** ; un dossier collectif gagné sans que la mission du rôle aboutisse donne également **un gain partiel**. Il faut les deux pour une victoire totale.

## IV. Confidentialité et contrôles
- L'autorité de calcul demeure côté serveur, dans `casino/victory.mjs` et `casino/runtime.mjs`.
- Les bulletins individuels du bureau, les réponses des énigmes, le nombre et l'identité des infiltrés, les textes privés et la vérité canonique ne quittent pas le serveur.
- Chaque joueur ne lit que sa condition de victoire et son dénouement personnel ; le résultat collectif après la fin est public.
- Journal transactionnel et idempotence restent inchangés, y compris en cas de double clic ou reprise réseau.
- Le poker et les jetons virtuels ne sont pas convertibles en argent réel.
- Les règles et scénarios validés A/B/C demeurent stockés exclusivement dans la zone privée. Leur accessibilité avait été vérifiée via agrégats, pas par publication de leur contenu.

## V. Validation attendue
- 4–7 personnages au casino, 3–5 membres du bureau, 0–2 infiltrés ; suffrage et abstentions 3/4/5 sièges.
- Test intégral de huit phases avec soutien politique, jeu de poker, schéma exact, bulletins indépendants, conclusion et restitution différenciée de chaque personnage.
- Simuler une accusation fausse, des doublons, une juge seule, un hôte malveillant, un rapport partagé, une absence après délai et un infiltré emprisonné.
- Régression des gains de poker, du classement de 2 598 960 mains, du stockage, de l'arbitrage policier et des interfaces mobiles.

**Limite explicite** : un 10/10 ne peut pas être attesté par CI. Il faudra une partie humaine de 7–12 personnes avec vraies négociations, désaccords et menaces crédibles pour évaluer le rythme et l'équilibre. Les prochaines modifications doivent corriger les constats du test réel, pas gonfler artificiellement les fonctionnalités.
