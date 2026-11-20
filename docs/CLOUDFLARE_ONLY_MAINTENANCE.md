# Inside Grey Room — maintenance Cloudflare uniquement

## Unique production

- Worker de production : **`inside-grey-room-last`**.
- Configuration : `wrangler.jsonc`.
- Pipeline de publication : `.github/workflows/cloudflare-production-deploy.yml`.
- Branche de publication : `main`.
- Pipeline manuel distinct pour l'identité TURN : `.github/workflows/cloudflare-turn-maintenance.yml`. Il **ne redéploie pas le site**.
- Source de données et règles serveur : Supabase. Ne jamais supprimer les migrations, les snapshots de salles ni les outils de vérification tant que leur usage n'a pas été évalué.

Le pipeline de production doit vérifier le nom et le script du Worker, compiler le jeu, lancer les tests de sécurité, publier via la configuration explicite et vérifier le commit réellement servi.

## Déploiements historiques externes encore à déconnecter

Certaines **vérifications GitHub sont émises par des intégrations de déploiement externes** ; ce ne sont pas des workflows contenus dans ce dépôt. Modifier ou supprimer un fichier YAML ici ne peut pas les supprimer.

Dans le compte Cloudflare qui gère le dépôt :

1. Ouvrir **Workers & Pages / Workers Builds**.
2. Pour les anciens projets `inside-grey-room`, `inside-grey-room-v24` et `inside-grey-room-final`, **désactiver la connexion GitHub et les builds automatiques**. Vérifier d'abord qu'aucune route, domaine ni liaison d'application active n'en dépend.
3. **Conserver** `inside-grey-room-last`, ses secrets, ses routes et ses logs.
4. Dans les règles GitHub de protection de `main`, ne plus exiger d'anciens contrôles `Workers Builds` après leur déconnexion. Conserver les tests pertinents et le statut **Cloudflare Production**.
5. Ne supprimer un ancien Worker qu'après examen explicite de son trafic, de ses routes et de ses bindings. Le simple fait qu'un build échoue ne prouve pas que le Worker soit inutilisé.

Les anciens statuts `Vercel – inside-grey-room` et `Vercel – inside-grey-room-v2` peuvent aussi provenir de projets rattachés à un autre espace Vercel. Le compte Vercel actuellement connecté ne permet pas de les retrouver : aucune déconnexion ni suppression de projet Vercel n'est attestée. Le dépôt conserve donc **uniquement la protection** `vercel.json` + `scripts/vercel-ignore.mjs`, qui fait ignorer les anciens builds automatiques (code de sortie 0), pour éviter une résurrection involontaire des previews.

Pour retirer définitivement cette protection, déconnecter au préalable les projets Vercel du dépôt GitHub dans **l'espace Vercel qui les possède effectivement**, puis vérifier qu'aucun nouveau statut ni build n'est déclenché.

## Ce que le nettoyage du dépôt a supprimé ou clarifié

- Un **unique workflow de déploiement** avec configuration explicite, contrôles et vérification du commit publié.
- La procédure manuelle de configuration TURN n'a plus de commande de redéploiement du site.
- Les déclencheurs redondants du workflow de build ont été dédupliqués et les versions des actions harmonisées avec les workflows actifs.
- Le fichier `vercel.json` n'a plus de configuration de site Vercel ; il ne sert qu'à empêcher la republication par les anciennes connexions.
- Les anciens audits et migrations restent conservés : leurs noms versionnés ne sont pas une preuve qu'ils sont inutiles.

## Contrôle après chaque nettoyage

- Les tests de la PR doivent réussir.
- Le workflow `Cloudflare Production Deploy` doit être vert sur le commit fusionné.
- Le statut `Cloudflare Production` doit être `success`.
- Les URL et les salons existants doivent continuer à fonctionner ; les salles épinglées à une version antérieure ne doivent pas être forcées sur une nouvelle vérité.
- Ne pas considérer une simple compilation ou une PR fusionnée comme preuve que Cloudflare a publié le bon commit.
