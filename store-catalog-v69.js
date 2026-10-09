/* Inside Grey Room v69 — canonical commercial catalogue.
   Business model: the HOST owns the permanent licence. Guests never need
   to buy the DLC to join a room created by a licensed host.
*/
(()=>{
  'use strict';

  const products={
    omerta:{
      key:'omerta',
      label:'OMERTÀ',
      type:'non_consumable',
      entitlement:'host',
      priceChf:3,
      fallbackPrice:'CHF 3.–',
      iosProductId:'com.insidegreyroom.game.omerta',
      androidProductId:'igr_dlc_omerta'
    },
    terror:{
      key:'terror',
      label:'TERREUR',
      type:'non_consumable',
      entitlement:'host',
      priceChf:2,
      fallbackPrice:'CHF 2.–',
      iosProductId:'com.insidegreyroom.game.terror',
      androidProductId:'igr_dlc_terror'
    },
    cartel:{
      key:'cartel',
      label:'CARTEL',
      type:'non_consumable',
      entitlement:'host',
      priceChf:2,
      fallbackPrice:'CHF 2.–',
      iosProductId:'com.insidegreyroom.game.cartel',
      androidProductId:'igr_dlc_cartel'
    },
    regime:{
      key:'regime',
      label:'LE RÉGIME',
      type:'non_consumable',
      entitlement:'host',
      priceChf:2,
      fallbackPrice:'CHF 2.–',
      iosProductId:'com.insidegreyroom.game.regime',
      androidProductId:'igr_dlc_regime'
    },
    heritage:{
      key:'heritage',
      label:'HÉRITAGE',
      type:'non_consumable',
      entitlement:'host',
      priceChf:15,
      fallbackPrice:'CHF 15.–',
      iosProductId:'com.insidegreyroom.game.heritage',
      androidProductId:'igr_mode_heritage'
    }
  };

  for(const product of Object.values(products))Object.freeze(product);
  const catalogue=Object.freeze({
    version:'69.0-host-pays',
    currency:'CHF',
    model:'host_pays_guests_free',
    products:Object.freeze(products),
    product:key=>products[String(key||'').trim().toLowerCase()]||null,
    keys:Object.freeze(Object.keys(products))
  });

  window.IGR_STORE_CATALOG=catalogue;
})();
