# LE RÉGIME — organigramme d'État et rôle exclusif v1

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

## Rôle exclusif proposé : ARCHIVISTE D'ÉTAT

**Statut public :** ancien conservateur des registres du palais, entendu comme auxiliaire de l'enquête. Il ne siège pas au gouvernement ; son personnage est masculin dans ce contexte fictif. Sa position secrète peut évoluer selon le dossier et la variante, mais ses pouvoirs publics sont identiques. C'est un rôle **spécialisé**, pas un nouveau MJ.

**Différence avec les autres rôles :**
- Enquêteur : choisit *où enquêter* ;
- Analyste : interprète *ce que les preuves permettent de conclure* ;
- Archiviste : vérifie *d'où vient une pièce* et *quelle pièce peut être déclassifiée* ;
- Procureur : choisit *ce qui peut être soutenu à l'accusation* ;
- Juge : statue *sur une contestation procédurale*, jamais sur la vérité.

### Actions par cycle (proposition)

**C1 — OUVRIR UN SCELLÉ.** Le rôle choisit une seule des trois catégories « Palais / Sécurité / Armée ». Le serveur révèle une pièce préécrite de cette branche et précise sa provenance. Les autres pièces cruciales restent découvrables avant l'audience ; une personne absente ne bloque pas l'enquête.

**C2 — ATTESTER OU CONTESTER.** L'Archiviste sélectionne une pièce révélée et choisit « provenance attestée » ou « contrôle contradictoire demandé ». L'application affiche immédiatement l'effet procédural, avec un élément de vérification **préécrit**. Une contestation ne détruit jamais une pièce et une attestation n'établit jamais automatiquement la culpabilité.

**C3 — TÉMOIGNER OU SE TAIRE.** Le joueur choisit entre une déposition sous serment issue de son propre dossier privé ou le silence. Sa décision est enregistrée, peut être citée à l'audience, et entraîne un objectif privé compatible avec la variante. Pas de révélation magique ni de condamnation automatique.

**Équilibre :** maximum une action exclusive utile par cycle, chronométrée par les phases existantes ; aucun choix ne peut altérer le canon, supprimer une preuve essentielle, changer une identité codée ou imposer seul le verdict. Le rôle absent active une procédure administrative de substitution **sans récompense privée**, pour que 6–7 joueurs ne soient jamais désavantagés.

**Disponibilité :** optionnel au-dessus de l'effectif minimal du dossier ; ne pas modifier les effectifs requis tant que les packs et la validation serveur n'ont pas été remaniés. Le rôle peut remplacer une place optionnelle inutilisée, jamais supprimer une fonction requise.

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

- Organisation stable sur 032–034, y compris présence de l'archiviste avec 7, 8 ou 9 joueurs et son absence.
- Le fils Darian figure partout où la ministre Samira apparaissait auparavant, sans ancien lien non mis à jour.
- Rendu du nom du président même avec accents, apostrophes, emojis, longueurs extrêmes et tentatives HTML.
- Reconnexion sur iPhone/iPad : alias et organigramme inchangés ; pas de fuite de données privées.
- Aucun lien de pouvoir réel n'est visible avant sa révélation ; une pièce contestée reste retraçable.
- Vérifier d'abord les migrations Supabase réellement installées et la compatibilité du runtime, puis builds et simulations humaines.

## Intention esthétique
Charbon, noir d'archive, papier ancien et gris acier. Pas de bleus vifs, pas de rouge arcade, pas de trophées pour les crimes. Le tableau doit ressembler à un schéma de commission d'enquête, utilisable d'un pouce sur iPhone.
