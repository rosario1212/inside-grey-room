# Rapport — v12.38 OMERTÀ state-reset

## Cause du bug

Après une cellule OMERTÀ, `STATE.sync.room.scenario_id` conservait le dossier de l'ancienne salle (ex. 025). La couche visuelle v12.37 pouvait considérer ce vieux `sync` comme plus prioritaire que `STATE.selectedScenario` pendant l'écran de confirmation d'un nouveau scénario (ex. 002).

En plus, la réparation des affiches OMERTÀ utilisait parfois l'URL `src` déjà présente comme preuve que l'image appartenait à OMERTÀ. Une affiche 025 injectée par erreur pouvait donc s'auto-maintenir même après le passage à un scénario de base.

## Correction

- `create-confirm` utilise maintenant **toujours `STATE.selectedScenario`** comme source de vérité.
- `lobby / briefing / game` continuent d'utiliser le scénario du serveur.
- les nœuds DOM masqués ne sont plus utilisés pour déterminer le scénario visible.
- le `src` d'une image OMERTÀ n'est plus une source de vérité pour une hero/confirmation.
- si un scénario base est affiché avec une ancienne image OMERTÀ, l'image est restaurée avec `scenarioArt(scenarioId)`.
- avant chaque nouvelle sélection, les classes de thème DLC précédentes sont supprimées immédiatement.
- les classes `igr-omerta-active` et `igr-omerta-cell` sont nettoyées lors du passage hors OMERTÀ.
- cache-busting JS + Service Worker v12.38 pour iPhone/PWA.

## Fichiers modifiés

- `omerta-v12-37.js`
- `dlc-suite-v12-37.js`
- `index.html`
- `service-worker.js`
- `scripts/ui-regression-check.mjs`

Aucune donnée de scénario, image, migration Supabase ou mécanique serveur n'est modifiée.
