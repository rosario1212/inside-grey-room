# OMERTÀ — vNext · audit de publication (27 octobre 2026)

**Décision : ne pas activer les variantes A/B/C ni déployer le nouveau moteur d'Indic en production avant les validations ci-dessous.**
Ce document n'est pas un certificat de publication. Il décrit l'état du chantier GitHub et les contrôles de Supabase réellement effectués.

## Ce qui a été implémenté sur la branche

- Recrutement confidentiel d'un suspect en tant qu'Indic par l'Enquêteur, acceptation/refus, un Indic actif par match (scénarios 021–025).
- Trois sujets privés issus du **canon existant** et des fiches personnelles, présentés comme trois titres. Les détails restent repliables.
- « Je souhaite en parler » : notification d'intention à l'Enquêteur, sans transmettre le texte secret et sans crédit de coopération.
- « J'en ai déjà parlé » : consignation volontaire d'un fait issu de la fiche personnelle, côté serveur, avec événement privé pour l'Enquêteur ; une consignation par cycle et protection contre les doublons.
- À la fin, l'Enquêteur vote Oui / Non. **Oui valide la deuxième condition indépendamment des cartes**, même si aucun renseignement n'a été consigné. Non n'est pas un veto automatique lorsqu'un renseignement canonique éligible existe.
- Victoire complète de la source recrutée = **intérêt personnel** (protection officielle accordée OU remise de peine d’au moins trois ans), **coopération** (Oui de l'Enquêteur OU preuve canonique éligible), et **survie**. Ces trois axes sont indépendants ; l'ancien objectif de loyauté d'un suspect ne détermine plus une fois devenu Indic.
- L'Enquêteur peut officialiser une **protection négociée oralement** sans utiliser les anciens points de révélation, par la nouvelle fonction protégée `igr_omerta_indic_protect` ; une seule décision par source, événements privés. Les autres rôles et règles de révélation antérieures demeurent inchangés.
- Intégration au bundle web, au bundle mobile, au service worker et aux tests dédiés.

## Ce qui est vérifié

- Le pack canonique actuellement utilisé par le jeu dispose, pour 021–025, de **7, 7, 7, 8, 9** personnages respectivement, chacun avec secret, chronologie et au moins un fait établi.
- Une branche de développement GitHub contient les migrations, l'interface et le script de garde du verdict ; la suite CI dédiée « Omerta Informant QA » est passée.
- Vérifications d'isolation sur les tokens et rôles, unicité de l'accord, privacy des événements, séparation du signal et de la transmission, frontières de match `match_no`, rôle de l'Enquêteur pour le vote final.
- Les scripts de construction web et Android/iOS transportent les nouveaux fichiers, et les contrôles de cache hérités ont été respectés.

## Variantes A/B/C : état serveur réel

| Épisode | Brouillons A/B/C présents | Vérités distinctes | Approbations éditoriales | Révélations cycle III à provenance vérifiée | Eligible |
|---|---|---|---|---|---|
| 021 | 3 | 3 | 0 | 0/3 | NON |
| 022 | 3 | 3 | 0 | 0/3 | NON |
| 023 | 3 | 3 | 0 | 0/3 | NON |
| 024 | 3 | 3 | 0 | 0/3 | NON |
| 025 | 3 | 3 | 0 | 0/3 | NON |

Les 15 variantes sont en état `review`; le verrou de saga A/B/C est dormant et ne doit jamais être contourné pour obtenir artificiellement `release_eligible=true`. Le moteur de cartes est bâti sur le canon actuellement actif : si une variante future change le secret d'un joueur, la comparaison serveur bloque une carte incompatible.

## Points empêchant une publication de la nouvelle version complète

1. Valider éditorialement, réellement et individuellement les 15 manuscrits, ainsi que leurs trois chaînes narratives de cinq épisodes.
2. Établir la provenance vérifiée et non facultative du recoupement du cycle III pour chaque variante.
3. Verrouiller automatiquement la branche A/B/C dès le lancement et l'utiliser dans tous les lecteurs serveur (fiche privée, événements, synchro, reconnection, verdict et continuation) **sans fuite côté client**.
4. Tester les migrations SQL avec parties multijoueurs sur une base Supabase de développement. **Aucune branche de test créée ici** : Supabase a demandé un consentement explicite à un coût de branche avant sa création.
5. Vérifier le contrat des objectifs personnels, par rôle et par variante, en particulier `pentito`, `contabile`, et les conversions tardives en Indic.
6. Préserver les choix canoniques de l'univers et préparer le renommage de la Famiglia Verri vers Santoro souhaité pour la nouvelle mouture, sans incohérence sur les cinq chapitres.
7. Faire passer les contrôles web, mobile, confidentialité, et un playtest humain complet avant de fusionner sur `main`.
8. Appliquer les migrations côté Supabase AVANT la mise en ligne du client ; ne pas activer un bouton qui appellerait une RPC inexistante.

**État opérationnel :** le moteur de base public 021–025 continue de fonctionner avec son canon préexistant. La nouvelle version d'Omertà n'a pas été publiée en production par ce chantier. 

## Contrôle de compilation et gameplay serveur — effectué

Le 27 octobre 2026, les **quatre scripts de migration** ont été chargés successivement dans une **transaction explicite `BEGIN … ROLLBACK` sur le serveur de base**. Un point-virgule manquant à la fin du moteur de verdict a été trouvé et corrigé. La compilation finale a réussi. **Aucune fonction nouvelle n'a été persistée en production.**

Le test `supabase/tests/omerta_vnext_runtime_rollback.sql` a ensuite été exécuté sous la même transaction annulée : les cinq dossiers canoniques 021–025 ont passé les assertions d'authentification, recrutement, consultation des trois cartes, signal ≠ transmission, déduplication, vote final et victoire. Dans le cas 022, l'Indic n'a envoyé **aucune** carte, mais a reçu une protection négociée et l'Enquêteur a répondu « Oui » : le verdict complet a été victorieux. Dans 021, le vote « Non » n'a pas effacé une carte canonique vérifiée. Les dossiers 024 et 025 ont validé la distinction entre coopération non confirmée et fait non évalué. Lecture de contrôle après `ROLLBACK` : **0 salle fictive, 0 action fictive et 0 fonction RPC nouvelle persistées**.

Cela constitue une vérification serveur significative, mais **pas** un playtest multijoueur sur téléphones ni une certification des variantes A/B/C.

## Dernière condition éditoriale non franchie

`igr_private.igr_v100_preflight` renvoie encore `release_eligible=false` pour les cinq dossiers, en raison de **15 approbations humaines manquantes et de 15 preuves du cycle III dont la provenance n'a pas été déclarée vérifiée**. Ne pas utiliser une signature d'approbation fictive ni injecter un `approved_by` artificiel. L'extension aux manuscrits est à différer jusqu'à leur validation réelle et au raccordement complet des lecteurs serveur.
