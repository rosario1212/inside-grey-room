# Porte + audio — v13.3

## Problèmes visuels corrigés

Sur iPhone/PWA, la composition précédente utilisait un CTA remonté par les règles v11.23 et une image de porte dont le contenu textuel est déjà intégré à l’image. Le patch agit donc uniquement sur le cadrage :

- visuel de la Porte légèrement remonté ;
- zone d’image légèrement plus haute ;
- bouton ENTRER rapproché du bas tout en respectant la safe area ;
- cible tactile conservée au-dessus de 44 px ;
- règles spécifiques aux écrans courts pour éviter tout débordement.

## Audio

Le code historique déclenche le réveil WebAudio à plusieurs endroits autour du même geste d’entrée. Sur iOS, des tentatives concurrentes peuvent produire un état transitoire où le contexte est réveillé mais l’ambiance n’est pas réancrée correctement.

`startup-stability-v13-3.js` :

- sérialise `wakeAudioFromGesture()` : un seul réveil à la fois ;
- garde le geste utilisateur comme source d’autorisation iOS ;
- effectue une récupération immédiate si le premier réveil échoue ;
- relance `ensureAmbient()` après la fin réelle de la cinématique ;
- vérifie aussi au `pageshow`, `focus` et retour visible ;
- n’ajoute aucun nouvel `setInterval`.

Il ne remplace ni la musique ni le scheduler actuel et ne modifie pas les réglages sonores du joueur.
