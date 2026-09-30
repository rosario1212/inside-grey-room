# Rapport v12.37 — Inside Grey Room

## 1. Corrections reprises

- carte « Retirer mon choix » ajoutée au-dessus du tirage aléatoire ;
- ancien « Retirer mon choix » inférieur conservé ;
- correction d’un risque de boucle : la nouvelle carte n’essaie jamais de cliquer sur elle-même ;
- tirage sécurisé OMERTÀ/base conservé (`crypto.getRandomValues`, anti-double-tap, resync, capacités) ;
- affiches OMERTÀ 021–025 HQ conservées ;
- rouge OMERTÀ étendu au fond et aux grands panneaux du détail/lobby ;
- filtres de scénarios sticky ;
- nettoyage des classes de thème DLC quand on revient à la liste ou à un scénario de base ;
- détection du scénario visible renforcée pour empêcher 021 de remplacer l’image d’un dossier 001–020.

## 2. Images finales intégrées

### OMERTÀ
- 021 `omerta-021-l-enveloppe.webp`
- 022 `omerta-022-omerta.webp`
- 023 `omerta-023-la-table.webp`
- 024 `omerta-024-il-pentito.webp`
- 025 `omerta-025-il-don.webp`

### TERREUR
- 026 `terror-026-la-ville-tombe.webp`
- 027 `terror-027-la-zone-rouge.webp`
- 028 `terror-028-dernier-perimetre.webp`

### CARTEL
- 029 `cartel-029-le-cycle-mort.webp`
- 030 `cartel-030-la-cour-achetee.webp`
- 031 `cartel-031-la-dette.webp`

### LE RÉGIME
- 032 `regime-032-les-archives-du-palais.webp`
- 033 `regime-033-la-dynastie.webp`
- 034 `regime-034-les-noms-quils-portaient.webp`

Les 14 affiches sont validées en **1086×1448**, WebP, ratio portrait 3:4.

## 3. Identités visuelles

- OMERTÀ : rouge/bordeaux sombre ;
- TERREUR : noir anthracite oppressant ;
- CARTEL : brun/noir + accents dorés sales ;
- LE RÉGIME : bleu gris froid / archives.

Les thèmes s’appliquent à la page, aux panels et aux cellules de lobby/rôles du DLC actif.

## 4. Accès privé TERREUR / CARTEL / LE RÉGIME

Le runtime interroge `igr_omerta_access_status` à partir de l’identité sociale existante. Pour 026–034, seul `level === 'owner'` est considéré comme autorisé. Les testeurs OMERTÀ restent donc verrouillés sur ces trois DLC. La sélection des scénarios 026–034 est également interceptée et refusée si le profil n’est pas propriétaire.

## 5. Tests exécutés

- `node --check omerta-v12-37.js`
- `node --check terror-v12-37.js`
- `node --check dlc-suite-v12-37.js`
- `node --check service-worker.js`
- `node scripts/validate-dlc-assets.mjs`
- `node scripts/ui-regression-check.mjs`

Tous passent dans l’overlay.

## 6. Limite restante

L’archive n’ajoute pas une nouvelle RPC Supabase de création de cellule spécifiquement sécurisée pour 026–034. Le verrou propriétaire est appliqué dans l’application en réutilisant le statut serveur OMERTÀ existant. Pour une commercialisation, une deuxième étape peut durcir aussi la création serveur de ces cellules.
