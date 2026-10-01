# Test report — v13.1 FINAL replay + DLC

## Contrôles exécutés

- `node --check scenario-flow-v13.js` : PASS
- `node --check gameplay-flow-v13.js` : PASS
- `node --check dlc-experience-v13.js` : PASS
- `node --check scripts/install-v13-flow.mjs` : PASS
- `node --check scripts/verify-v13-flow.mjs` : PASS
- `node scripts/verify-v13-flow.mjs` : **45/45 PASS**
- installateur exécuté deux fois sur un mock de la structure actuelle : **idempotence PASS**
- JSON replay : **34/34 scénarios**, minimum 3 directions canoniques chacun
- équilibre lexical SQL principal : PASS
- équilibre lexical SQL replay/DLC : PASS

## Ce qui est réellement implémenté dans le bundle

- socle v13 de rythme 001–020 ;
- registre des mécaniques signature 021–034 ;
- HUD/état narratif DLC prêt à être branché ;
- primitives serveur pour sélectionner une variante sans l’exposer au client ;
- refus de considérer un scénario replay-ready avec moins de 3 variantes ;
- contrats d’auteur pour 3 directions canoniques minimum sur chacun des 34 scénarios ;
- documentation précise de la ville TERREUR, de la Famiglia OMERTÀ, de la pression CARTEL et du pouvoir réel LE RÉGIME.

## Garde-fou important

Les 102 directions décrites dans `scenario-replay-contracts-v13.json` sont des **contrats canoniques**, pas des preuves générées automatiquement. Une direction doit recevoir ses cartes privées, relations, objectifs, trames et révélation complètes avant d’être ajoutée à `pack.replay_variants`. Le moteur refuse donc de « fabriquer » une intrigue au milieu d’une partie.

## Non exécuté volontairement

- aucune migration appliquée à Supabase production ;
- aucun push ou merge GitHub ;
- aucun playtest multijoueur physique ;
- aucun test iPhone/Android physique ;
- aucune variante incomplète activée en production.

Ces tests restent obligatoires avant fusion dans `main`.
