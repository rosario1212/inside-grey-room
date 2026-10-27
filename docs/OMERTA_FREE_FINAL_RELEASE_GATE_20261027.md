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


## Nouvelle passe de correction — contrôles d'intégrité du 27 octobre

Corrections faites et testées après la clôture technique initiale :

- **Rangs mafieux fixes** : le moteur A/B/C ne redistribue plus aléatoirement un rang déjà choisi. Les affectations `caporegime=2`, `pentito=1`, `associato=8` lorsque le Pentito est présent au 024, et tous les rôles narratifs restants demeurent distincts. Tests PostgreSQL avec 8 joueurs sur 021 et 024.
- **Fiches** : `position` reflète l'identité du personnage et non son objectif secret.
- **Événements anciens** : un lancement autonome remplace uniquement le contexte qui vient d'être créé ; les archives des matchs précédents sont préservées. Chaque nouveau contexte comporte désormais un `match_no` et le lecteur le filtre par match.
- **Compatibilité Indic et verdict** : les RPC Verri de négociation, d'information et de verdict refusent les parties autonomes tant que des critères narratifs vérifiés propres à chaque variante n'existent pas. Un refus explicite est préférable à un pacte impossible ou à un gain faussé.
- **Interrupteur privé de publication** : `igr_private.igr_omerta_standalone_release_control` est `enabled=false` par défaut, sans rôle client capable de le modifier. L'autorisation effective impose à la fois cet interrupteur, la revue éditoriale de toutes les variantes du dossier et les exigences structurelles.
- **Lancement depuis le client** : `omerta-v12.js` interroge un RPC de statut réservé à l'hôte. Il appelle le démarreur autonome seulement lorsque le serveur le dit autorisé. L'absence d'un RPC dans une ancienne version serveur conserve le parcours classique, mais une vraie erreur serveur/réseau arrête le démarrage.
- **Synchronisation sécurisée** : `public.igr_omerta_standalone_safe_sync` encapsule la synchronisation existante, élimine `omerta_campaign` et les champs du vieux canon, masque la vérité et le journal des anciennes actions, filtre tous les événements sauf contexte autorisé et recoupements privés du match, et remplace les fiches personnelles par la carte réellement épinglée (ou une fiche d'enquête générique sans secrets Verri). L'appel est relié au client `app-v11.js`, y compris la synchronisation de l'horloge ; la réponse des salles historiques n'est pas modifiée. Les tests PostgreSQL injectent des faux secrets Verri pour contrôler la redaction, sans copier de données privées dans GitHub.
- **CI renforcée** : le workflow Omerta Informant QA réagit maintenant aux fichiers SQL candidat, aux tests, à `app-v11.js` et à `omerta-v12.js`. Les tests Node contrôlent aussi l'absence de fallback silencieux et de calcul de victoire Verri en mode A/B/C.

**Tests vérifiés** : la suite `Omerta Informant QA` et `Store Readiness` passent sur le commit `111fc981ad77bcc9253d73c0ff7adfb7721082fc` ; les builds Android, iOS, Cloudflare et Screen Layout étaient encore en cours lors du contrôle de ce commit.

**IMPORTANT — le travail ne peut pas être présenté comme « tous les problèmes corrigés » ou comme publié** : les 15 manuscrits en base contiennent encore Verri et 0 Santoro, avec 0/15 validations éditoriales. Les épisodes A/B/C manquent encore d'un barème de renseignements par personnage approuvé et d'un verdict définitif rattaché à chaque objectif particulier. Le moteur historique de trames/événements et le traitement des clients restés sur d'anciennes versions doivent être vérifiés lors d'un véritable essai de bout en bout, sur la stack réelle, avant d'autoriser le switch. Le défaut `enabled=false` protège précisément contre une activation prématurée. Aucun test PostgreSQL synthétique, même vert, ne vaut une certification narrative humaine.


## Audit final de publication urgente — synchronisation directe

- Le dernier audit a trouvé un contournement côté serveur : les clients pouvaient appeler directement `public.igr_v4_sync` malgré le proxy filtrant les secrets Santoro. **Corrigé dans le candidat SQL** `supabase/candidates/omerta_core_sync_seal.sql` : l'ancienne fonction est renommée et son exécution directe révoquée pour `anon`/`authenticated` ; le RPC original devient une façade filtrée. Les salles historiques conservent le résultat hérité.
- `igr_omerta_standalone_safe_sync` appelle désormais la fonction interne renommée, évitant la récursion.
- Tests de non-contournement ajoutés : appel direct à `public.igr_v4_sync` dans une salle A/B/C, absence d'informations Verri, et refus d'exécuter l'ancien corps ; tests PostgreSQL 16 **réussis** sur `18fc55435e848966758dde617aaf6930a3b9b3c2`.
- Ce durcissement implique **une migration de la fonction `igr_v4_sync` utilisée par tous les scénarios**. La réussir sur des fixtures synthétiques n'est pas une preuve de non-régression de la vraie stack avec tous les dossiers. Ne pas appliquer en production sans tests ciblés sur les autres DLC.
- Le rapport de la base privée actuelle est toujours **15 manuscrits Verri, 0 Santoro, 0 revus/approuvés** (lecture seule, 27 octobre).
- **Décision : ne pas fusionner pour une publication intégrale** tant que le canon Santoro et le calcul définitif des objectifs de 15 variantes ne sont pas rédigés/validés et tant qu'un test de bout en bout avec le vrai schéma et les RPCs existants n'a pas réussi. L'interrupteur privé de release reste `false` par défaut.
- Aucune branche Supabase payante, aucun coût supplémentaire demandé, aucune modification du service en production.

