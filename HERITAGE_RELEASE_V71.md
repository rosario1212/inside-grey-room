# HÉRITAGE — release gameplay v71

## But
Fermer les incohérences structurelles de CENDRES, KUROI et MAÎTRE sans ajouter une quatrième campagne ni modifier les scénarios 001–034.

## Règles verrouillées

### MAÎTRE
- L’Avocat principal reste le premier joueur/hôte.
- Les rôles nécessaires sont déterministes par dossier et nombre de joueurs ; seule leur attribution aux autres joueurs est mélangée.
- Au dossier III, une table de 5 joueurs fonctionne sans Procureur dédié : l’Enquêteur porte alors les objections factuelles.
- Les cartes privées local et online utilisent la même fonction de contenu.
- L’ANGLE est obligatoire avant de quitter le Cycle II. La DÉMONSTRATION reste optionnelle.
- Autorité de conclusion : I Juge ; II Client ; III Avocat ; IV Juge ; V Avocat.
- Les conclusions antérieures publiques viennent du campaign_carry de l’hôte. Le variant canonique caché n’est jamais publié dans ce carry.
- Un replay ne réécrit pas la campagne principale.

### KUROI
- La composition des rôles local et online est identique à 5, 6 et 7 joueurs.
- Dossier III : la question porte sur ce que Kurokawa fait du registre, conformément aux choix.
- Dossier V : les trois fins sont qualitatives ; aucune n’est présentée comme vérité correcte/partielle/fausse.
- L’arbre de personnes et les dettes évoluent effectivement : acteurs persistants, dette Mori/Ren, statuts payée/rompue/due selon la suite.

### CENDRES
- Les anciens labels K-9/VENN sont retirés du runtime actif.
- La carte compte des pistes plutôt que de prétendre compter des identités.
- La crise a un effet mécanique : à partir du niveau CRISE, certaines annexes de rôles absents arrivent plus tard ; au niveau ALERTE/POINT DE RUPTURE elles restent en validation jusqu’à la synthèse finale. Elles ne sont jamais supprimées définitivement.

### Multijoueur
- L’hôte publie uniquement un état de campagne public et assaini.
- Les invités utilisent ce campaign_carry au lieu de l’état HÉRITAGE éventuellement présent sur leur propre téléphone.
- Les nouveaux RPC v71 sont additifs pour ne pas casser la version publique antérieure.

## Validation
Le gate `scripts/v71-heritage-release-check.mjs` vérifie syntaxe, carry, rôles, Angle, autorité, KUROI qualitatif, crise CENDRES et présence de la migration serveur.
