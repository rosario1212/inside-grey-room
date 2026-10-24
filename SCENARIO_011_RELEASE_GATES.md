# Dossier 011 — 36 HEURES | Portail de publication

## Situation au 24 octobre 2026
Refonte éditoriale privée créée dans Supabase, **non publiée**. Les trois manuscrits privés (A/B/C) conservent leurs responsabilités différentes, avec un nouveau cycle complet de preuves. Le scénario public historique reste distinct de ces manuscrits.

## Intégration acquise
- Fonction privée `igr_private.igr_v370_011_build_pack(text)` installée et protégée.
- Table privée `igr_private.igr_v371_011_room_snapshots`, fonction d'éligibilité et sélection aléatoire prévues, mais **non raccordées au moteur de jeu**.
- Trois preuves garanties par variante : une par cycle, sources fictives désignées ; neuf investigations facultatives (3/cycle), IDs uniques ; trois champs de reconstitution `order`, `field`, `halt`.
- Rôles : Enquêteur, Analyste, trois Suspects à cinq joueurs. Consignes publiques des trois rôles contextualisées, sans divulguer les manuscrits.
- Tests réels en base : 60/60 constructions valides ; A/B/C présentes ; trois conclusions distinctes ; aucun identifiant facultatif doublonné ; 3/3 preuves garanties ; aucune session de test laissée.
- Contrôle de sécurité : exécution privée refusée aux rôles `anon` et `authenticated`.

## Verrous encore ouverts
- La fonction de construction n'est pas intégrée à l'attribution de variantes et à l'initialisation des salons 011.
- Les cartes, la synchronisation, les preuves de chaque cycle et la révélation doivent lire le même instantané privé de salon.
- La RPC d'investigation 011 doit être réservée à l'Enquêteur/Analyste, avec jeton vérifié et quota collectif de 1/cycle.
- Le formulaire de reconstitution `order/field/halt` doit être présenté, validé côté serveur et corrigé uniquement à la révélation.
- Les tests réels de salons, reconnectivité, droits, phases, régression 001–010 et déploiement Cloudflare restent à effectuer.
- Aucune partie humaine n'a été conduite. Les sources fictionnelles requièrent une validation éditoriale.

## Interdiction de publication anticipée
Au dernier contrôle : `igr_v371_011_release_status()` indique `eligible=false`, `approved=0`, `private_secure=true`, `valid_distinct=3`. Ne **pas** modifier cet état à la main ni déclarer le dossier prêt tant que le moteur n'est pas raccordé, que les CI et tests ne sont pas verts, et que l'autorisation du propriétaire n'a pas été enregistrée. Ne jamais mettre les solutions privées dans GitHub ou le bundle Cloudflare.
