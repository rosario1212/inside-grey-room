// v775: scenario-specific semantic clarity. No variant-private data is bundled.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=readFileSync('common-dossier-v106.js','utf8');
const helperStart=source.indexOf('const case004Copy='),helperEnd=source.indexOf('\nlet cache=',helperStart);
assert(helperStart>=0&&helperEnd>helperStart,'Shared readable-copy helper unavailable');
let id='004';
const {preciseCaseCopy,conciseCaseText,expandableCopy}=new Function(
 'game','esc','tr',source.slice(helperStart,helperEnd)
 +'; return {preciseCaseCopy,conciseCaseText,expandableCopy};')(
 ()=>({room:{scenario_id:id}}),String,(fr)=>fr
);
const evidence=[
 ["Deux alertes distinctes",
  "Deux messages adressés à des destinataires différents arrivent après la rupture du premier suspect. Le contenu exact de leur conversation n'est pas encore connu.",
  /ex-partenaire/],
 ["Appel entre les proches",
  "Les journaux des deux appareils attestent un échange téléphonique entre les destinataires après leurs messages respectifs. Ils établissent la connexion et la durée, mais le contenu doit être recherché ailleurs que dans ces seules métadonnées.",
  /ami proche.*proche du quartier/],
 ["Journal des destinataires",
  "Les métadonnées des messages et la liste des destinataires ne montrent aucun transfert des deux alertes à l'ex-partenaire. Il convient de distinguer la connaissance personnelle d'une situation de ce qu'un proche a effectivement reçu.",
  /deux messages envoyés par Sofia/],
 ["L'APPEL ENTRE PROCHES",
  "Le journal prouve une conversation entre les deux destinataires des alertes. Aucune trace de contact avec Sofia ou un service d'aide ne suit cet échange.",
  /ami proche.*proche du quartier/],
 ["UN RELAIS SANS ACCORD",
  "La comparaison des messages et des témoignages ne permet d'identifier aucune attribution explicite de la prise en charge. Les deux proches connaissaient l'inquiétude de l'autre. L'enquête doit déterminer la part de chacun.",
  /ami proche.*proche du quartier/]
];
for(const [title,raw,expected] of evidence){
 const full=preciseCaseCopy(raw,title),brief=conciseCaseText(full,title);
 assert.match(full,expected,title+' must name specific actors or the exchanged messages');
 assert(!/premier suspect|troisième suspect|destinataires différents|rupture du premier suspect/i.test(full),
 title+' still uses opaque labels');
 assert(brief.length>35&&brief.length<=175,title+' preview must be short yet informative');
 assert(full.length>=brief.length);
 if(full!==brief)assert.match(expandableCopy(full,brief),/Voir le texte complet/);
}
const unrelated='Sofia t’a écrit avant ton retour.';
assert.equal(preciseCaseCopy(unrelated),unrelated,'Cannot rewrite unrelated variant A/C evidence');
const aliases=[
 ['027','Le troisième suspect fournit',/Le cadre du FDR/],
 ['028','Le troisième suspect ne demande',/Le cadre resté fidèle/],
 ['029','Le premier suspect vient et le troisième suspect parle',/L’intermédiaire financier vient et l’exécutant devenu coopérant parle/],
 ['032','Le premier suspect modifie',/Le chef administratif modifie/],
 ['033','Le troisième suspect décide',/Le conseiller de la famille décide/],
 ['036','Le troisième suspect est relié',/L’intermédiaire CERBÈRES est relié/],
 ['038','Le troisième suspect détruit',/L’opérateur chargé des liaisons détruit/],
 ['039','Le premier suspect et le troisième suspect',/Le coordinateur d’ORPHÉE et le relais politique lié à CERBÈRES/]
];
for(const [scenario,raw,expected] of aliases){
 id=scenario;
 assert.match(preciseCaseCopy(raw),expected,'Missing clear actor label for '+scenario);
 assert(!/premier suspect|troisième suspect/i.test(preciseCaseCopy(raw)),'Still ambiguous: '+scenario);
}
for(let n=1;n<=49;n++){
 id=String(n).padStart(3,'0');
 const generic='Les relevés confirment plusieurs échanges pendant la soirée. Leur contenu exact doit être vérifié avec les témoignages. Les horaires restent utiles à la reconstitution.';
 assert(conciseCaseText(generic,'Relevé').length<=175,'Summary too long: '+id);
}
id='001';
assert.equal(preciseCaseCopy(evidence[0][1],'Deux alertes distinctes'),evidence[0][1],
 'Sofia variant B wording cannot contaminate another dossier');
console.log('PASS v775: 5 Sofia evidence cards, 8 contextual role label groups, 49 scenario-safe previews.');
