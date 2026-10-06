# Inside Grey Room — état courant v52

Inside Grey Room est un jeu social d’enquête multijoueur piloté par une application autonome. La version courante du gameplay principal utilise la couche **v52** et couvre les dossiers **001 à 034**.

## Structure de partie actuelle

1. Lecture des cartes privées.
2. Assemblée I du camp Enquête — 05:00.
3. Cycle 1 — enquête, Grey Room et interactions libres.
4. Assemblée II — 04:00.
5. Cycle 2.
6. Assemblée III — 04:00.
7. Cycle 3 — dernières procédures et conclusions.
8. Audience finale, défenses, réévaluation et révélation.

L’application fait autorité pour les phases officielles, convocations, chronomètres, preuves, quotas, résultats canoniques et scoring. Les interactions ordinaires entre joueurs restent libres hors procédure officielle.

## Durées canoniques importantes

La référence actuelle pour le mode LONG est :

- interrogatoire : **06:00** ;
- dernier débrief / délibération correspondante : **04:00**.

`TIMER_DURATION_AUDIT_V46_2.md` remplace l’ancienne référence v46.1 qui documentait temporairement 08:00 pour l’interrogatoire LONG.

## Contenu

- 34 scénarios principaux audités (`001` à `034`) ;
- moteur multijoueur V4 et état serveur Supabase ;
- cartes privées et rôles publics/spécialisés ;
- trois cycles d’enquête ;
- Assemblées du camp Enquête ;
- Grey Room et procédures officielles ;
- interactions physiques libres hors procédure ;
- Audience finale v52 avec échelle de responsabilité 0–2 ;
- interface FR / EN ;
- PWA web et builds Capacitor iOS / Android ;
- modes et contenus additionnels présents dans le dépôt, dont HÉRITAGE et DLC thématiques.

## Backend

Le backend de production repose sur Supabase. Les migrations du dépôt constituent l’historique du schéma et des règles serveur ; les fichiers historiques ne doivent pas être interprétés isolément comme la règle actuelle lorsqu’une migration corrective plus récente les remplace.

## Build et déploiement

Prérequis : Node.js 22+.

- `npm run build` : construit le bundle web dans `dist` et exécute les garde-fous de régression ;
- `npm run mobile:build` : construit le bundle natif dans `www` ;
- `npm run store:check` : valide le bundle mobile et les prérequis de publication ;
- `npm run deploy` : construit puis déploie via Wrangler / Cloudflare.

Le service worker concerne le bundle web/PWA. Le bundle natif `www` n’a pas besoin d’embarquer un service worker.

## Playtests

Les audits automatisés vérifient la structure et de nombreuses transitions, mais ils ne remplacent pas les parties réelles sur plusieurs téléphones et réseaux. Les priorités de validation humaine sont maintenues dans `PLAYTEST_NEXT.md`.

## Principe de vérité canonique

En cas de contradiction entre un ancien rapport et le runtime courant, privilégier :

1. la migration corrective la plus récente côté serveur ;
2. la dernière couche runtime chargée par le build ;
3. les checkers de régression correspondant à cette couche ;
4. la documentation la plus récente explicitement marquée comme remplaçant une version antérieure.
