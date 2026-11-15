# Inside Grey Room — règlement des rôles v696

**Référence joueur :** onglet « Règles » / « Rules » de l'application, alimenté par \`self-guided-rules-v51.js\`. Ce document explique les changements v696 ; les pouvoirs du serveur, de l'Officier v694 et les variantes Terreur v695 restent prioritaires.

## Rôles
- Enquêteur : convoque et dirige les interrogatoires, coordonne les priorités, conserve sa propre lecture finale.
- Analyste : participe au camp Enquête ; **une note publique de recoupement par cycle**, 20–220 caractères ; ce n'est pas une preuve.
- Suspect : présente sa version, peut user de la minute privée avec l'Avocat selon ses droits, défend son cas en audience finale.
- Avocat : **un seul client officiel** ; échanges ordinaires libres ; présence auprès de son client dans les procédures pertinentes.
- Procureur : négocie des coopérations et conclut sans imposer le verdict au Juge.
- Juge : **trois points de protection** au total, certaines pièces coûtent 2 ; rend la décision qui fait autorité quand il est présent.
- Journaliste : suit ses pistes et peut publier **3 Breaking News par cycle et 6 par partie** selon les règles de diffusion ; une publication n'est pas une preuve.
- Inspecteur : **trois lieux distincts au maximum par cycle**, avec partage de ses résultats ; ne commande pas l'armée.
- Expert : **une analyse par cycle et une contre-expertise par partie** ; ne peut pas transformer une trace en culpabilité automatique.
- Témoin : **une seule initiative par cycle** : demande d'audition **ou** déclaration personnelle (20–220 caractères), non corroborée ; la demande ne force pas une convocation.
- Espion : statut caché superposé à un rôle public, objectifs spécifiques à la variante et aux DLC ; non divulgué dans les règles publiques.

## Terreur 026–028 : six joueurs, six rôles
Les trois dossiers sont désormais réservés à **6 joueurs exactement** : Enquêteur, Analyste, Officier et trois Suspects. Aucun Inspecteur, Expert ou Procureur jouable n'y est attribué. Les résultats de terrain et renseignements prévus dans les variantes restent des éléments d'enquête; en l'absence de Procureur et de Juge, la conclusion de l'Enquêteur fait autorité.

## Terreur 026–028 : Officier (nom affiché)
Le rôle public technique reste \`officier_liaison\` ; dans l'interface, son titre est **Officier**, et non Inspecteur ni Officier de liaison.
- **3 décisions militaires par cycle, 9 maximum** sur la partie, en trois séquences : institutions/archives/évacuations ; réserves/secteur/secours ; tenir/protéger/reconquérir.
- Les ordres apparaissent à des moments variables, avec **60, 90 ou 120 secondes** pour répondre. Le serveur suspend le décompte pendant interrogatoires et confrontations. Les décisions non prises déclenchent un ordre de sécurité automatique, qui ne vaut pas décision personnelle.
- Chaque ordre produit des conséquences immédiatement publiées sur les secteurs, la pression ou les services civils ; une reconquête mal étayée peut aggraver la situation.
- L'Officier peut rejoindre **un interrogatoire par cycle**, toujours avec un suspect différent, et **une confrontation indépendante aux cycles 2 et 3**.
- Le sort de la capitale et la précision du verdict judiciaire sont deux axes distincts. Aucune action de l'Officier ne réécrit les preuves ou les variantes secrètes A/B/C.

## Protection contre les abus
Aucun joueur ne peut attribuer à l'application des preuves, déclarations ou pouvoirs inexistants. Les initiatives publiques sont toujours étiquetées non vérifiées. La nouvelle v696 interdit aussi le démarrage des alertes pendant le briefing, la lecture des cartes et l'Assemblée, et interdit les initiatives une fois les phases finales ouvertes.

## Publication
Le règlement est affiché en **français et anglais**, y compris les descriptions des rôles, les onglets et les nouveaux panneaux d'initiatives. Le build Web/PWA et la version mobile vérifient le rendu dans les deux langues. La distribution PWA emploie une nouvelle URL versionnée v696, en conservant le cache de publication certifié, afin d'éviter de servir l'ancien règlement.

**Validation :** vérifications statiques et tests de transactions; un playtest humain multijoueur reste nécessaire pour certifier l'équilibrage et la lisibilité sous stress.
