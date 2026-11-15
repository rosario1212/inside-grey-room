# LE RÉGIME — organigramme d'État et rôle exclusif v2

**État : spécification et prototype d'organigramme public. Le rôle et la personnalisation complète du président ne sont pas intégrés au runtime serveur.**

## Décisions approuvées

- Population de Karsane **avant guerre : 15 000 000**. C'est le seul dénominateur démographique canonique ; ne pas calculer un nombre de victimes par soustraction arbitraire.
- **Président de référence : Harb Kassar** ; lors d'une partie, le président reçoit comme identité affichée le nom/pseudo du joueur qui l'incarne, figé au démarrage et appliqué **partout dans les textes de cette partie**. Il n'est jamais demandé au joueur d'entrer un second prénom. Cela ne modifie ni son lien de parenté ni les faits du procès.
- Gouvernement de cette dictature fictive **exclusivement masculin**. Les joueurs, quel que soit leur genre, peuvent interpréter les rôles. La fille non fonctionnaire du président existe seulement comme lien familial justifiant le gendre Ilyas Sayegh.
- **Darian Kassar**, fils, héritier présumé et ministre de l'Information, remplace la précédente fille ministre.
- Aucun poste, aucun objectif secret, aucun rôle d'un autre DLC n'est modifié automatiquement.

## Mécanique signature : LE DOUBLE ORGANIGRAMME

L'interface comprend deux vues publiques permanentes et une troisième vue probatoire qui se remplit pendant la partie.

### Vue A : LE CLAN
Liens de sang et d'alliance vérifiés au briefing :
- Harb Kassar, Président (remplacé en session à l'affichage par le pseudo du joueur) ;
- Fouad Kassar, frère ;
- Mourad Kassar, cousin ;
- Darian Kassar, fils, héritier présumé ;
- Ilyas Sayegh, gendre par mariage avec une fille **sans fonction gouvernementale** ;
- Hamza Daher, confident, **non apparenté** ;
- Youssef Baran, fidèle, **non apparenté**.

### Vue B : L'APPAREIL
Rapports administratifs visibles dès le départ :
```text
PRÉSIDENCE
├─ Ministère de la Défense — Fouad Kassar
├─ Ministère de l'Intérieur — Mourad Kassar
│  └─ Prison centrale de Vahran — Youssef Baran
├─ Ministère de l'Information — Darian Kassar
├─ Sécurité présidentielle et renseignement — Ilyas Sayegh
└─ Secrétariat général du palais — Hamza Daher
```

### Vue C : LE POUVOIR RÉEL — probatoire, pas publique à l'origine
- Les arcs de décision ne s'affichent **qu'après des pièces corroborées par le moteur serveur**.
- Chaque arc a « document », « période », « fonction exercée » et « degré de preuve » ; les liens non prouvés sont « à établir », jamais présentés comme faux.
- Séparer les trois dimensions : parenté / autorité officielle / influence réelle.
- Ne jamais mettre les objectifs secrets ou le responsable principal dans le JavaScript public.
- L'Enquêteur ne peut pas saisir arbitrairement des liens comme faits : ses hypothèses restent des hypothèses.
- Le serveur calcule et persiste les arcs corroborés, et le client ne montre que ceux autorisés dans la session.

### Exploitation différenciée par dossier

| Dossier | Couche centrale | Utilité concrète |
| --- | --- | --- |
| 032 | Administration, prison, cabinet | Qui pouvait arrêter, prolonger, libérer ou être averti des tortures ? |
| 033 | Défense, héritier, guerre, propagande | Qui détenait les moyens de guerre, recevait les alertes et orientait les campagnes ? |
| 034 | Présidence, sécurité, conseil | Qui a réellement décidé, ordonné, transmis ou couvert, malgré son rang et les noms de code ? |

Les cartes A et B sont un outil de **lecture** : elles ne doivent pas déjà résoudre les variantes. La carte C apporte une progression mais jamais une sentence automatisée.

## Rôle exclusif proposé : LE TRANSFUGE — ANCIEN CADRE DU CONTRE-ESPIONNAGE

**Statut public :** ancien haut responsable des services de renseignement de Karsane, passé du côté de la justice après la chute de la dictature. Son ancien poste n'est pas celui d'Ilyas Sayegh : Ilyas dirigeait la sécurité présidentielle, le Transfuge travaillait à la contre-ingérence et au traitement d'alertes internes. Il n'est pas un ministre ni un arbitre impartial. Il a servi le système et possède **ses propres intérêts**. Cette catégorie de rôle est ouverte à tout joueur.

**Promesse de jeu :** être celui qui peut compromettre les puissants, tout en redoutant qu'un dossier le compromette lui-même. Une admission véridique peut être un calcul politique. Le rôle est jouable même si le joueur ne maîtrise pas le droit pénal international.

### Trois ressources, aucune toute-puissance

1. **Deux dossiers noirs** privés, provenant uniquement de la variante scellée : chacun contient une information véridique mais partielle, une provenance et une cible possible. Au moins un élément peut aussi concerner sa propre responsabilité ou une loyauté passée. Le joueur choisit comment se servir de ce qu'il sait, sans composer de documents.
2. **Une loyauté en tension** : coopérer avec le tribunal ou maintenir le contact avec l'ancien cercle dirigeant. Cette loyauté est un objectif privé susceptible de conflit, pas une permission de réécrire le canon.
3. **Une occasion de confrontation ciblée** : le Transfuge peut demander à parler à un dignitaire ou à l'accusation dans un créneau existant. Une demande n'est pas une convocation autoritaire ni un interrogatoire gratuit.

### Actions exclusives, une par cycle

**C1 — LE DOSSIER NOIR (1–2 minutes, créneau déjà existant).** Le joueur reçoit deux pistes scellées de sa variante et choisit d'en transmettre une au camp d'enquête. L'application annonce immédiatement « SOURCE TRANSMISE » et ajoute la pièce préécrite à la bonne catégorie du Dossier commun. La piste ne suffit jamais seule à démontrer un crime ; le destinataire peut la contester et en rechercher la confirmation. L'autre dossier reste privé temporairement, mais une voie indépendante doit permettre de parvenir aux faits cruciaux.

**C2 — LA DÉFECTION (1–2 minutes).** Il choisit **COOPÉRER AVEC LE PROCUREUR** ou **MAINTENIR UN CONTACT AVEC LE CLAN**. Le premier débloque une demande d'entretien encadrée avec le Procureur (ou l'Enquêteur si le Procureur est absent) ; le second débloque une demande de confrontation avec un dignitaire présent. Il ne peut ouvrir les deux routes pendant le même cycle. L'interface affiche aussitôt la route retenue et le statut de la demande ; l'entretien utilise le quota des événements existants. Aucune immunité, intervention militaire ou décision judiciaire n'est attribuée automatiquement.

**C3 — LE POINT DE NON-RETOUR (1–2 minutes).** Choix final entre **DÉPOSER SOUS SERMENT** (en sélectionnant une déposition autorisée par le dossier privé), **DÉNONCER SON ANCIEN SUPÉRIEUR** (formulation issue des éléments connus et présentant une contre-preuve possible) ou **GARDER LE SILENCE**. Sa décision verrouille son objectif privé pour la fin de partie et devient une déclaration opposable lors de l'audience. Les autres joueurs peuvent le contredire à partir de pièces canoniques. Il ne peut jamais créer un faux témoignage « officiel » automatiquement validé par l'application.

### Objectifs et résultat individuel

- **Objectif principal commun :** faire reconnaître la valeur de son témoignage sans devenir l'unique responsable désigné par les enquêteurs. Le résultat dépend des pièces réelles et des décisions prises, pas d'une jauge arbitraire de peur.
- **Objectif secondaire secret selon la variante :** conserver une loyauté, protéger une personne, ne pas révéler sa propre participation ou au contraire la reconnaître en échange d'une coopération. Le jeu vérifie des états explicites, jamais l'analyse de conversations.
- **Échec possible :** être démenti par un document, perdre un accord négocié, voir sa complicité établie. Son choix doit avoir un coût narratif, non une animation sans effet.

### Intégration aux trois dossiers

- **032 — Prison de Vahran :** ancien circuit de renseignement sur les détenus et les signalements de disparitions ; peut révéler les liens entre Intérieur, prison et cabinet.
- **033 — Guerre et extermination :** a reçu des alertes et notes de commandement ; peut confronter les récits de Défense, sécurité présidentielle et propagande sans être présenté comme le commandant militaire.
- **034 — Procès de Harb Kassar :** connaît la chronologie de certains contacts du sommet et des noms de code ; peut se retourner contre un dignitaire ou entrer en contradiction avec sa propre déposition.

### Règles d'équilibre

- **Optionnel, à partir d'une place disponible** : ne pas augmenter les minimums ni remplacer un suspect, Enquêteur, Analyste, Procureur ou Juge obligatoire.
- Une action décisive maximum par cycle ; déblocage lié au serveur, pas aux affirmations libres du joueur.
- Son absence n'empêche pas l'Enquêteur d'obtenir toutes les preuves indispensables par d'autres voies.
- La défection ne confère ni immunité juridiquement garantie, ni monopole sur les archives, ni condamnation automatique.
- Les conséquences sont affichées **immédiatement** ; les échanges humains demeurent humains et aucune conversation n'est écoutée.
- Préférer une décision qui oppose deux intérêts réels plutôt qu'un bouton qui délivre toujours le bon indice.
- Ne pas confondre ce rôle avec Ilyas Sayegh, suspect et chef de la sécurité présidentielle.

**État d'implémentation :** rôle spécifié uniquement. Pas encore de cartes privées, actions RPC ou scoring serveur finalisé. Ne pas le présenter comme disponible en production.

## Rôle majeur dans 034 : PRÉSIDENT DÉCHU (suspect, non un joueur supplémentaire)

Le président n'est pas une figure décorative, ni un superadministrateur. Il est incarné par l'un des trois suspects déjà requis dans 034. Son pseudo de joueur est l'identité du personnage pour la session.

- **Cycle 1 — DÉCRET CONTESTÉ :** le président choisit de reconnaître, contester ou limiter la portée d'un acte historique déjà présent dans sa variante. Il verrouille une position officielle. Les autres personnages voient immédiatement cette position et peuvent l'opposer à ses actes.
- **Cycle 2 — CONFRONTATION DU SOMMET :** il peut demander une confrontation avec un ancien ministre, sous réserve des quotas et décisions de procédure du jeu. La demande ne crée pas un événement supplémentaire gratuit ; refus motivé ou convocation effective sont visibles immédiatement.
- **Cycle 3 — DERNIÈRE DÉCLARATION :** il choisit de témoigner contre un ancien fidèle, de défendre sa chaîne d'ordres ou de garder le silence. Les formulations sont compatibles avec les faits de sa variante. Le choix influe sur les alliances et les objectifs privés mais jamais sur l'identité réelle des auteurs ni le barème juridique.

**Garde-fou :** l'ancien président ne commande plus d'armée et ne peut pas ordonner une purge, détruire des pièces ou nommer des magistrats pendant la partie. Ses armes sont la mémoire, les archives, ses relations et la parole. Sa position ne lui donne aucun droit de blocage sur l'enquête.

## Personnalisation sûre du président : contrat technique

1. Ne pas utiliser les chaînes de caractères pour identifier le président dans l'organigramme ou les vérités. Utiliser un `character_key='president'` stable côté serveur.
2. Le président est assigné à un joueur concret. `president_display_name` est un snapshot de son pseudo à l'ouverture du dossier, avec limites de longueur, échappement HTML et protection contre les caractères de contrôle.
3. Les fiches, convocations, déclarations écrites, dossiers d'enquête, titres, citations et verdicts utilisent une **référence structurée** à ce personnage pour le rendu, pas une substitution globale aveugle de texte.
4. Harb Kassar reste le nom de référence de la **bible**, le nom de repli si le rôle n'est pas incarné dans un contexte hors partie. À l'intérieur d'une partie personnalisée, aucune preuve ne doit encore afficher « Harb » par erreur.
5. En cas de reconnexion, l'alias figé est conservé. Les changements de nom de profil après le lancement n'affectent pas les archives.
6. Le pseudo ne confère aucune permission présidentielle. Toutes les actions passent par l'identité de rôle et la validation serveur, jamais par l'orthographe de l'alias.
7. Ne pas exposer les relations privées via un arbre universel. Une session ou un mode Hôtel peut rendre un texte public, mais ne divulgue pas d'objectifs cachés.

## QA avant fusion du rôle

- Organisation stable sur 032–034, y compris présence du Transfuge avec 7, 8 ou 9 joueurs et son absence ; il ne doit jamais faire doublon avec Ilyas.
- Le fils Darian figure partout où la ministre Samira apparaissait auparavant, sans ancien lien non mis à jour.
- Rendu du nom du président même avec accents, apostrophes, emojis, longueurs extrêmes et tentatives HTML.
- Reconnexion sur iPhone/iPad : alias et organigramme inchangés ; pas de fuite de données privées.
- Aucun lien de pouvoir réel n'est visible avant sa révélation ; une pièce contestée reste retraçable. Les dossiers noirs et leurs cibles restent exclusivement privés jusqu'à la décision serveur.
- Vérifier d'abord les migrations Supabase réellement installées et la compatibilité du runtime, puis builds et simulations humaines.

## Intention esthétique
Charbon, noir d'archive, papier ancien et gris acier. Pas de bleus vifs, pas de rouge arcade, pas de trophées pour les crimes. Le tableau doit ressembler à un schéma de commission d'enquête, utilisable d'un pouce sur iPhone.
