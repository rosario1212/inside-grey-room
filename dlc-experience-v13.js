(()=>{
'use strict';
const mechanics=Object.freeze({
  '021':Object.freeze({dlc:'omerta',signature:"LE CERCLE SE RESSERRE"}),
  '022':Object.freeze({dlc:'omerta',signature:"RECONSTITUTION DE L’ORDRE"}),
  '023':Object.freeze({dlc:'omerta',signature:"LA CHAISE VIDE"}),
  '024':Object.freeze({dlc:'omerta',signature:"LE POINT DE NON-RETOUR"}),
  '025':Object.freeze({dlc:'omerta',signature:"LA CHAÎNE DES ORDRES"}),
  '026':Object.freeze({dlc:'terror',signature:"LE PÉRIMÈTRE"}),
  '027':Object.freeze({dlc:'terror',signature:"VRAI ≠ SINCÈRE"}),
  '028':Object.freeze({dlc:'terror',signature:"DERNIÈRE LIAISON"}),
  '029':Object.freeze({dlc:'cartel',signature:"SOURCE SOUS PRESSION"}),
  '030':Object.freeze({dlc:'cartel',signature:"MOTIF ÉCRIT"}),
  '031':Object.freeze({dlc:'cartel',signature:"L’ENGAGEMENT"}),
  '032':Object.freeze({dlc:'regime',signature:"ARCHIVES FRAGMENTÉES"}),
  '033':Object.freeze({dlc:'regime',signature:"QUI DÉCIDAIT VRAIMENT ?"}),
  '034':Object.freeze({dlc:'regime',signature:"IDENTITÉ FONCTIONNELLE"}),
});
const worlds=Object.freeze({
 omerta:Object.freeze({label:'FAMIGLIA',fields:['active','protected','missing','dead','circle']}),
 terror:Object.freeze({label:'VILLE',fields:['districts_controlled','districts_total','perimeter','liaison'],abstractMap:true}),
 cartel:Object.freeze({label:'PRESSION',fields:['witnesses_available','witnesses_total','integrity','protection']}),
 regime:Object.freeze({label:'APPAREIL',fields:['archives_open','archives_total','power_chain','identities_confirmed','identities_total'],rotatingCodenames:true})
});
window.IGR_V13_DLC_EXPERIENCE=Object.freeze({version:'13.1-final',mechanics,worlds,replayContractsPath:'scenario-replay-contracts-v13.json'});
})();