# Inside Grey Room — audit des durées v46.1

Date : 2026-10-05

## Référence canonique

Le règlement du jeu indique bien **8 minutes pour un interrogatoire standard**. La matrice de durée retenue est :

| Phase | COURT | LONG | LEGACY |
|---|---:|---:|---:|
| Pré-enquête | 02:00 | 03:00 | 02:00 |
| Interrogatoire | 06:00 | **08:00** | 06:00 |
| Débrief de cycle | 01:30 | 02:00 | 02:00 |
| Confrontation | 02:00 | 04:00 | 04:00 |
| Assemblée | 02:30 | 04:00 | 04:00 |
| Judiciaire court | 01:30 | 02:00 | 02:00 |
| Juge long | 02:00 | 04:00 | 03:00 |
| Témoin | 03:00 | 04:00 | 04:00 |
| Dernier débrief | 02:00 | **04:00** | 02:00 |

## Anomalies trouvées

### 1. Régression critique : LONG était forcé à 06:00

Le preset historique `duration-modes-v35.js` avait correctement `interrogation:480`, mais le hotfix v46 chargé en dernier remplaçait cette valeur par `360`. La migration Supabase associée avait aussi remplacé la fonction canonique de durée par 360 secondes pour LONG.

**Correction :** v46.1 restaure LONG à 480 secondes côté interface et côté base.

### 2. Tests contradictoires

Le contrôle v35 exigeait déjà LONG=480 alors que le contrôle v46 exigeait LONG=360. Deux garde-fous du même projet validaient donc des vérités opposées.

**Correction :** les deux contrôles exigent désormais LONG=480 et le dernier débrief LONG=240.

### 3. Dernier débrief désynchronisé dans le preset source

Le runtime et la base visaient 04:00, mais le preset v35 conservait encore `finalDebrief:180`.

**Correction :** le preset source est désormais à 240 secondes pour LONG et les libellés affichent `DERNIER DÉBRIEF · 04:00`.

### 4. Chemins serveur avec valeurs de secours codées en dur

`igr_v13_start_event` et `igr_v4_start_interrogation` contenaient encore des `interval '6 minutes'` alors même que l'architecture v35 possède une fonction de durée par mode. Le trigger `zz_igr_v35_apply_room_duration` corrigeait ces valeurs avant écriture pour SHORT/LONG, mais ce double système rendait une nouvelle régression trop facile.

**Correction :** ces deux chemins utilisent maintenant directement les secondes issues de `igr_v35_room_seconds` / des options serveur, avec `make_interval(secs=>secs)`. Les textes d'événement utilisent aussi le label calculé, et confrontation/assemblée consomment leur durée calculée au lieu d'un 04:00 codé en dur.

### 5. Risque de cache PWA

Le runtime v46 était ajouté après v45 sans faire évoluer l'enregistrement du service worker ni son namespace de cache. Un client déjà installé pouvait donc conserver une ancienne combinaison HTML/runtime.

**Correction :** v46.1 devient le dernier script externe, utilise `?v=v46-1-long-timers`, met à jour l'enregistrement du service worker, son namespace de cache et pré-cache explicitement le runtime timer.

## Vérifications production après correction

La fonction `igr_v35_duration_seconds` a été relue en production après migration :

- SHORT interrogation = 360 s ;
- LONG interrogation = **480 s** ;
- LONG final_debrief = **240 s** ;
- les autres valeurs correspondent à la matrice ci-dessus.

Audit des salles LONG après migration :

- 2 salles LONG présentes au moment du contrôle ;
- 0 état `interrogation_seconds` différent de 480 ;
- 0 état `final_debrief_seconds` différent de 240 ;
- 0 phase d'interrogatoire LONG stockée avec une durée différente de 480 ;
- 0 phase de dernier débrief LONG stockée avec une durée différente de 240.

Le trigger `zz_igr_v35_apply_room_duration` est actif sur `igr_v4_rooms`. Les chemins directs d'interrogatoire ont en plus été durcis pour ne plus dépendre d'un littéral de six minutes.

## Garde-fous ajoutés

Le build échoue désormais si :

- LONG interrogation repasse à 360 s ;
- LONG final debrief n'est plus à 240 s ;
- le runtime réécrit LONG en « 6 min » ;
- les fonctions serveur d'interrogatoire réintroduisent `interval '6 minutes'` ;
- le runtime timer n'est plus le dernier script externe ;
- le service worker n'est pas versionné/préchargé avec v46.1.

## Conclusion

La source, le runtime chargé en dernier, la base Supabase et les garde-fous convergent désormais sur la même règle : **partie LONG = interrogatoire 08:00 et dernier débrief 04:00**.
