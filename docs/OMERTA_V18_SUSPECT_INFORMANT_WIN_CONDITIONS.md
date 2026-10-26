# INSIDE GREY ROOM — OMERTÀ V18

> **CONDITION DE VICTOIRE INDIC MISE À JOUR EN V23 :** [OMERTA_V23_TWO_CHECKS_ONE_INFORMANT_OBJECTIVE.md](OMERTA_V23_TWO_CHECKS_ONE_INFORMANT_OBJECTIVE.md). Les anciennes affirmations de cette archive selon lesquelles un indic pouvait **gagner sans jamais transmettre d'information** sont remplacées. Le libre silence reste autorisé, mais la victoire d'indic exige désormais **sécurité personnelle ET renseignement transmis**. L'acceptation reste sans divulgation automatique. Les règles de victoire du suspect ordinaire demeurent indépendantes.

## CONDITIONS DE VICTOIRE · SUSPECTS & INDICS · UNE PHRASE POUR JOUER, DES DÉTAILS À PORTÉE DE MAIN

> **DÉCISION DE CONCEPTION DU 26 OCTOBRE 2026.** Ce document complète V17, V16 et les règles antérieures. Le **suspect a UN objectif personnel principal** assigné à sa carte privée, évaluable au dénouement. Si et seulement s'il accepte volontairement une offre de l'Enquêteur dès C2+, son objectif principal est **immédiatement REMPLACÉ** par **UN nouvel objectif d'indic** intégralement affiché avant « Accepter ». Devenir indic n'envoie aucune preuve, déclaration ou message automatiquement. **L'indic peut se taire, faire un double jeu pour un Capo/Consigliere/Sottocapo/Don, communiquer une version intéressée, ou servir réellement l'Enquête ; la victoire dépend du nouvel objectif, pas de la loyauté déclarée.**

**NOTE D'ÉTAT :** spécification et contrôle éditorial sur PR brouillon, pas un moteur de victoire déjà déployé. Les packs OMERTÀ en production ne calculent pas encore ces nouveaux critères. Le frontend actuel lit `reveal.results[].success` mais ce champ n'est pas une preuve que la V18 est implémentée.

---

## I. UNE VICTOIRE PERSONNELLE, PAS UN SCORE DE ROLEPLAY

### Suspect

**Condition de victoire principale :** réaliser **le résultat individuel exact écrit sous « TON OBJECTIF »**, évalué uniquement à partir de faits canoniques et de décisions formalisées, *à la fin de cette partie*. Les enquêteurs peuvent remporter l'enquête **en même temps** qu'un suspect gagne. Un coupable peut perdre tandis qu'un innocent gagne; un suspect peut perdre sans être reconnu coupable d'un meurtre, s'il échoue à préserver l'intérêt spécifique qu'il cherchait.

Objectifs autorisés (un seul principal par joueur/variante) :
- **ÉVITER UNE IMPUTATION DÉFINIE** : « Au verdict, ne sois pas désigné comme responsable principal du détournement de l'enveloppe. » Son niveau de responsabilité est celui effectivement enregistré dans l'affaire.
- **PROTÉGER UN ALLIÉ DÉFINI** : « Au verdict, [pseudo de la personne occupant Capo] ne doit pas être désigné comme commanditaire de la mort de Gallo. » Objectif utile même si le supérieur est réellement impliqué ; possible, jamais garanti. Ne pas donner une information secrète sur sa culpabilité en affichant l'objectif.
- **FAIRE ÉTABLIR UNE RESPONSABILITÉ** : « Au verdict, [pseudo de la cible] doit être retenu responsable du détournement. » Le critère dépend du verdict effectivement verrouillé; une fausse accusation peut temporairement tromper le camp Enquête, mais ne change pas les faits réels révélés en conclusion.
- **CONSERVER UN INTÉRÊT CONCRET** : « Au dénouement, conserve ta part de la collecte / ton accès à l'accord de transport » — **seulement si l'état officiel de cette part/de cet accord est prévu, calculable et indépendant du bon vouloir oral du MJ**. Sinon choisir un objectif déjà mesurable.

**Pas d'objectif « sois convaincant », « sois fidèle », « joue comme un mafieux », « réussis trois mensonges », « fais monter la tension » ou « protège tous les membres ».** Aucun résultat subjectif basé sur le ton de voix ou la popularité.

### Indic (une fois la proposition acceptée)

**Condition principale :** **remplacer immédiatement l'ancienne mission du suspect** par un but personnel nouveau, en lien avec la situation du joueur et vérifiable au dénouement. Exemples :
- **PROTÉGER UN RANG SUPÉRIEUR** : « Au verdict, [Capo attribué, avec pseudo] n'est pas désigné comme commanditaire de ce meurtre. » L'indic peut manipuler l'Enquête pour soutenir cet allié, puis changer de tactique.
- **FAIRE TOMBER UN RIVAL** : « Au verdict, [rival présent] est désigné comme responsable de l'argent détourné. » Peut dire une vérité partielle ou un mensonge; **aucune fausse preuve créée par le système**.
- **ÉCHAPPER À UNE ATTRIBUTION** : « Au verdict, tu n'es pas retenu responsable principal du meurtre » ; **à utiliser seulement si un risque plausible de mise en cause existe dans la variante**, pas comme victoire automatique.
- **OBTENIR UNE MESURE** : « Au dénouement, une protection provisoire est effectivement approuvée pour toi », **uniquement** si l'autorité et la condition de protection sont codées, accessibles, révocables suivant des règles annoncées et pas bloquées par l'absence de coopération orale. Une demande `pending` ne suffit jamais.

**Prix certain d'acceptation :** la mission de suspect n'est plus scorée. **Prix conditionnels :** exposition par recoupement, sanctions mafieuses cadrées selon preuves et rang, perte financière, implication judiciaire, protection demandée mais refusée. Ces coûts sont annoncés **avant le choix**. Le nouvel objectif peut être plus avantageux ou plus périlleux que l'ancien ; le joueur l'évalue librement.

**L'indic n'a aucune obligation de divulgation.** Accepter = statut et but remplacés, `disclosures=[]`. Ses paroles restent facultatives; la victoire est possible **sans déclaration**, si le nouvel objectif est atteint par les événements et choix des joueurs. Son identité n'est pas automatiquement connue de l'Enquêteur ni de la Famiglia. Une protection demandée ou promise n'est pas une garantie de succès.

### Un petit bonus *facultatif*, à n'ajouter qu'après tests

Pour augmenter la rejouabilité **sans compliquer la carte**, une seconde ligne « DÉFI FACULTATIF » pourrait récompenser une réussite secondaire, p. ex. conserver une faveur ou ne jamais voir son statut de source **formellement prouvé**. **Ne jamais conditionner la victoire principale à ce bonus.** Je recommande **de ne pas l'activer dans la première version jouable** : un seul objectif mesurable et des conséquences suffisent.

---

## II. COMMENT LE JOUEUR LE LIT (CARTE COMPACTE ET DÉTAILS FACULTATIFS)

### Carte de suspect, 021 : modèle d'énoncé

**ÉNONCÉ.** Une enveloppe issue du racket de neuf commerces a disparu. Antonio Gallo est assassiné après avoir refusé une seconde collecte.

**CE QUE TU SAIS.** « Le carnet de remise porte un montant différent du registre du Contabile. Tu n'as pas vu qui a pris l'enveloppe. »

**TON OBJECTIF — POUR GAGNER.** « À la fin, ne sois pas désigné responsable principal du détournement. »

**TU PEUX CHOISIR DE...** « Parler, garder le silence, dire une vérité partielle, accuser quelqu'un, protéger un autre suspect ou négocier. »

**CE QUE TU RISQUES.** « Les comptes peuvent exposer ton implication dans le racket, même si tu n'as rien volé. »

**`Voir les détails, pièces et conditions exactes`** : facultatif, à portée de main, n'envahit pas l'écran. Les documents authentiques ne sont pas modifiables.

### Proposition de devenir indic, 021 : exemple compréhensible immédiatement

**PROPOSITION DE TRAHISON — CONFIDENTIEL (C2+)**

**ÉNONCÉ.** « L'Enquêteur te propose de devenir **indic**, c'est-à-dire une source secrète. Tu peux refuser sans sanction. Si tu acceptes, **ton objectif change immédiatement, mais tu n'es obligé de révéler aucune information**. »

**SI TU REFUSES : TU GARDES TON OBJECTIF.** « À la fin, ne sois pas désigné responsable principal du détournement. »

**SI TU ACCEPTES : TON OBJECTIF DEVIENT.** « Au verdict, le joueur occupant le rang de Capo [pseudo visible s'il est attribué] ne doit pas être désigné commanditaire du meurtre de Gallo. »

**LE PRIX DE LA TRAHISON :** « Ton ancien objectif ne comptera plus. Si tu livres des détails connus d'un petit cercle, ils peuvent te rendre identifiable. Tu peux perdre une faveur, une part ou être compromis par un crime que tu admets. Une protection peut être **demandée**, pas garantie. »

**TA LIBERTÉ APRÈS LE CHOIX :** « Tu peux ne rien dire, faire tomber un rival, défendre ton Capo, changer d'avis sur ta stratégie, tromper l'Enquêteur ou l'aider. **Tu ne peux pas modifier les preuves authentiques.** »

**Actions immédiatement visibles :** **ACCEPTER ET DEVENIR INDIC** | **REFUSER ET GARDER MON OBJECTIF**.

**Après acceptation :** « **TU ES INDIC**, secrètement. **Nouvel objectif : protéger [pseudo du Capo] contre l'attribution de l'ordre du meurtre.** Aucune information transmise. Tu peux continuer à jouer librement. » S'il n'y a pas de Capo attribué, cet objectif n'est **jamais proposé** ; l'autre mission écrite pour sa variante doit être affichée à la place.

**Attention sur la fiction :** ces exemples ne sont pas des informations canoniques à insérer systématiquement en A/B/C. Une mission contre le meurtre ne doit pas donner secrètement l'identité de son vrai commanditaire.

---

## III. C'EST LE VERDICT ET LES ÉVÉNEMENTS QUI COMPTENT

Pour évaluer une victoire **sans jouer à un jeu de société avec 15 jauges**, il faut une petite couche serveur qui lit uniquement :
- `room_id`, `scenario_id`, `variant_id` **sur le serveur privé**.
- `player_id`, `initial_goal_id`, `active_goal_id`, `secret_is_informant` (ce dernier jamais renvoyé au public).
- `locked_verdict` avec **auteur / bénéficiaire / type de crime / degré d'implication** et identifiant de la personne désignée (si l'enquête permet cette granularité). Sinon, le moteur devra ajouter un verdict par axe **sans le faire apparaître comme règle supplémentaire lourde pour l'utilisateur**.
- `case_action_outcomes` pour les faits **déjà officiellement actés** : part conservée/perdue, protection effectivement approuvée, sanction de rang motivée et vérifiable, source formellement exposée si nécessaire.
- `objective_satisfied` : une unique valeur `true/false` **pour l'objectif actif**, accompagnée d'une phrase au dénouement expliquant clairement pourquoi il a gagné ou perdu.

Ne pas **comparer les faits vrais au verdict** pour déterminer la satisfaction d'un objectif du type « faire accuser le rival » : son objectif peut être de **manipuler** et faire attribuer une culpabilité erronée. Le résultat de son objectif dépend de la **décision officielle verrouillée**, tandis que **le succès de l'Enquêteur**, lui, dépend de l'exactitude de ses accusations face au canon. Ces deux scores **peuvent diverger**. Aucun faux document ne doit pouvoir réécrire le canon.

**Cette distinction est indispensable** pour permettre :
- enquêteurs gagnants **et** suspect gagnant (ex. innocents disculpés);
- enquêteurs perdants **et** indic gagnant (ex. Capo réellement impliqué mais non retenu au verdict);
- enquêteurs gagnants **et** indic perdant (ex. ses efforts échouent);
- les deux perdent et d'autres suspects gagnent selon leurs objectifs.

Le verdict complet de quatre actes criminels 021 ne peut pas être remplacé par « accusé/non accusé » universel si l'objectif d'un joueur dépend spécifiquement d'un détournement, et non d'un meurtre.

**Si aucun indic n'apparaît**, le verdict reste complet et les objectifs initiaux continuent à fonctionner. Aucune protection ni révélation automatique de source n'est nécessaire. Si deux joueurs acceptent deux offres distinctes, chacun voit uniquement son objectif et n'est pas tenu de protéger le même supérieur.

---

## IV. VICTOIRES PERSONNELLES PROPOSÉES PAR SCÉNARIO (NON CANONIQUES A/B/C)

| Affaire | **Suspect — objectif possible** | **Indic — objectif de remplacement possible** | **Risque qui donne du poids** |
|---|---|---|---|
| **021 L'ENVELOPPE** | « Ne sois pas désigné responsable du détournement. » | « Fais que le Capo présent ne soit pas retenu commanditaire du meurtre Gallo. » | Deux comptes révèlent des traces d'extorsion et des sources |
| **022 OMERTÀ** | « Ne sois pas retenu comme exécutant de l'assassinat Caruso. » | « Fais retenir un rival identifié comme responsable du pacte de faux témoignages. » | Qui a menti n'est pas forcément l'auteur du meurtre |
| **023 LA TABLE** | « Au verdict, évite qu'on te désigne comme responsable de la fuite visant Adriano. » | « Empêche que [Consigliere présent] soit désigné responsable du sabotage de l'accord. » | Un accord authentique peut trahir le négociateur |
| **024 IL PENTITO** | « Ne sois pas désigné instigateur de l'assassinat Valenti. » | « Fais retenir [rival désigné] comme responsable principal des extorsions. » | Les notes du témoin peuvent aussi compromettre l'indic |
| **025 IL DON** | « Ne sois pas tenu responsable du meurtre Benedetti. » | « Fais que [Don Santoro présent] ne soit pas désigné comme commanditaire du meurtre. » | Une consigne honnêtement rapportée peut prouver le racket mais pas le meurtre |

**Topo 80/20 par ligne :** 80 % de crimes, témoins, pièces et objectifs propres à ce dossier ; 20 % de rangs, cadre familial et codes Santoro. Aucun acte ou gagnant d'une partie n'a d'effet sur la suivante.

**Regard d'équilibrage** : tous les suspects ne doivent **pas** être assignés à une variante de « ne pas être désigné pour meurtre ». La table ci-dessus illustre une famille d'objectifs ; pour des parties mémorables, alterner protection d'autrui, rival à faire accuser, responsabilité financière, délimitation de participation et objectif de protection réellement approuvée. Pour chaque poste/rang A/B/C : au moins un résultat réaliste où le joueur peut gagner et un où il peut perdre, même si l'Enquête gagne; aucune mission dépendant d'un rang non attribué, d'un aveu obligatoire ou d'une action hors de portée du joueur. Un objectif reste **un but**, pas un ordre de mentir ou de se taire.

---

## V. CONDITIONS BLOQUANTES AVANT LANCEMENT (15 A/B/C × COMPOSITIONS DE SALLE)

1. **Objet réel et SMART** : objectif en une phrase, avec cible, fait et condition de dénouement mesurables ; pas de vote subjectif par le MJ.
2. **Objectif faisable** : cible bien présente ; élément de scénario connu ou accessible selon rang, rôle et variante; au moins deux chemins tactiques ; aucun résultat garanti par défaut.
3. **Objectif gagnable même si personne ne parle** : les joueurs ne sont jamais contraints de se confesser. Une mission n'exige ni divulgation automatique ni acceptation de protection impossible.
4. **Vraie divergence d'objectifs** : le nouvel objectif d'indic **n'est pas un simple rewording** de l'ancien et peut être contraire à l'intérêt du camp Enquête. C'est ce qui justifie le prix certain de la trahison.
5. **Acceptation instantanée** : statut INDIC et nouvel objectif fixés atomiquement, zéro information envoyée. Si le joueur accepte puis ne parle jamais, **son nouvel objectif reste évaluable**.
6. **Conflit de loyauté** : possibilité de protéger un Capo/Consigliere/Sottocapo/Don selon présence, **sans statut de pantin**. Supérieur ne voit pas l'état privé et ne peut imposer une décision.
7. **Toutes les révélations de responsabilité sont fondées sur les canons A/B/C**, l'Enquêteur n'est pas obligé de deviner qu'une déclaration d'indic est « une vraie preuve » ; vérification indépendante.
8. **Objectifs à frais réel** : le joueur voit dès l'offre les conditions de victoire, l'ancien objectif abandonné, les risques et les demandes de protection sous réserve d'autorisation; **refus sans sanction**.
9. **Confidentialité à toute épreuve** : l'identité, l'objectif, l'acceptation et l'échec des objectifs ne s'affichent pas dans `sync` public ou l'arbre avant la révélation de fin et selon les permissions.
10. **Résultats sans état interépisodes** : un joueur peut gagner au 021 puis perdre au 025 sans importer ni sanction, ni compte ou protection.

**État exact** : ces conditions sont une proposition d'évaluation destinée à la refonte OMERTÀ ; **aucune logique de score V18 n'est implémentée dans les RPC live**. Il faut d'abord créer les vrais objectifs par rang/variant, l'arbitre de victoire et adapter la révélation `igr_v4_make_reveal` / `reveal.results[].success` dans un flux propre aux DLC, sans casser 001–020 ou CARTEL.
