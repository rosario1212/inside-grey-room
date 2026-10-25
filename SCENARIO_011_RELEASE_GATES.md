# Dossier 011 — 36 HEURES | Portail de publication

> **Mise à jour du 25 octobre 2026 — extension facultative à six joueurs.** La configuration précédente (Enquêteur, Analyste et trois Suspects) reste obligatoire à cinq. À six joueurs, un **Procureur** rejoint la partie sans modifier les trois variantes A/B/C ni leurs solutions. Le rôle supplémentaire dispose d'une fiche spécifique et n'a pas accès aux investigations réservées à l'Enquêteur et à l'Analyste. Contrôle Supabase : salon de six joueurs, six fiches privées et snapshot de variante vérifiés par transaction annulée. Aucun playtest humain n'a encore été certifié. Les formulations historiques ci-dessous décrivent l'état antérieur à cette extension.


## Situation au 24 octobre 2026
Refonte éditoriale privée créée dans Supabase, **non publiée**. Les trois manuscrits privés (A/B/C) conservent leurs responsabilités différentes, avec un nouveau cycle complet de preuves. Le scénario public historique reste distinct de ces manuscrits.

## Intégration acquise
- Fonction privée `igr_private.igr_v370_011_build_pack(text)` installée et protégée.
- Table privée `igr_private.igr_v371_011_room_snapshots`, fonction d'éligibilité et sélection aléatoire prévues, mais **non raccordées au moteur de jeu**.
- Trois preuves garanties par variante : une par cycle, sources fictives désignées ; neuf investigations facultatives (3/cycle), IDs uniques ; trois champs de reconstitution `order`, `field`, `halt`.
- Rôles : Enquêteur, Analyste, trois Suspects à cinq joueurs. Consignes publiques des trois rôles contextualisées, sans divulguer les manuscrits.
- Tests réels en base : 60/60 constructions valides ; A/B/C présentes ; trois conclusions distinctes ; aucun identifiant facultatif doublonné ; 3/3 preuves garanties ; aucune session de test laissée. Les preuves ont désormais une chronologie H+00 à H+36, propre à chaque variante.
- Contrôle de sécurité : exécution privée refusée aux rôles `anon` et `authenticated`.

## Verrous encore ouverts
- La fonction de construction n'est pas intégrée à l'attribution de variantes et à l'initialisation des salons 011.
- Les cartes, la synchronisation, les preuves de chaque cycle et la révélation doivent lire le même instantané privé de salon.
- La RPC d'investigation 011 doit être réservée à l'Enquêteur/Analyste, avec jeton vérifié et quota collectif de 1/cycle.
- Le formulaire de reconstitution `order/field/halt` doit être présenté, validé côté serveur et corrigé uniquement à la révélation.
- Les contrôles en transaction ont lancé 24 salons de cinq joueurs (3 suspects, 1 Enquêteur, 1 Analyste), avec tirages A/B/C et absence de fuite des vérités avant révélation. Une partie simulée a parcouru les trois cycles : trois trames, investigations, refus du doublon collectif, accès suspect interdit, final exact et révélation validés. Aucune de ces sessions ne persiste après ROLLBACK.
- Il reste un test humain sur plusieurs appareils et un déploiement en production, à ne réaliser qu'après autorisation de publication.
- Aucune partie humaine n'a été conduite. Les sources fictionnelles requièrent une validation éditoriale.

## Interdiction de publication anticipée
Au dernier contrôle : `igr_v371_011_release_status()` indique `eligible=false`, `approved=0`, `private_secure=true`, `valid_distinct=3`. Ne **pas** modifier cet état à la main ni déclarer le dossier prêt tant que le moteur n'est pas raccordé, que les CI et tests ne sont pas verts, et que l'autorisation du propriétaire n'a pas été enregistrée. Ne jamais mettre les solutions privées dans GitHub ou le bundle Cloudflare.
