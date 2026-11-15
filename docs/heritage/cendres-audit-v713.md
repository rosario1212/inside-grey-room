# HÉRITAGE — CENDRES · audit et corrections v713
Date : 15 novembre 2026
Périmètre : dossiers 035–039, jeu local à 5, 6 et 7 joueurs, affichage des indices, conséquences persistantes, projection de l'état de l'hôte en ligne.

## Problèmes vérifiés avant correction
- Dossier III : le briefing public nommait déjà le compte rendu B comme pièce suspecte.
- Dossier IV : le briefing annonçait presque la solution (accès aux habilitations).
- Les descriptions des trois réponses de plusieurs dossiers expliquaient pourquoi les mauvaises pistes étaient fausses **avant** la décision.
- Dossiers IV–V : plusieurs cartes privées convergeaient trop directement vers une même conclusion, surtout à 7 joueurs.
- Dossier V : le texte annonçait un raccourcissement du chronomètre alors que le runtime ne réduisait pas le temps.
- Le bilan final de la récupération de l'ogive ne distinguait pas l'état de crise antérieur.

## Corrections proposées sur la branche
1. Briefings III et IV reformulés sans dévoiler la réponse.
2. Quinze descriptions d'hypothèses (trois par dossier) remplacées par des formulations neutres.
3. Quatorze cartes privées des dossiers IV et V équilibrées : indices recoupables, présence politique trompeuse, distinction entre passage, destination et réception.
4. Un **recoupement tardif** public apparaît seulement à partir de la troisième phase des dossiers III–V. La précision des pièces IV et V dépend des erreurs antérieures et du niveau de crise.
5. En phase « Compte à rebours », la notice décrit les vrais effets des annexes et de la vérification, sans prétendre qu'un minuteur raccourcit la partie.
6. Finale à issue différenciée : ogive récupérée avec crise contrôlée, résiduelle ou majeure. Une erreur finale en crise majeure a aussi un coût spécifique.
7. Les projections des invités utilisent exclusivement le `campaignCarry` publié par l'hôte pour ces recoupements et issues ; aucune vérité cachée supplémentaire n'est exportée.

## Validation technique exécutée
- 5 joueurs : parcours complet exact, faux, et crise majeure avec bonne localisation finale.
- 7 joueurs : les trois mêmes parcours.
- **9 campagnes, 45 dossiers, 180 phases** vérifiés par simulation JS en environnement contrôlé.
- À chaque dossier : 5 ou 7 rôles distincts et cartes privées définies.
- Après une campagne : 5 pistes persistantes, 4 liens et chapitres déverrouillés dans l'ordre.
- Crise finale : 0 pour le parcours exact, 4 pour le parcours entièrement faux, 3 pour une localisation finale correcte après quatre erreurs.
- Un replay archivé ne modifie pas la campagne canonique.
- Un état de campagne en ligne contradictoire avec l'état du téléphone est traité via le `campaignCarry` hôte.
- Test reproductible : `node scripts/v713-cendres-playtest-check.mjs` ; ajouté à la vérification CI du bundle Cloudflare.

## Critères avant fusion et publication
- CI de la pull request réussie.
- Essais sur navigateur mobile réel : lisibilité des nouvelles pièces, navigation entre phases, crash/résumé.
- Partie multijoueur réelle à 5, 6 et 7 téléphones : création, connexion, attribution privée, synchronisation du carry, déconnexion/reconnexion et confirmation serveur de fin.
- Playtest humain en aveugle : vérifier la difficulté réelle et le temps d'activité de chaque rôle. Les tests automatisés ne mesurent pas le suspense.
- Vote collectif **ajouté** côté serveur et client : une voix par jeton personnel, tous les joueurs votent, majorité absolue de 3/5, 4/6 ou 4/7, nouveau tour si nécessaire, aucun contournement par l'hôte. Un vote séquentiel privé existe aussi en mode local à téléphone partagé.

Ces corrections sont confinées à CENDRES. Aucune réécriture de KUROI, MAÎTRE, CASINO ni des DLC 001–034.

## Ajout technique : vote collectif et persistance
- Nouvelle migration proposée : `supabase/migrations/20261115230500_heritage_cendres_majority_ballot_v713.sql`.
- Les bulletins ne sont pas accessibles directement aux joueurs : SQL avec RLS, droits révoqués et deux RPC authentifiées par jeton individuel.
- Le verdict ne se déclenche **qu'après le vote de tous les joueurs inscrits** ; il faut une majorité absolue, sans quoi les bulletins sont réinitialisés pour un second tour.
- Le serveur refuse l'ancien chemin permettant à l'hôte de verrouiller seul la décision dans CENDRES ; KUROI et MAÎTRE conservent leurs règles.
- Les déconnexions en cours de partie conservent les places et les jetons pour permettre une reconnexion sans réduire artificiellement le quorum.
- La progression locale n'est maintenant inscrite qu'après la confirmation serveur de la clôture multijoueur.
- Essai transactionnel de la migration réalisé contre le schéma réel Supabase : **tests 5/7 joueurs réussis ; scénarios à 6 joueurs ajoutés à la CI isolée ; transaction annulée sans changement persistant**.
- Reproduction CI PostgreSQL isolée : `supabase/tests/igr_v713_cendres_ballot_harness.sql` et `supabase/tests/igr_v713_cendres_ballot_integration.sql` ; exécution via `.github/workflows/heritage-cendres-v713-qa.yml`.
- La validation de 5–7 téléphones réels et le déploiement couplé du client et de la migration restent à réaliser avant de rendre la PR publiable.
- Alerte Cloudflare séparée : le Worker de production déclaré dans `wrangler.jsonc` est `inside-grey-room-last` et sa CI GitHub réussit ; un contrôle Cloudflare externe est attaché à `inside-grey-room`. Les journaux du service externe sont privés, donc sa cause précise ne peut pas être établie à partir du seul statut GitHub.
