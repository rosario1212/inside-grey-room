# OMERTÀ V24 — QUINZE VARIANTES RÉDIGÉES, RELEASE VERROUILLÉE AVANT INTÉGRATION

> **26 octobre 2026 — État précis : 15 VARIANTES A/B/C ÉCRITES À TITRE PRIVÉ (021–025), MAIS AUCUNE NOUVELLE VARIANTE ACTIVE DANS LE JEU.** Le manuscrit privé complet est délivré séparément au propriétaire. Ce dépôt public ne doit contenir **aucune identité de coupable par variante**, aucune réponse d'enquête, aucun fait privé déterminant et aucune variante complète. **PR de conception / QA en brouillon, pas un déploiement.**

## Dernier arbitrage canonique, sans faux meurtre

| Dossier | Crime / mystère vraiment référencé dans V7 | Ce qu'il faut REMPLACER des anciens textes V22/V23 |
|---|---|---|
| **021 — L'Enveloppe** | Une collecte n'arrive pas à son destinataire ; montants, remises et accès aux comptes contestés. | Ne pas inventer le meurtre de **Gallo** ni des objectifs de meurtre non soutenus par le canon. |
| **022 — Omertà** | **Nino Caruso est tué** après une dispute ; instruction ambiguë, auteur matériel et faux récits postérieurs. | Séparer « propos », « meurtre », « couverture » et « dette » : ces faits ne sont pas interchangeables. |
| **023 — La Table** | **Falco est absent de la réunion**, **Adriano est attaqué** ; accord, itinéraire et intérêts des crews. | Ne pas transformer l'absence de **Falco** en meurtre sans preuve correspondante. |
| **024 — Il Pentito** | **Massimo De Luca est arrêté** dans une affaire d'extorsion ; une coopération et ses corroborations sont discutées. | Ne pas importer un meurtre de **Valenti** inventé, et ne pas confondre un **Pentito formel** avec l'indic secret optionnel. |
| **025 — Il Don** | Une entreprise subit des extorsions et son propriétaire **une agression grave** ; la chaîne des ordres de Santoro est controversée. | Ne pas inventer le meurtre de **Benedetti** comme réalité du canon de référence. |

Le jeu se déroule en 2006 autour d'une **Famiglia Santoro fictive** dans New York / New Jersey. Des noms de la Famiglia peuvent réapparaître comme repères sociaux ; **leurs condamnations, blessures ou décisions dans une partie ne survivent jamais dans un autre dossier**. La fiction ne porte aucune accusation sur une personne réelle.

## Objectif joueur : deux lignes faciles à comprendre

**Un mafieux n'est jamais « Suspect » en tant que fonction.** Le serveur doit lui attribuer un **poste mafieux précis**, choisi au hasard parmi les **places réellement rédigées** pour la variante et le nombre de personnes dans la salle. Le joueur garde son pseudo et son tempérament. Aucune étiquette de rang n'impose un dialogue ni une loyauté.

**OBJECTIF SUSPECT** — Une seule phrase indiquant quel résultat personnel tu dois obtenir **au verdict final**. Exemples généraux : échapper à la responsabilité de la remise disparue, de la transmission d'un ordre contesté, d'un faux témoignage, d'une fuite d'itinéraire ou de l'agression. L'objectif exact provient de **l'acte et des preuves de ton poste**, pas d'un formulaire identique pour tous.

**OFFRE DE L'ENQUÊTEUR (C2+)** — Le suspect voit ce qu'il perd et le nouveau but **AVANT** d'accepter ou refuser. S'il accepte : INDIC secret, il **reste mafieux**, change de but et transmet **zéro** information automatiquement.

**OBJECTIF INDIC : SAUVE TA PEAU **ET** RENSEIGNE L'ENQUÊTE.** Pour gagner, le joueur (1) évite une conséquence personnelle précise ou reçoit une protection réellement accordée selon la fiche, et (2) **choisit de transmettre un seul renseignement privé, vrai, utile et recoupable**, avant le verdict. Ce renseignement ne doit pas être déjà connu de l'Enquête à l'envoi. Le joueur peut se taire, protéger le Capo, mentir autrement, ou aider sans tout révéler ; le silence et le mensonge ne valent pas victoire INDIC. **Une accusation arbitraire d'un autre joueur ne vaut aucun point**.

**Carte compacte** : **ÉNONCÉ / CE QUE TU SAIS / TON OBJECTIF / TU PEUX CHOISIR DE / TON RISQUE**. Les preuves, l'explication du score et les limites de connaissances sont consultables via **Voir les détails et les pièces**, à portée de main et facultatif.

## Trois variantes par dossier : rédaction, mais pas encore publication

Le propriétaire dispose d'un **pack confidentiel de cinq fichiers JSON et cinq fichiers Markdown** (021, 022, 023, 024, 025) rassemblés avec un rapport d'audit : **15 variantes A/B/C**, **7 places privées par variante**, **30 sources C3 principales** (deux indépendantes par variante) et **105 positions de renseignement privé**. Les 84 corroborations complémentaires proposées dans les quatre derniers dossiers sont des **brouillons documentaires**, pas des preuves authentifiées ni réellement accessibles en salle.

**Audit automatique local réalisé :** présence de A/B/C, trois cycles, unicité des identifiants de postes, pas de fonction générique « suspect », indépendance déclarée des deux sources C3, voies de clôture sans indic, absence d'envoi automatique lors de l'acceptation, objectifs initiaux distincts des buts INDIC. Cela ne suffit pas à établir la jouabilité ou une note de 10/10.

## Sécurité vérifiée en lecture seule sur Supabase

- `public.igr_v4_scenario_packs` contient les **anciens packs** du 021 au 025. Chacun expose trois `trames` narratives, **et non trois variantes A/B/C** en base.
- Les fonctions anciennes `igr_omerta_start_game`, `igr_omerta_cast_players_v1230`, `igr_omerta_make_reveal` opèrent encore autour des anciens personnages/slots et, pour certaines, d'un **état de campagne**. Le lancement courant refuse hors **4 à 8 joueurs au total**. Ne pas confondre les simulations théoriques 1–7 avec le réel.
- **RLS activée** sur les tables contrôlées (packs, rooms, players, campagnes) ; **aucune permission directe SELECT** pour `anon` ou `authenticated` sur ces tables au moment de la lecture. **Cela NE prouve PAS** l'absence de fuite par les fonctions SECURITY DEFINER ou les autres API : audit additionnel exigé.
- Une salle de **023 en lobby** a été observée. Les états et données de production ont été laissés **intacts**.
- Le canon privé ne doit pas être copié dans GitHub public, dans un bundle client, ni dans la réponse de salle non autorisée. **RLS + contrôles serveur nominatif + sélection de variante immuable** à tester avant import.

## Critères qui BLOQUENT encore le merge, la mise en ligne et la note 10/10

1. Relecture croisée **manuelle** des 15 canons et de la cohérence de toutes les pièces C1/C2/C3, horodatages et contradictions.
2. Qualifier les **105 positions** avec de véritables pièces et **une issue gagnante et une perdante** pour chaque objectif : aucun acquittement garanti, aucune info privée déjà publique.
3. Construire un stockage **serveur uniquement** des variantes, tirer A/B/C une seule fois par salle, verrouiller le résultat sans dépendance aux autres épisodes.
4. Raccorder l'attribution aléatoire des places aux **effectifs autorisés** et aux pseudos réels ; si pas assez de positions compatibles, **refuser proprement** plutôt que dupliquer les buts.
5. Implémenter et vérifier les **RPC privées** d'offre/acceptation et d'envoi volontaire d'un identifiant de fait authentique ; aucun client ne peut s'attribuer un rôle, changer son statut ou fabriquer un renseignement.
6. Créer un verdict sur les **actes réellement présents dans l'affaire** et évaluer côté serveur **sauve ta peau ET preuve utile** à la clôture.
7. Garantir les deux sources indépendantes de C3 **même sans indic**, sans révéler les vérités privées par la vue publique, les erreurs ou les journaux.
8. Tester les vraies salles **4 à 8 joueurs**, déconnexions, refus, silence, multiples offres, fonctions détournées, données adverses, FR/EN, mobile, et l'absence de régression sur CARTEL/autres dossiers.

**Décision de sécurité :** les brouillons sont terminés comme **matière narrative de travail**, mais **ni la conception des objectifs réellement jouables, ni l'intégration, ni la release OMERTÀ ne sont encore certifiées**. Aucun changement appliqué sur Supabase ni aucune publication Cloudflare dans ce chantier. Lancer la version live sans ces protections serait incohérent avec l'expérience et la confidentialité attendues.

**80 %** : crimes, enjeux, indices et conséquences du dossier autonome. **20 %** : rangs, codes et univers Santoro. **Zéro** héritage d'une victoire ou d'une mort entre épisodes.
