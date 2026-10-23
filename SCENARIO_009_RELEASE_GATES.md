# Dossier 009 — Le Sujet 17 · Refonte privée v330

> **État du 24 octobre 2026 :** trois variantes A/B/C retravaillées dans Supabase privé, avec un constructeur v330 installé et testé. **La refonte n'est pas encore raccordée au runtime public du 009, et n'est pas publiée.** Aucun changement n'a été apporté au dossier 017.

## Intention éditoriale

Le Sujet 17 retire explicitement son consentement. Le protocole ORPHÉE continue. Un médecin est victime d'une chute puis présente une amnésie récente authentique. L'enquête doit distinguer ce que les documents démontrent, le devoir clinique, l'auteur de la décision et la valeur très limitée d'un souvenir absent pour reconstituer un acte passé.

### Trois responsabilités réellement distinctes

| Variante | Pivot sans révélation des réponses |
|---|---|
| A | La poursuite résulte-t-elle d'un ordre de la direction malgré une alerte reçue ? |
| B | Une recommandation de suspension a-t-elle été ignorée par une décision clinique individuelle ? |
| C | Une modification documentaire a-t-elle transformé un retrait explicite en simple hésitation ? |

## Travail terminé dans le schéma privé

- Trois trames documentées et **obligatoires** par variante, une par cycle. Le troisième cycle permet de résoudre la responsabilité sans investiguer une pièce facultative.
- Neuf investigations facultatives par variante, réparties par groupe de trois et avec des résultats distincts.
- Reconstruction en trois axes : `withdrawal`, `decision` et `decoy`.
- Le rôle de l'amnésie est traité scientifiquement : une évaluation convergente peut étayer le trouble, mais ne prouve pas à elle seule la sincérité d'un récit, l'intention ou une décision antérieure.
- Trois fiches de suspects et leurs relations existantes préservées. Les solutions détaillées demeurent exclusivement dans Supabase privé.
- Constructeur privé `igr_private.igr_v330_009_build_pack(text)` installé. Les rôles `anon` et `authenticated` ne disposent d'aucune permission d'exécution directe.

## Audits effectués sur Supabase

- A, B, C : 3 suspects, 3 trames, 9 investigations, 3 sources de relations, 3 axes de verdict ; responsabilités : A=[1,2,0], B=[2,1,0], C=[1,2,0].
- 60 constructions aléatoires du constructeur privé : A=25, B=21, C=14 ; **60 sur 60 valides**.
- Chaque manuscrit reste en `editorial_status='review'` ; `content_md5` vérifié ; `human_playtest_verified=false`.
- Non-régression de la version actuelle du 009 : salon temporaire à cinq joueurs avec un Enquêteur, un Analyste et trois Suspects ; statut `playing` atteint. Transaction annulée sans aucune donnée de test persistante.

## Restant avant la publication de v330

1. Approfondir les cartes privées : connaissances réelles avant la chute, mensonges distincts, confrontations entre les suspects.
2. Versionner le constructeur privé dans le dépôt sans copier aucune des histoires secrètes. La tentative actuelle d'écriture du fichier de migration sur GitHub a été refusée par les contrôles de sécurité ; ne pas déclarer cette étape accomplie.
3. Raccorder le tirage de A/B/C au salon à l'aide d'un instantané privé figé, distribuer les fiches, les trois révélations garanties et les investigations aux rôles autorisés.
4. Ajouter l'interface de reconstruction du 009 et la notation côté serveur, uniquement après la clôture, sans fuite anticipée de la vérité.
5. Exécuter des parties complètes avec cinq joueurs simulés et un test humain réel, vérifier la reconnexion et les non-régressions du 001–008 et du 017.
6. Revue de plausibilité scientifique et validation éditoriale, puis merge, déploiement Cloudflare et activation Supabase.

**Ne pas fusionner ce brouillon comme une publication.**
