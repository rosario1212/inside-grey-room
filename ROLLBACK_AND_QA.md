# Rollback & QA — v13 flow

## Ne pas casser le fallback

La condition de sécurité serveur est : scénarios `001` à `020` uniquement. Toute autre valeur prend le chemin v12.

## Régressions les plus dangereuses

1. Un client v12 rejoint une room v13 et affiche un nom de phase inconnu.
2. Une room reste bloquée dans `event_select` parce qu’aucune option n’est disponible.
3. Une phase chronométrée arrive à 00:00 mais aucun client ne sync immédiatement.
4. Un joueur reconnecté perd ses objectifs privés.
5. Les participants d’une Assemblée C3 voient des informations qui ne leur étaient pas destinées.
6. Un Journaliste reçoit une piste privée non écrite pour lui.
7. Le service worker sert un JS v12 avec un HTML v13.
8. Le fallback DLC passe par une fonction v13 par erreur.

## Protections présentes

- le catalogue d’événements est calculé depuis les rôles publics ;
- les pistes journalistiques sont pré-écrites ;
- aucune vérité canonique n’est calculée depuis un comportement humain ;
- la Confrontation et l’Assemblée n’écoutent jamais la conversation ;
- la couche client n’ajoute aucun polling ;
- les chronos restent dans `phase_ends_at` serveur ;
- les DLC empruntent le corps v12 dans les fonctions remplacées ;
- les anciens fichiers ne sont pas supprimés.

## Test de durée

Le but n’est pas de réduire artificiellement le temps total. Vérifier plutôt :

- aucune attente passive > 8 minutes pour les rôles spécialisés ;
- alternance des formes au C2/C3 ;
- pas de même paire en Confrontation répétée sans raison ;
- les Suspects parlent naturellement en Salle d’attente ;
- l’Expert ne monopolise pas la Grey Room ;
- l’Enquêteur n’a pas besoin de tenir le téléphone pendant les 8 minutes.

## Test éditorial

Pour chaque nouvelle trame :

- factuelle ;
- courte ;
- canonique ;
- pas de « révélation bouleversante » ;
- pas d’adjectifs pour fabriquer la violence ;
- peut guider, brouiller ou recontextualiser ;
- ne prononce pas le verdict à la place des joueurs.

Pour chaque objectif :

- principal clair ;
- secondaire réalisable ;
- relié à un nœud du scénario ;
- Suspect : survie procédurale avant tout ;
- rôle institutionnel : apparence propre ;
- corruption : intérêt privé, jamais pouvoir magique.
