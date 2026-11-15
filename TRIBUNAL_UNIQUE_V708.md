# Inside Grey Room — Tribunal unique v712 (déployé, révision visuelle)

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

**Statut : PR #517 fusionnée. Les migrations v707, v708 et v711 et l'interface du tribunal ont été publiées en production. La révision visuelle v712 adapte la hiérarchie et la lisibilité des écrans sans changer le déroulement ou le scoring.**

## v709 — Durées prévisionnelles et activité par rôle

Le tribunal unique remplace l'audience et les comparutions minutées en présence d'un Juge ; son temps n'est pas plafonné. La sélection de durée indique une estimation globale pour une partie typique de sept joueurs avec trois Suspects : **COURT ≈45–70 min** et **LONG ≈70–105 min**. La préparation des débats est estimée à **15–25 min en COURT** et **20–35 min en LONG**, sans minuteur ni obligation de conclure à ces seuils. Les variations du nombre de Suspects et du nombre de joueurs modifient l'estimation du salon. Les anciennes estimations sont inchangées sans Juge.

Les étoiles d'activité et la présentation des rôles utilisent une **échelle de cinq étoiles** dans le salon et le règlement. Elles représentent la fréquence d'intervention, jamais le pouvoir de décider : avec Juge, Enquêteur **5/5**, Juge **5/5**, Procureur **4/5**, Avocat **4/5**, Suspect **4/5**, Analyste **3/5**, Inspecteur **3/5**, Journaliste **3/5**, Expert **2/5**, Témoin **2/5**. Sans Juge, Procureur et Avocat reviennent à 3/5, et les autres rôles conservent leur profil de partie. Le rôle d'Officier dans TERREUR reste à 5/5, en raison de ses décisions militaires répétées.

**v711 — Majorité collective effective** : tous les membres habilités du camp Enquête votent individuellement la responsabilité 0/1/2 de chaque suspect. Les voix valent toutes **1**, y compris celles du Juge et du Procureur. Une catégorie doit obtenir **strictement plus de la moitié** des voix valablement exprimées pour faire autorité. Sans majorité (par exemple 0/1/2 à trois votants, ou 0/2 à deux votants), le verdict est **indéterminé (-1)** et ce suspect ne compte pas comme une responsabilité exacte pour la victoire collective. Les absents déclarés par l'hôte ne votent pas ; le vote reste secret jusqu'à la révélation. Le Juge dirige la procédure et le Procureur soutient l'accusation, mais ni l'un ni l'autre n'a un veto sur la décision collective. Les objectifs individuels des personnages corrompus demeurent indépendants : pour corrompre le verdict, il faut convaincre d'autres votants. Les issues spécialisées (rapport des témoins 029, missions Omertà 021–025, intrigue Cartel 031) conservent leur logique de révélation. Aucune modification ne leur a été imposée artificiellement.

**Validation** : requête SQL dans une transaction annulée : majorité contre Juge et Procureur seuls, égalité, absence et fonction officielle de révélation testées. Les migrations v707, v708 et v711 ont été appliquées à Supabase et le jeu a été déployé sur Cloudflare. La validation humaine multijoueur reste à mener.

## v712 — Présentation des règles et du tribunal

L'interface remplace les blocs denses par une progression en cinq repères visuels (installation, accusations, débats, conclusions, vote secret), des cartes distinctes pour le juge, les défenses et les confirmations, une disposition de salle facultative plus lisible et des points d'ordre du jour activables. La palette noir graphite et accents laiton clair reste sobre, avec davantage d'espace, une meilleure taille de lecture sur téléphone et des éléments accessibles. Le manuel FR/EN présente côte à côte les deux finales, puis un encart de majorité stricte. **Les mécanismes de vote, la confidentialité et les conditions de victoire ne changent pas dans v712.**
