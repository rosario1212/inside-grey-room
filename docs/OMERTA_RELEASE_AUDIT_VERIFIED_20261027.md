# OMERTÀ — contrôles prépublication vérifiés le 27 octobre 2026

## Décision opérationnelle

**Publication intégrale 021–025 A/B/C : BLOQUÉE.** La validation du propriétaire autorise à préparer la publication, mais elle ne remplace pas la certification de provenance des preuves, l'épreuve des règles de victoire et les tests des migrations.

## Vérifications exécutées sur les systèmes connectés

- GitHub PR #379, branche `feature/omerta-indic-final-evaluation-20261026`, SHA initial de référence `95f455a47b88b8fd2ca6a07c75b79283e36b6983`.
- GitHub Actions sur ce SHA : Omerta Informant QA, Cloudflare Build Check, Store Readiness, iOS Build Check et Android Build Check **success**. Ce sont des contrôles de build/statique, pas de vrais tests multijoueurs du serveur.
- Base Supabase **Inside Grey Room**, projet `jtasbdiguhiswoyvobkn`, interrogée en lecture seule. Il y a 1 salle OMERTÀ en lobby, aucune salle OMERTÀ en cours de partie au contrôle.
- Les fonctions RPC de la nouvelle mécanique Indic (offre, réponse, options, consignation, protection) **ne sont pas déployées en production**.
- La consultation de `igr_private.igr_v100_preflight` pour les épisodes 021, 022, 023, 024, 025 retourne pour chacun : `stored=3`, `approved=0`, `distinct_canonical_truths=3`, `cycle_three_guarantees=3`, `verified_cycle_three_guarantees=0`, `release_eligible=false`. Le verrou fonctionne correctement.
- Les packs historiques en production ont respectivement 7, 7, 7, 8, 9 personnages. Ils restent distincts de la nouvelle saga Santoro A/B/C.
- Le SQL de la PR #379 n'attribue `truth_verified=true` qu'à une liste fermée de cartes du **021**. Pour 022–025, la coopération enregistrée ne peut pas valider la condition 2 : **victoire de l'Indic impossible avec les nouvelles règles** tant que ce point n'est pas résolu.
- L'ancienne RPC `igr_omerta_action` autorise encore une révélation abstraite par niveau ; sa coopération déclarative et la nouvelle coopération vérifiée doivent être réconciliées avant activation.

## Gardes obligatoires avant déploiement du nouveau moteur

1. Audit humain de chaque manuscrit A/B/C et de la provenance réelle de chacune des 15 révélations garanties au cycle 3 ; ne pas falsifier les champs `editorial_status` ou `human_source_review`.
2. Intégration de la variante épinglée à la campagne et à tous les lecteurs serveur de fiche privée, événements, verdict et reprises, sans exposer les secrets.
3. Au moins une information authentifiée et **éligible** pour tout suspect que le système autorise à convertir en Indic, par dossier et variante ; sinon refuser le pacte côté serveur avant acceptation.
4. Protection/atténuation de peine distincte de la coopération, sans validation subjective unilatérale de l'objectif d'autrui ; suppression des raccourcis par « révélation » auto-déclarée pour le rôle recruté.
5. Tests des migrations sur une base de développement isolée, vérifications de droits RPC, confidentialité et de doubles actions ; simulation sur tous les rôles, cycles, reconnexions et rematches.
6. Analyse de compatibilité des salles en lobby et de la campagne historique avant changement de canon ; tests web, Android et iOS, puis vérification post-déploiement de Cloudflare.
7. Déploiement serveur **avant** l'exposition client et possibilité de rollback vérifiée.

## Coût du banc de test

Supabase réclame un consentement spécifique avant de créer une branche de test ; estimation retournée par l'outil de coût : **0,01344 par heure** (devise non précisée dans la réponse de l'outil). Une simple autorisation générique de publication ne constitue pas une confirmation spécifique du montant.

Aucune branche payante, aucune migration de production et aucun déploiement Cloudflare n'ont été exécutés pendant cet audit.

## Recommandation de publication

Conserver la PR #379 en brouillon et **ne pas fusionner** tant que les critères 1–7 ne sont pas réellement satisfaits. Une suite CI verte ne transforme pas des manuscrits en variantes certifiées et ne rend pas atteignable un objectif de victoire impossible.
