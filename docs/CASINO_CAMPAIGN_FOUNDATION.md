# Campagne Casino — fondation technique (historique)

> **Historique de la première architecture.** Le socle ci-dessous a été complété en v105 : service Edge, sauvegarde transactionnelle Supabase, jeux et client multijoueur. Voir [le relevé actuel](CASINO_V105_VALIDATION.md). La campagne reste verrouillée jusqu’à la validation des canons privés et des essais de bout en bout. Les limitations décrites comme futures ci-dessous concernent uniquement le prototype initial.

## Objectif

Trois scénarios continus (3 + 3 + 2 phases) : première soirée de casino et opérations parallèles, intervention et détention, puis audience et résolution de la succession. Quatre participants minimum au casino ; camp d'enquête séparé avec Agent international, Enquêteur, Analyste, et Procureur/Juge facultatifs. Les rôles d'enquête peuvent être regroupés par une implémentation future, mais une même personne ne doit pas obtenir les secrets d'un suspect en devenant enquêteur.

La conversation orale, les coalitions et les accords constituent le cœur de l'expérience. Le poker est obligatoire en phase 1 ; à partir de la phase 2, chacun peut choisir jeux ou négociations. Les machines à sous servent de risque économique secondaire, jamais de voie d'accès automatique au pouvoir. Aucun jeu en argent réel : jetons en jeu, sans conversion ni retrait.

## Fonctionnement du prototype (`casino/campaign-core.mjs`)

- État de campagne événementiel ; `applyCasinoCommand()` vérifie les permissions, l'avancée de phase et les préconditions. Les commandes munies d'un identifiant déjà traité sont idempotentes ; une collision divergente est refusée.
- `SETTLE_POKER` règle les gains de mains validées par le serveur, sans création de jetons et sans solde négatif ; `SETTLE_SLOT` enregistre une mise et un gain dont le tirage doit être établi **hors de ce module**, côté serveur avec une table de gains testée.
- Registre des engagements : proposition, signature de chaque partie, visibilité publique/confidentielle et rupture identifiable ; les droits territoriaux ne produisent pas de transfert automatique.
- Toute personne peut revendiquer la succession sans seuil de réputation. Une nomination par le Dragon exige qu'il possède toujours son autorité (arbitrée par l'histoire) ; elle ne garantit pas la maîtrise effective de la triade. Une seule branche dissidente est autorisée dans cette première version.
- Rapports d'infiltration privés pour 0 à 2 informateurs, dont au maximum un lorsque quatre personnes jouent au casino.
- Cinq décisions de l'Agent (2 en phase 1, 2 en phase 2, 1 en phase 3). La localisation immédiate de la salle exige cinq réponses exactes. L'aide tardive nécessite un événement d'autorisation serveur.
- Les arrestations ne sont pas un score : deux sources distinctes corroborées, une demande motivée de l'Enquêteur/Procureur, l'interpellation par l'Agent puis une mesure de détention distincte. Les détenus conservent trois catégories d'action (`cooperate`, `allies`, `appeal`).
- `casinoView()` construit une projection restreinte par camp : les participants au casino ne reçoivent ni le nombre d'infiltrés ni les rapports, les dossiers du bureau, les solutions d'énigmes ou les mandats. Les réputations des joueurs et des personnages non joueurs sont visibles.
- `replayCasinoCommands()` rejoue l'historique sur le même état initial pour vérifier une reconstruction exacte.

## Conditions avant toute connexion au jeu réel

1. **Sécurité serveur** : les commandes `actor:'system'` ne doivent **jamais** être acceptées depuis un client. L'identité de l'acteur est déterminée par la session authentifiée ; Supabase vérifie l'appartenance, la visibilité et les permissions pour chaque transition. Les projections client ne doivent jamais embarquer le canon secret ni la clé des énigmes.
2. **Persistance** : journal append-only, sauvegardes transactionnelles, révisions optimistes, restauration/reconnexion, sauvegarde entre chapitres, idempotence pour clics répétés, tests de conflits. Le prototype en mémoire **n'assure pas** cette garantie.
3. **Jeux** : règles de poker, validateur de mains, tours, délais, serveur de cartes, tirages de machine à sous, plafonds, économie et anti-triche restent à réaliser et auditer.
4. **Écriture privée** : les vérités, biographies confidentielles, énigmes résolues et dénouements doivent être dans un stockage privé inaccessible aux clients non autorisés. **Ce dépôt GitHub est public. Ne jamais y commettre ces manuscrits.**
5. **Équité de l'enquête** : le nombre de preuves n'est qu'un garde-fou du prototype ; un vrai contrôle juridique/narratif doit examiner qualité, indépendance et rapport avec l'infraction. Un juge/procureur humain est facultatif, l'arbitrage ne peut dépendre de l'auto-déclaration d'un suspect.
6. **Test de groupe** : 4 à 7 participants au casino, 0/1/2 informateurs, bureau séparé, agent ayant 5/5 ou non, déconnexions pendant le poker, accord simultané, interpellation refusée, joueurs détenus actifs, et toutes les variantes de fin.

## Vérification hors production

```bash
node scripts/casino-foundation-check.mjs
```

Ce contrôle cible les invariants de base, mais ne certifie ni la stabilité réseau ni la jouabilité réelle. Prochain jalon : moteur transactionnel sur serveur de test, suivi d'une interface privée de démonstration après validation éditoriale.
