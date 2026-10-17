# V87 — audit narratif et état de la base

## Constat Supabase au 17 octobre 2026
- 44 packs de scénarios (001–044) avec vérité canonique et informations asymétriques.
- 332 liens dirigés, tous avec une cible valide et une description non vide.
- Les 332 textes sont encore structurés autour des anciennes rubriques « Ton point de départ » et « À mettre sur la table ».
- 38 des 332 liens sont à sens unique (dossiers 021–025 et 044). Cela peut refléter une connaissance asymétrique voulue ; chacun demande une relecture canonique, et non une création automatique de réciprocité.
- Zéro pack contient des variantes canoniques A/B/C actives. Les contrats de rejouabilité du dépôt décrivent des variantes à écrire, pas des vérités déjà disponibles.
- Le debrief du client simplifié envoyait auparavant un axe d’enquête vide. La v87 restaure cet axe pour le directeur des trames.

## Garanties narratives
1. Les métiers, routines, loyautés, liens familiaux, conflits et chronologies ne sont intégrés que lorsqu’ils sont déjà confirmés par le scénario ; aucun passé partagé n’est inventé.
2. Les deux directions d’une relation doivent être compatibles tout en gardant leurs connaissances privées distinctes.
3. Les dossiers de l’Enquêteur restent dans l’onglet Enquête ; l’identité des suspects et le contexte commun sont connus au départ, pas leurs secrets.
4. La progression ne lit que les événements déjà autorisés par le serveur. Sans cible explicite, une révélation reste dans les éléments généraux, et non sur un suspect choisi par heuristique textuelle.
5. Une déclaration, une hypothèse ou une question notée par l’Enquêteur n’est pas une preuve. Le serveur vérifie son jeton, sa place dans la partie et son rôle.
6. Le maître du jeu continue à choisir des trames **préécrites** ; la variation des réponses de fin de cycle et l’axe demandé n’influencent que le classement des trames, jamais la vérité du scénario.
7. Une variante complète doit posséder sa propre chronologie, ses cartes, ses relations dirigées, ses indices compatibles, ses objectifs et sa révélation finale.

## Ce que cette PR propose
- Rendu des relations amélioré sur 001–044, sans déclarer faussement l’absence de contact quand la carte ne le dit pas.
- Dossier évolutif commun aux 44 scénarios avec informations initiales limitées et intégration d’indices révélés.
- Carnet de notes serveur de l’Enquêteur, avec distinction déclaration / hypothèse / à vérifier et accès réservé par RPC.
- Troisième question de debrief pour orienter l’axe, plus comparaison des réponses de cycles consécutifs.

## À ne pas annoncer comme achevé
- Les variantes canoniques A/B/C ne sont ni écrites ni activées.
- Les 332 relations exigent encore un travail éditorial individuel si l’objectif est une richesse littéraire maximale.
- L’adaptation du maître du jeu est déterministe, pas une IA générative analysant les propos oraux.
- La migration et la fonctionnalité ne sont pas en production tant que la sécurité serveur et les playtests n’ont pas été validés.

## Contrôles avant fusion et activation
- Migration Supabase v87 en premier, puis runtime v87 dans Cloudflare.
- Test sur 001, 005, 021, 029 et 035 avec plusieurs tailles de groupe.
- Tests de reconnexion, de notes entre appareils, de conformité des droits et d’absence de fuite de secrets.
- Relecture sur mobile, tablette et ordinateur et analyse des changements de réponses de fin de cycle.
