# Inside Grey Room — état courant v712

Inside Grey Room est un jeu social d’enquête multijoueur piloté par une application autonome. Le gameplay principal utilise la couche **v52**, enrichie par le tribunal et le verdict collectif **v711–v712** et couvre les dossiers **001 à 034**.

## Structure de partie actuelle

1. Lecture des cartes privées.
2. Assemblée I du camp Enquête — 05:00.
3. Cycle 1 — enquête, Grey Room et interactions libres.
4. Assemblée II — 04:00.
5. Cycle 2.
6. Assemblée III — 04:00.
7. Cycle 3 — dernières procédures et conclusions.
8. **Avec Juge :** tribunal unique non chronométré, vote secret à majorité collective, révélation. **Sans Juge :** audience et défenses chronométrées, puis même vote collectif et révélation.

L’application fait autorité pour les phases officielles, convocations, chronomètres, preuves, quotas, résultats canoniques et scoring. Les interactions ordinaires entre joueurs restent libres hors procédure officielle.

## Durées canoniques importantes

La référence actuelle pour le mode LONG est :

- interrogatoire : **06:00** ;
- dernier débrief / délibération correspondante : **04:00**.

`TIMER_DURATION_AUDIT_V46_2.md` est la seule référence canonique pour les durées ; l’ancien rapport v46.1 (qui préconisait temporairement 08:00 pour l’interrogatoire LONG) reste accessible dans l’historique Git.

## Contenu

- 34 scénarios principaux audités (`001` à `034`) ;
- moteur multijoueur V4 et état serveur Supabase ;
- cartes privées et rôles publics/spécialisés ;
- trois cycles d’enquête ;
- Assemblées du camp Enquête ;
- Grey Room et procédures officielles ;
- interactions physiques libres hors procédure ;
- audience sans Juge, tribunal unique avec Juge (plan facultatif, débats libres, guide visuel) ;
- responsabilité 0–2 soumise à la majorité absolue par suspect, sans veto du Juge ou du Procureur ;
- échelle d'activité des rôles sur cinq étoiles, variable selon la présence d'un Juge ;
- interface FR / EN ;
- PWA web et builds Capacitor iOS / Android ;
- modes et contenus additionnels présents dans le dépôt, dont HÉRITAGE et DLC thématiques.

## Backend

Le backend de production repose sur Supabase. Les migrations du dépôt constituent l’historique du schéma et des règles serveur ; les fichiers historiques ne doivent pas être interprétés isolément comme la règle actuelle lorsqu’une migration corrective plus récente les remplace.

## Build et déploiement

**Un seul Worker est publié en production : `inside-grey-room-last`.** Le déploiement continu se fait par `.github/workflows/cloudflare-production-deploy.yml`, avec tests, compilation, publication et vérification du commit. Pour relancer manuellement le déploiement, utiliser son `workflow_dispatch`.

Le workflow `.github/workflows/cloudflare-turn-maintenance.yml` ne publie plus de version : il sert uniquement à contrôler ou configurer les identifiants TURN lors d'une maintenance manuelle. Le fichier `vercel.json` reste un **blocage de sécurité minimal** : ses anciens projets liés à GitHub doivent ignorer les builds, jamais servir le jeu. Ne le supprimer qu'après déconnexion vérifiée des anciennes intégrations.

Voir [la procédure de nettoyage et les intégrations externes encore à retirer](docs/CLOUDFLARE_ONLY_MAINTENANCE.md).


Prérequis : Node.js 22+.

- `npm run build` : construit le bundle web dans `dist` et exécute les garde-fous de régression ;
- `npm run mobile:build` : construit le bundle natif dans `www` ;
- `npm run store:check` : valide le bundle mobile et les prérequis de publication ;
- `npm run deploy` : construit puis déploie via Wrangler / Cloudflare.

Pour la finale, consultez `TRIBUNAL_UNIQUE_V708.md` (v712) et `REGLEMENT_ROLES_V696.md` (consolidé). Le service worker concerne le bundle web/PWA. Le bundle natif `www` n’a pas besoin d’embarquer un service worker.

## Playtests

Les audits automatisés vérifient la structure et de nombreuses transitions, mais ils ne remplacent pas les parties réelles sur plusieurs téléphones et réseaux. Les priorités de validation humaine sont maintenues dans `PLAYTEST_NEXT.md`.

## Principe de vérité canonique

En cas de contradiction entre un ancien rapport et le runtime courant, privilégier :

1. la migration corrective la plus récente côté serveur ;
2. la dernière couche runtime chargée par le build ;
3. les checkers de régression correspondant à cette couche ;
4. la documentation la plus récente explicitement marquée comme remplaçant une version antérieure.
