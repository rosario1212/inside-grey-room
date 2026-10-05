# Inside Grey Room — Audit v48 · Entretiens institutionnels

## Décision

Les **convocations individuelles du Juge** et les **entretiens du Procureur** durent désormais **3 minutes maximum**.

Ce changement ne modifie pas :
- le réexamen conjoint Enquêteur + Analyste + Juge : **2 minutes** ;
- la consultation ponctuelle d’un suspect non représenté avec l’Avocat : **1 minute** ;
- la délibération finale avec le Juge : **3 min en partie courte / 4 min en partie longue**.

## Juge

- Le Juge ne peut toujours convoquer qu’un joueur actuellement **LIBRE**.
- La même personne reste limitée à **une convocation par cycle**.
- La personne convoquée confirme toujours l’entretien depuis son application.
- Le chrono démarre à cette confirmation.
- Nouvelle durée : **180 secondes / 3:00**.
- L’entretien peut être terminé avant la fin.

## Procureur

- Le Procureur ne voit toujours que les joueurs **LIBRES**.
- Une même cible reste limitée à **un entretien par cycle**.
- La cible confirme toujours depuis son application.
- Si la cible est un suspect représenté, son Avocat doit être libre et l’accompagne.
- Nouvelle durée : **180 secondes / 3:00**.
- Le minimum d’un entretien terminé par cycle reste inchangé.
- Les coopérations entre suspects restent disponibles pendant l’entretien.

## Backend

La migration v48 remplace :
- `igr_v44_confirm_summon` → `ends_at = now() + interval '3 minutes'`, réponse `seconds = 180` ;
- `igr_v47_confirm_prosecutor_interview` → `ends_at = now() + interval '3 minutes'`, réponse `seconds = 180` ;
- `igr_v47_prosecutor_summon` → notification mise à jour à 3 minutes ;
- les notes de rôle Procureur des scénarios 013, 017, 019 et 020 → 3 minutes.

Vérification directe en base : les deux fonctions de confirmation utilisent bien l’intervalle de 3 minutes et renvoient 180 secondes.

## Web / mobile

Le patch de build v48 met à jour les libellés des runtimes v44/v47 et force un nouveau cache :
- `AU CABINET DU JUGE · 3 MIN MAX` ;
- `Convoquer · 3 min` ;
- `Entretien du Parquet · 3 min` ;
- `ENTRETIEN DU PARQUET · 3 MIN MAX`.

Le check `v48-institution-interviews-check.mjs` refuse les anciens libellés 2 minutes pour ces deux mécaniques et vérifie explicitement que le réexamen conjoint reste à 2 minutes.
