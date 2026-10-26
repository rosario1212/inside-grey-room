# OMERTÀ — Évaluation finale de l'Indic (spécification de gameplay)

**Statut : parcours Indic « oral d'abord » et évaluation finale Oui/Non codés pour le scénario 021 sur une branche de développement, sans déploiement en production.** La généralisation à 022–025, les variantes A/B/C et les tests serveur/clients restent nécessaires.

## Principe

L'Indic gagne seulement si **toutes** les conditions personnelles suivantes sont réunies :
1. **Intérêt personnel** : son objectif égoïste, choisi au lancement et verrouillé, est rempli.
2. **Coopération reconnue** : soit l'Enquêteur répond **Oui, cet Indic m'a été utile** lors de l'évaluation finale (même si aucune carte n'a été utilisée), soit le jeu vérifie un renseignement canonique officiellement consigné qui remplit les critères prévus.
3. **Survie** : il est encore en vie à la fin du dossier (sauf si une variante explicite prévoit une autre issue, définie avant la partie).

**Exception voulue par le concepteur : l'avis POSITIF de l'Enquêteur peut suffire à confirmer la deuxième condition.** Un avis négatif n'est pas un veto si une transmission canonique vérifiée existe. L'avis ne dispense jamais de la condition personnelle ou de survie.

## Écran de clôture : Enquêteur uniquement

**Moment :** juste avant la révélation des résultats, après le verrouillage de la reconstruction finale, uniquement si un Indic a réellement été recruté dans ce dossier.

> **OMERTÀ · BILAN DE SOURCE**
>
> **Selon vous, cet Indic a-t-il réellement fait progresser votre enquête ?**
>
> - Oui : ses renseignements m'ont été utiles.
> - Non : ils étaient insuffisants ou inutiles.
>
> *Si vous répondez Oui, la condition de coopération est validée, même sans utilisation du téléphone. Cela ne garantit pas la victoire complète.*

Le choix est **privé**, attribué à l'Indic concerné et **modifiable tant que le formulaire n'est pas verrouillé**. En cas d'absence / expiration de la fenêtre finale : `sans_avis`. Il ne doit pas bloquer la fin de partie des autres joueurs. Si plusieurs sources sont possibles, un formulaire distinct par Indic, jamais un vote global.

## Ce que le jeu peut et ne peut pas savoir

- **Impossible à déduire :** la motivation de l'Enquêteur, sa vengeance, son ressentiment, une conversation orale qui n'a pas été capturée.
- **Traçable côté serveur :** faits transmis par un mécanisme en jeu, provenance, cycle, destinataire, statut de vérification, liens avec la branche et étapes d'enquête débloquées.
- **Insuffisant :** une simple déclaration de « révélation majeure » ou un score de coopération auto-attribué par l'Indic. Les actions existantes `omerta_reveal` (niveau 1/2/3) sont des confirmations déclaratives ; elles ne prouvent pas seules que l'information orale était vraie ou utile.

**Précondition d'intégration complète :** ajouter des renseignements à identifiants uniques et vérité serveur, sélectionnés explicitement par l'Indic puis transmis effectivement à l'Enquêteur, sans exposer les informations privées d'autres joueurs. L'information peut être introduite à l'oral avant confirmation dans le jeu ; seul le transfert authentifié fait foi pour le score. Déduplication, contrôle des cycles, droits de visibilité et variante fixée au départ.

## Calcul non arbitraire

- `avis_enqueteur` ∈ {`oui`,`non`,`sans_avis`} : **oui** suffit à valider la deuxième condition ; `non` et `sans_avis` laissent subsister la vérification des cartes canoniques.
- `cooperation_verifiee` : vraie si **avis_enqueteur=oui**, indépendamment des trois cartes, OU si une transmission canonique vérifiée apporte une information admissible selon les règles serveur.
- `victoire_indic = objectif_personnel_atteint && cooperation_verifiee && survie`.

Exemples :
- Avis « non », renseignement canonique confirmé : coopération validée ; cela peut refléter de la méfiance, mais **ne prouve pas** une vengeance.
- Avis « oui », aucune carte transmise : **coopération validée**. L'Indic doit encore réussir son objectif personnel et survivre.
- Aucune réponse : calcul conservé, appréciation « non renseignée ».

## Sécurité et conditions de publication

- Évaluer les critères depuis le serveur sur un **instantané verrouillé**, non depuis un paramètre envoyé par le client.
- Seul le compte joueur authentifié avec le rôle Enquêteur dans la salle peut enregistrer son avis ; pas d'accès public aux réponses privées avant la révélation.
- Empêcher doubles validations, réponses hors phase, votes concernant une autre salle/Indic, et modifications après verrouillage.
- Tester les scénarios 021–025, parties sans Indic, Indic recruté au cycle 2+, joueurs déconnectés, indicateurs morts/protégés, et toutes les branches de verdict.
- **Ne pas déployer en production une modalité de vote isolée qui influerait sur la victoire tant que le suivi des renseignements vérifiés et les tests de non-régression ne sont pas prêts.**

## Implémentation pilote : recrutement, trois cartes et oral d'abord (021)

### Une conversion discrète, consentie
1. L'Enquêteur négocie librement avec un suspect à partir du cycle 2. Aucun clic ne précède obligatoirement la conversation.
2. Il ouvre ensuite « Proposer un pacte secret » et désigne ce suspect ; celui-ci reçoit une notification **privée**, sans diffusion aux autres suspects.
3. Le suspect peut accepter ou refuser. **Seulement après son acceptation**, une icône/entrée « Mes renseignements · Indic » apparaît.
4. Les RPC `igr_omerta_indic_offer` et `igr_omerta_indic_respond` sont authentifiées par les tokens de participants, limitées à la salle/au match, aux bons rôles et à une partie en cours ; une source recrutée maximum par match dans ce pilote. Aucune de ces actions ne change son rôle public.

### Trois titres, même après transmission
Le contenu vient du **dossier privé initial** du personnage, pas d'un modèle qui invente un témoignage. Chaque personnage du scénario 021 possède bien les trois sections nécessaires (`hide`, `chronology`, `anchors`) dans le pack actuellement disponible.

- Paolo Serra : **Les transferts d'argent**, **La remise de l'enveloppe**, **Le détour de 21 h 22**.
- Salvatore Greco : **Les transferts d'argent**, **La préparation des montants**, **Les écritures comptables**.
- Les cinq autres personnages : trois titres thématiques propres à leur rôle ; le contenu repris de leur secret, de leur chronologie et d'un fait établi.

Les trois cartes restent consultables ; les renseignements déjà consignés portent le statut **« Consigné dans le dossier de l'Enquêteur »**. La vérité canonique et la nouveauté pour l'Enquêteur restent des concepts distincts : les soupçons sont marqués `unassessed`, et certains faits sont déjà documentés.

### Deux parcours équivalents (ordre libre)

**Parcours A : avant de parler**
- Cliquer sur « Je souhaite en parler » pour l'une des trois cartes.
- Événement privé au seul Enquêteur : « [Source] souhaite parler de : [titre court] ».
- Aucune divulgation du détail, aucun score de coopération, aucune obligation de prendre une nouvelle phase.
- Plus tard, conversation orale, puis éventuelle consignation.

**Parcours B : parler d'abord**
- L'Indic peut discuter spontanément et à n'importe quel moment pertinent.
- Après coup, cliquer sur « J'en ai déjà parlé » pour la carte concernée.
- Le serveur vérifie à nouveau les droits, le cycle, la carte exacte et les doublons ; il consigne l'identifiant de fait et envoie le **résumé canonique** en événement privé à l'Enquêteur.
- Aucun « signal avant discussion » n'est exigé. Une consignation officielle par cycle, pas plus.

Une simple intention ne compte jamais pour la deuxième condition de victoire. Une consignation prouve une transmission *dans le système* du contenu authentifié — **elle ne prouve pas qu'une phrase précise a été prononcée oralement**. Le futur calcul de victoire pourra distinguer une piste nouvelle, une information déjà connue, une connaissance partielle et un soupçon non confirmé. Il ne doit pas récompenser automatiquement un élément `unassessed` comme s'il était vérifié.

### Sécurité
- Seule une source recrutée peut utiliser les cartes ; l'offre est privée et n'accorde aucun privilège d'enquête.
- Les droits sont vérifiés **sur le serveur**, indépendamment de l'interface.
- Le destinataire officiel est, à ce stade, **l'Enquêteur seulement** : pas de fuite systématique au reste du camp, qui peut compter des rôles différents selon le dossier.
- Les actions sont isolées par `match_no` ; les doubles offres, réponses et transmissions sont refusées.
- L'ensemble des secrets demeure privé ; le bouton « Je souhaite en parler » envoie le titre uniquement. Le bouton « J'en ai déjà parlé » formalise le renseignement et son texte dans la boîte privée de l'Enquêteur.
- Les routines préexistantes `omerta_reveal` restent inchangées et ne sont pas supprimées sans migration coordonnée.

### Livrables sur la branche
- `supabase/migrations/20261026233000_omerta_indic_recruitment_021.sql` — proposition et réponse privée.
- `supabase/migrations/20261026233500_omerta_money_intel_021.sql` — trois cartes du dossier 021, signal facultatif, consignation après échange, verrou serveur.
- `omerta-money-intel-v1.js` / `.css` — interface de pacte secret, icône et dossier de trois sujets.
- `scripts/omerta-money-intel-021-check.mjs` — scénarios de simulation et garde-fous.
- `supabase/tests/omerta_money_intel_021_preflight.sql` — audit de base après migration de test (à étendre à l'offre et au signal).

### Limites avant fusion
- **Non déployé** : aucune migration exécutée sur Supabase en production, aucune fusion GitHub sur `main`, aucune garantie de fonctionnement réel en salle.
- Tester les RPC sur une base de test, les conversions multiples, la reconnexion, le verrouillage des phases, les rematches, le retour au Fil de l'Enquêteur et la mise à jour de l'onglet.
- Étendre aux scénarios 022–025 et à leurs variantes, avec trois faits vraiment adaptés à chaque suspect ; éviter de fabriquer automatiquement des faits narratifs non autorisés.
- Ajouter séparément la prise en compte serveur dans la victoire de l'Indic et le bilan final de l'Enquêteur, sans veto subjectif.
- Le canon actuellement enregistré pour 021 mentionne la Famiglia **Verri** ; la migration de canon vers **Santoro**, souhaitée pour Omertà, devra être traitée explicitement avant la publication définitive.

## Extension de l'évaluation finale — 27 octobre 2026

La branche GitHub contient désormais :
- `igr_omerta_indic_assess` : vote de l'Enquêteur uniquement pendant la phase de verrouillage final, lié à une source réellement recrutée ; pas de vote après verrouillage final ; réponse unique et privée.
- `omerta-money-intel-v1.js` : formulaire Oui/Non dans la vue Enquêteur pendant la phase finale, indépendant des trois cartes et des échanges oraux.
- `20261027004500_omerta_indic_reveal_scoring.sql` : pour une source recrutée, `indic_second_ok = indic_vote_yes OR indic_by_card` ; la victoire complète exige en plus la condition personnelle et la survie. Les autres rôles non recrutés restent inchangés.
- `scripts/omerta-indic-final-rule-check.mjs` et CI Cloudflare : garde-fous syntaxiques et vérifications du contrat de verdict.

**Note de validation :** les anciennes règles de rôle (`pentito`, `contabile`, etc.) ont des objectifs hétérogènes. La branche explicite les trois axes de l'Indic, mais il faut éprouver le résultat en vraie partie et, pour chaque variante, valider que sa condition personnelle n'est ni contradictoire ni triviale.

**Statut de publication :** les 15 variantes des dossiers 021–025 sont bien enregistrées en état `review`. Chacune dispose d'une vérité distincte et d'une révélation candidate au cycle III, mais les 15 ont `approved=0`, `verified_cycle_three_guarantees=0`, d'où un `release_eligible=false` pour chacun des cinq dossiers. Les verrous serveur A/B/C interdisent à juste titre une activation sans validation éditoriale humaine. Ne pas publier en contournant cette exigence.
