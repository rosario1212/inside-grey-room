# Inside Grey Room — consolidation privée v84 (17 octobre 2026)

## Base conservée
- Branche **feat/role-relations-card-v82** : relations scénarisées et libellés explicites, identité noir/gris et adaptations mobile/ordinateur, tests de rendu.
- PR #246 **fix/igr-multiplayer-watchdog-v82** : réconciliation des écrans après nouvelle phase, récupération sans actualisation manuelle, lancement du salon PC indépendant des avatars/profils.
- Fonctionnalités existantes et DLC conservés, sans modifier les règles ni les données canoniques.

## Consolidation
- Les écrans ne reconnaissent une mise à jour de serveur qu'après un rendu valable; en cas d'erreur, le rendu est retenté.
- La réconciliation dispose d'un contrôle de secours borné; pas de seconde boucle continue inutile.
- Les rubriques « Ce que tu sais de cette personne » et « Ce que tu peux lui demander » remplacent les anciens marqueurs dans l'affichage des relations.
- Les entrées de relation strictement identiques ne sont affichées qu'une fois. Une position identique mot pour mot aux repères n'est pas répétée.
- La chronologie privée distingue heures attestées et simples étapes narratives : « Vers 02 h 50 », « À ce moment-là », « Ensuite ». Les numéros de lignes ne sont plus assimilés à des heures ; les paragraphes répétés sont supprimés à l'affichage sans modifier le scénario.
- L'onglet Chronologie n'affiche plus deux fois des repères identiques à la position. La présentation reste responsive.
- Cache PWA/web renommé en **v84-unified-relations-sync** pour que les clients récupèrent le même bundle.

## À valider avant toute publication
1. Contrôles du build et de synchronisation sur la branche (les tests GitHub ne remplacent pas une session multi-appareils).
2. Partie réelle iPhone, iPad et navigateur ordinateur : arrivée dans le salon, attribution, lancement, briefing, passage de phase, connexion intermittente, retour au premier plan.
3. Vérification narrative de chaque scénario : qualité des relations, chronologie et informations révélées. Ces données n'ont pas été réécrites aveuglément : aucun secret canonique ne doit fuiter.
4. Vérification du déploiement privé : conserver l'authentification, ne pas publier `main` sans accord explicite.

Ce document remplace les demandes de consolidation dispersées, sans effacer les audits historiques.
