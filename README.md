# Inside Grey Room — V10.5 Stable Audio & Trames

Version prévue pour test sur Vercel.

Audio
- correction du passage où deux notes se coupaient : la contre-ligne irrégulière a été remplacée par des doublures d'octave parfaitement calées ;
- durée des notes principales raccourcie juste assez pour empêcher les amas dissonants tout en gardant les notes très fortes ;
- toutes les voix utilisent maintenant la même horloge WebAudio ;
- scheduler à anticipation (~550 ms) au lieu d'un redémarrage de boucle au setInterval : beaucoup plus stable sur iPhone et sorties Bluetooth ;
- les sources audio sont suivies et arrêtées proprement lorsqu'une vraie relance est nécessaire, évitant les doublons cachés ;
- changement de sortie audio/Bluetooth : la bande-son continue sans redémarrage volontaire.

Trames
- le son de trame se joue au moment où la trame est réellement ajoutée au fil, pas pendant sa simple préparation ;
- court abaissement automatique de la musique pendant l'alerte pour qu'aucune note ne se heurte au stinger ;
- stinger de trame plus clair, fort et harmonisé avec le scénario ;
- trames visuellement différenciées dans le fil sans alourdir l'interface.

Vercel
- vercel.json inclus pour un déploiement statique simple.
