# Dossier 029 — porte de sortie avant activation

Statut : **préparation technique, NON JOUABLE en v2, NON ACTIVÉ**.

Ce document est public et **ne contient aucune vérité de variante, fiche secrète, victime identifiée, communication privée ou indice à valeur de résolution**. Les manuscrits restent exclusivement dans un stockage privé soumis à contrôle d'accès. Le script `scripts/cartel029-private-authoring-check.mjs` ne s'exécute que sur un fichier privé passé explicitement en argument ; ne jamais déposer ce fichier dans le dépôt, `assets`, `dist` ou un bundle.

## Compatibilité préexistante

- Conserver le canon familial de Los Salcedo et les dossiers 030–031 inchangés.
- Conserver les trois branches A/B/C du contrat narratif et leur verrouillage immuable par partie.
- Ajouter un **axe privé indépendant de cinq profils** pour le quatrième témoin ; ne pas remplacer la validation globale A/B/C (qui s'applique à tous les dossiers).
- Pour le seul 029, compter six participants obligatoires : enquêteur, analyste et quatre témoins. Procureur, juge, journaliste, Don et bras droit facultatifs ne doivent pas être nécessaires à la progression. Ne pas dépasser les limites réelles du serveur sans migration vérifiée.
- Adapter les interrogatoires au 029 uniquement : **quatre premières auditions obligatoires**, sans raccourci permettant d'empêcher la participation de l'un des quatre témoins.
- Aucune mécanique d'enlèvement. Aucune élimination avant les interrogatoires obligatoires.

## Sécurité et fonctionnement à implémenter avant toute activation

1. Importer et valider le manuscrit privé, sans remplacer des brouillons A/B/C existants avant contrôle de compatibilité. Le statut de revue actuel ne constitue pas une approbation.
2. Sélectionner et verrouiller serveur-side le couple (branche A/B/C, profil 1–5) dès le démarrage de la partie ; ne pas envoyer les vérités de la partie aux autres rôles ni au client public.
3. Distribuer quatre fiches confidentielles, avec leur savoir réel, objectifs et limites de communication. Les rôles de direction restent distincts du quatrième témoin dans toutes les combinaisons.
4. Programmer des révélations temporelles garanties et conditionnelles. Vérifier qu'une source corroborée permet d'aboutir même si un témoignage est mensonger.
5. Gérer messages de pression, fuite, protections et leurs états par événements serveur tracés. Les textes libres du Don ou du bras droit ne déclenchent **jamais** automatiquement une violence.
6. Ajouter dans l'onglet Enquête existant un rapport structuré sur les faits du village, les activités, la hiérarchie, les autres sites, les fuites et la protection. Distinguer hypothèse, témoignage et preuve.
7. Permettre une conclusion et une participation après découverte d'une éventuelle complicité ; ne pas supprimer le personnage de la partie.
8. Garantir une sauvegarde/reprise et une synchronisation hôte/joueurs sans rafraîchissement manuel ; aucun secret dans le salon, notifications, journaux publics ou bundle.
9. Tester sur des parties à 6, 7, 8, 9, 10 et 11 joueurs (ou ne proposer que les capacités effectivement supportées), sur mobile et ordinateur.
10. Exécuter les contrôles narratifs, confidentialité, restauration, build et déploiement. Vérifier en ligne le commit exact avant de marquer « jouable ».

## Cas de test incontournables

- Chaque combinaison A/B/C × 5 profils produit son propre ensemble de secrets cohérent et des recoupements suffisants au cycle 3.
- Une version innocente ne reçoit jamais d'ordre de cartel ni d'étiquette de complice.
- Un témoignage truqué n'altère pas la vérité du dossier ; des preuves indépendantes restent accessibles.
- Une menace ne produit pas de conséquence automatique ; une protection réellement confirmée reste effective.
- Si un rôle facultatif est absent, la mission obligatoire demeure entièrement jouable.
- Deux appareils non hôtes progressent automatiquement lors de chaque interrogation, révélation, débrief et conclusion.
- Le rapport ne contient pas de faits automatiquement attribués comme vrais lorsqu'ils ne sont encore que des déclarations.

**Important :** un passage du validateur de manuscrit n'atteste ni la sécurité des données, ni la jouabilité, ni l'approbation humaine. Tant que la présente liste n'a pas été exécutée et testée, garder le dossier 029 dans son état actuel.
