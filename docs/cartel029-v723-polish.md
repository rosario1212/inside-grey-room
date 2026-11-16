# CARTEL 029 — Los Salcedo · correctifs v722/v723 (16.11.2026)

## Problèmes réellement identifiés

1. **Salle de 10–11 joueurs bloquée pour le tirage aléatoire** : l'API `igr_v4_choose_random_role` n'offrait pas `don` ni `bras_droit` alors que ces rôles occupent les sièges 10 et 11 de 029. Ajout uniquement au catalogue candidat ; la capacité serveur continue d'interdire le Don avant dix joueurs et le bras droit avant onze.
2. **Perte du texte de l'enquête** : le formulaire partagé reconstruisait son HTML à partir de l'ancienne réponse serveur après un échec de sauvegarde. Les réponses non envoyées disparaissaient. Elles sont désormais gardées dans `sessionStorage`, **cloisonnées par cellule, joueur et numéro de partie**, jusqu'à confirmation. Si la réponse réseau d'une sauvegarde se perd après commit, le client compare une nouvelle lecture authentifiée au brouillon avant de confirmer.
3. **Actions ambiguës en cas de réponse réseau perdue** : protection des personnes, stratégie Don/bras droit, décision du témoin 4 et liaison cartel sont relues dans le snapshot autorisé avant toute annonce d'échec ou répétition.
4. **Victoire déterminée par le rapport d'un seul joueur** : le scoring précédent utilisait le rapport remis par l'enquêteur comme seul choix de branche et de profil. C'est contraire à la règle voulue d'un camp d'enquête à verdict majoritaire.

## Dénouement collectif, sans arbitraire (nouvelles parties 029 seulement)

Pendant la phase `locking`, chaque **enquêteur, analyste, procureur ou juge présent** donne une opinion personnelle et privée sur :

- l'auteur décisionnaire de la représaille (`local`, `execution`, `finance`, `unknown`) ;
- le statut réel du quatrième témoin (`innocent`, `coerced`, `voluntary`, `operative`, `unknown`).

Pour **chacune des deux réponses**, le moteur exige strictement plus de la moitié des votes des membres actifs du camp d'enquête. Une égalité ou une dispersion sont des conclusions non établies ; le juge et le procureur ne possèdent aucun droit de veto. Le nombre de votants requis est calculé hors joueurs déclarés absents selon la procédure existante.

Les votes sont scellés **une fois par membre**, visibles seulement pour le votant avant la révélation, et requis avant son `final_lock`. La commande RPC vérifie le jeton personnel, la phase, les valeurs autorisées et la partie. Toute deuxième commande identique est idempotente ; tout changement d'opinion déjà scellée est interdit.

Le rapport partagé reste disponible, mais son absence ne peut plus, à elle seule, annuler une conclusion correctement obtenue à la majorité. Les actions de protection restent déterminantes (deux mesures pour la victoire du camp d'enquête). Les objectifs personnels du Don, du bras droit et du quatrième témoin conservent leur logique de coopération ou de loyauté sans exécution automatique.

**Compatibilité ascendante** : un marqueur `cartel029_collective_v723` n'est posé par le serveur que lors du passage `lobby → playing` des parties 029 créées avec cette migration. Les sessions déjà lancées ne changent pas de règles. Les votes de la partie précédente sont purgés au démarrage d'une revanche.

## Validation

- QA `scripts/cartel029-v723-polish-check.mjs` : sauvegarde rejetée, réponse perdue après écriture, reprise du brouillon, confidentialité joueur/match, choix de verdict privés, limitation aux nouveaux 029, exclusion du dossier 030 et des anciennes sessions.
- Régressions `cartel029-multiplayer-check`, `cartel029-consolidation-check`, `cartel029-rematch-privacy-check`, `v140-cartel029-release-check`.
- Audit structurel de production avant modification : 15/15 combinaisons P14/P15 cohérentes ; les 15 certificats humains v135 restent non signés. **Ce changement n'autorise pas à déclarer une revue humaine réussie.**

## Publication

Fusionner d'abord les changements web. Appliquer ensuite, **dans cet ordre**, les deux migrations v722 puis v723 sur le projet Supabase `Inside Grey Room`. Vérifier les fonctions, les nouveaux triggers et le déploiement Cloudflare. Ne pas modifier les anciennes certifications ni les preuves canoniques.

Les tests de contrat et de construction n'équivalent pas à une session complète avec de vrais joueurs : tester notamment une partie 029 à 6, 8, 10 et 11 joueurs.
