/* Inside Grey Room v13.7 — MODE HÉRITAGE playable campaign layer
   Additive runtime: keeps the premium gate and the existing persistence API,
   but replaces the Heritage campaign/dossier presentation with a playable,
   pass-and-play campaign session designed for one shared phone at the table.
*/
(()=>{
'use strict';

const VERSION='13.7-heritage-play';
const LIVE_KEY='igr_heritage_live_v2';
const CAMPAIGN_IDS=['cendres','kuroi'];
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const txt=(v,n=240)=>String(v??'').trim().slice(0,n);
const clone=v=>JSON.parse(JSON.stringify(v));
const api=()=>window.IGR_HERITAGE;
const isFr=()=>window.IGR_LOCALE!=='en';

const ROLES={
  cendres:[
    {id:'chef',name:'CHEF DE CELLULE',public:'Coordonne l’analyse, répartit les priorités et tranche quand les informations restent contradictoires.'},
    {id:'sigint',name:'ANALYSTE COMMUNICATIONS',public:'Recoupe horaires, métadonnées, accès numériques et anomalies de transmission.'},
    {id:'terrain',name:'AGENT TERRAIN',public:'Travaille les lieux, déplacements, contraintes physiques et témoignages de proximité.'},
    {id:'source',name:'OFFICIER TRAITANT',public:'Évalue les sources humaines, ce qu’elles savent réellement et ce qu’elles cherchent à obtenir.'},
    {id:'liaison',name:'LIAISON INSTITUTIONNELLE',public:'Coordonne avec la direction et les autorités sans laisser la pression politique remplacer les faits.'},
    {id:'legal',name:'ANALYSTE JUDICIAIRE',public:'Sépare preuve primaire, document dérivé, hypothèse et élément juridiquement exploitable.'},
    {id:'archive',name:'ANALYSTE DOCUMENTAIRE',public:'Recoupe les archives, habilitations, versions de documents et traces administratives anciennes.'}
  ],
  kuroi:[
    {id:'waka_k',name:'WAKAGASHIRA KUROKAWA',public:'Numéro deux du clan Kurokawa. Il protège la continuité de la Famille.'},
    {id:'kobun_k',name:'KOBUN KUROKAWA',public:'Exécutant du clan. Les ordres reçus et les dettes anciennes le suivent.'},
    {id:'waka_a',name:'WAKAGASHIRA ARAKIDA',public:'Cadre du clan rival. Il veut empêcher Kurokawa de contrôler le récit.'},
    {id:'kobun_a',name:'KOBUN ARAKIDA',public:'Homme de terrain Arakida. Il voit ce que les chefs préfèrent ignorer.'},
    {id:'commissaire',name:'COMMISSAIRE',public:'Dirige l’enquête officielle et protège l’institution.'},
    {id:'inspecteur',name:'INSPECTEUR',public:'Travaille les scènes, les accès et les contradictions de la police.'},
    {id:'bengoshi',name:'BENGOSHI',public:'Avocat de la Famille. Il détient des documents que personne ne veut voir publics.'}
  ]
};

const PACKS={
  cendres:{
    title:'CENDRES',theme:'CONTRE-ESPIONNAGE / SERVICE NATIONAL',min:5,max:7,
    definition:'Vous incarnez une cellule interne d’un service national de renseignement. Votre mission est de détecter une compromission : faux dossiers d’identité, détournement de procédures d’urgence, documents falsifiés et accès internes abusifs. Aucun nom de réseau ou de programme n’est à connaître à l’avance : seuls les faits du dossier comptent.',
    chapters:{
      1:{
        title:'PERSONNE N’EXISTE',
        briefing:'Une équipe de surveillance est retrouvée morte dans un appartement sécurisé. La copie hors réseau des relevés qu’elle devait remettre a disparu. Dans les dossiers restants apparaît l’identité V-17 : passeport valide, comptes actifs et dossier médical cohérent, mais aucune trace vérifiable avant les six derniers mois.',
        question:'Que représente réellement l’identité V-17 ?',
        phases:[
          ['SCÈNE','Recoupez la scène et les horaires. Ne cherchez pas encore un coupable : cherchez quelles données supposent une personne réelle et lesquelles peuvent être créées administrativement.'],
          ['IDENTITÉ','Chaque joueur expose une seule information privée. Interdiction de montrer l’écran : l’information doit être racontée et discutée.'],
          ['CONTRADICTION','Séparez les données primaires des copies, résumés et témoignages influencés après les faits.'],
          ['CLASSIFICATION','Classez V-17 avant de verrouiller le dossier. Cette conclusion sera reprise dans les dossiers suivants.']
        ],
        secrets:{
          chef:['La cellule avait reçu un ordre interne authentique de surveiller V-17, jamais de l’arrêter. Les agents morts avaient demandé la veille de préserver leurs journaux d’accès.','Empêcher le groupe de confondre authenticité de l’ordre et existence réelle de la cible.'],
          sigint:['Tous les appels attribués à V-17 proviennent de trois relais différents mais présentent exactement la même dérive d’horloge de 41 ms.','Montrer qu’une identité numérique peut être administrée depuis une même infrastructure.'],
          terrain:['Deux voisins disent avoir vu V-17, mais leurs descriptions ne correspondent pas. Les deux ont reçu la même photo après les faits.','Distinguer observation directe et souvenir influencé par une image transmise ensuite.'],
          source:['Une source du réseau hostile utilise “V-17” comme code de validation, jamais comme nom de personne.','Préserver la valeur de la source sans transformer son vocabulaire en preuve unique.'],
          liaison:['Le ministère exige un suspect nominatif avant 22 h. V-17 fournirait une réponse politiquement simple mais non démontrée.','Empêcher une exigence institutionnelle de devenir une certitude factuelle.'],
          legal:['Aucune donnée biométrique brute de V-17 n’existe : seulement des copies, exports et résumés administratifs.','Faire distinguer preuve primaire et document dérivé.'],
          archive:['Une ancienne procédure interne décrit la création d’identités de couverture partagées pour cloisonner plusieurs opérations.','Relier V-17 à une méthode documentée sans supposer qui l’utilise aujourd’hui.']
        },
        options:[
          {id:'alias',title:'IDENTITÉ DE COUVERTURE PARTAGÉE',detail:'V-17 pourrait être un dossier partagé entre plusieurs opérations distinctes.',grade:2,consequence:'La cellule cesse de chercher un individu inexistant et conserve une piste exploitable.'},
          {id:'agent',title:'AGENT RÉEL À RETROUVER',detail:'Une personne agirait sous cette identité administrative récemment constituée.',grade:0,consequence:'La cellule mobilise ses moyens sur une personne qui n’existe pas sous cette forme.'},
          {id:'victim',title:'IDENTITÉ D’UNE PERSONNE EFFACÉE',detail:'Une identité civile aurait été effacée puis reconstruite dans les registres.',grade:1,consequence:'L’hypothèse reste possible mais ne correspond pas aux traces techniques disponibles.'}
        ],
        reveal:'V-17 n’est pas une personne unique. C’est une identité de couverture administrée depuis une même infrastructure et réutilisée pour plusieurs opérations du réseau hostile.',
        apply:{alias:{crisis:0,flag:'s1_correct'},agent:{crisis:1,flag:'s1_wrong'},victim:{crisis:1,flag:'s1_partial'}}
      },
      2:{
        title:'04:17',
        briefing:'À 04:17, une explosion frappe un centre logistique gouvernemental. Dans les huit minutes suivantes, trois convois officiels quittent le périmètre sécurisé sous protocole d’urgence. Une revendication apparaît presque immédiatement sur un canal jusque-là inconnu.',
        question:'Quel était l’objectif principal de l’attaque de 04:17 ?',
        phases:[
          ['IMPACT','Séparez l’événement visible de ce qui change concrètement dans les procédures de sécurité.'],
          ['MOUVEMENTS','Recoupez les convois, badges et itinéraires activés par le protocole d’urgence.'],
          ['ATTRIBUTION','Évaluez la revendication : heure de publication, canal utilisé et intérêt politique d’une attribution rapide.'],
          ['PRIORITÉ','Vous ne pouvez suivre qu’une piste. Choisissez l’effet opérationnel le mieux étayé.']
        ],
        secrets:{
          chef:['Le protocole d’urgence déplace automatiquement certains matériels classifiés vers un site secondaire.','Faire raisonner le groupe sur les effets institutionnels de l’attaque.'],
          sigint:['La revendication a été publiée 38 secondes avant la première alerte interne officielle.','Établir qu’un acteur connaissait le calendrier avant la diffusion normale de l’alerte.'],
          terrain:['Le convoi C n’a pas utilisé sa route de secours prévue ; il a emprunté un itinéraire préparé la veille.','Faire du trajet C un indice important sans le transformer seul en conclusion.'],
          source:['Une source interne au réseau hostile indique qu’un matériel classifié devait sortir du site pendant une alerte majeure. Le mouvement devait être enregistré comme une simple opération d’inventaire.','Relier la crise à un transfert sans prétendre connaître encore la nature du matériel.'],
          liaison:['Le cabinet ministériel veut attribuer immédiatement l’attaque à un État voisin afin de justifier la fermeture de la frontière.','Empêcher l’intérêt politique de devenir la vérité du dossier.'],
          legal:['Deux badges du convoi C ont été activés avec des identifiants créés après minuit.','Relier les accès du convoi aux anomalies d’identité du dossier précédent.'],
          archive:['Un ancien exercice d’urgence décrit exactement la même substitution logistique : évacuer un chargement classifié pendant la saturation des contrôles.','Relier 04:17 à une procédure concrète plutôt qu’à une signature mystérieuse.']
        },
        options:[
          {id:'transfer',title:'COUVRIR UN TRANSFERT CLASSIFIÉ',detail:'Le but principal aurait été de détourner les procédures de sécurité pendant le mouvement des convois.',grade:2,consequence:'Vous suivez le mouvement matériel utile et préservez une piste pour la suite.'},
          {id:'border',title:'CRÉER UN INCIDENT DIPLOMATIQUE',detail:'La revendication viserait avant tout une réaction diplomatique contre l’État voisin.',grade:1,consequence:'La pression politique est réelle, mais elle n’explique pas le trajet préparé du convoi C.'},
          {id:'terror',title:'FRAPPER LE CENTRE LOGISTIQUE',detail:'L’opération chercherait surtout à frapper le centre logistique et à imposer sa revendication.',grade:0,consequence:'Le convoi C et le chargement déplacé sortent de votre priorité.'}
        ],
        reveal:'04:17 est une diversion logistique. L’attaque a déclenché le protocole qui permettait de sortir un chargement classifié par le convoi C avec des contrôles réduits. L’accusation dirigée contre l’État voisin a détourné une partie de la surveillance vers la frontière.',
        apply:{transfer:{crisis:0,flag:'s2_correct'},border:{crisis:1,flag:'s2_partial'},terror:{crisis:1,flag:'s2_wrong'}}
      },
      3:{
        title:'LA CHAMBRE',
        briefing:'Une opératrice du réseau hostile est détenue. Trois versions de son audition circulent avec des écarts entre transcriptions, enregistrement et métadonnées. La direction veut exploiter ses déclarations sans attendre la vérification des pièces.',
        question:'Quel élément du dossier d’audition est contaminé ?',
        phases:[
          ['SOURCE','Évaluez ce que la détenue sait directement, ce qu’elle suppose et ce qu’elle peut vouloir négocier.'],
          ['TRANSCRIPTIONS','Comparez formulation, horodatage, signature et chaîne de validation des trois comptes rendus.'],
          ['PRESSION','La direction réclame une conclusion immédiate. Décidez quelles pièces peuvent encore être utilisées sans contaminer la synthèse.'],
          ['RECOUPEMENT','Identifiez précisément la pièce falsifiée sans invalider automatiquement tout le témoignage.']
        ],
        secrets:{
          chef:['Le compte rendu B est le seul validé par un superviseur qui n’était pas présent cette nuit-là.','Faire auditer la chaîne de validation, pas seulement le contenu.'],
          sigint:['L’horodatage du fichier B précède de neuf minutes la création de l’enregistrement audio auquel il est censé correspondre.','Apporter une anomalie technique vérifiable.'],
          terrain:['La détenue a dessiné de mémoire un carrefour correspondant au trajet réel du convoi C.','Conserver la valeur d’une information recoupée malgré une pièce falsifiée.'],
          source:['La détenue ment sur son ancienneté dans le réseau, mais sa description du transfert du convoi C correspond aux éléments terrain. Elle évoque un chargement retiré des inventaires, sans en connaître la nature.','Éviter le raisonnement “elle ment sur un point donc tout est faux”.'],
          liaison:['Le cabinet du ministre cite déjà la phrase du compte rendu B dans une note confidentielle diffusée avant la validation finale du dossier.','Identifier une circulation anormale de l’information.'],
          legal:['Le compte rendu B n’a pas de signature cryptographique, contrairement aux deux autres.','Isoler B sans invalider A, C et l’audio.'],
          archive:['La phrase suspecte reprend mot pour mot un ancien document public sur les méthodes du réseau hostile.','Montrer qu’elle a pu être ajoutée pour rendre le témoignage artificiellement convaincant.']
        },
        options:[
          {id:'b',title:'COMPTE RENDU B',detail:'La version B constituerait l’altération déterminante du dossier.',grade:2,consequence:'Le témoignage reste partiellement exploitable et une compromission interne est confirmée.'},
          {id:'source',title:'TOUT LE TÉMOIGNAGE',detail:'Le récit de la détenue serait entièrement construit pour tromper les enquêteurs.',grade:0,consequence:'Vous perdez plusieurs éléments déjà recoupés indépendamment.'},
          {id:'audio',title:'ENREGISTREMENT AUDIO',detail:'L’enregistrement sonore disponible aurait été tronqué ou remanié après l’audition.',grade:1,consequence:'Vous identifiez une anomalie mais conservez la pièce falsifiée dans la synthèse.'}
        ],
        reveal:'Le compte rendu B a été fabriqué à l’intérieur du service. La détenue ment sur certains éléments biographiques, mais plusieurs de ses informations opérationnelles sont confirmées par des sources indépendantes. Une référence d’inventaire conservée dans l’audio oriente désormais la cellule vers la destination du chargement.',
        apply:{b:{crisis:0,flag:'s3_correct'},source:{crisis:1,flag:'s3_wrong'},audio:{crisis:1,flag:'s3_partial'}}
      },
      4:{
        title:'CENDRES',
        briefing:'Les anomalies des trois premiers dossiers semblent dépendre de droits administratifs distincts. Une délégation technique, une instruction politique et les accès d’une opératrice détenue constituent trois pistes concurrentes. La cellule doit identifier qui pouvait réellement modifier les données.',
        question:'Quel poste interne constitue le relais opérationnel du réseau hostile ?',
        phases:[
          ['CARTE','Posez uniquement les liens recoupés. Un accès possible n’est pas une participation prouvée.'],
          ['HÉRITAGE','Relisez les conclusions précédentes : identité de couverture, transfert et document falsifié.'],
          ['ACCÈS','Trois acteurs disposent d’une partie des autorisations. Cherchez celui qui peut expliquer les trois mécanismes à la fois.'],
          ['CLASSIFICATION','Verrouillez le relais interne. Une erreur ici réduira les informations fiables du dernier dossier.']
        ],
        secrets:{
          chef:['Deux opérations ont reçu une validation de second niveau commune, mais une autorité politique a demandé l’une tandis qu’un service technique a exécuté l’autre.','Faire distinguer le commanditaire de la personne qui possède réellement les droits d’écriture.'],
          sigint:['Les traces de V-17 et du dossier d’audition renvoient à un certificat de délégation partagé entre plusieurs postes. Le journal d’écriture initial est incomplet.','Retrouver le titulaire du droit d’écriture, pas seulement un certificat commun.'],
          terrain:['Le convoi C est resté 96 secondes dans une zone de chargement sensible; une escorte relevant du cabinet ministériel y a été aperçue la même nuit.','Distinguer une présence sur place d’une autorisation effective de transfert.'],
          source:['La détenue parle d’un interlocuteur capable de faire créer des accès et de faire disparaître une référence d’inventaire, sans jamais préciser son nom ni son administration.','Ne pas transformer une description fonctionnelle vague en identification certaine.'],
          liaison:['Le cabinet ministériel connaissait une citation du dossier d’audition avant son exploitation officielle, mais affirme avoir seulement reçu une copie.','Vérifier si cette fuite implique un accès en écriture ou une simple consultation.'],
          legal:['Les autorisations en cause comportent trois niveaux distincts : lecture, validation et écriture. Les ordres politiques ne prouvent pas à eux seuls l’usage du dernier niveau.','Séparer pouvoir d’ordonner et capacité technique de falsifier un dossier.'],
          archive:['Un même identifiant technique apparaît lors de la création de V-17, de la préparation du convoi C et du traitement de l’audition. Ce compte avait aussi consulté la liste des agents de surveillance avant leur mort, mais le registre ne fournit pas le nom de l’utilisateur.','Faire remonter un compte de service à son titulaire sans déduire l’identité depuis le seul identifiant.']
        },
        options:[
          {id:'kern',title:'RESPONSABLE DES HABILITATIONS',detail:'Le relais serait une fonction technique dotée de droits administratifs étendus.',grade:2,consequence:'Le principal relais interne est neutralisé avant le dernier dossier.'},
          {id:'prisoner',title:'OPÉRATRICE DÉTENUE',detail:'L’opératrice détenue aurait orchestré une partie des anomalies pour orienter la cellule.',grade:0,consequence:'Le compte privilégié interne reste actif et peut encore fausser le dernier dossier.'},
          {id:'minister',title:'CABINET MINISTÉRIEL',detail:'Un bureau politique aurait coordonné les falsifications et la circulation des renseignements.',grade:1,consequence:'Vous identifiez une circulation anormale de l’information sans neutraliser le relais technique.'}
        ],
        reveal:'Le responsable des habilitations est le relais interne. Son compte privilégié a permis de créer V-17, de préparer la sortie du convoi C et d’injecter le compte rendu B. La compromission a aussi effacé la dernière preuve administrative de réception du chargement, sans révéler sa destination. Une consultation suspecte de la liste des agents assassinés montre qu’ils avaient été exposés au réseau avant le massacre.',
        apply:{kern:{crisis:-1,flag:'s4_correct'},prisoner:{crisis:1,flag:'s4_wrong'},minister:{crisis:0,flag:'s4_partial'}}
      },
      5:{
        title:'POINT ZÉRO',
        briefing:'Le chargement déplacé à 04:17 est identifié : une ogive stratégique retirée d’un programme de démantèlement mais jamais enregistrée comme détruite. Trois sites correspondent à une partie de sa chaîne logistique.',
        question:'Dans quel site l’ogive est-elle réellement stockée ?',
        phases:[
          ['SITES','Comparez accès, poids, itinéraires, responsabilités administratives et capacité physique des trois sites.'],
          ['COMPTE À REBOURS','La crise héritée détermine la disponibilité des annexes et la solidité des vérifications complémentaires. N’inventez pas de chronomètre : hiérarchisez les pistes encore étayées.'],
          ['SYNTHÈSE','Reprenez V-17, le convoi C, le rapport B et le responsable des habilitations. La réponse doit expliquer toute la chaîne.'],
          ['POINT ZÉRO','Défendez le site retenu par au moins deux sources indépendantes, puis verrouillez votre décision.']
        ],
        secrets:{
          chef:['Le relais interne avait autorité sur certains ouvrages transférés au domaine civil, tandis que la base aérienne relève d’une autre chaîne. Une dérogation de transit militaire existe toutefois.','Comparer les pouvoirs de transfert aux preuves d’un stockage effectif.'],
          sigint:['Deux interruptions réseau jalonnent le trajet du convoi : une près du dépôt et une sur une ligne enterrée menant vers un ouvrage civil. Aucun signal ne prouve à lui seul un déchargement.','Distinguer passage, relais technique et lieu de stockage.'],
          terrain:['Une caméra routière situe le convoi C dans la vallée 32 minutes après l’explosion. Compte tenu de sa masse, il n’aurait pas pu atteindre la base par le col avant ce passage. Un transbordement ultérieur reste possible, mais aucun n’a été observé.','Utiliser le temps de trajet pour éliminer un mouvement précis, sans exclure un transfert secondaire imaginaire par certitude.'],
          source:['La détenue répète la formule « sous le niveau de l’eau » mais reconnaît ne jamais avoir vu le site. Elle a compris que le chargement devait servir à faire pression sur une autorité, sans connaître la cible. Son contact pouvait lui transmettre un lieu de couverture.','Tester la valeur d’un renseignement indirect plutôt que prendre une description pour une localisation.'],
          liaison:['Le gouvernement exige l’inspection prioritaire de la base et du dépôt. Aucun compte rendu de reconnaissance n’a encore été produit pour l’ouvrage civil.','Ne pas confondre urgence politique et comparaison contradictoire des trois sites.'],
          legal:['Un ouvrage civil a quitté les inventaires militaires, alors que le dépôt demeure sous contrôle de démantèlement. Les deux peuvent néanmoins figurer sur une chaîne de transport ancienne.','Distinguer contrôle administratif et présence physique du matériel.'],
          archive:['Une fiche prévoit un transfert vers une infrastructure civile; une seconde fiche, sans accusé de réception, évoque un retour au dépôt.','Faire le tri entre ordre de mouvement et preuve de réception.']
        },
        options:[
          {id:'nadir',title:'ANCIENNE GALERIE HYDROÉLECTRIQUE',detail:'L’ogive aurait été déplacée vers un ancien ouvrage civil souterrain.',grade:2,consequence:'L’ogive est retrouvée et sécurisée. La qualité de la victoire dépend du niveau de crise accumulé.'},
          {id:'airbase',title:'BASE AÉRIENNE ACTIVE',detail:'Le chargement aurait rejoint une installation militaire toujours active.',grade:0,consequence:'La base était une fausse piste et le dispositif de recherche perd un temps critique.'},
          {id:'depot',title:'ANCIEN DÉPÔT DE DÉMANTÈLEMENT',detail:'Le matériel serait resté dans la filière de démantèlement, sans atteindre un nouveau site.',grade:1,consequence:'Vous retrouvez l’origine de la disparition mais pas le stockage final.'}
        ],
        reveal:'L’ogive est stockée dans une ancienne galerie hydroélectrique passée sous gestion civile. Le convoi C y a livré le chargement à la faveur du protocole d’urgence. Le réseau cherchait à soustraire l’arme au démantèlement pour en faire un moyen de pression, tandis que le massacre initial, le faux drapeau et les faux documents servaient à effacer les traces de cette opération.',
        apply:{nadir:{crisis:-1,flag:'s5_nadir'},airbase:{crisis:2,flag:'s5_fail'},depot:{crisis:1,flag:'s5_late'}}
      }
    }
  },
  kuroi:{
    title:'KUROI',theme:'JAPON / DETTES / POLICE',min:5,max:7,
    chapters:{
      1:{
        title:'L’OYABUN',
        briefing:'Kenji Kurokawa, Oyabun de la Famille, est retrouvé mort dans une résidence privée. La police a besoin du clan pour comprendre la scène. Le clan a besoin de la police pour empêcher une guerre immédiate.',
        question:'Qui a réellement construit le meurtre de l’Oyabun ?',
        phases:[
          ['MAISON','Reconstituez qui pouvait entrer sans déclencher d’alerte.'],
          ['VISAGES','Chacun dit ce qu’il peut dire sans perdre la face. Les silences comptent autant que les affirmations.'],
          ['ORDRE / MAIN','Séparez celui qui a donné l’ordre de celui qui a exécuté le geste.'],
          ['PREMIER VERDICT','Le Conseil doit choisir une structure de responsabilité, pas encore un nom définitif.']
        ],
        secrets:{
          waka_k:['L’Oyabun voulait rompre une coopération ancienne avec certains policiers. Il avait préparé un dossier de sortie.','Protéger la Famille sans accuser Arakida par réflexe.'],
          kobun_k:['Tu as laissé entrer un policier connu de la maison la semaine précédente. Le soir du meurtre, on t’a ordonné de rester disponible.','Cacher ton degré d’implication sans inventer une attaque Arakida.'],
          waka_a:['Arakida avait intérêt à l’affaiblissement de Kurokawa, mais aucun homme du clan n’avait accès à la résidence cette nuit-là.','Éviter d’être le bouc émissaire tout en exploitant les divisions Kurokawa.'],
          kobun_a:['Un véhicule de police non marqué a quitté la rue neuf minutes avant l’appel officiel.','Forcer la police à expliquer un mouvement qu’elle n’a pas déclaré.'],
          commissaire:['Tu savais que l’Oyabun détenait des éléments pouvant détruire plusieurs carrières dans la police.','Maintenir l’enquête sous contrôle sans révéler ce que tu savais avant le meurtre.'],
          inspecteur:['L’accès de service a été ouvert par un badge de police, puis effacé du journal local.','Faire émerger la trace police sans accuser trop tôt ton propre supérieur.'],
          bengoshi:['L’Oyabun t’avait confié une enveloppe à publier s’il mourait “avant d’avoir quitté la dette”.','Conserver l’enveloppe comme levier jusqu’à ce que le groupe reconnaisse une implication policière.']
        },
        options:[
          {id:'police_hand',title:'ORDRE POLICE · MAIN KUROKAWA',detail:'Le meurtre vient d’une décision policière exécutée avec une main interne au clan.',grade:2,consequence:'La coopération continue, mais une dette cachée entre police et Kurokawa est désormais certaine.'},
          {id:'arakida',title:'COUP ARAKIDA',detail:'Le clan rival a infiltré la résidence.',grade:0,consequence:'Arakida est accusé à tort et la tension entre clans augmente.'},
          {id:'internal',title:'PURGE INTERNE KUROKAWA',detail:'Le meurtre est entièrement une lutte de succession.',grade:1,consequence:'Vous percevez la main interne mais pas l’ordre extérieur.'}
        ],
        reveal:'L’ordre vient de la police. L’exécution a été rendue possible par une dette ancienne à l’intérieur de Kurokawa. Le nom de l’exécutant reste encore caché.',
        apply:{police_hand:{flag:'k1_correct',debt:['POLICE','KUROKAWA','Le meurtre de l’Oyabun a créé une dette impossible à solder.']},arakida:{flag:'k1_wrong',chron:'Arakida a été accusé publiquement sans preuve.'},internal:{flag:'k1_partial',chron:'Kurokawa soupçonne désormais une main interne.'}}
      },
      2:{
        title:'GIRI',
        briefing:'Le Registre des dettes de l’Oyabun réapparaît. Certaines obligations ont été honorées, d’autres transmises. Une dette ancienne relie un policier à un homme de Kurokawa.',
        question:'Quelle dette explique pourquoi un homme de Kurokawa a obéi à un ordre extérieur ?',
        phases:[
          ['REGISTRE','Distinguez ON — dette reçue — et GIRI — obligation d’agir.'],
          ['HISTOIRE','Chaque rôle révèle une relation ancienne, pas nécessairement criminelle.'],
          ['TRANSMISSION','Une dette peut survivre à celui qui l’a créée. Cherchez ce qui a été transmis.'],
          ['OBLIGATION','Décidez quelle relation doit rester dans le registre persistant.']
        ],
        secrets:{
          waka_k:['Le Kobun Kurokawa a rejoint la Famille après qu’un dossier pénal contre son père a été discrètement requalifié.','Comprendre qu’une faveur extérieure a précédé sa loyauté au clan.'],
          kobun_k:['L’Inspecteur Mori a fait libérer ton père il y a onze ans. Tu lui as promis qu’un jour tu “répondrais présent”.','Cacher ou assumer une dette qui ne pouvait pas être réglée proprement.'],
          waka_a:['Arakida possède la preuve que Mori a rencontré le Kobun Kurokawa deux jours avant le meurtre.','Utiliser la preuve sans transformer Mori en seul cerveau.'],
          kobun_a:['Tu as vu Mori remettre une clé physique au Kobun Kurokawa. Aucun argent n’a changé de main.','Montrer que l’échange est une obligation, pas un contrat.'],
          commissaire:['Tu savais que Mori disposait d’un ancien levier sur un homme de Kurokawa. Tu as choisi de ne pas demander lequel.','Protéger la hiérarchie en maintenant l’ambiguïté entre savoir et ordre.'],
          inspecteur:['Tu as réellement aidé le père du Kobun. Tu as ensuite transmis une demande “de la part du Commissaire”.','Faire croire que tu n’as été qu’un messager sans nier la dette.'],
          bengoshi:['Le registre de l’Oyabun note : “Mori → Ren : ON ancien ; ne jamais laisser devenir GIRI.”','Décider quand révéler que l’Oyabun connaissait le risque exact.']
        },
        options:[
          {id:'mori_ren',title:'MORI → REN',detail:'Une faveur familiale ancienne est devenue obligation d’exécuter un service.',grade:2,consequence:'La dette centrale est inscrite dans le registre.'},
          {id:'arakida_k',title:'ARAKIDA → KUROKAWA',detail:'Une dette entre clans aurait imposé le meurtre.',grade:0,consequence:'Les clans se rapprochent de la guerre pour une dette inventée.'},
          {id:'oyabun_police',title:'OYABUN → POLICE',detail:'L’Oyabun devait encore quelque chose à la police.',grade:1,consequence:'Vous confirmez l’ancien lien, mais inversez le sens de l’obligation décisive.'}
        ],
        reveal:'L’Inspecteur Mori avait autrefois sauvé le père de Daichi Ren, Kobun Kurokawa. Cette faveur a été transformée en obligation au moment du meurtre.',
        apply:{mori_ren:{flag:'k2_correct',debt:['MORI','DAICHI REN','Une faveur familiale est devenue GIRI.']},arakida_k:{flag:'k2_wrong',chron:'Une fausse dette Arakida–Kurokawa circule dans les clans.'},oyabun_police:{flag:'k2_partial',chron:'Le sens des dettes police–Famille reste contesté.'}}
      },
      3:{
        title:'LES MAINS SALES',
        briefing:'La police demande désormais à la Famille de récupérer un registre avant l’Inspection interne. La coopération devient une opération de nettoyage. Refuser expose le clan ; accepter détruit une partie de la vérité.',
        question:'Que fait Kurokawa du registre ?',
        phases:[
          ['DEMANDE','Identifiez ce que la police ne peut pas faire officiellement.'],
          ['COÛT','Chaque camp estime ce qu’il perd en acceptant ou en refusant.'],
          ['DOUBLE JEU','Le même registre peut protéger le clan et condamner des policiers.'],
          ['CHOIX','Décidez ce que la Famille fait du registre. Le choix sera conservé dans la Chronique.']
        ],
        secrets:{
          waka_k:['Le registre contient aussi des paiements Kurokawa sans rapport avec le meurtre. Le rendre public affaiblit durablement la Famille.','Négocier sans effacer la preuve du meurtre.'],
          kobun_k:['Ton nom n’apparaît pas dans le registre ; celui de Mori apparaît à côté d’un code d’accès.','Utiliser le registre pour déplacer le soupçon sans avouer encore ton geste.'],
          waka_a:['Arakida peut garantir une copie hors de portée de la police si Kurokawa partage le document.','Obtenir une copie sans transformer la scène en alliance naïve.'],
          kobun_a:['Une équipe policière surveille déjà l’entrepôt où le registre est caché, mais elle attend que Kurokawa entre le premier.','Montrer que la police veut des mains privées sur une saisie qu’elle ne veut pas assumer.'],
          commissaire:['Le registre prouve que plusieurs opérations officieuses ont utilisé Kurokawa comme intermédiaire.','Empêcher que la preuve quitte le contrôle institutionnel.'],
          inspecteur:['Mori figure dans le registre, mais le Commissaire y apparaît sous un code que toi seul peux relier à lui.','Choisir entre te sauver et protéger ton supérieur.'],
          bengoshi:['Une clause du dossier de sortie de l’Oyabun ordonne de conserver toute preuve impliquant la police dans un dépôt tiers.','Préserver une copie indépendante, même si le groupe choisit de rendre l’original.']
        },
        options:[
          {id:'copy',title:'COPIE TIERS · ORIGINAL NÉGOCIÉ',detail:'Une copie est confiée à un dépositaire indépendant. Ce recours protège la preuve, mais expose les témoins et les activités non liées au meurtre à une enquête ultérieure.',grade:2,consequence:'Une preuve indépendante subsiste, mais le clan ne peut plus contrôler ce qu’une enquête ultérieure découvrira.'},
          {id:'police',title:'RENDRE À LA POLICE',detail:'Une remise officielle peut protéger les témoins à court terme, mais concentre les pièces chez des agents potentiellement compromis.',grade:0,consequence:'Des pages disparaissent et la police reprend l’initiative.'},
          {id:'clan',title:'GARDER AU CLAN',detail:'Le clan garde les preuves et protège ses sources, au prix de leur faible force probante devant une autorité extérieure.',grade:1,consequence:'La preuve survit, mais la coopération avec la police devient hostile.'}
        ],
        reveal:'La police voulait utiliser Kurokawa pour récupérer une preuve qu’elle ne pouvait saisir sans s’exposer. Le registre établit des liens entre opérations officieuses, accès à la résidence et membres de la police. L’auteur du commandement doit encore être distingué des exécutants.',
        apply:{copy:{flag:'k3_correct',chron:'Une copie indépendante du registre est mise à l’abri.'},police:{flag:'k3_wrong',chron:'Le registre revient sous contrôle policier et plusieurs pages disparaissent.'},clan:{flag:'k3_partial',chron:'Kurokawa conserve le registre et rompt une partie de la coopération.'}}
      },
      4:{
        title:'LA DETTE',
        briefing:'Les pièces sont enfin assez nombreuses pour nommer l’exécutant et remonter jusqu’à l’ordre. Mais reconnaître la vérité implique d’admettre que police et Kurokawa ont chacun utilisé l’autre.',
        question:'Quelle chaîne de responsabilité explique le meurtre ?',
        phases:[
          ['EXÉCUTANT','Identifiez la main physique sans confondre dette et initiative personnelle.'],
          ['ORDRE','Remontez de la demande transmise à celui qui en avait besoin.'],
          ['COUVERTURE','Qui a effacé les accès, qui a laissé faire et qui savait ?'],
          ['CHAÎNE','Le Conseil doit nommer la chaîne entière, pas un bouc émissaire.']
        ],
        secrets:{
          waka_k:['L’Oyabun avait décidé de rompre avec la police et de publier le dossier de sortie sous 72 heures.','Établir le mobile institutionnel.'],
          kobun_k:['Tu es Daichi Ren. Tu as tué l’Oyabun après que Mori a invoqué ta dette et transmis « la demande du Commissaire ». Tu sais ce que tu as fait, mais tu n’as jamais vu l’ordre écrit d’Ishida.','Décider si tu avoues avant que les autres reconstruisent la chaîne.'],
          waka_a:['Arakida possède une photo de Ren entrant par l’accès de service, mais aucune preuve de l’ordre.','Éviter qu’une preuve de l’exécutant efface les commanditaires.'],
          kobun_a:['Tu as vu Mori détruire une copie du journal d’accès après le meurtre.','Nommer la couverture séparément de l’ordre.'],
          commissaire:['Tu as ordonné que “le problème Kurokawa soit réglé avant vendredi”, sachant que Mori avait un levier sur Ren.','Maintenir une défense fondée sur l’ambiguïté des mots, si tu le peux.'],
          inspecteur:['Tu as transmis l’ordre, ouvert l’accès et effacé le journal. Tu n’as pas porté le coup.','Faire reconnaître les différents niveaux de responsabilité.'],
          bengoshi:['L’enveloppe contient trois mentions non signées, consignées séparément : une instruction venant du cabinet, un accès attribué à Mori et un rendez-vous de Ren. La note ne prouve pas à elle seule qui a ordonné de tuer.','Ne produire la note qu’après avoir entendu les versions de chacun.']
        },
        options:[
          {id:'chain',title:'ISHIDA → MORI → REN',detail:'Ordre du Commissaire, facilitation de l’Inspecteur, exécution du Kobun.',grade:2,consequence:'La chaîne complète entre au Registre et prépare le Conseil final.'},
          {id:'ren',title:'REN SEUL',detail:'Le Kobun a agi pour des raisons personnelles.',grade:0,consequence:'La police survit intacte et Kurokawa porte seul le crime.'},
          {id:'mori',title:'MORI → REN',detail:'L’Inspecteur a conçu et transmis l’opération sans ordre supérieur.',grade:1,consequence:'La facilitation est reconnue, mais le commandement reste protégé.'}
        ],
        reveal:'Le Commissaire Ishida a donné l’ordre. L’Inspecteur Mori a utilisé sa dette sur Daichi Ren pour le faire exécuter, puis a nettoyé les accès.',
        apply:{chain:{flag:'k4_correct',debt:['ISHIDA / MORI','KUROKAWA','La police a transformé une dette privée en meurtre.']},ren:{flag:'k4_wrong',chron:'Daichi Ren porte seul publiquement le meurtre.'},mori:{flag:'k4_partial',chron:'Mori est reconnu comme facilitateur, Ishida reste protégé.'}}
      },
      5:{
        title:'LE CONSEIL',
        briefing:'Le Conseil réunit Kurokawa, Arakida, des représentants de la police et le Bengoshi. La cellule dispose d’un récit du meurtre, mais sa solidité dépend des preuves préservées et des décisions antérieures. Il faut choisir ce qui sera révélé, à qui et avec quelles garanties.',
        question:'Que fait le Conseil de la vérité ?',
        phases:[
          ['MÉMOIRE','Relisez les dettes et la Chronique. Ce qui s’est passé dans les dossiers précédents limite les options crédibles.'],
          ['PRIX','Chaque rôle annonce ce qu’il accepte de perdre et ce qu’il refuse de sacrifier.'],
          ['FACE','Décidez ce qui doit être public, ce qui doit rester interne et qui doit assumer une conséquence visible.'],
          ['CONSEIL','Le choix final n’a pas une seule “bonne” réponse. Il définit l’héritage de KUROI.']
        ],
        secrets:{
          waka_k:['Tu peux survivre à une vérité partielle, mais une publication totale déclenchera aussi des poursuites sur d’autres activités Kurokawa.','Protéger la Famille sans reproduire l’omertà qui a permis le meurtre.'],
          kobun_k:['Tu peux reconnaître le geste et la dette si la chaîne de commandement est rendue publique en même temps.','Refuser d’être le seul sacrifice commode.'],
          waka_a:['Arakida gagnerait à l’effondrement de Kurokawa, mais une guerre ouverte détruirait les deux clans.','Choisir entre avantage immédiat et stabilité.'],
          kobun_a:['Tu sais que plusieurs jeunes membres quitteraient les clans si la vérité était rendue publique.','Donner un coût humain au choix institutionnel.'],
          commissaire:['Une publication complète détruit ta carrière et déclenche une enquête nationale.','Décider si tu négocies, nies ou assumes.'],
          inspecteur:['Tu peux témoigner contre Ishida et Ren, mais tu devras reconnaître ta propre participation.','Faire de la responsabilité partagée une option réelle.'],
          bengoshi:['L’enveloppe contient assez de preuves pour déclencher une enquête indépendante, mais l’Oyabun écrivait aussi : “ne remplacez pas un mensonge par une guerre”.','Forcer le Conseil à penser aux conséquences, pas seulement à la vengeance.']
        },
        options:[
          {id:'public',title:'VÉRITÉ PUBLIQUE',qualitative:true,detail:'Transmettre le dossier complet à une autorité indépendante et assumer les conséquences des deux côtés.',grade:2,consequence:'Fin — LA LUMIÈRE FROIDE : les institutions paient, la Famille se fracture mais la dette cesse d’être secrète.'},
          {id:'internal',title:'JUSTICE INTERNE',qualitative:true,detail:'Ishida tombe, Ren assume, mais le dossier intégral reste confidentiel au terme d’une procédure interne contestable.',grade:1,consequence:'Fin — LE SILENCE NÉGOCIÉ : la paix tient, mais une partie du système survit.'},
          {id:'scapegoat',title:'BOUC ÉMISSAIRE',qualitative:true,detail:'Attribuer officiellement le meurtre au clan rival pour préserver les dirigeants, malgré une chaîne de preuves contradictoire.',grade:0,consequence:'Fin — LA DETTE CONTINUE : le mensonge peut retarder une crise, mais le risque de représailles et de nouvelles obligations demeure.'}
        ],
        reveal:'Aucune décision du Conseil ne répare le meurtre. La valeur de chaque issue dépend des preuves conservées, des responsabilités établies et des personnes exposées.',
        apply:{public:{flag:'k5_public',chron:'Le dossier Kuroi est transmis à une autorité indépendante.'},internal:{flag:'k5_internal',chron:'Le Conseil impose une justice interne et maintient une partie du secret.'},scapegoat:{flag:'k5_scapegoat',chron:'Arakida devient le bouc émissaire officiel du meurtre.'}}
      }
    }
  }
};

function store(){try{return typeof STORAGE!=='undefined'?STORAGE:localStorage}catch{return localStorage}}
function readLive(){try{return JSON.parse(store().getItem(LIVE_KEY)||'null')}catch{return null}}
function saveLive(v){try{store().setItem(LIVE_KEY,JSON.stringify(v));return true}catch{return false}}
function clearLive(){try{store().removeItem(LIVE_KEY)}catch{}}
function randomInt(max){
  if(max<=1)return 0;
  try{const a=new Uint32Array(1),lim=Math.floor(0x100000000/max)*max;let x;do{crypto.getRandomValues(a);x=a[0]}while(x>=lim);return x%max}catch{return Math.floor(Math.random()*max)}
}
function shuffle(arr){arr=[...arr];for(let i=arr.length-1;i>0;i--){const j=randomInt(i+1);[arr[i],arr[j]]=[arr[j],arr[i]]}return arr}
function meta(id){return api()?.campaigns?.[id]||null}
function state(id){return api()?.get?.(id)||null}
function ensureCampaign(id){
  let s=state(id);
  if(!s&&api()?.begin){api().begin(id,false);s=state(id)}
  return s;
}
function shellPut(html){
  const root=document.getElementById('app');if(!root)return;
  root.innerHTML=typeof shell==='function'?shell(html,false):`<div class="app">${html}</div>`;
  requestAnimationFrame(()=>window.scrollTo({top:0,behavior:'auto'}));
}
function campaignFromNode(node){
  const page=node?.closest?.('.heritage-cendres,.heritage-kuroi');
  if(page?.classList.contains('heritage-cendres'))return 'cendres';
  if(page?.classList.contains('heritage-kuroi'))return 'kuroi';
  const card=node?.closest?.('.heritage-campaign');
  const t=(card?.textContent||'').toUpperCase();
  if(t.includes('CENDRES'))return 'cendres';if(t.includes('KUROI'))return 'kuroi';
  return null;
}
function completed(id,n){return !!state(id)?.completed?.includes(n)}
function current(id){return Math.max(1,Math.min(5,state(id)?.currentChapter||1))}
function campaignProgress(id){const s=state(id);return s?.completed?.length||0}
function activeLive(id,n){const l=readLive();return l&&l.campaignId===id&&Number(l.chapter)===Number(n)&&!l.finished?l:null}
function statusFor(id,n){if(completed(id,n))return 'ARCHIVÉ';if(n===current(id))return 'DISPONIBLE';return 'VERROUILLÉ'}
function toastSafe(m){try{if(typeof toast==='function')toast(m)}catch{}}
function campaignCarry(id){
  const s=state(id);if(!s)return [];
  if(id==='cendres'){
    const flags=s.cendres?.flags||{},network=s.cendres?.network||{nodes:[],links:[]},crisis=s.cendres?.crisis||{level:0,label:'SOUS CONTRÔLE'};
    const correct=Object.keys(flags).filter(k=>/_correct$/.test(k)&&flags[k]).length;
    return [`Crise : ${crisis.label||'SOUS CONTRÔLE'}`,`${network.nodes?.length||0} pistes classifiées`,`${network.links?.length||0} connexions`,`${correct} recoupement${correct>1?'s':''} fiable${correct>1?'s':''}`];
  }
  const debts=s.kuroi?.debts||[],chron=s.kuroi?.chronicle||[];
  const due=debts.filter(d=>d.status==='due').length;
  return [`${due} dette${due>1?'s':''} ouverte${due>1?'s':''}`,`${chron.length} fait${chron.length>1?'s':''} dans la Chronique`,`${Object.keys(s.kuroi?.flags||{}).filter(k=>/^k\d_/.test(k)).length} décisions héritées`];
}

function renderHub(){
  const c1=campaignProgress('cendres'),c2=campaignProgress('kuroi');
  shellPut(`<main class="page hplay hplay-hub">
    <header class="hplay-top"><button class="hplay-back" data-hp-action="home">← <span>Accueil</span></button><div class="hplay-mode">MODE HÉRITAGE <b>PREMIUM</b></div></header>
    <section class="hplay-hub-intro"><span class="hplay-eyebrow">CAMPAGNES PERSISTANTES</span><h1>MODE HÉRITAGE</h1><p>Une partie laisse des traces. Les informations, les dettes et les erreurs reviennent dans le dossier suivant.</p></section>
    <section class="hplay-hub-grid">
      ${hubCampaign('cendres',c1)}${hubCampaign('kuroi',c2)}
    </section>
  </main>`);
}
function hubCampaign(id,p){const m=meta(id),pack=PACKS[id];return `<button class="hplay-campaign-card hplay-theme-${id}" data-hp-campaign="${id}" type="button">
  <img src="${m.cover}" alt="" decoding="async"><span class="hplay-campaign-shade"></span>
  <span class="hplay-campaign-body"><em>${pack.theme}</em><strong>${m.title}</strong><small>${m.promise}</small><span class="hplay-campaign-foot"><b>${p}/5 DOSSIERS</b><i>${p?'CONTINUER':'COMMENCER'} →</i></span></span>
</button>`}

function renderCampaign(id){
  if(!CAMPAIGN_IDS.includes(id))return renderHub();
  ensureCampaign(id);const m=meta(id),s=state(id),pack=PACKS[id],cur=current(id),live=readLive();
  const carry=campaignCarry(id);
  const chapters=m.chapters.map(ch=>{
    const status=statusFor(id,ch.n),locked=status==='VERROUILLÉ',resume=activeLive(id,ch.n);
    return `<button type="button" class="hplay-case ${status==='DISPONIBLE'?'is-current':''} ${status==='ARCHIVÉ'?'is-done':''}" data-hp-chapter="${ch.n}" ${locked?'disabled':''}>
      <span class="hplay-case-poster"><img src="${esc(ch.poster)}" alt="Affiche ${esc(ch.title)}" loading="lazy" decoding="async"></span>
      <span class="hplay-case-copy"><em>${esc(ch.scenarioId||String(ch.n).padStart(3,'0'))}</em><strong>${esc(ch.title)}</strong><small>${esc(ch.note)}</small><b>${resume?'PARTIE EN COURS':status}</b></span>
      <i>${locked?'⌁':'›'}</i>
    </button>`;
  }).join('');
  const dash=id==='cendres'?renderCendresDash(s):renderKuroiDash(s);
  shellPut(`<main class="page hplay hplay-campaign hplay-theme-${id}">
    <header class="hplay-top"><button class="hplay-back" data-hp-action="hub">← <span>MODE HÉRITAGE</span></button><div class="hplay-mode">${pack.theme}</div></header>
    <section class="hplay-campaign-title"><span class="hplay-eyebrow">${esc(m.heritage)}</span><h1>${esc(m.title)}</h1><p>${esc(m.promise)}</p>${pack.definition?`<div class="hplay-campaign-definition"><b>CADRE DE LA CAMPAGNE</b><span>${esc(pack.definition)}</span></div>`:''}</section>
    <section class="hplay-campaign-hero"><img src="${m.cover}" alt=""><div><span>${campaignProgress(id)}/5 DOSSIERS</span><strong>${s?.status==='completed'?'CAMPAGNE TERMINÉE':`DOSSIER ${esc(m.chapters[cur-1]?.scenarioId||String(cur).padStart(3,'0'))} ACTIF`}</strong></div></section>
    <section class="hplay-campaign-layout">
      <div class="hplay-panel hplay-cases-panel"><div class="hplay-section-head"><div><span>DOSSIERS</span><h2>Progression</h2></div><b>SÉQUENTIELLE</b></div><div class="hplay-cases">${chapters}</div></div>
      <aside class="hplay-side">${dash}<div class="hplay-panel hplay-carry"><div class="hplay-section-head"><div><span>CE QUI REVIENT</span><h2>Héritage actif</h2></div></div>${carry.map(x=>`<p>${esc(x)}</p>`).join('')}</div></aside>
    </section>
    <details class="hplay-management"><summary>Gestion de campagne</summary><div><button class="btn ghost" data-hp-action="backup" data-campaign="${id}">COPIER LA SAUVEGARDE</button><button class="btn ghost hplay-danger" data-hp-action="reset" data-campaign="${id}">RÉINITIALISER</button></div></details>
  </main>`);
}
function renderCendresDash(s){const c=s?.cendres||{},level=Math.max(0,Math.min(4,c.crisis?.level||0));return `<div class="hplay-panel hplay-dashboard">
  <div class="hplay-section-head"><div><span>CARTE DE CONTRE-INGÉRENCE</span><h2>État persistant</h2></div><b>${esc(c.crisis?.label||'SOUS CONTRÔLE')}</b></div>
  <div class="hplay-meter">${[0,1,2,3,4].map(i=>`<i class="${i<=level?'on':''}"></i>`).join('')}</div>
  <div class="hplay-stats"><span><b>${c.network?.nodes?.length||0}</b><small>PISTES</small></span><span><b>${c.network?.links?.length||0}</b><small>CONNEXIONS</small></span><span><b>${level}</b><small>CRISE</small></span></div>
</div>`}
function renderKuroiDash(s){const k=s?.kuroi||{},debts=k.debts||[],due=debts.filter(d=>d.status==='due').length;return `<div class="hplay-panel hplay-dashboard">
  <div class="hplay-section-head"><div><span>REGISTRE KUROI</span><h2>Relations persistantes</h2></div><b>${due} DETTE${due>1?'S':''}</b></div>
  <div class="hplay-clans">${Object.values(k.clans||{}).slice(0,4).map(c=>`<span><b>${esc(c.label)}</b><small>${c.members?.length||0} inscrit${(c.members?.length||0)>1?'s':''}</small></span>`).join('')}</div>
  <div class="hplay-stats"><span><b>${due}</b><small>DETTES</small></span><span><b>${k.chronicle?.length||0}</b><small>CHRONIQUE</small></span><span><b>${Object.keys(k.flags||{}).length}</b><small>CHOIX</small></span></div>
</div>`}

function renderChapter(id,n){
  ensureCampaign(id);n=Number(n);if(n>current(id)&&!completed(id,n))return renderCampaign(id);
  const m=meta(id),ch=m.chapters[n-1],pack=PACKS[id],pc=pack.chapters[n],live=activeLive(id,n),archived=completed(id,n);
  const carry=campaignCarry(id);
  shellPut(`<main class="page hplay hplay-dossier hplay-theme-${id}">
    <header class="hplay-top"><button class="hplay-back" data-hp-action="campaign" data-campaign="${id}">← <span>${esc(m.title)}</span></button><div class="hplay-mode">DOSSIER 0${n}</div></header>
    <section class="hplay-dossier-grid">
      <div class="hplay-poster"><img src="${ch.poster}" alt="Affiche ${esc(ch.title)}"></div>
      <div class="hplay-dossier-copy"><span class="hplay-eyebrow">${esc(m.title)} · DOSSIER 0${n}</span><h1>${esc(ch.title)}</h1><p class="hplay-lead">${esc(pc.briefing)}</p>
        <div class="hplay-carry-strip">${carry.map(x=>`<span>${esc(x)}</span>`).join('')}</div>
        <div class="hplay-launch-box"><b>${archived?'DOSSIER ARCHIVÉ':live?'PARTIE EN COURS':'PRÊT À JOUER'}</b><p>${id==='kuroi'?'5 à 7 joueurs · rôles Kurokawa / Arakida / Police':'5 à 7 joueurs · cellule interne d’un service de renseignement'} · téléphone partagé pour les informations privées.</p>
          <button class="btn primary hplay-launch" data-hp-action="${live?'resume':'setup'}" data-campaign="${id}" data-chapter="${n}">${live?'REPRENDRE LA PARTIE':archived?'REJOUER LE DOSSIER':'LANCER LA PARTIE'}</button>
        </div>
      </div>
    </section>
    <section class="hplay-panel hplay-structure"><div class="hplay-section-head"><div><span>RYTHME</span><h2>Comment se joue ce dossier</h2></div></div><div class="hplay-phase-preview">${pc.phases.map((p,i)=>`<span><b>0${i+1}</b><strong>${esc(p[0])}</strong><small>${esc(p[1])}</small></span>`).join('')}</div></section>
  </main>`);
}

function renderSetup(id,n){
  const pack=PACKS[id],m=meta(id),pc=pack.chapters[n],existing=readLive();
  const count=Math.max(pack.min,Math.min(pack.max,existing?.players?.length||pack.min));
  shellPut(`<main class="page hplay hplay-setup hplay-theme-${id}">
    <header class="hplay-top"><button class="hplay-back" data-hp-action="chapter" data-campaign="${id}" data-chapter="${n}">← <span>${esc(pc.title)}</span></button><div class="hplay-mode">PRÉPARATION</div></header>
    <section class="hplay-setup-head"><span class="hplay-eyebrow">${esc(m.title)} · DOSSIER 0${n}</span><h1>Composer la cellule</h1><p>Entrez les prénoms ou pseudos. Les cartes privées seront révélées une par une, puis le téléphone revient au centre de la table.</p></section>
    <form class="hplay-panel hplay-setup-form" id="hplaySetupForm" data-campaign="${id}" data-chapter="${n}">
      <div class="hplay-count-row"><div><b>JOUEURS</b><small>${pack.min}–${pack.max} joueurs</small></div><div class="hplay-stepper"><button type="button" data-hp-count="-1">−</button><strong id="hplayCount">${count}</strong><button type="button" data-hp-count="1">+</button></div></div>
      <div id="hplayNames" class="hplay-names"></div>
      <button class="btn primary hplay-start" type="submit">ATTRIBUER LES RÔLES</button>
    </form>
  </main>`);
  buildNameFields(count,existing?.players||[]);setTimeout(()=>$('#hplayNames input')?.focus({preventScroll:true}),80);
}
function buildNameFields(count,players=[]){const wrap=$('#hplayNames');if(!wrap)return;wrap.innerHTML=Array.from({length:count},(_,i)=>`<label><span>J${i+1}</span><input maxlength="22" autocomplete="off" inputmode="text" value="${esc(players[i]?.name||'')}" placeholder="Pseudo ${i+1}" required></label>`).join('')}

function startSession(id,n,names){
  const pack=PACKS[id];if(!pack?.chapters[n]||n>current(id)||names.length<pack.min||names.length>pack.max)return;
  const ids=id==='kuroi'?(names.length===5?['waka_k','kobun_k','waka_a','commissaire','inspecteur']:names.length===6?['waka_k','kobun_k','waka_a','commissaire','inspecteur','bengoshi']:ROLES[id].map(r=>r.id)):ROLES[id].slice(0,names.length).map(r=>r.id);
  const roles=shuffle(ids.map(roleId=>roleFor(id,roleId)));
  const practice=completed(id,n);
  const players=names.map((name,i)=>({id:`p${i+1}`,name:txt(name,22)||`Joueur ${i+1}`,roleId:roles[i].id}));
  const live={version:2,campaignId:id,chapter:n,players,revealIndex:0,revealed:[],phaseIndex:0,stage:'reveal',decision:null,result:null,practice,startedAt:new Date().toISOString(),finished:false};
  saveLive(live);renderReveal(live,false);
}
function roleFor(id,roleId){return ROLES[id].find(r=>r.id===roleId)}
function secretFor(live,roleId){return PACKS[live.campaignId].chapters[live.chapter].secrets[roleId]||['Aucune information supplémentaire.','Aider le groupe à recouper les faits.']}
function renderReveal(live,show){
  const p=live.players[live.revealIndex],role=roleFor(live.campaignId,p.roleId),sec=secretFor(live,p.roleId),total=live.players.length;
  shellPut(`<main class="page hplay hplay-reveal hplay-theme-${live.campaignId}">
    <header class="hplay-top"><button class="hplay-back" data-hp-action="abort">× <span>Quitter</span></button><div class="hplay-mode">CARTE PRIVÉE ${live.revealIndex+1}/${total}</div></header>
    <section class="hplay-private ${show?'is-open':'is-closed'}">
      ${show?`<span class="hplay-eyebrow">${esc(p.name)}</span><h1>${esc(role.name)}</h1><p>${esc(role.public)}</p><div class="hplay-secret"><span>INFORMATION PRIVÉE</span><b>${esc(sec[0])}</b></div><div class="hplay-objective"><span>OBJECTIF PERSONNEL</span><b>${esc(sec[1])}</b></div><button class="btn primary" data-hp-action="hide-next">MASQUER & PASSER</button>`:`<div class="hplay-sealed">◇</div><span class="hplay-eyebrow">PASSEZ LE TÉLÉPHONE À</span><h1>${esc(p.name)}</h1><p>Personne d’autre ne doit regarder l’écran.</p><button class="btn primary" data-hp-action="reveal">RÉVÉLER MA CARTE</button>`}
    </section>
  </main>`);
}
function advanceReveal(){const l=readLive();if(!l)return;const idx=l.revealIndex;if(!l.revealed.includes(idx))l.revealed.push(idx);if(idx>=l.players.length-1){l.stage='play';l.phaseIndex=0;saveLive(l);renderPlay(l);return}l.revealIndex++;saveLive(l);renderReveal(l,false)}

function renderPlay(live){
  const pc=PACKS[live.campaignId].chapters[live.chapter],idx=Math.max(0,Math.min(pc.phases.length-1,live.phaseIndex||0)),phase=pc.phases[idx];
  const s=live.online?live.campaignCarry:state(live.campaignId),conditional=conditionalIntel(live.campaignId,live.chapter,s),annex=idx>=1?missingRoleIntel(live,idx,s):'',late=cendresLateEvidence(live,idx,s)||kuroiLateEvidence(live,idx,s);
  shellPut(`<main class="page hplay hplay-session hplay-theme-${live.campaignId}">
    <header class="hplay-top"><button class="hplay-back" data-hp-action="session-menu">••• <span>Session</span></button><div class="hplay-mode">PHASE ${idx+1}/${pc.phases.length}</div></header>
    <section class="hplay-session-head"><span class="hplay-eyebrow">${esc(PACKS[live.campaignId].title)} · DOSSIER 0${live.chapter}</span><h1>${esc(phase[0])}</h1><p>${esc(phase[1])}</p></section>
    <section class="hplay-session-grid">
      <div class="hplay-panel hplay-table-card"><span>AU CENTRE DE LA TABLE</span><h2>${idx===0?'Briefing commun':idx===pc.phases.length-1?'Décision à verrouiller':'Recoupement en cours'}</h2><p>${idx===0?esc(pc.briefing):idx===pc.phases.length-1?esc(pc.question):'Posez les informations à voix haute. Une information privée peut être racontée, jamais montrée directement.'}</p>${conditional?`<div class="hplay-conditional"><b>HÉRITAGE ACTIF</b><span>${esc(conditional)}</span></div>`:''}${late?`<div class="hplay-conditional hplay-audit"><b>RECOUPEMENT TARDIF</b><span>${esc(late)}</span></div>`:''}${annex?`<div class="hplay-conditional hplay-annex"><b>ANNEXE DE CELLULE</b><span>${esc(annex)}</span></div>`:''}</div>
      <aside class="hplay-panel hplay-roster"><span>RÔLES À TABLE</span>${live.players.map(p=>`<div><b>${esc(p.name)}</b><small>${esc(roleFor(live.campaignId,p.roleId)?.name||'')}</small></div>`).join('')}</aside>
    </section>
    <nav class="hplay-session-nav"><button class="btn ghost" data-hp-action="phase-prev" ${idx===0?'disabled':''}>← PRÉCÉDENT</button>${idx<pc.phases.length-1?`<button class="btn primary" data-hp-action="phase-next">PHASE SUIVANTE →</button>`:`<button class="btn primary" data-hp-action="decision">OUVRIR LE VOTE COLLECTIF →</button>`}</nav>
  </main>`);
}

function missingRoleIntel(live,phaseIndex,carry){
  const selected=new Set(live.players.map(p=>p.roleId));
  let omitted=ROLES[live.campaignId].filter(r=>!selected.has(r.id));
  if(!omitted.length)return '';
  const secrets=PACKS[live.campaignId].chapters[live.chapter].secrets;
  if(live.campaignId==='kuroi'){
    const neutral={
      kobun_a:{1:'Un véhicule non marqué a été observé près de la résidence ; il reste à dater son trajet.',2:'Un échange de clé sans paiement a été constaté entre deux intermédiaires.',3:'L’entrepôt est surveillé ; aucune saisie officielle n’a encore été enregistrée.',4:'Une copie du journal d’accès a disparu après le meurtre.',5:'Des membres subalternes envisagent de quitter les clans si la crise s’étend.'},
      bengoshi:{1:'Une enveloppe scellée existe, mais son contenu ne peut être présumé.',2:'Le registre consigne une ancienne faveur ; son sens et son effet doivent être établis.',3:'Une clause prévoit un dépôt indépendant des pièces mettant en cause la police.',4:'L’enveloppe rassemble trois traces à des dates distinctes, sans ordre criminel signé.',5:'Une transmission externe protégerait certaines preuves mais pourrait aussi exposer les témoins.'}
    };
    return omitted.map(r=>`${r.name} (rôle absent) : ${neutral[r.id]?.[live.chapter]||'La pièce attend un recoupement.'}`).join(' · ');
  }
  if(live.campaignId==='cendres'){
    const crisis=Math.max(0,Number(carry?.cendres?.crisis?.level||0)),last=PACKS.cendres.chapters[live.chapter].phases.length-1;
    if(crisis>=3&&phaseIndex<last)return 'CRISE · Les annexes des rôles absents sont retenues en validation. Elles seront libérées avant la synthèse finale.';
    if(crisis===2&&phaseIndex<last){omitted=omitted.slice(0,1);return omitted.map(r=>`${r.name} (rôle absent) : ${secrets[r.id]?.[0]||''}`).join(' · ')+' · CRISE : les autres annexes restent en validation jusqu’à la synthèse.'}
  }
  return omitted.map(r=>`${r.name} (rôle absent) : ${secrets[r.id]?.[0]||''}`).join(' · ');
}

function conditionalIntel(id,n,s){
  if(n<2||!s)return '';
  if(id==='cendres'){
    const f=s.cendres?.flags||{};
    if(n===4){const good=['s1_correct','s2_correct','s3_correct'].filter(k=>f[k]).length;return good>=2?`Vos recoupements précédents sont solides (${good}/3). Les traces techniques offrent une base solide pour distinguer les droits de consultation, de validation et d’écriture.`:`Votre carte est contaminée : seulement ${good}/3 recoupements antérieurs sont fiables. Exigez deux preuves indépendantes avant toute classification.`}
    if(n===5){const good=['s1_correct','s2_correct','s3_correct','s4_correct'].filter(k=>f[k]).length;return good>=3?`La chaîne V-17 → 04:17 → accès internes est suffisamment stable pour éliminer un site par cohérence administrative.`:`La crise a absorbé une partie de vos certitudes. Vous devez privilégier contraintes physiques et habilitations plutôt que les synthèses précédentes.`}
    return `Le niveau de crise actuel est ${s.cendres?.crisis?.label||'SOUS CONTRÔLE'}.`;
  }
  const f=s.kuroi?.flags||{},debts=s.kuroi?.debts||[];
  if(n===2)return f.k1_correct?'L’accès policier et la main interne sont deux constats distincts. Identifiez la dette qui les relie.':f.k1_wrong?'L’accusation d’Arakida a durci les échanges. Ne confondez pas intérêt du rival et preuve d’accès.':'Une piste interne domine, mais le commanditaire reste à identifier. Ne confondez pas succession et contrainte.';
  if(n===3)return f.k2_correct?'La dette Mori–Ren est inscrite au registre. Un document confisqué pourrait établir sa transformation en obligation.':f.k2_wrong?'Une dette interclanique contestée ralentit l’accès au registre. Il faut sécuriser une preuve indépendante.':'Le sens de la dette police–Famille est encore discuté. Préserver l’original ne suffit pas à rendre son interprétation fiable.';
  if(n===4)return f.k3_correct?'Une copie extérieure est préservée. La cellule peut comparer signatures et registres sans dépendre de la seule police.':f.k3_wrong?'Les pièces confiées à la police sont désormais incomplètes. Le groupe doit confronter les journaux, les témoignages et les traces antérieures.':'Le registre a été conservé par le clan, sans chaîne de conservation indépendante. Toute accusation devra être corroborée.';
  if(n===5){const protectedCopy=!!f.k3_correct,chain=!!f.k4_correct;return `${protectedCopy?'Une copie indépendante du registre est conservée.':'La conservation indépendante des pièces n’a pas été garantie.'} ${chain?'La chaîne de responsabilité a été établie.':'La chaîne de commandement reste contestée.'} ${debts.filter(d=>d.status==='due').length} dette(s) ouverte(s) figurent au registre. Le Conseil doit tenir compte de ces limites.`}
  return '';
}

// A late dossier exhibit is shared with the whole cell. It does not overwrite private role cards.
// Its precision varies with the campaign already played (including online host carry).
function cendresLateEvidence(live,phaseIndex,carry){
  if(live.campaignId!=='cendres'||phaseIndex<2)return '';
  const f=carry?.cendres?.flags||{},crisis=Math.max(0,Math.min(4,Number(carry?.cendres?.crisis?.level||0)));
  if(live.chapter===3)return 'Une vérification de conservation révèle un écart entre une version papier et une exportation numérique. L’audition brute et les droits de modification doivent être comparés avant de rejeter toute la source.';
  if(live.chapter===4){
    if(crisis>=3)return 'Le journal d’administration a été récupéré partiellement. Il confirme une écriture technique lors de plusieurs opérations, mais le rattachement nominal reste à recouper avec les niveaux de droit.';
    const solid=['s1_correct','s2_correct','s3_correct'].filter(k=>f[k]).length;
    return solid>=2?'L’audit différé distingue la transmission d’une instruction et sa traduction en écriture administrative. Un compte de service a modifié les pièces : son détenteur reste à établir à partir des délégations et des autres cartes.':'Une délégation technique commune relie les opérations. Le relevé nominatif manque : départagez les droits de lecture, d’ordre et d’écriture à partir des cartes privées.';
  }
  if(live.chapter===5){
    if(crisis>=3)return 'Le dernier contrôle de transit est incomplet. Il situe le convoi sur une route de vallée, mais aucune réception authentifiée n’a pu être obtenue. Le groupe doit s’appuyer sur ses recoupements antérieurs.';
    if(f.s4_correct)return 'Un relevé récupéré après neutralisation du relais atteste d’un passage hors inventaire dans un circuit de maintenance civil. L’adresse est caviardée et les mentions du dépôt comme de la base sont antérieures au dernier mouvement connu.';
    return 'Une trace d’accès civil a été retrouvée sur la route du convoi, mais le dernier accusé de réception est manquant. Comparez-la avec les témoignages et les droits d’accès.';
  }
  return '';
}

// Shared exhibits stay neutral when no player holds a specialized KUROI role.
function kuroiLateEvidence(live,phaseIndex,carry){
  if(live.campaignId!=='kuroi'||phaseIndex<2)return '';
  const f=carry?.kuroi?.flags||{};
  if(live.chapter===1)return 'Les horodatages de la résidence et ceux d’un véhicule non marqué ne coïncident pas avec la chronologie officielle. Le badge prouve un accès, pas l’auteur de l’ordre.';
  if(live.chapter===2)return 'Une mention ancienne du registre suit la faveur familiale, tandis qu’un relevé plus récent décrit un service demandé. Le passage de l’une à l’autre reste à établir.';
  if(live.chapter===3)return 'Une inspection a été annoncée avant la demande de récupération du registre. La chaîne de garde actuelle ne permet pas de garantir que toutes les pages seront préservées.';
  if(live.chapter===4){
    if(f.k3_correct)return 'Le dépôt tiers confirme des anomalies entre la main qui a ouvert l’accès et la personne qui a transmis l’instruction. La pièce ne suffit pas à attribuer le commandement.';
    if(f.k3_wrong)return 'La copie institutionnelle comporte des lacunes datées après sa remise. Des témoignages sur la dette et les accès doivent être confrontés sans présumer leur auteur.';
    return 'La copie gardée par le clan montre plusieurs accès, mais son historique est incomplet. Une convergence de témoignages reste nécessaire pour départager les responsabilités.';
  }
  if(live.chapter===5){
    if(f.k3_correct&&f.k4_correct)return 'Les pièces convergent, mais leur divulgation exposerait aussi des faits extérieurs au meurtre et des personnes encore vulnérables.';
    if(f.k3_wrong)return 'Des pages n’ont pas été retrouvées après la remise à la police. Une transmission au dehors ferait apparaître les lacunes autant que les éléments conservés.';
    return 'L’absence de chaîne de conservation indépendante rend plusieurs accusations plus difficiles à soutenir ; le Conseil devra nommer cette incertitude.';
  }
  return '';
}
function kuroiFinalConsequence(live,opt){
  if(!opt||live.campaignId!=='kuroi'||Number(live.chapter)!==5)return opt?.consequence||'';
  const carry=live.online?live.campaignCarry:state('kuroi'),flags=carry?.kuroi?.flags||{};
  const copy=!!flags.k3_correct,chain=!!flags.k4_correct;
  if(opt.id==='public'){
    if(copy&&chain)return 'LA LUMIÈRE FROIDE — Une copie indépendante et une chaîne de responsabilité étayée sont remises à une autorité extérieure. Des enquêtes s’ouvrent contre les policiers et des activités du clan ; les témoins devront être protégés.';
    if(!copy&&!chain)return 'LA LUMIÈRE FRAGILE — Le Conseil transmet les preuves disponibles, mais ni leur conservation ni toute la chaîne de commandement ne sont garanties. Une enquête indépendante pourra établir les lacunes, sans promettre de condamnations.';
    return 'LA LUMIÈRE INCOMPLÈTE — Une enquête extérieure est saisie. Les pièces réunies permettent des vérifications, mais la conservation des documents ou l’attribution du commandement laisse subsister une difficulté majeure.';
  }
  if(opt.id==='internal')return chain?'LE SILENCE NÉGOCIÉ — La responsabilité de la chaîne est reconnue dans le Conseil, mais sans contrôle extérieur les sanctions et la paix entre clans restent précaires.':'LE SILENCE NÉGOCIÉ — Le Conseil propose des responsabilités internes alors que le commandement demeure contesté. La paix obtenue repose sur des concessions difficiles à vérifier.';
  return 'LA DETTE CONTINUE — Le récit accusant Arakida protège momentanément certains acteurs, mais les preuves discordantes et les représailles possibles menacent la paix entre clans.';
}
function cendresFinalConsequence(live,opt){
  if(!opt||live.campaignId!=='cendres'||Number(live.chapter)!==5)return opt?.consequence||'';
  const carry=live.online?live.campaignCarry:state('cendres');
  const crisis=Math.max(0,Math.min(4,Number(carry?.cendres?.crisis?.level||0)));
  if(opt.id==='nadir'){
    if(crisis>=3)return 'L’ogive est récupérée. Mais les vérifications retardées et les dossiers contaminés laissent une compromission institutionnelle majeure à traiter : la victoire opérationnelle n’efface pas les erreurs héritées.';
    if(crisis>=1)return 'L’ogive est récupérée. Plusieurs pistes ont toutefois été traitées trop tard et la cellule laisse une crise résiduelle dans la chaîne de renseignement.';
    return 'L’ogive est récupérée et les principales pièces ont été préservées. La cellule transmet une chaîne de preuves cohérente et limite les dégâts institutionnels.';
  }
  if(opt.id==='airbase'&&crisis>=3)return 'La recherche est engagée sur une base sans réception authentifiée. Dans une crise déjà dégradée, cette erreur prive la cellule d’une localisation exploitable à temps.';
  return opt.consequence;
}
function ensureCendresBallot(live){
  if(!live.ballot||!Array.isArray(live.ballot.votes)||!Number.isInteger(live.ballot.index)){
    live.ballot={round:1,index:0,votes:[],show:false};
    saveLive(live);
  }
  return live.ballot;
}
function renderDecision(live){
  const pc=PACKS[live.campaignId].chapters[live.chapter];
  if((live.campaignId==='cendres'||live.campaignId==='kuroi')&&!live.online){
    const b=ensureCendresBallot(live),p=live.players[b.index];
    if(!p)return;
    shellPut(`<main class="page hplay hplay-decision hplay-theme-${live.campaignId}">
      <header class="hplay-top"><button class="hplay-back" data-hp-action="play">← <span>Discussion</span></button><div class="hplay-mode">VOTE ${b.index+1}/${live.players.length} · TOUR ${b.round}</div></header>
      <section class="hplay-decision-head"><span class="hplay-eyebrow">MAJORITÉ COLLECTIVE · VOTE PRIVÉ</span><h1>${b.show?esc(pc.question):`Passez le téléphone à ${esc(p.name)}`}</h1>
        <p>${b.show?'Choisissez votre propre hypothèse. Votre vote sera masqué au joueur suivant.':'Tous les membres de la cellule doivent voter. La décision ne sera révélée qu’après le dernier vote.'}</p>
      </section>
      ${b.show?`<section class="hplay-options">${pc.options.map(o=>`<button type="button" data-hp-option="${o.id}"><span>${esc(o.title)}</span><small>${esc(o.detail)}</small><i>VOTER →</i></button>`).join('')}</section>`:
      `<section class="hplay-panel"><p>Tour ${b.round} · ${b.votes.length}/${live.players.length} votes reçus.</p><button class="btn primary" data-hp-action="ballot-reveal">JE SUIS PRÊT À VOTER</button></section>`}
    </main>`);
    return;
  }
  shellPut(`<main class="page hplay hplay-decision hplay-theme-${live.campaignId}">
    <header class="hplay-top"><button class="hplay-back" data-hp-action="play">← <span>Discussion</span></button><div class="hplay-mode">DÉCISION</div></header>
    <section class="hplay-decision-head"><span class="hplay-eyebrow">${(live.campaignId==='cendres'||live.campaignId==='kuroi')?'VOTE COLLECTIF · UN BULLETIN PAR JOUEUR':'CHOIX IRRÉVERSIBLE'}</span><h1>${esc(pc.question)}</h1><p>${(live.campaignId==='cendres'||live.campaignId==='kuroi')?'Votez sur votre propre téléphone. Le résultat n’est dévoilé qu’après le scrutin et une majorité absolue.':'Le groupe doit arrêter une seule réponse. Le résultat sera ajouté à la campagne si ce dossier n’a pas déjà été archivé.'}</p></section>
    <section class="hplay-options">${pc.options.map(o=>`<button type="button" data-hp-option="${o.id}"><span>${esc(o.title)}</span><small>${esc(o.detail)}</small><i>${(live.campaignId==='cendres'||live.campaignId==='kuroi')?'VOTER →':'VERROUILLER →'}</i></button>`).join('')}</section>
  </main>`);
}
function chooseOption(id){
  const l=readLive();if(!l)return;
  const pc=PACKS[l.campaignId].chapters[l.chapter];let opt=pc.options.find(o=>o.id===id);
  if(!opt)return;
  if((l.campaignId==='cendres'||l.campaignId==='kuroi')&&!l.online){
    const b=ensureCendresBallot(l);
    if(!b.show||b.index>=l.players.length)return;
    b.votes.push(id);b.index++;b.show=false;
    if(b.votes.length<l.players.length){saveLive(l);renderDecision(l);return}
    const counts={};for(const v of b.votes)counts[v]=(counts[v]||0)+1;
    const winner=Object.keys(counts).find(k=>counts[k]>Math.floor(l.players.length/2));
    if(!winner){
      b.round++;b.index=0;b.votes=[];
      saveLive(l);renderDecision(l);toastSafe('Aucune majorité absolue : nouveau tour de vote.');return;
    }
    id=winner;opt=pc.options.find(o=>o.id===id);
  }
  l.decision=id;l.result={grade:opt.grade,title:opt.title,consequence:opt.consequence};
  l.stage='result';saveLive(l);renderResult(l);
}
function renderResult(live){const pc=PACKS[live.campaignId].chapters[live.chapter],opt=pc.options.find(o=>o.id===live.decision),label=opt.qualitative?'Choix d’héritage':opt.grade===2?'Recoupement réussi':opt.grade===1?'Vérité partielle':'Erreur de lecture';shellPut(`<main class="page hplay hplay-result hplay-theme-${live.campaignId}">
  <header class="hplay-top"><div class="hplay-mode">RÉVÉLATION</div></header>
  <section class="hplay-result-card"><span class="hplay-eyebrow">${label.toUpperCase()}</span><h1>${esc(opt.title)}</h1><p class="hplay-result-truth">${esc(pc.reveal)}</p><div class="hplay-result-consequence"><span>CONSÉQUENCE</span><b>${esc(live.campaignId==='kuroi'?kuroiFinalConsequence(live,opt):cendresFinalConsequence(live,opt))}</b></div>${live.practice?'<div class="hplay-practice">REJOUÉ — la sauvegarde principale ne sera pas modifiée.</div>':''}<button class="btn primary" data-hp-action="finish">${live.practice?'TERMINER LE REPLAY':'INSCRIRE DANS L’HÉRITAGE'}</button></section>
</main>`)}

function applyResult(live){
  if(!live||live.finished)return;
  const pc=PACKS[live.campaignId].chapters[live.chapter],out=pc.apply?.[live.decision]||{};
  if(live.result&&live.campaignId==='kuroi'&&Number(live.chapter)===5)live.result.consequence=kuroiFinalConsequence(live,pc.options.find(o=>o.id===live.decision));
  if(live.result&&live.campaignId==='cendres'&&Number(live.chapter)===5)live.result.consequence=cendresFinalConsequence(live,pc.options.find(o=>o.id===live.decision));
  if(!live.practice&&!completed(live.campaignId,live.chapter)){
    if(live.campaignId==='cendres'){
      const commit=api()?.cendres?.commitDecision?.({
        chapter:live.chapter,decision:live.decision,grade:live.result?.grade||0,
        consequence:live.result?.consequence||'',crisisDelta:Number(out.crisis||0),flag:out.flag||''
      });
      if(!commit?.ok){toastSafe('Sauvegarde impossible : le dossier reste ouvert. Réessayez.');return}
    }else{
      const commit=api()?.kuroi?.commitDecision?.({
        chapter:live.chapter,decision:live.decision,flag:out.flag||'',
        debt:out.debt||null,chron:out.chron||'',
        title:live.result?.title||'',consequence:live.result?.consequence||''
      });
      if(!commit?.ok){toastSafe('Sauvegarde impossible : le dossier reste ouvert. Réessayez.');return}
    }
    rememberDecision(live.campaignId,live.chapter,live.decision);
  }
  live.finished=true;live.stage='finished';saveLive(live);
  clearLive();renderCampaign(live.campaignId);toastSafe(live.practice?'Replay terminé.':'Dossier inscrit dans l’Héritage.');
}
function decisionKey(id,n){return `igr_heritage_decision_${id}_${n}`}
function rememberDecision(id,n,v){try{store().setItem(decisionKey(id,n),v)}catch{}}
function findPreviousDecision(id,n){try{return store().getItem(decisionKey(id,n))||'archive'}catch{return 'archive'}}

function resumeLive(){const l=readLive();if(!l)return renderHub();if(l.stage==='reveal')return renderReveal(l,false);if(l.stage==='play')return renderPlay(l);if(l.stage==='decision'){if((l.campaignId==='cendres'||l.campaignId==='kuroi')&&!l.online&&l.ballot?.show){l.ballot.show=false;saveLive(l)}return renderDecision(l)}if(l.stage==='result')return renderResult(l);renderChapter(l.campaignId,l.chapter)}
function sessionMenu(){const l=readLive();if(!l)return;const ok=confirm('Quitter cette partie ? La session restera enregistrée et pourra être reprise depuis le dossier.');if(ok)renderChapter(l.campaignId,l.chapter)}
function abortSession(){if(!confirm('Abandonner cette partie Héritage ? La session en cours sera effacée.'))return;const l=readLive();clearLive();if(l)renderChapter(l.campaignId,l.chapter);else renderHub()}

function patchHomeCard(){
  const card=$('.heritage-premium-home-action');if(!card)return;
  const h=$('.heritage-premium-copy h3',card),p=$('.heritage-premium-copy p',card);
  const desired=isFr()?'MODE HÉRITAGE':'HERITAGE MODE';
  const sub=isFr()?'Campagnes persistantes · accès premium':'Persistent campaigns · premium access';
  if(h&&h.textContent!==desired)h.textContent=desired;if(p&&p.textContent!==sub)p.textContent=sub;
}
function maybeUpgradeOldHeritage(){
  patchHomeCard();
  const page=$('.heritage-page:not(.hplay)');if(!page)return;
  const h1=$('h1',page)?.textContent?.trim()?.toUpperCase();
  if(h1==='HÉRITAGE'||h1==='HERITAGE'){renderHub()}
}

function handleClick(e){
  const target=e.target.closest?.('[data-hp-action],[data-hp-campaign],[data-hp-chapter],[data-hp-option],[data-hp-count]');
  if(target){
    e.preventDefault();
    const a=target.dataset.hpAction;
    if(target.dataset.hpCampaign&&!a)return renderCampaign(target.dataset.hpCampaign);
    if(target.dataset.hpChapter&&!a){const id=campaignFromNode(target)||target.closest('.hplay')?.className.match(/hplay-theme-(cendres|kuroi)/)?.[1];return renderChapter(id,Number(target.dataset.hpChapter))}
    if(target.dataset.hpOption)return chooseOption(target.dataset.hpOption);
    if(target.dataset.hpCount){const form=$('#hplaySetupForm'),id=form?.dataset.campaign,n=Number(form?.dataset.chapter),pack=PACKS[id],count=Number($('#hplayCount')?.textContent||pack.min);const next=Math.max(pack.min,Math.min(pack.max,count+Number(target.dataset.hpCount)));if(next!==count){$('#hplayCount').textContent=String(next);buildNameFields(next,$$('#hplayNames input').map(x=>({name:x.value}))) }return}
    if(a==='home'){try{renderHome()}catch{location.reload()}return}
    if(a==='hub')return renderHub();
    if(a==='campaign')return renderCampaign(target.dataset.campaign);
    if(a==='chapter')return renderChapter(target.dataset.campaign,Number(target.dataset.chapter));
    if(a==='setup')return renderSetup(target.dataset.campaign,Number(target.dataset.chapter));
    if(a==='resume')return resumeLive();
    if(a==='reveal'){const l=readLive();if(l)return renderReveal(l,true)}
    if(a==='hide-next')return advanceReveal();
    if(a==='phase-next'){const l=readLive();if(l){l.phaseIndex=Math.min(PACKS[l.campaignId].chapters[l.chapter].phases.length-1,(l.phaseIndex||0)+1);saveLive(l);renderPlay(l)}return}
    if(a==='phase-prev'){const l=readLive();if(l){l.phaseIndex=Math.max(0,(l.phaseIndex||0)-1);saveLive(l);renderPlay(l)}return}
    if(a==='decision'){const l=readLive();if(l){l.stage='decision';saveLive(l);renderDecision(l)}return}
    if(a==='ballot-reveal'){const l=readLive();if((l?.campaignId==='cendres'||l?.campaignId==='kuroi')&&!l.online&&l.stage==='decision'){ensureCendresBallot(l).show=true;saveLive(l);renderDecision(l)}return}
    if(a==='play'){const l=readLive();if(l){if((l.campaignId==='cendres'||l.campaignId==='kuroi')&&!l.online&&l.ballot)l.ballot.show=false;l.stage='play';saveLive(l);renderPlay(l)}return}
    if(a==='finish'){const l=readLive();if(l)applyResult(l);return}
    if(a==='session-menu')return sessionMenu();
    if(a==='abort')return abortSession();
    if(a==='backup'){api()?.backup?.(target.dataset.campaign);return}
    if(a==='reset'){api()?.reset?.(target.dataset.campaign);setTimeout(()=>renderCampaign(target.dataset.campaign),0);return}
  }

  // Capture the legacy Heritage cards before their inline onclick handlers run.
  const oldCampaign=e.target.closest?.('.heritage-campaign');
  if(oldCampaign&&!oldCampaign.closest('.hplay')){const id=campaignFromNode(oldCampaign);if(id){e.preventDefault();e.stopImmediatePropagation();renderCampaign(id);return}}
  const oldChapter=e.target.closest?.('.heritage-chapter');
  if(oldChapter&&!oldChapter.closest('.hplay')){const id=campaignFromNode(oldChapter);if(id&&!oldChapter.disabled){const rows=$$('.heritage-chapter',oldChapter.parentElement);const n=Math.max(1,rows.indexOf(oldChapter)+1);e.preventDefault();e.stopImmediatePropagation();renderChapter(id,n);return}}
}
function handleSubmit(e){const form=e.target.closest?.('#hplaySetupForm');if(!form)return;e.preventDefault();const names=$$('input',form).map(i=>txt(i.value,22)).filter(Boolean),pack=PACKS[form.dataset.campaign];if(names.length<pack.min){toastSafe(`Il faut au moins ${pack.min} joueurs.`);return}startSession(form.dataset.campaign,Number(form.dataset.chapter),names)}

function boot(){
  document.addEventListener('click',handleClick,true);
  document.addEventListener('submit',handleSubmit,true);
  const observer=new MutationObserver(()=>queueMicrotask(maybeUpgradeOldHeritage));
  observer.observe(document.documentElement,{childList:true,subtree:true});
  patchHomeCard();
  setTimeout(maybeUpgradeOldHeritage,0);
  window.addEventListener('pageshow',()=>setTimeout(patchHomeCard,0),{passive:true});
  window.IGR_HERITAGE_PLAY=Object.freeze({version:VERSION,open:renderHub,openCampaign:renderCampaign,openChapter:renderChapter,resume:resumeLive,finishOnlineConfirmed:(serverRoom=null,serverPractice=false)=>{
    // A finished room is the authority on the verdict. Recover even if the last
    // local result screen was lost during a refresh or a reconnect.
    const room=serverRoom&&typeof serverRoom==='object'?serverRoom:null;
    if(!room||room.stage!=='finished')return false;
    const saved=readLive();
    const campaign=room?.campaign_id||saved?.campaignId;
    const chapter=Number(room?.chapter||saved?.chapter);
    const decision=room?.decision_id||saved?.decision;
    const ch=PACKS[campaign]?.chapters?.[chapter];
    const opt=ch?.options?.find(o=>o.id===decision);
    if(!opt)return false;
    if(!serverPractice&&!completed(campaign,chapter)&&current(campaign)!==chapter)return false;
    const same=saved?.online&&saved.campaignId===campaign&&Number(saved.chapter)===chapter;
    const live=same?{...saved}:{
      version:2,online:true,campaignId:campaign,chapter,players:[],
      decision,practice:!!serverPractice,campaignCarry:room?.campaign_carry||null,
      result:null,stage:'result',finished:false
    };
    live.decision=decision;
    live.stage='result';live.finished=false;
    live.practice=!!serverPractice;
    if(room)live.campaignCarry=room.campaign_carry||live.campaignCarry||null;
    live.result={grade:opt.grade,title:opt.title,consequence:opt.consequence};
    try{
      applyResult(live);
      return live.practice||!!api()?.get?.(campaign)?.completed?.includes(chapter);
    }catch(error){console.warn('[Heritage] failed to persist confirmed result',error);return false}
  },roleCard:(campaign,chapter,roleId)=>{const r=roleFor(campaign,roleId),sec=PACKS[campaign]?.chapters?.[Number(chapter)]?.secrets?.[roleId]||['',''];return r?Object.freeze({name:r.name,public:r.public||'',secret:sec[0]||'',objective:sec[1]||''}):null}});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
