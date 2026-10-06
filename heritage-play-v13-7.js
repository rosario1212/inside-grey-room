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
    {id:'chef',name:'CHEF DE CELLULE',public:'Coordonne les décisions et tranche quand le groupe se divise.'},
    {id:'sigint',name:'ANALYSTE SIGINT',public:'Lit les horaires, communications et anomalies techniques.'},
    {id:'terrain',name:'AGENT TERRAIN',public:'Connaît les lieux, filatures et contraintes opérationnelles.'},
    {id:'source',name:'OFFICIER TRAITANT',public:'Évalue les sources humaines, leurs motifs et leurs mensonges.'},
    {id:'liaison',name:'LIAISON VESPER',public:'Représente les autorités et mesure le coût politique des erreurs.'},
    {id:'legal',name:'ANALYSTE JUDICIAIRE',public:'Sépare preuve exploitable, hypothèse et contamination du dossier.'},
    {id:'archive',name:'ARCHIVISTE ORPHÉE',public:'Recoupe les archives anciennes et les identités effacées.'}
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
    title:'CENDRES',theme:'INTELLIGENCE / VESPER',min:5,max:7,
    chapters:{
      1:{
        title:'PERSONNE N’EXISTE',
        briefing:'Une équipe clandestine est massacrée dans un appartement sûr. Parmi les dossiers retrouvés figure ÉLIAS VENN : passeport valide, comptes actifs, dossiers médicaux cohérents — mais aucune trace antérieure à six mois.',
        question:'Que représente réellement ÉLIAS VENN ?',
        phases:[
          ['SCÈNE','Recoupez la scène et les horaires. Ne cherchez pas encore un coupable : cherchez ce qui ne devrait pas pouvoir exister.'],
          ['IDENTITÉ','Chaque joueur expose une seule information privée. Interdiction de montrer l’écran : vous devez la raconter.'],
          ['CONTRADICTION','Décidez quelles données peuvent avoir été fabriquées après coup et lesquelles nécessitent une présence physique réelle.'],
          ['CLASSIFICATION','Classez VENN avant de verrouiller le dossier. Cette classification sera réutilisée dans les dossiers suivants.']
        ],
        secrets:{
          chef:['La cellule avait reçu l’ordre de surveiller VENN, jamais de l’arrêter. L’ordre venait d’un canal Vesper authentique.','Empêcher le groupe de confondre ordre authentique et cible authentique.'],
          sigint:['Tous les appels attribués à VENN proviennent de trois relais différents, mais avec exactement la même dérive d’horloge de 41 ms.','Faire comprendre qu’une identité numérique peut être fabriquée de façon centralisée.'],
          terrain:['Deux voisins jurent avoir vu “VENN”, mais leurs descriptions ne correspondent pas. Les deux ont reçu la même photo après les faits.','Distinguer témoin de personne réelle et témoin influencé.'],
          source:['Une source CERBÈRES emploie “VENN” comme mot de validation, jamais comme nom de personne.','Garder la source crédible sans révéler trop tôt qu’elle connaît CERBÈRES.'],
          liaison:['Le ministère exige un suspect nominatif avant 22 h. Politiquement, “VENN” est la réponse la plus commode.','Résister à la pression de fabriquer une certitude.'],
          legal:['Aucune donnée biométrique brute de VENN n’existe : seulement des copies ou résumés administratifs.','Faire distinguer preuve primaire et document dérivé.'],
          archive:['Le nom VENN apparaît dans un manuel ORPHÉE vieux de neuf ans à côté de la mention “identité fantôme / routage”.','Révéler l’archive au moment où elle peut être recoupée, pas comme argument d’autorité.']
        },
        options:[
          {id:'alias',title:'IDENTITÉ FANTÔME',detail:'VENN est un alias opérationnel partagé, pas une personne unique.',grade:2,consequence:'Le réseau gagne un premier nœud fiable et la crise reste contenue.'},
          {id:'agent',title:'AGENT CERBÈRES',detail:'VENN est une personne réelle à retrouver.',grade:0,consequence:'La cellule gaspille ses moyens sur une cible qui n’existe pas.'},
          {id:'victim',title:'VICTIME SUPPRIMÉE',detail:'VENN a existé mais CERBÈRES a effacé toute trace antérieure.',grade:1,consequence:'Vous conservez l’hypothèse, mais le dossier reste contaminé par une fausse piste.'}
        ],
        reveal:'ÉLIAS VENN n’est pas une personne. CERBÈRES utilise cette identité fantôme comme enveloppe administrative pour plusieurs opérations.',
        apply:{alias:{crisis:0,flag:'s1_correct'},agent:{crisis:1,flag:'s1_wrong'},victim:{crisis:1,flag:'s1_partial'}}
      },
      2:{
        title:'04:17',
        briefing:'À 04:17, une attaque frappe le terminal Est de Vesper. Dans les huit minutes suivantes, trois convois officiels quittent une zone sous protocole d’urgence. CERBÈRES revendique l’attaque sous un nom qui n’existe dans aucun de ses messages antérieurs.',
        question:'Quel était l’objectif principal de l’attaque de 04:17 ?',
        phases:[
          ['IMPACT','Séparez ce qui attire l’attention de ce qui profite réellement de la crise.'],
          ['MOUVEMENTS','Recoupez les convois, badges et changements de procédure déclenchés par l’urgence.'],
          ['FAUX DRAPEAU','Cherchez qui avait intérêt à signer l’attaque d’un nom nouveau.'],
          ['PRIORITÉ','Vous n’avez les moyens de suivre qu’une piste. Choisissez celle qui survivra au dossier suivant.']
        ],
        secrets:{
          chef:['Le protocole 04:17 a déplacé automatiquement les matières classifiées vers un site secondaire.','Obliger le groupe à raisonner sur les effets institutionnels de l’attaque.'],
          sigint:['La revendication a été publiée 38 secondes avant la première alerte interne officielle.','Établir qu’un acteur connaissait le timing avant les services de Vesper.'],
          terrain:['Le convoi C n’a pas utilisé sa route de secours prévue ; il a pris une route préparée la veille.','Faire du trajet C un indice, pas une preuve suffisante.'],
          source:['Une source décrit ORPHÉE comme “ce que l’on déplace quand tout le monde regarde ailleurs”.','Relier ORPHÉE à un transfert sans prétendre savoir encore ce que c’est.'],
          liaison:['Le gouvernement veut attribuer l’attaque à Arken pour pouvoir fermer la frontière.','Empêcher le besoin politique de devenir la vérité du dossier.'],
          legal:['Deux badges du convoi C ont été activés avec des identifiants créés après minuit.','Faire revenir la logique des identités fabriquées du dossier 01.'],
          archive:['Un ancien plan CERBÈRES emploie le code 04:17 pour “fenêtre de substitution logistique”.','Relier l’heure à une procédure, pas à un groupe revendicatif.']
        },
        options:[
          {id:'transfer',title:'COUVRIR UN TRANSFERT',detail:'L’attaque sert à faire sortir ORPHÉE sous couverture du protocole d’urgence.',grade:2,consequence:'Vous suivez le bon convoi et préservez une piste exploitable.'},
          {id:'border',title:'PROVOQUER ARKEN',detail:'Le but est de créer un casus belli à la frontière.',grade:1,consequence:'La dimension politique est réelle, mais vous perdez le mouvement matériel.'},
          {id:'terror',title:'FRAPPER VESPER',detail:'L’attaque est une opération de terreur autonome.',grade:0,consequence:'Le transfert disparaît avant que la cellule comprenne ce qu’elle devait suivre.'}
        ],
        reveal:'04:17 est une diversion logistique. L’attaque a déclenché exactement le protocole permettant de déplacer ORPHÉE sans contrôle normal.',
        apply:{transfer:{crisis:0,flag:'s2_correct'},border:{crisis:1,flag:'s2_partial'},terror:{crisis:1,flag:'s2_wrong'}}
      },
      3:{
        title:'LA CHAMBRE',
        briefing:'Une opératrice CERBÈRES capturée est enfermée dans une chambre d’interrogatoire sans fenêtre. Trois comptes rendus de ses déclarations circulent. L’un d’eux contient une phrase qu’elle n’a jamais prononcée.',
        question:'Quel élément du dossier d’interrogatoire est contaminé ?',
        phases:[
          ['SOURCE','Évaluez la prisonnière : ce qu’elle sait, ce qu’elle croit et ce qu’elle veut obtenir.'],
          ['TRANSCRIPTIONS','Comparez formulation, horodatage et chaîne de validation des trois comptes rendus.'],
          ['PRESSION','Un ordre exige une conclusion immédiate. Décidez si vous continuez à exploiter le dossier ou si vous le geler.'],
          ['RECOUPEMENT','Choisissez la contamination précise. Le dossier 04 utilisera ce que vous laissez entrer ici.']
        ],
        secrets:{
          chef:['Le compte rendu B est le seul validé par un superviseur absent cette nuit-là.','Faire auditer la chaîne de validation, pas seulement le contenu.'],
          sigint:['L’horodatage du fichier B précède de neuf minutes la création de l’enregistrement audio auquel il est censé correspondre.','Donner une anomalie technique décisive.'],
          terrain:['La prisonnière a dessiné de mémoire un carrefour correspondant au trajet du convoi C.','Conserver la valeur de la source malgré une pièce falsifiée.'],
          source:['La prisonnière ment sur son ancienneté dans CERBÈRES mais dit vrai sur le transfert ORPHÉE.','Éviter le raisonnement “elle ment donc tout est faux”.'],
          liaison:['Le cabinet du ministre cite déjà la phrase du compte rendu B dans une note confidentielle.','Identifier une fuite en amont de la validation.'],
          legal:['Le compte rendu B n’a pas de signature cryptographique, contrairement aux deux autres.','Faire isoler B sans invalider A et C.'],
          archive:['La phrase suspecte reprend mot pour mot une doctrine CERBÈRES publiée dans un vieux dossier public.','Montrer qu’elle a pu être greffée pour rendre la source “trop parfaite”.']
        },
        options:[
          {id:'b',title:'COMPTE RENDU B',detail:'B a été injecté dans la chaîne et doit être exclu.',grade:2,consequence:'La source reste exploitable et une contamination interne est confirmée.'},
          {id:'source',title:'LA SOURCE ENTIÈRE',detail:'La prisonnière manipule tout le dossier.',grade:0,consequence:'Vous perdez une piste réelle et CERBÈRES gagne du temps.'},
          {id:'audio',title:'L’ENREGISTREMENT AUDIO',detail:'L’audio a été remonté, les textes sont fiables.',grade:1,consequence:'Vous isolez une anomalie mais conservez une pièce falsifiée dans la synthèse.'}
        ],
        reveal:'Le compte rendu B a été fabriqué à l’intérieur de Vesper. La prisonnière ment sur elle-même, mais plusieurs de ses informations opérationnelles sont exactes.',
        apply:{b:{crisis:0,flag:'s3_correct'},source:{crisis:1,flag:'s3_wrong'},audio:{crisis:1,flag:'s3_partial'}}
      },
      4:{
        title:'CENDRES',
        briefing:'Le réseau commence à apparaître. Les identités fantômes, le transfert 04:17 et le faux compte rendu convergent vers une même infrastructure interne. Mais les erreurs des trois premiers dossiers ont peut-être déjà contaminé votre carte.',
        question:'Quel nœud doit être classé comme relais interne CERBÈRES ?',
        phases:[
          ['CARTE','Posez à voix haute les liens dont vous êtes certains. Tout lien non recoupé reste une hypothèse.'],
          ['HÉRITAGE','Relisez les conséquences des trois dossiers précédents affichées dans l’état persistant.'],
          ['RELais','Trois personnes ont accès aux mêmes systèmes. Une seule explique à la fois VENN, 04:17 et le compte rendu B.'],
          ['CLASSIFICATION','Verrouillez le relais. Une erreur ici modifiera les options du Point Zéro.']
        ],
        secrets:{
          chef:['Marius KERN a signé les habilitations du protocole 04:17 et la délégation du superviseur absent.','Faire converger deux chaînes administratives vers KERN.'],
          sigint:['Les créations d’identités VENN et les accès du compte rendu B utilisent le même certificat racine : bureau K-9.','Relier le numérique à une autorité concrète.'],
          terrain:['Le convoi C s’est arrêté 96 secondes dans le parking réservé au bureau K-9 avant de disparaître des caméras.','Apporter le lien physique manquant.'],
          source:['La prisonnière ne connaît pas KERN par son nom mais décrit “le gardien des portes de Vesper”.','Éviter de transformer une description en reconnaissance formelle.'],
          liaison:['KERN est politiquement intouchable : il dirige la coordination des accès classifiés.','Tester si le groupe cède à la protection institutionnelle.'],
          legal:['Une délégation signée KERN permettait de produire des identités administratives sans biométrie primaire.','Fournir le mécanisme juridique de VENN.'],
          archive:['Dans les archives ORPHÉE, K-9 signifie “keeper”, pas “kilometer”.','Fermer l’ambiguïté du code K-9.']
        },
        options:[
          {id:'kern',title:'MARIUS KERN',detail:'Le coordinateur des accès est le relais interne qui relie les trois dossiers.',grade:2,consequence:'CERBÈRES perd son relais principal à Vesper.'},
          {id:'prisoner',title:'LA PRISONNIÈRE',detail:'Elle a organisé la contamination depuis sa capture.',grade:0,consequence:'Le vrai relais reste actif et prépare Point Zéro.'},
          {id:'minister',title:'LE CABINET DU MINISTRE',detail:'La fuite politique prouve que le cabinet dirige le réseau.',grade:1,consequence:'Vous identifiez une compromission secondaire mais pas le nœud opérationnel.'}
        ],
        reveal:'Marius KERN est le relais interne de CERBÈRES. Il a utilisé ses habilitations pour fabriquer VENN, ouvrir la fenêtre 04:17 et injecter le compte rendu B.',
        apply:{kern:{crisis:-1,flag:'s4_correct'},prisoner:{crisis:1,flag:'s4_wrong'},minister:{crisis:0,flag:'s4_partial'}}
      },
      5:{
        title:'POINT ZÉRO',
        briefing:'ORPHÉE est enfin identifié : une ogive stratégique disparue des inventaires après un programme de démantèlement. Trois sites peuvent l’abriter. CERBÈRES déclenche une dernière série de fausses alertes pour vous faire choisir trop vite.',
        question:'Où se trouve réellement ORPHÉE ?',
        phases:[
          ['SITES','Comparez logistique, accès et contraintes physiques des trois sites.'],
          ['COMPTE À REBOURS','La crise atteint son niveau final. Vos erreurs antérieures réduisent le temps et la quantité d’informations fiables.'],
          ['SYNTHÈSE','Reprenez VENN, 04:17, la Chambre et KERN. La réponse doit expliquer les quatre dossiers, pas seulement le dernier indice.'],
          ['POINT ZÉRO','Choisissez le site. Il n’y aura pas de retour arrière.']
        ],
        secrets:{
          chef:['KERN avait autorité sur les tunnels hydroélectriques déclassés mais pas sur la base aérienne.','Faire revenir les habilitations comme fil directeur.'],
          sigint:['Les coupures réseau associées à 04:17 suivent une ligne enterrée vers le complexe hydroélectrique Nadir.','Relier la trace numérique au site Nadir.'],
          terrain:['Le convoi C était trop lourd pour l’itinéraire montagne de la base, mais compatible avec la rampe de service Nadir.','Écarter la base par contrainte physique.'],
          source:['La prisonnière disait “sous l’eau, mais jamais mouillé”. Nadir possède une galerie sèche derrière le barrage.','Donner une description qui ne vaut qu’avec les autres indices.'],
          liaison:['Le gouvernement veut évacuer la capitale, ce qui détournerait les forces de Nadir.','Protéger la décision opérationnelle de la panique politique.'],
          legal:['Le site Nadir n’apparaît plus dans les inventaires militaires depuis son transfert au ministère de l’Énergie.','Expliquer pourquoi ORPHÉE peut y être caché sans alerte militaire.'],
          archive:['Le manuel ORPHÉE désigne “Point Zéro” comme un site civil converti, jamais une installation active.','Éliminer la base aérienne et le dépôt militaire.']
        },
        options:[
          {id:'nadir',title:'GALERIE NADIR',detail:'Ancienne galerie hydroélectrique devenue angle mort administratif.',grade:2,consequence:'ORPHÉE est retrouvé. La qualité de la victoire dépend de l’état de crise accumulé.'},
          {id:'airbase',title:'BASE AÉRIENNE R-6',detail:'Site militaire évident, sécurisé et proche de la capitale.',grade:0,consequence:'La base est un leurre. CERBÈRES garde l’initiative.'},
          {id:'depot',title:'DÉPÔT SABLE',detail:'Ancien dépôt de démantèlement où l’ogive a officiellement disparu.',grade:1,consequence:'Vous retrouvez la chaîne historique mais arrivez après le transfert final.'}
        ],
        reveal:'ORPHÉE se trouve dans la galerie sèche du complexe Nadir. La campagne se conclut selon votre choix final et le niveau de crise laissé par les quatre dossiers précédents.',
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
        question:'Pourquoi la police veut-elle que Kurokawa récupère le registre ?',
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
          {id:'copy',title:'COPIE TIERS · ORIGINAL NÉGOCIÉ',detail:'Une copie indépendante est préservée avant toute négociation.',grade:2,consequence:'La vérité survit sans exposer immédiatement tout le clan.'},
          {id:'police',title:'RENDRE À LA POLICE',detail:'Le registre retourne entièrement sous contrôle institutionnel.',grade:0,consequence:'Des pages disparaissent et la police reprend l’initiative.'},
          {id:'clan',title:'GARDER AU CLAN',detail:'Kurokawa conserve le registre et refuse toute remise.',grade:1,consequence:'La preuve survit, mais la coopération avec la police devient hostile.'}
        ],
        reveal:'La police voulait utiliser Kurokawa pour récupérer une preuve qu’elle ne pouvait saisir sans s’exposer. Le registre relie les opérations officieuses au meurtre de l’Oyabun.',
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
          kobun_k:['Tu es Daichi Ren. Tu as tué l’Oyabun après que Mori a invoqué ta dette et transmis “la demande du Commissaire”.','Décider si tu avoues avant que les autres reconstruisent la chaîne.'],
          waka_a:['Arakida possède une photo de Ren entrant par l’accès de service, mais aucune preuve de l’ordre.','Éviter qu’une preuve de l’exécutant efface les commanditaires.'],
          kobun_a:['Tu as vu Mori détruire une copie du journal d’accès après le meurtre.','Nommer la couverture séparément de l’ordre.'],
          commissaire:['Tu as ordonné que “le problème Kurokawa soit réglé avant vendredi”, sachant que Mori avait un levier sur Ren.','Maintenir une défense fondée sur l’ambiguïté des mots, si tu le peux.'],
          inspecteur:['Tu as transmis l’ordre, ouvert l’accès et effacé le journal. Tu n’as pas porté le coup.','Faire reconnaître les différents niveaux de responsabilité.'],
          bengoshi:['L’enveloppe de l’Oyabun contient une note : “Ishida ordonne. Mori fait faire. Ren paie sa dette.”','Ne produire la note qu’après avoir entendu les versions de chacun.']
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
        briefing:'La vérité est connue. Le Conseil réunit Kurokawa, Arakida, la police et le Bengoshi. Il ne s’agit plus seulement de savoir qui a tué : il faut décider ce que devient une vérité capable de détruire plusieurs institutions.',
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
          {id:'public',title:'VÉRITÉ PUBLIQUE',detail:'Transmettre le dossier complet à une autorité indépendante et assumer les conséquences des deux côtés.',grade:2,consequence:'Fin — LA LUMIÈRE FROIDE : les institutions paient, la Famille se fracture mais la dette cesse d’être secrète.'},
          {id:'internal',title:'JUSTICE INTERNE',detail:'Ishida tombe, Ren assume, mais le dossier complet ne devient pas public.',grade:1,consequence:'Fin — LE SILENCE NÉGOCIÉ : la paix tient, mais une partie du système survit.'},
          {id:'scapegoat',title:'BOUC ÉMISSAIRE',detail:'Accuser Arakida et refermer le dossier.',grade:0,consequence:'Fin — LA DETTE CONTINUE : la guerre évitée aujourd’hui devient la prochaine dette.'}
        ],
        reveal:'Il n’existe pas de fin sans coût. KUROI mesure ce que le groupe accepte de rendre public, de sacrifier et de transmettre à ceux qui restent.',
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
    return [`Crise : ${crisis.label||'SOUS CONTRÔLE'}`,`${network.nodes?.length||0} identités classifiées`,`${network.links?.length||0} connexions`,`${correct} recoupement${correct>1?'s':''} fiable${correct>1?'s':''}`];
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
      <span class="hplay-case-poster hplay-case-lite"><b>${esc(ch.scenarioId||String(ch.n).padStart(3,'0'))}</b><small>${esc(m.title)}</small></span>
      <span class="hplay-case-copy"><em>${esc(ch.scenarioId||String(ch.n).padStart(3,'0'))}</em><strong>${esc(ch.title)}</strong><small>${esc(ch.note)}</small><b>${resume?'PARTIE EN COURS':status}</b></span>
      <i>${locked?'⌁':'›'}</i>
    </button>`;
  }).join('');
  const dash=id==='cendres'?renderCendresDash(s):renderKuroiDash(s);
  shellPut(`<main class="page hplay hplay-campaign hplay-theme-${id}">
    <header class="hplay-top"><button class="hplay-back" data-hp-action="hub">← <span>MODE HÉRITAGE</span></button><div class="hplay-mode">${pack.theme}</div></header>
    <section class="hplay-campaign-title"><span class="hplay-eyebrow">${esc(m.heritage)}</span><h1>${esc(m.title)}</h1><p>${esc(m.promise)}</p></section>
    <section class="hplay-campaign-hero"><img src="${m.cover}" alt=""><div><span>${campaignProgress(id)}/5 DOSSIERS</span><strong>${s?.status==='completed'?'CAMPAGNE TERMINÉE':`DOSSIER ${esc(m.chapters[cur-1]?.scenarioId||String(cur).padStart(3,'0'))} ACTIF`}</strong></div></section>
    <section class="hplay-campaign-layout">
      <div class="hplay-panel hplay-cases-panel"><div class="hplay-section-head"><div><span>DOSSIERS</span><h2>Progression</h2></div><b>SÉQUENTIELLE</b></div><div class="hplay-cases">${chapters}</div></div>
      <aside class="hplay-side">${dash}<div class="hplay-panel hplay-carry"><div class="hplay-section-head"><div><span>CE QUI REVIENT</span><h2>Héritage actif</h2></div></div>${carry.map(x=>`<p>${esc(x)}</p>`).join('')}</div></aside>
    </section>
    <details class="hplay-management"><summary>Gestion de campagne</summary><div><button class="btn ghost" data-hp-action="backup" data-campaign="${id}">COPIER LA SAUVEGARDE</button><button class="btn ghost hplay-danger" data-hp-action="reset" data-campaign="${id}">RÉINITIALISER</button></div></details>
  </main>`);
}
function renderCendresDash(s){const c=s?.cendres||{},level=Math.max(0,Math.min(4,c.crisis?.level||0));return `<div class="hplay-panel hplay-dashboard">
  <div class="hplay-section-head"><div><span>DOSSIER CERBÈRES</span><h2>État persistant</h2></div><b>${esc(c.crisis?.label||'SOUS CONTRÔLE')}</b></div>
  <div class="hplay-meter">${[0,1,2,3,4].map(i=>`<i class="${i<=level?'on':''}"></i>`).join('')}</div>
  <div class="hplay-stats"><span><b>${c.network?.nodes?.length||0}</b><small>IDENTITÉS</small></span><span><b>${c.network?.links?.length||0}</b><small>CONNEXIONS</small></span><span><b>${level}</b><small>CRISE</small></span></div>
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
        <div class="hplay-launch-box"><b>${archived?'DOSSIER ARCHIVÉ':live?'PARTIE EN COURS':'PRÊT À JOUER'}</b><p>${id==='kuroi'?'5 à 7 joueurs · rôles Kurokawa / Arakida / Police':'5 à 7 joueurs · cellule de contre-espionnage'} · téléphone partagé pour les informations privées.</p>
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
  const pack=PACKS[id],pc=pack.chapters[n],rolePool=ROLES[id].slice(0,names.length),roles=shuffle(rolePool);
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
  const s=state(live.campaignId),conditional=conditionalIntel(live.campaignId,live.chapter,s),annex=idx>=1?missingRoleIntel(live):'';
  shellPut(`<main class="page hplay hplay-session hplay-theme-${live.campaignId}">
    <header class="hplay-top"><button class="hplay-back" data-hp-action="session-menu">••• <span>Session</span></button><div class="hplay-mode">PHASE ${idx+1}/${pc.phases.length}</div></header>
    <section class="hplay-session-head"><span class="hplay-eyebrow">${esc(PACKS[live.campaignId].title)} · DOSSIER 0${live.chapter}</span><h1>${esc(phase[0])}</h1><p>${esc(phase[1])}</p></section>
    <section class="hplay-session-grid">
      <div class="hplay-panel hplay-table-card"><span>AU CENTRE DE LA TABLE</span><h2>${idx===0?'Briefing commun':idx===pc.phases.length-1?'Décision à verrouiller':'Recoupement en cours'}</h2><p>${idx===0?esc(pc.briefing):idx===pc.phases.length-1?esc(pc.question):'Posez les informations à voix haute. Une information privée peut être racontée, jamais montrée directement.'}</p>${conditional?`<div class="hplay-conditional"><b>HÉRITAGE ACTIF</b><span>${esc(conditional)}</span></div>`:''}${annex?`<div class="hplay-conditional hplay-annex"><b>ANNEXE DE CELLULE</b><span>${esc(annex)}</span></div>`:''}</div>
      <aside class="hplay-panel hplay-roster"><span>RÔLES À TABLE</span>${live.players.map(p=>`<div><b>${esc(p.name)}</b><small>${esc(roleFor(live.campaignId,p.roleId)?.name||'')}</small></div>`).join('')}</aside>
    </section>
    <nav class="hplay-session-nav"><button class="btn ghost" data-hp-action="phase-prev" ${idx===0?'disabled':''}>← PRÉCÉDENT</button>${idx<pc.phases.length-1?`<button class="btn primary" data-hp-action="phase-next">PHASE SUIVANTE →</button>`:`<button class="btn primary" data-hp-action="decision">VERROUILLER LA DÉCISION →</button>`}</nav>
  </main>`);
}

function missingRoleIntel(live){
  const selected=new Set(live.players.map(p=>p.roleId));
  const omitted=ROLES[live.campaignId].filter(r=>!selected.has(r.id));
  if(!omitted.length)return '';
  const secrets=PACKS[live.campaignId].chapters[live.chapter].secrets;
  return omitted.map(r=>`${r.name} (rôle absent) : ${secrets[r.id]?.[0]||''}`).join(' · ');
}

function conditionalIntel(id,n,s){
  if(n<2||!s)return '';
  if(id==='cendres'){
    const f=s.cendres?.flags||{};
    if(n===4){const good=['s1_correct','s2_correct','s3_correct'].filter(k=>f[k]).length;return good>=2?`Vos recoupements précédents sont solides (${good}/3). Le lien administratif K-9 peut être utilisé comme ancrage fiable.`:`Votre carte est contaminée : seulement ${good}/3 recoupements antérieurs sont fiables. Exigez deux preuves indépendantes avant toute classification.`}
    if(n===5){const good=['s1_correct','s2_correct','s3_correct','s4_correct'].filter(k=>f[k]).length;return good>=3?`La chaîne VENN → 04:17 → K-9 est suffisamment stable pour éliminer un site par cohérence administrative.`:`La crise a absorbé une partie de vos certitudes. Vous devez privilégier contraintes physiques et habilitations plutôt que les synthèses précédentes.`}
    return `Le niveau de crise actuel est ${s.cendres?.crisis?.label||'SOUS CONTRÔLE'}.`;
  }
  const f=s.kuroi?.flags||{};const choices=Object.keys(f).filter(k=>/^k\d_/.test(k)&&f[k]).length;
  return n===5?`Le Conseil arrive avec ${s.kuroi?.debts?.length||0} dette(s) enregistrée(s) et ${s.kuroi?.chronicle?.length||0} fait(s) dans la Chronique. Ces traces doivent être prises en compte dans le choix final.`:`${choices} décision(s) antérieure(s) influencent désormais la confiance entre la Police et les clans.`;
}

function renderDecision(live){const pc=PACKS[live.campaignId].chapters[live.chapter];shellPut(`<main class="page hplay hplay-decision hplay-theme-${live.campaignId}">
  <header class="hplay-top"><button class="hplay-back" data-hp-action="play">← <span>Discussion</span></button><div class="hplay-mode">DÉCISION</div></header>
  <section class="hplay-decision-head"><span class="hplay-eyebrow">CHOIX IRRÉVERSIBLE</span><h1>${esc(pc.question)}</h1><p>Le groupe doit arrêter une seule réponse. Le résultat sera ajouté à la campagne si ce dossier n’a pas déjà été archivé.</p></section>
  <section class="hplay-options">${pc.options.map(o=>`<button type="button" data-hp-option="${o.id}"><span>${esc(o.title)}</span><small>${esc(o.detail)}</small><i>VERROUILLER →</i></button>`).join('')}</section>
</main>`)}
function chooseOption(id){const l=readLive();if(!l)return;const pc=PACKS[l.campaignId].chapters[l.chapter],opt=pc.options.find(o=>o.id===id);if(!opt)return;l.decision=id;l.result={grade:opt.grade,title:opt.title,consequence:opt.consequence};l.stage='result';saveLive(l);renderResult(l)}
function renderResult(live){const pc=PACKS[live.campaignId].chapters[live.chapter],opt=pc.options.find(o=>o.id===live.decision),label=opt.grade===2?'Recoupement réussi':opt.grade===1?'Vérité partielle':'Erreur de lecture';shellPut(`<main class="page hplay hplay-result hplay-theme-${live.campaignId}">
  <header class="hplay-top"><div class="hplay-mode">RÉVÉLATION</div></header>
  <section class="hplay-result-card"><span class="hplay-eyebrow">${label.toUpperCase()}</span><h1>${esc(opt.title)}</h1><p class="hplay-result-truth">${esc(pc.reveal)}</p><div class="hplay-result-consequence"><span>CONSÉQUENCE</span><b>${esc(opt.consequence)}</b></div>${live.practice?'<div class="hplay-practice">REJOUÉ — la sauvegarde principale ne sera pas modifiée.</div>':''}<button class="btn primary" data-hp-action="finish">${live.practice?'TERMINER LE REPLAY':'INSCRIRE DANS L’HÉRITAGE'}</button></section>
</main>`)}

function applyResult(live){
  if(!live||live.finished)return;
  const pc=PACKS[live.campaignId].chapters[live.chapter],out=pc.apply?.[live.decision]||{};
  if(!live.practice){
    if(live.campaignId==='cendres'){
      const flag=out.flag;if(flag){const payload={flags:{[flag]:true},crisisDelta:Number(out.crisis||0)};api().completeChapter('cendres',live.chapter,payload)}else api().completeChapter('cendres',live.chapter,{crisisDelta:Number(out.crisis||0)});
      const grade=live.result?.grade||0;
      const labels=['PISTE COMPROMISE','PISTE PARTIELLE','PISTE VALIDÉE'];
      api().cendres.upsertNode({id:`cendres-${live.chapter}-${live.decision}`,label:`D0${live.chapter} · ${labels[grade]}`,kind:'dossier',status:grade===2?'cleared':grade===1?'watch':'unknown',chapter:live.chapter,note:live.result?.consequence});
      if(live.chapter>1)api().cendres.link(`cendres-${live.chapter-1}-${findPreviousDecision('cendres',live.chapter-1)}`,`cendres-${live.chapter}-${live.decision}`,'héritage de campagne');
    }else{
      if(out.flag){api().completeChapter('kuroi',live.chapter,{flags:{[out.flag]:true}})}else api().completeChapter('kuroi',live.chapter,{});
      if(out.debt)api().kuroi.addDebt({type:'giri',from:out.debt[0],to:out.debt[1],reason:out.debt[2],status:'due',chapter:live.chapter});
      if(out.chron)api().kuroi.addChronicle(out.chron,'public');
      api().kuroi.addChronicle(`Dossier 0${live.chapter} — ${live.result?.title}. ${live.result?.consequence}`,'public');
    }
    rememberDecision(live.campaignId,live.chapter,live.decision);
  }
  live.finished=true;live.stage='finished';saveLive(live);
  clearLive();renderCampaign(live.campaignId);toastSafe(live.practice?'Replay terminé.':'Dossier inscrit dans l’Héritage.');
}
function decisionKey(id,n){return `igr_heritage_decision_${id}_${n}`}
function rememberDecision(id,n,v){try{store().setItem(decisionKey(id,n),v)}catch{}}
function findPreviousDecision(id,n){try{return store().getItem(decisionKey(id,n))||'archive'}catch{return 'archive'}}

function resumeLive(){const l=readLive();if(!l)return renderHub();if(l.stage==='reveal')return renderReveal(l,false);if(l.stage==='play')return renderPlay(l);if(l.stage==='decision')return renderDecision(l);if(l.stage==='result')return renderResult(l);renderChapter(l.campaignId,l.chapter)}
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
    if(a==='play'){const l=readLive();if(l){l.stage='play';saveLive(l);renderPlay(l)}return}
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
  window.IGR_HERITAGE_PLAY=Object.freeze({version:VERSION,open:renderHub,openCampaign:renderCampaign,openChapter:renderChapter,resume:resumeLive,roleCard:(campaign,chapter,roleId)=>{const r=roleFor(campaign,roleId),sec=PACKS[campaign]?.chapters?.[Number(chapter)]?.secrets?.[roleId]||['',''];return r?Object.freeze({name:r.name,public:r.public||'',secret:sec[0]||'',objective:sec[1]||''}):null}});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
