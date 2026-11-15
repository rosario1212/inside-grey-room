# v705 — Simulation de l’audience et du tribunal (proposition à valider)

## But
Conserver l’Audience finale pour présenter les soupçons, faire du Tribunal une confrontation collective centrée sur les Suspects, puis laisser chaque rôle habilité reconsidérer seul sa décision. Aucun vote ni verdict définitif à l’Audience.

## Règles (seulement si un Juge joue)
1. **Audience préparatoire** : seuls les membres du camp Enquête (Enquêteur, Analyste, Inspecteur, Expert, Procureur, Juge selon présence) reçoivent jusqu’à **1 min (COURT) ou 1 min 30 (LONG)** chacun, en commençant par l’Enquêteur. Chacun peut parler moins longtemps ou passer ; Suspects, Avocat et Journaliste ne participent pas à cette audience avec Juge. Aucun verdict rendu et aucun niveau 0–2 verrouillé.
2. **Tribunal** : tous physiquement réunis. Le Juge dirige la comparution de chaque Suspect, **3 min maximum en COURT** (1:30 défense avec Avocat, 0:45 questions, 0:45 réponse) ou **4 min maximum en LONG** (2 min défense, 1 min questions, 1 min réponse). Ce sont des repères, pas trois chronomètres serveur distincts ; le tour total de 4 min est garanti par le serveur. Le Suspect peut se taire et signaler **« J’ai terminé ma défense »** pour renoncer au temps restant, mais **ne peut pas interrompre les questions** en clôturant lui-même la comparution. Sans ce signal, le serveur protège les **1 min 30 en COURT / 2 min en LONG** de défense avant toute clôture anticipée par le Juge ; le timeout serveur termine au plus tard à 4 min.
3. **Vote individuel et secret** : l’Enquêteur et tous les rôles déjà habilités par les règles existantes verrouillent 0/1/2 séparément sur leur propre appareil, sans concertation. Aucun choix présélectionné. Hiérarchie du verdict et vote d’intégrité du Juge inchangés. Révélation seulement après tous les verrouillages exigés et conditions particulières.
4. **Anti-blocage** : si un tour n’est pas ouvert dans les 25 s, l’application passe automatiquement la parole à l’Audience. Au tribunal, elle ouvre automatiquement la comparution pour protéger le droit de défense. Les tours démarrés disposent de leur chronomètre réel.
5. **Compatibilité** : sans Juge, la finale antérieure reste en place. Le dossier 029 garde son rapport et ses règles de résultat propres, et traite ses comparutions comme celles de témoins.

## Simulation de 8 joueurs (4 Enquête, 1 Avocat, 3 Suspects)
Enquêteur, Analyste, Procureur, Juge, Avocat, trois Suspects.
- Audience : Enquêteur 90 s + Analyste 80 s + Procureur 45 s + Juge 0 s (passe) = **215 s, soit 3 min 35**. Des soupçons sont formulés, pas de verdict.
- Tribunal : les trois comparutions durent **220, 240 et 200 s**, soit **11 min**. Le Juge laisse le temps à la défense, interroge et peut raccourcir une comparution si les échanges sont clos.
- Vote privé : **100 s**, soit **1 min 40** dans cette simulation.
- Total des phases : **16 min 15**, hors petites transitions. Pour cet exemple de 4 rôles Enquête et 3 Suspects en LONG, maximum théorique : 6 min d’Audience + 12 min de comparutions + 2 min de vote indicatif = **20 min**, plus transitions.

### Test de réévaluation
Hypothèse fictive : après l’Audience, la lecture de l’Enquêteur est A=1, B=2, C=0 ; après le Tribunal, la lecture définitive devient A=2, B=1, C=0. La possibilité de changer d’avis est essentielle. Le score réel reste déterminé par la vérité canonique et le verrouillage côté serveur.

## Corrections apportées dans cette branche
- Tour de parole et bouton Passer pour le Juge et les autres joueurs à l’Audience.
- Tribunal centré sur les Suspects, avec partage du temps de défense de l’Avocat officiel.
- Droit de clôture du Juge, empêchant un Suspect de supprimer les questions en terminant trop tôt. Deux minutes de défense protégées, sauf renonciation explicite du Suspect.
- Vote sans responsabilité 0 présélectionnée ; refus des bulletins incomplets côté client (validation serveur 0–2 conservée).
- Timeouts en attente (25 s) et en comparution (COURT 180 s / LONG 240 s) ; cas particulier 029 maintenu.
- Nouvelle vérification statique et simulation déterministe dans `scripts/v705-tribunal-check.mjs`.

## Limites et prérequis de publication
- Simulation de règles et contrôles statiques uniquement ; **aucun playtest humain ni test de bout en bout sur plusieurs téléphones n’a encore été certifié**.
- La migration doit être relue, exécutée dans un environnement de test et validée avant application en production. **Cette branche ne déploie pas la base active.**
- La durée de vote de 2 min est une cible de conception, **pas un deadline ajouté au serveur** ; les mécanismes existants de récupération d’un joueur absent restent nécessaires.
- Avant publication : confirmer la sécurité des RPC, effectuer deux parties réelles à 6–8 joueurs (un scénario Juge normal, le dossier 029), tester déconnexion/reconnexion, refus de vote incomplet et tout-passer à l’Audience.

**Évaluation provisoire :** mécanique cohérente et cadence raisonnable, sans 10/10 garanti avant validation sur appareils réels.
