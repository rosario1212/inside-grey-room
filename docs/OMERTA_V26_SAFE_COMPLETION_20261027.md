# OMERTÀ V26 — compte-rendu de prépublication sécurisée

Date : 27 octobre 2026. **Statut : branche de prépublication, non publiée.**

## Livraisons vérifiées
- Archive narrative **privée** : quinze manuscrits Santoro (021–025, A/B/C), 105 cartes de rôle, 105 chronologies contextualisées, 105 notes de rétention d'information, 315 amorces de conversation. Jamais placée dans ce dépôt.
- État des manuscrits : `review`, **0/15 approuvé**, sources des C3 non revues humainement. Les informations nécessaires à une partie certifiée ne doivent pas être fabriquées.
- Calculateur PostgreSQL de but privé : migration `omerta_standalone_private_goal_scorer_v26` appliquée dans la base Supabase ; aucun droit d'exécution pour les rôles clients.
- Règle de l'Indic final : un avis positif authentifié de l'Enquêteur peut satisfaire la seconde condition même avec **0/3 notifications de cartes** ; protection ou réduction officielle >=3 ans et survie restent indépendantes.
- Nouvelle procédure de ratification signée, interface « Évaluer mon Indic », et test de verdict oral sans carte : contenus dans cette PR ; **non déployés** à la date de ce rapport.

## CI / sécurité
- Simulations front-end : apparition du contrôle exclusivement au débriefing C3, bonne transmission de l'avis et des années de réduction.
- PostgreSQL éphémère : jeton d'Enquêteur requis, source recrutée au même match, saisie unique, aucun avis public avant le verdict, impossibilité d'une évaluation avant le C3, pas de transmission entre matchs.
- Les tests historiques Omertà, du moteur de variante Santoro en isolation, et des autres scénarios restent en place.
- Le démarrage Santoro en production demeure fermé : `igr_omerta_standalone_release_control.enabled=false`, 0/15 manuscrits importés.

## Déploiement conditionnel
1. Appliquer `20261027214500_omerta_indic_final_assessment_v26.sql` à Supabase.
2. Appliquer `20261027214600_omerta_indic_investigator_scoring_v26.sql` après la précédente.
3. Vérifier les privilèges RPC, la compatibilité de l'ancien verdict et les avis par match.
4. Confirmer la CI complète, puis fusionner la PR et vérifier la version Cloudflare du même SHA.
5. Pour **Santoro autonome**, ne pas activer la sortie sans import des manuscrits confidentiels, revue humaine, raccordement du procès-verbal de désignation, scellage du RPC de synchronisation et essai 4–8 joueurs sur la stack réelle.

**Limitation rencontrée** : l'installation automatique des deux nouvelles migrations Supabase de ratification a été refusée par les contrôles de sécurité du connecteur. Les conserver hors production est requis ; ne pas interpréter la CI verte comme une preuve de publication.
