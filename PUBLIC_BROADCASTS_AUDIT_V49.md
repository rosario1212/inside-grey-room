# Inside Grey Room — Audit publications publiques v49

## Verdict

**PASS backend / intégration** sur la diffusion publique testée le 5 octobre 2026.

## Breaking News

- Une Breaking News est désormais insérée explicitement avec `visibility = public`.
- Elle est donc visible par **tous les rôles**, y compris les Suspects, l’Avocat, le Journaliste et les rôles spécialisés.
- Le contenu reste canonique : le Journaliste choisit une publication prévue dans le scénario et ne peut pas fabriquer une preuve officielle.
- Le quota existant reste inchangé : une publication par cycle, trois maximum par partie.

## Expertise publique

Après avoir effectué une analyse prévue par le scénario, l’Expert peut choisir **Présenter publiquement**.

- Seule une analyse réellement accomplie peut être publiée.
- Le texte publié provient exclusivement du résultat canonique du scénario.
- L’Expert ne peut pas réécrire le résultat avant publication.
- Une même analyse ne peut être publiée qu’une fois.
- La publication est irréversible.
- L’événement créé est `expert_public` avec `visibility = public`.
- L’analyse technique d’origine reste distincte : rendre un résultat public n’altère pas la vérité canonique et ne crée aucune nouvelle preuve.

## Affichage

Les événements `breaking_news` et `expert_public` constituent les **publications publiques**.

- Le dernier événement public est affiché dans un cartouche commun pendant la partie avec la mention **PUBLIC · VISIBLE PAR TOUS**.
- Tous les rôles reçoivent le même titre, le même contenu et le même auteur.
- Les publications restent disponibles dans les surfaces d’historique du jeu.

### Suspects

Les publications publiques sont ajoutées à l’onglet **Chronologie** sous **PUBLICATIONS COMMUNES**. Elles sont séparées de la chronologie privée et de la « version à tenir » afin qu’un fait rendu public ne soit jamais confondu avec un secret de rôle.

### Camp Enquête

Les Breaking News et expertises publiques apparaissent dans **Éléments d’enquête**, au même titre que les autres éléments révélés. Le camp Enquête conserve donc un dossier commun de ce qui a été officiellement rendu public.

### Autres rôles

L’Avocat, le Journaliste et les rôles hors du camp Enquête voient le cartouche public et conservent également l’événement dans leur flux général lorsqu’il est disponible.

## Test backend

Test transactionnel exécuté sur un dossier 020 temporaire avec ROLLBACK :

- analyse Expert créée depuis une action canonique ;
- état v49 retourne l’analyse comme non publiée ;
- publication Expert réussie ;
- événement `expert_public` explicitement public ;
- visibilité vérifiée depuis un joueur Suspect ;
- seconde publication de la même analyse refusée ;
- Breaking News publiée avec visibilité explicitement publique ;
- visibilité Breaking News vérifiée depuis le Suspect.

Résultat : `v49_public_broadcast_tests_ok`.

## Sécurité

Les RPC Expert utilisent `room_code + player_token`, vérifient le rôle `expert` côté serveur et ne publient que les résultats présents dans le pack canonique du scénario. Aucun texte libre n’est accepté par l’API de publication Expert.
