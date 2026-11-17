/* v106 — role-safe public dossier / confidential fiche / in-phase actions.
   Requires igr_v106_common_dossier RPC. NO secret manuscript is bundled. */
(()=>{
'use strict';
const V='v106';
const S=()=>{try{return typeof STATE!=='undefined'?STATE:window.STATE}catch{return window.STATE}};
const game=()=>S()?.sync||null;
const role=()=>game()?.player?.public_role||S()?.role||'';
const AUTH=new Set(['enqueteur','analyste','procureur','juge','inspecteur','expert']);
const isInquiry=()=>AUTH.has(role());
const tr=(fr,en)=>window.IGR_LOCALE==='en'?en:fr;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeCycle=v=>[1,2,3].includes(Number(v))?Number(v):null;

// v774: concise, reversible card previews; original evidence remains accessible.
// v775 — precise references grounded in each dossier, never guessed character names.
// Entries require an exact evidence-source phrase: variant A/C are not rewritten as B.
const case004Copy=[
 {
  source:'Deux messages adressés à des destinataires différents arrivent après la rupture du premier suspect.',
  copy:'Après la fin de la dispute entre Sofia et son ex-partenaire, Sofia envoie un message à son ami proche et un autre au proche du quartier. Les messages ne sont pas identiques.'
 },{
  source:'Les journaux des deux appareils attestent un échange téléphonique entre les destinataires',
  copy:'Après avoir chacun reçu un message de Sofia, son ami proche et le proche du quartier se sont appelés. Les relevés montrent l’appel et sa durée, mais pas leurs paroles.'
 },{
  source:'Le journal prouve une conversation entre les deux destinataires des alertes.',
  copy:'Après les deux messages de Sofia, son ami proche et le proche du quartier se sont appelés. Aucun appel vers Sofia ou les secours n’apparaît ensuite dans les relevés.'
 },{
  source:'Les métadonnées des messages et la liste des destinataires ne montrent aucun transfert des deux alertes',
  copy:'Les relevés ne montrent pas que les deux messages envoyés par Sofia à son ami proche et au proche du quartier ont été transférés à son ex-partenaire. Il a pu être informé autrement.'
 },{
  source:"Les messages conservés entre les deux proches évoquent l'attente",
  copy:'L’ami proche de Sofia et le proche du quartier parlent d’attendre. Aucun message ne précise lequel devait contacter les secours ou aller chez Sofia.'
 },{
  source:"La comparaison des messages et des témoignages ne permet d'identifier aucune attribution explicite",
  copy:'Les échanges entre l’ami proche de Sofia et le proche du quartier ne désignent personne pour appeler les secours. Leurs déclarations doivent encore être comparées.'
 },{
  source:'Les journaux téléphoniques confirment que les destinataires se sont appelés',
  copy:'Les téléphones de l’ami proche de Sofia et du proche du quartier confirment qu’ils se sont appelés après les messages de Sofia. Les relevés ne donnent pas leurs paroles.'
 },{
  source:'Les messages échangés entre les deux proches évoquent',
  copy:'L’ami proche de Sofia et le proche du quartier ont parlé d’attendre, sans décider clairement lequel demanderait des secours ou rejoindrait Sofia.'
 },{
  source:"Le premier suspect avait eu des mots durs.",
  copy:'L’ex-partenaire de Sofia lui avait parlé durement. Rien ne prouve qu’il connaissait les deux messages ensuite envoyés à l’ami proche et au proche du quartier.'
 }
];
const case004Summaries={
 'deux alertes distinctes':'Après sa dispute avec son ex-partenaire, Sofia envoie deux messages différents : l’un à son ami proche, l’autre au proche du quartier.',
 'appel entre les proches':'L’ami proche de Sofia et le proche du quartier s’appellent après ses messages. Les relevés ne révèlent pas leurs paroles.',
 "l'appel entre proches":'L’ami proche de Sofia et le proche du quartier se sont appelés. Aucun contact avec Sofia ou les secours n’apparaît ensuite.',
 'journal des destinataires':'Aucun transfert des deux messages de Sofia à son ex-partenaire n’apparaît dans les relevés. Il a pu être informé autrement.',
 'messages de coordination':'L’ami proche de Sofia et le proche du quartier ont parlé d’attendre, sans décider lequel devait appeler les secours.',
 'un relais sans accord':'L’ami proche et le proche du quartier n’ont confié à personne la tâche d’appeler les secours.'
};
// v778 — identical wording in canonical packs and old room snapshots.
 // Strict original-text matching means a variant is never silently rewritten with another variant's facts.
const trameEditsV778=[{"scenario_id":"001","title":"CHRONOLOGIE DU PALIER","text":"À 02 h 11, Maël appelle l’ami à qui il réclame une dette. Cet ami semble quitter l’étage à 02 h 32. À 02 h 48, un autre visiteur entre dans l’hôtel. La chambre 222 n’est pas filmée.","new_title":"CHRONOLOGIE DU PALIER","original_text":"À 02 h 11, Maël appelle l’ami auquel il réclame sa dette. Une silhouette compatible avec cet ami quitte le palier à 02 h 32 ; un visiteur encapuchonné entre dans l’hôtel à 02 h 48. Aucune caméra ne filme l’intérieur de 222."},{"scenario_id":"001","title":"DETTE ET ENREGISTREMENT","text":"Des messages confirment la dette de l’ancien ami. Après 02 h 55, un enregistrement capte un ordre d’effacement et une lutte. Les voix restent difficiles à identifier.","new_title":"DETTE ET ENREGISTREMENT","original_text":"Des messages prouvent que l’ancien ami doit de l’argent à Maël. Une captation enregistrée après 02 h 55 contient l’ordre d’effacer quelque chose, puis des bruits de lutte. Les voix ne sont pas identifiables avec certitude."},{"scenario_id":"001","title":"DEUX ALTERCATIONS, UNE LAME","text":"Deux altercations ont eu lieu, avant 02 h 32 puis après 02 h 55. Un Opinel ensanglanté et essuyé est retrouvé dans une benne. Son porteur reste inconnu.","new_title":"DEUX ALTERCATIONS, UNE LAME","original_text":"Le désordre correspond à deux séquences distinctes : la première avant 02 h 32, la seconde après 02 h 55. Un Opinel ensanglanté et essuyé est retrouvé dans une benne de service. Ces constatations ne prouvent pas qui le portait au moment du coup."},{"scenario_id":"002","title":"APPELS IGNORÉS","text":"Plusieurs appels de Léon sont restés sans réponse le soir de sa mort, notamment ceux adressés au proche avec lequel sa relation était devenue conflictuelle.","new_title":"APPELS IGNORÉS","original_text":"Plusieurs appels de Léon restent sans réponse le soir de sa mort, dont certains destinés à B."},{"scenario_id":"002","title":"DERNIER REFUGE","text":"Léon cherchait encore du soutien auprès de ce même proche, malgré leur relation devenue difficile.","new_title":"DERNIER REFUGE","original_text":"Des messages montrent que Léon considérait encore B comme l'une des seules personnes capables de le comprendre."},{"scenario_id":"004","title":"PASSAGE DEVANT L'IMMEUBLE","text":"Une caméra montre une voiture ressemblant à celle du proche de Sofia qui habitait le quartier passer devant son immeuble.","new_title":"PASSAGE DEVANT L'IMMEUBLE","original_text":"Une caméra de rue montre un véhicule compatible avec celui de C passant devant l'immeuble."},{"scenario_id":"019","title":"LE DOSSIER ATTENDU","text":"La victime devait remettre des documents financiers au gala. Les copies récupérées ne concordent pas toutes sur les opérations concernées.","new_title":"LE DOSSIER ATTENDU","original_text":"La victime avait annoncé une remise de pièces financières; les copies disponibles ne coïncident pas toutes."},{"scenario_id":"019","title":"LE DISPOSITIF MODIFIÉ","text":"Des trajets et des accès techniques ont été modifiés pendant le gala. Les relevés ne précisent pas encore qui a demandé ces changements.","new_title":"LE DISPOSITIF MODIFIÉ","original_text":"Des déplacements et accès techniques ont changé pendant la soirée. Leur origine doit être vérifiée."},{"scenario_id":"019","title":"LES COPIES CONTRADICTOIRES","text":"Plusieurs versions des mêmes registres financiers circulent. Elles ne présentent pas toutes les mêmes informations.","new_title":"LES COPIES CONTRADICTOIRES","original_text":"Plusieurs versions des registres et des documents circulent; elles nécessitent des recoupements."},{"scenario_id":"020","title":"UN BÂTIMENT OCCUPÉ","text":"Les plans du Bal des Fondateurs prévoient plusieurs issues secondaires. Les journaux montrent que certaines ont été ouvertes avec retard.","new_title":"UN BÂTIMENT OCCUPÉ","original_text":"La capacité des passages et les règles de circulation exigent une vérification indépendante."},{"scenario_id":"020","title":"DES RÉSERVES À CONTRÔLER","text":"Des travaux de maintenance étaient encore en cours dans les locaux techniques avant l’incendie. Leur rôle exact dans sa propagation reste incertain.","new_title":"DES RÉSERVES À CONTRÔLER","original_text":"Plusieurs éléments techniques doivent être rapprochés des documents de préparation."},{"scenario_id":"020","title":"UNE CHRONOLOGIE À VÉRIFIER","text":"Les journaux du poste de sécurité montrent un délai entre les premiers signaux et l’alarme générale.","new_title":"UNE CHRONOLOGIE À VÉRIFIER","original_text":"Le traitement des alertes et la diffusion des instructions doivent être confrontés aux journaux."},{"scenario_id":"023","title":"L’APPEL","text":"Un appel confirme qu’Adriano Verri a été blessé. Il ne permet pas d’établir qui l’a attaqué ni la gravité exacte de ses blessures.","new_title":"L’APPEL","original_text":"Adriano Verri a été touché. Son état dépendra des décisions et protections prises autour de la Table."},{"scenario_id":"024","title":"CE QUI EST DÉJÀ CONNU","text":"Plusieurs faits que le détenu propose de révéler figurent déjà dans les pièces saisies par les enquêteurs.","new_title":"CE QUI EST DÉJÀ CONNU","original_text":"Une partie des informations proposées par le détenu figure déjà dans le dossier. Les répéter réduit peu la peine tout en pouvant augmenter son exposition."},{"scenario_id":"024","title":"LA PROTECTION","text":"Le détenu réclame une protection en échange de ses informations. Sa demande ne prouve pas qu’un accord a été accepté.","new_title":"LA PROTECTION","original_text":"La protection n’est pas automatique. Elle dépend d’un accord réellement accepté et de la valeur des informations fournies."},{"scenario_id":"025","title":"LES ORDRES","text":"Certaines décisions de Vittorio portent sa validation. D’autres lui sont attribuées sans qu’un ordre écrit ait été retrouvé.","new_title":"LES ORDRES","original_text":"Plusieurs décisions attribuées à Vittorio ne possèdent aucune formulation explicite. Il faut reconstruire ce qu’il a demandé, ce qu’il a seulement accepté et ce que ses hommes ont anticipé."},{"scenario_id":"025","title":"LES AUDIENCES","text":"Les décisions de protection et de sanction prises au sommet ne sont pas toutes accompagnées d’une instruction écrite.","new_title":"LES DÉCISIONS DU DON","original_text":"Le Don peut convoquer un membre, l’écouter puis décider de le protéger, le surveiller, l’écarter ou autoriser une sanction. Il ne reçoit pas pour autant la vérité privée de ce joueur."},{"scenario_id":"025","title":"LE SOMMET","text":"Des hommes de Vittorio ont commis des violences sans ordre écrit. D’autres actes sont directement liés à ses validations.","new_title":"LE SOMMET","original_text":"Les dossiers précédents convergent vers le même paradoxe : plus le pouvoir est élevé, moins les ordres doivent être explicites."},{"scenario_id":"027","title":"DÉTENTION CLANDESTINE","text":"Des témoins décrivent des mauvais traitements dans l’appareil de détention du FDR où travaillait l’un des suspects.","new_title":"DÉTENTION CLANDESTINE","original_text":"Des témoignages concordants confirment que des prisonniers ont été détenus et maltraités sous l’autorité du deuxième suspect."},{"scenario_id":"027","title":"SOURCE TROP PRÉCISE","text":"Le cadre supérieur du FDR donne des détails précis sur les dirigeants rivaux, mais presque rien sur ses propres alliés.","new_title":"SOURCE TROP PRÉCISE","original_text":"Le troisième suspect fournit spontanément plusieurs détails exacts sur des cadres rivaux, mais beaucoup moins sur ses propres proches."},{"scenario_id":"027","title":"INTÉRÊT PERSONNEL","text":"Un échange ancien montre que le cadre supérieur du FDR considérait déjà ces dirigeants comme ses rivaux.","new_title":"INTÉRÊT PERSONNEL","original_text":"Un échange antérieur prouve que le troisième suspect considérait déjà les cadres de la zone comme ses principaux rivaux."},{"scenario_id":"027","title":"LA VÉRITÉ PEUT ÊTRE UNE ARME","text":"Les renseignements du cadre supérieur sont souvent exacts, mais concernent surtout ses rivaux. Ses propres alliés y apparaissent peu.","new_title":"LA VÉRITÉ PEUT ÊTRE UNE ARME","original_text":"La majorité des informations livrées par le troisième suspect sont factuellement exactes. Leur sélection, elle, favorise systématiquement la disparition de ses rivaux."},{"scenario_id":"028","title":"LE TROISIÈME ATTEND","text":"Le cadre resté fidèle au FDR ne demande aucune protection malgré la menace sur le périmètre. Il affirme pourtant n’être qu’un exécutant.","new_title":"AUCUNE DEMANDE DE PROTECTION","original_text":"Le troisième suspect ne demande ni protection ni évacuation malgré la dégradation du périmètre. Son calme n’établit rien, mais il contredit son récit de simple exécutant."},{"scenario_id":"029","title":"PAIEMENT APRÈS LES FAITS","text":"Un transfert financier effectué après l’exécution relie l’intermédiaire financier au réseau.","new_title":"PAIEMENT APRÈS LES FAITS","original_text":"Un transfert financier est effectué après une exécution et relie le premier suspect au réseau."},{"scenario_id":"029","title":"ORDRE AMBIGU","text":"Le responsable local a envoyé un message demandant de « faire peur », sans préciser jusqu’où aller.","new_title":"ORDRE AMBIGU","original_text":"Un message du deuxième suspect demande de faire peur sans préciser la violence attendue."},{"scenario_id":"029","title":"COOPÉRATION","text":"L’exécutant devenu coopérant a indiqué un lieu dont l’existence a été vérifiée.","new_title":"COOPÉRATION","original_text":"Le troisième suspect livre un lieu vérifiable et gagne en crédibilité."},{"scenario_id":"031","title":"LE DOSSIER","text":"Les pièces réunies sur la mort des six agents ne suffisent pas encore à répartir les responsabilités entre les trois chefs arrêtés.","new_title":"RESPONSABILITÉS À ÉTABLIR","original_text":"Recoupez les déclarations des trois chefs avec les pièces reçues par le bureau."},{"scenario_id":"032","title":"LISTE SIGNÉE","text":"Une liste d’arrestations porte la signature du chef administratif.","new_title":"LISTE SIGNÉE","original_text":"Une liste d’arrestations porte la signature du premier suspect."},{"scenario_id":"032","title":"DÉTENTION PROLONGÉE","text":"Des registres montrent que le responsable de la sécurité a validé des prolongations de détention sans ordre écrit.","new_title":"DÉTENTION PROLONGÉE","original_text":"Des registres montrent des prolongations sans ordre écrit validées par le deuxième suspect."},{"scenario_id":"032","title":"NOTE DU PALAIS","text":"Une note du conseiller du palais désigne un opposant comme cible prioritaire.","new_title":"NOTE DU PALAIS","original_text":"Une note du troisième suspect désigne un opposant comme priorité."},{"scenario_id":"032","title":"CORRECTION MANUSCRITE","text":"Le chef administratif a modifié une liste après avoir été averti d’une détention abusive.","new_title":"CORRECTION MANUSCRITE","original_text":"Le premier suspect modifie une liste après avoir été informé d’une détention abusive."},{"scenario_id":"032","title":"CHAÎNE","text":"Les documents séparent trois étapes : la désignation d’un opposant, l’ordre administratif et son arrestation.","new_title":"TROIS ÉTAPES","original_text":"Les archives permettent de séparer cible politique, ordre administratif et exécution sécuritaire."},{"scenario_id":"033","title":"NOMINATION","text":"Le membre de la famille occupant le poste ministériel a maintenu une nomination contestée.","new_title":"NOMINATION","original_text":"Une nomination contestée est maintenue par le deuxième suspect."},{"scenario_id":"033","title":"AGENDA PRIVÉ","text":"Des rendez-vous montrent que le conseiller familial, sans fonction officielle majeure, était consulté avant plusieurs décisions.","new_title":"AGENDA PRIVÉ","original_text":"Des rendez-vous montrent que le troisième suspect était consulté avant plusieurs décisions."},{"scenario_id":"033","title":"POUVOIR RÉEL","text":"Plusieurs décisions sensibles ont suivi des réunions avec le conseiller familial, malgré son titre officiel limité.","new_title":"POUVOIR RÉEL","original_text":"Les décisions les plus sensibles convergent vers l’avis du troisième suspect malgré son faible titre officiel."},{"scenario_id":"035","title":"DERNIER DÉPLACEMENT","text":"Un véhicule lié au relais logistique de CERBÈRES transporte M-17 quelques heures avant sa mort.","new_title":"DERNIER DÉPLACEMENT","original_text":"Un véhicule lié au troisième suspect transporte M-17 quelques heures avant sa mort."},{"scenario_id":"036","title":"RELAIS CERBÈRES","text":"L’intermédiaire CERBÈRES présent sur le site est relié à une identité déjà utilisée dans le dossier M-17.","new_title":"RELAIS CERBÈRES","original_text":"Le troisième suspect est relié à une identité déjà présente dans le dossier M-17."},{"scenario_id":"038","title":"LISTE DÉTRUITE","text":"L’opérateur chargé des liaisons de CERBÈRES détruit une liste de contacts après la mort de M-17.","new_title":"LISTE DÉTRUITE","original_text":"Le troisième suspect détruit une liste de contacts après la mort de M-17."},{"scenario_id":"039","title":"GARDE DU SITE","text":"Aucune pièce ne prouve que le responsable de la sécurité du site connaissait l’objectif complet d’ORPHÉE au moment du transfert.","new_title":"GARDE DU SITE","original_text":"Aucun élément n’établit que le deuxième suspect connaissait l’ensemble de l’objectif stratégique lorsqu’il a accepté le transfert de contrôle."},{"scenario_id":"039","title":"OPTION DE CRISE","text":"Le coordinateur d’ORPHÉE a préparé une solution politique de dernier recours, sans ordre légal confirmé.","new_title":"OPTION DE CRISE","original_text":"Le premier suspect a préparé une option politique de dernier recours sans ordre légal confirmé."},{"scenario_id":"039","title":"TENTATIVE BLOQUÉE","text":"Une demande officielle de reprise d’ORPHÉE a été bloquée par le relais politique lié à CERBÈRES.","new_title":"TENTATIVE BLOQUÉE","original_text":"Une demande institutionnelle visant à reprendre le contrôle d’ORPHÉE a été bloquée par le troisième suspect."},{"scenario_id":"039","title":"POINT ZÉRO","text":"Les archives montrent que des responsables liés à ORPHÉE continuent de coordonner des actions après sa fermeture officielle.","new_title":"RÉSEAU TOUJOURS ACTIF","original_text":"Le dossier final confirme que le danger vient de la continuité humaine et politique autour d’ORPHÉE, pas d’un mécanisme technique isolé."},{"scenario_id":"041","title":"GIRI","text":"Un message rappelant une ancienne faveur a été reçu peu avant le meurtre de l’Oyabun. Un relais institutionnel est associé à cet échange.","new_title":"GIRI","original_text":"La dette ancienne a été rappelée juste avant le meurtre et relie l’exécutant à un relais institutionnel."},{"scenario_id":"042","title":"MAINS SALES","text":"Des demandes adressées aux clans proviennent d’un contact policier, mais aucune procédure officielle ne les autorise.","new_title":"DEMANDES HORS PROCÉDURE","original_text":"La police a utilisé les clans comme intermédiaires pour obtenir ce qu’elle ne pouvait pas demander officiellement."},{"scenario_id":"043","title":"LA DETTE","text":"Les horaires relient un rappel de faveur, un contact policier et une version préparée de l’enquête. Les rôles exacts restent contestés.","new_title":"UNE CHRONOLOGIE TROUBLANTE","original_text":"La chaîne la plus cohérente relie une ancienne faveur policière au meurtre matériel puis à une orientation préparée de l’enquête."},{"scenario_id":"044","title":"LE CONSEIL","text":"Avant le meurtre, un message rappelle une dette ancienne. Après, une version incriminant Arakida est préparée. Des contacts policiers précèdent l’annonce publique.","new_title":"TROIS TRACES À RECOUPER","original_text":"Les fragments convergent : l’Oyabun voulait sortir du système, le Kobun l’a tué sous une dette activée et un relais policier avait préparé la couverture et l’orientation de l’enquête."}];
function editorialTitle(title,body,scenarioOverride){
 const id=String(scenarioOverride||game()?.room?.scenario_id||'');
 const found=trameEditsV778.find(x=>x.scenario_id===id&&x.title===String(title||'')
   &&(String(body||'').trim()===x.original_text||String(body||'').trim()===x.text));
 return found?found.new_title:title;
}
const ordinalRoles={
 '027':{second:'l’agent chargé des détentions du FDR',third:'le cadre du FDR au courant des rivalités internes'},
 '028':{third:'le cadre resté fidèle au FDR'},
 '029':{first:'l’intermédiaire financier',second:'le responsable local',third:'l’exécutant devenu coopérant'},
 '032':{first:'le chef administratif',second:'le responsable de la sécurité',third:'le conseiller du palais'},
 '033':{second:'le parent ministre de la famille',third:'le conseiller de la famille'},
 '035':{third:'le relais logistique de CERBÈRES'},
 '036':{third:'l’intermédiaire CERBÈRES'},
 '038':{third:'l’opérateur chargé des liaisons'},
 '039':{first:'le coordinateur d’ORPHÉE',second:'le responsable de la sécurité du site',third:'le relais politique lié à CERBÈRES'}
};
function preciseCaseCopy(value,unusedTitle,scenarioOverride){
 const raw=String(value??'').trim(),scenario=String(scenarioOverride||game()?.room?.scenario_id||'');
 if(!raw)return '';
 // Previously emitted trames can be fixed without modifying an active room's pinned evidence.
 const edited=trameEditsV778.find(x=>x.scenario_id===scenario&&x.original_text===raw
   &&(!unusedTitle||String(unusedTitle)===x.title));
 if(edited)return edited.text;
 if(scenario==='004'){
  const found=case004Copy.find(entry=>raw.includes(entry.source));
  if(found)return found.copy;
 }
 const names=ordinalRoles[scenario];
 if(!names)return raw;
 return raw.replace(/\ble (premier|deuxième|troisième) suspect\b/gi,(match,ordinal)=>{
  const name=names[ordinal.toLocaleLowerCase('fr')==='premier'?'first':ordinal.toLocaleLowerCase('fr')==='deuxième'?'second':'third'];
  return name?(match[0]==='L'?name.charAt(0).toLocaleUpperCase('fr')+name.slice(1):name):match;
 });
}
function readableTitle(value){
 const v=String(value||'').trim();
 return v.length>5&&v===v.toLocaleUpperCase('fr')?v.slice(0,1)+v.slice(1).toLocaleLowerCase('fr'):v;
}
function conciseCaseText(value,title){
 const full=String(value??'').replace(/\s+/g,' ').trim();
 if(!full)return '';
 // The key fact must be visible immediately, not buried in the long document.
 const scenario=String(game()?.room?.scenario_id||''),key=String(title||'').trim().toLocaleLowerCase('fr');
 if(scenario==='004'&&case004Summaries[key]&&case004Copy.some(x=>x.copy===full))return case004Summaries[key];

 if(full.length<=165)return full;
 const parts=full.match(/[^.!?]+(?:[.!?]+[»”']?|$)/g)||[full];
 let brief=String(parts[0]||'').trim(),next=String(parts[1]||'').trim();
 if(next&&brief.length<96&&(brief+' '+next).length<=170)brief+=' '+next;
 if(brief.length>175){
  const cut=brief.slice(0,172);
  const punctuation=Math.max(cut.lastIndexOf('; '),cut.lastIndexOf(', '),cut.lastIndexOf(': '));
  const boundary=punctuation>=92?punctuation:cut.lastIndexOf(' ');
  brief=(boundary>=80?cut.slice(0,boundary):cut).replace(/[,;:\s]+$/,'')+'…';
 }
 return brief;
}
function expandableCopy(full,brief,kind='evidence'){
 if(!full||full.replace(/\s+/g,' ').trim()===brief)return '';
 return '<details class="igr774-detail" data-copy-kind="'+esc(kind)+'"><summary>'+esc(tr('Voir le texte complet','Read the full text'))+'</summary><p>'+esc(full)+'</p></details>';
}

let cache={key:'',data:null,last:0,busy:false,err:false};
function key(){const d=game();return d?.room?.code&&S()?.token?d.room.code+':'+d.player.id+':'+String(d.room.state?.match_no||1):''}
function visibleTab(id){if(id==='chronology')return false;if(id==='investigation')return isInquiry();return true}
function sanitizeTab(){const state=S();if(state&&!visibleTab(state.tab))state.tab='timeline'}
async function syncPublic(force=false){
 const d=game(),k=key();if(!k||!d||d.room.status==='lobby')return;
 if(cache.key!==k)cache={key:k,data:null,last:0,busy:false,err:false};
 if(cache.busy||(!force&&Date.now()-cache.last<2600))return;
 cache.busy=true;cache.last=Date.now();
 try{
  const result=await rpc('igr_v106_common_dossier',{p_code:d.room.code,p_player_token:S().token});
  if(k!==key())return;
  if(!result||result.room_code!==d.room.code||!Array.isArray(result.events))throw Error('Invalid public dossier response');
  const previous=cache.data;
  const changed=JSON.stringify(previous)!==JSON.stringify(result);
  if(previous){const ids=new Set(previous.events.map(e=>String(e.id)));window.IGR_NOTIFICATIONS?.publicUpdates?.({roomCode:d.room.code,playerId:d.player.id,events:result.events.filter(e=>!ids.has(String(e.id)))});}
  cache.data=result;cache.err=false;
  window.IGR_NOTIFICATIONS?.refreshBadges?.();
  if(changed&&S()?.view==='game'&&S()?.tab==='timeline'){
   const root=document.querySelector('#app .game-panel-v11');
   if(root)root.innerHTML=publicHtml();
  }
 }catch(error){if(k===key()){cache.err=true;console.warn('[IGR v106] public dossier unavailable',error?.message||error)}}
 finally{cache.busy=false}
}
/* The public RPC is the single source of truth for all dossier counters.
   Avoid repeating the opening context when it has already been printed as premise. */
function publicEntries(data){
 const context=String(data?.context||'').trim().replace(/\s+/g,' ').normalize('NFKC').toLocaleLowerCase();
 return (Array.isArray(data?.events)?data.events:[]).filter(e=>{
   const normalized=String(e?.text||'').trim().replace(/\s+/g,' ').normalize('NFKC').toLocaleLowerCase();
   const title=String(e?.title||'').trim().toLocaleLowerCase();
   const sameOpening=e?.event_type==='context'&&((context&&normalized===context)||title==='contexte');
   const redundantCycleSummary=e?.event_type==='public_notice' && /^Bilan public\s*[·-]\s*cycle\s*\d+/i.test(String(e?.title||''));
   return !sameOpening && !redundantCycleSummary;
 });
}
function visibleEventIds(){
 const data=cache.key===key()?cache.data:null;
 if(!data)return null;
 return publicEntries(data).map(e=>String(e.id)).filter(Boolean);
}
function publicHtml(){
 const d=game();if(!d)return '';
 const a=cache.key===key()?cache.data:null;
 const rawContext=String(a?.context??d.scenario?.context??'').trim();
 const context=String(d.room.scenario_id)==='004'
  ?tr('Sofia est morte après une nuit de détresse. Trois proches apparaissent dans le dossier. Ils ont reçu des informations différentes, à des moments différents. La Grey Room doit reconstruire les appels, les silences et les décisions.','Sofia died after a night of distress. Three people close to her appear in the case. They learned different things at different times. The Grey Room must reconstruct the calls, silences and decisions.')
  :rawContext;
 const events=publicEntries(a).slice().reverse();
 const history=events.map(e=>{
  const c=safeCycle(e.cycle),press=e.event_type==='breaking_news'||e.press_claim;
  const type=press?tr('PUBLICATION DU JOURNALISTE','PRESS PUBLICATION'):e.event_type==='public_notice'?tr('BILAN PUBLIC DU CYCLE','PUBLIC CYCLE SUMMARY'):e.event_type==='public_evidence'?tr('PIÈCE COMMUNIQUÉE · À RECOUPER','SHARED DOCUMENT · CHECK THE SOURCE'):e.verified?tr('ÉLÉMENT VÉRIFIÉ','VERIFIED FINDING'):tr('INFORMATION PUBLIQUE','PUBLIC INFORMATION');
  // Only the authenticated public dossier RPC can populate this screen.
  // Documents voluntarily disclosed to all remain available without burying the
  // other public updates in long paragraphs on a narrow phone.
  const published=e.event_type==='public_evidence';
  const full=preciseCaseCopy(String(e.text||'').trim(),e.title),brief=conciseCaseText(full,e.title);
  const body=published
   ?'<p class="igr774-brief">'+esc(brief)+'</p>'+expandableCopy(full,brief,'public')
   :'<p>'+esc(full)+'</p>';
  return '<article class="igr106-event" data-igr-event-id="'+esc(e.id)+'" data-cycle="'+(c||0)+'" data-public-document="'+(published?'true':'false')+'"><div class="igr106-meta"><span>'+esc(type)+'</span><span>'+esc(c?tr('CYCLE ','CYCLE ')+c:tr('DATE NON PRÉCISÉE','DATE UNSPECIFIED'))+'</span></div><h4>'+esc(editorialTitle(e.title,e.text)||tr('Nouvelle information','Case update'))+'</h4>'+body+(press?'<small>'+esc(e.verified?tr('Publication scénarisée · à recouper','Scripted publication · verify independently'):tr('Déclaration journalistique · non vérifiée','Press claim · unverified'))+'</small>':'')+'</article>';
 }).join('');
 return '<section class="igr106-common" aria-label="'+esc(tr('Dossier commun','Shared case file'))+'"><header><small>'+esc(tr('ACCESSIBLE À TOUS LES RÔLES','VISIBLE TO ALL ROLES'))+'</small><h2>'+esc(tr('Dossier commun','Shared case file'))+'</h2></header><article class="igr106-premise"><h3>'+esc(tr('Situation connue de tous','Shared starting situation'))+'</h3><p>'+esc(context||tr('Le dossier sera présenté au lancement de la partie.','The case will be introduced when play begins.'))+'</p></article><div class="igr106-events"><h3>'+esc(tr('Publications et faits partagés','Shared news and events'))+'</h3>'+(cache.err&&!a?'<p class="igr106-muted">'+esc(tr('Connexion au dossier commun indisponible. Réessai automatique.','Shared case file temporarily unavailable. Retrying.'))+'</p>':!a?'<p class="igr106-muted">'+esc(tr('Synchronisation des informations publiques…','Loading public updates…'))+'</p>':history||'<p class="igr106-muted">'+esc(tr('Aucune nouvelle information publique pour le moment.','No new shared update yet.'))+'</p>')+'</div></section>';
}
const origTabs=typeof gameTabs==='function'?gameTabs:null;
if(origTabs){const wrapper=function(){
 const tabs=[...(origTabs.apply(this,arguments)||[])];
 if(!tabs.some(t=>t?.id==='timeline'))tabs.push({id:'timeline',label:'Dossier commun'});
 const visible=tabs.filter(t=>visibleTab(t?.id));
 const common=visible.find(t=>t?.id==='timeline');
 const ordered=visible.filter(t=>t?.id!=='timeline');
 const inquiry=ordered.findIndex(t=>t?.id==='investigation');
 const card=ordered.findIndex(t=>t?.id==='card');
 ordered.splice(inquiry>=0?inquiry+1:card>=0?card+1:0,0,common);
 return ordered.map(t=>t?.id==='card'?{...t,label:tr('Ma fiche','My role')}:t?.id==='timeline'?{...t,label:tr('Dossier commun','Shared case file')}:t?.id==='investigation'?{...t,label:tr('Enquête','Investigation')}:t);
};try{gameTabs=wrapper}catch{}window.gameTabs=wrapper;}
const origCard=typeof privateCardHtml==='function'?privateCardHtml:null;
if(origCard){const wrapper=function(){
 const html=String(origCard.apply(this,arguments)??'');
 try{
  const t=document.createElement('template');t.innerHTML=html;
  const card=t.content.querySelector('.private-card-v11');if(!card)return html;
  const blocks=[...card.querySelectorAll('.private-block')];
  let stack=null;
  for(const block of blocks){
   const title=block.querySelector('h4')?.textContent?.trim()||'';
   if(!title)continue;
   if(/^(TA PLACE|YOUR PLACE)$/i.test(title))continue;
   if(!stack){stack=document.createElement('div');stack.className='igr106-facts';}
   const details=document.createElement('details');details.className='igr106-fact';
   const summary=document.createElement('summary');summary.textContent=title;
   // The essentials should be readable without repeatedly opening accordions.
   details.open=/^(TON RÔLE|QUI TU ES|CE QUI S[’']EST PASSÉ|CE QUE TU AS FAIT|TON HISTOIRE|CE QUE TU CACHES)$/i.test(title);
   details.appendChild(summary);const body=document.createElement('div');body.className='igr106-fact-body';
   for(const child of [...block.childNodes])if(child.nodeType!==1||child.tagName!=='H4')body.appendChild(child.cloneNode(true));
   // Long player-card paragraphs show their opening; the whole original stays one tap away.
   for(const paragraph of [...body.querySelectorAll('p')]){
    if(paragraph.children.length)continue;
    const original=String(paragraph.textContent||'').trim();
    if(original.length<=195)continue;
    const short=conciseCaseText(original,title);
    if(short===original)continue;
    paragraph.textContent=short;
    const more=document.createElement('details');more.className='igr774-detail';
    const heading=document.createElement('summary');heading.textContent=tr('Voir le texte complet','Read the full text');
    const rest=document.createElement('p');rest.textContent=original;
    more.append(heading,rest);paragraph.after(more);
   }
   details.appendChild(body);stack.appendChild(details);block.remove();
  }
  if(stack){const foot=card.querySelector('.private-foot');if(foot)card.insertBefore(stack,foot);else card.appendChild(stack)}
  return t.innerHTML;
 }catch(err){console.warn('[IGR v106] card fallback',err);return html}
};try{privateCardHtml=wrapper}catch{}window.privateCardHtml=wrapper;}

/* v771: two distinct investigators must authorize a public release. */
let disclosure={key:'',data:null,last:0,busy:false,error:false};
function disclosureRows(){
 if(disclosure.error)return '<p class="igr771-status">'+esc(tr('Propositions indisponibles. Réessai automatique.','Proposals unavailable. Retrying.'))+'</p>';
 if(!disclosure.data)return '<p class="igr771-status">'+esc(tr('Recherche des éléments autorisés…','Loading eligible findings…'))+'</p>';
 const rows=(disclosure.data.candidates||[]).filter(x=>!x.published).slice(0,6);
 if(!rows.length)return '<p class="igr771-status">'+esc(tr('Aucun élément éligible pour le moment. Poursuis les vérifications.','No eligible finding yet. Continue checking leads.'))+'</p>';
 return rows.map(x=>{
  const id=Number(x.id);
  if(!Number.isSafeInteger(id)||id<1)return '';
  const required=Number(x.required_votes)===1?1:2, votes=Math.max(0,Math.min(required,Number(x.votes)||0)),voted=Boolean(x.mine);
  const label=voted?(votes>=required?tr('Finaliser la publication','Finish publication'):tr('Accord enregistré','Approval recorded')):required===1?tr('Publier pour tous','Publish for everyone'):votes===0?tr('Proposer la publication','Propose publication'):tr('Approuver la publication','Approve publication');
  const full=preciseCaseCopy(String(x.text||'').trim(),x.title),brief=conciseCaseText(full,x.title);
  return '<article class="igr771-option"><div class="igr771-option-head"><strong>'+esc(readableTitle(editorialTitle(x.title,x.text)||tr('Élément officiel','Official finding')))+'</strong><small>'+votes+'/'+required+'</small></div><p class="igr774-brief">'+esc(brief)+'</p>'+expandableCopy(full,brief)+'<button type="button" class="btn ghost small" data-igr771-vote="'+id+'" onclick="igr771Vote('+id+')" '+(voted&&votes<required?'disabled':'')+'>'+esc(label)+'</button></article>';
 }).join('');
}
function disclosurePanel(){
 return '<section class="igr771-disclosure"><details><summary>'+esc(tr('Partager une pièce au Dossier commun','Share a document with everyone'))+'</summary><div class="igr771-inside"><p>'+esc(tr('Deux accords pour publier (un seul si tu es l’unique enquêteur autorisé). Visible par tous, suspects compris. Maximum : 2 pièces par cycle.','Two approvals to publish (one if you are the only eligible investigator). Everyone, including suspects, can read it. Maximum: 2 documents per cycle.'))+'</p><div class="igr771-options">'+disclosureRows()+'</div></div></details></section>';
}
function renderDisclosure(){
 const el=document.querySelector('#app .igr771-options');
 if(el){const h=disclosureRows();if(el.innerHTML!==h)el.innerHTML=h}
}
async function syncDisclosure(force=false){
 const d=game(),k=key();
 if(!isInquiry()||!d||d.room.status!=='playing'||!k)return;
 if(disclosure.key!==k)disclosure={key:k,data:null,last:0,busy:false,error:false};
 if(disclosure.busy||(!force&&Date.now()-disclosure.last<8500))return;
 disclosure.busy=true;disclosure.last=Date.now();
 try{
  const r=await rpc('igr_v771_dossier_candidates',{p_code:d.room.code,p_player_token:S().token});
  if(k!==key())return;
  if(!r||!Array.isArray(r.candidates))throw Error('Invalid disclosure response');
  disclosure.data=r;disclosure.error=false;renderDisclosure();
 }catch(err){if(k===key()){disclosure.error=true;renderDisclosure();console.warn('[IGR v771] candidates',err?.message||err)}}
 finally{disclosure.busy=false}
}
window.igr771Vote=async function(id){
 const d=game(),k=key(),eventId=Number(id);
 if(!isInquiry()||!d||d.room.status!=='playing'||!Number.isSafeInteger(eventId)||eventId<1)return;
 const c=(disclosure.data?.candidates||[]).find(x=>Number(x.id)===eventId);
 if(!c||c.published)return;
 const required=Number(c.required_votes)===1?1:2;
 if(c.mine&&Number(c.votes)<required)return;
 const publishing=Number(c.votes)+(c.mine?0:1)>=required;
 if(publishing&&typeof window.confirm==='function'&&!window.confirm(tr('Publier cette pièce pour TOUS les joueurs, suspects compris ?','Publish this document to ALL players, including suspects?')))return;
 const b=document.querySelector('[data-igr771-vote="'+eventId+'"]');if(b)b.disabled=true;
 try{
  const r=await rpc('igr_v771_dossier_vote',{p_code:d.room.code,p_player_token:S().token,p_event_id:eventId});
  if(k!==key())return;
  if(typeof toast==='function')toast(r?.status==='published'?tr('Pièce publiée dans le Dossier commun.','Document published in the shared case file.'):tr('Accord enregistré. Une deuxième validation est nécessaire.','Approval saved. A second approval is needed.'));
  await syncDisclosure(true);
  if(r?.status==='published')await syncPublic(true);
 }catch(err){if(typeof toast==='function')toast(tr('Publication impossible : droits, quota ou connexion à vérifier.','Could not publish: check permissions, quota or connection.'));console.warn('[IGR v771] vote',err?.message||err);await syncDisclosure(true)}
};

const origTab=typeof renderGameTab==='function'?renderGameTab:null;
if(origTab){const wrapper=function(){
 sanitizeTab();
 if(S()?.tab==='timeline')return publicHtml();
 let result=origTab.apply(this,arguments);
 if(S()?.tab==='investigation'&&isInquiry())result=disclosurePanel()+result;
 if(S()?.tab==='investigation'&&isInquiry()&&role()!=='enqueteur'){
  const extra=window.IGR_INVESTIGATION_V42?.renderElementsTab?.()||'';
  return extra?'<section class="igr106-inquiry-evidence"><h3>'+esc(tr('Preuves et éléments reçus','Evidence and findings'))+'</h3>'+extra+'</section>'+result:result;
 }
 return result;
};try{renderGameTab=wrapper}catch{}window.renderGameTab=wrapper;}
function actionHtml(){
 const d=game();if(!d||d.room.status!=='playing'||d.room.phase==='role_reading')return '';
 if(isInquiry())return '<button class="btn ghost small igr106-go-enquiry" type="button" onclick="setTab(\'investigation\')">'+esc(tr('Ouvrir les actions d’enquête','Open investigation actions'))+'</button>';
 if(role()==='journaliste'&&d.room.phase==='locking')return typeof renderInvestigationTab==='function'?String(renderInvestigationTab()||''):'';
 if(role()==='journaliste'){
  return '<button class="btn ghost small" type="button" onclick="setTab(\'press50\')">'+esc(tr('Ouvrir Presse et publier','Open Press and publish'))+'</button>';
 }
 return typeof renderInvestigationTab==='function'?String(renderInvestigationTab()||''):'';
}
const origRender=typeof renderGame==='function'?renderGame:null;
if(origRender){const wrapper=function(){
 sanitizeTab();const result=origRender.apply(this,arguments);
 try{
  const d=game(),main=document.querySelector('#app .game-v11'),tabs=main?.querySelector('.tabs-v11');
  if(main&&tabs&&d?.room?.status==='playing'){
   const aside=document.createElement('details');aside.className='igr106-action-panel';
   const phase=d.room.phase||'';
   const important=['interrogation','interrogation_select','provisional_lock','defense','locking','cycle_debrief','event_select'].includes(phase);
   if(important&&!isInquiry())aside.open=true;
   const summary=document.createElement('summary');
   const notice=typeof rolePhaseNotice==='function'?rolePhaseNotice(d):null;
   const heading=document.createElement('b');heading.textContent=tr('Action en cours','Current action');
   summary.appendChild(heading);
   if(notice?.text){
    const hint=document.createElement('small');hint.className='igr106-current-action';
    hint.textContent=String(notice.text).replace(/<[^>]*>/g,'').slice(0,145);
    summary.appendChild(hint);
   }
   aside.appendChild(summary);
   const content=document.createElement('div');content.className='igr106-actions-inner';content.innerHTML=actionHtml();aside.appendChild(content);
   tabs.before(aside);
   // Public information only: the private state is never used in this banner.
   if(S()?.tab!=='timeline'){
    const teaser=document.createElement('aside');
    teaser.className='igr106-public-teaser';
    const concise=String(d.room.scenario_id)==='004'
     ?tr('Sofia est morte après une nuit de détresse. Trois proches ont reçu des informations différentes, à des moments différents.','Sofia died after a night of distress. Three people close to her learned different things at different times.')
     :(typeof publicScenarioSummary==='function'?String(publicScenarioSummary(d.room.scenario_id)||''):String(d.scenario?.context||''));
    const title=document.createElement('strong');title.textContent=tr('SITUATION CONNUE DE TOUS','SHARED STARTING SITUATION');
    const paragraph=document.createElement('p');paragraph.textContent=concise;
    const go=document.createElement('button');go.type='button';go.className='igr106-public-open';
    go.textContent=tr('Voir les faits partagés','See shared facts');
    go.addEventListener('click',()=>setTab('timeline'));
    teaser.append(title,paragraph,go);aside.before(teaser);
   }
   // The investigation workspace already provides the active actions. Do not duplicate them.
   if(isInquiry())aside.remove();
  }
  if(S()?.tab==='timeline')void syncPublic();
  if(S()?.tab==='investigation'&&isInquiry())void syncDisclosure();
 }catch(err){console.warn('[IGR v106] action fallback',err)}
 return result;
};try{renderGame=wrapper}catch{}window.renderGame=wrapper;}
window.setInterval(()=>{const d=game();if(d&&S()?.view==='game'&&d.room.status==='playing'){void syncPublic();if(S()?.tab==='investigation'&&isInquiry())void syncDisclosure();}},4300);
const style=document.createElement('style');style.id='igr106-css';style.textContent=`
.igr106-common{max-width:940px;margin:auto;display:grid;gap:16px}
.igr106-common header small{font-size:.66rem;letter-spacing:.13em;color:#9ca2a6}
.igr106-common h2{font-size:1.3rem;margin:5px 0 0}
.igr106-premise,.igr106-event{background:rgba(255,255,255,.032);border:1px solid rgba(255,255,255,.12);border-radius:14px;padding:16px}
.igr106-premise h3,.igr106-events h3{font-size:.95rem;margin:0 0 10px}
.igr106-premise p,.igr106-event p{white-space:pre-wrap;line-height:1.55;margin:8px 0}
.igr106-events{display:grid;gap:10px}
.igr106-event{border-left:3px solid #777e85}.igr106-event[data-cycle="1"]{border-left-color:#a8a49c}.igr106-event[data-cycle="2"]{border-left-color:#c89f64}.igr106-event[data-cycle="3"]{border-left-color:#b96565}
.igr106-meta{display:flex;justify-content:space-between;gap:9px;flex-wrap:wrap;font-size:.64rem;letter-spacing:.08em;color:#a9b0b6}
.igr106-event h4{font-size:.96rem;margin:9px 0 5px}.igr106-event small,.igr106-muted{color:#a8afb4;line-height:1.4}
.igr106-common,.igr106-events,.igr106-premise,.igr106-event{min-width:0;max-width:100%;box-sizing:border-box}
.igr106-premise p,.igr106-event h4,.igr106-event p,.igr106-meta span{overflow-wrap:anywhere}
.igr106-public-document{margin:10px 0 0;border-top:1px solid rgba(255,255,255,.10);padding-top:9px}
.igr106-public-document summary{cursor:pointer;list-style-position:inside;font-size:.82rem;font-weight:700;line-height:1.5;color:#b7cbcf;touch-action:manipulation}
.igr106-public-document[open] summary{margin-bottom:8px}
.igr106-public-document p{margin:0;white-space:pre-wrap;line-height:1.55;color:#d5dadd}
.igr106-event[data-public-document="true"]{border-left-color:#82aeb2}
.igr106-action-panel{margin:8px 0 14px;border:1px solid rgba(255,255,255,.10);border-radius:12px;background:rgba(255,255,255,.025)}
.igr106-action-panel>summary{padding:11px 13px;cursor:pointer;font-weight:700;font-size:.86rem}
.igr106-actions-inner{padding:9px 13px 14px}.igr106-actions-inner .phase-explain{margin-top:0}
.igr106-facts{display:grid;gap:7px;margin:12px 0}.igr106-fact{border:1px solid rgba(255,255,255,.11);border-radius:10px;background:rgba(255,255,255,.02)}.igr106-fact>summary{cursor:pointer;padding:12px 13px;font-weight:700;letter-spacing:.04em;font-size:.81rem}.igr106-fact-body{padding:0 13px 13px;line-height:1.5}.igr106-fact-body p{margin:0}
.igr106-inquiry-evidence{margin-bottom:14px}
.igr771-disclosure{margin:0 0 14px;border:1px solid rgba(192,180,154,.28);border-radius:13px;background:rgba(192,180,154,.045)}
.igr771-disclosure>details>summary{padding:13px 14px;cursor:pointer;font-weight:700}
.igr771-inside{padding:0 13px 14px}.igr771-inside>p{font-size:.8rem;line-height:1.5;color:#b5b9bc;margin:0 0 11px}
.igr771-options{display:grid;gap:9px}.igr771-option{padding:12px;border:1px solid rgba(255,255,255,.1);border-radius:10px;background:rgba(0,0,0,.16)}
.igr771-option-head{display:flex;align-items:start;justify-content:space-between;gap:9px}.igr771-option-head strong{font-size:.84rem}.igr771-option-head small{color:#d6c2a0}
.igr771-option p{font-size:.8rem;line-height:1.45;color:#b8bec2;margin:6px 0 10px}
.igr771-option button{min-height:36px;max-width:100%;white-space:normal}
.igr771-option .igr774-brief,.igr106-event .igr774-brief{font-size:.85rem;line-height:1.43;color:#e2e5e6;margin:7px 0 9px}
.igr771-option-head strong{line-height:1.3;overflow-wrap:anywhere}
.igr774-detail{margin:3px 0 12px;border-top:1px solid rgba(255,255,255,.07);padding-top:6px}
.igr774-detail>summary{cursor:pointer;font-size:.78rem;color:#c9baa0;line-height:1.5}
.igr774-detail>p{margin:8px 0!important;color:#b5bec5!important;overflow-wrap:anywhere;white-space:pre-wrap}
.igr106-fact-body .igr774-detail{margin-bottom:8px}
@media(max-width:600px){.igr771-option{padding:11px}.igr771-option-head strong{font-size:.82rem}.igr771-inside{padding:0 11px 12px}}
@media(max-width:600px){.igr106-premise,.igr106-event{padding:12px}.igr106-action-panel{margin:8px 0}.igr106-common{gap:11px}}
`;document.head.appendChild(style);
window.IGR_COMMON_DOSSIER_V106=Object.freeze({version:V,isInquiry,publicHtml,syncPublic,visibleEventIds,preciseCaseCopy,editorialTitle});
console.info('[IGR v106] public/private separation active');
})();