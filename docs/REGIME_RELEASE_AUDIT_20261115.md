# LE RÉGIME — Rapport d'audit de publication, 15 novembre 2026

**Verdict de release : REFUS DE PUBLICATION DE LA REFONTE v9.** Les anciens scénarios 032–034 demeurent techniquement présents ; ce rapport porte sur **la nouvelle version double traque + procès**, pas sur leur existence.

## Résultats vérifiés contre le projet Supabase actif

Le test de lecture seule reproductible est dans `supabase/tests/igr_regime_release_readiness_v9.sql`. Exécution effective sur Supabase : **48 assertions, 22 positives, 26 négatives**.

| Blocage ou résultat | Situation actuelle | Priorité |
| --- | --- | --- |
| Variantes A/B/C 032–034 | **9/9 manuscrits présents**, trois cartes privées chacun, mais **0/9 approuvé**, statut `review` et `human_review_approved=false` | **BLOQUANT** |
| Rôles privés selon le nouveau scénario | **0/9 conformes** : anciens personnages, et dans le 034 anciennes appellations (le Notaire / l'Héritier) | **BLOQUANT** |
| Codes du scénario 034 | Anciennes appellations présentes dans les 3 variantes privées ; le canon public de branche prévoit **LA TÊTE / LE SCEAU / LA TOUR** | **BLOQUANT** |
| Actions conditionnelles de manuscrit | Les 9 manuscrits contiennent un drapeau explicite : `trigger_action` non encore relié aux RPC Supabase | **BLOQUANT** |
| Fugitifs et traque autoritative | Aucune fonction publique dédiée au nouveau moteur de traque Régime détectée | **BLOQUANT** |
| Juge au 032 | Encore absent dans les parties minimales à 6 ; facultatif au maximum | **BLOQUANT** |
| Nombre minimum 034 | Encore **7**, alors que le design cible **6** | **BLOQUANT** |
| 033 | Juge déjà disponible dès 6 ; taille minimale actuelle conforme | **PASS** |
| Confidentialité des manuscrits | Table privée soumise à RLS, sans permission SELECT pour les rôles `anon` ou `authenticated` | **PASS** |
| Données actuelles des scénarios | Chacun des trois packs publics comprend **trois suspects, six trames**, mais les vérités A/B/C nouvelles ne sont pas les règles actives | **PARTIEL** |
| Tribunal de Karsane | Salle synchrone, droits de parole, objections et audience 14 min seulement documentés ; pas de serveur ni de preuve end-to-end | **BLOQUANT** |
| Journal de Karsane et objectifs du troisième suspect | Prévu par la conception, non branché à un journal d'événements spécifique et un score serveur | **BLOQUANT** |

### Ce qu'ont réellement identifié les 26 échecs

- 9 échecs « validation éditoriale »
- 9 échecs « identité des deux fugitifs »
- 3 échecs « anciens noms de code 034 »
- 3 échecs « moteur de traque absent »
- 1 échec « Juge pas obligatoire 032 à l'effectif minimal »
- 1 échec « minimum six joueurs non respecté au 034 »

### Réconciliation des règles avant l'implémentation

1. **Vrai choix des fugitifs** : A/B/C doit décider des ressources et des vérités historiques, pas forcer le regroupement. Deux consentements sont nécessaires pour fuir ensemble ; sinon les fugitifs sont séparés.
2. **C1 jouable pour chacun** : directeur et Intérieur 032, héritier et Défense 033, Président et sécurité 034 ; tous deux ont des décisions privées. Troisième suspect peut être interrogé et choisit une voie personnelle de coopération/protection.
3. **Rôles minimaux : six** (Enquêteur + Analyste + Juge + trois suspects), Procureur facultatif. **Avocat non obligatoire** ; décision de le proposer seulement après tests du rythme C1–C3.
4. **Mandat traçable** : une tentative par cible/cycle, pièces indépendantes vérifiables, décision du Juge procédurale, résultat côté serveur ; pouvoir capturer dès C1 pour une véritable erreur des fugitifs, mais pas de prise automatique des deux parce qu'ils sont ensemble.
5. **Deux victoires** : 2/2 captures (traque) ; au moins 3/4 actes charnières reconstruits (judiciaire, seuil de test). Victoire totale exige les deux ; les votes 0/1/2 des rôles actuels restent le verdict de degré de responsabilité, distinct des actes.
6. **Tribunal commun non redondant** : après confrontations, les évaluations finales se verrouillent sans refaire les trois défenses. Procès Régime long = 14 min si deuxième capture C3 ; plus court si les deux ont déjà été arrêtés au C1/C2.
7. **Journal fictif** : diffusion idempotente après événement public validé ; liesse à Darsen seulement sur capture présidentielle confirmée ; aucune révélation secrète.
8. **Destruction narrative** : exécution des capturés à l'épilogue par une violence politique extrajudiciaire ; cela ne constitue pas un verdict judiciaire de culpabilité.

### Ordre réel de réalisation / prépublication

**Étape A — Fiction privée** : réécrire et relire les neuf cartes à trois rôles par scénario avec les vérités A/B/C différentes, quatre actes criminels par variante, preuves, chronologies C1–C3, deux réseaux possibles et contre-choix. Ne pas intégrer les vérités scellées au JavaScript public ni déclarer `approved` prématurément.

**Étape B — Moteur serveur** : pin privé des variantes, pseudonymes, choix de réseau, actions des fugitifs, preuves, quotas, requêtes de capture avec authorization et protection anti-rejeu, états des arrestations, actions du troisième suspect, score des actes et mécanisme de tribunal. Maintenir des transactions idempotentes et des vérifications de rôle strictes.

**Étape C — Interface multijoueur** : briefing guidé des six rôles, panneaux de traque et contre-décisions C1–C3, histoire du pays, salle du tribunal à barre synchronisée, vote final non dupliqué, passages court/long et reconnexion.

**Étape D — Simulations** : chacune des 9 variantes × 2 structures d'alliance × issues 0/2, 1/2, 2/2, avec possibilité de capture C1/C2/C3. Tests à 6, 7, 8, 9 selon les limites configurées, sans Procureur et avec Procureur. Inclure Juge inactif, reconnect, intégrité des votes, absence de divulgation des cartes privées, erreurs et échecs autorisés.

**Étape E — Publication** : CI du commit candidate, preuves serveur, relecture humaine des neuf histoires, validation des tests, puis et seulement puis approbation des manuscrits, fusion revue sur `main`, confirmation du déploiement Cloudflare sur le même SHA et smoke-test contrôlé.

**Conclusion :** la structure éditoriale du Régime est assez aboutie pour guider une implémentation cohérente. Ce rapport ne certifie pas la jouabilité ni la possibilité d'une publication immédiate. Aucun changement destructif ou activation n'a été réalisé en base.


## Jalon 032 — amélioration privée v11 (même journée)

**Écriture réellement effectuée dans la base privée** : les trois manuscrits 032 A/B/C comportent désormais une section `regime_vnext` autonome. **Les champs canoniques actifs historiques ne sont pas remplacés ; leurs statuts restent `review` et aucun manuscrit n'est marqué approuvé.** Les variantes 033–034 ne sont pas encore converties.

- 3 variantes distinctes, 3 fiches par variante, 4 actes par variante, 3 preuves garanties, 12 enquêtes facultatives, 8 indices de traque, 12 contre-décisions avec avantage/coût et 1 mission du troisième suspect.
- **63/63 assertions SQL réussies** dans `supabase/tests/igr_regime_032_candidate_drafts_qa.sql`.
- **192/192 combinaisons d'enquête énumérées** (64 par variante) : 56/64 offrent au moins trois actes corroborables, 18/64 les quatre actes, 8/64 deux actes. Ce sont des **potentiels documentaires**, sans supposer que les joueurs attribueront les responsables correctement.
- **15/15 simulations de raccordement** (trois variantes, deux fugitifs, deux types d'alliance, et mission personnelle) : choix imprudent avec deux preuves indépendantes = capture C1 possible ; choix moins exposant = seconde preuve non automatiquement publiée ; mission coopération/protection calculable. Ces simulations ont été effectuées avec le noyau de règles générique, **hors session réelle**.
- **25/25 tests unitaires synthétiques** du noyau de règles réussis au dernier contrôle.
- **Test de publication actualisé (66 assertions) : 25 OK / 41 bloquantes**. Il suit à présent le vrai critère du mécanisme v99 (`editorial_status='ready'` + approbation), distingue les variantes privées staged des variantes réellement promues et souligne les écarts 033/034.
- **Contrôle de publication existant** : `igr_private.igr_v100_preflight('032')`, `('033')` et `('034')` renvoient toujours `release_eligible=false` (`approved=0`). Cela préserve la production.

**Défaut non résolu :** aucune fonction serveur Supabase de traque, de mandat, de choix d'alliance ou de tribunal collectif n'est connectée à `regime_vnext`. Les personnages anciens sont encore dans les champs canoniques historiques. Les mêmes étapes de sécurité/QA et de validation humaine restent obligatoires avant toute sortie.
