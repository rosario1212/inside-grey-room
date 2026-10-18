# v101 · Verrou immuable de la trajectoire OMERTÀ

Cette migration est une étape d'infrastructure **privée et inactive**. Elle n'active aucune variante de jeu.

- Les cinq épisodes 021–025 doivent posséder chacun trois manuscrits A/B/C approuvés.
- Chaque variante doit avoir un recoupement garanti au cycle III et une association OMERTA/chapitre/branche cohérente.
- La campagne doit être une vraie entrée de `igr_omerta_campaigns`.
- Un verrou en base sur la campagne sérialise deux départs simultanés. L'identifiant de branche ne peut être tiré qu'une seule fois puis reste immuable.
- La branche n'est jamais publiée dans `igr_v4_rooms.state` ni accessible à `anon` ou `authenticated`.
- La fonction est interne ; aucun RPC de démarrage de partie ne l'appelle actuellement.

## Tests et blocages

Tests SQL de sécurité : `anon` et `authenticated` ne peuvent lire ni déclencher ce verrou. L'ensemble des 15 dossiers OMERTÀ sont marqués avec la branche et le chapitre. Aucun verrou n'est créé tant qu'il n'y a pas 15 approbations et les garanties de troisième cycle.

Les 102 variantes 001–034 sans recoupement garanti, les manuscrits 028 non transférés et les cinq chapitres MAÎTRE nécessitant un adaptateur propre demeurent des obstacles. Ne pas résoudre cela par une génération automatique d'indices ni par une approbation artificielle.

## À faire avant les variantes jouables

Une campagne HÉRITAGE requiert un ID d'exécution distinct de son type de campagne. Ne pas utiliser le champ `campaign_id` (type de campagne) comme clé partagée pour toutes les parties. Une migration séparée devra garantir un ID de session immuable, notamment pour CENDRES, KUROI et MAÎTRE.

Les RPC de lancement, de synchronisation, d'indices, de verdict et les mécanismes de fin restent sur les packs actuellement en production. Cette migration n'y touche pas. Un raccordement complet et des parties de test multirôles restent indispensables avant toute activation.
