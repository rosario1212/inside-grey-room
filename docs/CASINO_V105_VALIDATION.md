# CASINO v105.1 — validation du 18 octobre 2026

## Intégration

CASINO rejoint Cendres, Kuroi et Maître dans HÉRITAGE. Ses trois scénarios se jouent dans une même partie de huit phases (3/3/2). Le catalogue permet de jouer ou de reprendre la campagne ; après le dénouement, une nouvelle partie est possible. Les quatre affiches Casino approuvées sont conservées. Les dernières corrections de main, dont les affiches Cartel des PR #265/#267/#269 et les verrous narratifs des PR #259/#261, sont intégrées.

L’utilisateur a demandé l’intégration des trois packs privés le 18 octobre 2026, après livraison de leur dossier de relecture. Ils sont approuvés et sélectionnables dans `igr_casino_private`. Leur contenu reste absent du dépôt public. Cette approbation ne concerne aucun canon privé des autres campagnes, notamment les variantes 028 toujours soumises à leurs propres verrous.

Le site reste accessible sans code, conformément à la consigne récente de l’utilisateur et aux PR #263/#264. Les parties nécessitent leurs propres invitations et clés personnelles. Un seul workflow publie automatiquement sur Cloudflare ; l’ancien workflow avec entretien TURN reste manuel. Aucun déploiement sur Vercel.

## Sauvegarde et confidentialité

Le client envoie une commande, sa clé personnelle, un UUID et la révision attendue. L’Edge Function détermine l’acteur depuis le hash de cette clé, vérifie ses autorisations et calcule les tirages. Une transaction verrouille la salle, contrôle révision et idempotence, ajoute la commande au journal puis remplace la sauvegarde avant confirmation.

Le schéma privé conserve les versions narratives immuables, les salles, leur état initial et leur journal. Les RPC `SECURITY INVOKER` sont réservés au rôle serveur. RLS et révocation des droits clients protègent les trois tables. Les droits narratifs existants ne sont pas élargis. La clé privilégiée reste dans l’environnement du serveur.

Les autres écrans récupèrent leur projection toutes les 1,2 seconde et au retour réseau ou premier plan. Aucun canon, secret adverse, réponse d’énigme ou nombre d’infiltrés n’est diffusé. Les cartes de poker restent privées jusqu’à l’abattage. Le canon tiré au lancement reste fixé durant les trois chapitres et dans le journal de reprise.

Le stockage du navigateur conserve uniquement les identifiants de reprise. Même la première création ou arrivée peut être reprise après perte de sa réponse et fermeture du navigateur. Une réponse incertaine conserve le même UUID de commande pour la nouvelle tentative. La clé personnelle permet de reprendre sur un autre appareil ; il faut la conserver avant de changer de table.

## Vérifications

- Build web et mobile ; contrôles des campagnes et DLC existants ; absence de modules serveur, manuscrits et références à une clé privilégiée dans les distributions.
- Fondation : 26+ invariants. Serveur : 15 groupes comportementaux, 4–7 personnages du casino, magistrats facultatifs, 0–2 infiltrés selon l’effectif, PNJ, corruption, prison, succession et reconstruction exacte du journal.
- Poker : les 2 598 960 combinaisons possibles correspondent au dénombrement indépendant des catégories. Jetons exclusivement virtuels.
- Douze parcours locaux des vrais packs privés : trois variantes × quatre effectifs, jusqu’au verdict, avec défenses des joueurs et PNJ.
- PostgreSQL réel : accès directs clients interdits, idempotence, refus d’une ancienne révision, verrouillage concurrent et journal cohérent. Fixtures isolées et nettoyées.
- Onze groupes navigateur : sept sessions, poker, phases, changement d’appareil, retour réseau, saisie conservée, réponse perdue sans duplication, création/arrivée interrompues et nouvelle partie après finale. Le parcours Accueil → Rejoindre permet aux invités sans licence de rejoindre CASINO ; seule la création vérifie la licence de l’hôte.
- Affichage : 390×844, 820×1180 et 1440×900, quatre compositions préservées sans débordement ; 126 contrôles d’affichage existants et 18 de synchronisation existants.
- Accès web public, contrôle des origines, authentification personnelle du service et limites de corps JSON, y compris sans Content-Length.
- Parcours navigateur → Worker exécuté localement → Edge déployée → Supabase : salon réel à sept sessions, distribution privée, poker, reprise sur autre navigateur, accord signé, jetons et refus des doublons vérifiés. Parcours complet jusqu’au verdict : interpellation par l’Agent, audition, défense, détention et dénouement affichés sur les sept écrans ; 48 révisions et 48 écritures de journal.

## Limites

Les contrôles navigateur utilisent Chromium aux formats téléphone, tablette et ordinateur. Safari et les iPhone/iPad physiques restent à vérifier, ainsi que l’équilibrage narratif lors d’une véritable partie de groupe. Les tests techniques ne certifient pas la difficulté des énigmes ni toutes les interprétations orales d’un accord.

Le lien de production, le commit servi et le résultat du contrôle après déploiement sont consignés dans la PR #254. `scripts/casino-deployment-check.mjs` vérifie le catalogue jouable, les quatre images, le service authentifié et le commit du bundle effectivement servi.
