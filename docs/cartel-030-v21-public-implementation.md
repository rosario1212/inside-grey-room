# CARTEL 030 — La Cour achetée · Remplacement éditorial V21

## Mission prioritaire
La Grey Room doit **reconstituer les faits** de l'assaut contre la résidence du gouverneur de Puerto Ceniza et **reconstruire le contenu du registre REG-118**, détruit pendant l'opération : personnes, fonctions, actes, liens et degrés de certitude. Identifier un tireur ne suffit pas.

## Structure
- 3 suspects survivants : Damián Salcedo, l'Exécuteur et le Traqueur.
- 3 cycles et mêmes procédures officielles que le jeu classique : assemblées, interrogatoires, confrontations, échanges libres, audience finale.
- Les informations sur le registre sont réparties entre les trois survivants et des archives indépendantes. Le silence total des suspects ne doit pas rendre l'enquête insoluble.
- Les variantes A/B/C, les cartes privées et les pièces conditionnelles sont conservées **uniquement dans le schéma privé Supabase**. Ne jamais ajouter le dossier auteur ou les solutions au dépôt public.

## Nombre de taupes appliqué
| Participants | Taupes | Rôles existants |
| --- | --- | --- |
| 7 | 1 | Enquêteur, Analyste, Procureur, Juge, 3 suspects |
| 8 | 1 | Les précédents + Avocat |
| 9 | 2 | Les précédents + Journaliste |

La taupe reste un rôle de couverture existant, sans nouveau pouvoir. La deuxième taupe ne dispose pas d'une deuxième falsification de preuve. Le serveur tire les couvertures compatibles au hasard et conserve les identités dans les données privées de chaque joueur.

## État de l'intégration
- Présentation publique V21 : actualisée.
- Pack de scénario 030 dans Supabase : actualisé (contexte, suspects, trames, relations, actualités et pistes journalistiques).
- Manuscrits privés A/B/C : V21 au statut **ready**, publication autorisée par l'auteur le 20 octobre 2026 et contrôles techniques validés.
- Un instantané privé propre à la partie fixe ensemble les cartes, les pièces et la révélation finale. Les éditions ultérieures ne changent pas une partie en cours.
- Une relance reçoit un nouvel instantané et masque les anciennes pièces et révélations.
- Les métadonnées `cartel030-release.json` permettent de vérifier le commit effectivement publié. Le dernier finaliseur aligne le script principal et le cache PWA après les anciens modules.
- Ne pas considérer les scénarios 029 et 031 comme modifiés.

## Vérification de publication
1. Douze lancements serveur : 7/8/9 participants, modes court/long et relance de chaque composition.
2. Fiches propres au participant et absence de secrets dans la liste publique des joueurs.
3. Vingt-trois pièces : 6 au premier cycle, 7 supplémentaires au deuxième et 10 au troisième ; contrôle des accès et des doublons.
4. Fin de partie par la procédure existante, avec le texte de révélation issu du même instantané que les cartes.
5. Rendu du script réellement construit, échappement du texte, installation et constructions web/mobile, puis vérification du commit servi par Cloudflare.

L'autorisation de publication vient de l'auteur. Les indicateurs réservés à une revue éditoriale indépendante restent distincts des contrôles automatisés.
