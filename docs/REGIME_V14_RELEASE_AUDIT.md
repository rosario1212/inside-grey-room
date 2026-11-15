# LE RÉGIME — Audit v14 et décision de publication (15 novembre 2026)

**Statut : candidat de publication, NON fusionné, NON déployé.**
Ce document remplace pour l'état courant les chiffres d'audit v13. Les neuf variantes inédites restent dans la base privée avec `regime_vnext.status=draft`; elles ne remplacent pas les canons actifs.

## Contenu éditorial

- Scénarios **032, 033 et 034** : **A/B/C**, soit **9 variantes privées** réécrites.
- **27 scènes publiques supplémentaires** : trois par variante, progressives C1/C2/C3. Prisons et disparitions de Vahran, atrocités et persécution à Belvane, sous-sols et police politique du palais de Darsen. Ton dur et oppressant sans attribuer automatiquement la culpabilité à partir d'une scène d'horreur. Les portraits et témoignages servent d'ancrage humain, pas de bonus de points.
- **4 actes judiciaires** par variante avec ordonnateur, transmetteur, exécutant, personne informée. Minimum de sources indépendantes par acte; les choix d'investigation ne rendent plus une victoire judiciaire logiquement impossible.
- **5 refuges identifiables** par variante, dont deux refuges de repli. Un mandat doit viser un refuge concret avec deux preuves de sources indépendantes portant sur le même fugitif et la même position.
- **6 joueurs essentiels**, **Procureur facultatif pour 7**. Plus de rôles ajoutés uniquement pour remplir les sièges.
- Deux fugitifs toujours actifs après capture : défense ciblée et possible production d'une pièce authentique, avec éventuelle victoire personnelle partielle sur un acte dont ils ne sont pas l'ordonnateur. La capture elle-même n'est pas annulée.
- Le troisième suspect conserve sa mission variante-spécifique, coopération ou protection; le Juge ne peut pas supprimer les créneaux de défense.
- Tribunal collectif de 14 minutes après une seconde capture en C3; format condensé de 8 minutes autrement; en long : 1 minute d'ouverture, 3 × 2 minutes de défense, **5 minutes de confrontation**, 1 minute de clôture et 1 minute de délibération. Procédure et votes classiques 0–2 préservés sans double audience.

## Tests effectivement réussis — en PostgreSQL réel, mais 100 % transactionnels et annulés

| Groupe | Résultat |
| --- | --- |
| Structure éditoriale privée | **189/189** contrôles |
| Choix d'enquête | **576/576** parcours à potentiel judiciaire ≥3 actes sur 4 |
| Démarrage et casting | **18/18** salons : 9 variantes × 6 et 7 joueurs |
| Cartes privées attribuées | **54/54** fiches suspect |
| Tribunal, mandats, votes | Réussi |
| Démarrage de partie v4 et révélation finale | Réussi |
| Confrontation, objections et décisions du Juge | Réussi |
| Preuves et captures C2/C3 | Réussi |
| Coût des choix de protection | Réussi |
| Défense d'un dirigeant capturé | Réussi |
| Véritable déplacement de refuge et datation des preuves | Réussi |
| Trois droits de parole et possibilité de passer | Réussi |
| Reconnexion : récupération des demandes déjà traitées | Réussi |
| Identifiants secrets par partie et rejet des identifiants A/B/C bruts | Réussi |

Les dix familles de tests SQL sont rejouables à partir de `supabase/tests/igr_regime_v13_*.sql` et `igr_regime_v14_*.sql`, à combiner avec les **huit** modules candidats `supabase/candidates/igr_regime_v13_*.sql` et `igr_regime_v14_*.sql`. Tous les essais ont été exécutés sous `BEGIN ... ROLLBACK`, **sans laisser de salons ou de tables de production**.

## Correctifs UI et sécurité

- Le client `regime-live-v13.js` doit se déclencher uniquement si le salon serveur porte `regime_v13_active=true`.
- Les IDs de preuves, d'actes et de refuges sont **opaques et différents d'une partie à l'autre**, avec sel privé conservé serveur. Les noms internes A/B/C ne sont pas acceptés par les RPC d'action en mode sécurisé.
- Vérification du rôle et du token joueur avant lecture des cartes privées ou action.
- Actions rejouables par identifiant de requête après perte de réponse réseau; le client conserve l'identifiant pendant une tentative et dans `sessionStorage` jusqu'à confirmation.
- Le décompte du procès est mis à jour indépendamment des textes en cours de saisie; le formulaire conserve sa valeur et le focus lors des changements d'état.
- Un test automatisé statique `scripts/regime-v14-client-integrity.test.mjs` est ajouté au workflow GitHub; **son exécution dans Actions au SHA final reste à confirmer**.

## Blocages réels de publication, sans masquer les limites

1. **PR GitHub #495 est encore `draft` et `mergeable_state=dirty`** (conflits avec `main` au 15 novembre 2026). La résolution doit reprendre uniquement les ajouts du Régime et préserver les corrections récentes des autres DLC.
2. **0/9 manuscrits signés / approuvés** pour publication. Il faut confirmer les variantes, les explications des actes et la justesse des conséquences après relecture éditoriale.
3. **CI du SHA courant non confirmée** sur GitHub Actions; le workflow de vérification existe dans la branche, pas une preuve de succès sur le dernier commit.
4. **Aucun véritable playtest** avec 6/7 joueurs et plusieurs appareils web/iOS/Android, réseau instable, reprises après fermeture de l'application, 0/2–2/2 captures et missions du troisième suspect en durée réelle. Les transactions synthétiques ne couvrent pas l'ergonomie sociale et les blocages humains.
5. **Le client et les migrations ne sont pas déployés.** Vérification de production du 15 novembre 2026 : 9 packs privés en brouillon, 0 approuvés, `igr_private.igr_regime_v13_rooms` inexistant hors test, RPC `public.igr_regime_v13_warrant` inexistant hors test, aucun salon fictif conservé.
6. Avant migration, recalculer le diff des huit fonctions legacy v4/v52 par rapport à `main`, après résolution des conflits. Les instantanés SQL ne doivent pas écraser une correction postérieure.

**Décision d'audit :** les tests fonctionnels et structurels candidat sont satisfaisants; qualité du ressenti, compatibilité appareils, merge et déploiement restent à valider. **Ne pas publier et ne pas allumer le drapeau de release automatiquement.**
