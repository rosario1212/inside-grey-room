# QA — V11.5 Playtest Candidate

## Validé automatiquement / côté serveur

- 20 scénarios présents dans Supabase V4.
- Matrice de rôles min/max valide pour les 20 scénarios, de 4 à 16 joueurs.
- Phase `briefing` testée : le serveur reste en `playing`, masque `secret_role` et `private_state`, puis passe à `role_reading` après expiration.
- La carte privée réapparaît correctement en `role_reading`.
- Photo de profil testée via les RPC sécurisés `igr_v4_set_avatar` et `igr_v4_get_avatars`.
- `igr_v4_tick` reste non exécutable directement par le rôle `anon`.
- 20 presets sonores de scénario référencés et présents dans le moteur.
- 20 vignettes scénario présentes ; 8 affiches détaillées historiques présentes.
- Aucune référence frontend à `igr_v2`.
- Aucun panneau joueur « IA MJ », « Générer une trame » ou « Cycle suivant ».
- Syntaxe JavaScript vérifiée avec `node --check`.
- Tous les assets référencés existent dans le package.

## Modifications UX de cette version

- garde-fou `visualViewport` + `scrollIntoView` pour la saisie pseudo sur mobile ;
- transition de porte : zoom entrant + flash blanc temporaire, jamais un écran blanc persistant ;
- contexte public visible dans le lobby ;
- profil local + avatar partagé dans la cellule ;
- musique de lobby coupée dès que l'hôte lance le dossier ;
- 28 s de briefing silencieux côté musique ;
- narration canonique optionnelle par synthèse vocale ;
- musique propre au scénario à partir de la lecture des cartes.

## À valider humainement

Ces tests sont précisément l'objectif de la V11.5 :

1. iPhone Safari et PWA : clavier ouvert sur pseudo, portrait/paysage.
2. Animation de porte sur plusieurs tailles d'iPhone : aucune sensation de blocage dans le flash.
3. 4–5 joueurs : scénarios 001–006.
4. 5–8 joueurs : scénarios intermédiaires et rôles optionnels.
5. 9 joueurs : scénario 019.
6. 13–16 joueurs : scénario 020 et lisibilité du lobby.
7. WebRTC Wi-Fi ↔ Wi-Fi, Wi-Fi ↔ 4G/5G, 4G/5G ↔ 4G/5G.
8. Fermeture/réouverture de l'app pendant lobby, cycle et phase finale.
9. Qualité réelle des cartes, trames, relations, ambiguïté et durée de chaque scénario.
10. Vérifier que le briefing vocal semble immersif et pas artificiel ; le désactiver si nécessaire pendant les tests comparatifs.

## Hors de cette build

Les nouvelles illustrations cinématographiques des dossiers 009–020 ne sont volontairement pas générées dans cette itération. Elles restent une tâche prioritaire avant la version visuelle/commerciale finale.
