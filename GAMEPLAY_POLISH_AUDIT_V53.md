# Inside Grey Room — Gameplay / UI polish v53 + alignement Témoins v54

## Scope appliqué

- **Alignement Témoins v54 :** dans le jeu de base, le rôle reste limité aux dossiers 017 et 020. Le dossier DLC 029 n'a plus de Témoin et utilise un second Avocat à 8 joueurs. Les dossiers 031–034 reçoivent chacun un Témoin écrit, limité à des faits observés et incapable de résoudre seul l'affaire.
- L'Analyste reçoit une synthèse privée locale : hypothèse actuelle, contradiction majeure, personne à réentendre.
- Les Éléments d'enquête gardent les quatre éléments les plus récents ouverts ; l'historique antérieur devient repliable.
- Les dossiers denses reçoivent une vue synthèse Enquêteur et une densité visuelle réduite, sans retirer d'action.
- Le Cabinet du Juge conserve exactement ses pouvoirs ; la liste des joueurs libres devient repliable et les saisines restent visuellement prioritaires.
- Les rôles publics reçoivent une petite signature visuelle monochrome, sans sortir de l'identité noir/gris.
- Les rafraîchissements basse fréquence de v44/v47/v49/v50/v51 partagent un ordonnanceur v53 lorsqu'il est disponible, avec prévention des exécutions concurrentes et pause en arrière-plan.
- Les cartes de sélection des DLC 021–034 et les listes HÉRITAGE utilisent des miniatures vectorielles légères sans requête d’image supplémentaire. Les affiches pleine définition restent utilisées dans les vues dossier.

## HÉRITAGE 035–044

Les IDs 035–044 sont les dix chapitres canoniques du mode HÉRITAGE, et non dix scénarios classiques manquants :

- CENDRES = 035–039
- KUROI = 040–044

La v53 rend cette correspondance explicite côté métadonnées et interface, tout en laissant ces dossiers dans leur surface HÉRITAGE premium/campagne. Ils ne sont pas dupliqués dans la liste standard 001–034.

## Non-objectifs

- aucun changement de l'échelle de responsabilité ;
- aucun changement des chronomètres ;
- aucun nouveau pouvoir de rôle ;
- aucun Témoin ajouté artificiellement aux scénarios qui n'en ont pas besoin ;
- aucun changement de vérité canonique d'un scénario.
