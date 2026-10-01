# HÉRITAGE v13.3 — contrat d’intégration

Le moteur expose `window.IGR_HERITAGE`.

## Lecture

```js
IGR_HERITAGE.get('cendres')
IGR_HERITAGE.get('kuroi')
```

Une campagne n’existe pas tant que `begin(id)` n’a pas été appelée.

## Fin de dossier

```js
IGR_HERITAGE.completeChapter('cendres', 1, { crisisDelta: 1, flags: { sourceAAlive: true } })
IGR_HERITAGE.completeChapter('kuroi', 1, { flags: { policeAlliancePublic: false } })
```

Le moteur refuse de terminer un dossier futur qui n’est pas encore déverrouillé.

## CENDRES

```js
IGR_HERITAGE.cendres.upsertNode({
  id: 'agent-volkov',
  label: 'VOLKOV',
  kind: 'diplomate',
  status: 'watch', // unknown | watch | cleared | agent | missing | dead
  chapter: 1,
  note: 'Présent avant l’incident.'
});

IGR_HERITAGE.cendres.link('agent-volkov', 'cellule-04', 'contact indirect');
IGR_HERITAGE.cendres.addCrisisEvent('Mobilisation à la frontière', 1);
IGR_HERITAGE.cendres.setCountdown({label:'POINT ZÉRO', deadline:'...'});
```

La classification est un fait persistant ; elle ne doit pas être calculée depuis le comportement humain des joueurs.

## KUROI

```js
IGR_HERITAGE.kuroi.upsertClanMember('kurokawa', {
  id:'kenji', name:'Kenji', role:'Wakagashira', status:'active'
});

const debt=IGR_HERITAGE.kuroi.addDebt({
  type:'on', // on | giri
  from:'Arakida',
  to:'Kurokawa',
  reason:'Une vie a été sauvée au dossier 02',
  status:'due',
  private:false
});

IGR_HERITAGE.kuroi.updateDebt(debt.id,{status:'paid'});
IGR_HERITAGE.kuroi.addChronicle('Un Kurokawa a subi un yubitsume.', 'public');
```

Les dettes ne sont jamais converties en points abstraits.

## Sauvegardes

- stockage : `localStorage`, clé `igr_heritage_v1` ;
- schéma versionné ;
- données bornées pour éviter une croissance illimitée ;
- `exportCampaign(id)` renvoie le JSON ;
- `importCampaign(id,json)` valide le type de campagne avant import.

Pour une future synchronisation serveur, conserver cette structure JSON comme payload canonique et utiliser une version optimiste ; ne jamais exposer les cartes privées ou vérités futures dans l’état public Héritage.
