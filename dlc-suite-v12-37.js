/* Inside Grey Room — DLC suite v12.44
   Per-player DLC ownership for TERREUR / CARTEL / LE RÉGIME, compact filters, stable themes. */
(() => {
  'use strict';

  const FILTER_KEY='igr_scenario_filter_v1237';
  const DLC_FILTER_KEY='igr_dlc_filter_v1237';
  const IDENTITY_KEY='igr_social_identity_v1';
  const CARTEL_IDS=new Set(['029','030','031']);
  const REGIME_IDS=new Set(['032','033','034']);
  const PREMIUM_IDS=new Set(['026','027','028','029','030','031','032','033','034']);
  const DLC_IDS=new Set(['021','022','023','024','025','026','027','028','029','030','031','032','033','034']);
  const DLC_ACCESS={loaded:false,items:{},loading:null};

  const CARTEL=[
    {id:'029',title:'LE CYCLE MORT',short:'L’enquête touche un réseau qui ne se contente plus de cacher ses crimes : il commence à frapper ceux qui posent les questions.',context:'Le dossier s’ouvre sur un premier homicide destiné à neutraliser la dynamique de l’enquête. Les trois suspects ne se valent pas : l’un profite, l’autre couvre, le troisième lance la spirale.',mood:'Pression · réseau · représailles.',min:5,max:8,sound:'threat',mechanics:['Intimidation','Érosion de l’enquête','Violence réseau']},
    {id:'030',title:'LA COUR ACHETÉE',short:'Les preuves existent. Le problème est de savoir ce qu’elles valent encore quand ceux qui doivent les porter ont eux-mêmes un prix.',context:'L’enquête remonte vers un réseau d’influence qui corrompt ceux censés protéger la procö��q�^