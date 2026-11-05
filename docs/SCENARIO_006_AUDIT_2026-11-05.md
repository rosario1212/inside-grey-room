# Scénario 006 — Les Cendres du chalet : audit du 5 novembre 2026

**Aucune révélation de scénario dans ce document public.** Tous les manuscrits, preuves et vérités canoniques restent dans `igr_private` sur Supabase.

## Validation des fiches actives

| Variante | Fiches | Mots hors relations | Mots avec relations |
| --- | ---: | ---: | ---: |
| A | 3 | 153–160 | 180–190 |
| B | 3 | 157 | 180–185 |
| C | 3 | 151–159 | 174–186 |
| **Total** | **9** | **151–160** | **174–190** |

Les **trois premières fiches** (une par variante) du jeu ont été raccourcies pour respecter le standard rédactionnel des dossiers 001–005 : 120–160 mots hors relations, sans supprimer de faits, de secrets, d'objectifs ou de chronologie. Les autres six étaient déjà conformes.

- Contenu privé modifié : `v279_cards.cards[0].story` dans les trois manuscrits, et comptes de mots de `v279_cards.word_counts`.
- Copies intégrales des anciennes cartes conservées sous `v282_editorial_backup`.
- Aucun changement aux reconstructions, investigations, relations, vérités canoniques, conditions de victoire, niveau de responsabilité ni déclarations scellées.
- Les brouillons éditoriaux `v280_draft` et `v281_draft` sont conservés : **le runtime actif lit les cartes `v279_cards`**, et non automatiquement ces brouillons.

## Contrôles exécutés sur Supabase

- 3/3 variantes A/B/C approuvées et éligibles à la publication, avec 3 vérités distinctes.
- 9/9 fiches présentes et dans la plage 120–160 mots (hors relations).
- Trois cycles et neuf investigations pour chaque variante.
- Correspondance entre les trois fiches et les trois niveaux de responsabilité (0–2).
- Aucun champ d'ignorance révélé dans les cartes générées.
- Relations valides, sans question de guidage ni entrée trop courte dans le contrôle automatique.
- Empreintes du contenu de la base privée valides ; sauvegardes disponibles.
- Smoke tests : construction, verdict, invalidation de réponses non autorisées, enquête, déclarations, déclarations scellées et blocage de doublons.
- Aucun salon synthétique conservé par les tests.

## Publication et limites

Le commit GitHub applicatif `e6827252776c10e1fa00584f237797eec8ad624e` du 1er novembre contient la publication du format de fiche courte et possède le statut **Cloudflare Production: success**. Les modifications présentées ici sont dans la base privée, sans publication de secrets GitHub.

**Pas encore confirmé :** test multijoueur humain complet, contrôle visuel sur iPhone/ordinateur, comportement des salles anciennes avec version épinglée, et validation dramaturgique finale. Le champ `human_playtest_verified` demeure `false`.

**Réserve éditoriale :** un audit de conformité et de sécurité n'établit pas que l'intensité psychologique du scénario atteint un objectif subjectif de 10/10. La crédibilité des décisions doit encore être évaluée par des joueurs.
