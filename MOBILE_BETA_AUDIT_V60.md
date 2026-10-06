# Audit bêta v60 — 6 octobre 2026

## Corrections et preuves

| Domaine | Défaut / contrôle | Résultat |
|---|---|---|
| Finale | Apparition/disparition du conseil et accès aux actions | Correctif v58 conservé ; simulation de 120 polls et conservation des onglets passent |
| Lobby | Réécriture du même texte déclenchant l’observateur DOM | Écriture uniquement si changement ; 120 callbacks sans mutation supplémentaire |
| Conservation du mode | Démarrage réinitialisant le choix court/long | Mode conservé à chaque remplacement d’état ; 156 démarrages court/long avec compositions min/max validés |
| Durée | Interrogatoires et finale court/long | 360 secondes dans les deux modes ; prises de parole/défenses distinctes ; estimations dépendant du nombre de rôles |
| Authentification | Comparaison SQL avec jeton d’hôte NULL | NULL et faux jeton refusés ; vrai jeton accepté dans le lobby |
| Accès internes | Tick, durée interne et vérification des droits exposés sans jeton | Exécution directe retirée aux clients ; appels internes et service_role conservés |
| Pause | Débrief initial sans échéance considéré expiré | Pause liée à la phase et son début vérifiée avant progression |
| Espion | Couverture Suspect écrasant la victoire secrète | Objectif Espion restauré depuis la règle canonique avant calcul des gagnants |
| Procureur corrompu | Cible innocente impossible à protéger par sous-évaluation | Cible responsable obligatoire ; corruption désactivée sans cible valide ; 100 tirages testés |
| Résultats | Badge de victoire conservé après défaite recalculée | Badges de victoire retirés lorsque success=false |
| Brouillons | Réutilisation possible entre parties ou joueurs | Portée incluant cellule, numéro de partie, joueur, vue, onglet et phase |
| Conditions | Deux actions simultanées laissant une promesse bloquée | Dialogue/promesse partagés ; annulation résout les deux actions ; nouvelle ouverture possible |
| Récupération | Message « copié » sans succès du presse-papiers | Confirmation après succès réel ; erreur explicite sinon |
| Mobile | Texte photo uniquement Android | Mention des versions mobiles ; comportement natif conservé |
| Accessibilité | Taille de saisie, mouvement réduit, actions | Saisies mobiles 16 px, actions ciblées 44 px, mouvement réduit respecté ; tests lecteur d’écran encore nécessaires |
| Versions | Ressources en cache et version store confondues | Révision cache v60, manifeste bêta séparant version interne/store/build |

## Rôles et protections

Le test serveur v58 compare avant/après six protections les résultats de l’Enquêteur, Analyste, Juge, Procureur, Inspecteur, Expert, Journaliste, Maître, Témoin et des Suspects. Aucune défaite automatique liée au dépassement de trois protections ; la septième protection distincte est refusée. Protéger à nouveau le même élément ne consomme pas une nouvelle protection.

Le test v59 vérifie l’objectif du Juge corrompu, le vote majoritaire de corruption, la conclusion personnelle du Journaliste, la décision faisant autorité pour Inspecteur/Expert et la récupération d’un joueur absent. Le test v60 vérifie en plus la priorité de l’objectif Espion sur son rôle public Suspect. Les objectifs de corruption conservent leur risque propre : une cible sous-évaluée et une corruption non détectée sont des conditions de victoire, indépendamment du compteur de protections.

Les variantes Omerta, Terror, Cartel, Régime et Héritage disposent de leurs contrôles historiques inclus dans la construction. Cet audit ne remplace pas un playtest complet de chaque variante avec de vrais groupes. Les 44 packs et les fonctions serveur ont été inspectés ; 156 démarrages ont été testés sur les 39 packs du moteur principal (court et long, compositions min/max), avec attribution des rôles, cartes privées, conservation du mode et confidentialité de la liste publique. Les cinq packs Omerta relèvent de leur moteur distinct. Cela ne couvre pas chaque permutation ni des parties complètes jouées par des groupes.

## Validation effectuée

- Construction web et mobile avec les contrôles historiques v35 à v59, puis tests de comportement v60.
- Contrôle de stabilité de la construction finale et cohérence des assets/cache.
- Migration v60 + fixtures v58/v59/v60 exécutées dans une transaction sur le serveur, puis annulées intégralement ; aucun joueur de test persistant.
- Contrôle store : 41 contrôles statiques, un avertissement connu sur les paiements natifs non intégrés.
- Compilations iOS/Android de cette révision suivies dans GitHub Actions ; utiliser leurs résultats comme preuve de compilation, pas de validation sur appareil.

## Contrôle des accès serveur

Les tables de jeu restent protégées par RLS sans accès direct aux clients. Les avis de sécurité recensent les fonctions SECURITY DEFINER accessibles : les RPC destinées aux joueurs utilisent leurs jetons propres plutôt qu’une session Supabase Auth. Quatre helpers internes sans authentification ont été retirés de l’API exécutable par anon/authenticated. Les autres avis de cette architecture ne sont pas déclarés « résolus » par ce seul audit.

## Limites et décision de publication

Le navigateur de contrôle a rencontré des délais d’évaluation : le contrôle visuel interactif complet n’a pas pu être achevé pendant cet audit. Les tests DOM et serveur sont passants, mais aucune garantie de stabilité sur tous les téléphones n’est donnée. Faire les validations physiques décrites dans `MOBILE_BETA_RELEASE_V60.md` avant la sortie publique.

Bêta sans paiements natifs activés. Pas de soumission commerciale tant que les achats/restaurations/droits ne sont pas validés. Les comptes Apple/Google, certificats, clefs de signature, formulaires de confidentialité, accès reviewer et revue humaine des signalements restent sous la responsabilité de l’éditeur. Les contrôles statiques ne certifient ni l’équilibrage de toutes les parties ni l’acceptation par les stores.
