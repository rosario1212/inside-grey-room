# CASINO v105 — relevé de validation du 18 octobre 2026

## Intégration

Branche de la PR #254 réconciliée avec `main`, y compris les verrous privés des PR #259 et #261 et les dernières affiches Cartel. Les anciennes PR ouvertes ont été inspectées ; elles ne sont pas fusionnées automatiquement. Le script d'ignorance de l'ancien hébergement annule ses builds automatiques.

Pendant cette tâche, la PR #263 a supprimé le code d'accès sur main. La branche Casino conserve le Worker privé et son contrôle CI, conformément à la demande de cette tâche. Le nouveau workflow de déploiement est conservé en lancement manuel et vérifie aussi l'accès privé pour éviter deux déploiements automatiques concurrents.

## Architecture

Le navigateur transmet son jeton personnel, une commande, une révision attendue et un UUID à `/api/casino`. Le Worker vérifie son accès privé et l'origine ; l'Edge Function vérifie indépendamment l'invitation et détermine l'acteur à partir du hash du jeton. Les tirages sont calculés côté serveur. Une transaction verrouille la salle, contrôle révision et idempotence, ajoute la commande au journal et remplace la sauvegarde avant de confirmer la décision.

Le schéma non exposé `igr_casino_private` contient les versions éditoriales, les sauvegardes et le journal append-only. RLS est activé et aucun droit n'est accordé à `anon` ou `authenticated`. Les RPC sont `SECURITY INVOKER`, réservés au rôle serveur. Les permissions narratives existantes restent inchangées. Le profil hôte peut être supprimé sans blocage par les nouvelles clés étrangères.

Les autres écrans récupèrent automatiquement leur propre projection ; les canons, cartes des adversaires, réponses et identités infiltrées ne sont pas diffusés. La sauvegarde initiale et le journal permettent une reconstruction exacte ; la commande de lancement conserve le canon privé immuable et ses tirages. Le client conserve seulement les identifiants de reprise.

Les modules `casino/*.mjs` ne sont pas copiés dans les distributions. Les clés privilégiées restent dans l'environnement de l'Edge Function.

## Fonctions exercées

- Progression 3/3/2, noms des participants dans les biographies et relations, 4–7 personnes au casino, trois fonctions d'enquête séparées et magistrats facultatifs.
- Poker fermé de cinq cartes : une donne collective obligatoire, échange de trois cartes maximum (deux à sept personnes), un tour de mise plafonné à 20, sans relance ou pots secondaires. Les autres mains sont facultatives. Les personnages sans jetons conservent leurs autres actions.
- Machine à sous avec banque virtuelle : mise 1–20 ; triple Dragon ×30, autre triple ×8, paire ×1, autre tirage ×0 ; aucun paiement ou retrait.
- Accords publics ou privés, signatures, ruptures et réputation ; soutiens et territoires ; offres PNJ consenties et scénarisées ; prétentions sans seuil, droits engageables, nomination contestable, déchéance et branches létales préalablement annoncées.
- Influence recalculée depuis les territoires et alliances actives ; légitimité depuis les soutiens, territoires et nomination reconnue. Ces scores ne créent aucun seuil pour déclarer une prétention. Leur équilibrage reste à éprouver en groupe.
- Pièces indépendantes, organigramme, demandes personnelles d'interpellation, exécution par l'Agent, défense et détention distinctes du jugement, procédure scénarisée sans magistrat.
- Contacts, coopération, alliés et contestations pour les détenus ; fonction de témoin après une mort ; corruption traçable sans effacement de pièces.

## Vérifié

- Fondation : 26+ invariants existants.
- Serveur : 15 groupes comportementaux, configurations 4–7 personnes au casino, 0–2 informateurs selon effectif, rôles facultatifs, huit phases, verdicts, offres PNJ, cloisonnement et reconstruction exacte du journal.
- Poker : les 2 598 960 combinaisons de cinq cartes correspondent aux dénombrements combinatoires indépendants.
- Supabase : migrations additives appliquées ; droits clients refusés ; révision périmée et doublon divergent refusés ; deux transactions concurrentes ne produisent qu'une sauvegarde. Les données de test sont supprimées ou annulées.
- Navigateur : sept sessions indépendantes, changements de salon et de phases sans actualisation, poker, reprise sur un autre contexte, retour réseau, conservation des saisies et absence de duplication après perte d'une réponse.
- Présentation : formats 390×844, 820×1180 et 1440×900 ; affiches existantes, aucun débordement horizontal.
- Régressions : 126 contrôles d'affichage existants et 18 contrôles de synchronisation existants réussis ; build web et contrôles de confidentialité réussis.
- Bundle complet : entrée, ouverture et fermeture du salon vérifiées avec tous les runtimes existants. Le relais historique `Storage.setItem` a été corrigé pour conserver la valeur des clés non redirigées ; session privée, profils et PWA sont couverts par un contrôle dédié.
- Éditorial privé : trois packs en brouillon, structure et 12 parcours locaux complets vérifiés (trois variantes × quatre effectifs). Aucun manuscrit privé n'est dans GitHub.

## Limites et blocage

Les tests des formats d'écran utilisent Chromium ; ils ne remplacent pas une partie sur iPhone/iPad physiques ni la vérification de Safari. Les tests multiécrans utilisent un service local autoritaire avec un stockage de test ; le stockage PostgreSQL est testé séparément. Le parcours navigateur → Worker privé → Edge Function → Supabase n'a pas encore été exécuté avec de vraies sessions de participants.

Les trois intrigues structurées sont des brouillons, avec des compléments éditoriaux à relire. Zéro version narrative est approuvée ou sélectionnable. Le service de sauvegarde est installé mais aucune salle CASINO de production n'est active.

La PR #254 reste en préparation. Aucune fusion Casino dans main ni mise en ligne Cloudflare de cette campagne n'est justifiée par ces seuls tests. L'URL Cloudflare existante renvoie désormais HTTP 200 pour la page et un asset sans code d'accès, après la PR #263 ; elle ne peut donc pas être présentée comme privée. Cette tâche n'a pas publié Casino sur cette URL.

## Reproduction

```sh
node scripts/casino-foundation-check.mjs
node scripts/casino-runtime-check.mjs
node scripts/casino-release-check.mjs dist
node scripts/casino-browser-check.mjs
```

`scripts/casino-storage-check.sql` vérifie le stockage dans une transaction intégralement annulée. Le test navigateur accepte `IGR_CHROMIUM_PATH` pour un binaire de test installé séparément.
