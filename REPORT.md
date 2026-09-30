# Rapport v12.42 — Live Cell

## Cause principale
Le lobby reposait surtout sur un polling fixe (environ 700 ms en lobby). Les mutations serveur étaient correctes mais les autres téléphones n’étaient informés qu’au prochain poll. Les changements rapides pouvaient donc sembler retardés ou désynchronisés.

## Nouveau flux
Une petite table Realtime ne contient aucune donnée de partie : seulement un token opaque, une révision et un timestamp. Des triggers serveur incrémentent cette révision lorsqu’un joueur rejoint, modifie son rôle, quitte, lorsqu’un événement change ou lorsque la cellule change d’état. Chaque client abonné reçoit alors un signal et appelle immédiatement la RPC sécurisée `igr_v4_sync` pour récupérer l’état autorisé.

## Rôles
Le téléphone qui touche un rôle met son interface à jour immédiatement. La requête serveur reste source de vérité. Si deux joueurs prennent presque simultanément un rôle à capacité 1, le serveur tranche et le client refusé est resynchronisé.

## Lancement
Le bouton est verrouillé pendant l’opération, le lobby est resynchronisé juste avant le lancement, les bornes min/max sont contrôlées, les erreurs réseau transitoires sont retentées et un second contrôle confirme que le serveur a réellement quitté l’état `lobby`.

## Entrée
L’écran noir observé sur iPhone/PWA est durci avec un fond d’image CSS disponible avant exécution JS, un fallback vers l’image d’accueil si l’asset principal échoue et un watchdog de sortie si la cinématique se bloque.

## Backend
Migration `20261001_live_room_realtime_v12_42.sql` appliquée sur le projet Supabase actif. La publication Realtime et la RPC de token ont été vérifiées.
