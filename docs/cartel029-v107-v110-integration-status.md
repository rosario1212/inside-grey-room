# CARTEL 029 — état d'intégration v107–v110 (19 octobre 2026)

**À ne pas confondre : code préparé et scénario intégralement jouable.**

## Livré techniquement
- Un Dossier commun affichant les trois questions d'enquête uniquement lorsqu'une partie du nouveau moteur 029 est réellement validée.
- Rapport confidentiel partagé entre enquêteur et analyste (brouillon sauvegardé côté serveur, remise seulement par enquêteur au cycle 3).
- Trois communications publiques exactes retenues par l'auteur : M01, M05 et M08, avec cycle et provenance, sans simuler automatiquement la mort d'une personne.
- Une table éditoriale **privée** pour 3 branches A/B/C × 5 profils V1–V5 et leur contenu (les détails n'apparaissent pas dans les assets publics).
- Des fiches d'auteurs T1–T4 et treize messages conditionnels conservés dans le stockage privé.
- Une composition serveur future de 6 à 11 participants et quatre interrogatoires au premier cycle, **activée uniquement si** quinze combinaisons et trois manuscrits A/B/C sont approuvés ET si le commutateur privé a été explicitement validé par des tests de bout en bout.

## Pourquoi ne pas activer aujourd'hui
Le moteur historique de 029 a toujours 3 suspects avec des fiches de criminels ; la version narrative à quatre témoins serait contradictoire si un simple renommage était déployé. Tant que l'identité publique des quatre témoins, les actions des rôles optionnels Don/bras droit, le verdict à responsabilités de la branche choisie, les preuves conditionnelles et la synchronisation sur 6 à 11 appareils ne sont pas validés, **le commutateur doit rester désactivé**.

Les anciennes parties du 029 utilisent par conséquent leurs règles existantes (5 à 8 participants, trois suspects) ; la nouvelle mission et les nouvelles menaces ne se superposent pas à une ancienne partie, évitant un scénario trompeur.

## Critères de sortie restants
1. Mettre à jour intégralement le casting, le lobby, la sélection de cible et les badges publics du témoin 1–4. Le rôle technique « suspect » ne doit jamais être montré au joueur du nouveau 029 s'il joue un témoin.
2. Fournir une fiche courte par témoin et ses renseignements dépliables pendant l'interrogatoire, en interdisant les fuites de profil.
3. Faire jouer quatre auditions de six minutes obligatoires au cycle 1, puis respecter les limites des cycles 2–3 sans blocage.
4. Brancher les treize messages sur des conditions déterministes vérifiables et des informations autorisées ; aucun moteur n'infère arbitrairement les paroles des joueurs.
5. Rendre les preuves P01–P16 accessibles au bon moment et au bon rôle, avec des recoupements tiers suffisants même si un témoin ment.
6. Distinguer le Don, son bras droit et le quatrième témoin V5 ; ne pas substituer des commandes d'avocat aux ordres du cartel.
7. Vérifier les résultats de chaque combinaison A/B/C × V1–V5 dans le rapport et la fin de partie.
8. Tester les changements de rôle, reprises de partie, notification par cycle, accès non autorisé, synchronisation mobile/ordinateur et interruptions.
9. Compléter l'approbation éditoriale des branches A/B/C (actuellement *review*), puis autoriser explicitement les quinze combinaisons. Ne pas outrepasser les barrières de sécurité.

**Le code de cette PR ne contient pas les vérités privées du manuscrit.** La présence d'un test de build vert ne vaut pas test de jouabilité multi-appareils.
