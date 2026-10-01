# Inside Grey Room — UI fixes v13.2

## 1. Retour lobby → scénarios

Sur l’écran de cellule où les joueurs choisissent leur rôle, l’action supérieure `Quitter` est remplacée par `← Scénarios`.

Comportement attendu :

- fermer les watchers/flux de la cellule locale ;
- effacer la session locale de cette cellule ;
- revenir à la liste de création ;
- conserver `STATE.selectedScenario` sur le dossier qui était ouvert ;
- restaurer `STATE.createListScrollY` ;
- sinon centrer `#scenario-XXX` dans le viewport.

Aucun retour à l’accueil ne doit être visible entre les deux écrans.

## 2. Palette des rôles 001–020

Les scénarios 001–020 appartiennent à la palette standard Grey Room.

Quand un rôle est sélectionné :

- fond gris anthracite légèrement relevé ;
- bordure claire ;
- libellé `TON RÔLE / CHOISI` clair ;
- pas de rouge ;
- pas de glow ;
- pas d’animation de vibration/pulsation ;
- pas de transformation de la carte.

Le correctif retire aussi toute classe de thème DLC restée accidentellement active lorsqu’un lobby 001–020 est rendu.

## 3. Non-régression DLC

- OMERTÀ 021–025 : rouge conservé.
- TERREUR 026–028 : identité propre conservée.
- CARTEL 029–031 : identité propre conservée.
- LE RÉGIME 032–034 : identité propre conservée.

Le tirage aléatoire reste animé ; seule la carte **déjà sélectionnée** des scénarios 001–020 est rendue statique et neutre.
