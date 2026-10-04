-- Inside Grey Room v41 — editorial pass for suspect objectives 002–020.
-- Each private card now has a scenario/character-specific objective instead of
-- a responsibility-level formula prepended to the existing defense line.

do $$
declare r record;
begin
  for r in
    select * from (values
      ('002',1,'Fais reconnaître ta cruauté sans laisser l’enquête te transformer en auteur du suicide.'),
      ('002',2,'Assume tes mots, mais empêche qu’on leur attribue une intention de pousser Léon à mourir.'),
      ('002',3,'Fais reconnaître ton inaction comme une faute distincte des humiliations qui ont conduit Léon au bord du gouffre.'),
      ('002',4,'Assume ton erreur de jugement sans laisser croire que tu voulais la mort de Léon.'),
      ('003',1,'Reconnais la brèche que tu as créée, mais oblige l’enquête à reconstruire toute la chaîne ayant rendu l’attaque possible.'),
      ('003',2,'Assume l’alerte que tu as vue et ton obéissance ; fais distinguer ton choix de ceux des autres maillons.'),
      ('003',3,'Protège ce que tu peux encore protéger, mais distingue clairement la dissimulation du programme de l’attaque elle-même.'),
      ('004',1,'Assume d’avoir refusé d’aider Sofia ; empêche que ce refus soit confondu avec un empoisonnement.'),
      ('004',2,'Fais reconnaître la gravité de ton retard sans laisser croire que tu voulais sa mort.'),
      ('004',3,'Assume d’avoir volontairement perdu du temps et défends uniquement ce qui ne relève pas de ton choix.'),
      ('005',1,'Ne nie pas ton obsession ; fais distinguer ta connaissance du rituel de l’auteur du meurtre.'),
      ('005',2,'Démontre que les différences avec les anciens crimes comptent davantage que ton mensonge ou ton comportement.'),
      ('005',3,'Maintiens l’hypothèse d’un nouveau crime du Masque Blanc aussi longtemps que les éléments le permettent.'),
      ('006',1,'Assume d’avoir aidé à dissimuler les faits sans porter le coup initial.'),
      ('006',2,'Fais reconnaître que ton geste a causé la mort tout en défendant l’absence de préméditation.'),
      ('006',3,'Ne laisse pas ta peur et ton silence te transformer en auteur du coup que tu n’as pas porté.'),
      ('007',1,'Assume la pression financière, mais force l’enquête à distinguer mobile, pression et preuve du meurtre.'),
      ('007',2,'Reconnais la dissimulation si elle est établie et sépare-la du décès.'),
      ('007',3,'Protège ton secret sans inventer de faits et sans accepter une responsabilité qui n’est pas la tienne.'),
      ('008',1,'Si ton mensonge tombe, sauve ce qui reste vrai dans ta déposition au lieu de tout nier.'),
      ('008',2,'Assume la pression que tu as exercée et fais distinguer cette faute du fait principal.'),
      ('008',3,'Fais comprendre que ton mensonge protège ta vie privée, pas l’auteur du crime principal.'),
      ('009',1,'Défends la légitimité que tu attribuais au protocole avant la chute ; ton amnésie est réelle, ne la joue pas comme un alibi.'),
      ('009',2,'Assume d’avoir protégé le programme et empêche que l’amnésie du médecin absorbe ta propre responsabilité.'),
      ('009',3,'Protège ton geste personnel si tu peux, mais ne laisse pas l’enquête te rendre responsable du protocole.'),
      ('010',1,'Assume l’enfermement initial et distingue-le de la décision ultérieure qui a condamné Nora.'),
      ('010',2,'Tu as refermé la porte en sachant ce que tu faisais : défends seulement les actes que tu n’as pas commis.'),
      ('010',3,'Reste sur ce que tu as réellement perçu : un bruit n’équivaut pas à voir Nora vivante puis refermer.'),
      ('011',1,'Assume d’avoir maintenu l’ordre et montre précisément ce que tu savais à ce moment-là, sans te réfugier derrière la hiérarchie.'),
      ('011',2,'Sépare devant l’enquête ce que tu as exécuté, ce que tu as dépassé et ce que tu as ensuite dissimulé.'),
      ('011',3,'Fais porter le débat sur le moment où attendre est devenu indéfendable, pas sur une responsabilité que tu n’avais pas encore.'),
      ('012',1,'Assume ton ordre de rétention mais fais distinguer cet ordre des coups décidés et portés par un autre.'),
      ('012',2,'Assume les coups que tu as choisis toi-même ; ne te cache pas derrière un ordre qui ne les contenait pas.'),
      ('012',3,'Fais reconnaître l’aide que tu as finalement apportée sans effacer les heures où tu as laissé faire.'),
      ('013',1,'Fais distinguer ton rôle dans la préparation de l’attentat de celui du tireur, sans effacer ce que tu as rendu possible.'),
      ('013',2,'Protège tes commanditaires si tu peux, mais ne conteste pas le tir que tu as exécuté.'),
      ('013',3,'Assume d’avoir vendu la faille d’accès et empêche qu’on te confonde avec celui qui a tiré.'),
      ('014',1,'Reconnais l’extraction de la liste sans accepter d’être présenté comme celui qui l’a vendue.'),
      ('014',2,'Tu as vendu la liste : défends seulement les zones qui restent réellement incertaines autour de la fuite.'),
      ('014',3,'Assume la dissimulation après les faits et distingue-la de la vente qui a exposé les informateurs.'),
      ('015',1,'Assume la décision de maintenir ÉLIGIBLES et ne te réfugie pas derrière ceux qui l’ont exécutée.'),
      ('015',2,'Assume la signature qui a permis au programme de continuer, sans porter seul la conception du système.'),
      ('015',3,'Reconnais la couverture après la mort et distingue-la de la décision antérieure qui a exposé le patient.'),
      ('016',1,'Assume la violence que tu as organisée et fais établir que tu n’as jamais donné d’ordre de tuer.'),
      ('016',2,'Assume que le meurtre est ton choix personnel et distingue-le du plan initial si cela limite ce qui est reproché aux autres.'),
      ('016',3,'Reconnais ce que tu as fourni au groupe et sépare cette aide de la décision de tuer.'),
      ('017',1,'Ne nie pas le geste mortel : défends seulement l’absence d’un ordre explicite de tuer et ce que cela change réellement.'),
      ('017',2,'Assume l’organisation et le retard des secours, tout en distinguant ton rôle du geste physique.'),
      ('017',3,'Reconnais la dissimulation sans te laisser désigner comme l’auteur du geste mortel.'),
      ('018',1,'Tu as tué la victime : fais seulement établir que la mise en scène des neuf assiettes appartient à quelqu’un d’autre.'),
      ('018',2,'Assume la mise en scène et démontre qu’elle est distincte du meurtre.'),
      ('018',3,'Fais reconnaître que ton mensonge cache un vol et non le meurtre.'),
      ('019',1,'Assume la pression que tu as commandée et défends la limite exacte de ce que tu voulais obtenir.'),
      ('019',2,'Tu as commis le meurtre : utilise la chaîne de pression pour expliquer le contexte, pas pour nier ton geste.'),
      ('019',3,'Reconnais la dissimulation tout en établissant que tu n’as pas porté le geste fatal.'),
      ('020',1,'Assume les portes verrouillées et force l’enquête à reconstruire les autres causes qui ont transformé le feu en catastrophe.'),
      ('020',2,'Reconnais les défauts laissés en place et distingue-les des décisions prises pendant l’évacuation.'),
      ('020',3,'Assume ton retard d’intervention et défends uniquement ce que tu ne pouvais réellement pas savoir.'),
      ('020',4,'Assume d’avoir déclenché le feu tout en établissant que provoquer 327 morts n’était pas ton intention.')
    ) as x(scenario_id,slot,objective)
  loop
    update public.igr_v4_scenario_packs
    set pack=jsonb_set(
      pack,
      array['suspects',(r.slot-1)::text,'objective_main'],
      to_jsonb(r.objective::text),
      true
    )
    where scenario_id=r.scenario_id;
  end loop;
end
$$;
