# Dossier 004 — Fiches courtes · v642

Standard permanent : `docs/standard-fiches-personnages.md`.

- Trois variantes A/B/C, trois fiches privées par variante.
- Chaque fiche comporte 120 à 160 mots, fonction comprise, hors relations, et exactement trois faits chronologiques.
- Sections : fonction, histoire, journée, connaissances, ignorances, secrets, objectif et relations.
- Les textes privés sont conservés seulement dans le manuscrit privé Supabase, sous `v242_short_cards`.
- L'enrichissement serveur `igr_private.igr_v242_enrich_004_short_cards` applique ces données à l'affichage en conservant les autres règles de jeu.
- Les objectifs correspondent au degré exact de responsabilité du verdict existant (0, 1 ou 2).
- L'interface utilise le nouveau format uniquement si le serveur fournit le champ `story`; anciennes parties préservées.
- Audit technique et de verdict Supabase du 31 octobre 2026 réussi. Essai humain multijoueur et vérification de Cloudflare encore à réaliser.
