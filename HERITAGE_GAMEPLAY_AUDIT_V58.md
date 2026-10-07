# MODE HÉRITAGE — AUDIT GAMEPLAY COMPLET v58

Date: 2026-10-06  
Périmètre audité: CENDRES 035–039, KUROI 040–044, MAÎTRE 01–05, jeu local à téléphone partagé, multijoueur en ligne, persistance inter-dossiers, rôles, informations privées, décisions, résultats et backend Supabase.

## Verdict

Le mode HÉRITAGE est jouable, mais il n'est pas encore cohérent de bout en bout. CENDRES et KUROI ont des boucles de jeu compréhensibles, tandis que MAÎTRE possède le meilleur modèle de persistance mais aussi les défauts structurels les plus importants. Le multijoueur HÉRITAGE n'est pas encore une reproduction fidèle de la campagne locale: plusieurs éléments persistants restent locaux à l'hôte ou ne sont pas consommés par l'interface des invités.

Avant de considérer HÉRITAGE comme terminé, les problèmes P0/P1 ci-dessous doivent être corrigés.

## P0 — bloqueurs gameplay

### 1. MAÎTRE local peut lancer un dossier sans les rôles indispensables

Fichier: `heritage-maitre-v34.js`, fonction `startSession`.

Le mode local force seulement l'Avocat, puis tire au hasard les autres rôles parmi Client, Enquêteur, Procureur, Juge, Associé et Témoin.

Conséquences:
- à 5 joueurs, le Client peut être absent alors que toute la campagne tourne autour de lui;
- le Juge, le Procureur ou l'Enquêteur peuvent également manquer alors que les cycles les nomment explicitement;
- dans le dossier III, l'Associé peut être absent alors qu'il devient le second mis en cause.

À 5 joueurs, quatre rôles seulement sont tirés parmi six rôles non-Avocat. Le scénario peut donc devenir narrativement impossible.

Correction recommandée: utiliser une composition déterministe par dossier et nombre de joueurs, comme le backend en ligne, puis randomiser uniquement l'attribution de ces rôles aux joueurs.

### 2. MAÎTRE dossier III est incompatible avec le minimum de 5 joueurs

Fichier: `heritage-maitre-data-v34.js`, chapitre 3.

Le texte des trois cycles exige simultanément:
Avocat, Client, Associé, Enquêteur, Procureur et Juge.

Cela représente six fonctions distinctes. Pourtant MAÎTRE annonce un minimum global de 5 joueurs.

Le backend en ligne résout actuellement ce conflit en retirant le Procureur à 5 joueurs, mais le Cycle III dit toujours que « le Procureur tente de faire de toute contradiction une preuve de culpabilité commune ».

Correction recommandée: faire du dossier III un dossier 6–7 joueurs, ou fusionner explicitement Procureur et Enquêteur à 5 joueurs avec un texte et des pouvoirs adaptés.

### 3. MAÎTRE en ligne perd une grande partie des informations privées spécifiques aux dossiers II–V

Fichiers:
- `heritage-maitre-v34.js` → `secretFor`
- `heritage-maitre-online-v34-4.js` → `secret`

Le mode local contient des informations spécifiques selon le chapitre pour le Client, l'Enquêteur et l'Associé. Le runtime en ligne ne spécialise réellement que le dossier I; aux dossiers II–V, il revient presque toujours aux mêmes textes génériques par rôle.

Exemples:
- le Client local reçoit une information propre au DEAL;
- l'Enquêteur local reçoit une information propre aux dossiers II et III;
- l'Associé local reçoit un état de relation hérité;
- ces variantes ne sont pas reproduites par `heritage-maitre-online-v34-4.js`.

Le même dossier n'a donc pas la même quantité d'information selon qu'il est joué localement ou en ligne.

Correction recommandée: une seule fonction de contenu de rôle MAÎTRE partagée par les deux modes.

### 4. La persistance de campagne n'est pas réellement synchronisée aux invités en ligne

Backend de production:
- colonne `campaign_carry`;
- RPC `igr_heritage_online_context_v57`;
- `igr_heritage_online_sync` renvoie `campaign_carry`.

Frontend:
- aucun appel au RPC `igr_heritage_online_context_v57` n'est présent dans le dépôt;
- `play-modes-v13-8.js` n'utilise pas `d.room.campaign_carry`;
- `heritageCarry()` existe mais n'est jamais appelée;
- CENDRES/KUROI continuent de lire `window.IGR_HERITAGE.get(campaign)`, donc l'état local du téléphone courant;
- MAÎTRE en ligne ne réutilise pas `chapterCondition()`.

Conséquence: l'hôte peut voir sa propre histoire locale, tandis qu'un invité peut voir aucun héritage, ou l'état d'une autre campagne locale présente sur son appareil. Le principe central « les choix précédents reviennent » n'est donc pas fiable en multijoueur.

Correction recommandée: uploader le contexte public de l'hôte à la création du lobby, puis utiliser exclusivement `room.campaign_carry` pour tous les écrans en ligne.

## P1 — problèmes majeurs

### 5. MAÎTRE impose le Juge comme décideur même lorsque le choix appartient narrativement à d'autres rôles

Backend: `igr_heritage_online_decide_v55`.  
Frontend: `heritage-audit-v55.js` → `enhanceMaitreDecision`.

Le Juge est forcé à verrouiller tous les dossiers MAÎTRE.

Cela fonctionne pour:
- dossier I: qualification du Client;
- dossier IV: jugement au procès.

Mais cela contredit le texte de:
- dossier II: « Quelle stratégie le Client et son Avocat inscrivent-ils dans l'Héritage ? »;
- dossier III: « Quelle ligne de défense commune peut encore survivre ? »;
- dossier V: « Quel héritage l'Avocat choisit-il de laisser ? ».

Dans ces dossiers, le système transforme un choix stratégique du Client/Avocat en verdict du Juge.

Correction recommandée: définir une autorité de décision par dossier:
- I → Juge;
- II → Client, avec validation/présentation de l'Avocat;
- III → Avocat ou décision conjointe Client/Associé;
- IV → Juge;
- V → Avocat.

### 6. L'ANGLE et la DÉMONSTRATION de MAÎTRE peuvent être entièrement sautés

Fichiers:
- `heritage-maitre-v34.js`;
- `heritage-maitre-online-v34-4.js`;
- RPC `igr_heritage_online_advance`.

L'Angle est présenté comme une mécanique centrale de MAÎTRE, mais:
- le champ peut rester vide;
- la Démonstration peut rester vide;
- le local autorise le Cycle III sans Angle;
- le backend en ligne autorise l'avancement sans stratégie enregistrée.

Le joueur peut donc terminer MAÎTRE sans jamais utiliser sa mécanique signature.

Correction recommandée: exiger au minimum un Angle non vide avant de quitter le Cycle II. La Démonstration peut rester optionnelle.

### 7. KUROI n'utilise pas la même composition de rôles en local et en ligne

Local: `heritage-play-v13-7.js` prend simplement les N premiers rôles du tableau KUROI.

À 5 joueurs local:
- Wakagashira Kurokawa
- Kobun Kurokawa
- Wakagashira Arakida
- Kobun Arakida
- Commissaire

À 5 joueurs en ligne:
- Wakagashira Kurokawa
- Kobun Kurokawa
- Wakagashira Arakida
- Commissaire
- Inspecteur

Le contenu distribué n'est donc pas le même. Cela change notamment les indices du badge de police, de Mori et de la couverture des accès.

À 6 joueurs, la divergence continue: le local ajoute l'Inspecteur, tandis que l'en ligne ajoute le Bengoshi et laisse le Kobun Arakida absent.

Correction recommandée: définir une seule table de composition KUROI, consommée par local et backend.

### 8. KUROI dossier III pose une question qui ne correspond pas aux choix

Question actuelle:
« Pourquoi la police veut-elle que Kurokawa récupère le registre ? »

Choix proposés:
- COPIE TIERS · ORIGINAL NÉGOCIÉ
- RENDRE À LA POLICE
- GARDER AU CLAN

Ces réponses décrivent ce que le clan fait du registre, pas pourquoi la police le veut.

Les phases elles-mêmes terminent par « Décidez ce que la Famille fait du registre ».

Correction recommandée: remplacer la question par « Que fait Kurokawa du registre ? » ou créer trois réponses qui répondent réellement au pourquoi.

### 9. KUROI dossier V affirme qu'il n'existe pas de bonne réponse mais continue à noter les fins 2 / 1 / 0

Le texte dit:
« Le choix final n'a pas une seule “bonne” réponse. Il définit l'héritage de KUROI. »

Mais les options conservent:
- Vérité publique → grade 2;
- Justice interne → grade 1;
- Bouc émissaire → grade 0.

Le moteur affiche ensuite:
- « Recoupement réussi »;
- « Vérité partielle »;
- « Erreur de lecture ».

Pour une décision morale/politique finale, cela contredit directement le principe du dossier.

Correction recommandée: retirer le score de vérité pour le dossier V et rendre les trois fins qualitatives, avec conséquences différentes mais sans hiérarchie de justesse.

### 10. Les mécaniques persistantes de KUROI sont partiellement mortes

Le moteur possède:
- clans et membres;
- dettes;
- chronique;
- statuts de dette;
- `upsertClanMember`;
- `updateDebt`.

Mais le gameplay réel:
- n'appelle jamais `upsertClanMember`;
- n'appelle jamais `updateDebt`;
- ajoute surtout des dettes et des entrées de Chronique;
- laisse les dettes au statut `due`.

Conséquences:
- le dashboard des clans reste essentiellement à zéro membre;
- les dettes s'accumulent mais ne peuvent pas être réglées, refusées ou transmises par une décision de scénario.

Correction recommandée: faire évoluer les membres et le statut des dettes à chaque dossier.

### 11. La crise de CENDRES est annoncée comme mécanique mais reste surtout textuelle

Le dossier V dit que la crise héritée « réduit le temps disponible et peut rendre certaines informations moins fiables ».

Dans le code, la crise:
- change de niveau;
- change un libellé;
- modifie le texte de `conditionalIntel`.

Elle ne:
- raccourcit aucun temps;
- ne masque aucun indice;
- ne change pas les secrets distribués;
- ne verrouille aucune option.

Correction recommandée: transformer les niveaux de crise en effets concrets, par exemple suppression d'un indice public, temps de discussion réduit, ou obligation de choisir entre deux sources avant la synthèse.

### 12. La carte persistante de CENDRES compte des « identités » qui sont en réalité des résultats de dossiers

`applyResult()` ajoute à `cendres.network.nodes` un nœud de type `dossier` nommé « D0X · PISTE VALIDÉE/PARTIELLE/COMPROMISE ».

Le dashboard affiche ensuite:
- « IDENTITÉS »;
- « CONNEXIONS »;
- `N identités classifiées`.

Après plusieurs dossiers, le compteur correspond donc au nombre de résultats archivés, pas au nombre réel d'identités classifiées.

Correction recommandée: soit transformer le réseau en vraie carte d'entités/personnes, soit renommer les métriques en « pistes » et « liens de dossier ».

## P2 — cohérence et balance

### 13. Deux anciens termes fictionnels subsistent encore dans CENDRES

Après la passe v57, `conditionalIntel()` contient encore:
- « K-9 »;
- « VENN → 04:17 → K-9 ».

Ces termes n'existent plus dans le reste du contenu concret actuel et réintroduisent exactement le problème de jargon que v57 devait supprimer.

Correction recommandée:
- K-9 → « compte privilégié du service des habilitations »;
- VENN → « V-17 ».

### 14. CENDRES dossiers IV et V deviennent très déterministes avec les cinq rôles de base

À 5 joueurs, les rôles présents sont Chef, Communications, Terrain, Source et Liaison.

Dans le dossier V:
- Chef écarte la base;
- Communications pointe la galerie;
- Terrain écarte la base et confirme l'itinéraire vers la galerie;
- Source décrit la galerie;
- seule la Liaison apporte surtout une pression politique.

Quatre informations sur cinq convergent presque directement vers la même réponse.

Le problème est similaire, quoique moins fort, au dossier IV.

Correction recommandée: distribuer davantage d'ambiguïté et faire dépendre au moins une information de l'état hérité de la crise.

### 15. « À FAIRE MAINTENANT » n'est pas réellement contextuel

`heritage-audit-v55.js` affiche dans le bandeau « À FAIRE MAINTENANT » l'objectif permanent de la carte de rôle.

Il ne change pas selon la phase/cycle.

Dans MAÎTRE, par exemple, le Juge voit la même consigne pendant Audition, Angle et Audience alors que son implication devrait être très différente.

Correction recommandée: ajouter un objectif de phase par rôle, distinct de l'objectif permanent.

## Architecture / intégrité

### 16. Une migration de production HÉRITAGE v57 n'est pas présente dans le dépôt GitHub audité

Supabase production contient:
`20261006090153 heritage_campaign_integrity_v57`

Elle ajoute notamment:
- `campaign_carry`;
- `igr_heritage_online_context_v57`;
- une version modifiée de `igr_heritage_online_sync`;
- des gardes supplémentaires de décision/fin.

Cette migration n'est pas présente dans l'arbre `main` au moment de l'audit.

Conséquence: le backend de production n'est pas entièrement reproductible à partir du dépôt.

Correction recommandée: ajouter immédiatement la migration exacte au dépôt avant tout nouveau changement HÉRITAGE.

## Ce qui fonctionne déjà bien

- CENDRES possède maintenant une progression factuelle claire sur cinq dossiers: identité de couverture → transfert → document falsifié → compromission interne → localisation finale.
- CENDRES local et online utilisent la même composition de rôles aux formats 5/6/7 joueurs.
- KUROI 1–4 construit une chaîne cohérente: meurtre → dette Mori/Ren → registre → chaîne Ishida/Mori/Ren.
- Le replay d'un dossier archivé ne modifie pas la sauvegarde principale.
- MAÎTRE possède le modèle de persistance le plus riche: faits, liens, relations, réputation, traces, Angle et Démonstration.
- En ligne, l'hôte MAÎTRE est bien l'Avocat principal.
- Le variant canonique MAÎTRE est caché au Juge et au Procureur; seuls les rôles autorisés le reçoivent.
- Le Juge en ligne dispose maintenant d'une autorité serveur réelle lorsque le dossier exige une décision judiciaire.
- Les décisions serveur sont limitées aux options autorisées pour le dossier courant.
- Les rôles et informations privées restent séparés par joueur en ligne.

## Priorité de correction recommandée

1. Sécuriser les compositions de rôles MAÎTRE local et résoudre le dossier III à 5 joueurs.
2. Unifier les cartes privées MAÎTRE local/en ligne.
3. Brancher réellement `campaign_carry` dans tout le multijoueur HÉRITAGE.
4. Définir l'autorité de décision MAÎTRE par dossier au lieu de « Juge partout ».
5. Rendre l'Angle obligatoire et la Démonstration réellement exploitable.
6. Unifier les compositions KUROI local/en ligne.
7. Corriger KUROI III et retirer le scoring de vérité de KUROI V.
8. Donner de vrais effets mécaniques à la crise CENDRES et aux dettes/clans KUROI.
9. Nettoyer les deux résidus K-9/VENN.
10. Ramener la migration Supabase v57 dans le dépôt GitHub.

## Évaluation actuelle

| Axe | CENDRES | KUROI | MAÎTRE |
|---|---:|---:|---:|
| Compréhension du dossier | 8/10 | 8/10 | 7/10 |
| Répartition des informations | 8/10 | 8/10 | 5/10 |
| Persistance réellement mécanique | 4/10 | 5/10 | 7/10 local / 3/10 online |
| Cohérence local ↔ online | 8/10 | 5/10 | 4/10 |
| Autorité / rôles | 8/10 | 8/10 | 4/10 |
| Rejouabilité | 6/10 | 7/10 | 8/10 |
| État global | jouable, mécanique persistante faible | jouable, plusieurs incohérences | concept fort mais corrections structurelles nécessaires |

Conclusion: HÉRITAGE a une bonne base et trois identités de campagne distinctes, mais MAÎTRE et la persistance multijoueur ne sont pas encore assez cohérents pour être qualifiés de terminés.