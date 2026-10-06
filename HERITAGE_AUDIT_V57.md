# HÉRITAGE — audit complet v57

## Verdict général

CENDRES et KUROI utilisaient déjà la bonne grammaire d’espace du mode HÉRITAGE. MAÎTRE avait accumulé plusieurs couches CSS contradictoires : thème sombre initial, thème papier, correctifs d’affiches 9:16, correctifs mobiles et couche multijoueur v55. Le résultat pouvait changer de dimensions et de couleur selon l’écran.

## MAÎTRE — problèmes corrigés

- Les cartes de dossiers utilisaient 68×96 px sur certains écrans, 58×82 px sur mobile et 58×86 px dans CENDRES/KUROI. MAÎTRE utilise maintenant la référence commune 58×86 px.
- La grille de dossier montait jusqu’à 390 px pour l’affiche alors que CENDRES/KUROI utilisent 340 px. MAÎTRE reprend maintenant 220–340 px + contenu.
- L’affiche mobile était forcée en 9:16 et pouvait occuper presque toute la hauteur de l’écran. Elle reprend maintenant le cadre mobile HÉRITAGE de 220 px.
- Le hero de campagne alternait entre ratio 16:10, 258 px, 238 px et 150 px selon les couches. Il est maintenant 210 px bureau, 180 px mobile et 158 px petit écran, comme le système CENDRES/KUROI.
- La carte MAÎTRE du hub était plus petite que les deux autres campagnes. Elle reprend maintenant 480 / 420 / 390 px selon les breakpoints HÉRITAGE.
- Le lobby en ligne était sombre à l’intérieur d’une page papier claire. Les cartes v55 pouvaient également repasser en anthracite. Toute l’interface MAÎTRE est maintenant cohérente en papier ivoire avec accent bordeaux et texte sombre.
- Les écrans rôle, session, jugement, résultat, Angle/Démonstration et Dossier vivant utilisent désormais la même palette.
- Les textes longs et rôles ne doivent plus provoquer de débordement horizontal.

## CENDRES — problème de compréhension

Le contenu demandait au joueur de connaître VESPER, CERBÈRES, ORPHÉE et ARKEN sans définition suffisante. Ces noms donnaient une impression de lore à mémoriser au lieu de faire raisonner sur les faits.

v57 retire ces appellations de tout le runtime HÉRITAGE actif et les remplace par des réalités fonctionnelles :
- service national de renseignement ;
- réseau hostile ;
- identité de couverture ;
- centre logistique gouvernemental ;
- convoi classifié ;
- compte rendu falsifié ;
- responsable des habilitations ;
- État voisin ;
- ancienne galerie hydroélectrique / base aérienne / dépôt de démantèlement.

CENDRES affiche aussi désormais un Cadre de la campagne qui explique immédiatement qui sont les joueurs et ce qu’ils cherchent.

Les IDs historiques invisibles (kern, nadir, etc.) sont conservés uniquement pour ne pas casser les sauvegardes existantes ; ils ne sont plus présentés au joueur.

## KUROI

KUROI sert de référence avec CENDRES pour les dimensions HÉRITAGE. Aucun changement de fond n’était nécessaire dans cette passe : ses cartes, affiches, grille de campagne et palette restent cohérentes.