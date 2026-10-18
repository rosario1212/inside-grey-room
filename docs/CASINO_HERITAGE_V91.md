# Casino dans HÉRITAGE — intégration éditoriale v91

## Statut

Campagne reliée au service et au client v105.1. Les trois intrigues privées ont été approuvées pour intégration par l’utilisateur le 18 octobre 2026 et sont sélectionnables côté serveur. Les trois chapitres partagent la même sauvegarde et la même intrigue. Le code serveur et les manuscrits privés ne doivent **jamais** être inclus dans le JavaScript public. Voir [le relevé actuel](CASINO_V105_VALIDATION.md).

## Navigation

La campagne Casino apparaît comme quatrième campagne dans le hub HÉRITAGE. Elle présente trois chapitres (3/3/2 phases), sans interrompre CENDRES, KUROI, MAÎTRE ni les DLC. Les quatre affiches validées sont conservées. Pas de phrases d’accroche sur les affiches. L’accès premium existant conserve la maîtrise de l’ouverture du hub.

## Casting

Les humains incarnent leurs propres personnages : si Ali est attribué à une fonction de Yonghe comparable à Mei Xinyi, sa carte porte « Ali » comme identité, sans l’identifier comme une personne qui jouerait Mei. Les biographies sont adaptées à l’identité du joueur. Le personnel non incarné devient PNJ ; Wei Jianlong et Chan Wai-lun sont des PNJ centraux.

## Contrat des trois scénarios

1. **Les Portes de l’Impérial** : poker collectif obligatoire ; négociations indépendantes du poker ; jetons non monétisables ; accords, territoires, influence, réputation et Registre ; bureau séparé ; espion(s) inconnu(s) ; salle secrète et cinq déductions de l’Agent.
2. **La Chute de l’Impérial** : intervention physique et narrative de l’Agent, demandes d’interpellation motivées et corroborées ; entretiens, dossiers, cartographie des organisations et détention avec action continue pour les détenus.
3. **Le Dernier Dragon** : audience, corruption détectable, successions sans seuil automatique, nomination possible par un Dragon encore crédible, scission éventuelle, conséquences judiciaires et individuelles.

## Garanties du lancement serveur

- Session serveur durable, atomique et idempotente, restaurable après connexion interrompue, y compris sur des appareils distincts.
- Contrôles d’autorisation côté serveur empêchant tout joueur du casino d’accéder aux informations du bureau ou aux secrets des autres, et vice-versa ; épreuve explicite de non-fuite.
- Poker avec distribution et règlements autoritaires ; machine à sous avec table de gains explicitée, hasard contrôlé, jetons sans conversion monétaire.
- Registre à signatures, territoires à revendication non automatique, PNJ capables de réactions déterministes et explicables, réputation visible mais secrets privés.
- Canons et variantes complètes approuvés en stockage privé ; intrigue fixée une fois pour trois chapitres ; aucun choix ne réécrit rétroactivement la vérité.
- Rôles additionnels Procureur/Juge facultatifs ; si absents, procédure préétablie. L’Agent mène personnellement les interpellations dans la partie.
- Tests avec 4–7 joueurs du casino, 0–2 infiltrés (au maximum un à quatre), membres du bureau dans une autre pièce, reprises, reconnections, mobile/tablette/desktop.

## Affiches

Les quatre compositions WebP approuvées de la branche sont conservées. Catalogue, vignettes et chapitres utilisent `object-fit: contain` pour préserver leurs compositions. Aucun visage ou slogan n’est ajouté.
