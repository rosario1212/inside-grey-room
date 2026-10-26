# OMERTÀ — Évaluation finale de l'Indic (spécification de gameplay)

**Statut : prototype fonctionnel de transmission financière pour 021 sur une branche de développement.** La règle générale de victoire de l'Indic et le vote final de l'Enquêteur ne sont PAS encore déployés. Aucune modification des verdicts de production n'est réalisée.

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

## Intégration pilote : « Les transferts d’argent » (021)

**Implémentation GitHub sur cette branche :**
- `supabase/migrations/20261026233500_omerta_money_intel_021.sql` : RPC `igr_omerta_money_intel_options` (renseignement autorisé) et `igr_omerta_money_intel_send` (transfert authentifié et atomique).
- `omerta-money-intel-v1.js` et `.css` : nouvelle carte privée à ouvrir **après la discussion orale** ; pas de saisie libre ni d'analyse automatisée des paroles.
- `scripts/omerta-money-intel-021-check.mjs` : contrôle statique des règles serveur et simulation de l'interface.

**Vérité canonique de 021 :** slot 1 = une partie de l'enveloppe devait revenir au cercle Rinaldi ; slot 7 = une somme supplémentaire absente des comptes. L'accès est lié au slot réellement attribué au joueur et aux secrets inscrits dans sa carte privée ; toute autre carte est rejetée par le serveur. Si une variante modifie ces faits, la carte n'est pas proposée.

**Règles :** dès le cycle 2, uniquement en partie active, une transmission de renseignement par joueur et par cycle ; un même fait ne peut être livré officiellement qu'une fois par partie, avec isolation par `match_no`. Le serveur verrouille la salle, vérifie le token, le rôle et la connaissance, puis écrit une action sans texte secret et un événement privé ciblé sur l'Enquêteur. Le contenu n'est ni diffusé publiquement ni envoyé aux autres Suspects.

**Limites actuellement explicites :** `truth_verified=true` signifie que **le contenu de cette carte est ancré dans le canon serveur**, et `first_official_delivery=true` que cette carte n'avait pas été officiellement envoyée auparavant. Cela ne démontre PAS que l'information n'a jamais été dite oralement ou découverte par une autre voie. Ce signal peut nourrir une future seconde condition de victoire, mais n'altère pas encore le verdict OMERTÀ. Le vote final envisagé séparément n'est pas présent dans l'interface.

**Publication :** appliquer et éprouver la migration sur un environnement de test Supabase, puis valider les permissions, le compte à rebours, les variantes et les 5 dossiers avant toute fusion et mise en production. Tant que ces tests n'ont pas eu lieu, conserver la PR en brouillon.
