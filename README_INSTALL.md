# Inside Grey Room — v12.37 final DLC visuals + corrections

**Base actuelle vérifiée : `main` @ `0647924895902a953c9187c19d3a78430d65836b`**

Ce ZIP est un **overlay minimal** destiné à être extrait à la racine du dépôt `rosario1212/inside-grey-room`.

## Installation

1. Partir de `main` à jour.
2. Créer une branche propre, par exemple `fix/v12-37-final-dlc`.
3. Extraire **le contenu du ZIP à la racine du dépôt** et autoriser le remplacement des fichiers du même nom.
4. Ne pas committer le ZIP lui-même.
5. Conserver les sous-dossiers `assets/`, `scripts/` et `supabase/migrations/` exactement comme dans l’archive.
6. Si la migration `supabase/migrations/20260930_dlc_suite_026_034.sql` n’est pas encore appliquée à Supabase, l’appliquer avec le workflow habituel.
7. Lancer :

```bash
npm ci --no-audit --no-fund
node scripts/validate-dlc-assets.mjs
node scripts/ui-regression-check.mjs
npm run build
npm run mobile:build
```

## Ce que contient cette version

- **BASE 001–020** : correction de la fuite visuelle OMERTÀ ; aucune image DLC ne doit remplacer un scénario de base.
- **Choix de rôle** : nouvelle carte **RETIRER MON CHOIX** juste au-dessus de **RÔLE AU HASARD**, tout en conservant le lien inférieur existant.
- **OMERTÀ 021–025** : affiches HQ conservées, identité rouge étendue à la page/lobby/détail, tirage sécurisé conservé.
- **TERREUR 026–028** : identité noire/oppressante + les 3 affiches Inside Grey Room finales générées pour chaque scénario.
- **CARTEL 029–031** : les 3 affiches latino/cartel finales (favela, pression, machettes/ambiance criminelle) sont utilisées directement dans liste et détail.
- **LE RÉGIME 032–034** : les 3 affiches finales dédiées sont utilisées directement dans liste et détail.
- **Filtres de scénarios** : la barre reste accessible pendant le scroll grâce à un comportement sticky ; les sous-filtres DLC restent disponibles.
- **Accès privé** : TERREUR, CARTEL et LE RÉGIME utilisent le même statut d’identité que l’accès OMERTÀ, mais seuls les profils avec niveau `owner` voient et ouvrent ces scénarios ; un accès `tester` OMERTÀ ne déverrouille pas ces trois DLC.
- **Service Worker** : cache `igr-v12-37-final`, avec cache-busting sur les 14 affiches DLC.

## Vérification iPhone/PWA recommandée

- scénario 001 : image d’origine, aucune image 021 et aucun rouge OMERTÀ ;
- filtres : scroll long sans devoir remonter en haut ;
- 021 : détail et lobby rouges, y compris le grand conteneur autour du dossier ;
- lobby : carte « Retirer mon choix » au-dessus du hasard + lien inférieur toujours présent ;
- 026–034 : bonne affiche pour chaque dossier ;
- TERREUR : noir sombre ; CARTEL : doré/brun sale ; LE RÉGIME : bleu froid ;
- connexion avec le profil propriétaire : 026–034 visibles ; profil non-owner : sections verrouillées et sélection bloquée.

> La restriction 026–034 est alignée sur l’identité propriétaire déjà utilisée par OMERTÀ dans le runtime. Elle bloque l’affichage et la sélection côté application. Cette archive n’introduit pas une nouvelle RPC Supabase distincte de création de cellule pour ces trois DLC.
