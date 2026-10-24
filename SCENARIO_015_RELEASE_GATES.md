# Dossier 015 — AVANT LA MORT · contrat de publication

## Canon éditorial
Le programme hospitalier ÉLIGIBLES a été maintenu alors que l'état d'un patient se dégradait. Le patient est mort. Les responsables sont le directeur du programme (Suspect 1), le clinicien référent (Suspect 2) et le cadre administratif (Suspect 3). Les documents ont été modifiés après le décès. La présentation publique erronée parlant du meurtre d'une médecin a été corrigée pour refléter les trois manuscrits originaux.

## Trois variantes réellement différentes
- A : le directeur reçoit une recommandation d'arrêt suffisamment claire et refuse la suspension ; le clinicien signe malgré sa réserve ; l'administration atténue les alertes après la mort.
- B : la direction autorise la suspension ; le clinicien poursuit de sa propre initiative ; l'administration réécrit les notes pour masquer des décisions contradictoires.
- C : la direction accepte une réévaluation sans la contrôler ; le clinicien attend un accusé ; l'administration bloque délibérément la circulation du dossier de sortie puis masque le retard.

Chaque variante comprend trois documents garantis (un par cycle) et neuf investigations facultatives (trois options par cycle, une enquête collective maximum), ainsi que trois fiches privées et une reconstitution à trois axes : décision institutionnelle, poursuite concrète, modification des pièces.

## Rôles et mécanismes intacts
- À cinq : Enquêteur, Analyste, trois Suspects.
- À six : ajout du Journaliste.
- À sept : ajout du Juge.
- Les deux rôles optionnels conservent leur propre fiche et les accès prévus par le moteur. Ils ne peuvent pas effectuer des enquêtes réservées aux Enquêteurs.

## Tests serveur exécutés avant publication
- 18 salons fictifs, six de chaque taille ; variantes A/B/C observées, 18/18 répartitions et cartes correctes.
- Trois cycles à sept : documents garantis cumulés 1/2/3 ; trois choix facultatifs/cycle pour l'Enquêteur et aucun pour Suspect, Journaliste, Juge ; refus des doublons, étrangers et autres rôles ; résultat d'enquête privé, vérité cachée.
- Six simulations de verdict à 5/6/7 : entrées mal formées rejetées ; double reconstitution exacte donne réussite ; une réponse erronée de l'Analyste est pénalisée sans annuler l'Enquêteur correct. Révélation pour tous les joueurs.
- Le verrou refuse de créer un salon 015 tant que la validation éditoriale est fermée.
- Toutes les opérations de simulation dans BEGIN / ROLLBACK : aucune partie de QA conservée.

## Conditions de release
Vérifier 5/5 CI GitHub verts (Cloudflare, iOS, Android, Store, interface), PR fusionnable, production Cloudflare déployée sur le SHA de main, puis **seulement après** marquer les variantes privées approuvées en base, valider eligible=true et effectuer un smoke test post-publication transactionnel. Vérifier que le dossier 014 demeure eligible=true.

Les tests humains authentiques et multiplateformes restent à effectuer ; `human_playtest_verified=false`. L'audit automatisé n'est pas une garantie absolue d'absence de bugs.
