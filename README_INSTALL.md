# Inside Grey Room — v12.42 Live Cell

Correctif ciblé pour la fluidité multijoueur, le lancement de partie et l’écran d’entrée iPhone/PWA.

## À mettre dans GitHub
Décompresser ce ZIP à la racine du dépôt en conservant les dossiers :

- `index.html`
- `service-worker.js`
- `live-cell-v12-42.js`
- `live-cell-v12-42.css`
- `scripts/build-web.mjs`
- `scripts/build-mobile.mjs`
- `scripts/ui-regression-check.mjs`
- `supabase/migrations/20261001_live_room_realtime_v12_42.sql`

La migration Supabase a déjà été appliquée sur la base active ; le fichier SQL doit quand même rester dans GitHub pour que le dépôt corresponde au backend.

## Comportement v12.42
- joueur qui rejoint : invalidation Realtime et synchronisation immédiate chez les autres ;
- joueur qui quitte via `Quitter` : suppression serveur et mise à jour immédiate ;
- choix/changement/suppression de rôle : affichage optimiste sur le téléphone qui agit puis propagation Realtime à tous les autres ;
- taps rapides : seul le dernier choix demandé reste en file, sans double requête concurrente ;
- fallback si WebSocket indisponible : synchronisation active ~360 ms au premier plan ;
- lancement : verrou anti-double-tap, re-sync avant lancement, retries réseau contrôlés et confirmation serveur ;
- entrée iPhone/PWA : image visible avant JS + fallback d’image + watchdog si l’animation reste bloquée.

## Important
Le départ immédiat est garanti lorsque le joueur utilise `Quitter`. Une fermeture brutale du navigateur/app ne peut pas être considérée comme un départ volontaire instantané sans risquer d’éjecter un joueur qui passe simplement l’app en arrière-plan.
