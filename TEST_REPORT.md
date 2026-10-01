# Test report — v13.2 FINAL replay + DLC + lobby UI

## Contrôles exécutés

- `node --check scenario-flow-v13.js` : PASS
- `node --check gameplay-flow-v13.js` : PASS
- `node --check dlc-experience-v13.js` : PASS
- `node --check lobby-ui-fix-v13.js` : PASS
- `node --check scripts/install-v13-flow.mjs` : PASS
- `node --check scripts/verify-v13-flow.mjs` : PASS
- `node scripts/verify-v13-flow.mjs` : **55/55 PASS**
- upgrade installateur v13.1 → v13.2 : PASS
- installateur v13.2 exécuté deux fois : **idempotence PASS**
- `index.html` : une seule référence CSS + une seule référence JS du correctif : PASS
- service worker : une seule référence CSS + une seule référence JS du correctif : PASS
- cache service worker : `igr-v13-2-final-lobby-fix` : PASS
- JSON replay : **34/34 scénarios**, minimum 3 directions canoniques chacun

## Correctifs v13.2 vérifiés statiquement

- action lobby `← Scénarios` présente ;
- conservation de `createListScrollY` ;
- fallback vers `#scenario-XXX` ;
- dossiers 001–020 explicitement identifiés comme base ;
- classes OMERTÀ/DLC nettoyées dans un lobby de base ;
- style sélectionné 001–020 sans rouge ;
- animation/transformation de la carte sélectionnée neutralisée ;
- chargement du correctif après les couches DLC existantes.

## Fonctionnalités v13.1 conservées

- socle v13 de rythme 001–020 ;
- registre des mécaniques signature 021–034 ;
- HUD/état narratif DLC ;
- primitives serveur de variantes rejouables ;
- 34 contrats anti-mémoire, minimum 3 directions canoniques chacun ;
- TERREUR : ville/quartiers/périmètre/liaison ;
- OMERTÀ : continuité Famiglia ;
- CARTEL : pression institutionnelle ;
- LE RÉGIME : pouvoir réel et surnoms rotatifs.

## Non exécuté volontairement

- aucune migration appliquée à Supabase production ;
- aucun push ou merge GitHub ;
- aucun playtest multijoueur physique ;
- aucun test sur iPhone/Android physique.

Une régression iPhone PWA réelle reste obligatoire avant fusion dans `main`.
