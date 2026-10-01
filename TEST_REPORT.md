# Test report — v13.3 HÉRITAGE + Startup Stability

Tests automatisés inclus dans `scripts/verify-v13-3-heritage.mjs` :

- présence des fichiers ;
- syntaxe JavaScript ;
- 10 titres Héritage validés ;
- séparation CENDRES = information / KUROI = relations ;
- APIs CERBÈRES / dettes présentes ;
- HÉRITAGE injecté après « Créer une partie » ;
- aucune injection dans `SCENARIOS` 001–034 ;
- réveil audio sérialisé ;
- récupération après fin de Porte ;
- aucun nouvel intervalle ;
- cadrage iPhone corrigé ;
- covers < 300 KB ;
- installateur exécuté deux fois sans doublons.

Régression manuelle encore nécessaire avant production : iPhone PWA réel (lancement à froid, retour après verrouillage, Bluetooth/AirPods, son coupé/réactivé) et parcours de navigation HÉRITAGE.
