# CARTEL 031 — LA DETTE : intégration et audit

La publication est autorisée par la délégation explicite de l’auteur du 22 octobre 2026. Trois variantes A/B/C sont écrites ; leurs manuscrits, solutions, preuves et textes de fin restent dans le schéma privé. Cette autorisation ne constitue pas une revue humaine indépendante.

## Invariants

- Six agents américains tués par dix assaillants, dont les trois chefs jouables ; leur arrestation est imprévue.
- Un même passé lie tous les membres présents du bureau à l’ancien allié. La responsabilité du cartel dans le meurtre de sa famille demeure explicite.
- Les enlèvements sont préparés avant la partie et déclenchés au début du cycle 2. Chaque membre du bureau reçoit une preuve personnelle, privée.
- Les suspects connaissent le massacre et des préparatifs complémentaires ; ils ne connaissent pas les décisions prises pendant leur détention.
- L’avocat de Los Salcedo représente au départ le suspect de rang le plus élevé. Il reste extérieur au bureau, ne vote pas et n’a pas de proche parmi ses otages.
- Le lien temporel avec le dossier précédent ne révèle ni ses suspects ni leur sort.

## Variantes et décisions

Les variantes modifient des faits vérifiables sur l’exécution d’un transfert ou l’origine de l’ordre d’assaut. Elles conservent les mêmes règles et le même passé. Une partie fige un manuscrit unique : les cartes, les preuves, les réponses et le dénouement proviennent du même instantané.

Le dossier distribue 13 pièces en 4/5/4 sur trois cycles. Les informations des suspects aident à comprendre les ordres, les personnes et les mouvements ; les pièces permettent de progresser même si un joueur garde le silence.

Les échanges restent oraux. Une acceptation explicite enregistre la déposition prévue et lie la contrepartie. Le cartel ne connaît pas magiquement les conversations ; les conséquences d’une déposition officielle et d’une sortie sans protection sont annoncées avant l’acceptation.

Seuls les membres du bureau votent, à bulletin secret. Une majorité stricte pour un collègue impose sa remise, sans veto individuel. Les bulletins peuvent changer jusqu’à la clôture ; une égalité ou l’absence de majorité ne désigne personne. Le plan d’intervention reste alors applicable. Aucun bulletin individuel n’est rendu public, y compris à la fin.

## Modes de jeu

Le multijoueur utilise deux RPC authentifiées par le jeton personnel. Le mode local reçoit uniquement le manuscrit choisi après vérification du profil et de la licence. Les cartes, messages, preuves du bureau et votes sont derrière un écran individuel à ouvrir puis masquer. Les décisions finales de chaque membre du bureau sont enregistrées sans en inventer.

Le départ volontaire de l’avocat garde la sanction personnelle définitive et la mort de sa famille prévues par la version 170. Un renvoi par son client ne déclenche pas cette sanction. Une nouvelle manche efface les décisions précédentes et masque leurs révélations.

## Audit technique

- A/B/C : 144 démarrages et nouvelles manches, 72 dénouements, pour 6/7/8 joueurs et les durées courte et longue.
- Contrôles de l’instantané, du calendrier des pièces et preuves privées, des accords engageants, des jetons, des rôles votants, des bulletins secrets et des relances.
- Le contrôle SQL complet est conservé dans `scripts/cartel031-variants-check.sql`. Les trois variantes ont aussi été vérifiées séparément pour limiter la durée de chaque transaction de contrôle ; toutes les parties de test sont annulées.
- Le contrôle JavaScript exerce 24 parcours de décisions et 168 rendus de rôle FR/EN, le rideau de confidentialité local, les accords, la source de l’ordre d’assaut et la sanction de l’avocat.
- La compilation et la vérification du commit servi en production complètent ces contrôles. Ils ne remplacent pas une partie physique entre joueurs.

Les métadonnées publiques `cartel031-release.json` identifient le commit, la version, les effectifs et les variantes sans livrer leur solution.
