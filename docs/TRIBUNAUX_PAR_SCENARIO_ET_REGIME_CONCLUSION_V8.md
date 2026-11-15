# INSIDE GREY ROOM — Contrat d'expérience : tribunaux à Juge et clôture du design LE RÉGIME (v8)

**Statut : CONCEPTION APPROUVABLE / BRANCHE BROUILLON UNIQUEMENT. Aucun tribunal développé, aucun contrat serveur changé, aucun déploiement.** Ce texte est destiné à être discuté avant d'ajouter des fonctionnalités. Il complète `docs/REGIME_TRIBUNAL_SALLE_COMMUNE_V7.md`, avec correction du temps de confrontation **3 → 5 min** (procès long du Régime **14 min**, contre 12 avant).

## 1. Quel scénario doit proposer un tribunal ?

**Règle d'activation : le salon possède un joueur dont le rôle public effectif est JUGE.** Ne jamais créer un Juge invisible ou imposer des sièges supplémentaires sans accord sur la configuration. Les capacités réelles ont été vérifiées sur la base Supabase active le 15 novembre 2026 :

| Dossier | Juge actuel | Type de salle ou d'affaire | Conflit de tribunal à écrire |
| --- | --- | --- | --- |
| **008 — SOUS SERMENT** | Facultatif (6 joueurs) | Parjure / témoignages | Trois versions sous serment. Mentir n'implique pas nécessairement être responsable de l'événement. La confrontation porte sur le motif du mensonge, son horaire et l'acte réellement imputable. |
| **014 — SOUS SECRET** | Facultatif (6 joueurs) | Secret et renseignement | Liste d'informateurs compromise. Le Juge décide *procéduralement* quelles pièces ouvertes peuvent être citées, sans exposer des données protégées. Distinguer violation de procédure, transmission et dissimulation. |
| **015 — AVANT LA MORT** | Facultatif (7 joueurs) | Responsabilité médicale/institutionnelle | Distinguer décision de poursuivre un programme ÉLIGIBLES malgré l'état du patient, réaction du clinicien et falsification postérieure ; l'existence du décès n'identifie pas seule son responsable. |
| **016 — LE DERNIER ÉTAGE** | Facultatif (grand groupe, 8–9) | Vidéo et décès hors champ | Confronter la violence filmée, l'intervalle non enregistré et la cause du décès. Le Juge refuse qu'une vidéo prouve des faits qu'elle ne montre pas. L'Avocat peut représenter un seul suspect. |
| **019 — LE GRAND BAL** | Obligatoire | Conflit institutionnel | Responsabilités politiques et judiciaires ; contradictions entre enquête, accusation, avocats, presse et décideurs. Le Juge rend possibles des confrontations entre autorités, sans contrôler la vérité. |
| **020 — L'APOTHÉOSE** | Obligatoire | Catastrophe à causes multiples | Reconstituer les décisions qui ont contribué aux **327 morts**, sans réduire la catastrophe à un responsable unique ; alterner deux chaînes de causes et permettre à plusieurs acteurs de se contredire. |
| **029 — LE CYCLE MORT** | Facultatif (à grande table) | CHAMBRE DES TÉMOINS | **Quatre témoins/rescapés, pas trois accusés**. La salle commune est une audience de témoignages contradictoires, pas un procès pénal qui les déclarerait automatiquement coupables. S'ils n'ont pas de rôle de suspect, ne jamais les renommer « accusés ». |
| **030 — LA COUR ACHETÉE** | Obligatoire | Corruption de la justice | Trois suspects arrêtés après massacre du gouverneur ; juger la fiabilité du registre détruit/reconstitué et tester les objections sur procédures douteuses. Aucune décision arbitraire du Juge ne peut blanchir une preuve canonique. Avocat facultatif. |
| **032 — LES ARCHIVES DU PALAIS** | Facultatif **actuellement**, obligatoire **dans le design du Régime** | Procès de la prison de Vahran | Directeur + ministre de l'Intérieur recherchés ; débattre transferts, ordres, contrôle effectif, autorisations et disparitions. Séparer ordre initial et dissimulation. |
| **033 — LA DYNASTIE** | Obligatoire | Procès du pouvoir familial | Héritier + cousin ministre de la Défense recherchés ; débat sur guerre, massacres, chaîne de commandement et trahisons mutuelles. Parenté ≠ culpabilité. |
| **034 — LES NOMS QU'ILS PORTAIENT** | Obligatoire | Tribunal du président et de sa sécurité | Président + gendre chef de sécurité recherchés ; codes LA TÊTE / LE SCEAU / LA TOUR, dates, émetteurs, fonctions et ordre réel. Code ≠ preuve automatique de l'auteur. |

**Tous les autres dossiers** conservent leurs mécanismes : si aucune place de Juge n'existe, aucun tribunal ne doit être créé juste pour cocher une option. En particulier **026–028 TERREUR ont exactement 6 rôles (Enquêteur, Analyste, Officier, trois Suspects), sans Juge**. Ne pas les forcer à devenir un DLC judiciaire.

## 2. Architecture unique, mais onze débats différents

Créer un seul **moteur partagé de tribunal** au lieu de onze petits jeux indépendants.

- **Salle collective synchronisée** pour les joueurs présents : tribune du Juge, accusation à gauche (Procureur ou Enquêteur, Analyste), témoins et suspects à droite, barre de parole, quatre actes ou objets de litige selon le dossier et preuves **publiquement révélées** uniquement.
- **Échanges réels** : le Juge appelle à la barre ; accusation cite une pièce ; le personnage répond ; la partie adverse confronte ; un autre personnage peut contredire ; objection procédurale bornée ; droit de réponse garanti.
- **Une décision spécifique par dossier** : « quel témoignage est remis en cause ? », « quelle pièce protégée peut être discutée ? », « que montre la vidéo ? », « quelle branche de commandement soutient-on ? » ; les choix ne changent jamais les faits scellés.
- **Pas de voix ni vidéo inventée :** l'application met en scène et synchronise les droits de parole ; interactions vocales utilisent les capacités existantes ou la conversation réelle des joueurs.
- **Si le Juge est absent** dans un dossier facultatif, l'audience v52 actuelle s'applique sans nouvelle salle.
- **Si le Juge est présent**, éviter le doublon : **Tribunal de confrontation → Audience finale v52 réduite à l'évaluation, vote/réévaluation et révélation**, sans refaire tous les discours et toutes les défenses. Auditer les routines v52 `igr_v52_begin_stage`, `igr_v52_advance`, `igr_v4_tick` et `igr_v4_lock_final` avant toute modification.

### Cadence en jeu (propositions à playtester)
- Dossiers ordinaires avec Juge : tribunal ~6–9 minutes selon nombre de mis en cause et nature du dossier, puis vote v52. 019/020 avec grande table peuvent nécessiter davantage.
- Régime : **procès long seulement si la deuxième capture survient au C3** : 1 min ouverture + 6 min de déclarations des trois suspects (2 min chacun) + **5 min de confrontation** + 1 min clôture + 1 min vote = **14 min**.
- Régime : si les deux dirigeants sont capturés dès C1/C2, C2/C3 permettent les interrogatoires, donc **tribunal commun plus court** (~7–8 min à tester), sans répétition des mêmes témoignages.
- Régime : si un fugitif reste libre, son siège est vacant ; ne pas le faire comparaître fictivement. L'audience peut examiner des faits sans jugement en présence du fugitif.
- Dossiers 029 : les quatre témoins ont le droit de déposer, mais les juger en tant que suspects modifierait le canon et est interdit.

## 3. L'Avocat : uniquement s'il joue vraiment

**Capacités actuellement vérifiées :** Avocat (`maitre`) peut coexister avec Juge dans les dossiers **016, 019, 020, 030** ; les autres configurations ne l'imposent pas. Le contrat v43 impose **un seul client officiel** choisi après consultation, avec possibilité de consultations non officielles.

L'Avocat n'est ni le Juge ni le Procureur ; il défend la lecture exacte de la responsabilité de son client, sans falsifier les faits :
1. **Avant le tribunal :** un client officiel, préparation de la défense, questionnement des contradictions et requêtes de procédure autorisées. Ne pas lui donner un veto sur une arrestation ni un accès aux secrets scellés.
2. **Au tribunal :** contre-interroger un témoin, contester une pièce pour cause procédurale, plaider **pour son client**, et non pour les trois à la fois ; intervention dans le temps imparti à sa représentation.
3. **Victoire personnelle :** reconstruire correctement le niveau véritable de responsabilité de son client selon les règles existantes, pas « obtenir l'acquittement à tout prix ». Cela préserve l'équilibre documentaire.

**Pour LE RÉGIME, recommandation : pas d'Avocat obligatoire.** Base de 6 : Enquêteur + Analyste + Juge + trois suspects (dont deux fugitifs), Procureur facultatif. On pourra tester un Avocat **facultatif à 7–9 joueurs** si et seulement s'il intervient utilement **dès C1** (conseil distant, requêtes de recevabilité non bloquantes) et au procès sans étouffer un autre joueur. Sinon ne pas l'ajouter. Éviter qu'il reste inactif pendant la cavale.

## 4. LE RÉGIME — décision de conception générale terminée, contenu à écrire

Ce contrat **clôt la conception générale**, pas la réalisation technique.

- **032** : deux dirigeants recherchés de la prison de Vahran ; **033** : héritier et cousin Défense ; **034** : président et gendre sécurité, codes **LA TÊTE / LE SCEAU / LA TOUR**.
- Tous les personnages **incarnés** affichent les noms de joueurs. Les trois variantes A/B/C scellent **ressources, preuves et responsabilités**, tandis que les deux fugitifs **choisissent** secrètement ensemble/séparés avant C1 (ensemble seulement si deux consentements).
- **Captures dès C1 possibles** si l'enquête obtient deux corroborations et suit la bonne piste, notamment après des erreurs des fugitifs ; une tentative par cible/cycle ; contrôle procédural du Juge sans arbitraire.
- **Après arrestation :** perte immédiate de l'objectif de fuite, défense active jusqu'à l'épilogue fatal fictionnel ; la capture n'est pas une preuve de culpabilité. Si fugitif libre : pas de faux procès où il serait physiquement présent.
- **Troisième suspect :** objectif privé de coopération (preuve authentique avant C2 et déclaration finale exacte sur l'ordre et sa propre implication), ou protection (défense documentée avant C2 et mauvaise attribution de sa responsabilité au vote), avec action personnelle explicite ; résultat calculé serveur.
- **Double épreuve** : 2/2 captures = victoire de traque ; quatre décisions criminelles avec auteur/chaîne/contrôle à reconstituer = victoire judiciaire si seuil suffisant (proposition 3/4, à tester). Victoire totale seulement si les deux sont réussies.
- **Journal de Karsane** : flashs fictifs immédiatement après événements publics confirmés ; liesse à Darsen lorsque capture présidentielle validée, avec pluralité des réactions civiles. Les actualités ne révèlent aucun secret caché.
- **Tribunal de Karsane** : salle collective, Juge aux commandes, confrontation **5 min** pour le procès long; vote final v52 conservé sans répétition d'audience.

### Critères avant codage et publication
1. Un vrai pack A/B/C par dossier : preuves contradictoires, quatre actes, deux voies de fuite et décisions adversariales testables.
2. Test d'une salle unique synchronisée à 6–9 joueurs avec pièces et parole identiques, et aucun droit de Juge arbitraire.
3. Réemploi du moteur existant : pas d'audience complète doublée, pas d'impact sur Terreur (026–028) et les dossiers sans Juge.
4. Scénarios tests 0/2, 1/2, 2/2 captures aux C1–C3, procureur/avocat absents ou présents et objectifs du troisième suspect.
5. Server side authority des faits, des votes et des scores ; pas de publication des scripts secrets ou cartes privées via le client. Performances web/iOS/Android et reconnexion.
6. Tant qu'aucun back-end de salle n'est écrit, **ne pas présenter le Tribunal comme disponible en production**.
