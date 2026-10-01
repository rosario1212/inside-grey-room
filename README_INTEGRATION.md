# Inside Grey Room — v13.3 HÉRITAGE + Startup Stability

## Portée

Patch **additif** pour la base v13.2 actuelle. Il ne remplace ni `app-v11.js`, ni les scénarios 001–034, ni OMERTÀ / TERREUR / CARTEL / LE RÉGIME.

Ce bundle ajoute uniquement :

1. une entrée **HÉRITAGE** sous **Créer une partie** sur l’accueil ;
2. le socle de campagnes persistantes **CENDRES** et **KUROI** ;
3. les deux mécaniques persistantes :
   - CENDRES → dossier / réseau CERBÈRES + état de crise ;
   - KUROI → arbre des groupes + registre des dettes + chronique ;
4. les 5 dossiers de chaque campagne dans leur ordre validé ;
5. une sauvegarde locale versionnée, exportable/importable par API ;
6. un correctif de l’écran de Porte sur iPhone : visuel remonté, bouton ENTRER abaissé, davantage d’air ;
7. une stabilisation WebAudio : un seul réveil concurrent, reprise après l’entrée et après retour au premier plan, sans nouvel intervalle.

## Important — ce que ce patch ne prétend pas faire

Il pose le **moteur Héritage et son interface**, sans inventer automatiquement les cartes privées, preuves et vérités des dix dossiers. Les packs de gameplay narratif doivent être branchés ensuite sur `IGR_HERITAGE` afin de respecter la règle actuelle d’Inside Grey Room : aucune preuve ou vérité ne doit être générée pour combler un contenu non écrit.

Le patch est donc volontairement sans modification du moteur 001–034 : c’est ce qui limite le risque de régression.

## Installation

À la racine du dépôt actuel :

1. copier le contenu de ce bundle en conservant `assets/`, `scripts/` et `docs/` ;
2. exécuter :

```bash
node scripts/install-v13-3-heritage.mjs
node scripts/verify-v13-3-heritage.mjs
```

3. puis lancer les validations existantes :

```bash
npm run build
npm run store:check
```

4. tester sur iPhone PWA : lancement, ENTRER, musique, verrouillage / retour, accueil, HÉRITAGE, retour accueil.

L’installateur est idempotent : il peut être exécuté deux fois sans dupliquer les balises.

## Architecture de l’accueil

- Créer une partie
- **Héritage**
- Rejoindre une partie
- Règles du jeu
- Profil

OMERTÀ reste un DLC et ne passe pas dans Héritage.

## Campagnes

### CENDRES — 5 dossiers

1. PERSONNE N’EXISTE
2. 04:17
3. LA CHAMBRE
4. CENDRES
5. POINT ZÉRO

Objet persistant : **ce que le groupe sait**. Les intégrations de scénario écrivent les identités, classifications, connexions et événements de crise via l’API CENDRES.

### KUROI — 5 dossiers

1. L’OYABUN
2. GIRI
3. LES MAINS SALES
4. LA DETTE
5. LE CONSEIL

Objet persistant : **ce que le groupe doit et à qui**. Les intégrations de scénario écrivent membres, dettes et chronique via l’API KUROI.

## API d’intégration

Voir `docs/HERITAGE_ENGINE.md`.
