# Inside Grey Room — estimation d'activité des rôles v697

Les étoiles reflètent la **fréquence attendue des interventions, décisions et interactions**, et non la difficulté, la qualité, l'influence stratégique ou la probabilité de gagner. Échelle de ★☆☆☆☆ à ★★★★★. Ces évaluations sont indicatives et dépendent du scénario, de la composition de la partie et de l'initiative des joueurs.

| Rôle public | v697 | Justification |
|---|---|---|
| Enquêteur | ★★★★★ | Interrogatoires, coordination, convocation, verdict |
| Suspect | ★★★★☆ | Interrogatoires, négociations, défense, secret |
| Officier (Terreur 026–028) | ★★★★★ | Trois ordres militaires par cycle et interventions en séance |
| Inspecteur | ★★★☆☆ | Jusqu'à trois explorations par cycle, interventions libres |
| Journaliste | ★★★☆☆ | Pistes indépendantes, Breaking News, enquêtes |
| Procureur | ★★★★☆ | Négociations, coopérations et décision finale |
| Juge | ★★★★☆ | Arbitrages, protections et décision finale |
| Avocat | ★★★★☆ | Client officiel, consultations, assistance |
| Analyste | ★★★☆☆ | Recoupements, Assemblées et note indépendante par cycle |
| Expert | ★★☆☆☆ | Une analyse par cycle, une contre-expertise par partie, consultations libres |
| Témoin | ★★☆☆☆ | Une initiative par cycle, témoignages libres, interventions variables |

L'Expert et le Témoin n'obtiennent pas automatiquement 3 étoiles : leur volume d'actions reste partiellement dépendant des convocations ou des options proposées. Une influence décisive est possible malgré 2 étoiles.

## Rôles spécifiques des DLC

Ces évaluations utilisent la même échelle d'activité, indépendamment des choix du Juge ou des sièges occupés.

| Rôle | Activité |
|---|---|
| Associato (Omertà) | ★★★☆☆ |
| Uomo d'Onore (Omertà) | ★★★★☆ |
| Contabile (Omertà) | ★★★☆☆ |
| Pentito (Omertà) | ★★★★☆ |
| Caporegime (Omertà) | ★★★★☆ |
| Consigliere (Omertà) | ★★★☆☆ |
| Sottocapo (Omertà) | ★★★★☆ |
| Don (Omertà / Cartel) | ★★★★☆ |
| Bras droit (Cartel) | ★★★☆☆ |
| Informateur (cas particuliers) | ★★★☆☆ |

Dans Omertà, les personnages mafieux relèvent du type interne `suspect`, mais la carte générique **Suspect** n'est pas proposée au choix. Les rangs disponibles sont affichés à sa place. Cela ne modifie pas l'attribution canonique du dossier.

Les mêmes notes doivent apparaître dans **les cartes de choix des rôles** et dans **Règles → Comment jouer chaque rôle**, en français et en anglais. Fichier canonique de la sélection : \`natural-role-gameplay-v50.js\`; règlement : \`self-guided-rules-v51.js\`. Le contrôle \`v697-activity-stars-check.mjs\` empêche une divergence entre les deux.
