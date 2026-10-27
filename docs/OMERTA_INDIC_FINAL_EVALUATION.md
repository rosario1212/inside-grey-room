# OMERTÀ vNext — contrat de l'Indic, version de publication en préparation

**Statut : PR #380 en brouillon ; aucune migration appliquée en production ; variantes A/B/C en révision.**

## Contrat lisible par tous les joueurs

Après son pacte secret accepté, l'Indic a trois exigences pour gagner :

1. **Sauver ses intérêts** : obtenir une protection officielle accordée par l'Enquêteur OU une remise de peine d'au moins trois ans, selon les actions documentées par le serveur.
2. **Rendre service à l'Enquête** : si l'Enquêteur répond **Oui, cette source m'a été utile** à la fin, la condition est **validée même sans aucune des trois cartes consignées**. Sinon, une information canonique officiellement transmise et jugée admissible par les règles serveur peut aussi valider cette condition. L'avis **Non** ne peut pas effacer une preuve admissible.
3. **Rester en vie** à la conclusion.

La réponse **Oui** est donc une validation positive voulue par le concepteur, mais elle **ne donne pas une victoire automatique** : les conditions personnelles et de survie doivent encore être remplies. L'Enquêteur ne peut pas utiliser une réponse « Non » pour annuler un renseignement déjà reconnu par le serveur.

## Oral d'abord, jamais de téléphone obligatoire avant de parler

- L'Enquêteur propose un pacte privé, le suspect accepte ou refuse. Rien de public.
- L'Indic possède exactement **trois sujets abrégés**, choisis dans son propre dossier et visibles dans son espace confidentiel. Il connaît leurs détails via sa carte personnelle ; le rappel détaillé peut être replié.
- L'Indic peut parler avant toute manipulation. Il peut aussi presser **« Je souhaite en parler »** pour prévenir discrètement l'Enquêteur d'un sujet ; cela n'est pas une transmission et ne donne aucun point.
- Après un échange oral, il peut presser **« J'en ai déjà parlé »** : le serveur vérifie la carte et transmet le renseignement canonique dans le fil privé du camp Enquête (pilote : Enquêteur). Une seule consignation officielle par cycle, pas de doublons.
- À la fin d'un cycle, un bref rappel « As-tu partagé une information ? » apparaît uniquement à la source **qui n'a rien consigné durant ce cycle**. Répondre « Oui » ouvre son onglet, sans affirmer qu'elle a divulgué une information précise. Aucun rappel si c'est déjà enregistré.

## Négociation de protection

La protection peut être négociée **à l'oral**. L'Enquêteur la confirme par un clic privé « Protéger mon Indic », sans obliger la source à passer par l'ancien système de révélations de niveau 1/2/3. Cette protection donne accès à la condition personnelle, mais pas à la seconde condition et ne remplace jamais la survie.

Une autre voie personnelle est une réduction de peine enregistrée d'au moins trois ans ; elle conserve une prise de risque.

## Écran final de l'Enquêteur

Pendant la phase de verrouillage, avant sa décision définitive :

> Cet Indic vous a-t-il réellement été utile ?

**Oui, cette source m'a été utile** / **Non, elle ne m'a pas été utile**.

Ce jugement est confidentiel, attaché à la source recrutée et enregistré une seule fois. Après le verrouillage final, plus de modification. Si l'Enquêteur n'a pas donné son avis, le jeu regarde les informations officiellement consignées et éligibles. Les discussions orales ne sont jamais présentées par le serveur comme « comprises » ou enregistrées automatiquement.

## Contrôles serveur

Authentification par token, source réellement recrutée, droits de rôle, phase, scénario 021–025, numéro de partie, confidentialité des événements, aucune source nouvelle après conclusion, vérification des renseignements et déduplication. Les essais fonctionnels sous `BEGIN/ROLLBACK` sur les cinq dossiers canoniques ont réussi. Le scénario 022 a confirmé une **victoire complète** avec protection négociée + avis positif + survie, **sans transmission d'aucune carte**.

## Ce qui empêche encore la publication complète

Les 15 manuscrits A/B/C existent, mais leur état est `review`. **0 approbation éditoriale** et **0 provenance de preuve finale vérifiée** pour chacun des cinq dossiers. Le verrou de saga ne doit pas être forcé. Le raccordement du moteur des variantes, l'audit humain, le playtest multijoueur et le déploiement contrôlé restent nécessaires. Voir `OMERTA_VNEXT_RELEASE_AUDIT_20261027.md`.

**Ne pas confondre** le moteur canonique 021–025 (sur lequel les essais SQL ont réussi) et les quinze variantes A/B/C non publiées.
