# Inside Grey Room — Tribunal unique v708 (proposition non déployée)

## Transition après le cycle 3
- **Juge présent** : après la fermeture du cycle 3, le serveur passe directement à `final_suspect_defenses`, avec `v52_stage='courtroom'` et `v708_court_step='seating'`. Aucune audience préparatoire n'est lancée.
- **Sans Juge** : audience des rôles (parler ou passer), défenses chronométrées des Suspects, verrouillages du camp Enquête ; fonctionnement existant inchangé.
- **029** : les conclusions restent basées sur le rapport des témoins ; aucune échelle de culpabilité artificielle.

## Placement facultatif
À l'arrivée, tous voient un plan de salle responsive (consultable ensuite en repliant/dépliant le bloc) :
- **Juge** en face.
- **Accusation** : Procureur, Enquêteur, Analyste, Inspecteur, Expert, uniquement si ces rôles sont présents.
- **Défense** : Avocat et Suspects.
- **Côté** : Témoins et Journaliste quand présents.

Noms et rôles publics sont affichés. Aucune place n'est imposée ; une réunion autour d'une table suffit. Rien sur les alliances secrètes n'est affiché.

## Progression serveur
Quatre états synchronisés, sans chronomètre :
1. **Installation** (`seating`) : tous voient le plan ; seul le Juge peut ouvrir.
2. **Accusations** (`opening`) : le Procureur porte l'accusation ; en son absence, l'Enquêteur. Le Juge peut passer aux débats.
3. **Débats libres** (`debate`) : le Juge organise questions, confrontations et rappels ; chaque Suspect peut valider `defense_done` (ou choisir le silence). Aucune saisie des discours ni de minutage.
4. **Conclusions** (`conclusions`) : réquisitions, réponse de la défense, dernier mot. Chaque Suspect confirme `last_word_done`. Le Juge peut revenir aux débats.

Le Juge peut clôturer seulement si chaque Suspect présent a confirmé **sa défense et son dernier mot**. Une absence formellement confirmée par l'hôte, avec motif visible, permet de poursuivre sans inventer aucune déclaration ni aucun vote. Après clôture, la fonction existante ouvre le vote secret ; aucun barème de victoire n'est modifié.

## Guide du Juge : facultatif et persistant
Six sujets que le Juge peut cocher ou décocher ; l'application enregistre uniquement ces coches (pas de paroles, pas de notes privées, pas de dévoilement d'alliances) :
- Accusations ;
- Éléments du dossier ;
- Contradictions et accords **déjà révélés** ;
- Possibilité de se défendre ;
- Réquisitions et réponses ;
- Dernier mot.

Les coches **ne déclenchent pas** le passage d'étape : le Juge utilise des commandes séparées. Les obligations de défense et de dernier mot sont des confirmations explicites individuelles, non de simples cases cochées par le Juge.

## Aide spécifique par rôle
Le Juge a sa checklist ; Procureur/Enquêteur, Analyste, Inspecteur, Expert, Avocat, Suspect, Témoin et Journaliste voient des consignes propres à leur rôle et aux rôles effectivement présents. Personne ne reçoit une information secrète nouvelle par ce guide.

## Vérification
- Compilation JavaScript statique : à exécuter en CI.
- SQL transactionnel : validé en modes COURT et LONG, absence d'Audience séparée avec Juge, conservation de la finale sans Juge, refus de la clôture anticipée, validation du dernier mot, checklist serveur, récupération après absence sans déclaration artificielle.
- Les migrations n'ont été appliquées que dans des **transactions annulées** pour les tests. Production inchangée.

**Statut : PR #517 encore en brouillon. Pas de publication en production ni de test humain multi-appareils.**

## v709 — Durées prévisionnelles et activité par rôle

Le tribunal unique remplace l'audience et les comparutions minutées en présence d'un Juge ; son temps n'est pas plafonné. La sélection de durée indique une estimation globale pour une partie typique de sept joueurs avec trois Suspects : **COURT ≈45–70 min** et **LONG ≈70–105 min**. La préparation des débats est estimée à **15–25 min en COURT** et **20–35 min en LONG**, sans minuteur ni obligation de conclure à ces seuils. Les variations du nombre de Suspects et du nombre de joueurs modifient l'estimation du salon. Les anciennes estimations sont inchangées sans Juge.

Les étoiles d'activité restent une estimation de participation, pas de difficulté ou de pouvoir : **avec Juge**, Enquêteur 4/4, Analyste 4/4, Procureur 4/4, Juge 4/4, Avocat 4/4, Suspect 4/4, Inspecteur 4/4, Expert 3/4, Journaliste 4/4, Témoin 3/4. Les valeurs d'avant tribunal demeurent sans Juge, et la présentation globale ne présume pas d'un Juge présent.

**Clarification du verdict** : les membres du camp Enquête enregistrent chacun leur évaluation, mais il ne s'agit pas d'une majorité sur les responsabilités officielles. Le serveur applique l'autorité hiérarchique Juge > Procureur > Enquêteur, avec conditions individuelles et règles propres à certains scénarios. Aucun barème de victoire ou calcul de majorité n'a été changé dans v709.
