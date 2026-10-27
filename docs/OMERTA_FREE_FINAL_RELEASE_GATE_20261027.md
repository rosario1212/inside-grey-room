# OMERTÀ — clôture technique sans coût additionnel (27 octobre 2026)

**DÉCISION : CANDIDAT DE SORTIE VERROUILLÉ, NON PUBLIÉ.** Les cinq dossiers historiques existants restent disponibles dans leur version actuelle. Les nouveaux manuscrits privés ne sont ni livrés au client ni exposés dans GitHub.

## Fonctionnel, testé par PostgreSQL 16 isolé (GitHub Actions)

- **Indic oral-first (ancien canon)** : négociation, signal d'intention sans points, trois informations appartenant réellement au personnage, transmission à l'enquêteur, une consignation par cycle, score de coopération authentifié, avantage égoïste distinct et élimination/préservation cohérentes.
- **A/B/C à partie indépendante** : choix aléatoire par salle et numéro de match, variation au rematch, snapshots immuables et refus des manuscrits non approuvés, avec protection des tables et RPC privés.
- **Distribution et accès** : 4–8 joueurs, répartition unique de 7 personnages sur l'exemple à 8 joueurs, conservation après reconnexion, fiche limitée au jeton et au slot de *ce* match, briefing public filtré.
- **Cycle III** : émission automatique d'une synthèse documentaire rédigée pour l'enquête, appuyée sur deux sources canon distinctes, événement privé, pas de doublon, pas d'émission dans les anciennes salles.
- **Clôture** : texte final accessible seulement après `finished` aux participants du match courant, niveaux de responsabilité 0–2 par personnage attribué. Les niveaux sont descriptifs : ils ne décident pas seuls de la condamnation ni des conditions de victoire.
- **Démarrage A/B/C optionnel** : `public.igr_omerta_start_standalone` autorise seulement l'hôte, refuse la salle hors lobby et un canon non approuvé, épingle la variante dans une transaction, démarre le moteur hérité, remplace les fiches et le contexte hérité puis consigne `omerta_standalone=true`. Les tests utilisent une maquette stricte de l'ancien RPC, **pas une partie réelle Supabase**.
- Le fichier SQL complet est encore sous `supabase/candidates/`, et le workflow lance les tests à chaque modification du candidat, des fixtures ou des contrôles.

## Vérifications directes en lecture seule sur le vrai projet Supabase

| Dossier | Variantes stockées | Postes par variante | Approbations humaines | Garanties C3 vérifiées |
| --- | ---: | ---: | ---: | ---: |
| 021 | 3 | 7 | 0 | 0 |
| 022 | 3 | 7 | 0 | 0 |
| 023 | 3 | 7 | 0 | 0 |
| 024 | 3 | 8 | 0 | 0 |
| 025 | 3 | 9 | 0 | 0 |

- 114 fiches de rôle au total, toutes avec objectifs et connaissance renseignés, ainsi qu'un niveau de responsabilité défini.
- Aucun manque structurel détecté parmi les références documentaires C3 des 15 variantes, **mais** toutes les métadonnées de revue humaine restent `pending`.
- **Contradiction canonique vérifiée : les 15 manuscrits contiennent Verri et 0 ne contient Santoro.** Le contrat de release autonome exige explicitement `manuscript.saga.family='SANTORO'` pour chaque variante. Le test négatif Verri assure qu'un dossier ancien ne peut pas être approuvé sous le nouveau nom par erreur.

## Ce qui empêche toujours la vraie publication

1. **Édition / canon :** réécriture ou décision éditoriale documentée de la saga (Verri vs Santoro) ; relecture des 15 vérités A/B/C et de leurs textes, puis certification humaine des sources et vérification jouabilité du recoupement C3. Ne pas changer artificiellement les états `review`, `human_source_review` ou `release_eligible`.
2. **Parcours client :** l'interface normale lance encore l'ancien RPC de démarrage et utilise `igr_v4_sync` ; elle n'appelle pas encore les lectures propres aux variantes. Il faut un branchement opt-in du démarrage, une synchronisation qui supprime les contextes et événements Verri, puis des tests sur deux appareils.
3. **Compatibilité Indic :** les trois cartes `igr_omerta_money_intel_options` lisent encore `public.igr_v4_scenario_packs` et les identités de Verri. Il faut une source d'informations exactes et vérifiables par slot et variante, validée par l'auteur, avant d'activer l'Indic dans les nouvelles parties.
4. **Conclusions / objectifs :** le lecteur de conclusion A/B/C est sûr en isolation, mais le RPC officiel de victoire `igr_omerta_make_reveal` calcule toujours une partie des rôles avec les anciens packs. Les objectifs des joueurs et les rangs doivent être raccordés à la même variante épinglée. Un vrai test de 4 à 8 joueurs doit couvrir décès, détention, fausse piste, protection, sortie du jeu, victoire et rematch.
5. **Validation de production :** vérifier migrations réelles, RLS, reprise d'une partie en cours, données inter-appareils, phases de jeu, anti-doublon et rollback sur la stack actuelle avant fusion `main` et déploiement Cloudflare.

## Politique zéro coût additionnel

Les tests PostgreSQL 16 éphémères passent par les ressources GitHub déjà connectées, sous réserve du quota déjà inclus. Aucun branchement Supabase payant et aucun service neuf n'ont été créés. Les migrations existantes de production, les données des joueurs et Cloudflare n'ont pas été modifiés.

**Statut acceptable pour la PR #379 :** prépublication en brouillon et CI verte. Ne jamais dire « publié », « jouable en production » ou « 15 variantes certifiées » tant que ce document n'est pas effectivement mis à jour sur des vérifications réelles.
