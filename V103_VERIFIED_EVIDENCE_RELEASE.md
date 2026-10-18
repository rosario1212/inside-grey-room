# v103 — Recoupements vérifiables avant l’activation

Le dépôt GitHub est **public** : aucun texte de preuve, secret de suspect, manuscrit ou dénouement n'y est enregistré.

## Travail éditorial privé (hors dépôt)

- 18 recoupements garantis nouveaux, pour 001–006 en A/B/C, écrits à partir des chronologies déjà rédigées.
- Transférés dans les 18 manuscrits correspondants de `igr_private.igr_v99_variant_manuscripts` et conservés au statut **review**.
- 63 variantes sur 147 ont maintenant un indice garanti au cycle III. Les 84 autres en ont toujours besoin.
- Les 18 nouvelles preuves portent `editorial_provenance.human_source_review=pending`, sans aucune approbation artificielle. Vérifier la source matérielle ou testimoniale, la crédibilité et l’équité avant validation.

## Sécurité de publication

La fonction privée `igr_private.igr_v100_preflight` vérifie désormais que chacun des trois scénarios :
1. est individuellement prêt et approuvé par l'auteur ;
2. possède un canon distinct des deux autres ;
3. a un recoupement final **dont la provenance est explicitement vérifiée** et ne dépend pas d’une action facultative ;
4. respecte le verrou de branche et de chapitre pour OMERTÀ.

L’ancienne fonction reste interne et continue à servir au verrou dormant OMERTÀ. Ses droits d'exécution ne sont accordés ni à `anon` ni à `authenticated`.

## Vérification Supabase

- 144 manuscrits en base, trois (028-A/B/C) toujours bloqués lors du transfert.
- 0 prêts, 0 sélections en cours, 0 variantes rendues jouables.
- 63 recoupements finaux présents, 0 provenance humaine validée.
- Le test `release_eligible` retourne `false` sur les cas vérifiés.
- Aucune modification des RPC de partie ni des packs actuellement servis au client.

## Étapes suivantes

Finir les 84 recoupements restants, relire l'équité des 147 variantes, respecter le blocage de transfert du scénario 028, corriger les vérités exposées dans les ressources web MAÎTRE, puis faire utiliser un seul pack privé figé par toutes les fonctions publiques du jeu. Tests multirôles et reconnexions indispensables avant activation.
