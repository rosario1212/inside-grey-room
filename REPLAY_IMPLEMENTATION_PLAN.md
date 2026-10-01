# Activation plan — rejouabilité + DLC

## Pourquoi deux migrations

`gameplay-flow-v13.sql` reste le socle de rythme déjà audité. `replayability-dlc-v13.sql` ajoute seulement les primitives nécessaires à la sélection de variantes et à l’état visuel des DLC. Cette séparation évite de casser OMERTÀ ou les révélations existantes avant que les variantes canoniques soient entièrement authorées.

## Activation d’un scénario rejouable

Un scénario ne doit recevoir `pack.replay_variants` qu’une fois **au moins 3 variantes complètes** prêtes. Chaque objet doit contenir au minimum :

```json
{
  "id": "A",
  "truth": {"levels": [2,3,1], "summary": "..."},
  "suspects": [ ... cartes complètes ... ],
  "relations": { ... },
  "trames": [ ... ],
  "role_notes": { ... },
  "event_profile": { ... }
}
```

Au lancement :

1. le serveur choisit la variante ;
2. son identifiant reste serveur-only ;
3. le builder de carte lit la variante choisie ;
4. le directeur de trames ne lit que le pool de cette variante ;
5. la révélation lit uniquement `truth` de cette variante ;
6. reconnexion = même variante ;
7. prochaine partie = éviter si possible la variante jouée précédemment.

## Sécurité

Ne jamais envoyer au client :
- `replay_variant_id` ;
- le tableau des variantes ;
- les trames non encore révélées ;
- les vérités alternatives ;
- les objectifs privés des autres rôles.

## DLC

Les compteurs de monde (`dlc_world`) sont des états narratifs publics. Ils ne doivent jamais contenir d’information tactique cachée ni servir à calculer une vérité. Leur progression doit être déclenchée par des checkpoints pré-écrits du scénario/variante.
