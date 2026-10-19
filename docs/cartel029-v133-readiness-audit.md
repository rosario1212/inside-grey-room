# CARTEL 029 — point de contrôle v133 (préparation à la sortie)

Le scénario « Le Cycle mort » à quatre témoins, avec le Don et son bras droit, est **préparé mais non activé**. Ne pas faire passer le catalogue de 5–8 joueurs à 6–11 ou changer le mécanisme de verdict tant que la porte de sortie privée ne passe pas. Les autres dossiers restent inchangés.

## Correction effectivement effectuée

Les manuscrits privés A/B/C disposent désormais de **deux recoupements garantis au cycle 3** chacun :
- **P12 + P15** : chronologie et pièce de responsabilité indépendantes des paroles des témoins ;
- **P11 + P14** : confirmation externe et contrôle lié au profil secret V1–V5 du quatrième témoin.

La migration `v133_cartel029_guaranteed_c3_draft` ne révèle aucun responsable et n'active pas les variantes. Elle marque explicitement la validation humaine de provenance `pending` : les preuves sont écrites et branchées sur le serveur, mais n'ont pas été certifiées par un relecteur humain.

## Constats de vérification en base

- 15 combinaisons A/B/C × V1–V5 sont présentes et structurellement complètes.
- Chaque combinaison possède quatre fiches de témoins, seize indices, des rappels d'interrogatoire et des pièces P11/P12/P14/P15/P16 au troisième cycle.
- Les trois manuscrits A/B/C ont un recoupement garanti au troisième cycle. Leur validation humaine est toujours en attente.
- L'approbation éditoriale = **0/3 manuscrits et 0/15 combinaisons**.
- Le test multijoueur bout en bout = **non attesté**.
- L'accord de publication de l'auteur est enregistré, mais il ne vaut pas approbation des manuscrits ou résultat de test.

## Critères objectifs restants avant activation

1. **Revue éditoriale des canons A/B/C :** chacun doit être lu et contrôlé contre les responsabilités réelles, les seize preuves et les trois autres dossiers CARTEL, sans confondre le fugitif assassiné avec le témoin 4.
2. **Revue de provenance C3 :** contrôler effectivement P11/P12/P14/P15 dans les trois branches et les cinq profils, puis seulement saisir les attestations de validation dans la base.
3. **Parcours multi-appareils réel :** inviter 6, 7, 8, 9, 10 et 11 participants, parcourir les quatre auditions, les cycles 2 et 3, les menaces, les notifications, les protections, les messages du Don/bras droit et le rapport. Tester reprise, connexion/déconnexion, phase/chronomètre et secret du témoin 4.
4. **Sécurité :** vérifier qu'aucun jeton non autorisé n'obtient P14, P15, une fiche privée ou la branche choisie; vérifier les paramètres de service worker et l'absence de secrets dans les assets publics.
5. **Dénouements :** rejouer au minimum les 15 combinaisons avec conclusions correctes/incorrectes, témoins silencieux et absences de rôles facultatifs. Le rapport ne doit jamais dépendre d'une information optionnelle.
6. **Activation :** seulement après les contrôles ci-dessus, valider formellement les statuts éditoriaux et le champ de QA. Ne jamais modifier le prédicat d'activation ou remplir des validations fictives.

Le script `scripts/v133-cartel029-guard-check.mjs` protège le caractère non prématuré de cette migration dans les builds. **Un build vert n'est pas un test multijoueur**.
