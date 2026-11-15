# LE RÉGIME — moteur de règles candidat v10 : périmètre et intégration

**État : prototype de logique déterministe, pas une fonctionnalité de production.**

## Code fourni

- `scripts/regime-rules-v10.mjs` : choix de regroupement à double consentement ; requête de mandat avec deux sources indépendantes et piste temporelle ; limite d'une tentative par cible/cycle, déduplication et vérification du rôle ; refus procédural du Juge réexaminable sans veto arbitraire ; actions de fugitifs à avantage **et** coût, une seule par cycle ; objectifs du troisième suspect ; reconstitution de quatre actes, deux victoires distinctes ; durée de tribunal selon la deuxième capture ; dépêche publique confirmée et idempotente.
- `scripts/regime-rules-v10.test.mjs` : **24 tests de logique synthétique**. Leurs réponses sont fictives, aucun manuscrit privé A/B/C n'est utilisé.
- `.github/workflows/regime-candidate-qa.yml` : tests Node 22 en PR, sans script de publication ni secrets.

**Validation disponible :** 24/24 tests exécutés avec succès sur le module recompilé dans un moteur JavaScript. Le workflow GitHub doit encore confirmer l'exécution Node native. Ce résultat n'est ni un test Supabase transactionnel ni un test multijoueur.

## Règles de raccordement impératives

1. **Ne jamais importer `regime-rules-v10.mjs` avec les données privées dans le bundle web.** Ce module contient seulement les règles génériques ; les pistes, preuves et vérités viennent de `igr_private` sur le serveur.
2. Un RPC serveur dérive `actorRole`, `actorId`, `targetId`, `roomCode`, `scenarioId`, `cycle` des **jetons de session**, et jamais de propriétés envoyées et supposées vraies par le navigateur.
3. Les preuves ne peuvent être sélectionnées que parmi celles effectivement publiées par le serveur dans ce salon. `origin`, `corrobates`, `activeTrackId`, `capturedAt` et les réponses judiciaires **sont récupérés de données serveur de confiance**.
4. Une même transaction PostgreSQL **verrouille le salon**, contrôle le quota, exécute la règle, insère la tentative, met à jour la capture, et publie exactement un événement. Un RPC répété avec le même `requestId` doit retourner le résultat stocké, pas recomputer une vérité différente.
5. Le Juge garde l'examen procédural et un délai de contrôle. Après désaccord ou absence, une revue automatique neutre fondée sur les preuves visibles évite qu'il bloque arbitrairement les captures.
6. Les contre-mesures des fugitifs retournent **des commandes déclaratives** (ex. protéger une relation tout en exposant une trace). Le serveur les applique uniquement si elles figurent dans le catalogue scellé de la variante, sans effacer la vérité historique ni toute preuve indispensable.
7. La scène collective du tribunal s'ajoute **avant** le vote v52. L'ancien formulaire v52 de défense ne doit pas être rejoué comme un deuxième procès. Conserver le vote 0/1/2, et vérifier indépendamment les quatre attributions d'actes.
8. Le Journal de Karsane émet une dépêche uniquement après changement d'état vérifié, sans donner une identité, un refuge ou une culpabilité qui ne sont pas encore publics.
9. Toute nouvelle fonction RPC, capacité de Juge, rôle facultatif, salle de tribunal ou durée doit être testée **sur un salon transactionnel de simulation** avant d'être déployée.

## Pourquoi ce n'est pas publiable immédiatement

Le dernier audit des **neuf variantes privées** reste valable : toutes les fiches A/B/C sont en révision et utilisent des personnages antérieurs à la nouvelle refonte. Les choix conditionnels n'ont pas de connexions RPC, le Juge n'est pas obligatoire dans le 032, le 034 demande encore 7 joueurs, et le vrai tribunal synchronisé n'a pas été développé. Aucun des **24 tests synthétiques** ne remplace la rédaction des 9 manuscrits ou un playtest humain.

**Prochaine implémentation mesurable** : 032 A/B/C privés à jour + un salon à 6 joueurs dont les deux fugitifs choisissent l'alliance, un mandat C1 autorisé/refusé, une capture enregistrée, le troisième suspect actif et le tribunal court/long sans rejouer l'audience. Puis étendre à 033/034 et réexécuter tous les contrôles avant fusion.


## Jalon privé du 032 (v11)

Un nouveau candidat par variante existe dans le champ `manuscript.regime_vnext` de la table protégée `igr_private.igr_v99_variant_manuscripts` ; **ce champ n'est pas lu par le runtime actuel**. Les contrôles publics, qui ne contiennent aucune vérité privée, figurent dans :

- `supabase/tests/igr_regime_032_candidate_drafts_qa.sql` (63/63 PASS) ;
- `supabase/tests/igr_regime_032_playability_matrix.sql` (64 choix × 3 variantes, atteignabilité variable des preuves) ;
- `docs/REGIME_032_PRIVATE_CANDIDATES_QA_V11.md` (rapport sans révélations des vérités A/B/C).

Une simulation externe à la partie a confirmé le lien entre risque C1 et indice indépendant pour les 2 fugitifs de chaque variante, dans les deux états d'alliance (12 captures positives, 12 non-captures sans seconde preuve), ainsi que les 3 missions du troisième suspect. **Aucun de ces éléments ne représente une mise en production.**
