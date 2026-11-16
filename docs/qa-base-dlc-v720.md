# V720 — fiabilité des scénarios de base et des DLC (16 novembre 2026)

## Périmètre
Les vingt dossiers classiques (001–020) et les quatorze dossiers des quatre DLC (021–034).
Aucune intrigue, vérité privée, identité de variante, score ou règle de majorité n'est modifiée.

## Correctifs confirmés
1. **Entrée dans une cellule** : si la création / l'arrivée est acceptée par le serveur mais que la première lecture d'état échoue, les clés restent enregistrées, un écran neutre permet de relancer la lecture du même salon et aucun nouveau salon n'est créé.
2. **Choix de rôle** : en cas de refus serveur, le choix optimiste revient au dernier rôle confirmé même lorsque la synchronisation suivante ne répond pas. Les modifications successives restent sérialisées.
3. **Démarrage hôte** : si la réponse du serveur a été perdue, une lecture de l'état fait foi avant de signaler une erreur. Les véritables problèmes de composition, de taille et de disponibilité ont des messages distincts.
4. **Régressions** : scénario 007, rôles et vote collectif, Terreur, Cartel 031, Omertà et Régime gardent leurs tests dédiés et le build complet.

## État de la base de production observé avant cette correction (lecture seule)
- Les 34 dossiers 001–034 ont une base de contenu structurée et un contexte public.
- Les 20 dossiers 001–020 ont leur release gate actif et trois variantes validées.
- Les 29 dossiers non-Omertà ont une distribution générique de rôles conforme aux capacités sur toutes les tailles de groupes annoncées ; Omertà utilise intentionnellement **son propre démarrage** et son propre casting, non les rôles du moteur générique.
- Omertà (contrôle standalone), Régime et le dossier 029 disposent d'un contrôle d'activation positif ; 007 est autorisé.
- **Réserve Cartel 029 :** le contrôle historique `passed_end_to_end_testing` demeure `false`, et les quinze vérifications de signature éditoriale du prévol v135 ne sont pas renseignées (`signed = 0`). Le prévol structurel est présent/approuvé pour 15 variantes et le contrôle opérationnel renvoie actif. Ces marqueurs **ne sont pas assimilés à une certification réussie** et ne doivent jamais être passés à `true` sans preuve de vérifications effectives. La publication existante n'est pas désactivée arbitrairement.

## Tests humains restant nécessaires
Passage réel Wi-Fi / 4G / 5G, perte de réponse du lancement, doubles tentatives, contrôle des rôles et décisions sur plusieurs appareils, dossiers de 4 à 16 joueurs, DLC à 6–11 joueurs, verdicts et reconnections. Les tests de compilation ou de contrat n'équivalent pas à ces essais.


## Clôture technique / V721 — 16 novembre 2026

Contrôles **réellement exécutés en lecture seule sur le backend de production**, sans mise à jour de données privées :

| Vérification | Résultat |
| --- | --- |
| Packs 001–034 présents et dotés de contexte, vérité, trames, suspects et groupe de joueurs valide | **34/34** |
| Release gates individuels des dossiers 001–020, chacun avec trois variantes | **20/20 actifs** |
| Distributions serveur des rôles hors Omertà : configurations de groupe | **72/72**, 502 sièges, **0** dépassement des capacités |
| Omertà 021–025 : chacun admissible via `igr_omerta_standalone_can_start` | **5/5 actifs** (casting Omertà distinct du moteur générique) |
| Terreur 026–028 : contrôle privé de publication | **actif** |
| Cartel 029 : activation serveur | **active** |
| Cartel 029 : `igr_v161_029_machine_audit()` | **15/15 combinaisons structurellement complètes, zéro anomalie** |
| Cartel 029 : preuve de branche P15, preuve de profil P14, témoins T1–T4, six preuves C3, responsabilités distinctes | **15/15 recoupements cohérents** |
| Le Régime 032–034 : contrôle privé de publication | **actif** |
| Builds web, iOS et Android, Store Readiness, audit v720 et test navigateur de Casino après correction de l'horloge synthétique | **réussis** |
| Cloudflare Production (dernier correctif du test Casino, commit `62b6a225965cdee296dd1a4343d9d647acccda1c`) | **succès confirmé** |

Le code de jeu de ces scénarios ne nécessite pas de changement supplémentaire *sur la base des défauts actuellement démontrés*. Les correctifs de fiabilité ont été fusionnés dans la PR #551 et la correction du test de durée dans la PR #552.

### Réserve documentaire, non gommée artificiellement

Les **15 variantes** de Cartel 029 ont passé les audits automatiques de structure et de recoupement, **mais cela ne constitue pas une revue narrative signée par un humain**. Les colonnes `story_reviewed`, `third_cycle_sources_verified` et `reviewed_at` ne sont pas modifiées ; le résultat `signed=0` du prévol v135 et le drapeau historique `passed_end_to_end_testing=false` restent intacts. Ne pas présenter le prévol éditorial comme `editorial_ready=true` tant que la revue prévue n'est pas effectuée et datée.

### Politique de gel

À partir de ce contrôle : **gel des scénarios 001–034 et des quatre campagnes Héritage**, sauf correction d'une régression prouvée, d'une faille de sécurité, d'une incohérence de victoire, d'un obstacle d'accessibilité ou d'un défaut mesuré lors d'un playtest. Pas de nouveau personnage, scénario, phase ni changement arbitraire de vérité canonique simplement pour faire monter une note subjective.

La publication technique et les tests automatiques sont une condition nécessaire, **pas une garantie de perfection**. Une validation humaine complète reste indispensable sur plusieurs téléphones et configurations réelles.
