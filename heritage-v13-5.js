(()=>{
'use strict';

const VERSION='13.5-heritage-integrated';
const STORAGE_KEY='igr_heritage_v1';
const MAX_HISTORY=120;
const CAMPAIGNS=Object.freeze({
  cendres:Object.freeze({
    id:'cendres', title:'CENDRES', subtitle:'Contre-espionnage · Vesper', cover:'assets/heritage-cendres-01-personne-n-existe.webp?v=v13.5-heritage',
    promise:'Retrouvez CERBÈRES avant que vos erreurs ne condamnent Vesper.',
    heritage:'Héritage de l’information',
    mechanic:'DOSSIER CERBÈRES',
    chapters:Object.freeze([
      Object.freeze({n:1,scenarioId:'035',title:'PERSONNE N’EXISTE',poster:'assets/heritage-cendres-01-personne-n-existe.webp?v=v13.5-heritage',thumb:'assets/heritage-cendres-01-thumb-v53.webp?v=v53-thumbs',note:'Un massacre. Une piste qui n’aurait jamais dû exister.'}),
      Object.freeze({n:2,scenarioId:'036',title:'04:17',poster:'assets/heritage-cendres-02-04-17.webp?v=v13.5-heritage',thumb:'assets/heritage-cendres-02-thumb-v53.webp?v=v53-thumbs',note:'Un faux drapeau transforme l’enquête en crise internationale.'}),
      Object.freeze({n:3,scenarioId:'037',title:'LA CHAMBRE',poster:'assets/heritage-cendres-03-la-chambre.webp?v=v13.5-heritage',thumb:'assets/heritage-cendres-03-thumb-v53.webp?v=v53-thumbs',note:'Captures, interrogatoires et informations impossibles à recouper.'}),
      Object.freeze({n:4,scenarioId:'038',title:'CENDRES',poster:'assets/heritage-cendres-04-cendres.webp?v=v13.5-heritage',thumb:'assets/heritage-cendres-04-thumb-v53.webp?v=���q�^