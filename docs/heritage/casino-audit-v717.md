# CASINO — quatrième campagne HÉRITAGE · Audit v717

Date : 16 novembre 2026  
Objet : positionner CASINO à la suite de CENDRES → KUROI → MAÎTRE dans le **catalogue**, puis auditer son vrai jeu serveur v105 sans inventer de scénario ni exposer le canon privé.

## Contrat éditorial, vérifié
- **Quatrième campagne HÉRITAGE**, après MAÎTRE dans le hub. Elle est autonome : pas de dépendance narrative artificielle, de déverrouillage par les anciennes campagnes ou de fusion de leurs sauvegardes.
- **Trois scénarios liés** : *Les Portes de l’Impérial* (3 phases), *La Chute de l’Impérial* (3 phases), *Le Dernier Dragon* (2 phases). **Huit phases** et une même session persistante.
- **7–12 personnes** : 4–7 personnages du casino, plus l’Agent international, l’Enquêteur et l’Analyste ; le Procureur et le Juge sont facultatifs, chacun tenu par une personne distincte. Le nombre de personnages du casino n’est pas le nombre total de joueurs.
- **Trois variantes A/B/C approuvées** dans le schéma privé, confirmées par une requête sur leur seule métadonnée (sans lire ou exporter les manuscrits). La variante est choisie au lancement et demeure fixe sur les trois épisodes.
- Triade Yonghe et PNJ centraux ; aucune personne ne joue automatiquement le prénom d’un PNJ défini : le casting utilise les noms choisis par les joueurs.
- Un écran et une clé de reprise par participant. Les invités n’ont pas besoin d’acheter la licence de l’hôte.

## Audit du gameplay réel

| Axe | Contrôle | Résultat et réserve |
|---|---|---|
| Séquence HÉRITAGE | Catalogue, gestion des runtimes chargés de façon asynchrone | **Corrigé en v717** : CASINO est annoncé « campagne IV/IV » et replacé après MAÎTRE sans duplication |
| Rôles et groupe | `casinoService` / `startRuntime` | 4–7 participants Yonghe + 3–5 membres du bureau ; rôles d’enquête séparés, casting 7–12 |
| Poker | `casino/games.mjs` | Ouverture collective obligatoire ; cartes, hasard, tour, limite de mise et règlement serveur, gains virtuels ; anciennes vérifications sur les 2 598 960 mains |
| Enquête | `casino/runtime.mjs` | Cinq décisions progressives de l’Agent ; repêchage encadré après délai ; preuves corroborées de groupes de provenance distincts pour interpellation |
| Interpellation et prison | `REQUEST_INTERPELLATION`, `INTERPELLATE`, `DETAIN`, `MESSAGE` | L’Agent agit lui-même ; une arrestation n’est pas un verdict ; les détenus conservent une participation écrite |
| Accords et succession | Registre, dettes, territoires, loyauté, candidatures, scission | Les signatures sont requises ; un territoire ne change pas de contrôleur sur une simple promesse ; la succession dépend des alliances et du contrôle, non d’une volonté unique |
| Verdict judiciaire | `RULING`, `corroboratedFacts`, `factualRuling` | Le Juge facultatif a une fonction réelle, une condamnation doit s’appuyer sur des faits établis. Le vote du groupe n’est pas le système du procès CASINO |
| Confidentialité | Projections `viewRuntime`, service, journal serveur | Le canon, les réponses des énigmes, les identités d’infiltrés, les mains adverses et les clés personnelles ne sont pas envoyés indistinctement à tous |
| Persistance | Transactions CAS, journal, idempotence et reprise par clé personnelle | Solide architecturalement et déjà couverte par tests ; une vraie reprise sur les téléphones des joueurs reste nécessaire |
| Épilogue | `FINISH_CAMPAIGN`, `finale()` | Affiche succession, justice et bilan personnel ; **corrigé en v717** : libellés français, absence d’audience signalée honnêtement |

## Problèmes encore ouverts : ordre de priorité

### P1 — Conditions de victoire insuffisamment explicites
Le code calcule un successeur politique, des décisions judiciaires et un bilan personnel, mais **n’attribue pas une victoire/défaite cohérente et explicite à chaque camp ou rôle**. Pour une expérience d’enquête/déduction, un tableau de succès des objectifs doit distinguer :
- vérité établie et responsabilité pénale (bureau) ;
- pouvoir réellement consolidé ou durablement partagé (Yonghe) ;
- objectifs secrets propres aux personnages, sans arbitraire du MJ ;
- échec du plan personnel sans que toute la partie soit jugée perdue.

Il faut conceptualiser ces critères **avant** de les programmer, car ils changeraient les conditions de victoire.

### P1 — Finale pouvant manquer de substance
La clôture du chapitre III vérifie les défenses et jugements *en attente*, mais elle ne requiert **aucune audience si personne n’en a ouvert**. Elle peut aussi s’achever sans revendication sérieuse de succession. Une session techniquement valide peut donc finir sur un Dragon conservant le pouvoir et sans résultat judiciaire. Mettre en place au minimum un bilan documenté du bureau et un Conseil final même si les preuves ont échoué, sans forcer une fausse condamnation.

### P1 — Hôte trop maître du rythme après la première partie
La première partie impose une durée sociale minimale et la résolution du poker ; les phases tardives peuvent être avancées par l’hôte sans validation de préparation de chaque joueur. Il faut un dispositif de « prêts à poursuivre » ou une fenêtre d’objections, **avec un secours temporel** qui évite de bloquer le jeu si un participant quitte la partie.

### P2 — Arbitrage judiciaire et conflits d’intérêts
Le Juge peut acquitter ou libérer avec motivation, et condamner seulement si les faits exigés sont établis. Cela préserve sa place, mais une décision unilatérale biaisée peut influencer la détention et indirectement la succession. Ne pas supprimer le Juge ni convertir automatiquement chaque verdict en vote populaire : préférer la possibilité de contestation, une justification structurée et un contrôle des pouvoirs.

### P2 — Profil de rejouabilité et charge du groupe
Trois variantes, 0–2 infiltrés, accusations, accords, poker et ramifications offrent plusieurs trajectoires. Mais 7–12 personnes, avec écrans distincts et délais de poker, augmentent les temps morts ; l’ergonomie réelle du bureau et des personnes interpellées doit être observée à table.

### P3 — Validation humaine non encore acquise
Les requêtes de métadonnées sur le schéma privé ont montré **zéro salle CASINO enregistrée** au moment de l’audit. Les tests techniques antérieurs utilisent des sessions synthétiques et Chromium ; cela ne prouve pas le plaisir, l’équité ni le confort iOS dans une vraie partie de 7–12 personnes.

## Décision v717
- **Oui** : rattacher visiblement CASINO à la suite des trois autres campagnes du catalogue HÉRITAGE, sans altérer son autonomie ou ses 3 scénarios.
- **Oui** : corriger les libellés de phase, de verdict et les résolutions judiciaires vides.
- **Non pour l’instant** : réécrire les trois variantes privées, imposer des victoires, neutraliser les fonctions du Juge ou changer les règles de l’Agent sans une conception validée.
- **Prochaine étape recommandée** : définir d’abord la victoire collective du bureau, la réussite politique et le déroulement d’une clôture sans arrestation, puis simuler 7/9/12 joueurs avant modification du moteur.

*Les notes chiffrées seraient prématurées tant que les conditions de victoire et le rythme réel des parties ne sont pas éprouvés. Aucun texte des variantes A/B/C n’est divulgué dans ce rapport.*
