# Inside Grey Room — v13.1 FINAL · gameplay, DLC et rejouabilité

## Base

- Dépôt ciblé : `rosario1212/inside-grey-room`
- Base de travail : ZIP v13 Gameplay Flow Candidate
- Moteur de rythme audité : scénarios 001–020
- Extension DLC : 021–034
- Rejouabilité : contrat 001–034
- Mode Héritage : volontairement hors de ce bundle

Cette archive ne remplace pas `app-v11.js`. Elle ajoute des couches isolées afin de limiter les régressions.

## Ce que contient la version finale

### 1. Nouvelle DA de partie

- pré-enquête sociale de 3:00 ;
- Salle d’attente active ;
- relations initiales utiles dès le départ ;
- Convocations humaines ;
- interrogatoires stricts de 8:00 ;
- C1 / C2 / C3 structurés ;
- Confrontations ;
- Assemblées ;
- Expert silencieux ;
- Inspecteur ↔ Journaliste ;
- triangle Avocat / Procureur / Juge ;
- objectifs principal + secondaire ;
- corruption institutionnelle uniquement privée ;
- MJ adaptatif à deux questions ;
- aucune analyse de conversation par micro/IA.

### 2. Rejouabilité obligatoire 001–034

Principe :

> **Un joueur qui rejoue un scénario ne doit jamais pouvoir résoudre la partie de mémoire.**

Le fichier `scenario-replay-contracts-v13.json` définit **au moins trois directions canoniques différentes par scénario**. Il ne s’agit pas d’un simple mélange de joueurs : la responsabilité principale, les relations, la chronologie ou le mécanisme causal peuvent changer.

Une variante ne doit être activée en production que lorsque ses cartes privées, relations, objectifs, trames et révélation ont toutes été écrites de manière cohérente. Le moteur ne doit jamais générer une preuve pour compléter automatiquement une variante incomplète.

### 3. DLC — identité propre

- **OMERTÀ** : Famiglia vivante + cercle qui se resserre + ordre ambigu + Chaise vide + point de non-retour + chaîne des ordres. Pas de surnoms ajoutés.
- **TERREUR** : ville qui tombe (`7/12 quartiers`), périmètre, liaison, mini-carte abstraite, VRAI ≠ SINCÈRE, dernière liaison.
- **CARTEL** : témoins disponibles, intégrité institutionnelle, protection, pression sur les sources, motif écrit, engagement verrouillé.
- **LE RÉGIME** : archives, pouvoir officiel ≠ pouvoir réel, carte de pouvoir, surnoms rotatifs par opération.

Voir `docs/DLC_SIGNATURE_MECHANICS.md`.

## Fichiers principaux

- `scenario-flow-v13.js` — configuration du moteur v13 ;
- `gameplay-flow-v13.js` — overlay d’interface/interaction ;
- `gameplay-flow-v13.css` — styles du flux ;
- `dlc-experience-v13.js` — registre des mécaniques DLC ;
- `dlc-experience-v13.css` — surface de monde DLC ;
- `scenario-replay-contracts-v13.json` — contrats de variantes 001–034 ;
- `supabase/gameplay-flow-v13.sql` — moteur de rythme existant ;
- `supabase/replayability-dlc-v13.sql` — primitives additives replay/DLC ;
- `docs/REPLAYABILITY_001_034.md` ;
- `docs/DLC_SIGNATURE_MECHANICS.md` ;
- `docs/REPLAY_IMPLEMENTATION_PLAN.md`.

## Installation recommandée

1. créer une branche dédiée depuis `main` ;
2. copier les fichiers du bundle à la racine ;
3. exécuter `node scripts/install-v13-flow.mjs` ;
4. créer une migration Supabase pour `gameplay-flow-v13.sql` ;
5. créer une seconde migration additive pour `replayability-dlc-v13.sql` ;
6. exécuter `node scripts/verify-v13-flow.mjs`, `npm run build`, `npm run store:check` ;
7. playtest multijoueur avant merge.

## Important sur la rejouabilité

`scenario-replay-contracts-v13.json` est volontairement un **contrat d’auteur** : il interdit la fausse rejouabilité. Il ne faut pas activer une variante simplement parce qu’elle possède un résumé. Pour être activable, elle doit être entièrement matérialisée dans `pack.replay_variants` avec truth, suspects, relations, trames, role_notes et event_profile compatibles.

Cette règle évite de casser la cohérence du dossier juste pour rendre la solution aléatoire.

## Sécurité / confidentialité

Le client ne doit jamais recevoir :

- `replay_variant_id` ;
- les variantes alternatives ;
- les vérités non sélectionnées ;
- les futures trames ;
- les objectifs privés d’un autre joueur ;
- les données Espion protégées.

Les compteurs TERREUR/CARTEL/RÉGIME sont publics mais purement narratifs. Ils ne contiennent aucune donnée tactique cachée.

## Statut

Cette archive est une **candidate finale d’intégration**, pas une migration déjà appliquée en production. Elle doit passer un playtest et un test de migration sur environnement de développement avant fusion dans `main`.
