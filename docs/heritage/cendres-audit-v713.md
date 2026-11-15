# HÉRITAGE — CENDRES · audit et corrections v713
Date : 15 novembre 2026
Périmètre : dossiers 035–039, jeu local à 5 et 7 joueurs, affichage des indices, conséquences persistantes, projection de l'état de l'hôte en ligne.

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
- **6 campagnes, 30 dossiers, 120 phases** vérifiés par simulation JS en environnement contrôlé.
- À chaque dossier : 5 ou 7 rôles distincts et cartes privées définies.
- Après une campagne : 5 pistes persistantes, 4 liens et chapitres déverrouillés dans l'ordre.
- Crise finale : 0 pour le parcours exact, 4 pour le parcours entièrement faux, 3 pour une localisation finale correcte après quatre erreurs.
- Un replay archivé ne modifie pas la campagne canonique.
- Un état de campagne en ligne contradictoire avec l'état du téléphone est traité via le `campaignCarry` hôte.
- Test reproductible : `node scripts/v713-cendres-playtest-check.mjs` ; ajouté à la vérification CI du bundle Cloudflare.

## Critères avant fusion et publication
- CI de la pull request réussie.
- Essais sur navigateur mobile réel : lisibilité des nouvelles pièces, navigation entre phases, crash/résumé.
- Partie multijoueur réelle à 5 et 7 téléphones : création, connexion, attribution privée, synchronisation du carry, déconnexion/reconnexion et confirmation serveur de fin.
- Playtest humain en aveugle : vérifier la difficulté réelle et le temps d'activité de chaque rôle. Les tests automatisés ne mesurent pas le suspense.
- Revoir le système de verrouillage du choix final en ligne : l'hôte possède encore le pouvoir technique de décision; le présent patch **ne** met pas en place un vote collectif authentifié.

Ces corrections sont confinées à CENDRES. Aucune réécriture de KUROI, MAÎTRE, CASINO ni des DLC 001–034.
