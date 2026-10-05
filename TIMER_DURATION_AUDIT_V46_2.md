# Inside Grey Room — audit des durées v46.2

Date : 2026-10-05

> Ce document **remplace la référence canonique de `TIMER_DURATION_AUDIT_V46_1.md`**. Le document v46.1 reste conservé uniquement comme historique de la régression 6 ↔ 8 minutes.

## Référence canonique actuelle

| Phase | COURT | LONG | LEGACY |
|---|---:|---:|---:|
| Pré-enquête | 02:00 | 03:00 | 02:00 |
| Interrogatoire | 06:00 | **06:00** | 06:00 |
| Débrief de cycle | 01:30 | 02:00 | 02:00 |
| Confrontation | 02:00 | 04:00 | 04:00 |
| Assemblée | 02:30 | 04:00 | 04:00 |
| Judiciaire court | 01:30 | 02:00 | 02:00 |
| Juge long | 02:00 | 04:00 | 03:00 |
| Témoin | 03:00 | 04:00 | 04:00 |
| Dernier débrief | 02:00 | **04:00** | 02:00 |

## Régression corrigée

Une migration historique et le runtime v46.1 avaient restauré l'interrogatoire LONG à 480 secondes / 08:00. La règle retenue est désormais sans ambiguïté :

- interrogation LONG = **360 secondes / 06:00** ;
- dernier débrief LONG = **240 secondes / 04:00**.

## Correctifs v46.2

- `timer-runtime-v46.js` force la valeur finale LONG à 360 s et normalise les anciens libellés 8 min / 08:00 vers 6 min / 06:00 ;
- le cache PWA passe à `v46-2-six-minute-long` / `igr-v46-2-six-minute-long` afin que les clients déjà installés ne conservent pas le runtime 8 minutes ;
- `scripts/v46-timer-check.mjs` échoue si le runtime final repasse à 480 s ou réaffiche « Convoquer · 8 min » ;
- la migration `20261005211500_long_interrogation_six_minutes_canonical.sql` rétablit la fonction serveur à 360 s et répare les salles LONG encore stockées à 480 s ;
- les chemins serveur continuent d'utiliser les helpers de durée et non un littéral `interval '6 minutes'`.

## Vérification production

Après application de la migration sur Supabase production :

- SHORT interrogation = **360 s** ;
- LONG interrogation = **360 s** ;
- LONG final_debrief = **240 s** ;
- salles LONG encore stockées avec `interrogation_seconds=480` = **0**.

## Note d'architecture

`duration-modes-v35.js` reste une couche historique plus ancienne. La couche d'autorité finale pour ce correctif est v46.2, chargée après les couches de durée précédentes. Une consolidation future devra supprimer cette duplication de sources de vérité, mais elle n'est pas nécessaire au hotfix P0.

## Conclusion

La règle canonique actuelle est : **partie LONG = interrogatoire 06:00 et dernier débrief 04:00**.
