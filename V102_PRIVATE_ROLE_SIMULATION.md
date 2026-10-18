# V102 — Simulation confidentielle des cartes et révélations

**Il s'agit d'un banc d'essai privé, pas d'une activation des variantes en production.**

Une fonction interne Supabase prévisualise le briefing public, la carte privée du rôle demandé et les seuls indices visibles pour un cycle donné. Elle ne restitue jamais la vérité finale, la carte des responsabilités, la chronologie canonique intégrale ou la lettre A/B/C dans sa réponse. Elle n'est accessible ni à `anon` ni à `authenticated`.

## Résultats contrôlés sur le projet

- 144/144 manuscrits stockés produisent les trois réponses simulées (enquêteur, joueur, juge).
- Aucune vérité directe dans les payloads ; aucun mauvais destinataire de carte ; aucun indice d'enquête transmis au suspect ou au juge générique.
- MAÎTRE : le juge ne reçoit que les deux révélations publiques prévues au cycle III et reçoit uniquement la carte du juge (pas celle du Client).
- Un test conditionnel : 1 indice visible sans action, 2 avec action vérifiée, 3 avec un indice facultatif effectivement débloqué.
- Aucun RPC public de lancement, de révélation, de verdict ou de synchronisation n'est modifié.

## Conception pour le gameplay final

Dans le jeu en ligne, **les décisions d'autoriser une action conditionnelle ou un indice facultatif devront venir du serveur**, jamais d'une liste libre fournie par le navigateur. Le simulateur accepte des tableaux d'actions uniquement parce qu'il est une fonction d'essai interne et sans accès client.

Les 102 preuves finales à travailler, les trois variantes 028 bloquées au chargement, les approbations humaines, le verrou des campagnes CENDRES/KUROI/MAÎTRE et l'intégration de tous les lecteurs du pack restent des conditions préalables à l'activation.

Ne pas exposer cette fonction, ses arguments, les manuscrits ni leurs indices par des RPC accessibles aux joueurs.
