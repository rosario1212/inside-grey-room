# Dossier 016 — LE DERNIER ÉTAGE
## Direction de jeu et plan de finition (sans divulgâcher les variantes)

### Identité et conflit
La Gray Room reconstitue un enlèvement, des violences enregistrées, puis un décès **dont la cause n'est pas enregistrée par la caméra**. Aucun joueur ne doit confondre :
1. la preuve des violences et de la participation au groupe ;
2. une déclaration sur ce qui s'est passé après la coupure ;
3. une preuve indépendante expliquant le décès ;
4. une intention qu'un personnage pouvait avoir sans en faire une preuve du résultat.

Le but n'est pas seulement de trouver un coupable, mais de **prouver qui savait quoi, qui a décidé quoi et quand une intervention restait possible**. Le caractère choquant doit venir des faits et des contradictions, non d'une humiliation du joueur.

### Trois cycles, sans piste morte

**Cycle 1 : la vidéo.** Les enquêteurs identifient les gestes visibles, les voix, l'ordre des séquences et la coupure. Le Suspect 1 défend le sens du plan initial ; le Suspect 2 explique son comportement au moment de la coupure ; le Suspect 3 justifie sa contribution matérielle. Un indice garanti pose les limites de la caméra. Il ne doit jamais révéler une responsabilité hors champ.

**Cycle 2 : la pièce manquante.** Chaque rôle doit faire face à une contradiction nouvelle sur la période après la coupure. La preuve garantie doit être extérieure à la vidéo (chronologie de déplacements, messages ou témoin recoupé). L'enquête facultative fournit un moyen indépendant de confirmer ou infirmer **une** version, pas une confession automatique. Le responsable d'une action filmée peut ne pas être celui du décès.

**Cycle 3 : la responsabilité.** La troisième pièce garantie porte sur la cause du décès, le moment d'une décision ou la possibilité de secours. Elle doit résoudre une ambiguïté déterminante sans éliminer le besoin de reconstituer les décisions humaines. L'enquêteur et l'analyste peuvent porter des conclusions divergentes ; la révélation doit comparer chaque verdict à la vérité **épinglée au salon**, pas à une solution globale.

### Garanties de rejouabilité
- Les trois variantes ont un socle public identique et des vérités privées distinctes.
- Trois cartes de Suspects complémentaires par variante, chacune avec chronologie, objectif, secret, point de pression et fait recoupable.
- Trois documents garantis, un par cycle, y compris si aucun joueur ne choisit d'enquête facultative.
- Neuf investigations, trois options par cycle, dont **une seule collective** activable par le camp Enquête durant ce cycle.
- Les indices facultatifs peuvent éclairer des contradictions, mais **aucun n'est nécessaire pour que la fin soit résoluble**. Inversement, un simple choix au hasard ne doit pas suffire à établir tous les axes.
- Chaque solution exige une source qui établit l'événement hors champ ET une source qui établit la cause du décès. Une seule déclaration de Suspect ne satisfait pas ces deux exigences.
- Aucun indice, titre, identifiant public, ordre des options ou nombre d'événements ne doit divulguer la variante. La sélection A/B/C est aléatoire, fixée dans un instantané privé, et ne change pas après reconnexion.
- La table de preuves ajoutée à l'Enquêteur/Analyste reste facultative, repliée par défaut, dans la langue courante et locale à leur appareil : aucun transfert au serveur.
- Les rôles de Maître (6), Journaliste (7) et Juge (8) enrichissent les confrontations, sans être indispensables pour résoudre une partie à cinq.
- Le Maître peut se retirer et le Suspect renoncer à sa représentation suivant les règles existantes, sans pénalité réservée aux dossiers CARTEL 030/031.

### Confrontations types, utiles sans dévoiler la solution
- À l'organisateur : « Quel était l'objectif précis de l'opération ? À quel instant as-tu cessé d'en contrôler l'exécution ? »
- À l'exécutant : « Quelle est la dernière chose que tu as vue ? Qu'est-ce qui permettrait de vérifier ce que tu dis après la coupure ? »
- À l'intermédiaire : « Quel matériel as-tu fourni et à qui ? Quand as-tu compris que les circonstances avaient changé ? »
- À tous : « Qu'est-ce que tu sais personnellement, qu'est-ce qu'on t'a raconté, et qu'est-ce que tu déduis ? »

### Risques techniques / conditions de mise en ligne
1. Ne pas activer les variantes tant que les trois manuscrits privés ne possèdent pas **exactement** 3 trames sourcées, 9 enquêtes, 3 fiches privées et une vérité de verdict complète.
2. Vérifier que le compilateur privé renvoie des packs distincts et que les secrets restent dans `igr_private` (pas de contenu canonique dans GitHub ou le navigateur).
3. Vérifier les droits de lecture par rôle ; le Maître, le Journaliste et le Juge ne doivent pas voir les enquêtes ou la vérité privée de l'Enquêteur avant les phases autorisées.
4. Simuler au minimum 5, 6, 7 et 8 joueurs, puis 3 cycles, y compris les cas de départ du Maître, déconnexion/réconnexion et absence d'enquête facultative.
5. Rejeter les verdicts incomplets ou hors des options permises ; tester bonnes/mauvaises réponses séparées de l'Enquêteur et de l'Analyste ; ne jamais attribuer un résultat homicide à un scénario dont les faits ne l'établissent pas.
6. Tester dans des transactions annulées. Vérifier les anciennes versions 001–015. Exiger CI vertes et déploiement Cloudflare sur le SHA exact, **puis** approuver les trois manuscrits.

### État de la réalisation au 25 octobre 2026
- Briefing public neutre : **publié** par PR #361.
- Compatibilité héritée à 5–8 joueurs, rôle de Maître, 3 cycles : **testée**.
- Tableau local privé de preuves (français/anglais) : **implémenté sur branche, non publié**.
- Contenu privé : trois manuscrits canoniques existent ; seulement un des trois possède actuellement le pack d'enquêtes versionné complet.
- Runtime A/B/C privé, approbation et jeu réel en variante : **non vérifiés, donc non publiés**.

**Le présent document définit une cible vérifiable, pas une attestation de fonctionnalité déjà déployée.**
