# Le Régime — portage propre sur main (15 novembre 2026)

**STATUT : candidat de publication, non déployé et non activé.** Cette branche part de `dfc2ca0f083e3fe99f276d1d04332cdedf1f59b7` et reprend uniquement la refonte 032–034, plutôt que remplacer des fichiers récents de TERREUR, OMERTÀ, CARTEL, du réseau et du service worker par les anciens fichiers d'une PR en conflit.

## Épuré
- Six rôles : Enquêteur, Analyste, Juge, trois Suspects ; Procureur facultatif à sept. Ni Inspecteur, Expert ni Avocat imposé.
- Tribunal collectif sans seconde audience de défense, avec Juge strictement procédural et majorité collective du camp Enquête pour les responsabilités.
- Une seule documentation de sortie v14, pas les brouillons successifs de conception.

## Contenu candidat
9 manuscrits privés A/B/C sont en base privée **draft** ; cette branche reprend le client de traque/procès, les huit fichiers SQL candidats et les tests transactionnels v13/v14. Le client doit afficher l'interface uniquement avec `regime_v13_active===true`. Aucune fonction SQL candidate n'est appliquée à la base de production.

## Verrous avant publication
1. Rebaser les huit fonctions historiques du patch sur les RPC v706–v711 actuellement en production, en conservant la majorité collective et l'absence de veto du Juge.
2. Valider humainement et approuver les neuf manuscrits, vérifier les preuves C3 et les conséquences de chaque action ; ne pas forcer `enabled=true`.
3. Faire tourner CI finale et parties réelles à six/sept joueurs, 0/1/2 captures, reconnexion, votes et tribunal sur plusieurs appareils.
4. Appliquer les migrations après revue, déployer Cloudflare, vérifier les deux côtés et le journal des événements.

**GitHub n'équivaut pas à une publication de gameplay tant que le client, la base et la validation ne sont pas effectifs.**
