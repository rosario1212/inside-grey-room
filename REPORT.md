# Rapport v12.35 — Inside Grey Room

## 1. Fichiers modifiés / ajoutés

Remplacements de fichiers existants :
- `index.html`
- `service-worker.js`
- `scripts/build-web.mjs`
- `scripts/build-mobile.mjs`
- les cinq `assets/omerta-021...025-*.webp`

Nouveaux fichiers :
- `omerta-v12-35.js`
- `omerta-v12-35.css`
- `terror-v12.js`
- `terror-v12.css`
- `dlc-suite-v12-35.js`
- `dlc-suite-v12-35.css`
- `scripts/validate-dlc-assets.mjs`
- `scripts/ui-regression-check.mjs`
- `supabase/migrations/20260930_dlc_suite_026_034.sql`

## 2. Correction images OMERTÀ 021–025

Les cinq affiches originales ont été reprises comme sources, converties en WebP haute qualité et gardées au ratio portrait 3:4 :
- 021 : 1086×1448, ~250 KiB
- 022 : 1086×1448, ~274 KiB
- 023 : 1086×1448, ~276 KiB
- 024 : 1086×1448, ~238 KiB
- 025 : 1086×1448, ~273 KiB

Le runtime v12.35 force la même source HQ dans liste, détail, confirmation et hero, supprime `srcset/sizes` hérités, impose `object-fit: cover`, `object-position: center`, `image-rendering: auto`, et ne référence aucun wrapper `*-hd.svg`. Le Service Worker passe à `igr-v12-35-dlc-suite` et précharge les cinq URL avec `?v=12.35-hq`, ce qui invalide proprement l’ancien cache PWA.

## 3. Rouge interne OMERTÀ

Tous les styles gameplay rouges sont scoppés sous `body.igr-omerta-active`. Les cartes non sélectionnées ont déjà un fond bordeaux/noir visible, pas seulement une bordure. Le selected, hover/focus et disabled ont des états distincts. Les cibles couvrent : rôle choisi, tirage au hasard, TIRER, cartes de rôle, Arbre de la Famiglia, statuts, objectifs, cartes privées, événements/décisions et cellules auxiliaires. Aucun style rouge de ce fichier ne s’applique aux scénarios 001–020 ni aux autres DLC.

## 4. Cause du bug du tirage aléatoire

La couche OMERTÀ v12.30 lisait l’état via `window.STATE`, alors que l’application principale déclare `STATE` avec un binding lexical global (`const STATE`). La couche pouvait donc se retrouver sans état exploitable après la resynchronisation et abandonner le tirage (`no_sync`). La v12.35 utilise directement le `STATE` partagé chargé par `app-v11.js`.

## 5. Correction du tirage

Le nouveau tirage :
- bloque les doubles taps avec `randomBusy` ;
- désactive le bouton et applique `aria-busy=true` ;
- resynchronise avant de choisir ;
- calcule les disponibilités avec `roleChoiceSummary` et les capacités réelles ;
- utilise `crypto.getRandomValues()` avec rejection sampling, sans `Math.random()` ;
- utilise `igr_omerta_choose_role` pour OMERTÀ et `igr_v4_choose_role` pour la base ;
- resynchronise après attribution ;
- retente jusqu’à 4 fois sur conflit de capacité/concurrence ;
- sépare l’animation RAF du résultat logique ;
- conserve une durée visuelle d’environ 620–760 ms.

La correction est volontairement commune au tirage base/OMERTÀ afin de neutraliser le remplacement global cassé de v12.30 sans réécrire le gameplay des scénarios 001–020.

## 6. Descriptions OMERTÀ

Enquêteur, Analyste, Suspect, Avocat (`maitre`), Procureur, Juge et Informateur disposent du texte concret demandé quand un dossier OMERTÀ est actif. Les rôles Mafia existants (Associato, Uomo d’Onore, Contabile, Pentito, Caporegime, Consigliere, Sottocapo, Don) ont également des descriptions courtes orientées décisions et conséquences.

## 7. Filtres ajoutés

Le filtre ne duplique pas les scénarios existants. Un mapping central `IGR_SCENARIO_META` classe :
- 001–008 → base/original ;
- 009–020 → base/second ;
- 021–025 → dlc/omerta ;
- 026–028 → dlc/terror ;
- 029–031 → dlc/cartel ;
- 032–034 → dlc/regime.

Les chips sont horizontales, sans wrap, avec zones tactiles ≥44 px et persistence `sessionStorage`. Le filtrage masque/affiche les cartes existantes sans reconstruire inutilement toute la page.

## 8. Régression effectuée

Exécuté sur le contenu du package :
- `node --check` sur `omerta-v12-35.js`, `terror-v12.js`, `dlc-suite-v12-35.js`, `service-worker.js` : OK ;
- validation physique des cinq WebP : signature valide, 1086×1448, taille >200 KiB : OK ;
- vérification d’absence de `Math.random`, `window.STATE`, `*-hd.svg`, `pixelated`, `crisp-edges` dans la couche corrective : OK ;
- contrôle des marqueurs 021–034, filtres, cache-busting, build web/mobile et migration : OK ;
- script `scripts/ui-regression-check.mjs` : OK sur l’overlay.

Le ZIP ne contient volontairement pas `app-v11.js`; après extraction dans le dépôt, le même script vérifie en plus la présence des marqueurs 001 et 020 et de la fonction de tirage du jeu de base.

## 9. Limites restantes

- Un ZIP overlay ne permet pas, à lui seul, d’exécuter une vraie session Supabase multijoueur ou Safari iPhone. Les tests double joueur/conflit/reconnexion et le rendu PWA doivent être faits après extraction dans le dépôt et déploiement d’une preview.
- CARTEL et LE RÉGIME n’avaient pas d’implémentation présente sur `main`. Ils sont donc introduits ici comme scénarios 029–031 et 032–034 en réutilisant le moteur standard existant, sans ajouter de nouveau moteur serveur risqué. Leurs pressions/corruptions/délations sont portées par les packs et les trames plutôt que par une réécriture du gameplay.
- TERREUR utilise également le moteur standard dans ce package ; si les packs TERREUR plus détaillés sont déjà installés côté Supabase, la migration les préserve grâce à `ON CONFLICT DO NOTHING`.
