-- Inside Grey Room v12.20 — cold brutal language pass
-- Narrative strings only. Gameplay data, role assignment, levels, timing, scoring,
-- evidence routing, trame mechanics and permissions are intentionally untouched.

-- 1) Public/server context + final truth copy.
with copy(scenario_id, context, summary, turn_text, final_line) as (
  values
  ('001',
   $$Maël Sénéchal est retrouvé mort, poignardé, dans la chambre 222. Trois personnes ont croisé sa route cette nuit-là. Les horaires, les traces et leurs mensonges ne racontent pas la même histoire.$$, 
   $$A a fait organiser une intimidation et s’est battu avec Maël, mais il est parti alors que Maël était encore vivant. B est arrivé ensuite et a volontairement poignardé Maël. C était près de la porte et a gardé le silence par peur.$$, 
   $$A s’est battu avec Maël, mais il était déjà parti au moment du meurtre. Les traces mélangeaient deux confrontations différentes.$$, 
   $$Maël a subi deux confrontations. B a porté le coup mortel.$$),
  ('002',
   $$Léon s’est suicidé. Avant sa mort, il a été humilié, repoussé et laissé seul à plusieurs moments. Il faut comprendre ce que chacun a réellement fait.$$, 
   $$Léon s’est suicidé. A l’a humilié et a utilisé ses confidences contre lui. B lui a envoyé des messages très violents. C l’a entendu pleurer sans intervenir. D a essayé de l’aider mais a quitté les lieux en pensant, à tort, que la crise passerait.$$, 
   $$Il n’y avait pas de meurtrier caché. Il fallait distinguer cruauté, abandon, inaction et erreur de jugement.$$, 
   $$Léon s’est suicidé. Les autres restent responsables de ce qu’ils ont fait avant sa mort.$$),
  ('003',
   $$Une attaque biologique frappe une gare et fait plus de cent morts. La piste remonte au Centre Helios. Plusieurs décisions ont rendu l’attaque possible.$$, 
   $$A a volontairement ouvert une brèche qu’il pensait contrôlable. B a déplacé du matériel hors procédure et ignoré une alerte. C a caché des incidents et bloqué des contrôles. Ensemble, leurs décisions ont rendu l’attaque possible.$$, 
   $$Personne n’a, seul, créé toute la catastrophe. Trois décisions conscientes ont rendu Helios vulnérable.$$, 
   $$Plus de cent morts. Aucun suspect ne peut effacer la décision qu’il a prise.$$),
  ('004',
   $$Sofia mélange alcool et médicaments puis appelle trois proches à l’aide. Elle meurt d’une overdose. Chacun avait encore une occasion d’agir.$$, 
   $$A a refusé de revenir malgré l’appel de Sofia. B a attendu par jalousie. C a volontairement retardé son appel aux secours. Aucun ne lui a donné les médicaments, mais tous ont laissé passer du temps alors qu’elle demandait de l’aide.$$, 
   $$Sofia n’a pas été empoisonnée par l’un d’eux. Le cœur du dossier est le temps que chacun a choisi de perdre.$$, 
   $$Sofia a appelé trois personnes. Personne n’est venu à temps.$$),
  ('005',
   $$Keller est retrouvé mort avec un masque blanc. La scène ressemble aux anciens crimes du Masque Blanc. Pourtant, plusieurs détails montrent que quelqu’un a peut-être copié sa méthode.$$, 
   $$Le troisième suspect a tué Keller pour un motif personnel. Après le meurtre, il a utilisé le masque pour faire croire que le Masque Blanc avait encore frappé. Les deux autres suspects ont de vrais liens avec les anciens crimes, mais ils n’ont pas tué Keller.$$, 
   $$Le masque ne désignait pas le tueur. Le meurtrier l’a ajouté après la mort pour faire croire au retour du Masque Blanc.$$, 
   $$Keller a été tué pour une raison personnelle. Le masque a servi à raconter un autre meurtre.$$),
  ('006',
   $$Noé est mort cinq ans plus tôt dans un chalet isolé. Ses trois anciens amis ont gardé la même histoire pendant des années. Maintenant, leur silence commence à se fissurer.$$, 
   $$Le deuxième suspect a frappé Noé pendant une dispute. Après sa chute, les trois ont cru qu’il était mort et ont caché ce qui s’était passé. Le premier a organisé la dissimulation. Le troisième y a participé sans porter le coup.$$, 
   $$Ils ont tous caché la mort de Noé. Mais un seul l’a frappé.$$, 
   $$Ils ont partagé le même silence. Ils n’ont pas commis le même acte.$$),
  ('007',
   $$Une famille se déchire autour d’un héritage. Pressions, dettes et secrets s’accumulent. Puis un membre de la famille meurt.$$, 
   $$Le bénéficiaire apparent a exercé une forte pression sur le défunt. Un autre membre de la famille a caché un document. Le troisième a menti pour protéger une dette et un secret de filiation. L’argent est au centre du dossier, mais leurs mensonges ne cachent pas la même chose.$$, 
   $$Le testament n’expliquait pas tout. Plusieurs conflits familiaux se croisaient au même moment.$$, 
   $$Tout le monde cachait quelque chose. Pas la même chose.$$),
  ('008',
   $$Plusieurs témoins parlent sous serment. Leurs horaires et leurs versions ne peuvent pas tous être vrais. Chacun a une raison différente de mentir.$$, 
   $$Le premier témoin a menti sur un horaire pour cacher une faute secondaire. Le deuxième a fait pression sur un autre témoin pour protéger une institution. Le troisième a déplacé son horaire pour cacher une relation privée. Tous mentent sur quelque chose, mais pas pour la même raison.$$, 
   $$Le problème n’était pas de trouver qui mentait. Il fallait comprendre pourquoi chacun mentait.$$, 
   $$Trois versions fausses. Trois raisons différentes.$$),
  ('009',
   $$Le Sujet 17 demande clairement l’arrêt du programme ORPHÉE. La procédure continue malgré son refus. Après une chute, une amnésie réelle brouille une partie des faits.$$, 
   $$Le Sujet 17 avait retiré son consentement avant la poursuite du protocole. Le médecin a continué malgré ce refus. Son amnésie après la chute est réelle, mais elle n’efface pas ce qu’il avait décidé avant. La direction a ensuite minimisé une alerte.$$, 
   $$La mémoire s’est effacée après l’incident. Le retrait du consentement, lui, était déjà enregistré.$$, 
   $$Il ne se souvient plus de tout. Mais le refus du Sujet 17 avait déjà été dit.$$),
  ('010',
   $$Nora Weiss est retrouvée morte derrière un mur. Elle avait été enfermée vivante. Les horaires, les bruits et une ouverture à 13 h 54 vont montrer qui savait quoi.$$, 
   $$Une personne a participé à l’enfermement de Nora. Une autre a ouvert à 13 h 54, a vu Nora encore vivante puis a volontairement refermé. Une troisième a entendu des bruits sans comprendre avec certitude qu’une personne était enfermée.$$, 
   $$À 13 h 54, Nora était encore vivante. Quelqu’un a ouvert, l’a vue et a refermé.$$, 
   $$La porte s’est ouverte. Nora vivait encore. Elle a été refermée.$$),
  ('011',
   $$Une opération militaire fictive laisse des villages détruits, des morts et des disparus. Un ordre a été donné. Sur le terrain, il a été dépassé. Après les faits, certains rapports ont été réécrits.$$, 
   $$Le premier suspect a maintenu un ordre risqué malgré un danger civil connu. Le deuxième a dépassé cet ordre sur le terrain puis a aidé à modifier un rapport. Le troisième pouvait arrêter une partie de l’opération mais a attendu trop longtemps.$$, 
   $$La question n’est pas seulement de savoir qui commandait. Il faut regarder ce que chacun savait au moment où il a choisi d’agir ou d’attendre.$$, 
   $$Des ordres ont été donnés. D’autres ont été dépassés. Puis des faits ont été cachés.$$),
  ('012',
   $$Sacha annonce qu’il veut partir. Son téléphone est confisqué. Il est frappé puis enfermé contre son gré pendant près de vingt heures avant de réussir à fuir.$$, 
   $$La direction a ordonné que Sacha soit retenu. Le responsable de la discipline l’a frappé et a gardé la clé. Un troisième membre a surveillé le couloir, n’a pas alerté l’extérieur puis a laissé un verrou mal engagé, ce qui a permis la fuite.$$, 
   $$Personne ne peut tout mettre sur le dos d’un ordre. Retenir, frapper, se taire et laisser une porte mal fermée sont quatre choix.$$, 
   $$Sacha a été retenu contre son gré. Chacun a choisi sa part.$$),
  ('013',
   $$Le président Kessler est abattu par un tireur payé. Le meurtrier a reçu de l’aide : accès, argent, matériel et informations. Il faut remonter toute la chaîne.$$, 
   $$Un coordinateur a préparé la logistique. Un cadre de sécurité a vendu une faille d’accès. Le tireur a attendu le signal puis a volontairement abattu Kessler.$$, 
   $$Le tir a duré une seconde. L’assassinat avait été préparé bien avant.$$, 
   $$Le tireur a tué Kessler. D’autres lui ont permis d’arriver jusqu’à lui.$$),
  ('014',
   $$Les identités de onze informateurs sont compromises avec leurs familles. Plusieurs personnes ont ouvert des brèches. L’une d’elles a reconstitué et vendu la liste.$$, 
   $$Un analyste a sorti des pages hors procédure et a perdu le contrôle d’une copie. Un officier a rassemblé les fragments puis vendu la liste complète. Un responsable sécurité a falsifié des journaux pour cacher une autre faille.$$, 
   $$Sortir une information et vendre une liste complète ne sont pas le même acte.$$, 
   $$Plusieurs personnes ont ouvert la porte. Une seule a vendu la liste.$$),
  ('015',
   $$Une médecin est retrouvée morte alors qu’elle enquêtait sur ÉLIGIBLES. Des alertes médicales avaient été ignorées et des patients encore récupérables avaient été maintenus dans un dispositif dangereux. Après la mort, des notes ont été modifiées.$$, 
   $$La direction a maintenu ÉLIGIBLES malgré plusieurs alertes. Le clinicien a signé la poursuite alors qu’il avait lui-même signalé un danger. Après la mort, l’administrateur a modifié des notes et retardé un document.$$, 
   $$Les dossiers ont été retouchés après la mort. Mais la décision qui a exposé la victime avait été prise avant.$$, 
   $$Après la mort, le dossier a été réécrit. Avant la mort, le risque était déjà connu.$$),
  ('016',
   $$Une victime est enlevée, droguée, humiliée et filmée. La caméra s’arrête. Après, quelqu’un décide de la tuer. Le meurtre n’apparaît sur aucune image.$$, 
   $$Le premier suspect a organisé l’enlèvement, la drogue et l’humiliation. Le deuxième est resté après l’arrêt de la caméra et a volontairement tué la victime. Le troisième a fourni le produit et l’adresse puis a tenté trop tard de stopper l’escalade.$$, 
   $$La vidéo montre la violence préparée. Le meurtre a lieu après l’arrêt de l’image.$$, 
   $$La caméra s’arrête. Le meurtre commence.$$),
  ('017',
   $$Deux personnes sont enlevées et retenues. L’une meurt pendant la séquestration. L’autre est libérée sous menace. Après la mort, des messages disparaissent et de l’argent circule.$$, 
   $$Le premier suspect a provoqué la détresse mortelle en maintenant une contrainte violente. Le deuxième a organisé la séquestration puis retardé les secours alors qu’il comprenait la gravité de la situation. Le troisième a supprimé des messages et acheté le silence après la mort.$$, 
   $$Le survivant ne s’est pas tu par loyauté. Il s’est tu parce que sa libération dépendait de ce silence.$$, 
   $$Une personne est morte. L’autre a été libérée sous menace.$$),
  ('018',
   $$L’ancien directeur d’un foyer abusif est retrouvé mort devant neuf assiettes portant les noms d’anciens résidents. Mais la mise en scène n’a peut-être pas été faite par le meurtrier.$$, 
   $$Le premier suspect a tué la victime pendant une confrontation. Le deuxième est arrivé après la mort et a dressé les neuf assiettes pour transformer la scène en message. Le troisième était passé plus tôt pour voler de l’argent puis a menti sur sa présence.$$, 
   $$La mise en scène la plus spectaculaire a été faite après le meurtre par quelqu’un qui n’avait pas tué.$$, 
   $$Le meurtre était déjà terminé quand les assiettes ont été dressées.$$),
  ('019',
   $$Pendant un gala d’élite, un lanceur d’alerte est tué avant de pouvoir rendre son dossier public. Quelqu’un voulait le faire taire. Quelqu’un d’autre a choisi de le tuer.$$, 
   $$Le premier suspect a demandé que le lanceur d’alerte soit neutralisé et a financé l’opération, sans donner d’ordre explicite de tuer. Le chef de sécurité a ensuite choisi de le tuer. Le troisième a détruit des documents et acheté un silence après la mort.$$, 
   $$Le premier suspect a créé la mission. Le chef de sécurité a choisi la solution mortelle.$$, 
   $$Quelqu’un voulait le faire taire. Quelqu’un d’autre a décidé de le tuer.$$),
  ('020',
   $$327 personnes meurent dans l’incendie du Bal des Fondateurs. Des sorties restent fermées, l’alarme tarde et des systèmes de sécurité sont défaillants. Aucun de ces faits, seul, n’explique le massacre.$$, 
   $$Un petit feu a été déclenché volontairement. Des réparations de sécurité avaient été repoussées. L’alarme générale a été retardée et plusieurs sorties sont restées verrouillées. Ces décisions se sont combinées et 327 personnes sont mortes.$$, 
   $$Il n’y avait pas une cause unique. Le feu devient un massacre parce que plusieurs décisions se superposent.$$, 
   $$327 morts. Pas une seule cause. Plusieurs choix qui se sont rencontrés au pire moment.$$)
)
update public.igr_v4_scenario_packs p
set pack = jsonb_set(
             jsonb_set(
               jsonb_set(
                 jsonb_set(p.pack, '{context}', to_jsonb(c.context), true),
                 '{truth,summary}', to_jsonb(c.summary), true),
               '{truth,cinematic,turn}', to_jsonb(c.turn_text), true),
             '{truth,cinematic,final_line}', to_jsonb(c.final_line), true),
    updated_at = now()
from copy c
where p.scenario_id = c.scenario_id;

-- 2) Private suspect cards. Same facts, shorter and more explicit.
with copy(scenario_id, idx, place, chronology, hide, anchors, position) as (
  values
  ('001',1,$$Tu es un ancien ami de Maël. Vous aviez des dettes et votre relation était devenue violente.$$,$$Maël te fait monter à 02 h 11. Vous vous disputez et vous vous bousculez. Tu pars vers 02 h 32. Maël est vivant quand tu quittes l’étage.$$,$$Tu as payé des intermédiaires pour intimider Maël et récupérer ton argent. Tu n’as pas demandé sa mort.$$,$$Quelqu’un devait venir lui faire peur après ton départ. Tu ignores qui a finalement été envoyé.$$,$$Reconnais la dispute et l’intimidation. Tu n’as pas tué Maël.$$),
  ('001',2,$$Tu es l’homme payé pour intervenir auprès de Maël.$$,$$Tu entres vers 02 h 55. Une lutte éclate. Tu poignardes volontairement Maël, nettoies partiellement l’Opinel puis jettes l’arme dehors.$$,$$Tu as tué Maël. Tu caches aussi l’arme et le fait que tu étais payé.$$,$$La chambre était déjà en désordre avant ton arrivée.$$,$$Tu peux exploiter les traces de la première dispute. Ne change jamais le fait que tu as porté le coup mortel.$$),
  ('001',3,$$Tu es un client régulier de l’hôtel. Tu n’avais pas de lien personnel avec Maël.$$,$$Vers 02 h 50, tu passes devant la chambre 222. Tu entends du bruit, vois la porte entrouverte puis repars sans prévenir personne.$$,$$Tu caches à quel point tu étais proche de la chambre.$$,$$Tu n’es jamais entré dans la chambre.$$,$$Explique ton silence. Il te rend suspect, mais tu n’as pas tué Maël.$$),

  ('002',1,$$Tu étais proche de Léon. Tu l’as ensuite humilié publiquement.$$,$$Tu as diffusé des éléments privés sur Léon et tu l’as encore confronté le soir de sa mort.$$,$$Tu caches l’ampleur des humiliations et les confidences que tu as utilisées contre lui.$$,$$Léon allait déjà mal, mais tes actes ont aggravé son isolement.$$,$$Assume ta cruauté. Ne prétends pas avoir voulu son suicide.$$),
  ('002',2,$$Tu étais très proche de Léon. Votre relation était devenue épuisante et violente.$$,$$Tu ignores plusieurs appels puis lui envoies des messages très durs avant de couper le contact.$$,$$Tu caches la violence exacte de tes messages.$$,$$Tu n’as jamais demandé à Léon de se suicider.$$,$$Assume tes mots sans inventer une intention de mort que tu n’avais pas.$$),
  ('002',3,$$Tu connaissais Léon de loin.$$,$$Tu passes près de la salle, l’entends pleurer et choisis de ne pas intervenir.$$,$$Tu caches que tu étais réellement présent.$$,$$Tu connaissais peu le conflit autour de Léon.$$,$$Reconnais ton silence. Tu n’es pas au cœur des humiliations.$$),
  ('002',4,$$Tu étais le meilleur ami de Léon et son principal soutien.$$,$$Tu parles avec lui tard dans la nuit. Tu crois qu’il ne passera pas à l’acte et tu pars.$$,$$Tu caches à quel point tu étais inquiet et une phrase où tu lui demandes d’arrêter de dramatiser.$$,$$Tu as essayé de l’aider pendant longtemps.$$,$$Tu as mal jugé le danger. Ce n’est pas la même chose que vouloir sa mort.$$),

  ('003',1,$$Tu es un cadre du Centre Helios. Tu voulais provoquer un scandale politique que tu pensais pouvoir contrôler.$$,$$Tu facilites un accès anormal et travailles avec un intermédiaire. Quand tu comprends que la situation t’échappe, tu essaies trop tard de tout arrêter.$$,$$Tu caches la brèche que tu as volontairement ouverte.$$,$$Tu n’avais pas prévu une attaque de masse.$$,$$Assume la brèche. Ne prétends pas avoir contrôlé ce qui s’est passé ensuite.$$),
  ('003',2,$$Tu es responsable de transferts sensibles à Helios.$$,$$Tu déplaces du matériel hors procédure et ignores une alerte en pensant suivre une urgence supérieure.$$,$$Tu caches le transfert et l’alerte ignorée.$$,$$Tu as tenté de joindre A quand tu as compris le risque.$$,$$L’obéissance n’efface pas les signaux que tu as vus.$$),
  ('003',3,$$Tu gères la conformité et la communication du programme.$$,$$Tu classes plusieurs incidents et bloques une inspection complète pour protéger Helios.$$,$$Tu caches des dossiers et l’inspection que tu as neutralisée.$$,$$Tu n’as pas effectué le transfert final.$$,$$Tu as couvert le système. Tu n’as pas organisé seul l’attaque.$$),

  ('004',1,$$Tu es l’ex-partenaire de Sofia. Votre relation était devenue toxique.$$,$$Sofia t’appelle. Tu refuses de revenir après une dispute alors que tu sais qu’elle mélange parfois alcool et médicaments.$$,$$Tu caches la dureté de ton refus et ce que tu savais de sa consommation.$$,$$Tu n’as pas préparé l’overdose.$$,$$Tu n’as pas tué Sofia. Tu as choisi de ne pas revenir.$$),
  ('004',2,$$Tu es un ami très proche de Sofia et tu es amoureux d’elle.$$,$$Tu lis ses messages, hésites à venir et attends qu’elle rappelle. Ta jalousie te fait perdre du temps.$$,$$Tu caches tes sentiments, ton attente volontaire et un message supprimé.$$,$$Tu pensais encore avoir le temps.$$,$$Assume l’attente. Tu n’avais pas l’intention qu’elle meure.$$),
  ('004',3,$$Tu es un proche possessif de Sofia. Tu pensais qu’elle devait apprendre à ne pas toujours être secourue.$$,$$Tu passes près de son immeuble sans entrer. Tu attends volontairement avant d’appeler les secours.$$,$$Tu caches ton passage et le temps que tu as volontairement laissé passer.$$,$$Tu n’as pas fourni les médicaments.$$,$$Ton choix était volontaire. Ne le transforme pas en simple oubli.$$),

  ('005',1,$$Tu es le premier Masque Blanc. Tu as commis les anciens meurtres, mais tu n’as pas tué Keller.$$,$$Tu connais les anciens crimes, le symbole et le rituel mieux que presque tout le monde. Le meurtre de Keller ne vient pas de toi.$$,$$Tu caches que tu es à l’origine des anciens crimes du Masque Blanc.$$,$$Keller n’a pas été tué exactement comme tes anciennes victimes.$$,$$Ton passé te rend extrêmement suspect. Mais Keller n’est pas l’une de tes victimes.$$),
  ('005',2,$$Tu connais l’histoire du Masque Blanc de très près. Tu n’as pas tué Keller.$$,$$Un ancien épisode te donne accès à des détails sur les crimes qui n’ont jamais été rendus publics.$$,$$Tu caches ton lien avec une ancienne victime et ce que tu sais du rituel.$$,$$Le meurtre de Keller comporte des différences avec les anciens crimes.$$,$$Fais regarder les différences matérielles. Le symbole ne suffit pas.$$),
  ('005',3,$$Tu as tué Keller. Tu n’es pas l’auteur des anciens meurtres du Masque Blanc.$$,$$Tu vas confronter Keller à cause de ce qu’il a fait à ta femme. Il minimise. Tu le frappes jusqu’à le tuer puis tu places le masque sur la scène.$$,$$Tu caches ta haine, le meurtre et le fait que tu avais apporté le masque.$$,$$Ton meurtre est personnel et moins méthodique que les anciens crimes.$$,$$Fais croire que le Masque Blanc a encore frappé sans inventer de nouveaux faits.$$),

  ('006',1,$$Tu étais le plus calme du groupe. Après la mort de Noé, tu as poussé les autres à cacher ce qui s’était passé.$$,$$Ton ami frappe Noé. Noé chute. Vous le croyez mort. Tu transformes la panique en décision : cacher le corps et garder le silence.$$,$$Tu caches ton rôle dans la dissimulation.$$,$$Tu n’as pas porté le coup.$$,$$Tu as organisé le silence. Tu n’as pas frappé Noé.$$),
  ('006',2,$$Tu as frappé Noé pendant une dispute alcoolisée.$$,$$Tu frappes Noé. Il chute. Le groupe le croit mort puis décide de cacher ce qui s’est passé.$$,$$Tu caches le coup initial, ta colère et ton rôle dans la décision collective.$$,$$Tu n’avais pas planifié sa mort.$$,$$Le coup vient de toi. Ne le transforme pas en meurtre prémédité.$$),
  ('006',3,$$Tu as vu la dispute, la chute et la dissimulation. Depuis cinq ans, tu tiens de moins en moins bien le secret.$$,$$Tu assistes au coup, à la chute puis tu aides les autres à cacher ce qui s’est passé.$$,$$Tu caches ton rôle concret dans la dissimulation et un détail matériel que tu as gardé.$$,$$Tu n’as frappé personne.$$,$$Tu as participé au mensonge collectif. Tu n’as pas porté le coup.$$),

  ('007',1,$$Tu devais profiter d’une modification du testament.$$,$$Tu mets une forte pression sur le défunt pour qu’il signe. Votre dispute commence plus tôt que tu ne l’avoues.$$,$$Tu caches la pression exercée et la violence de la dispute. La signature est authentique.$$,$$Le projet de testament existait avant votre dispute.$$,$$Assume la pression. Un intérêt financier n’est pas, à lui seul, une preuve sur la mort.$$),
  ('007',2,$$Tu as caché un document familial pour protéger un proche.$$,$$Tu récupères le document avant la mort puis mens sur l’heure à laquelle tu l’as eu.$$,$$Tu caches le document et ton mensonge sur sa circulation.$$,$$Le document n’a pas été falsifié.$$,$$Tu peux reconnaître la dissimulation sans accepter qu’elle explique automatiquement la mort.$$),
  ('007',3,$$Tu caches une dette et un secret de filiation qui peuvent changer l’héritage.$$,$$Tu rencontres le défunt avant la crise pour parler de la dette. Après sa mort, tu effaces une partie de cette discussion de ta version.$$,$$Tu caches que la dette te concernait directement et qu’un secret familial pouvait bouleverser le testament.$$,$$Ton intérêt financier est réel, mais différent de celui du bénéficiaire apparent.$$,$$Protège ton secret si tu veux. Ne change jamais les faits matériels.$$),

  ('008',1,$$Tu as menti sous serment sur un horaire.$$,$$Une pièce de procédure contredit ton horaire. Tu maintiens quand même une version fausse pour cacher une autre faute.$$,$$Tu caches un mensonge réel, mais il ne concerne pas le fait principal.$$,$$Le reste de ta déposition est en grande partie exact.$$,$$Si ton mensonge est découvert, reconnais-le. Il ne prouve pas tout le reste.$$),
  ('008',2,$$Tu as fait pression sur un témoin pour protéger une institution.$$,$$Avant son audition, tu le contactes et lui indiques ce qu’il doit éviter de dire.$$,$$Tu caches cette pression sur le témoignage.$$,$$Le témoignage influencé contient aussi des faits vrais.$$,$$Tu as manipulé le récit. Ce n’est pas automatiquement la même chose que commettre le fait principal.$$),
  ('008',3,$$Tu mens sur ton horaire pour cacher une relation privée.$$,$$Tu étais présent plus tôt que tu ne le dis parce que tu voyais secrètement une personne liée au dossier.$$,$$Tu caches cette relation et ton vrai horaire.$$,$$Une preuve indépendante confirme ta version sur l’événement principal.$$,$$Tu mens, mais pas pour cacher le crime principal.$$),

  ('009',1,$$Tu es le médecin responsable d’ORPHÉE.$$,$$Le Sujet 17 retire clairement son consentement. Tu continues une partie du protocole malgré son refus. La chute et ton amnésie arrivent après.$$,$$Tu caches que tu savais, avant la chute, que le refus était explicite et que la procédure dépassait le cadre autorisé.$$,$$Ton amnésie est réelle. Les traces écrites montrent quand même ce que tu avais décidé avant.$$,$$Ne joue pas une fausse mémoire. Défends seulement la décision que tu as prise avant la chute.$$),
  ('009',2,$$Tu diriges ORPHÉE au niveau institutionnel.$$,$$Tu reçois plusieurs alertes, maintiens le programme puis aides à atténuer une note après l’incident.$$,$$Tu caches que tu savais que le protocole réel dépassait le texte officiel.$$,$$Tu contrôlais ce qui remontait dans les dossiers.$$,$$Tu n’as pas exécuté chaque geste, mais tu as protégé le programme.$$),
  ('009',3,$$Tu as aidé le Sujet 17 à chercher une sortie.$$,$$Tu constates son refus et lui donnes discrètement une possibilité de partir. Après l’incident, tu caches cette aide pour protéger ton poste.$$,$$Tu caches que tu as enfreint une règle interne pour l’aider.$$,$$Ton mensonge ne cause pas la poursuite du protocole.$$,$$Tu peux cacher ton geste. Tu ne peux pas réinventer le protocole.$$),

  ('010',1,$$Tu as participé à l’enfermement initial de Nora.$$,$$Après une confrontation, tu aides à l’enfermer derrière le mur. Tu pars en pensant que quelqu’un la libérera rapidement.$$,$$Tu caches que tu savais qu’elle ne pouvait pas sortir seule.$$,$$Tu n’es pas présent lors de l’ouverture de 13 h 54.$$,$$Tu as participé à l’enfermement. Tu n’es pas la personne qui referme plus tard.$$),
  ('010',2,$$À 13 h 54, tu ouvres. Nora est encore vivante. Tu la vois. Puis tu refermes.$$,$$Tu comprends immédiatement qu’elle est enfermée et vivante. Tu paniques, refermes volontairement la porte et pars.$$,$$Tu caches que tu as vu Nora vivante et que tu as choisi de refermer.$$,$$Tu n’as pas créé l’enfermement initial.$$,$$Tu ne peux pas nier ce que tu as vu. Ta défense porte seulement sur ce que tu n’avais pas fait avant.$$),
  ('010',3,$$Tu étais dans le bâtiment. Tu as entendu des bruits derrière le mur sans comprendre qu’une personne était enfermée.$$,$$Tu entends plusieurs bruits avant 13 h 54 et les prends pour des travaux. Plus tard, tu minimises ce que tu avais entendu.$$,$$Tu caches que tu as entendu plus de bruit que tu ne l’avoues.$$,$$Tu n’as jamais ouvert et tu ne savais pas avec certitude que Nora était là.$$,$$Distingue ce que tu as entendu de ce que tu avais réellement compris.$$),

  ('011',1,$$Tu es l’officier qui a maintenu un ordre risqué malgré des alertes civiles.$$,$$Tu valides l’opération et refuses de la retarder alors que le risque pour les civils est plus élevé que ce qui apparaît dans l’ordre écrit.$$,$$Tu caches que tu connaissais ce risque.$$,$$Tu n’as pas ordonné chaque abus commis sur le terrain.$$,$$Ne te cache pas derrière la hiérarchie. Défends seulement ce que ton ordre couvrait réellement.$$),
  ('011',2,$$Tu diriges une partie des opérations sur le terrain.$$,$$Tu dépasses l’instruction reçue puis aides à modifier un rapport pour rendre ce dépassement moins visible.$$,$$Tu caches les actes qui n’étaient pas couverts par l’ordre et la réécriture du rapport.$$,$$Tu avais des informations de terrain que le commandement n’avait pas encore.$$,$$Distingue ce que tu as reçu comme ordre, ce que tu as choisi de dépasser et ce que tu as ensuite caché.$$),
  ('011',3,$$Tu pouvais interrompre une partie de l’opération.$$,$$Les alertes arrivent peu à peu. Tu attends une confirmation hiérarchique au lieu d’arrêter immédiatement. Quand tu comprends l’ampleur du problème, du temps a déjà été perdu.$$,$$Tu caches qu’il existait un moment où l’arrêt était encore possible.$$,$$Tu n’as ni écrit l’ordre initial ni commis les abus de terrain.$$,$$Ta responsabilité dépend du moment où tu savais assez pour arrêter.$$),

  ('012',1,$$Tu diriges la communauté.$$,$$Tu convoques Sacha, fais confisquer son téléphone et valides qu’il soit retenu jusqu’au lendemain.$$,$$Tu savais qu’il était retenu contre son gré et qu’il avait été frappé.$$,$$Tu n’as pas porté les coups.$$,$$Tu as ordonné qu’on le retienne. N’efface pas ton pouvoir.$$),
  ('012',2,$$Tu es chargé de la discipline.$$,$$Tu saisis Sacha quand il veut partir, le frappes puis gardes la clé de la pièce où il est enfermé.$$,$$Tu caches que tu l’as frappé et que tu as verrouillé la porte.$$,$$Personne ne t’a ordonné de le frapper.$$,$$Les coups sont ton choix.$$),
  ('012',3,$$Tu es proche de Sacha.$$,$$Tu surveilles le couloir, refuses d’abord de l’aider puis laisses volontairement un verrou mal engagé avant de partir.$$,$$Tu savais qu’il était retenu et tu n’as alerté personne.$$,$$Tu n’as ni ordonné ni porté les coups. Ton geste permet finalement sa fuite.$$,$$Assume les heures de silence autant que le geste qui l’aide à sortir.$$),

  ('013',1,$$Tu coordonnes la logistique de PERSEUS.$$,$$Tu organises le véhicule, la planque et l’accès technique avant l’assassinat.$$,$$Tu caches que tu savais qu’une opération violente était en préparation.$$,$$Tu n’as ni choisi la cible finale ni tiré.$$,$$Tu as rendu l’opération possible. Tu n’es pas le tireur.$$),
  ('013',2,$$Tu es le tireur payé.$$,$$Tu entres avant le bouclage, installes l’arme, attends le signal puis abats volontairement Kessler.$$,$$Tu caches que tu es l’auteur du tir mortel.$$,$$Tu ne connais pas tous les commanditaires.$$,$$Tu peux ignorer une partie de la chaîne. Tu ne peux pas nier le tir.$$),
  ('013',3,$$Tu es un cadre de sécurité corrompu.$$,$$Tu vends une fenêtre sans surveillance puis modifies un journal d’accès après l’assassinat.$$,$$Tu caches le paiement et la faille que tu as créée.$$,$$Tu n’as jamais rencontré le tireur.$$,$$Tu as facilité l’assassinat. Tu n’as pas tiré.$$),

  ('014',1,$$Tu es analyste du renseignement.$$,$$Tu sors des pages du système pour documenter une corruption. Une copie disparaît ensuite.$$,$$Tu caches l’export et ton premier mensonge à son sujet.$$,$$Tu n’as pas vendu la liste complète.$$,$$Assume la fuite initiale. Tu n’as pas effectué la vente finale.$$),
  ('014',2,$$Tu es l’officier qui a reconstitué la liste complète.$$,$$Tu récupères plusieurs fragments, reconstruis les onze identités puis vends la liste à un service étranger.$$,$$Tu caches la vente et les rendez-vous.$$,$$Tu as profité de plusieurs fuites secondaires.$$,$$La vente vient de toi. Ne la dilue pas dans les autres fautes.$$),
  ('014',3,$$Tu es responsable de la sécurité.$$,$$Tu modifies des journaux pour cacher une faille différente.$$,$$Tu caches la falsification des logs.$$,$$Tu n’as pas livré la liste.$$,$$Tu as falsifié des preuves. Tu n’as pas vendu les informateurs.$$),

  ('015',1,$$Tu diriges ÉLIGIBLES.$$,$$Tu refuses de suspendre le dispositif malgré plusieurs alertes et une recommandation de sortie.$$,$$Tu caches que tu connaissais la dégradation et que tu as écarté la recommandation.$$,$$Tu n’as pas administré le traitement.$$,$$Tu as maintenu le système malgré le risque connu.$$),
  ('015',2,$$Tu es le clinicien référent.$$,$$Tu écris une réserve puis signes quand même la poursuite du dispositif. Tu demandes une réévaluation trop tard.$$,$$Tu caches ta signature et le fait qu’une alerte a été atténuée.$$,$$Tu as réellement demandé une réévaluation ensuite.$$,$$Tu n’as pas créé ÉLIGIBLES. Mais ta signature a compté.$$),
  ('015',3,$$Tu es cadre administratif.$$,$$Après la mort, tu modifies des notes et retardes l’envoi d’un document extérieur.$$,$$Tu caches la falsification faite après la mort.$$,$$Tu n’as pas pris les décisions cliniques qui ont précédé.$$,$$Tu as caché des faits après la mort. Tu n’as pas pris la décision clinique principale.$$),

  ('016',1,$$Tu as organisé l’enlèvement, la drogue, la caméra et l’humiliation.$$,$$Tu prépares le règlement de compte puis quittes les lieux avant la fin.$$,$$Tu caches que toute la mise en scène violente vient de toi.$$,$$Tu n’as jamais donné d’ordre explicite de tuer.$$,$$Tu as préparé la violence. Tu n’as pas porté le geste mortel.$$),
  ('016',2,$$Tu es l’homme qui a tué la victime.$$,$$Après l’arrêt de la vidéo, tu restes avec la victime et décides de la tuer. Tu déplaces ensuite le corps.$$,$$Tu caches le meurtre et le déplacement du corps.$$,$$Le plan était déjà criminel avant ta décision.$$,$$Le meurtre est ton choix.$$),
  ('016',3,$$Tu es l’intermédiaire qui a fourni le sédatif et l’adresse.$$,$$Tu aides matériellement l’opération puis envoies trop tard un message demandant d’arrêter.$$,$$Tu caches le produit, l’adresse et ton aide.$$,$$Tu n’étais pas présent au meurtre.$$,$$Tu as facilité l’enlèvement. Tu n’as pas décidé de tuer.$$),

  ('017',1,$$Tu gardes physiquement les deux otages.$$,$$Quand une victime résiste, tu la maintiens violemment. Sa respiration se dégrade. Tu continues encore plusieurs minutes avant de comprendre qu’elle est en train de mourir.$$,$$Tu caches que ton geste provoque directement la détresse mortelle.$$,$$Personne ne t’avait ordonné de tuer.$$,$$L’absence d’ordre de tuer n’efface pas ton geste.$$),
  ('017',2,$$Tu as organisé la séquestration.$$,$$Quand la victime va mal, tu refuses d’abord d’appeler les secours pour ne pas perdre ton moyen de pression. Tu fais ensuite libérer le survivant.$$,$$Tu caches que tu savais qu’une aide médicale devenait urgente et que tu l’as retardée.$$,$$Tu n’as pas porté le geste initial.$$,$$Tu as retardé les secours en sachant que la situation était grave.$$),
  ('017',3,$$Tu interviens après que la situation a dégénéré.$$,$$Après la mort, tu fais supprimer des messages, organises un paiement et imposes le silence avant la libération du survivant.$$,$$Tu caches la destruction de preuves et l’achat du silence.$$,$$Tu n’étais pas présent au geste mortel.$$,$$Tu n’as pas causé la mort. Tu as organisé sa dissimulation.$$),

  ('018',1,$$Tu étais présent lors de la confrontation avec l’ancien directeur.$$,$$La dispute dégénère. Tu portes le geste qui le tue puis tu pars.$$,$$Tu caches le meurtre.$$,$$Tu n’as pas dressé les assiettes.$$,$$Tu as tué la victime. La mise en scène ne vient pas de toi.$$),
  ('018',2,$$Tu arrives après la mort.$$,$$Tu trouves le corps puis déplaces des objets et dresses les neuf assiettes pour transformer la scène en message.$$,$$Tu caches toute la mise en scène.$$,$$Tu n’as pas causé la mort.$$,$$Tu as modifié la scène. Tu n’as pas tué.$$),
  ('018',3,$$Tu es passé plus tôt pour voler de l’argent.$$,$$Tu viens avant la confrontation mortelle, voles de l’argent puis mens sur ta présence.$$,$$Tu caches le vol et ton passage.$$,$$Tu étais déjà parti au moment du meurtre.$$,$$Ton mensonge cache un vol, pas un meurtre.$$),

  ('019',1,$$Tu es une figure d’influence menacée par les révélations du lanceur d’alerte.$$,$$Tu demandes qu’il soit neutralisé et tu finances une opération de pression.$$,$$Tu caches la demande et l’argent.$$,$$Tu n’as jamais donné d’ordre explicite de tuer.$$,$$Tu as créé la mission. Le choix de tuer a été pris par quelqu’un d’autre.$$),
  ('019',2,$$Tu es le chef de sécurité. Tu as choisi de tuer le lanceur d’alerte.$$,$$Tu crées une fenêtre sans caméra puis décides d’une violence mortelle.$$,$$Tu caches le meurtre et la manipulation des accès.$$,$$La pression initiale venait d’un autre acteur.$$,$$La décision de tuer t’appartient.$$),
  ('019',3,$$Tu es un intermédiaire politique.$$,$$Après la mort, tu fais disparaître un dossier et contactes un témoin pour acheter son silence.$$,$$Tu caches la destruction des documents et le paiement.$$,$$Tu n’étais pas présent au meurtre.$$,$$Tu as couvert le meurtre. Tu ne l’as pas commis.$$),

  ('020',1,$$Tu es responsable de l’exploitation du Bal des Fondateurs.$$,$$Tu gardes plusieurs sorties secondaires verrouillées et refuses d’abord leur ouverture générale.$$,$$Tu caches que tu connaissais déjà les alertes et un exercice d’évacuation raté.$$,$$Tu n’as pas déclenché le feu.$$,$$Tu n’as pas allumé l’incendie. Tu as maintenu des portes fermées malgré le risque.$$),
  ('020',2,$$Tu es le contractant chargé de la sécurité incendie.$$,$$Tu repousses des réparations et signes une réception partielle malgré des défauts connus.$$,$$Tu caches les défauts et le report volontaire des travaux.$$,$$Tu ne contrôlais pas l’évacuation.$$,$$Tu as laissé des systèmes défaillants. Tu n’as pas dirigé la foule.$$),
  ('020',3,$$Tu coordonnes la sécurité pendant le Bal.$$,$$Tu prends les premiers signaux pour une diversion et retardes l’alarme générale.$$,$$Tu caches que le retard de l’alarme était volontaire.$$,$$Tu ignorais l’ampleur de certaines défaillances techniques.$$,$$Tu as retardé l’évacuation. Assume cette décision sans inventer ce que tu ne savais pas.$$),
  ('020',4,$$Tu es l’activiste infiltré qui a déclenché le premier feu.$$,$$Tu allumes volontairement un petit feu de diversion. Il se propage beaucoup plus vite que prévu.$$,$$Tu caches que le départ de feu vient de toi.$$,$$Tu ne connaissais pas les défaillances qui allaient transformer ce feu en catastrophe.$$,$$Tu as allumé le feu. Tu n’avais pas prévu 327 morts.$$)
), rebuilt as (
  select p.scenario_id,
         jsonb_agg(
           case when c.idx is null then e.obj else
             jsonb_set(
               jsonb_set(
                 jsonb_set(
                   jsonb_set(
                     jsonb_set(e.obj,'{place}',to_jsonb(c.place),true),
                     '{chronology}',to_jsonb(c.chronology),true),
                   '{hide}',to_jsonb(c.hide),true),
                 '{anchors}',to_jsonb(c.anchors),true),
               '{position}',to_jsonb(c.position),true)
           end
           order by e.ord
         ) as suspects
  from public.igr_v4_scenario_packs p
  cross join lateral jsonb_array_elements(coalesce(p.pack->'suspects','[]'::jsonb)) with ordinality e(obj,ord)
  left join copy c on c.scenario_id=p.scenario_id and c.idx=e.ord
  group by p.scenario_id
)
update public.igr_v4_scenario_packs p
set pack=jsonb_set(p.pack,'{suspects}',r.suspects,true), updated_at=now()
from rebuilt r
where p.scenario_id=r.scenario_id;

-- 3) Use the same direct facts in the cinematic character cards.
with rebuilt as (
  select p.scenario_id,
         jsonb_agg(
           e.obj || jsonb_build_object(
             'place', coalesce(p.pack->'suspects'->((e.ord-1)::int)->>'place', e.obj->>'place'),
             'chronology', coalesce(p.pack->'suspects'->((e.ord-1)::int)->>'chronology', e.obj->>'chronology'),
             'hide', coalesce(p.pack->'suspects'->((e.ord-1)::int)->>'hide', e.obj->>'hide'),
             'anchors', coalesce(p.pack->'suspects'->((e.ord-1)::int)->>'anchors', e.obj->>'anchors')
           )
           order by e.ord
         ) as characters
  from public.igr_v4_scenario_packs p
  cross join lateral jsonb_array_elements(coalesce(p.pack#>'{truth,cinematic,characters}','[]'::jsonb)) with ordinality e(obj,ord)
  group by p.scenario_id
)
update public.igr_v4_scenario_packs p
set pack=jsonb_set(p.pack,'{truth,cinematic,characters}',r.characters,true), updated_at=now()
from rebuilt r
where p.scenario_id=r.scenario_id;

-- 4) The six reveals that were still the most abstract get fully direct timelines/reframes.
update public.igr_v4_scenario_packs set pack=jsonb_set(jsonb_set(pack,'{truth,cinematic,timeline}',
  '["Les anciens meurtres du Masque Blanc ont réellement eu lieu.","Le troisième suspect va voir Keller pour un motif personnel.","La confrontation dégénère. Il tue Keller.","Après le meurtre, il place le masque sur la scène pour faire croire que le Masque Blanc a encore frappé."]'::jsonb,true),
  '{truth,cinematic,reframes}',
  '["Les deux premiers suspects connaissent réellement le Masque Blanc. Leur connaissance est suspecte, mais elle ne prouve pas le meurtre de Keller.","Les différences avec les anciens crimes viennent du fait que le meurtrier imitait le Masque Blanc."]'::jsonb,true),updated_at=now() where scenario_id='005';

update public.igr_v4_scenario_packs set pack=jsonb_set(jsonb_set(pack,'{truth,cinematic,timeline}',
  '["Une dispute éclate dans le chalet.","Le deuxième suspect frappe Noé. Noé chute.","Les trois pensent que Noé est mort.","Le premier suspect pousse le groupe à cacher ce qui s’est passé.","Le troisième participe à la dissimulation et garde un détail matériel pendant cinq ans."]'::jsonb,true),
  '{truth,cinematic,reframes}',
  '["Le coup et la dissimulation sont deux actes différents.","Le deuxième suspect a frappé Noé. Les trois ont ensuite participé au silence."]'::jsonb,true),updated_at=now() where scenario_id='006';

update public.igr_v4_scenario_packs set pack=jsonb_set(jsonb_set(pack,'{truth,cinematic,timeline}',
  '["Le Sujet 17 retire clairement son consentement.","ORPHÉE continue malgré son refus.","Une opposition verbale est enregistrée.","La chute survient ensuite.","L’amnésie est réelle. Après l’incident, une note clinique est modifiée."]'::jsonb,true),
  '{truth,cinematic,reframes}',
  '["L’amnésie n’est pas simulée.","Elle ne change pas ce qui avait été décidé avant la chute."]'::jsonb,true),updated_at=now() where scenario_id='009';

update public.igr_v4_scenario_packs set pack=jsonb_set(jsonb_set(pack,'{truth,cinematic,timeline}',
  '["Nora est enfermée vivante derrière le mur.","Des bruits sont entendus avant 13 h 54.","À 13 h 54, quelqu’un ouvre.","Nora est encore vivante.","La personne la voit, referme volontairement et part."]'::jsonb,true),
  '{truth,cinematic,reframes}',
  '["Enfermer Nora et la refermer plus tard alors qu’elle est vivante sont deux actes différents.","Entendre un bruit n’est pas la même chose que voir Nora vivante puis choisir de refermer."]'::jsonb,true),updated_at=now() where scenario_id='010';

update public.igr_v4_scenario_packs set pack=jsonb_set(jsonb_set(pack,'{truth,cinematic,timeline}',
  '["Un ordre risqué est donné malgré des alertes civiles.","Sur le terrain, une partie de cet ordre est dépassée.","Les responsables ne reçoivent pas tous les mêmes informations au même moment.","Une possibilité d’arrêt est retardée.","Après les faits, un rapport est réécrit."]'::jsonb,true),
  '{truth,cinematic,reframes}',
  '["Donner l’ordre, le dépasser, attendre avant de l’arrêter et falsifier un rapport sont quatre actes différents.","Le manque d’information explique certaines décisions. Il n’explique pas celles prises après que le danger était devenu clair."]'::jsonb,true),updated_at=now() where scenario_id='011';

update public.igr_v4_scenario_packs set pack=jsonb_set(jsonb_set(pack,'{truth,cinematic,timeline}',
  '["Les alertes médicales s’accumulent autour d’ÉLIGIBLES.","La direction refuse de suspendre le dispositif.","Le clinicien signale un risque puis signe quand même la poursuite.","La réévaluation arrive trop tard.","Après la mort, des notes sont modifiées et un document est retardé."]'::jsonb,true),
  '{truth,cinematic,reframes}',
  '["La falsification après la mort est grave, mais elle arrive après la décision qui a exposé la victime.","Le clinicien n’a pas créé le programme. Sa signature a quand même permis sa poursuite."]'::jsonb,true),updated_at=now() where scenario_id='015';
