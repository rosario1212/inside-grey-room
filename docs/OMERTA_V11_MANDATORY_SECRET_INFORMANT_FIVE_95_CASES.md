# INSIDE GREY ROOM — OMERTÀ V11

> **ARCHIVE / DÉCISION REMPLACÉE :** [OMERTÀ V13 — indic volontaire, risque réel et parties sans indic](OMERTA_V13_VOLUNTARY_TURNCOAT_RISK_80_20.md) est maintenant le **SEUL contrat actif pour l'indic**. Ne plus appliquer les mentions anciennes d'« indic toujours présent », d'attribution automatique ou de « reconstitution impossible sans indic ». Les enquêtes et leur contenu atmosphérique restent des références éditoriales, mais la décision de coopérer appartient au joueur à partir de C2. Aucun de ces documents archivés ne prouve une intégration de gameplay en production.

## CINQ DOSSIERS 9,5/10 CIBLÉS · UN INDIC GARANTI · PRESSION MAXIMALE SUR L'ENQUÊTE

**Décisions d'auteur, 26 octobre 2026 :** l'indic est **toujours présent, exactement une fois dans chaque partie OMERTÀ 021–025**, et il doit être décisif pour une reconstitution *complète*. Les 5 affaires gagnent en densité criminelle et psychologique pour viser **9,5/10 éditorial chacun**. La famille s'appelle **Santoro**. Les postes jouables s'appellent **Don Santoro, Consigliere, Capo, Soldato, Associato, Sottocapo, Contabile**, et affichent **le pseudo du participant**, pas une identité fictive imposée. **L'indic ne figure jamais dans l'arbre.**

> **STATUT : CONCEPTION V11 SUR BRANCHE DE REVUE — NON DÉPLOYÉE.** Les notations 9,5 sont des objectifs et appréciations éditoriales de ces traitements, pas des résultats validés par 15 manuscrits A/B/C, par le moteur live ou par cinq séries de playtests. Les anciennes formulations « indic facultatif / 0 ou 1 » de V7–V10 sont **supplantées** par cette décision. Aucun changement CARTEL 029–031.

---

## I. Contrat de jeu : plus dur, mais pas injuste

**Même jeu, mêmes phases.** Briefing, cartes privées, Assemblée Enquête, C1 interrogatoires individuels, trame, C2 événement/confrontation officielle si compatible, C3 dernière reconstitution, verrouillage des responsabilités et révélation. Discussions humaines libres dès le départ. Aucun mini-jeu « trouver la taupe », « points de pression » ou canal de renseignement imposé.

**La distinction décisive :**
- **Un indic EXISTE TOUJOURS** : exactement un *joueur* membre ou associé de la Famiglia, désigné secrètement à l'ouverture de la partie parmi les positions compatibles. Il garde son **rang public**, son **pseudo** et sa **personnalité**. Une petite carte privée lui signale qu'il communique déjà ponctuellement des informations aux autorités.
- Le camp Enquête **DOIT COMPTER sur lui pour comprendre complètement l'affaire** : il détient un fragment humain **exclusif et vérifiable par une autre source**. Sans sa coopération, certaines intentions, chaînes de décision ou attributions fines peuvent rester objectivement difficiles à prouver, et la victoire parfaite n'est pas garantie.
- **Ne jamais rendre la fin impossible** si l'indic choisit de se taire, ment ou quitte la partie : l'application avance, les pièces garanties arrivent, l'enquêteur peut prononcer des conclusions partielles, risquer une accusation excessive ou ne pas réussir. L'indic peut réellement déterminer l'issue.
- Il ne connaît **jamais la vérité intégrale** ; un seul fait probant crucial lié à son accès, plus une limite d'information claire. Il peut être lui-même en cause dans un acte secondaire, sans que « indic » implique innocence ou meurtre.
- **Ses révélations doivent être testables** : ne jamais faire de « il a dit X » la preuve suffisante du commanditaire. Le dossier comprend des documents et témoignages permettant de corroborer, réfuter ou limiter ce qu'il dit. « Compter » sur l'indic est un problème de **confiance et de recoupement**, non une trame-quiz qui annonce son identité.

### Autorisation de secret et attribution (contrat backend, NON implémenté)

1. Après attribution ordinaire des rangs et pseudos, **le serveur choisit exactement UN titulaire du statut secret d'indic** parmi les joueurs éligibles appartenant au camp suspect. Cela doit être atomique et fixé par **identifiant de partie immuable**, jamais par « branche de campagne » partagée sur 021–025.
2. Le statut est une **surcouche privée de faits**, pas un `preferred_role` public `informateur` et pas un rang affiché dans le lobby/arbre. Aucun rôle spécial « informateur » ne doit devenir un choix public qui révèle mécaniquement sa présence.
3. **Pas de rôle forcé** d'enquêteur comme indic. Si la composition de joueurs n'offre aucun membre mafieux éligible, bloquer **le lancement** avec une explication claire ou attribuer un rang éligible avant le lancement, ne pas « feindre » un indic PNJ inexistant.
4. Le fragment unique doit être adapté au rang/à la position réellement assignés, ou une contrainte de casting **privée et documentée** doit assurer cette compatibilité. Ne pas coller arbitrairement un savoir de comptable au Soldato.
5. Une carte privée : « Ce que tu as effectivement transmis », « Ce que tu peux prouver », « Ce que tu ne sais pas », « Quel risque objectif une divulgation représente », « Tu peux décider de parler ou non ». Aucun ordre de rôle-play, accent, loyauté ou émotion.
6. L'enquête connaît l'existence probable d'une fuite par une preuve introductive, **pas l'identité de l'indic**. Le canal de parole reste ordinaire : interrogatoires, échanges privés/officiels, révélations volontaires et confrontations du système de base ; aucune fonctionnalité sensible nouvelle activée sans audit.
7. La politique des variantes A/B/C doit varier les **motivations, fragments et routes de corroboration**, mais conserver **un indic réel** à chaque lancement, y compris si une variante rend la source très suspecte.
8. Confidentialité et tests : chaque public `sync`, journal d'actions, arbre, afficheur de résultat intermédiaire, message d'erreur et reconstruction frontend doivent être audités afin de ne **jamais** rendre visible `is_informant`, l'identifiant de l'indic ou la lettre de variante avant une révélation prévue et autorisée.
9. Une déconnexion/reconnexion garde le **même indic** et les mêmes faits. Il n'y a **ni nouvelle désignation**, ni changement de personne lors de la resynchronisation.
10. **Le Pentito de 024 n'est pas automatiquement l'indic** : un pentito négocie une coopération juridiquement formalisée ; un indic communique clandestinement. Ce sont deux situations distinctes, qui peuvent se recouper seulement si la variante en permet les faits cohérents et si le joueur le choisit.

### La surcharge intelligente du camp Enquête

Pour chacun des cinq dossiers :
- **Quatre véritables axes d'accusation ou d'imputabilité** (ex. racket / argent / meurtre / fuite) à départager. Un coupable désigné ne résout jamais automatiquement le tout.
- **Une fausse piste crédible**, née d'un fait exact interprété trop vite, pas d'une preuve fabriquée par le MJ.
- **Un paradoxe de témoignage** : deux personnes peuvent dire des choses contradictoires toutes deux sincères car elles n'ont vu/entendu qu'un fragment.
- **Un informateur indispensable à la lecture fine**, mais pas source unique de preuves. Les enquêteurs doivent le trouver, inspirer sa confiance ou interpréter les pièces sans sa coopération.
- **C1 n'ouvre aucune confrontation officielle** ; les joueurs parlent librement. C2/C3 utilisent les convocations, confrontations, assemblées et autres outils habituels du jeu, sans nouvelle règle.
- **Deux voies documentaires indépendantes garanties en C3** permettent un verdict même imparfait. Ne pas révéler la solution ou convertir le refus de l'indic en blocage technique.

---

# 021 — L'ENVELOPPE
### « Une collecte disparue. Un épicier exécuté. Un chiffre qui n'aurait jamais dû sortir. »

**Contexte de crime.** Brooklyn, novembre 2006. Neuf commerçants versent de l'argent de protection à un crew des Santoro. **Antonio Gallo**, épicier, refuse qu'on le fasse payer une deuxième fois le même vendredi. Le soir, on le retrouve assassiné dans l'arrière-boutique. Une enveloppe a disparu avant d'atteindre le supérieur du crew. Puis un enquêteur révèle connaître le total d'une collecte qui n'apparaissait pas dans les reçus distribués.

**Intrigue densifiée :** la police retient une **double chronologie** : le dernier contact connu avec Gallo et l'heure de remise de l'enveloppe. Une des deux comptabilités contient une correction de dernière minute. Plusieurs personnes savent une partie de l'histoire, mais pas la cause de cette correction. Un responsable accuse un collecteur, alors qu'une erreur sincère de transmission peut aussi expliquer une partie des faits. Le mobile de la mort de Gallo pourrait être distinct de la disparition de l'argent. On ne sait pas si l'indic a cherché à dénoncer un meurtre, un détournement ou un règlement de comptes interne.

**Charge du camp Enquête (4 axes) :** établir qui a ordonné la seconde collecte ; qui a pris, transmis et bénéficié de l'enveloppe ; qui a décidé/exécuté le meurtre de Gallo ; qui connaissait le total divulgué et ce qui constitue réellement une transmission.

**C1 — LA DERNIÈRE COLLECTE :** reçus, dernier refus de Gallo, rapport sur sa mort, interrogatoires isolés. Le fait de connaître le refus ne prouve pas l'ordre du meurtre.

**C2 — LE DOUBLE LIVRE :** deux totaux discordants, correction authentique mais ambiguë, possibilité de confronter le Capo et la personne tenant les comptes ou deux témoins de la remise. Le dernier porteur matériel n'est pas automatiquement le bénéficiaire.

**C3 — LE PRIX DU SILENCE :** trajectoire financière indépendante + chronologie médico-légale garanties. Elles suffisent à établir des faits matériels mais peuvent laisser indécis le **sens exact d'une seconde instruction**. L'indic est la seule personne ayant personnellement compris, dans cette variante, **pourquoi** l'information précise est sortie du cercle et comment l'instruction ambiguë a été comprise. Son récit doit être recoupé avec une trace déjà visible ; il ne livre jamais trois coupables sur demande.

**Fausse piste vraie :** une personne ment sur une somme ou un rendez-vous pour dissimuler un intérêt financier **sans nécessairement être impliquée dans le meurtre**.

**Dilemme de l'indic :** révéler son accès direct peut démentir une accusation d'homicide, mais aussi exposer sa propre participation à la collecte.

**A/B/C (axes, pas de solutions publiques) :** modifier la nature de la divergence des comptes, le rapport réel entre disparition et homicide, le fragment exact détenu par l'indic et ce qui peut le corroborer. **L'indic existe dans les trois variantes.**

**80 %** : Gallo, commerces, racket, enveloppe, registres et homicide de cette partie. **20 %** : crew Santoro, respect du Capo, économie du quartier et hiérarchie « Don Santoro ». Aucune conséquence au 022.

**Ambition éditoriale : 9,5/10** — la tension ne porte plus seulement sur « où est l'argent ? », mais sur le risque d'accuser un homme de meurtre à cause d'un mensonge qui masque un vol.

---

# 022 — OMERTÀ
### « Un homme est mort pour une phrase. Tout le monde ment sur la raison. »

**Contexte de crime.** Newark, 2006. **Nino Caruso**, bookmaker qui gérait des paris et des dettes pour un crew Santoro, réclame les recettes d'un soir de jeu clandestin. Un Capo réunit plusieurs hommes et tient une phrase violente mais sujette à interprétation. Un Soldato recroise ensuite Nino. Le corps de ce dernier est retrouvé sous un viaduc. Deux déclarations ultérieures reproduisent les mêmes formulations, alors que des personnes n'ont pas vécu les mêmes événements.

**Intrigue densifiée :** Nino menaçait d'exposer des sommes cachées, mais aussi une **vieille dette privée** sans rapport avec les comptes du crew. Une pièce indique la préparation d'un voyage ou d'une disparition volontaire avant sa mort. Des hommes ont coordonné une histoire commune ; pourtant, cette coordination peut avoir commencé avant ou après le meurtre selon les faits établis. La Famiglia exige de savoir si un Soldato a « compris » un ordre qu'il n'a jamais réellement reçu.

**Charge du camp Enquête (4 axes) :** répartition des dettes et mobiles ; homicide matériel ; intention exacte de la réunion et interprétations ; modification délibérée des témoignages et son but.

**C1 — LE DERNIER RENDEZ-VOUS :** paiements disputés, dernière conversation, traces d'un projet de départ. Interrogatoires séparés, aucune confrontation officielle.

**C2 — L'ORDRE SANS MOT :** confrontation possible entre deux interprétations incompatibles de la réunion. L'enquête reçoit aussi une pièce sur les déplacements du Soldato et une trace d'une dette personnelle. Une présence sur les lieux peut être vraie et l'accusation de meurtre fausse.

**C3 — LE PACTE :** chronologie de l'homicide et traces indépendantes sur la coordination de versions garanties ; restent à trancher ordre, compréhension et initiative. L'indic a **été témoin d'un échange privé non retranscrit intégralement**, qui permet de comprendre pourquoi certains témoins ont harmonisé leurs paroles. Le recoupement montre l'heure de cet échange, pas automatiquement ce qu'il signifie.

**Fausse piste vraie :** un témoin a effectivement aidé à organiser les déclarations, mais cela peut protéger une personne **différente** de l'exécutant.

**Dilemme de l'indic :** reconnaître qu'il a participé au pacte de silence tout en apportant le fragment qui peut distinguer commanditaire et simple couvreur.

**A/B/C :** modifier la véritable source d'autorité homicide, l'origine de la dette qui a précipité l'acte et ce que le pacte cachait ; indic présent à chaque fois, sans connaissance totale.

**80 %** : Caruso, dette, meurtre, dernier voyage, réunion, pacte de témoignages. **20 %** : culture des rangs, clubs sociaux de Newark et code d'omertà Santoro. Aucun argent du 021 réutilisé.

**Ambition éditoriale : 9,5/10** — meurtre et loyauté deviennent deux investigations distinctes, avec une possibilité crédible de confondre un menteur et un assassin.

---

# 023 — LA TABLE
### « Deux morts possibles. Une offre disparue. La paix que chacun prétend vouloir. »

**Contexte de crime.** Brooklyn, 2006. Des hommes de la Famiglia Santoro et un groupe criminel fictif de New York négocient les revenus de transport et l'accès à des contrats. **Domenico Falco**, intermédiaire porteur de la dernière proposition, manque à l'appel. Il est retrouvé assassiné dans une voiture non loin du rendez-vous. Peu après, un appel annonce que **Adriano Santoro, fils du Don**, a été pris pour cible ; son sort immédiat est traité uniquement dans cette partie.

**Intrigue densifiée :** il existait **deux versions successives de l'accord** : l'une au bénéfice des Santoro, l'autre tentant de sauver les intérêts d'un tiers. La chaise vide n'indique pas forcément une défection : Falco devait aussi rencontrer quelqu'un hors de la négociation. Les protagonistes peuvent sincèrement vouloir la paix tout en dissimulant une transaction parallèle. Un renseignement relatif au déplacement d'Adriano a quitté un cercle fermé avant l'attaque ; mais avoir demandé l'horaire n'en prouve pas la divulgation.

**Charge du camp Enquête (4 axes) :** vrai contenu de l'offre ; meurtre de Falco ; accès et fuite relatifs à Adriano ; auteur et mobile du sabotage du sit-down (s'il existe un plan commun).

**C1 — LA CHAISE VIDE :** ordre du jour et deux intérêts économiques, premiers interrogatoires. Les joueurs négocient seulement s'ils le souhaitent : **aucune performance d'acteur n'est évaluée**.

**C2 — LE SANG SUR L'ACCORD :** identification des deux versions d'offre, chronologie de Falco, accès à l'horaire ; confrontations classiques entre déclarations. L'enquête peut découvrir que le meurtre de Falco et l'attaque ne procèdent pas nécessairement d'un seul ordre.

**C3 — LE RENDEZ-VOUS MANQUÉ :** deux reconstructions documentaires indépendantes, l'une de la mort de Falco et l'autre de la fuite d'itinéraire. L'indic seul **a connaissance de la destination initiale de la proposition modifiée ou de l'identité du véritable destinataire de cette information selon la variante**, ce qui permet de juger s'il y avait une manœuvre concertée. Le dossier fournit de quoi corroborer sa version, mais pas de quoi la remplacer automatiquement.

**Fausse piste vraie :** l'intermédiaire absent avait organisé une rencontre secrète ; cela ne prouve ni sa trahison ni le commanditaire de sa mort.

**Dilemme de l'indic :** révéler l'origine de l'accord alternatif peut ruiner la réputation d'un médiateur et exposer son propre rôle dans le conflit.

**A/B/C :** changer l'intérêt économique réel, les relations causales entre les violences et le sens de l'offre dissimulée ; indic toujours présent.

**80 %** : Falco, accords de transport, chaise vide, attaques et preuves propres. **20 %** : relations entre crews Santoro, présence d'Adriano dans l'univers et fonction de Consigliere. Sa blessure éventuelle n'est **jamais importée** dans 025.

**Ambition éditoriale : 9,5/10** — un meurtre, une seconde attaque et des négociations rendent la loyauté difficile sans que les discussions remplacent l'enquête.

---

# 024 — IL PENTITO
### « Le témoin mort n'a rien dit. Quelqu'un sait ce qu'il allait dire. »

**Contexte de crime.** New Jersey, 2006. Un joueur occupant un rang criminel approprié sous son **pseudo** est arrêté dans une affaire d'extorsion liée aux transporteurs. Un ancien salarié, **Sergio Valenti**, devait témoigner, mais il est retrouvé assassiné. Son nom figure dans un registre d'une entreprise utilisée pour relier paiements, contrats et intimidations. Le parquet détient déjà des documents contre plusieurs hommes. Le détenu envisage une coopération, mais la valeur de son récit est contestée.

**Intrigue densifiée :** Valenti avait préparé **deux jeux de notes**, l'un décrivant les versements et l'autre expliquant une contradiction de provenance. Après sa mort, les enquêteurs possèdent une partie des notes, mais manquent de contexte pour distinguer un paiement volontaire d'une extorsion et comprendre quelle personne connaissait les lieux/horaires. Le détenu peut fournir un nom spectaculaire mais non vérifié ; un autre renseignement plus limité pourrait réellement faire avancer l'affaire.

**Charge du camp Enquête (4 axes) :** extorsion et décideurs financiers ; commandement et exécution du meurtre de Valenti ; authenticité et portée des notes ; coût réel et crédibilité d'une coopération.

**C1 — L'ARRESTATION :** charges, état des preuves publiques, calendrier de la déposition manquée. Interrogatoires individuels ; ne pas laisser croire que « détenu = informateur ».

**C2 — DEUX JEUX DE NOTES :** une note retrouvée contredit l'autre ; confrontation officielle possible entre interprétations. Le procès n'est pas simulé dans toute sa technicité, mais les faits et risques sont présentés clairement.

**C3 — LA DERNIÈRE SOURCE :** pièces documentaires indépendantes sur les paiements et la chronologie du meurtre ; **l'indic clandestin existait déjà dans ce réseau avant l'arrestation**. Il est le seul joueur pouvant expliquer la provenance d'une annotation que Valenti utilisait pour distinguer la menace de la relation commerciale. Le détenu qui envisage de devenir pentito peut être **une autre personne** et conserve le droit de refuser.

**Fausse piste vraie :** un membre a effectivement payé Valenti avant le meurtre ; la preuve du paiement ne suffit pas à prouver qu'il a ordonné sa mort.

**Dilemme de l'indic :** aider à confirmer un meurtre peut révéler son activité ancienne de contact des autorités et ruiner la défense judiciaire d'un proche.

**A/B/C :** changer le sens de l'annotation de Valenti, la fiabilité des renseignements de coopération et l'origine de la violence ; indic présent dans chaque version, distinct conceptuellement du Pentito.

**80 %** : Valenti, notes, extorsion des transporteurs, meurtre et négociation de ce dossier. **20 %** : intérêts commerciaux Santoro, culture du silence et justice américaine. Aucune coopération issue de 021–023.

**Ambition éditoriale : 9,5/10** — un meurtre change la valeur d'une future déposition, et un indic actif n'est pas automatiquement un témoin coopérant.

---

# 025 — IL DON
### « Trois versions d'un ordre. Un mort. Le nom du Don partout. »

**Contexte de crime.** Jersey City, 2006. L'entrepreneur **Carlo Benedetti** a refusé une exigence présentée au nom de Don Santoro concernant ses contrats de construction. Des hommes lui ont imposé des collectes et ont proféré des menaces. Après un nouvel ultimatum, Carlo est assassiné. Le Don reconnaît avoir parlé d'intérêts économiques, mais conteste avoir voulu la mort de Benedetti. Chaque niveau de la Famiglia rapporte une consigne différente.

**Intrigue densifiée :** les échanges sont compliqués par **une seconde affaire commerciale imbriquée dans le même chantier** : un sous-traitant avait déjà un différend avec Benedetti pour des raisons indépendantes du crew. Des documents établissent les paiements et plusieurs menaces, mais n'expliquent pas pourquoi le langage employé a durci à mesure qu'il descendait vers les exécutants. Un subalterne peut avoir abusé du nom du Don. Le Don peut avoir expressément autorisé des pressions sans avoir autorisé un meurtre — ou l'enquête pourrait prouver davantage, selon la variante.

**Charge du camp Enquête (4 axes) :** bénéficiaire du racket ; qui avait autorité et connaissance réelle ; qui a causé/commandé le meurtre ; qui a modifié ou exploité le message après coup.

**C1 — LE NOM :** les comptes et menaces de Benedetti sont établis, premières versions sur le projet de construction. Interrogatoires habituels seulement.

**C2 — LES TROIS CONSIGNES :** confrontations officielles possibles entre Don, Consigliere, Capo et exécutants **seulement s'ils sont présents et compatibles**. Une trace d'instruction et un document commercial ne prouvent pas le même acte.

**C3 — LE SENS DE L'ORDRE :** deux pièces indépendantes garantissent la chronologie du meurtre et les transmissions d'instructions. L'indic, placé dans une position de confiance **compatible avec son rang**, détient un fragment direct sur **le contexte d'une reformulation décisive**. Il peut aider à distinguer initiative violente et autorisation du sommet ; son témoignage ne prouve rien sans recoupement.

**Fausse piste vraie :** le Don a réellement discuté du sort financier de Benedetti ; ce fait rend plausible une accusation d'assassinat, mais ne la démontre pas.

**Dilemme de l'indic :** apporter le contexte exact peut contredire sa hiérarchie et l'exposer comme relais de la justice ; sa protection n'est pas automatique.

**A/B/C :** déplacer le maillon où apparaît la violence, les raisons du sous-traitant et la portée de l'ordre économique ; un indic distinct existe dans chacune des variantes et doit pouvoir soutenir son savoir par les faits.

**80 %** : chantier Benedetti, racket, meurtre, consignes et responsabilité propre au 025. **20 %** : Don Santoro, rangs et autorité d'une Famiglia, liens de sang comme contexte. **Pas de finale de campagne.**

**Ambition éditoriale : 9,5/10** — les joueurs affrontent la différence entre « faire obéir », « tolérer une violence » et « ordonner un meurtre », sans déduire la vérité du rang.

---

## II. Arbre Santoro : norme publique conservée

L'arbre consultable pendant la partie reste :
- **Don Santoro** — pseudo titulaire si présent ;
- **Consigliere**, **Sottocapo**, **Capo**, **Soldato**, **Associato**, **Contabile** — pseudos correspondants sans personnages fictifs jouables ;
- onglet **Famille de sang** : Don Santoro, fils **Adriano Santoro**, fille **Elena Santoro**.
- jamais de badge « INDIC », lettre A/B/C, culpabilité, blessure, mort, verdict, témoin protégé ou résultat d'un autre scénario.

Le nom **Santoro** et la structure mafieuse constituent le lien 20 % entre les cinq affaires. Chaque déroulement reste à **80 % autonome**, y compris si le même rang ou le même joueur revient.

## III. Évaluation des histoires V11 (subjective, avant tests)

| Dossier | Évaluation de ce traitement | Pourquoi 9,5 est désormais une cible défendable |
|---|---|---|
| **021 L'ENVELOPPE** | **9,5 / 10 visé** | Trois affaires intriquées, double comptabilité, lien d'indic non magique, fort risque de confondre voleur et assassin |
| **022 OMERTÀ** | **9,5 / 10 visé** | La parole ambiguë, la dette privée et le pacte de silence peuvent faire condamner le mauvais niveau de responsabilité |
| **023 LA TABLE** | **9,5 / 10 visé** | Deux versions d'accord, meurtre, attaque contre le fils et médiation sous pression sans suite de campagne |
| **024 IL PENTITO** | **9,5 / 10 visé** | Deux types de coopération, notes du témoin assassiné et valeur probante des récits contradictoires |
| **025 IL DON** | **9,5 / 10 visé** | Trois versions d'ordre, double intérêt commercial, autorité du Don distincte de commandement homicide |

**Moyenne cible : 9,5/10.** Ce sont des évaluations éditoriales assumées, **pas** un score de QA réel ; si un test humain révèle une faille de clarté, d'équilibre ou de rejouabilité, la note devra être abaissée puis le scénario corrigé.

## IV. Chantiers restant requis avant toute publication

- **Aucune modification live dans cette V11** : les packs 021–025 sont encore l'ancienne structure de saga Verri. Les 15 manuscrits privés A/B/C doivent être rédigés et validés avec indic **toujours présent**, fragments d'information causaux cohérents, cartes de connaissances, 3 cycles et deux pièces C3 vérifiées chacun.
- Le **moteur OMERTÀ** doit attribuer **exactement un indic secret par nouvelle partie**, maintenir son identité en cas de reconnexion et ne pas la révéler par `preferred_role`, l'arbre ou une fuite de sync. Dans l'état actuel, la présence n'est pas garantie. **Ne jamais prétendre le contraire avant tests.**
- Les règles de confrontations officielles standard en **C2 et C3** doivent être rendues compatibles avec 021–025 ; le routage v13 existant exclut ces numéros. Aucun nouvel événement propriétaire n'est requis.
- **Contrôles anti-hardlock** : on doit pouvoir finir la partie sans aveu ni coopération ; l'indic décide si la reconstitution complète est accessible ; si son silence condamne une victoire parfaite, le texte doit le rendre intelligible et le traiter comme un résultat de jeu, pas un bug. Prévoir une politique de déconnexion/absence de joueur.
- **Rôles de l'arbre** : le pseudo vient de l'attribution publique; l'informateur n'est jamais un rang visible. L'indic peut être titulaire d'un rang criminel, mais cela ne doit pas offrir de révélation automatique de sa véritable allégeance.
- Tests réalistes (minimum/maximum joueurs), trois variantes, langues FR/EN, déconnexion, trames garanties, sécurité, équité, sessions indépendantes, Cartel inchangé. PR brouillon tant que cela n'est pas démontré.

**Documents antérieurs :** V10 est supplantée partout où elle mentionne un « indic facultatif / 0 ou 1 » ou exige que la reconstitution *parfaite* soit possible sans contribution humaine. V9 gouverne toujours l'organigramme à pseudos, et les quatre lois restent obligatoires.
