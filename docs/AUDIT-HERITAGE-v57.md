# Audit HÉRITAGE v57 — 6 octobre 2026

Périmètre : CENDRES, KUROI et MAÎTRE, soit 15 dossiers ; modes local et en ligne ; données des rôles, progression, conclusions, autorisations serveur et présentation mobile.

| Défaut constaté | Correction |
|---|---|
| MAÎTRE local pouvait tirer une table sans Client, Juge ou Enquêteur | Sélection des rôles indispensables avant mélange ; Associé obligatoire au dossier III ; premier joueur toujours Avocat |
| KUROI local distribuait des rôles différents de l’online à 5 ou 6 joueurs | Même sélection : présence des deux clans et des deux rôles policiers |
| Une deuxième validation pouvait remplacer les faits, relations et réputation d’un dossier clos | Validation idempotente ; replay sans modification de la campagne principale |
| Des événements KUROI et liens CENDRES étaient classés dans le dossier suivant | Numéro du dossier d’origine passé explicitement au registre et aux liens |
| Cartes MAÎTRE online presque identiques aux cinq dossiers | Accesseur partagé avec le mode local ; variantes autorisées et relations héritées intégrées |
| Les invités utilisaient leur propre sauvegarde comme contexte | Contexte public de la campagne de l’hôte transmis par une RPC authentifiée ; exclusion de la variante cachée et des entrées privées |
| Deux moteurs pouvaient afficher MAÎTRE après une connexion avec code | Le moteur générique laisse MAÎTRE à son propre routeur |
| L’hôte pouvait contourner le Juge par l’ancienne RPC | Refus serveur lorsque le Juge est présent ; boutons natifs réservés au Juge ; repli hôte uniquement en son absence |
| Brouillon de la défense transmis au Juge avant publication | Préparation visible à l’Avocat ; publication au cycle III |
| Clôture serveur possible avant une décision | Conclusion requise ; fin idempotente ; sauvegarde conservée si la clôture réseau échoue |
| Replay MAÎTRE online pouvait remplacer une ancienne conclusion | Détection d’archive et protection dans le moteur de persistance |
| Copier une sauvegarde annonçait parfois un succès avant la copie | Attente effective du presse-papiers et gestion des erreurs |
| Rôles techniques et statuts anglais exposés à l’écran | Noms français lisibles, statuts traduits, distinction entre fait retenu et réalité des faits |
| Petites affiches, titres longs et largeur de la carte de résultat | Format 2:3 homogène, affiches contenues, retour à la ligne et correction du calcul de largeur |
| Vesper et Arken désignaient des pays inventés | Services de renseignement, ministère, aéroport international et pays voisin ; CERBÈRES et ORPHÉE restent des noms de code |

## Validation

- Tests exécutés sur les 15 dossiers : indices pour chaque rôle, distributions à 5/6/7 joueurs, archivage des cinq étapes et protection contre une deuxième validation.
- MAÎTRE : 180 distributions testées ; présence des rôles indispensables et de l’Associé au dossier III.
- Cartes MAÎTRE : cinq dossiers, sept rôles, trois variantes ; contexte relationnel online distinct du stockage local.
- Tests transactionnels sur le serveur : authentification, exclusion de la variante cachée, protection du brouillon, refus du contournement par l’Avocat/hôte et clôture après jugement. Données de test annulées par ROLLBACK.
- Builds web et mobile avec les contrôles existants et le nouveau contrôle v57.
- Contrôles de sécurité Supabase : tables HÉRITAGE sous RLS ; accès par les RPC existantes authentifiées par jeton. Le conseiller signale l’exposition publique des fonctions SECURITY DEFINER, attendue dans ce modèle ; les nouvelles fonctions vérifient le jeton avant lecture/écriture.

## Limites et mise en service

Les protections serveur et le contexte partagé ont été appliqués à Supabase. Le frontend reste proposé en PR jusqu’à fusion et déploiement. Une partie complète avec plusieurs téléphones physiques reste nécessaire pour évaluer le rythme, la lisibilité et le plaisir de chaque rôle. Le navigateur de test n’a pas pu être installé dans cet environnement ; la validation visuelle sur iPhone réel reste à faire. Les corrections CSS sont compilées et revues, sans prétendre à une validation visuelle complète.

Le contexte de campagne reste issu de la sauvegarde locale de l’hôte ; cette correction le partage, elle ne crée pas une sauvegarde de campagne multiappareil. Les dossiers restent des récits de jeu contemporains, sans revendiquer une simulation exacte du droit national d’un pays donné.
