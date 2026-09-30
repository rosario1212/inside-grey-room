# Inside Grey Room — v12.35 DLC Suite Overlay

**Base vérifiée : `main` @ `6e1a849b4f1f3c3293f21e29bdbb637a37b2d2c3`**

Ce ZIP est volontairement un **overlay minimal** : il ne contient que les fichiers nouveaux ou remplacés nécessaires à cette correction. Il ne contient pas le dépôt complet, ni `.bak`, ni fichiers debug, ni anciennes variantes.

## Installation propre

1. Partir de la branche `main` à jour.
2. Créer une branche dédiée, par exemple `fix/v12-35-dlc-suite`.
3. Extraire **le contenu du ZIP à la racine du dépôt** en autorisant le remplacement des fichiers du même nom.
4. Ne pas committer le ZIP lui-même.
5. Appliquer la migration `supabase/migrations/20260930_dlc_suite_026_034.sql` avec le workflow Supabase habituel du projet.
6. Lancer :

```bash
npm ci --no-audit --no-fund
node scripts/validate-dlc-assets.mjs
node scripts/ui-regression-check.mjs
npm run build
npm run mobile:build
```

7. Vérifier ensuite sur iPhone/PWA : liste des scénarios, détail 021–025, lobby OMERTÀ, tirage aléatoire, rotation paysage de l’arbre, refresh/reconnexion et cache après mise à jour du Service Worker.
8. Ouvrir une PR vers `main` uniquement si les checks sont verts.

> GitHub ne décompresse pas automatiquement un ZIP committé comme un fichier. Il faut extraire son contenu dans le dépôt (ou donner ce ZIP à l’agent GitHub/Codex en lui demandant de l’extraire à la racine).

## Contenu fonctionnel

- **BASE** : 001–020 — aucune donnée de scénario remplacée.
- **OMERTÀ** : 021–025 — affiches HQ, rouge interne scoppé, tirage sécurisé corrigé, descriptions de rôles concrètes.
- **TERREUR** : 026–028 — LA VILLE TOMBE, LA ZONE ROUGE, DERNIER PÉRIMÈTRE.
- **CARTEL** : 029–031 — LE CYCLE MORT, LA COUR ACHETÉE, LA DETTE.
- **LE RÉGIME** : 032–034 — LES ARCHIVES DU PALAIS, LA DYNASTIE, LES NOMS QU’ILS PORTAIENT.
- **Filtres** : Tous / Base / 001–008 / 009–020 / DLC, puis Tous les DLC / OMERTÀ / TERREUR / CARTEL / LE RÉGIME.

## Principe de sécurité de la migration

La migration utilise `ON CONFLICT DO NOTHING` pour 026–034. Si une version plus riche d’un pack TERREUR est déjà installée côté Supabase, elle n’est donc pas écrasée par le fallback standard fourni ici.
