# OMERTÀ — Indic : règle finale anti-arbitraire (27 octobre 2026)

**Statut : implémentation sur la PR #379 en brouillon. Ne pas déployer tant que les critères de publication et les tests serveur/clients ne sont pas validés.**

## Une règle simple

L'Indic doit **sauver sa peau** (objectif personnel du scénario et survie selon son contrat) **et renseigner l'enquête**. La seconde condition est calculée par le serveur uniquement à partir d'un renseignement canonique effectivement transmis, enregistré et éligible.

**Aucun joueur, y compris l'Enquêteur, ne peut par un simple avis subjectif accorder ou retirer la réussite de cette condition.** Il peut utiliser l'information, la contester ou mentir dans le récit, mais la réception d'une carte consignée est indéniable pour l'application.

## Trois sujets, parole libre

- **Je souhaite en parler** : l'Enquêteur reçoit une intention, uniquement le titre. Cela ne valide rien.
- **J'en ai déjà parlé** : après la conversation orale, l'Indic consigne un renseignement précis. Le serveur valide provenance, appartenance, salle, rôle, phase et doublons, puis remet le contenu à l'Enquêteur dans un événement privé.
- Une carte déjà consignée reste marquée comme telle et n'est ni redemandée ni retransmise.
- **Fin de cycle : « As-tu partagé une information ? »** avec Oui / Non, uniquement si aucun renseignement n'a été enregistré durant ce cycle. Oui ouvre les trois cartes ; le choix de la carte est l'enregistrement vérifiable. Non masque le rappel pour ce cycle.
- Aucune retranscription orale complète ni validation de l'Enquêteur n'est exigée. Une discussion non consignée ne peut être prouvée techniquement : le rappel sert précisément à éviter cet oubli.

## Victoire et impartialité

- `indic_second_ok = existe(renseignement_canonique_transmis_et_vérifié)`, uniquement pour la salle, le joueur et le `match_no` actifs.
- `victoire_indic = objectif_personnel_reussi && indic_second_ok && survie` (selon le contrat précis de la variante).
- Un renseignement simplement annoncé, non transmis, non vérifié ou seulement supposé utile ne valide jamais la condition.
- La confiance entre joueurs reste dramatique et narrative ; les conditions de victoire restent vérifiables par le système.
- Le formulaire subjectif de fin de partie est retiré du parcours. L'ancienne migration d'évaluation est exclue du paquet à publier.

## Garanties de confidentialité et de sécurité

Les trois sujets restent propres au suspect recruté ; ils ne doivent pas révéler la vérité, la branche A/B/C, ni les secrets d'autres personnages. Les transmissions sont privées à l'Enquêteur. Un même fait ne doit pas produire plusieurs crédits de coopération ; les actions sont isolées par `room_code`, `match_no`, `cycle` et `player_id`. Le verdict est résolu côté serveur, jamais depuis une case cochée par le client.

## Bloqueurs de publication

1. La base active conserve le canon historique **Verri**, alors que la version souhaitée est **Santoro**. Les cinq scénarios doivent être cohérents avant remplacement.
2. Les quinze variantes privées A/B/C sont en état `review`, non approuvées, sans chaînes de recoupement du cycle III validées. Le verrou serveur `release_eligible=false` est correct et ne doit pas être contourné.
3. Le mécanisme actuel `truth_verified` n'est vrai que pour certaines cartes du **021** ; **022–025 ne peuvent donc pas encore valider leur deuxième condition via une carte**. Ne pas activer ce gameplay tant que l'indexation canonique par scénario et variante n'est pas complète.
4. Les anciens RPC de révélations par niveau peuvent attribuer de la coopération séparément. Ils doivent être raccordés/neutralisés pour le seul parcours d'Indic sans casser les autres rôles.
5. Tester sur une base Supabase de développement, avec adversaires, doubles clics, rematch, reconnexion, droits privés, rôles et toutes les phases ; exécuter les builds web/mobile et une partie réelle. Pas de migration de production avant validation.

**À ce stade, ne pas fusionner la PR #379 ni déployer le nouveau moteur.**
