# Dossier 010 — LE BRUIT DES MURS · Refonte privée v350

> **Intégration technique du 010 réalisée le 24 octobre 2026.** Toutes les fonctions Supabase v350–v359, l'interface et les contrôles v360 sont en place. **24 salons à cinq joueurs simulés** ont tiré A=9, B=8, C=7 avec 15 répartitions de rôles ; **12 parties complètes** ont atteint la révélation (A=2, B=7, C=3). Pas de playtest avec cinq personnes physiques ; l'activation de publication ne doit être enregistrée qu'après déploiement vérifié.


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


## Intégration v351–v360 et vérifications réelles

**Identité complète du dossier** : trois suspects distincts, chacun avec chronologie détaillée, connaissances personnelles et mensonges propres ; 18 relations dirigées adaptées à la vérité A/B/C ; trois révélations garanties (une par cycle), neuf pistes d'enquête facultatives et verdict `origin/door/signal`.

| Composant | Mise en œuvre |
|---|---|
| v350 | Constructeur privé des trois packs avec trois vérités distinctes, neuf investigations et trois preuves obligatoires |
| v351 | Tirage A/B/C aléatoire et instantané privé immuable par salon ; validation de publication |
| v352 | Sécurité au lancement : autorisation serveur puis fixation de l'histoire avant les rôles |
| v353 | Fiches des suspects, trames, synchronisation et révélations lisent le même instantané privé |
| v354 | Présentation des trois titres d'investigations du cycle au seul camp Enquête |
| v355 | RPC investigation : jeton personnel, camp autorisé, phase, quota partagé d'une seule par cycle |
| v356 | Verdict final à trois axes obligatoires, format et valeurs validés côté serveur |
| v357 | Correction de l'exactitude de la reconstruction à la révélation, avec victoire individuelle affectée |
| v359 | Garde serveur sur création de salon : un ancien client ne peut ouvrir le 010 non publié |
| v360 | Vérification de contrat et non-régression du client, branchée au CI préexistant |
| Cache PWA | `app-v11.js?v=20261024-010-variants` et `igr-v38-8-010-variants` |

### Résultats de tests réels

- **60/60** constructions aléatoires privées valides (A=24, B=18, C=18).
- **24/24** salons lancés avec cinq joueurs (A=9, B=8, C=7), 15 distributions de rôles, 24 packs privés complets et 24 synchronisations d'Enquêteur.
- **12/12** parties à cinq joueurs simulés terminées avec la révélation (A=2, B=7, C=3), trois preuves obligatoires et trois investigations exécutées sur les cycles 1/2/3.
- Le Suspect ne voit pas les pistes du camp Enquête ni la solution privée, ne peut pas demander une investigation ; la seconde demande du camp dans le même cycle est refusée.
- Un verdict exact est marqué correct et un verdict incorrect est marqué faux ; le camp n'est pas récompensé injustement.
- Avant le GO de release, une création 010 directe est refusée à la base ; les dossiers 007, 008 et 009 continuent à créer des salons.
- **Aucun salon ni instantané de QA persistant** : les tests ont été annulés transactionnellement.
- **Pas de test humain à cinq appareils** et aucune certification de cette nature ne doit être revendiquée.

**Versionning :** branche `feat/010-bruit-des-murs-private-evidence`, PR #351, sans texte de solution privé dans les fichiers GitHub. Le code peut être fusionné après cinq contrôles CI verts ; déploiement Cloudflare confirmé avant autorisation serveur `eligible=true`.

