# Inside Grey Room — V11.5 Playtest Candidate

Version conçue pour commencer les tests réels en groupe sans modifier la structure fondamentale du jeu.

## Ce qui change

- transition d'entrée retravaillée : zoom dans la porte + flash bref + disparition propre ;
- protection mobile du champ pseudo contre le clavier virtuel ;
- résumé public du scénario affiché directement sous son titre dans le lobby ;
- rubrique Profil : pseudo persistant, photo compressée, statistiques locales de parties ;
- photo du joueur visible dans le lobby et pendant la partie ;
- ajout d'une phase serveur `briefing` de 28 s avant la lecture des cartes ;
- arrêt complet de la musique du lobby au lancement du dossier ;
- briefing vocal canonique en français via la synthèse vocale de l'appareil, désactivable dans Paramètres ;
- aucune IA générative n'invente le briefing ;
- la bande-son spécifique du scénario ne démarre qu'après le briefing, lors de la lecture des cartes ;
- moteur multijoueur V4, cartes privées, MJ autonome, 3 cycles, rôles spéciaux, WebRTC et phase finale conservés.

## Supabase

Le backend nécessaire à cette version est déjà appliqué sur le projet Inside Grey Room. `backend-v11-5.sql` est fourni uniquement comme archive de la migration.

## Déploiement Vercel

Décompresser l'archive et placer **le contenu du dossier à la racine du dépôt GitHub** relié à Vercel. Puis commit / pull request / merge vers `main`. Aucune variable d'environnement n'est requise pour cette version statique.

## Important pour le playtest

Les visuels 009–020 restent les vignettes de travail actuelles. Leur remplacement par de vraies illustrations cinématographiques reste dans la checklist visuelle, conformément à la décision de ne pas générer ces images tout de suite. Cela n'empêche pas de tester le gameplay.

La vidéo WebRTC est intégrée, mais il faut encore la tester sur plusieurs vrais téléphones et plusieurs réseaux. Pour une version commerciale, un relais TURN sera recommandé afin d'améliorer la fiabilité sur les NAT/réseaux mobiles difficiles.
