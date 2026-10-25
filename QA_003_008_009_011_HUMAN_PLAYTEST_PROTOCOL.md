# Playtest humain à six — Dossiers 003, 008, 009 et 011
**Protocole de validation, 25 octobre 2026.** Statut initial : `NON JOUÉ` (aucune partie humaine ne doit être inventée). Les 12 parties simulées A/B/C à six joueurs et les 72 synchronisations vérifiées côté Supabase **ne valent pas** un playtest humain.

## But et cadre
Vérifier que chacun des quatre scénarios est **compréhensible, tendu, équitable, rejouable, et intéressant pour les six participants**. L'enquête doit rester une reconstruction argumentée des faits, non une devinette ou un jugement moral. Ne révélez pas la variante A/B/C avant le débrief final.

**Composition** : cinq rôles permanents (Enquêteur, Analyste, trois Suspects) plus le rôle facultatif au sixième siège :
- **003, Le Dernier Protocole** : Expert. Version quatre joueurs (sans Analyste ni Expert), cinq et six à comparer.
- **008, Sous Serment** : Juge.
- **009, Le Sujet 17** : Expert.
- **011, 36 Heures** : Procureur.

**Préparation** : six appareils ou sessions distinctes (jamais de partage des écrans privés), application actualisée, réseau stable, mode de durée convenu, un observateur de préférence externe. Ne créez pas de données QA artificielles durables sur le projet de production. Le jeu tire la variante de manière privée ; laissez le mécanisme normal décider. Notez la variante *après la révélation seulement*. Utilisez des pseudonymes pour les retours. Les thèmes peuvent être éprouvants : annoncez les sujets, autorisez le retrait sans justification ni humiliation.

## Déroulé par partie
| Moment | Épreuve | Signal d'échec |
|---|---|---|
| Lobby | Six connexions indépendantes, six bons rôles, pas de partage de fiches | Rôle dupliqué, cinquième joueur exclu ou information visible par un tiers |
| Cycle 1 | Chaque Suspect défend sa chronologie ; camp Enquête formule une première hypothèse. Facultatif : pouvoir du 6e rôle | L'Enquêteur possède la vérité dès l'entrée ; le 6e rôle ne trouve aucune utilité |
| Cycle 2 | Confronter au moins deux pièces et rectifier une hypothèse. Vérifier que l'Expert/Procureur ne lit pas d'indice futur | Indice divulgué hors cycle, progression imposée par une donnée inaccessible |
| Cycle 3 | Formuler une reconstruction sourcée, entendre une objection de chaque suspect, puis conclure | Impossible d'étayer le verdict malgré toutes les pièces prévues |
| Débrief immédiat | Chacun explique ce qu'il savait, ce qu'il supposait, et quelle preuve l'a convaincu | Final arbitraire, culpabilité inférée seulement d'un mensonge ou d'un diagnostic |

## Points spécifiques par dossier
**003 — Expert et preuves documentaires** : demander quel document prouve réception, décision et exécution ; distinguer ces notions. Vérifier que les 9 investigations ne sont pas des répétitions, que les contre-expertises créent un débat, et que l'Expert a un choix difficile sans révéler la faute finale.

**008 — Juge et pièces protégées** : contrôler les prix affichés et réellement débités (p1=1 ; p2=1 ; p3=2), plafond trois points, possibilités d'accès partiel, droit de contestation et absence d'action après conclusion. Le Juge doit justifier au moins une décision qui modifie une confrontation, sans censurer arbitrairement toute l'enquête.

**009 — Expert et ORPHÉE** : aucun rôle ne transforme l'amnésie authentique en preuve de culpabilité ou de mensonge ; le retrait du consentement précède l'incident ; les décisions sont vérifiées par traces documentaires. Le sixième joueur doit corriger une inférence trop rapide, pas donner la solution.

**011 — Procureur et 36 Heures** : tester l'entretien/coopération (acceptation et refus), ses conséquences sur la restitution des faits et son éventuel objectif personnel. Bien séparer ordres, exécution et dissimulation. Aucun accord ne doit magiquement effacer les preuves de responsabilité. L'orientation du Procureur ne peut mentionner les pièces des cycles futurs.

## Évaluation après la partie
Chaque participant attribue de 1 à 10, **indépendamment et sans concertation**, une note pour : compréhension de son rôle ; intérêt de ses décisions ; quantité et qualité des interactions ; équité des indices ; tension dramatique ; crédibilité de la révélation ; envie de rejouer. Le sixième joueur répond aussi « À combien de reprises ai-je changé la partie grâce à mon rôle ? » (nombre d'actions concrètes) et donne un exemple précis.

L'observateur note, sans inventer de résultats, les blocages, attentes sans prise de parole, fuites d'information, contradictions de la solution, échecs techniques, situations où un rôle écrase les autres, difficultés de navigation et dénouements ressentis comme arbitraires. Pour les problèmes, enregistrer l'étape, le rôle et le comportement reproductible ; **ne pas** publier les fiches privées ou la solution dans un ticket public.

## Échantillonnage des variantes et règle d'arrêt
1. **Premier passage** : une partie réelle de chaque scénario, six joueurs à chaque fois, plus un essai de la configuration à quatre ou cinq joueurs du 003.
2. **Couverture A/B/C** : rejouer jusqu'à observer chacune des trois variantes de chaque scénario ; les probabilités aléatoires ne garantissent pas une couverture en exactement trois tirages. Enregistrer A/B/C uniquement après révélation finale.
3. **Confiance éditoriale** : idéalement, deux groupes indépendants pour chaque dossier ; varier l'attribution de l'Enquêteur et du sixième rôle.

**Bloquant (ne pas déclarer « 10/10 »)** : fuite de carte privée, contradiction factuelle non résolue, impossibilité d'inférer la solution des indices promis, blocage d'un pouvoir, mauvaise facturation des protections, divulgation de preuve future, rôle facultatif inactif tout le long de la partie, abandon ou malaise non pris en charge.

**Objectif de qualité pour une éventuelle note 9–10/10**, non certification automatique : zéro incident bloquant, satisfaction médiane au moins 8/10, révélation jugée justifiée par les éléments par au moins cinq des six joueurs, et sixième rôle jugé utile par son joueur et par au moins trois autres. En cas d'échec, corriger puis **refaire** le même scénario et la variante concernée.

## État observé au 25 octobre
- 12 parties serveur instrumentées (003/008/009/011 × A/B/C), 72 réponses de synchronisation, six rôles par partie : **PASS**. Toutes les transactions QA ont été annulées.
- Aucun indice « hide » d'un autre Suspect détecté dans les réponses vérifiées ; l'exactitude du contrôle est limitée aux champs comparés.
- Intégrité des 12 manuscrits, actions facultatives et verrouillage par cycle : **PASS sur les scénarios simulés**.
- **Playtests avec six humains : non réalisés**. Ne pas convertir les scores éditoriaux précédents en preuves expérimentales.
- **Version publique Cloudflare : non certifiée dans cette session** (lecture directe indisponible).

Voir `QA_003_008_009_011_SESSION_SHEET.md` pour une fiche de séance duplicable.
