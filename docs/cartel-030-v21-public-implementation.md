# CARTEL 030 — La Cour achetée · Remplacement éditorial V21

## Mission prioritaire
La Grey Room doit **reconstituer les faits** de l'assaut contre la résidence du gouverneur de Puerto Ceniza et **reconstruire le contenu du registre REG-118**, détruit pendant l'opération : personnes, fonctions, actes, liens et degrés de certitude. Identifier un tireur ne suffit pas.

## Structure
- 3 suspects survivants : Damián Salcedo, l'Exécuteur et le Traqueur.
- 3 cycles et mêmes procédures officielles que le jeu classique : assemblées, interrogatoires, confrontations, échanges libres, audience finale.
- Les informations sur le registre sont réparties entre les trois survivants et des archives indépendantes. Le silence total des suspects ne doit pas rendre l'enquête insoluble.
- Les variantes A/B/C, les cartes privées et les pièces conditionnelles sont conservées **uniquement dans le schéma privé Supabase**. Ne jamais ajouter le dossier auteur ou les solutions au dépôt public.

## Nombre de taupes envisagé
| Participants | Taupes | Rôles existants |
| --- | --- | --- |
| 7 | 1 | Enquêteur, Analyste, Procureur, Juge, 3 suspects |
| 8 | 1 | Les précédents + Avocat |
| 9 | 2 | Les précédents + Journaliste |

La taupe reste un rôle de couverture existant, sans nouveau pouvoir. La deuxième taupe ne dispose pas d'une deuxième falsification de preuve. La sélection et la confidentialité des taupes doivent être validées côté serveur avant activation.

## État de l'intégration
- Présentation publique V21 : actualisée.
- Pack de scénario 030 dans Supabase : actualisé (contexte, suspects, trames, relations, actualités et pistes journalistiques).
- Manuscrits privés A/B/C : remplacés par la V21, statut **review**, non activés tant que les tests de confidentialité, d'attribution des taupes et de lecture des variantes ne sont pas validés.
- Ne pas afficher de nombre de taupes comme mécanique active tant que le serveur ne l'applique pas.
- Ne pas considérer les scénarios 029 et 031 comme modifiés.

## Tests requis avant activation
1. Rôle et fiche privée propres au participant, jamais d'annexe A/B/C concurrente.
2. 7/8/9 participants, respectivement 1/1/2 taupes, aucune fuite des identités.
3. Pièces P01–P22, variantes et accès par cycle ; reconstitution du registre sans aveu.
4. Absence de pouvoirs nouveaux, respect des durées et des quotas classiques.
5. Audience finale et notation des responsabilités par variante, puis tests multijoueurs réels.
