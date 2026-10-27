# OMERTÀ — gate de fusion et publication (27 octobre 2026)

## CI et état du candidat
- Les contrôles GitHub sont nécessaires, mais ne prouvent pas la jouabilité en production.
- Vérifier le dernier SHA de la PR #379, les six jobs et l'absence de nouveaux échecs après toute modification.
- La fonction de dossier privé doit rendre la carte uniquement au joueur authentifié par son jeton, dès le briefing d'une partie commencée ; avant le démarrage, aucune carte ne doit sortir.

## Bloqueurs de publication Santoro
- Le projet Supabase de production ne contient pas encore la table de brouillons Santoro ni les RPC autonomes ; ne pas activer le nouveau mode.
- Les quinze variantes A/B/C actuellement présentes dans la base sont rattachées à Verri ; ne pas les renommer artificiellement en Santoro.
- Faire valider humainement les 15 textes, les 15 vérités, les objectifs individuels, les sources du recoupement C3 et la compatibilité des rangs.
- Relier le verdict final à la variante, au joueur, au match, à la désignation autorisée et aux preuves de coopération de l'indic. Vérifier l'absence de gain fondé sur l'ancien canon.
- Tester la migration de synchronisation commune avec des salles d'autres scénarios et des clients anciens ; vérifier la non-divulgation de fiches et de vérités.
- Faire une partie réelle à 4–8 joueurs avec reconnexion, mort, détention, fausse piste, rematch et verdict, sur la stack cible.

## Procédure de publication
1. Importer les manuscrits privés après revue et conserver leurs preuves d'approbation dans les tables privées.
2. Exécuter les migrations de manière transactionnelle avec sauvegarde et procédure de retour arrière, sans exposer les RPC internes.
3. Contrôler les politiques RLS, les grants, le scellage du RPC historique et les advisors Supabase.
4. Déployer la version web Cloudflare correspondant exactement au commit testé.
5. Vérifier les flux sur deux appareils, puis seulement activer le switch privé de sortie.
6. Recontrôler les parties historiques et surveiller les erreurs ; désactiver immédiatement le switch en cas de régression.

**Statut : prépublication. Ne pas déclarer publié avant preuve des étapes ci-dessus.**
