# Inside Grey Room — Audit v52

## Résultat global

- Scénarios audités : **001 à 034**
- Packs valides selon `igr_v42_valid_core_pack` : **34/34**
- Nombre de suspects = nombre de niveaux canoniques : **34/34**
- Échelle canonique après migration : **0, 1, 2 uniquement**
- Audit de partie transactionnel : **34/34 PASS**
- Test d’intégration complet de l’Audience finale : **13/13 PASS**

## Échelle de responsabilité

- `0` — Aucune responsabilité
- `1` — Responsabilité secondaire
- `2` — Responsabilité principale

Conversion du canon historique : `0 → 0`, `1/2 → 1`, `3 → 2`.

## Fin du cycle 3

1. Enquête close : aucune nouvelle preuve, expertise, exploration ou Breaking News.
2. Audience finale : Enquêteur → Analyste → Inspecteur → Expert → Procureur → Juge → Journaliste.
3. Chaque intervention dure au maximum 2:00 et peut être terminée plus tôt.
4. Tous peuvent passer sauf le Juge, qui doit intervenir.
5. Chaque rôle Enquête qui intervient enregistre sa lecture 0–2 avant les défenses.
6. Chaque Suspect peut utiliser ou passer une défense finale de 5:00. Son Avocat officiel partage les mêmes cinq minutes.
7. Après toutes les défenses, chaque Avocat peut donner un avis final de 2:00 ou passer.
8. Les rôles du camp Enquête réévaluent silencieusement chaque Suspect en 0–2.
9. Si un Juge est présent, le vote d’intégrité reste requis pour les rôles habilités.
10. Le dossier 027 conserve sa recommandation extérieure avant la révélation.
11. La hiérarchie d’autorité reste Juge → Procureur → Enquêteur.
12. Révélation et scores.

## Audit des scénarios

| Scénario | Pack | Échelle 0–2 | Cycles/assemblées | Finale/Révélation | Mécaniques spécialisées |
|---|---|---|---|---|---|
| 001 | PASS | PASS | PASS | PASS | — |
| 002 | PASS | PASS | PASS | PASS | — |
| 003 | PASS | PASS | PASS | PASS | — |
| 004 | PASS | PASS | PASS | PASS | — |
| 005 | PASS | PASS | PASS | PASS | — |
| 006 | PASS | PASS | PASS | PASS | — |
| 007 | PASS | PASS | PASS | PASS | — |
| 008 | PASS | PASS | PASS | PASS | — |
| 009 | PASS | PASS | PASS | PASS | — |
| 010 | PASS | PASS | PASS | PASS | — |
| 011 | PASS | PASS | PASS | PASS | — |
| 012 | PASS | PASS | PASS | PASS | — |
| 013 | PASS | PASS | PASS | PASS | Procureur |
| 014 | PASS | PASS | PASS | PASS | Juge |
| 015 | PASS | PASS | PASS | PASS | Journaliste : 10 pistes / 5 news |
| 016 | PASS | PASS | PASS | PASS | Journaliste : 10 pistes / 5 news |
| 017 | PASS | PASS | PASS | PASS | Procureur / accords |
| 018 | PASS | PASS | PASS | PASS | Inspecteur : 15 lieux |
| 019 | PASS | PASS | PASS | PASS | Journaliste : 10 pistes / 6 news |
| 020 | PASS | PASS | PASS | PASS | Inspecteur 15 / Expert 5 / Journaliste 10 |
| 021 | PASS | PASS | PASS | PASS | Omerta |
| 022 | PASS | PASS | PASS | PASS | Omerta |
| 023 | PASS | PASS | PASS | PASS | Omerta |
| 024 | PASS | PASS | PASS | PASS | Omerta |
| 025 | PASS | PASS | PASS | PASS | Omerta |
| 026 | PASS | PASS | PASS | PASS | Expert : 4 analyses |
| 027 | PASS | PASS | PASS | PASS | Inspecteur 15 / Expert 3 / recommandation extérieure |
| 028 | PASS | PASS | PASS | PASS | Inspecteur 15 / Expert 4 |
| 029 | PASS | PASS | PASS | PASS | — |
| 030 | PASS | PASS | PASS | PASS | Journaliste : 10 pistes / 5 news |
| 031 | PASS | PASS | PASS | PASS | — |
| 032 | PASS | PASS | PASS | PASS | — |
| 033 | PASS | PASS | PASS | PASS | — |
| 034 | PASS | PASS | PASS | PASS | Journaliste : 10 pistes / 5 news |

## Tests de partie automatisés

Pour chacun des 34 dossiers, une room temporaire a été créée dans une transaction puis annulée. Le test a vérifié :

- Assemblée I = 05:00 ;
- Assemblée II = 04:00 ;
- Assemblée III = 04:00 ;
- transition correcte vers l’enquête après chaque Assemblée ;
- fermeture du dossier après le cycle 3 ;
- démarrage de l’Audience finale ;
- passage facultatif d’un rôle ;
- présence d’une défense possible pour chaque Suspect ;
- réévaluation finale ;
- verrouillage avec l’échelle 0–2 ;
- création de la révélation ;
- traitement particulier du dossier 027.

Le test d’intégration dédié a en plus vérifié l’ordre complet des sept rôles, le refus serveur du bouton `Passer` pour le Juge, les chronos 2:00 / 5:00 / 2:00, le rattachement Avocat-client, le rejet du niveau 3 et le déclenchement final de la révélation.

## Affichage attendu

Le runtime v52 ajoute un onglet `Finale` pendant les phases finales, un indicateur des quatre étapes, les boutons `PRENDRE LA PAROLE`, `PASSER`, `TERMINER MON INTERVENTION`, `ME DÉFENDRE`, ainsi que les formulaires 0–2. Le règlement v51 est complété par la séquence finale v52.
