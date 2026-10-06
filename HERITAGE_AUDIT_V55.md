# HÉRITAGE — audit v55

## Verdict

HÉRITAGE était techniquement jouable, mais pas encore homogène en multijoueur. CENDRES/KUROI réutilisaient l'écran local puis le corrigeaient après rendu, tandis que MAÎTRE utilisait une seconde implémentation en ligne. MAÎTRE était le point le plus encombré visuellement et contenait deux incohérences de règles importantes.

## Problèmes corrigés

### P0 — cohérence MAÎTRE
- En local, le premier joueur est l'Avocat principal, mais en ligne l'Avocat était attribué aléatoirement. La campagne persistante pouvait donc appartenir à un hôte jouant un autre rôle. v55 fixe l'hôte comme Avocat en ligne.
- L'écran disait « LE JUGE VERROUILLE », mais le backend/UI donnaient le verrouillage à l'hôte. v55 ajoute une décision autorisée par le jeton du joueur Juge, avec fallback hôte seulement si aucun Juge n'existe.

### P1 — lisibilité multijoueur
- Les écrans en ligne ne rappelaient pas assez clairement le rôle et l'objectif immédiat du joueur.
- Après la lecture initiale, un joueur ne pouvait pas facilement rouvrir sa propre carte privée.
- MAÎTRE n'affichait pas de roster compact pendant les cycles.
- Les écrans locaux réutilisés en ligne conservaient une grammaire « téléphone partagé ».

v55 ajoute un bandeau personnel, « À faire maintenant », une carte privée repliable et un roster repliable sur tous les écrans HÉRITAGE en ligne.

### P1 — densité de la campagne MAÎTRE
Le hub MAÎTRE empilait dossiers, dossier vivant, réputation, traces, liens puis gestion. v55 conserve toutes ces informations mais replie Traces/Liens/Réputation dans un unique « Dossier vivant ». Les dossiers restent l'action principale.

### P2 — cohérence mobile
- Navigation de cycle et boutons importants sont désormais regroupés en bas dans une barre lisible et safe-area.
- Sur mobile, les panneaux secondaires CENDRES/KUROI sont repliés dans « Héritage actif ».
- Les gros titres, cartes de phase et options de jugement sont resserrés sans enlever d'information.

## Non-objectifs

- Aucun scénario, vérité canonique, outcome ou progression de campagne n'est réécrit.
- Aucune mécanique Angle/Démonstration n'est supprimée.
- Le mode local à un téléphone reste disponible.
- CENDRES et KUROI gardent quatre phases ; MAÎTRE garde trois cycles.
