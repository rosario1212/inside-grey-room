# Inside Grey Room — V10.9 Perfect

Version GitHub / Vercel prête à publier.

## V10.9
- nouvelle porte réaliste, sombre et métallique, fidèle à l’ADN Inside Grey Room ;
- la lumière blanche reste confinée à l’ouverture de la porte ;
- véritable séquence sonore de verrou / grincement / ouverture / impact ;
- correction du silence au redémarrage de la PWA iPhone ;
- au lancement, la porte constitue volontairement le geste iOS qui autorise l’audio ;
- si iOS suspend l’audio au retour dans l’app, la porte revient une fois pour le réactiver ;
- aucun watchdog ne peut désormais réafficher la porte en boucle ;
- reconstruction automatique du moteur WebAudio si le contexte Safari/iOS est devenu inutilisable ;
- musique V10.6/V10.8 conservée (mix, timing, Bluetooth, trames, lobby live).

## À envoyer sur GitHub
À la racine : index.html, app-v10-9.js, styles-v10-9.css, manifest-v10-9.json, vercel.json, README.md.
Dans le dossier assets existant : ajouter intro-v10-9.png.
