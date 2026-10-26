# OMERTÀ — PILOTE 021 A/B/C : AUDIT SANS SPOILER (26 OCTOBRE 2026)

> **STATUT : 3 VARIANTES ÉDITORIALES PRIVÉES RÉDIGÉES, NON LIVRÉES AU DÉPÔT PUBLIC NI AU RUNTIME.** Leurs détails ne doivent jamais apparaître dans les fichiers web ni dans cette PR publique. La source confidentielle est remise au propriétaire séparément.

## Résultats de la vérification du système existant

- **Données actuelles Supabase** : `igr_v4_scenario_packs` contient les cinq numéros 021–025 et une liste `trames` de **3 étapes narratives par dossier**. Ce champ n'est **pas** un lot de trois vérités indépendantes A/B/C. Aucun champ `variants` n'existe dans ces packs.
- **Ancienne histoire encore active** : les cartes 021–025 contiennent notamment Paolo Serra, Rinaldi et des formulations dépendantes des épisodes antérieurs. Les fonctions de partie et de révélation OMERTÀ utilisent toujours une campagne (`igr_omerta_start_game`, `igr_omerta_make_reveal`). **On ne doit pas publier directement les manuscrits V22/V23 sur ces anciennes cartes.**
- **Contradiction de conception** : V7 définit le **021 autonome centré sur une enveloppe absente**, une instruction de remise ambiguë et un montant sorti du crew. Les V22/V23 ont ajouté un **meurtre de Gallo** au même dossier sans pièces correspondantes dans ce canon. Pour le pilote 021, **ne pas considérer cet homicide inventé comme déjà établi** ; reprendre V7 et réécrire les objectifs visant Gallo avant toute attribution. Les crimes d'autres numéros restent propres à leurs dossiers.
- **La distribution de rôle n'est pas pleinement prête** : l'actuel déclencheur cast des slots venant des anciens `suspects` ; le pilote exige de vrais postes mafieux pré-rédigés, des pseudos joueurs, aucun statut « suspect » comme profession et aucun indic automatique. Le serveur actif impose actuellement **4 à 8 joueurs**, donc les simulations fictives 1–7 de V22 **ne certifient pas ces effectifs en production**.

## Avancement du pilote 021 — trois variations réellement distinctes

**Toutes les versions A/B/C en conception :** même question publique (où est passée l'enveloppe?), trois cycles, plusieurs positions mafieuses avec objectif individuel, au moins deux preuves C3 d'origines différentes et des renseignements privés optionnels pouvant servir un indic. Le **mobile, la cause réelle de l'écart, la responsabilité et les pièces changent substantiellement** entre les trois variantes. Aucun joueur ne doit être obligé de parler pour permettre au camp Enquête de reconstituer les faits.

**Confidentialité** : les détails de A/B/C sont remis uniquement dans un fichier privé, non dans la branche publique, l'arbre Santoro, la synchronisation commune ou un frontend. Les joueurs ne doivent pas connaître à l'avance la lettre de la variante tirée côté serveur.

**Fiches de joueur envisagées :** `ÉNONCÉ` / `CE QUE TU SAIS` / `TON OBJECTIF` / `TU PEUX CHOISIR DE` / `TON RISQUE`. Les pièces, limites de connaissance et seuils précis se trouvent sous « Voir les détails et les pièces », toujours accessible et jamais imposé. Aucun joueur n'a deux objectifs principaux.

**Règle INDIC conservée :** accepte ou refuse librement une proposition complète C2+ envoyée par l'Enquêteur. Un indic conserve son camp et son rang mafieux ; l'acceptation **n'envoie aucune information**. S'il accepte, sa victoire exige **(1) se sauver personnellement ET (2) transmettre explicitement un renseignement vrai, privé, utile et vérifiable** ; un seul fait suffit. Le faux renseignement reste possible dans le RP, mais ne valide pas la deuxième condition. Le rôle ne peut pas être forcé de se trahir lui-même, ni obtenir une victoire en accusant un joueur au hasard.

## Critères NON encore prouvés et blocages

1. Comparer chaque vérité A/B/C privée au canon réel du 021 et valider les chiffres, lieux, ordres et documents par un second audit narratif.
2. Réécrire les objectifs de rôle 021 où « Gallo assassiné » n'est pas attesté par le noyau V7 ; revalider le risque de gain/perte de chaque poste.
3. Créer des **identifiants de faits privés sécurisés** pour chaque variante, dont la valeur, le moment de publication et le recoupement sont vérifiés côté serveur.
4. Mettre en place une **sélection aléatoire et immuable** A/B/C par salle, distincte d'une campagne interépisodes. Ne pas mélanger `trames` avec `variantes`.
5. Intégrer les cartes et les sept postes potentiels aux **effectifs réellement autorisés**, puis vérifier l'aléa, la confidentialité et les reconnexions.
6. Implémenter le score individuel sur des responsabilités finales précises, et les deux conditions cumulatives des indics ; ne pas présumer de la présence de ces axes en production.
7. **Ne pas modifier les tables ni les fonctions live avant migration et QA**. Pour la sécurité, les données secrètes ne seront jamais déposées dans GitHub public.
8. Tester parties silencieuses, en FR/EN, avec et sans indic et deux preuves C3 garanties ; valider l'expérience avec des joueurs avant toute note 10/10.

**80/20 :** les conséquences et indices appartiennent au dossier 021 (80%), les rangs et les codes à l'univers Santoro (20%). Aucun sort d'un joueur ne se transmet au 022–025.

**Bilan** : pilotage éditorial commencé et structure A/B/C privée rédigée. **Pas de variante opérationnelle en jeu, pas de validation 10/10 ni de déploiement.** Cette page ne révèle aucune solution.
