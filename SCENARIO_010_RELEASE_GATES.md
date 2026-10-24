# Dossier 010 — LE BRUIT DES MURS · Refonte privée v350

**État : chantier commencé le 24 octobre 2026, non publié.** La version publique historique reste inchangée. Le dossier 009 reste publié.

## Identité et structure

Nora Weiss a été trouvée derrière une paroi technique. Le vrai enjeu n'est pas seulement *qui a fermé la porte*, mais **qui savait qu'elle était vivante, à quel instant, et qui a choisi de ne pas l'aider**.

Trois variantes privées, chacune avec une cause et un ordre d'actions différent : enfermement volontaire suivi d'une seconde décision indépendante ; verrouillage initial accidentel suivi de deux omissions conscientes ; maintien planifié et seconde fermeture après pression.

**Format conservé : cinq joueurs** (un Enquêteur, un Analyste, trois Suspects). Les trois variantes gardent leurs conclusions privées différentes. Aucun coupable ne doit être inventé par simple proximité.

## Travail effectué en privé dans Supabase

Les trois manuscrits privés de `igr_private.igr_v99_variant_manuscripts`, exclusivement `scenario_id='010'`, contiennent maintenant :
- `v350_runtime_trames` : trois preuves documentaires **garanties** par variante, une par cycle, dont une reconstitution décisive au cycle 3.
- `v350_investigations` : neuf pistes facultatives à identifiants uniques, réparties en trois choix par cycle, sans information indispensable exclusivement facultative.
- `v350_verdict` : décision de fin de partie sur les axes `origin`, `door`, `signal`, avec réponses distinctes pour A/B/C.
- `v350_editorial` : suivi transparent, revue des sources fictives encore `pending`, `human_playtest_verified=false`.

Le constructeur `igr_private.igr_v350_010_build_pack(text)` est installé et versionné dans `supabase/migrations/20261024050000_igr_v350_010_private_pack_preview.sql`. Il ne divulgue ni les manuscrits ni les solutions sur GitHub ; les rôles `anon` et `authenticated` n'ont pas la permission d'exécution directe.

## Contrôles réellement exécutés

- Les variantes **A, B, C** génèrent chacune 3 suspects, 3 trames obligatoires, 9 investigations facultatives, 3 relations source et 3 axes de verdict.
- **60 constructions aléatoires valides sur 60** : A=24, B=18, C=18.
- Accès direct au constructeur privé refusé aux rôles client.
- Aucun salon de test créé ou conservé pour ce chantier.
- L'ancien contrôle éditorial reste bloquant : `approved=0`, `release_eligible=false`, validation des sources du cycle 3 encore non actée. Les nouveaux éléments ne sont pas présentés à tort comme ayant reçu une revue humaine.

## À réaliser pour achever le 010

1. Réécrire et confronter les fiches privées des trois suspects, sans fuite d'information entre joueurs.
2. Relier l'assignation A/B/C à un instantané privé immuable par salon et contrôler les créations non autorisées.
3. Diffuser une preuve obligatoire par cycle et uniquement les choix optionnels du cycle en cours au camp Enquête.
4. Ajouter les décisions `origin/door/signal` au verdict final et au calcul privé de révélation.
5. Tester au moins A, B, C de bout en bout avec cinq joueurs simulés, vérifier rôle, reconnection, quotas d'investigation, secret du scénario, régressions 007–009 et comparaison des conclusions.
6. Fusionner et déployer seulement après contrôles verts. Ne jamais déclarer qu'un test humain a eu lieu s'il n'a pas été effectué.

**Note : cette PR est un chantier privé, pas un certificat de publication.**
