# Inside Grey Room — Release Candidate 1 (v68)

## Objectif
Transformer la bêta mobile actuelle en base commercialisable sans ajouter de nouvelles mécaniques.

## Couche RC1
- `release-polish-v68.css` est chargée en dernier sur web et mobile.
- Safe areas iPhone, cibles tactiles, focus clavier, formulaires mobiles et réduction des animations sont normalisés.
- L'ancien libellé visuel « Bêta 12.11.0 » est retiré de la présentation finale.
- Le cache PWA/service worker reçoit une révision RC dédiée.
- `release-candidate-v68-check.mjs` contrôle la marque, les assets locaux, la présence de la couche RC et la séparation du commerce natif.

## Discipline de release
À partir de cette RC, aucun nouveau système de gameplay n'est ajouté avant publication sauf s'il corrige un blocage critique. Les changements admis sont :
1. bug bloquant ou perte d'état ;
2. incohérence de règle déjà définie ;
3. problème UI/UX ou accessibilité ;
4. sécurité/confidentialité ;
5. conformité App Store / Play Store ;
6. performance ou crash.

## Blocages externes avant vente
- tests physiques iPhone et Android ;
- StoreKit 2 et Google Play Billing réellement branchés si des contenus numériques payants sont exposés ;
- restauration d'achats et validation serveur des reçus ;
- métadonnées App Store / Play Console, captures, classification d'âge et formulaires de confidentialité ;
- signature/distribution par les comptes développeur du propriétaire.

## Critère de sortie
La v1.0 n'est candidate à la soumission publique que si :
- les workflows iOS, Android, Store Readiness, sécurité et Cloudflare passent ;
- un playtest complet peut finir une partie courte et une partie longue sans intervention technique ;
- reprise réseau, arrière-plan, fermeture/réouverture et changement Wi-Fi/cellulaire sont validés sur appareils réels ;
- aucun achat, droit premium ou restauration ne peut être obtenu par un chemin non vérifié dans les builds natifs.
