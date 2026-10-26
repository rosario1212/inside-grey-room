# OMERTÀ — Évaluation finale de l'Indic (spécification de gameplay)

**Statut : conception approuvée, intégration logicielle à effectuer après raccordement de l'Indic.** Cette spécification n'active pas de nouvelle règle en production.

## Principe

L'Indic gagne seulement si **toutes** les conditions personnelles suivantes sont réunies :
1. **Intérêt personnel** : son objectif égoïste, choisi au lancement et verrouillé, est rempli.
2. **Coopération réelle** : il a transmis à l'Enquêteur au moins un renseignement vérifiable, pertinent pour la branche en cours et susceptible de faire progresser l'enquête.
3. **Survie** : il est encore en vie à la fin du dossier (sauf si une variante explicite prévoit une autre issue, définie avant la partie).

Aucun avis subjectif d'un joueur ne peut, à lui seul, confirmer ou annuler l'une de ces conditions.

## Écran de clôture : Enquêteur uniquement

**Moment :** juste avant la révélation des résultats, après le verrouillage de la reconstruction finale, uniquement si un Indic a réellement été recruté dans ce dossier.

> **OMERTÀ · BILAN DE SOURCE**
>
> **Selon vous, cet Indic a-t-il réellement fait progresser votre enquête ?**
>
> - Oui : ses renseignements m'ont été utiles.
> - Non : ils étaient insuffisants ou inutiles.
>
> *Votre appréciation sera confrontée aux éléments réellement transmis. Elle ne décide pas, à elle seule, du sort de l'Indic.*

Le choix est **privé**, attribué à l'Indic concerné et **modifiable tant que le formulaire n'est pas verrouillé**. En cas d'absence / expiration de la fenêtre finale : `sans_avis`. Il ne doit pas bloquer la fin de partie des autres joueurs. Si plusieurs sources sont possibles, un formulaire distinct par Indic, jamais un vote global.

## Ce que le jeu peut et ne peut pas savoir

- **Impossible à déduire :** la motivation de l'Enquêteur, sa vengeance, son ressentiment, une conversation orale qui n'a pas été capturée.
- **Traçable côté serveur :** faits transmis par un mécanisme en jeu, provenance, cycle, destinataire, statut de vérification, liens avec la branche et étapes d'enquête débloquées.
- **Insuffisant :** une simple déclaration de « révélation majeure » ou un score de coopération auto-attribué par l'Indic. Les actions existantes `omerta_reveal` (niveau 1/2/3) sont des confirmations déclaratives ; elles ne prouvent pas seules que l'information orale était vraie ou utile.

**Précondition d'intégration complète :** ajouter des renseignements à identifiants uniques et vérité serveur, sélectionnés explicitement par l'Indic puis transmis effectivement à l'Enquêteur, sans exposer les informations privées d'autres joueurs. L'information peut être introduite à l'oral avant confirmation dans le jeu ; seul le transfert authentifié fait foi pour le score. Déduplication, contrôle des cycles, droits de visibilité et variante fixée au départ.

## Calcul non arbitraire

- `avis_enqueteur` ∈ {`oui`,`non`,`sans_avis`} : utilisé pour le bilan narratif, **jamais comme condition de victoire automatique**.
- `cooperation_verifiee` : vraie uniquement si ≥1 renseignement réellement transféré et pertinent selon la vérité serveur, **non déjà disponible gratuitement à l'Enquêteur**.
- `victoire_indic = objectif_personnel_atteint && cooperation_verifiee && survie`.

Exemples :
- Avis « non », information réellement utile : coopération validée ; cela peut refléter de la méfiance, mais **ne prouve pas** une vengeance.
- Avis « oui », aucune transmission valide : coopération non validée ; impossible de s'accorder une victoire de complaisance.
- Aucune réponse : calcul conservé, appréciation « non renseignée ».

## Sécurité et conditions de publication

- Évaluer les critères depuis le serveur sur un **instantané verrouillé**, non depuis un paramètre envoyé par le client.
- Seul le compte joueur authentifié avec le rôle Enquêteur dans la salle peut enregistrer son avis ; pas d'accès public aux réponses privées avant la révélation.
- Empêcher doubles validations, réponses hors phase, votes concernant une autre salle/Indic, et modifications après verrouillage.
- Tester les scénarios 021–025, parties sans Indic, Indic recruté au cycle 2+, joueurs déconnectés, indicateurs morts/protégés, et toutes les branches de verdict.
- **Ne pas déployer en production une modalité de vote isolée qui influerait sur la victoire tant que le suivi des renseignements vérifiés et les tests de non-régression ne sont pas prêts.**
