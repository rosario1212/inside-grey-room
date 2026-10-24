# DOSSIER 013 — LIGNE DE MIRE

## Canon conservé
Le président Kessler a été assassiné. Les trois Suspects sont le coordinateur PERSEUS, le tireur et le cadre de sécurité. Leur connaissance, leur intention et leur contribution se distinguent. Il existe exactement un Espion secret attribué aléatoirement parmi les trois Suspects. La capacité est de 5 joueurs (Enquêteur, Analyste, 3 Suspects) ou 6 joueurs avec Procureur facultatif.

## Variantes privées
- A : mission violente connue du coordinateur ; désignation nominative de Kessler reçue par le tireur ; cadre de sécurité impliqué dans une rectification postérieure des traces.
- B : le coordinateur connaissait un risque grave, pas le nom de la victime ; financeur nommant Kessler par un autre canal ; sécurité rémunérée séparément.
- C : coordinateur essayant tardivement de suspendre la mission ; suspension sans réception authentifiée par le tireur ; traces de sécurité falsifiées avant l'assassinat.

## Garantie de jeu
- Une trame documentaire garantie et indépendante des votes pour chacun des trois cycles.
- Trois investigations facultatives par cycle, chacune avec source documentaire fictive cohérente ; une seule action supplémentaire collective par cycle, visible uniquement aux enquêteurs.
- Vérité et manuscrits privés protégés, snapshot A/B/C propre au salon, aucun contenu de solution servi aux joueurs avant révélation.
- Verdict triple : connaissance du coordinateur, canal de décision sur la victime, rôle du cadre de sécurité.
- Les rôles optionnels (Procureur) et secrets (Espion) sont préservés dans la distribution de rôles, fiches et scores.

## Tests effectués en transactions annulées
- 20 salons à cinq ou six joueurs ; toutes variantes A/B/C tirées, exactement un Espion parmi les trois Suspects, 5 ou 6 cartes de rôle générées.
- Trois cycles : trois pièces, trois choix/cycle réservés aux enquêtes, tentative de doublon refusée, accès de l'Espion, Suspect et d'un jeton inconnu refusé.
- Vérité JSON null pendant la partie ; les deux verdicts exacts reconnus ; un verdict incorrect et un verdict malformé pénalisés ; résultat complet à 5 et 6.
- Tous les essais exécutés avec BEGIN/ROLLBACK, aucune partie fictive créée durablement.

## Release gates
Ne publier qu'après le passage des contrôles GitHub web, Android, iOS, Store et Layout, déploiement Cloudflare validé sur le commit exact de main, puis approbation de la base pour activer `igr_v411_013_release_status().eligible=true`. Conserver le 012 et ses prédécesseurs inchangés. Aucun test humain réel enregistré ; noter `human_playtest_verified=false`.

## Limite
La réussite de l'audit transactionnel prouve la cohérence serveur sous les cas testés, mais pas la fluidité réelle d'une partie à six personnes sur différents appareils.
