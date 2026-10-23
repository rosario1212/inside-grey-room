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
