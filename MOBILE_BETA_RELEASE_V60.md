# Inside Grey Room — bêta mobile 12.11.0

Statut : corrections préparées pour distribution de test. La validation physique multi-appareils et la soumission aux stores restent à réaliser par le propriétaire des comptes. Aucune certification Apple/Google n’est revendiquée.

## Version et périmètre

- Version interne : 12.11.0 ; version publique des binaires : 1.0.0 ; premier numéro de build proposé : 121100. Incrémenter le build à chaque nouvel envoi, même si la version reste identique.
- Distribution iOS : TestFlight. Distribution Android : test interne, puis test fermé.
- Interrogatoire : 6 minutes dans les deux modes. Les estimations court/long s’adaptent à la composition des rôles et excluent pauses et attentes manuelles.
- Juge : six protections par partie, contrôlées côté serveur ; utiliser une quatrième protection n’entraîne pas automatiquement de défaite.
- Paiements natifs : non activés. Les extensions ne doivent pas être vendues dans cette bêta sans intégration StoreKit/Play Billing, validation serveur et restauration. Les droits de test préexistants restent contrôlés par le serveur ; aucun déverrouillage global n’a été ajouté.
- Signaler un problème : lien en bas de l’application vers le support. Ne transmettre aucune clé privée, jeton, carte secrète ou information personnelle d’un autre joueur.

## Construire et distribuer

### Android

1. Dans les secrets GitHub du dépôt, renseigner `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`. Conserver la clé de signature hors du dépôt et de la conversation.
2. Lancer **Android Play Bundle** sur le commit de release avec `version_name=1.0.0` et `version_code=121100` (ou un nombre supérieur déjà utilisé).
3. Télécharger l’artefact signé `inside-grey-room-play-aab`, créer une application `com.insidegreyroom.game` dans Play Console et charger l’AAB sur la piste de test interne.
4. Remplir accès à l’application, sécurité des données, classification, confidentialité et suppression de compte avec le comportement réel. Donner au reviewer l’accès aux extensions qui doivent être testées.
5. Passer au test fermé et réaliser les conditions de test applicables au compte avant de demander la production. Pour certains nouveaux comptes personnels : 12 testeurs inscrits pendant 14 jours continus.

### iOS

Sur un Mac avec Xcode 26+/SDK iOS 26+, Node 22 et un compte Apple Developer :

```sh
npm ci
IOS_MARKETING_VERSION=1.0.0 IOS_BUILD_NUMBER=121100 npm run ios:sync
npm run ios:open
```

Sélectionner la Team propriétaire pour `com.insidegreyroom.game`, puis **Product → Archive → Distribute App → App Store Connect**. Dans App Store Connect, créer la fiche, compléter confidentialité/classification, distribuer d’abord aux testeurs internes TestFlight, puis soumettre au Beta App Review pour les testeurs externes. Les builds CI sans signature prouvent la compilation ; ils ne sont pas des IPA distribuables.

## Critères avant sortie publique

| Contrôle | Exigence |
|---|---|
| Appareils | Au moins un iPhone physique et deux Android physiques ; petit écran et réseau mobile inclus |
| Partie complète | Court et long, de la création au résultat ; noter durée réelle et temps de pauses séparément |
| Finale | Audience, défense, verdict, journaliste, absence/reconnexion ; tous les onglets restent accessibles |
| Vie privée | Chaque joueur ne voit que sa carte ; clés et jetons absents des captures et retours de test |
| Permissions | Refus/acceptation caméra et micro ; retour arrière-plan ; aucune captation après quitter |
| Modération | Tester signalement, blocage, suppression et récupération du compte ; assurer une revue humaine des signalements |
| Réseau | Perte réseau et reconnexion, changement Wi-Fi/mobile, hôte absent, retour après verrouillage écran |
| Accessibilité | Grossissement texte, VoiceOver/TalkBack, clavier, mouvement réduit et cibles tactiles |
| Commerce | Bêta sans vente ; toute vente publique requiert paiement natif, restauration et validation des droits |
| Publication | Captures fidèles, support joignable, textes légaux validés par l’éditeur, déclarations stores exactes |

Les estimations ne garantissent pas le temps réel lorsque les joueurs prolongent les discussions. Consigner plusieurs parties et ajuster les temps de parole selon les mesures, sans réduire l’interrogatoire de six minutes demandé.

## Retour bêta

Dans Support : indiquer version/build, appareil/OS, mode court/long, nombre de joueurs, phase, étapes exactes, résultat attendu/observé et fréquence. Joindre une capture avec codes/identités/cartes privées masqués. Un problème bloquant la finale, une fuite de carte, une perte de compte ou une permission média ignorée bloque la sortie publique.

Sources officielles :
- https://developer.apple.com/app-store/review/guidelines/ (bêtas via TestFlight, accès reviewer, modération)
- https://support.google.com/googleplay/android-developer/answer/14151465 (conditions de test des nouveaux comptes personnels)
