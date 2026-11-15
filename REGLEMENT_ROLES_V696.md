# Inside Grey Room — règlement des rôles · référence v712

**Référence joueur :** onglet « Règles » / « Rules » de l'application, alimenté par \`self-guided-rules-v51.js\`. Ce document consolide les règles actuelles du tribunal et de la majorité, sans remplacer les règles particulières des DLC et scénarios.

## Rôles
- Enquêteur : convoque et dirige les interrogatoires, coordonne les priorités, conserve sa propre lecture finale.
- Analyste : participe au camp Enquête ; **une note publique de recoupement par cycle**, 20–220 caractères ; ce n'est pas une preuve.
- Suspect : présente sa version, peut user de la minute privée avec l'Avocat selon ses droits, défend son cas à l'audience sans Juge ou au tribunal avec Juge.
- Avocat : **un seul client officiel** ; échanges ordinaires libres ; présence auprès de son client dans les procédures pertinentes.
- Procureur : porte l'accusation lorsque le tribunal est ouvert, conduit ses réquisitions et négocie des coopérations autorisées ; **son vote final vaut une voix**, comme les autres, sans pouvoir de veto.
- Juge : **trois points de protection** au total, certaines pièces coûtent 2 ; préside les débats, protège le droit de parole des suspects et clôt la séance. **Il ne détermine jamais seul la responsabilité officielle.**
- Journaliste : suit ses pistes et peut publier **3 Breaking News par cycle et 6 par partie** selon les règles de diffusion ; une publication n'est pas une preuve.
- Inspecteur : **trois lieux distincts au maximum par cycle**, avec partage de ses résultats ; ne commande pas l'armée.
- Expert : **une analyse par cycle et une contre-expertise par partie** ; ne peut pas transformer une trace en culpabilité automatique.
- Témoin : **une seule initiative par cycle** : demande d'audition **ou** déclaration personnelle (20–220 caractères), non corroborée ; la demande ne force pas une convocation.
- Espion : statut caché superposé à un rôle public, objectifs spécifiques à la variante et aux DLC ; non divulgué dans les règles publiques.

## Terreur 026–028 : six joueurs, six rôles
Les trois dossiers sont désormais réservés à **6 joueurs exactement** : Enquêteur, Analyste, Officier et trois Suspects. Aucun Inspecteur, Expert ou Procureur jouable n'y est attribué. Les résultats de terrain et renseignements prévus dans les variantes restent des éléments d'enquête; sans Procureur ni Juge, **l'Enquêteur et l'Analyste votent chacun** ; sans accord majoritaire, la responsabilité reste indéterminée. L'Officier ne vote pas sur les responsabilités.

## Terreur 026–028 : Officier (nom affiché)
Le rôle public technique reste \`officier_liaison\` ; dans l'interface, son titre est **Officier**, et non Inspecteur ni Officier de liaison.
- **3 décisions militaires par cycle, 9 maximum** sur la partie, en trois séquences : institutions/archives/évacuations ; réserves/secteur/secours ; tenir/protéger/reconquérir.
- Les ordres apparaissent à des moments variables, avec **60, 90 ou 120 secondes** pour répondre. Le serveur suspend le décompte pendant interrogatoires et confrontations. Les décisions non prises déclenchent un ordre de sécurité automatique, qui ne vaut pas décision personnelle.
- Chaque ordre produit des conséquences immédiatement publiées sur les secteurs, la pression ou les services civils ; une reconquête mal étayée peut aggraver la situation.
- L'Officier peut rejoindre **un interrogatoire par cycle**, toujours avec un suspect différent, et **une confrontation indépendante aux cycles 2 et 3**.
- Le sort de la capitale et la précision du verdict judiciaire sont deux axes distincts. Aucune action de l'Officier ne réécrit les preuves ou les variantes secrètes A/B/C.

## Finale : avec et sans Juge

**Avec Juge :** le tribunal unique démarre dès la fin du cycle 3, sans Audience préalable. Un **plan de salle facultatif** propose la présidence, l'accusation, la défense et les témoins/observateurs présents. Les joueurs restent dans la même pièce, libres de leur place. La séance n'a **aucun chronomètre** : installation → accusations → débats et confrontations libres → conclusions et dernier mot → vote secret. Le Juge dispose de six points de contrôle **facultatifs** ; les coches ne révèlent aucune alliance et ne constituent pas des preuves.

Les suspects présents confirment eux-mêmes avoir eu l'occasion de se défendre et d'exprimer leur dernier mot, ou d'y renoncer. Le Juge ne peut clôturer avant ces confirmations ; une absence avérée peut être signalée par l'hôte avec justification, sans déclaration ni vote inventés.

**Sans Juge :** l'Audience est **chronométrée** (COURT 1 minute / LONG 2 minutes par rôle présent, avec possibilité de passer), puis chaque suspect dispose de **2 minutes en COURT / 3 minutes en LONG** pour se défendre ou passer ; son avocat officiel partage ce temps. Ensuite les rôles habilités votent individuellement dans l'application.

**Majorité collective :** chaque rôle habilité du **camp Enquête** dispose d'**une voix secrète égale** sur chacun des suspects : **0** aucune responsabilité, **1** secondaire, **2** principale. Une responsabilité n'est officielle que si une valeur obtient **plus de 50 %** des voix valablement exprimées. **Aucune majorité = indéterminé**, non compté comme exact pour la victoire collective. Ni Juge ni Procureur n'a de veto. Les objectifs personnels des rôles corrompus ne sont réussis que si leur manipulation modifie effectivement la décision collective. Les scénarios à finale particulière (dont 029, Omertà et Cartel 031) conservent leurs exceptions.

**Activité estimée sur 5 étoiles :** avec Juge, Enquêteur et Juge **5/5**, Procureur, Avocat et Suspect **4/5**, Analyste, Inspecteur et Journaliste **3/5**, Expert et Témoin **2/5**. L'Officier de TERREUR est **5/5**. Sans Juge, Procureur et Avocat sont **3/5**. Ces étoiles mesurent l'activité probable, jamais la puissance ou la difficulté.

## Protection contre les abus
Aucun joueur ne peut attribuer à l'application des preuves, déclarations ou pouvoirs inexistants. Les initiatives publiques sont toujours étiquetées non vérifiées. Les garde-fous antérieurs interdisent aussi le démarrage des alertes pendant le briefing, la lecture des cartes et l'Assemblée, et interdit les initiatives une fois les phases finales ouvertes.

## Publication
Le règlement est affiché en **français et anglais**, y compris les descriptions des rôles, les onglets et les nouveaux panneaux d'initiatives. Le build Web/PWA et la version mobile vérifient le rendu dans les deux langues. La version v712 consolide les règles FR/EN et propose des écrans de tribunal à structure visuelle. Les anciens contrôles de synchronisation et de cache du jeu restent en place.

**Validation :** vérifications statiques et tests de transactions; un playtest humain multijoueur reste nécessaire pour certifier l'équilibrage et la lisibilité sous stress.
