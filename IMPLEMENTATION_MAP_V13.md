# Inside Grey Room v13 — carte d’implémentation

## Portée

Le moteur de rythme audité reste activé d’abord sur **001–020** afin de préserver la stabilité. Les DLC 021–034 reçoivent désormais une couche d’expérience et un contrat d’intégration séparés (`dlc-experience-v13.js`, `DLC_SIGNATURE_MECHANICS.md`, `replayability-dlc-v13.sql`). Cela évite de casser OMERTÀ en forçant son moteur de campagne dans le même chemin serveur.

La couche v13 ne remplace pas `app-v11.js`. Elle se charge après `gameplay-clean-v12.js` et réutilise les panneaux existants des rôles spécialisés. Le but est de réduire la surface de régression.

## Compatibilité de phase

Pour la première intégration, `initial_debrief` reste le nom de phase serveur mais devient **PRÉ-ENQUÊTE** côté joueur. Cela évite de casser les anciens contrôles, la reprise de session et les fonctions qui connaissent déjà cette phase.

Flux :

`briefing → role_reading (5:00) → initial_debrief / PRÉ-ENQUÊTE (3:00) → cycle 1`

Pendant la pré-enquête :

- Enquêteur + Analyste préparent la première convocation ;
- les Suspects discutent librement en Salle d’attente ;
- leurs relations privées existantes sont déjà disponibles dans leur carte ;
- Avocat, Juge, Procureur, Expert, Inspecteur et Journaliste prennent leur place ;
- aucune convocation avant 00:00.

## État v13 ajouté dans `room.state`

- `interrogation_limit`
- `interrogation_count`
- `event_slots_total`
- `event_slots_used`
- `event_options`
- `event_types_used`
- `event_interrogations`
- `confrontations_used`
- `event_active`
- `event_targets`
- `event_participants`
- `v13_event_mode`
- `v13_event_history`

Aucune nouvelle table n’est requise.

## Cycles

### Avec Analyste

- C1 : 3 interrogatoires × 8:00.
- Débrief : 2:00 incompressibles + 2 questions MJ.
- C2 : 2 interrogatoires × 8:00.
- Débrief : 2:00 incompressibles + 2 questions MJ.
- C2 : 2 événements annexes.
- C3 : 3 événements annexes ; au plus 1 peut être un interrogatoire de 8:00.
- Pré-verrouillage : 3:00.

### Sans Analyste

Même structure, mais le C3 autorise jusqu’à 2 interrogatoires parmi ses 3 événements.

## Timers

Pour 001–020 :

- pas de pause ;
- pas de bouton « terminer l’interrogatoire » ;
- pas de skip hôte sur les phases chronométrées ;
- le serveur reste source de vérité ;
- à 00:00 la transition est autoritaire.

Les DLC gardent leur comportement actuel.

## Convocation

L’Enquêteur choisit toujours qui entre. L’app ne remplace pas le déplacement humain.

Copie :

> CONVOCATION  
> Karim est convoqué dans la Grey Room.  
> 08:00.

L’Enquêteur ou l’Analyste peut aller chercher physiquement le joueur.

## Salle d’attente

La Salle d’attente est active avant et entre les scènes formelles. Aucun compteur de conversations. Aucun mini-jeu social. Aucun micro d’analyse.

L’Inspecteur peut parler informellement aux Suspects. Si le Journaliste l’observe, cela devient une matière humaine : il peut enquêter, confronter, publier ou collaborer. **Aucune pénalité automatique n’est inférée par l’application.**

## Expert

L’Expert peut être présent dans la Grey Room comme observateur technique silencieux. L’interface le rappelle pendant les interrogatoires. Il ne parle que lorsqu’une scène d’expertise ou une Assemblée lui donne la parole.

## Assemblée

- C1 : impossible.
- C2 : disponible si Analyste + au moins un troisième rôle d’enquête est présent. Tous les rôles concernés sont admis.
- C3 : même condition, mais l’Enquêteur peut restreindre les participants. Enquêteur et Analyste restent requis.
- Une Assemblée maximum par cycle.

## Confrontation

Scène de 3:00, sélectionnée par l’Enquêteur. Deux personnes sont convoquées. Le moteur ne lit jamais leur conversation. Plusieurs Confrontations peuvent être utilisées dans un cycle lorsque peu de rôles spécialisés sont présents, ce qui évite de bloquer les scénarios simples.

## Événements annexes

Clés supportées :

- `interrogation`
- `confrontation`
- `assembly`
- `expertise`
- `retour_inspecteur`
- `temoin`
- `enquete_journalistique`
- `enquete_croisee`
- `procureur`
- `juge`
- `negociation`
- `requete`
- `saisine`

Les options visibles sont calculées uniquement à partir du cycle et des rôles publics présents. Aucun secret n’est envoyé au client pour décider des options.

## Inspecteur ↔ Journaliste

`ENQUÊTE CROISÉE` est disponible lorsque les deux rôles sont présents à partir du cycle 2. Les deux peuvent travailler sur la même piste, mais la collaboration n’annule pas leurs intérêts propres.

L’Inspecteur peut utiliser son action de terrain. Le Journaliste peut utiliser son enquête personnelle. Chacun garde son objectif privé.

## Journaliste — enquêter sur une personne

Une enquête journalistique formelle utilise :

- une cible ;
- un angle (`relations`, `interets`, `incoherences`, `passe`, `contacts`, `conflit`) ;
- une piste canonique écrite dans `scenario_pack.journalist_leads`.

Le moteur ne dérive jamais une « vérité » d’un comportement joueur.

Format d’une piste :

```json
{
  "target_slot": 2,
  "angle": "incoherences",
  "min_cycle": 2,
  "title": "RÉSERVE PUIS SIGNATURE",
  "text": "Le clinicien écrit que la poursuite est dangereuse, puis signe pour continuer."
}
```

Le SQL fourni ajoute des pistes sûres pour 015, 016, 019 et 020. Si aucune piste écrite n’existe, le système répond qu’aucun élément vérifiable supplémentaire n’est disponible : il n’invente rien.

## Avocat ↔ Procureur ↔ Juge

- `NÉGOCIATION` : Avocat ↔ Procureur, 3:00.
- `REQUÊTE` : Avocat ↔ Juge, 2:00.
- `SAISINE` : Procureur ↔ Juge, 2:00.

La conversation est humaine. L’issue `accepted` / `refused` peut être verrouillée par le rôle compétent.

## Corruption institutionnelle

Aucun rôle public « corrompu » n’est créé.

Pour un Juge ou un Procureur compromis, écrire seulement une instruction privée dans le pack :

```json
"role_notes": {
  "juge": {
    "objective_main": "Rends une décision défendable.",
    "objective_secondary": "Karim ne doit pas tomber."
  }
}
```

La carte publique reste **JUGE**. L’objectif privé est le seul conflit. Le rôle ne peut pas inventer de preuve ni changer le canon.

## Objectifs

Le builder de carte ajoute :

- `objective_main`
- `objective_secondary`

Pour les Suspects, le fallback reprend la `position` existante comme objectif principal et l’élément `hide` comme tension secondaire. Les auteurs peuvent remplacer ces deux champs par des objectifs plus précis dans chaque scénario.

Pour les rôles d’enquête, l’objectif principal reste institutionnel. `role_notes.<role>.objective_secondary` permet les objectifs spécifiques, y compris une corruption cachée.

## MJ adaptatif

Deux questions seulement :

1. **Vous vous rapprochez d’une conclusion ?** — Non / Un peu / Oui.
2. **Le dossier reste difficile à relier ?** — Non / Un peu / Oui.

Les réponses de l’Enquêteur et de l’Analyste sont séparées. L’envoi ne raccourcit jamais le débrief de 2:00.

Le directeur adaptatif actuel reste responsable du choix entre clarté, ambiguïté et équilibre. La vérité canonique ne change pas.

## Trames

Les packs actuels et le directeur adaptatif sont conservés. La v13 ne génère aucune preuve. Les nouvelles trames doivent rester pré-écrites et classées mentalement comme :

- structurantes ;
- ambiguës ;
- recontextualisantes ;
- choc.

Le langage reste froid, bref et violent par le fait.

## Performance

La couche client :

- ne crée aucun nouvel intervalle ;
- ne crée aucun `MutationObserver` ;
- réutilise `syncNow`, `STATE`, les panneaux existants et le heartbeat serveur ;
- n’ajoute des requêtes qu’au moment où un joueur déclenche une action ;
- garde le serveur comme source de vérité.

## Extension v13.1

- Contrat de rejouabilité 001–034 : `REPLAYABILITY_001_034.md`.
- Trois directions canoniques minimum par scénario : `scenario-replay-contracts-v13.json`.
- Mécaniques signature DLC : `DLC_SIGNATURE_MECHANICS.md`.
- État narratif public DLC + sélection de variante serveur : `replayability-dlc-v13.sql`.

## Non inclus volontairement

- Mode Héritage : doit venir après validation du socle.
- Génération automatique de preuves ou de vérités : interdite.
- Activation d’une variante incomplète : interdite.
