# Dossier 009 — Le Sujet 17 · Refonte privée v330

> **Mise à jour du 25 octobre 2026 — extension facultative à six joueurs.** La configuration précédente (Enquêteur, Analyste et trois Suspects) reste obligatoire à cinq. À six joueurs, un **Expert** rejoint la partie sans modifier les trois variantes A/B/C ni leurs solutions. Le rôle supplémentaire dispose d'une fiche spécifique et n'a pas accès aux investigations réservées à l'Enquêteur et à l'Analyste. Contrôle Supabase : salon de six joueurs, six fiches privées et snapshot de variante vérifiés par transaction annulée. Aucun playtest humain n'a encore été certifié. Les formulations historiques ci-dessous décrivent l'état antérieur à cette extension.


> **Intégration technique du 009 achevée et testée sur Supabase (24/10/2026).** Le moteur tire A/B/C au lancement d'un salon, fige un instantané privé, distribue les cartes, trames et investigations par cycle aux rôles autorisés, verrouille la reconstruction à trois axes et la corrige à la révélation. **24 salons à cinq joueurs simulés** : A=9, B=5, C=10, 12 distributions de rôles. **12 parties achevées** : A=3, B=4, C=5. Cycle 1–3 : 3 trames, 3 investigations, double demande refusée, suspect sans preuve privée. Verdict mal formé refusé ; verdict exact correct, verdict différent faux. Tous les salons tests ont été annulés. Le playtest humain reste non effectué. L'approbation de publication serveur reste fermée tant que le code n'est pas déployé.


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


## Moteur v331–v339 (intégration effective)

- v330 : constructeur privé à 3 suspects / 3 trames / 9 investigations / 3 réponses ; migration restaurée sur GitHub.
- v331 : tirage aléatoire et instantané privé immuable du pack A/B/C, contrôlé par la validation serveur.
- v332 : épinglage du pack avant lancement, sans renouvellement lors d'une reconnexion.
- v333 : les cartes, révélations, suivis et évaluations finales lisent l'instantané unique.
- v334 : seules les options d'investigations du cycle sont montrées aux Enquêteurs/Analystes.
- v335 : investigations RPC avec jeton, rôle, phase et quota partagé par cycle ; refus des suspects.
- v336 : verrouillage de la reconstitution à trois axes exacts.
- v337 : correction individuelle à la révélation ; absence de victoire pour reconstitution erronée.
- v339 : garde-fou de création d'un 009 non publié, appliqué à toute requête SQL, même depuis un vieux client.
- v340 : test de contrat statique CI; l'interface utilise trois sélections et les nouvelles investigations.
- PWA : révision `20261024-009-variants` et nouvelle version du cache synchronisées.

**Tests supplémentaires :** la reconstitution mal formée est refusée ; en fin de partie une reconstitution exacte a `correct=true`, une fausse `correct=false`, et le camp n'est pas marqué complet à tort.

**Le dossier 017 n'est pas modifié.**

> Les parties décrites sont simulées avec les vrais appels du moteur Supabase, pas des tests en présence de cinq personnes. La publication devra être confirmée par le déploiement Cloudflare et `eligible=true` après autorisation du propriétaire. 
