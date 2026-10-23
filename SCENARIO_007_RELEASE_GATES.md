# Dossier 007 — LE TESTAMENT GRIS · Contrat de publication

**Statut : PR de préparation uniquement — ne pas fusionner tant que le serveur n'est pas prêt.**

## Identité
Cinq joueurs obligatoires : un Enquêteur, un Analyste et trois Suspects. Le procès reconstitue l'ordre des rencontres, le document à l'origine du dernier conflit, la chute et les mensonges. La signature d'un testament, une dette ou une filiation alléguée sont des pistes ; elles ne prouvent pas à elles seules un acte violent.

## Trois récits A/B/C
Chaque variante doit contenir trois cartes privées, six confrontations dirigées entre les trois suspects, trois révélations obligatoires réparties sur les cycles 1/2/3, neuf investigations facultatives (3 par cycle) et une conclusion propre. Ne pas recopier une solution dans le dépôt public.

## API sécurisée — préparée côté serveur, mais activation bloquée
- Le **release gate** privé `igr_v281_007_release_status()` a été installé et vérifie l'intégrité et l'approbation des trois manuscrits, leurs packs valides, leur confidentialité et la présence de trois vérités distinctes. En l'absence d'une seule variante, **ne pas activer de tirage automatique**.
- `igr_v281_007_pin_room` et `igr_v281_007_pinned_pack` sont installées. Les fonctions de démarrage, reprise, fiches, indices et révélation sont raccordées au snapshot privé. **Le contrôle refuse actuellement tout nouveau démarrage 007 (2/3 packs)**.
- Les investigations 007 sont accessibles aux seuls Enquêteurs/Analystes via le RPC contrôlé **installé, mais avec accès `anon` et `authenticated` révoqués jusqu'à la libération** : `igr_v282_007_investigate`, avec authentification par token du participant et contrôle atomique d'un seul choix pour tout le camp Enquête par cycle. Les titres et résultats non choisis restent secrets.
- La synchronisation a été modifiée pour exposer uniquement les trois **titres** des investigations du cycle en cours au camp Enquête et un drapeau d'utilisation ; ne renvoie jamais la solution canonique pendant la partie.
- `igr_v4_lock_final` a été modifié pour accepter et valide `reconstruction_007` pour Enquêteur et Analyste : `cause`, `actor`, `decoy`. Cette reconstitution est obligatoire et n'est révélée/corrigée qu'à la fin.
- Les rôles Suspects ne voient jamais les choix ni le contenu privé du camp Enquête.
- Aucune mécanique d'avocat, juge ou procureur n'est ajoutée : le format à cinq joueurs demeure.

## État technique vérifié
- Variantes A et B : 3 indices et 9 investigations chacune, packs valides.
- Variante C : manuscrit de base présent, mais intégration éditoriale bloquée par les contrôles d'accès ; **pack v280 non valide**.
- Constructeur privé `igr_v280_007_build_pack` créé et inaccessible directement aux joueurs.
- Interface de la PR : **préparée et testée en compilation**, mais non fusionnée/non jouable tant que C manque.
- Contrôle `igr_v281_007_release_status()` : **found 3, valid 2, approved 0, eligible false**, constructeur privé inaccessible à `anon` et `authenticated`.
- Le démarrage local du 007 a été explicitement refusé dans un test de sécurité ; les chemins locaux et multijoueurs échouent en mode fermé.
- Non-régression : **48/48 lancements synthétiques réussis sur les scénarios 001 à 006**, avec annulation des salons.
- CI PR #347 : Cloudflare, iOS, Android, boutique et mise en page réussis. Le build Workers secondaire `inside-grey-room` a échoué ; la PR demeure en brouillon et non publiée.

## Critères avant fusion
1. Appliquer C par un chemin de modification **explicitement autorisé** ; ne pas contourner les contrôles de sécurité. La version C validée hors ligne est disponible dans l'archive privée, jamais sur le dépôt.
2. Valider A/B/C, intégrité, permissions et fail-closed avant d'autoriser le premier nouveau tirage.
3. Simuler 48 départs multijoueurs à 5 joueurs : aucun doublon de rôle, distribution sur A/B/C et zéro salon de test conservé.
4. Tester les trois cycles, les enquêtes privées, la reconnexion, le refus d'un second choix et le verdict correct/incorrect/invalide. **Réautoriser explicitement `EXECUTE` au rôle de transport uniquement après tests et libération.**
5. Vérifier les anciens scénarios 001 à 006 (premier contrôle 48/48 effectué ; à refaire après l'intégration finale).
6. Faire passer la CI Cloudflare, iOS, Android et mise en page, puis fusionner dans main et confirmer le commit publié sur le Worker de production.

**Ne jamais annoncer « 10/10 », « déployé », « sécurisé intégralement » ou « validé » tant que ces critères ne sont pas satisfaits.**

## Audit complémentaire
- Garde-fous de démarrage : tests réussis du refus de démarrage local **et** multijoueur en l'absence de C, sans salon persistant.
- Supabase Security Advisor : la route `igr_v282_007_investigate` était signalée comme exécutable depuis `anon` (SECURITY DEFINER). L'accès externe a été révoqué jusqu'à autorisation de publication. Cette alerte concerne aussi des routes existantes ailleurs dans le projet, hors périmètre du présent dossier.
- Vérifications serveur (48 simulations sur les scénarios 001–006) : **48/48 lancements réussis** et salons annulés.
- Le garde-fou serveur refuse toujours la libération : **3 manuscrits trouvés, 2 packs validés, 0 variante approuvée**.

## Correctif de sécurité v284 — 23 octobre 2026
- **Permission vérifiée avant correction :** la RPC `public.igr_v282_007_investigate(text,uuid,text)` conservait un droit `EXECUTE` pour `anon`, contrairement à l'intention exprimée dans le contrat. Les rôles `PUBLIC` et `authenticated` n'y avaient pas accès.
- **Correction appliquée en production Supabase :** révocation explicite pour `PUBLIC`, `anon` et `authenticated`. Nouveau contrôle SQL : tous trois sont à `false` ; le `service_role` conserve la maintenance.
- Migration de réconciliation versionnée : `supabase/migrations/20261023185000_v284_revoke_007_investigation_until_release.sql` ; test statique `scripts/v284-007-guard-check.mjs`.
- **Contrôle actuel du release gate :** 3 manuscrits trouvés, 2 packs valides, 0 approbations, 2 vérités distinctes, `eligible=false`, `human_playtest_verified=false`. Le test `igr_v283_007_failclosed_smoke()` confirme que les lancements restent refusés, que le statut ne change pas et que les constructeurs privés sont fermés à `anon`.
- **Seuil impératif : 3/3 packs validés et 3/3 approbations**, vérités différentes, puis contrôles d'accès, gameplay multijoueur et vérification humaine. Aucun changement de statut éditorial n'a été forcé et aucune solution secrète n'a été copiée sur GitHub.
- **Publication maintenue bloquée** : variante C sans pack d'investigations ni trames exécutables, aucune validation éditoriale, aucun playtest humain 007. Ne pas basculer l'accès public ni fusionner cette PR avant levée de ces bloqueurs.

## Reprise v285 — audit et protection de l'expérience (23 octobre 2026)

- Deux archives privées de la variante C ont été retrouvées dans l'espace de fichiers de travail, dont `007_variante_C_integration_privee.zip`. Elles demeurent hors du dépôt public. L'archive d'intégration contient bien les 7 familles de champs v280 attendues et son SHA-256 canonique correspond au rapport de vérification. Audit local de structure : **3 cartes de suspects distinctes, 6 relations dirigées, 3 trames obligatoires (cycles 1/2/3), 9 investigations facultatives (3 par cycle), 3 axes de verdict et 3 niveaux de responsabilité**. Cette vérification n'est PAS une homologation humaine ou une preuve de persistance en base.
- Un auditeur hors ligne reproductible et non divulgateur (`scripts/v285-007-private-pack-audit.py`) est ajouté. L'archive privée est passée à cet audit structurel local avant intégration ; sa syntaxe est également contrôlée en CI. L'outil ne se connecte pas à Supabase et n'imprime ni cartes, ni révélations, ni solutions.
- Le catalogue client marque le dossier 007 **EN PRÉPARATION** : sélection, création de salon, lancement et choix automatique de prochain dossier empêchés. La protection serveur préexistante demeure l'autorité et ne doit pas être retirée avant 3/3 packs et 3/3 approbations.
- L'isolation de fonctions employée par les tests UI a nécessité des gardes locaux plutôt qu'une variable globale. Le changement a été corrigé après deux échecs de non-régression ; Cloudflare et l'écran ont ensuite été revérifiés sur la branche.
- Vérification serveur après ces corrections client : `eligible=false`, `found=3`, `valid=2`, `approved=0`, `human_playtest_verified=false`, RPC publique refusée à `anon`. `igr_v283_007_failclosed_smoke()` passe toujours.
- **Bloqueur externe non levé** : l'intégration du manuscrit C dans Supabase a été refusée auparavant. Ne pas réessayer par un chemin contournant le contrôle. Utiliser seulement une voie d'import explicitement autorisée et auditable, puis refaire la revue éditoriale et les tests réels à cinq joueurs.
- Le dossier 007 n'est **ni activé ni publié**. La PR #347 doit rester en brouillon tant que tous les contrôles de libération ne sont pas satisfaits.

## Revue éditoriale hors ligne v286 — candidat C renforcé

- Une seconde archive confidentielle C a été préparée **hors GitHub** avec une chronologie explicite, des preuves de provenance distinctes et une séparation entre mobile, mensonge, causalité et intention. Elle conserve les trois rôles Suspects, six relations dirigées, trois révélations garanties et neuf investigations au total (3/cycle).
- Un audit indépendant hors ligne sur ce **nouveau candidat**, comprenant intégrité SHA-256, unicité, mapping du verdict et cohérence des repères temporels, a passé **17/17 contrôles**. L'audit n'expose pas les solutions et **n'est pas un essai multijoueur**. L'archive originale C demeure inchangée et aucune variante n'a été écrasée dans Supabase.
- La validation de publication reste **REFUSÉE** côté serveur : 3 manuscrits présents, 2 packs valides, aucune approbation et `human_playtest_verified=false`. La nouvelle archive privée doit être examinée, approuvée et intégrée seulement par une voie d'écriture autorisée, puis vérifiée en conditions de jeu. Aucun contournement de la restriction Supabase n'est tenté.
- Les cinq contrôles CI du commit `b17cabbb` étaient verts au contrôle du 23 octobre : Cloudflare, Android, iOS, Store Readiness, Screen Layout. La PR conserve son statut DRAFT.

## Contrôle ciblé v287 — parité des variantes et dernière dépendance bloquante

- **A et B :** le constructeur réel de Supabase produit un objet privé avec 12 rubriques dont `suspects`, `trames`, `investigation_007` et `truth` ; chacune contient exactement **3 suspects, 3 trames garanties, 9 investigations**, avec un verdict JSON distinct. Vérification effectuée sans exposer les textes privés.
- **C :** le constructeur réel échoue avec l'erreur attendue `007 incomplete manuscript` sur la ligne manuscrit stockée dans Supabase. Ce n'est **pas** un défaut de l'archive privée renforcée ; c'est son absence dans le stockage autorisé. L'archive a séparément passé un audit hors ligne 17/17 et porte un choix distinct sur chacun des trois axes du verdict.
- **Permissions :** le rôle `anon` ne peut exécuter aucune des quatre fonctions privées du 007 ni l'investigation RPC. Le `service_role` conserve l'accès spécifique au RPC d'investigation ; les fonctions du schéma `igr_private` ne doivent jamais être exposées par le Data API.
- **Salons réels 007 :** zéro salon, aucun faux playtest déclaré. Smoke serveur de refus sans libération : succès.
- **GO / NO-GO confirmé : NO-GO** : `found=3`, `valid=2`, `approved=0`, `truths_distinct=2`, `human_playtest_verified=false`, `eligible=false`.
- L'intégration de C doit être exécutée par une voie de modification autorisée par le gestionnaire du projet et approuvée éditorialement ; le contrôle de sécurité ayant refusé les écritures précédentes ne doit pas être contourné. Les simulations 48 parties et les essais humains doivent suivre cette intégration, **avant** d'ouvrir le RPC, fusionner la PR ou déployer.
- Ne pas passer le dossier 007 à `published` et ne pas prétendre que le dossier 008 est démarré dans le cadre de ce lot tant que le GO réel n'est pas établi.

## Audit de causalité v288 — 23 octobre 2026

- Relecture du candidat C v286 : **défaut éditorial identifié**. Les horaires de présence et la trace d'enveloppe permettaient de situer le gardien, mais pas d'attribuer solidement le **contact qui provoque la chute**. Pour un jeu de reconstitution factuelle, le verdict aurait pu être perçu comme arbitraire si le camp Enquête n'avait choisi aucune investigation précise.
- Candidat privé corrigé **v288** (archive locale `007_variante_C_validee_structure_v288_privee.zip` ; **ne jamais ajouter l'archive ni ses contenus secrets à GitHub**) : le troisième cycle obligatoire apporte des indices médico-légaux concordants, reliés à une source matérielle indépendante. Le résultat distingue toujours un acte causal documenté d'une intention homicide non établie. Deux investigations facultatives complètent la preuve sans devenir indispensables.
- Audit autonome du candidat v288 : **24/24 contrôles réussis** pour le SHA-256, l'identité A/B/C, les trois fiches, six relations dirigées, trois trames, neuf investigations réparties par cycle, repères temporels, lien causal, caractère non obligatoire des investigations et correspondance des trois axes de verdict. L'empreinte SHA-256 canonique du contenu JSON privé est `f10fb7f371da88fe81b16c57ebdeb2b6739d2224a3a202db2008daecc86e74e7`. Le rapport est exempt de spoilers.
- Audit **limité au manuscrit hors ligne**. Il ne prouve ni son import dans Supabase, ni le fonctionnement à cinq joueurs, ni la validation humaine, ni la publication.
- Contrôle serveur après correction privée : `found=3`, `valid=2`, `approved=0`, `eligible=false`, `human_playtest_verified=false`. Le test fail-closed réussit toujours et les privilèges du RPC restent révoqués pour `anon` et `authenticated`.
- **NO-GO strict maintenu.** Exiger une intégration privée explicitement autorisée, 3/3 packs reconnus par le constructeur, une revue éditoriale, des essais réels de synchronisation/rôles/enquête/verdict à cinq personnes, puis 3/3 approbations réelles avant toute fusion ou publication.
