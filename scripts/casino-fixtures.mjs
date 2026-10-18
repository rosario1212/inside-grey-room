// Deliberately synthetic fixtures. No Yonghe character, intrigue or solution.
export const fixtureRelease=()=>({id:'synthetic-A',variant:'A',revision:1,content:{schemaVersion:1,editorialStatus:'ready',humanReviewApproved:true,
  characters:Array.from({length:7},(_,i)=>({id:'c'+i,name:'Figurant '+i,title:'Fonction '+i,
    brief:'Fiche fictive de {{c'+i+'}}.',objective:'Échanger et documenter les faits.',
    relations:[{target:'c'+((i+1)%7),text:'Tu as négocié avec {{c'+((i+1)%7)+'}}.'}]})),
  casting:Object.fromEntries([4,5,6,7].map(n=>[n,Array.from({length:n},(_,i)=>'c'+i)])),
  npcs:[{id:'dragon',name:'Dirigeant fictif',motivation:'Conserver la confiance.',reply:'Expose tes soutiens.'},
    {id:'chan',name:'Greffier fictif',motivation:'Conserver les engagements.',reply:'La proposition est consignée.'}],
  npcDefences:Object.fromEntries([...Array.from({length:7},(_,i)=>'c'+i),'dragon','chan'].map(id=>[id,'Défense fictive du personnage, sans ajout de preuve.'])),
  phases:Array.from({length:8},(_,i)=>({title:'Phase fictive '+(i+1),public:'Situation publique '+(i+1),
    npcEvents:[{npcId:'chan',text:'Le registre est disponible.'}]})),
  bureau:Object.fromEntries(['agent','investigator','analyst','prosecutor','judge'].map(r=>[r,'Consigne privée de '+r])),
  puzzles:Array.from({length:5},(_,i)=>({question:'Question fictive '+i,answer:'confirmed',options:[{id:'confirmed',label:'Observation confirmée'},{id:'rumour',label:'Rumeur'}]})),
  evidence:Array.from({length:4},(_,i)=>({id:'proof'+i,sourceId:'source'+i,independenceGroup:'independent'+i,
    subjectId:'c1',description:'Document fictif '+i,offence:'infraction fictive',phase:i<2?1:4,admissible:true,facts:['intent','act']})),
  territories:[{id:'t1',name:'Concession fictive',controller:'c0'}],
  organigram:[{subject:'c1',target:'c0',relation:'finance'}],minimumSocialMs:60000,fallback:{text:'Une voie secondaire vérifiée est ouverte.'},
  judicialRules:[{offence:'infraction fictive',requiredFacts:['intent','act'],convictionText:'Les faits fictifs et leur imputation sont établis par des sources admissibles indépendantes.',acquittalText:'Un élément requis de responsabilité personnelle reste non établi.'}],
  moves:[{id:'nomination',label:'Demander une nomination',phase:3,actor:'c0',effect:'nominate',target:'c0',conditions:[{kind:'claim',subject:'c0'},{kind:'status',subject:'dragon',value:'free'}]}]
}});
export class MemoryStorage {
  constructor(){this.rooms=new Map();this.journal=new Map();this.approved=[]}
  async read(id,invite){return structuredClone(id?this.rooms.get(id)||null:[...this.rooms.values()].find(r=>r.inviteCode===invite)||null)}
  async create(a){if(this.rooms.has(a.id))throw Error('room_identifier_in_use');const room={id:a.id,inviteCode:a.inviteCode,revision:0,state:structuredClone(a.state),initialState:structuredClone(a.state)};this.rooms.set(a.id,room);return structuredClone(room)}
  async commit(a){
    const r=this.rooms.get(a.id);if(!r)throw Error('room_not_found');
    const key=a.id+':'+a.requestId,old=this.journal.get(key);
    if(old){if(old.actor!==a.actor||old.fingerprint!==a.fingerprint)throw Error('idempotency_key_conflict');return structuredClone(r)}
    if(r.revision!==a.expectedRevision)throw Error('revision_conflict');
    const next={...r,revision:r.revision+1,state:structuredClone(a.state)};
    this.journal.set(key,{actor:a.actor,fingerprint:a.fingerprint,revision:next.revision,command:structuredClone(a.command)});
    this.rooms.set(a.id,next);return structuredClone(next);
  }
  async receipt(id,requestId){return structuredClone(this.journal.get(id+':'+requestId)||null)}
  async releases(){return structuredClone(this.approved)}
}
