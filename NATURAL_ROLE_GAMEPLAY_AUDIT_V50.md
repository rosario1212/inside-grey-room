# Inside Grey Room — audit v50

## Périmètre

La v50 aligne le gameplay sur les interactions physiques naturelles : l'application contrôle les phases collectives, la Grey Room, les preuves, les actions canoniques, les quotas et le scoring ; elle ne crée plus de rendez-vous chronométrés ordinaires entre deux joueurs.

Backend production vérifié sur le projet Supabase `jtasbdiguhiswoyvobkn` et frontend v50 ajouté après le runtime v49.

## Chronologie canonique

1. Lecture des cartes.
2. Assemblée I du camp Enquête — 5:00, obligatoire pour Enquêteur, Analyste, Procureur, Juge, Inspecteur et Expert présents.
3. Cycle 1 — enquête, Grey Room et interactions libres.
4. Assemblée II — 4:00.
5. Cycle 2.
6. Assemblée III — 4:00.
7. Cycle 3, dernières convocations et conclusions.
8. Verrouillage / révélation.

Les autres rôles sont en TEMPS LIBRE pendant les Assemblées. Le Journaliste reste indépendant et n'est jamais assimilé au camp Suspect.

Les anciens `cycle_debrief` / `final_debrief` ne deviennent plus des phases séparées visibles : leur fonction est absorbée par les Assemblées ou le verrouillage final.

## Interactions naturelles

- Hors convocation officielle de l'application dans la Grey Room, les conversations sont libres.
- Juge : aucune convocation individuelle chronométrée ; il va chercher le joueur directement.
- Procureur : aucun entretien chronométré ni minimum d'entretien par cycle ; négociation physique puis enregistrement éventuel d'une coopération.
- Avocat / Suspect : échanges libres et illimités hors Grey Room.
- Exception : pendant son propre interrogatoire, un Suspect peut consulter un Avocat 1:00, une fois par cycle ; l'interrogatoire est suspendu puis reprend avec le temps restant exact.
- Expert : consultations libres, sans chrono.
- Inspecteur : interventions en salle d'attente sans chrono.
- Journaliste : interactions libres, sans sessions artificielles.

## Activité affichée au choix du rôle

| Rôle | Activité |
|---|---|
| Enquêteur | ★★★★ |
| Suspect | ★★★★ |
| Procureur | ★★★ |
| Juge | ★★★ |
| Avocat | ★★★ |
| Journaliste | ★★★ |
| Inspecteur | ★★★ |
| Analyste | ★★ |
| Expert | ★ |
| Témoin | ★★ |

Le libellé signifie la fréquence moyenne des interventions et décisions, pas la difficulté ni l'importance du rôle.

## Expert

- 1 analyse canonique maximum par cycle.
- 1 contre-expertise maximum sur toute la partie.
- Résultat privé par défaut.
- Peut transmettre un résultat au camp Enquête.
- Peut présenter publiquement un résultat déjà obtenu via le système public v49.
- Pendant interrogatoire/confrontation : observateur technique ; peut corriger une affirmation technique sans mener la séance.
- Les consultations avec les autres joueurs sont libres et sans chrono.

## Inspecteur

- 15 lieux canoniques dans chaque scénario où le rôle peut apparaître actuellement.
- 3 explorations maximum par cycle ; un lieu ne peut être exploré qu'une fois.
- Chaque résultat est automatiquement transmis à l'Enquêteur.
- Partage supplémentaire possible vers Analyste, Procureur ou tout le camp Enquête.
- Intervention libre en salle d'attente avec 1 ou 2 Suspects ; aucun chrono.
- Le Journaliste peut dénoncer une intervention active une fois par partie : Breaking News publique + camp Enquête −10.

## Journaliste

- Rôle indépendant.
- 10 pistes canoniques dans tous les scénarios où le rôle peut apparaître.
- Enquête possible sur le camp Enquête ou les Suspects / la défense.
- Breaking News scénarisées + Breaking News rédigées à la main.
- Quota partagé : 3 publications maximum par cycle, 6 sur toute la partie.
- Une publication manuelle doit déclarer sa base : observation, déclaration, document, élément public ou résultat d'enquête.
- Une publication manuelle reste une affirmation de presse (`verified=false`) et n'est pas transformée en vérité canonique.
- Une faute journalistique signalée ne déclenche pas automatiquement −10 : le Juge valide, ou l'Enquêteur si aucun Juge n'est présent.
- Motifs contrôlés : intrusion Grey Room, refus de partir, zone interdite, perturbation d'une procédure officielle, règle spécifique au scénario.

## Scoring procédural

- Dénonciation légitime de l'Inspecteur par le Journaliste : camp Enquête −10, maximum une fois pour cette mécanique.
- Plainte validée contre le Journaliste : Journaliste −10 personnel.
- Le reveal v50 expose le score de base du camp Enquête, l'ajustement procédural et le score final /100.
- Le Journaliste reçoit également un score de conduite /100 avec ses pénalités.

## Couverture des 34 scénarios

Les 34 packs `001` à `034` passent `igr_v42_valid_core_pack = true`.

| Scénario | Pack | Inspecteur | Expert | Journaliste |
|---|---|---:|---:|---:|
| 001 | OK | — | — | — |
| 002 | OK | — | — | — |
| 003 | OK | — | — | — |
| 004 | OK | — | — | — |
| 005 | OK | — | — | — |
| 006 | OK | — | — | — |
| 007 | OK | — | — | — |
| 008 | OK | — | — | — |
| 009 | OK | — | — | — |
| 010 | OK | — | — | — |
| 011 | OK | — | — | — |
| 012 | OK | — | — | — |
| 013 | OK | — | — | — |
| 014 | OK | — | — | — |
| 015 | OK | — | — | 10 pistes / 5 news |
| 016 | OK | — | — | 10 pistes / 5 news |
| 017 | OK | — | — | — |
| 018 | OK | 15 lieux | — | — |
| 019 | OK | — | — | 10 pistes / 6 news |
| 020 | OK | 15 lieux | 5 analyses | 10 pistes / 8 news |
| 021 | OK | — | — | — |
| 022 | OK | — | — | — |
| 023 | OK | — | — | — |
| 024 | OK | — | — | — |
| 025 | OK | — | — | — |
| 026 | OK | — | 4 analyses | — |
| 027 | OK | 15 lieux | 3 analyses | — |
| 028 | OK | 15 lieux | 4 analyses | — |
| 029 | OK | — | — | — |
| 030 | OK | — | — | 10 pistes / 5 news |
| 031 | OK | — | — | — |
| 032 | OK | — | — | — |
| 033 | OK | — | — | — |
| 034 | OK | — | — | 10 pistes / 5 news |

Le contenu spécialisé n'est donc ajouté que lorsqu'un rôle spécialisé peut réellement être distribué dans le scénario.

## Tests backend transactionnels

18 contrôles exécutés avec rollback : **18/18 réussis**.

- Assemblée I = 5 min et obligatoire côté Enquête.
- Journaliste en temps libre pendant l'Assemblée.
- Inspecteur limité à 3 lieux/cycle.
- Rapports Inspecteur automatiquement transmis à l'Enquêteur.
- Partage Inspecteur additionnel fonctionnel.
- Dénonciation Inspecteur = −10 Enquête.
- Dénonciation Inspecteur limitée à une fois.
- Expert limité à 1 analyse/cycle.
- Contre-expertise Expert limitée à une fois.
- Publication publique Expert visible comme événement public.
- Journaliste limité à 3 publications/cycle.
- Journaliste limité à 6 publications/partie.
- Plainte Journaliste routée vers le Juge.
- Plainte validée = −10 Journaliste.
- Anciennes convocations chronométrées du Juge neutralisées.
- Anciens entretiens chronométrés du Procureur neutralisés.
- Consultation Avocat = 1 minute pendant interrogatoire.
- Deuxième consultation du même cycle rejetée.

## Contrôle frontend / build

Le runtime `natural-role-gameplay-v50.js` est chargé après `public-broadcasts-v49.js` et devient le dernier runtime externe. Il ajoute :

- activité ★ dans les cellules de choix de rôle ;
- cartes Assemblée obligatoire / Temps libre ;
- règles v50 dans l'onglet Règles et la page de règles ;
- guide du rôle sur la carte personnelle ;
- onglet Terrain de l'Inspecteur ;
- onglet Expertise de l'Expert ;
- onglet Presse du Journaliste ;
- Parquet sans ancienne liste de convocations chronométrées ;
- nettoyage de l'ancienne liste de convocations du Cabinet du Juge ;
- plaintes et validation des pénalités ;
- score procédural au reveal ;
- support FR / EN ;
- injection web `dist` et mobile `www` ;
- cache service worker v50.

Le checker v50 valide la syntaxe du runtime, les RPC attendues, l'ordre v49 → v50, l'enregistrement du service worker et le précache du runtime.

## Backend production

Migrations v50 déjà appliquées et vérifiées :

- `natural_role_flow_v50`
- `natural_institution_interactions_v50`
- `expert_inspector_gameplay_v50`
- `journalist_gameplay_v50`
- `scenario_role_content_v50`
- `score_penalties_reveal_v50`

