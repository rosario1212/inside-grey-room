# Dossier 014 — SOUS SECRET

## Intrigue et structure conservées
Onze informateurs et leurs proches sont exposés. Trois personnes ont contribué aux faits, à des degrés différents : l'analyste, l'officier traitant et le responsable de la sécurité. À cinq joueurs, la partie contient 1 Enquêteur, 1 Analyste et 3 Suspects ; à six, elle ajoute 1 Juge. Le Juge conserve ses fonctions et ne voit pas les preuves privées de l'Enquêteur.

## Variantes privées A/B/C
- **A — Vente volontaire** : extraction irrégulière, recomposition et vente volontaire de la liste par l'officier traitant ; la sécurité a retouché les logs pour une autre faille.
- **B — Protection catastrophique** : la procédure d'urgence était incomplète, l'officier croyait utiliser un canal habilité mais non vérifié, la sécurité a ignoré l'alerte ; aucune vente volontaire n'est prouvée.
- **C — Mandat détourné** : un accès initialement autorisé est exploité à d'autres fins ; la fausse piste d'intrusion étrangère détourne l'attention d'un abus interne.

Chacune possède 3 trames documentaires **garanties** (une par cycle), 9 investigations supplémentaires (3 choix par cycle, une seule enquête collective autorisée), 3 cartes privées de Suspects issues du manuscrit et une réponse canonique à 3 axes : origine, transmission, dissimulation.

## Sécurité et déclenchement
Les manuscrits sont maintenus dans `igr_private`, séparés du dépôt et de l'API publique. Variante A/B/C aléatoire à la création de chaque partie, épinglée en base, lue via les fonctions de serveur pour les cartes, synchronisations, trames et révélation. Publication fermée tant que les trois variantes ne sont pas approuvées. La vérité n'est révélée qu'à la fin. Seuls l'Enquêteur et l'Analyste peuvent choisir une investigation facultative. Validation stricte du verdict et notation par rapport au pack épinglé.

## QA transactionnelle (BEGIN / ROLLBACK)
- 12 salons de 5/6 joueurs, 6 de chaque taille, variantes A/B/C toutes observées, 12 distributions conformes.
- 3 cycles : révélations inconditionnelles 1/2/3, trois options/cycle pour le camp Enquête, zéro pour Suspect ou Juge ; demandes répétées, joueur extérieur et rôles non autorisés refusés.
- Confidentialité : solution JSON null avant révélation, résultat privé de l'investigation non diffusé au Suspect.
- Verdict : 4 parties de 5/6 participants, entrée invalide refusée, double reconstitution exacte validée, erreur de l'Analyste correctement détectée et pénalisée.
- Toutes les écritures des salons de simulation annulées.

## Séquence de publication
Attendre 5/5 contrôles GitHub verts. Fusionner uniquement la PR vérifiée, attendre Cloudflare Production Deploy et sa vérification du commit correspondant à `main`, puis autoriser `igr_v431_014_release_status().eligible=true` dans Supabase. Confirmer l'intégrité du 013 et absence de salons QA persistants. Pas de playtest humain authentique pour cette version : `human_playtest_verified=false`.
