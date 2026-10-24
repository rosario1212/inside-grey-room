# Dossier 012 — FIDÈLES · contrat de qualité et de publication

## État confirmé au 24 octobre 2026
- Capacité serveur : exactement **5 joueurs** (1 Enquêteur, 1 Analyste, 3 Suspects).
- Trois manuscrits narratifs privés A/B/C existants, chacun avec 3 fiches suspects et 4 révélations de base.
- Les trois manuscrits sont au statut **review** ; aucun n'est approuvé pour publication comme variante runtime.
- Test SQL dans une transaction annulée : un salon 012 se lance avec la répartition attendue, mais utilise encore le pack public fixe, sans sélection de variante privée par salon. **Cette simulation n'est pas une preuve de rejouabilité.**
- Aucun salon réel 012 n'était actif à l'inspection.
- Les systèmes 001–011 doivent rester inchangés.

## Exigences narratives
- Chaque variante doit changer réellement la responsabilité du chef, les actes du responsable et la réaction du proche.
- Maintenir les invariants publics : Sacha Morel tente de quitter la communauté ; son téléphone est pris, il est frappé, retenu environ 20 heures et finit par s'échapper.
- Les preuves doivent permettre de distinguer **la consigne initiale, la décision de violence et la réaction après signalement**.
- Distribuer trois documents de preuve **inconditionnels** (un par cycle), et neuf recherches facultatives (trois par cycle) avec fragments complémentaires et recoupements.
- Ne jamais rendre la variante ou la solution accessibles aux suspects ou au client avant la révélation.
- Pas d'Avocat dans ce dossier. Les seuls rôles sont Enquêteur, Analyste et trois Suspects.
- Les suspects ne doivent pas obtenir d'actions réservées au camp Enquête ; une enquête facultative est collective par cycle et doit être dédupliquée côté serveur.

## Critères de publication technique
1. Migrer le pack manuscrit privé vers un générateur de fiches et de preuves, sans publier les manuscrits dans GitHub.
2. Épingler au démarrage une variante A/B/C aléatoire au salon, persistante et identique sur toute la partie.
3. Implémenter les lecteurs du pack épinglé pour toutes les fonctions de cartes, synchronisation, preuves et révélation.
4. Construire un formulaire de verdict à trois axes avec validation serveur stricte et correction basée sur la vérité privée du salon.
5. Tester les trois variantes : role counts, 3 cycles, trames garanties, quotas d'enquête, confidentialité des jetons et événements, erreurs de verdict, scoring correct et faux.
6. Geler toute publication tant que les 3 variantes ne sont pas prêtes, validées et techniquement sécurisées.
7. CI web/PWA/iOS/Android et déploiement Cloudflare vérifiés sur le commit exact de main.
8. Tous les salons de QA sont exécutés avec BEGIN/ROLLBACK. Aucun utilisateur ou salon existant ne doit être effacé pour la préparation.

**État au 24/10/2026 : intégration complète et validée en QA transactionnelle ; publication conditionnée à la fusion vérifiée et à l'approbation éditoriale en production.**

## Vérifications automatiques réussies le 24 octobre 2026
- 10 salons fictifs à cinq joueurs, trois variantes A/B/C observées ; cinq fiches privées, trois documents et neuf investigations par variante.
- Trois cycles simulés : 1 trame par cycle, 3 choix par cycle pour le camp Enquête, 0 pour les Suspects ; accès par jeton et rôle, rejet du doublon.
- Audience finale : deux verdicts exacts donnent une reconstruction de camp complète ; verdict mal formé refusé ; mauvais verdict de l'Analyste détecté et pénalisé.
- Aucune donnée ou partie de QA conservée : tests dans BEGIN/ROLLBACK.
- Sept points d'intégration de pack vérifiés côté serveur et restrictions d'exécution `anon`/`authenticated` des fonctions privées maintenues.
- Cinq contrôles GitHub (Cloudflare, Android, iOS, Store, Layout) réussis sur le commit de branche avant le dernier changement documentaire.
- Pas de véritable partie humaine certifiée ; `human_playtest_verified=false`.
