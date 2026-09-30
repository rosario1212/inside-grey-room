# Inside Grey Room — v12.38 OMERTÀ state-reset hotfix

Base ciblée : `main` après la v12.37 finale.

Ce ZIP est volontairement **minimal**. Il corrige uniquement la fuite visuelle OMERTÀ lorsqu'un joueur quitte une partie OMERTÀ puis sélectionne un scénario de base ou un autre DLC.

## Installation

Décompresse le ZIP à la racine du dépôt et remplace les fichiers du même nom :

- `index.html`
- `service-worker.js`
- `omerta-v12-37.js`
- `dlc-suite-v12-37.js`
- `scripts/ui-regression-check.mjs`

Aucune image, migration Supabase ou CSS n'est à remplacer pour ce hotfix.

Ensuite, laisse GitHub relancer les checks. Sur iPhone/PWA, ferme puis rouvre l'app si l'ancien Service Worker est encore en mémoire.

## Régression manuelle prioritaire

1. Ouvrir OMERTÀ 025 et entrer dans la cellule.
2. Revenir aux scénarios.
3. Sélectionner BASE 002 — LE SILENCE DE LÉON.
4. Vérifier : affiche 002 correcte, aucun rouge OMERTÀ, aucune bordure OMERTÀ.
5. Refaire avec un autre scénario base 001–020.
6. Refaire OMERTÀ → TERREUR/CARTEL/LE RÉGIME et vérifier que seul le nouveau thème s'applique.
7. Revenir à OMERTÀ et confirmer que les affiches 021–025 et le rouge reviennent normalement.
