# Dossier 007 — LE TESTAMENT GRIS · Contrat de publication

**Statut : PR de préparation uniquement — ne pas fusionner tant que le serveur n'est pas prêt.**

## Identité
Cinq joueurs obligatoires : un Enquêteur, un Analyste et trois Suspects. Le procès reconstitue l'ordre des rencontres, le document à l'origine du dernier conflit, la chute et les mensonges. La signature d'un testament, une dette ou une filiation alléguée sont des pistes ; elles ne prouvent pas à elles seules un acte violent.

## Trois récits A/B/C
Chaque variante doit contenir trois cartes privées, six confrontations dirigées entre les trois suspects, trois révélations obligatoires réparties sur les cycles 1/2/3, neuf investigations facultatives (3 par cycle) et une conclusion propre. Ne pas recopier une solution dans le dépôt public.

## API sécurisée à créer avant activation
- Un **release gate** privé vérifie l'intégrité et l'approbation des trois manuscrits, leurs packs valides, leur confidentialité et la présence de trois vérités distinctes. En l'absence d'une seule variante, **ne pas activer de tirage automatique**.
- Tirage A/B/C aléatoire côté serveur au démarrage d'une partie, et snapshot immuable lié au salon ; le même snapshot sert aux cartes, événements, reprise de connexion et verdict.
- Les investigations 007 sont accessibles aux seuls Enquêteurs/Analystes via un RPC contrôlé **non encore installé** : `igr_v282_007_investigate`, avec authentification par token du participant et contrôle atomique d'un seul choix pour tout le camp Enquête par cycle. Les titres et résultats non choisis restent secrets.
- La synchronisation expose uniquement les trois **titres** des investigations du cycle en cours au camp Enquête et un drapeau d'utilisation ; ne renvoie jamais la solution canonique pendant la partie.
- `igr_v4_lock_final` accepte et valide `reconstruction_007` pour Enquêteur et Analyste : `cause`, `actor`, `decoy`. Cette reconstitution est obligatoire et n'est révélée/corrigée qu'à la fin.
- Les rôles Suspects ne voient jamais les choix ni le contenu privé du camp Enquête.
- Aucune mécanique d'avocat, juge ou procureur n'est ajoutée : le format à cinq joueurs demeure.

## État technique vérifié
- Variantes A et B : 3 indices et 9 investigations chacune, packs valides.
- Variante C : manuscrit de base présent, mais intégration éditoriale bloquée par les contrôles d'accès ; **pack v280 non valide**.
- Constructeur privé `igr_v280_007_build_pack` créé et inaccessible directement aux joueurs.
- Interface de la PR : **préparée, non opérationnelle sans les RPC et le release gate ci-dessus**.

## Critères avant fusion
1. Appliquer C par un chemin de modification **explicitement autorisé** ; ne pas contourner les contrôles de sécurité.
2. Valider A/B/C, intégrité, permissions et fail-closed avant d'autoriser le premier nouveau tirage.
3. Simuler 48 départs multijoueurs à 5 joueurs : aucun doublon de rôle, distribution sur A/B/C et zéro salon de test conservé.
4. Tester les trois cycles, les enquêtes privées, la reconnexion, le refus d'un second choix et le verdict correct/incorrect/invalide.
5. Vérifier les anciens scénarios 001 à 006.
6. Faire passer la CI Cloudflare, iOS, Android et mise en page, puis fusionner dans main et confirmer le commit publié sur le Worker de production.

**Ne jamais annoncer « 10/10 », « déployé », « sécurisé intégralement » ou « validé » tant que ces critères ne sont pas satisfaits.**
