-- Inside Grey Room v12.41 — owner-only DLC creation and full server support for 029–034

insert into public.igr_v4_scenario_packs(scenario_id,pack) values
('029',$igr${"context":"Une enquête sur plusieurs exécutions liées à un cartel fictif commence à provoquer des représailles contre ceux qui la mènent. L’urgence ne doit pas modifier la vérité canonique.","suspects":[{"place":"Intermédiaire financier.","position":"Tu veux minimiser ton rôle en affirmant que tu ne faisais que transférer de l’argent.","anchors":"Tu connaissais la finalité criminelle d’une partie des fonds.","hide":"Tu caches un paiement effectué après une exécution.","chronology":"Tu coopères seulement lorsque la pression judiciaire devient supérieure à celle du réseau."},{"place":"Responsable local.","position":"Tu protèges ta place et accuses l’intermédiaire d’avoir dépassé ses instructions.","anchors":"Tu as validé plusieurs opérations coercitives.","hide":"Tu caches avoir demandé une intimidation qui a dégénéré.","chronology":"Tu as perdu du contrôle sur certains exécutants."},{"place":"Exécutant devenu coopérant.","position":"Tu veux sauver ta peau en livrant la chaîne de décision.","anchors":"Tu as participé matériellement à une exécution.","hide":"Tu caches une seconde victime dont personne ne parle encore.","chronology":"Tu proposes de coopérer lorsque tu comprends que le réseau peut te sacrifier."}],"relations":{"1":[],"2":[],"3":[]},"role_notes":{},"trames":[{"title":"PAIEMENT APRÈS LES FAITS","text":"Un transfert financier est effectué après une exécution et relie le premier suspect au réseau.","kind":"clarity","min_cycle":1,"axes":["responsabilite"]},{"title":"ORDRE AMBIGU","text":"Un message du deuxième suspect demande de faire peur sans préciser la violence attendue.","kind":"ambiguity","min_cycle":1,"axes":["responsabilite"]},{"title":"COOPÉRATION","text":"Le troisième suspect livre un lieu vérifiable et gagne en crédibilité.","kind":"balanced","min_cycle":1,"axes":["responsabilite"]},{"title":"REPRÉSAILLES","text":"Une menace vise l’équipe d’enquête sans révéler qui l’a ordonnée.","kind":"balanced","min_cycle":2,"axes":["responsabilite"]},{"title":"SECONDE VICTIME","text":"Une victime non déclarée est reliée à l’exécutant.","kind":"clarity","min_cycle":2,"axes":["responsabilite"]},{"title":"CHAÎNE DE DÉCISION","text":"Les derniers éléments distinguent l’ordre initial, l’escalade et l’exécution matérielle.","kind":"clarity","min_cycle":3,"axes":["responsabilite"]}],"field_actions":[],"expert_actions":[],"protected":[],"witnesses":[],"news":[],"truth":{"levels":[1,2,3],"summary":"Le financier savait ce qu’il facilitait, le responsable local a déclenché une intimidation meurtrière et l’exécutant est l’auteur matériel le plus compromis malgré sa coopération."}}$igr$::jsonb),
('030',$igr${"context":"Le cartel a infiltré une partie du système judiciaire. L’enquête doit distinguer décisions achetées, peur, opportunisme et décisions encore légalement défendables.","suspects":[{"place":"Fixeur du cartel.","position":"Tu négocies faveurs et pressions sans exécuter toi-même les violences.","anchors":"Tu as approché plusieurs acteurs judiciaires.","hide":"Tu caches un paiement indirect à un intermédiaire.","chronology":"Tu travailles par couches pour que personne ne voie toute la chaîne."},{"place":"Intermédiaire institutionnel.","position":"Tu prétends avoir seulement transmis des messages.","anchors":"Tu savais que certains avantages étaient liés à des décisions attendues.","hide":"Tu caches avoir organisé une rencontre décisive.","chronology":"Tu coopères pour éviter d’être présenté comme organisateur central."},{"place":"Cadre du cartel.","position":"Tu as financé la stratégie de corruption et menaces.","anchors":"Tu ne contrôlais pas chaque décision judiciaire mais fixais l’objectif.","hide":"Tu caches avoir validé une menace contre un témoin.","chronology":"Tu utilises la peur et l’argent selon ce qui coûte le moins."}],"relations":{"1":[],"2":[],"3":[]},"role_notes":{},"trames":[{"title":"PAIEMENT INDIRECT","text":"Un transfert passe par une société sans activité réelle.","kind":"balanced","min_cycle":1,"axes":["responsabilite"]},{"title":"RENCONTRE NON DÉCLARÉE","text":"Une rencontre entre intermédiaires est confirmée.","kind":"clarity","min_cycle":1,"axes":["responsabilite"]},{"title":"DÉCISION DÉFENDABLE","text":"Une décision soupçonnée d’être achetée dispose aussi d’un motif juridique réel.","kind":"ambiguity","min_cycle":1,"axes":["responsabilite"]},{"title":"TÉMOIN MENACÉ","text":"Un témoin reçoit une menace après avoir refusé un arrangement.","kind":"clarity","min_cycle":2,"axes":["responsabilite"]},{"title":"CHAÎNE FINANCIÈRE","text":"Les paiements convergent vers le troisième suspect sans prouver qu’il dictait chaque décision.","kind":"balanced","min_cycle":2,"axes":["responsabilite"]},{"title":"OBJECTIF COMMUN","text":"Plusieurs échanges montrent que le but était d’affaiblir durablement une procédure judiciaire.","kind":"clarity","min_cycle":3,"axes":["responsabilite"]}],"field_actions":[],"expert_actions":[],"protected":[],"witnesses":[],"news":[],"truth":{"levels":[1,2,3],"summary":"Le fixeur facilite, l’intermédiaire institutionnel participe consciemment et le cadre finance et oriente la stratégie globale."}}$igr$::jsonb),
('031',$igr${"context":"Le réseau transforme une procédure en dette personnelle après la disparition d’un proche. Les suspects n’ont pas tous le même degré de loyauté ni la même responsabilité.","suspects":[{"place":"Négociateur du réseau.","position":"Tu veux obtenir un compromis sans porter l’enlèvement.","anchors":"Tu as transmis des exigences après la disparition.","hide":"Tu caches avoir su que le proche était retenu contre son gré.","chronology":"Tu entres dans le dossier après l’enlèvement mais acceptes d’en tirer avantage."},{"place":"Gardien logistique.","position":"Tu minimises ton rôle en disant que tu ne connaissais pas la victime.","anchors":"Tu as assuré un lieu de rétention.","hide":"Tu caches avoir refusé de libérer la victime après avoir compris la situation.","chronology":"Tu obéis d’abord puis choisis de continuer."},{"place":"Responsable violent.","position":"Tu considères la pression personnelle comme un outil normal.","anchors":"Tu as décidé de la disparition et fixé les exigences.","hide":"Tu caches une violence antérieure contre un autre proche.","chronology":"Tu utilises l’enlèvement pour forcer une décision judiciaire."}],"relations":{"1":[],"2":[],"3":[]},"role_notes":{},"trames":[{"title":"EXIGENCES","text":"Un message relie explicitement la disparition à une décision attendue.","kind":"clarity","min_cycle":1,"axes":["responsabilite"]},{"title":"LIEU DE RÉTENTION","text":"Des traces confirment que le deuxième suspect gérait le lieu.","kind":"clarity","min_cycle":1,"axes":["responsabilite"]},{"title":"NÉGOCIATION TARDIVE","text":"Le premier suspect n’apparaît qu’après la disparition mais connaît déjà des détails non publics.","kind":"balanced","min_cycle":1,"axes":["responsabilite"]},{"title":"VIOLENCE ANTÉRIEURE","text":"Une ancienne intimidation comparable est liée au troisième suspect.","kind":"clarity","min_cycle":2,"axes":["responsabilite"]},{"title":"REFUS DE LIBÉRER","text":"Le deuxième suspect disposait d’une occasion réaliste de libérer la victime et ne l’a pas fait.","kind":"balanced","min_cycle":2,"axes":["responsabilite"]},{"title":"INITIATIVE","text":"Les échanges finaux montrent que le troisième suspect a lancé l’opération.","kind":"clarity","min_cycle":3,"axes":["responsabilite"]}],"field_actions":[],"expert_actions":[],"protected":[],"witnesses":[],"news":[],"truth":{"levels":[1,2,3],"summary":"Le négociateur profite consciemment de l’enlèvement, le gardien choisit de maintenir la rétention et le troisième suspect en est l’instigateur central."}}$igr$::jsonb),
('032',$igr${"context":"Après la chute d’un régime fictif, des archives documentent arrestations arbitraires, disparitions et ordres partiels. Chaque suspect peut accuser un autre, mais les documents restent la référence.","suspects":[{"place":"Chef administratif.","position":"Tu soutiens que tes signatures étaient formelles.","anchors":"Tu savais que certaines listes entraînaient des arrestations.","hide":"Tu caches avoir corrigé une liste pour maintenir un opposant détenu.","chronology":"Tu signes, délègues et évites de visiter les lieux de détention."},{"place":"Responsable de sécurité.","position":"Tu renvoies vers les ordres civils pour réduire ta responsabilité.","anchors":"Tu as organisé des arrestations et connaissais les mauvais traitements.","hide":"Tu caches avoir prolongé plusieurs détentions sans ordre écrit.","chronology":"Tu transformes des directives générales en pratiques coercitives."},{"place":"Conseiller du palais.","position":"Tu n’as pas exécuté les arrestations mais orientais les priorités du régime.","anchors":"Tes notes influençaient les listes de personnes ciblées.","hide":"Tu caches avoir demandé qu’un opposant soit neutralisé sans formaliser la méthode.","chronology":"Tu donnes des objectifs que d’autres traduisent en ordres."}],"relations":{"1":[],"2":[],"3":[]},"role_notes":{},"trames":[{"title":"LISTE SIGNÉE","text":"Une liste d’arrestations porte la signature du premier suspect.","kind":"balanced","min_cycle":1,"axes":["responsabilite"]},{"title":"DÉTENTION PROLONGÉE","text":"Des registres montrent des prolongations sans ordre écrit validées par le deuxième suspect.","kind":"clarity","min_cycle":1,"axes":["responsabilite"]},{"title":"NOTE DU PALAIS","text":"Une note du troisième suspect désigne un opposant comme priorité.","kind":"balanced","min_cycle":1,"axes":["responsabilite"]},{"title":"ORDRE GÉNÉRAL","text":"Aucun document ne prescrit explicitement les mauvais traitements.","kind":"ambiguity","min_cycle":2,"axes":["responsabilite"]},{"title":"CORRECTION MANUSCRITE","text":"Le premier suspect modifie une liste après avoir été informé d’une détention abusive.","kind":"clarity","min_cycle":2,"axes":["responsabilite"]},{"title":"CHAÎNE","text":"Les archives permettent de séparer cible politique, ordre administratif et exécution sécuritaire.","kind":"clarity","min_cycle":3,"axes":["responsabilite"]}],"field_actions":[],"expert_actions":[],"protected":[],"witnesses":[],"news":[],"truth":{"levels":[1,3,2],"summary":"L’administrateur facilite consciemment, le responsable de sécurité met en œuvre et aggrave les détentions, et le conseiller fixe des priorités politiques qui déclenchent la répression."}}$igr$::jsonb),
('033',$igr${"context":"Une famille oligarchique occupait les postes clés d’un gouvernement déchu. Les liens de sang ne suffisent pas : l’enquête doit reconstruire le pouvoir réel.","suspects":[{"place":"Membre de la famille chargé des finances.","position":"Tu présentes ton rôle comme patrimonial et non politique.","anchors":"Tu as financé des structures utilisées par l’appareil répressif.","hide":"Tu caches un financement après avoir appris l’usage réel des fonds.","chronology":"Tu continues à payer alors que les abus sont connus."},{"place":"Parent occupant une fonction ministérielle.","position":"Tu soutiens que les services agissaient sans toi.","anchors":"Tu pouvais modifier certaines nominations et priorités.","hide":"Tu caches avoir protégé un chef de service après un scandale.","chronology":"Tu choisis la stabilité familiale plutôt que l’enquête interne."},{"place":"Conseiller sans titre officiel majeur.","position":"Tu prétends n’avoir été qu’un proche du pouvoir.","anchors":"Plusieurs décisions étaient retardées jusqu’à ton avis.","hide":"Tu caches avoir arbitré un conflit qui a renforcé la branche la plus violente.","chronology":"Ton influence passe par les relations plutôt que par les décrets."}],"relations":{"1":[],"2":[],"3":[]},"role_notes":{},"trames":[{"title":"FINANCEMENT","text":"Des fonds privés soutiennent une structure de sécurité après révélation d’abus.","kind":"clarity","min_cycle":1,"axes":["responsabilite"]},{"title":"NOMINATION","text":"Une nomination contestée est maintenue par le deuxième suspect.","kind":"balanced","min_cycle":1,"axes":["responsabilite"]},{"title":"AGENDA PRIVÉ","text":"Des rendez-vous montrent que le troisième suspect était consulté avant plusieurs décisions.","kind":"balanced","min_cycle":1,"axes":["responsabilite"]},{"title":"LIEN DE SANG","text":"Un proche non impliqué est accusé uniquement en raison de sa parenté.","kind":"ambiguity","min_cycle":2,"axes":["responsabilite"]},{"title":"PROTECTION","text":"Le ministre bloque une enquête administrative sur un chef de service.","kind":"clarity","min_cycle":2,"axes":["responsabilite"]},{"title":"POUVOIR RÉEL","text":"Les décisions les plus sensibles convergent vers l’avis du troisième suspect malgré son faible titre officiel.","kind":"clarity","min_cycle":3,"axes":["responsabilite"]}],"field_actions":[],"expert_actions":[],"protected":[],"witnesses":[],"news":[],"truth":{"levels":[1,2,3],"summary":"Le financier soutient matériellement, le ministre protège institutionnellement et le conseiller sans titre exerce l’influence politique la plus forte."}}$igr$::jsonb),
('034',$igr${"context":"Les derniers dossiers du régime utilisent des surnoms pour des acteurs dont l’influence change selon les opérations. Les fonctions officielles et les noms internes ne coïncident pas.","suspects":[{"place":"Officier surnommé « le Notaire ».","position":"Tu insistes sur le fait que ton surnom exagère ton pouvoir.","anchors":"Tu authentifiais certaines décisions mais n’en étais pas toujours l’auteur.","hide":"Tu caches avoir validé un transfert de détenus en connaissant le risque.","chronology":"Ton rôle varie selon les opérations."},{"place":"Cadre surnommé « la Tour ».","position":"Tu prétends être un simple relais.","anchors":"Tu centralisais des informations et pouvais bloquer certaines opérations.","hide":"Tu caches avoir laissé passer une opération après un avertissement crédible.","chronology":"Tu contrôles le flux d’information plus que les ordres formels."},{"place":"Conseiller surnommé « l’Héritier ».","position":"Tu présentes le surnom comme une rumeur.","anchors":"Tu disposais d’un accès direct au sommet et influençais les priorités.","hide":"Tu caches avoir recommandé une opération qui a entraîné des crimes graves.","chronology":"Tu n’occupes pas le plus haut poste mais ton avis pèse sur les choix du pouvoir."}],"relations":{"1":[],"2":[],"3":[]},"role_notes":{},"trames":[{"title":"CARNET DE SURNOMS","text":"Un carnet relie les trois surnoms à des fonctions variables selon les dossiers.","kind":"balanced","min_cycle":1,"axes":["responsabilite"]},{"title":"TRANSFERT","text":"Le Notaire valide un transfert après réception d’un avertissement.","kind":"clarity","min_cycle":1,"axes":["responsabilite"]},{"title":"INFORMATION BLOQUÉE","text":"La Tour reçoit une alerte crédible mais ne la transmet pas avant une opération.","kind":"clarity","min_cycle":1,"axes":["responsabilite"]},{"title":"FAUSSE HIÉRARCHIE","text":"Un document interne utilise un surnom prestigieux pour un acteur sans pouvoir décisionnel.","kind":"ambiguity","min_cycle":2,"axes":["responsabilite"]},{"title":"ACCÈS AU SOMMET","text":"L’Héritier apparaît dans plusieurs réunions précédant des décisions majeures.","kind":"balanced","min_cycle":2,"axes":["responsabilite"]},{"title":"RECOMMANDATION","text":"Une note relie directement l’Héritier à la recommandation d’une opération criminelle.","kind":"clarity","min_cycle":3,"axes":["responsabilite"]}],"field_actions":[],"expert_actions":[],"protected":[],"witnesses":[],"news":[],"truth":{"levels":[2,2,3],"summary":"Le Notaire valide certains actes, la Tour contrôle l’information et l’Héritier exerce l’influence stratégique la plus importante. Les surnoms n’indiquent pas à eux seuls la responsabilité."}}$igr$::jsonb)
on conflict (scenario_id) do update set pack=excluded.pack;

create or replace function public.igr_v4_min_players(p_scenario text)
returns integer
language sql
immutable
set search_path to 'public'
as $function$
 select case
 when p_scenario in ('021','022','023','024','025') then 4
 when p_scenario='026' then 6 when p_scenario='027' then 7 when p_scenario='028' then 6
 when p_scenario='029' then 5 when p_scenario='030' then 7 when p_scenario='031' then 6
 when p_scenario='032' then 6 when p_scenario='033' then 6 when p_scenario='034' then 7
 when p_scenario in ('001','003','004','005','006') then 4
 when p_scenario='002' then 5
 when p_scenario in ('007','008','009','010','011','012','013','014','015','016') then 5
 when p_scenario='017' then 7 when p_scenario='018' then 6 when p_scenario='019' then 9 when p_scenario='020' then 13 else 5 end
$function$;

create or replace function public.igr_v4_max_players(p_scenario text)
returns integer
language sql
immutable
set search_path to 'public'
as $function$
 select case
 when p_scenario in ('021','022','023','024','025') then 8
 when p_scenario='026' then 7 when p_scenario='027' then 8 when p_scenario='028' then 8
 when p_scenario='029' then 8 when p_scenario='030' then 9 when p_scenario='031' then 8
 when p_scenario='032' then 8 when p_scenario='033' then 8 when p_scenario='034' then 9
 when p_scenario in ('001','003','004','005','006') then 5
 when p_scenario='002' then 6
 when p_scenario in ('007','008','009','010','011','012') then 5
 when p_scenario in ('013','014') then 6 when p_scenario='015' then 7 when p_scenario='016' then 8
 when p_scenario='017' then 8 when p_scenario='018' then 6 when p_scenario='019' then 9 when p_scenario='020' then 16 else 5 end
$function$;

create or replace function public.igr_v4_role_for_seat(p_scenario text, p_seat integer, p_count integer)
returns text
language plpgsql
immutable
set search_path to 'public'
as $function$
begin
 if p_scenario='026' then
   if p_count=6 then return (array['enqueteur','analyste','expert','suspect','suspect','suspect'])[p_seat+1];
   else return (array['enqueteur','analyste','expert','procureur','suspect','suspect','suspect'])[p_seat+1]; end if;
 elsif p_scenario='027' then
   if p_count=7 then return (array['enqueteur','analyste','procureur','inspecteur','suspect','suspect','suspect'])[p_seat+1];
   else return (array['enqueteur','analyste','procureur','inspecteur','expert','suspect','suspect','suspect'])[p_seat+1]; end if;
 elsif p_scenario='028' then
   if p_count=6 then return (array['enqueteur','analyste','expert','suspect','suspect','suspect'])[p_seat+1];
   elsif p_count=7 then return (array['enqueteur','analyste','expert','inspecteur','suspect','suspect','suspect'])[p_seat+1];
   else return (array['enqueteur','analyste','expert','inspecteur','procureur','suspect','suspect','suspect'])[p_seat+1]; end if;
 elsif p_scenario='029' then
   if p_count=5 then return (array['enqueteur','analyste','suspect','suspect','suspect'])[p_seat+1];
   elsif p_count=6 then return (array['enqueteur','analyste','maitre','suspect','suspect','suspect'])[p_seat+1];
   elsif p_count=7 then return (array['enqueteur','analyste','maitre','procureur','suspect','suspect','suspect'])[p_seat+1];
   else return (array['enqueteur','analyste','maitre','procureur','temoin','suspect','suspect','suspect'])[p_seat+1]; end if;
 elsif p_scenario='030' then
   if p_count=7 then return (array['enqueteur','analyste','procureur','juge','suspect','suspect','suspect'])[p_seat+1];
   elsif p_count=8 then return (array['enqueteur','analyste','procureur','juge','maitre','suspect','suspect','suspect'])[p_seat+1];
   else return (array['enqueteur','analyste','procureur','juge','maitre','journaliste','suspect','suspect','suspect'])[p_seat+1]; end if;
 elsif p_scenario='031' then
   if p_count=6 then return (array['enqueteur','analyste','maitre','suspect','suspect','suspect'])[p_seat+1];
   elsif p_count=7 then return (array['enqueteur','analyste','maitre','procureur','suspect','suspect','suspect'])[p_seat+1];
   else return (array['enqueteur','analyste','maitre','procureur','temoin','suspect','suspect','suspect'])[p_seat+1]; end if;
 elsif p_scenario='032' then
   if p_count=6 then return (array['enqueteur','analyste','procureur','suspect','suspect','suspect'])[p_seat+1];
   elsif p_count=7 then return (array['enqueteur','analyste','procureur','juge','suspect','suspect','suspect'])[p_seat+1];
   else return (array['enqueteur','analyste','procureur','juge','temoin','suspect','suspect','suspect'])[p_seat+1]; end if;
 elsif p_scenario='033' then
   if p_count=6 then return (array['enqueteur','analyste','juge','suspect','suspect','suspect'])[p_seat+1];
   elsif p_count=7 then return (array['enqueteur','analyste','juge','procureur','suspect','suspect','suspect'])[p_seat+1];
   else return (array['enqueteur','analyste','juge','procureur','temoin','suspect','suspect','suspect'])[p_seat+1]; end if;
 elsif p_scenario='034' then
   if p_count=7 then return (array['enqueteur','analyste','procureur','juge','suspect','suspect','suspect'])[p_seat+1];
   elsif p_count=8 then return (array['enqueteur','analyste','procureur','juge','temoin','suspect','suspect','suspect'])[p_seat+1];
   else return (array['enqueteur','analyste','procureur','juge','temoin','journaliste','suspect','suspect','suspect'])[p_seat+1]; end if;
 elsif p_scenario in ('001','003','004','005','006') then
   if p_seat=0 then return 'enqueteur'; elsif p_count=5 and p_seat=1 then return 'analyste'; else return 'suspect'; end if;
 elsif p_scenario='002' then
   if p_seat=0 then return 'enqueteur'; elsif p_count=6 and p_seat=1 then return 'analyste'; else return 'suspect'; end if;
 elsif p_scenario in ('007','008','009','010','011','012') then return (array['enqueteur','analyste','suspect','suspect','suspect'])[p_seat+1];
 elsif p_scenario='013' then return (array['enqueteur','analyste','suspect','suspect','suspect','procureur'])[p_seat+1];
 elsif p_scenario='014' then return (array['enqueteur','analyste','suspect','suspect','suspect','juge'])[p_seat+1];
 elsif p_scenario='015' then return (array['enqueteur','analyste','suspect','suspect','suspect','journaliste','juge'])[p_seat+1];
 elsif p_scenario='016' then return (array['enqueteur','analyste','suspect','suspect','suspect','maitre','journaliste','juge'])[p_seat+1];
 elsif p_scenario='017' then return (array['enqueteur','analyste','procureur','suspect','suspect','suspect','temoin','temoin'])[p_seat+1];
 elsif p_scenario='018' then return (array['enqueteur','analyste','inspecteur','suspect','suspect','suspect'])[p_seat+1];
 elsif p_scenario='019' then return (array['enqueteur','analyste','procureur','juge','journaliste','maitre','suspect','suspect','suspect'])[p_seat+1];
 elsif p_scenario='020' then return (array['enqueteur','analyste','inspecteur','procureur','juge','expert','suspect','suspect','suspect','suspect','maitre','journaliste','temoin','maitre','journaliste','temoin'])[p_seat+1];
 end if;
 return 'suspect';
end $function$;

create or replace function public.igr_v4_role_capacity(p_scenario text, p_count integer, p_role text)
returns integer
language plpgsql
immutable
set search_path to 'public'
as $function$
declare r text:=lower(trim(coalesce(p_role,'')));
begin
 if r='avocat' then r:='maitre'; end if;
 if r='enqueteur' then return 1;
 elsif r='analyste' then return case when p_scenario in ('001','003','004','005','006') and p_count=4 then 0 else 1 end;
 elsif r='suspect' then return case when p_scenario='002' then 4 when p_scenario='020' then 4 else 3 end;
 elsif r='procureur' then return case
   when p_scenario in ('017','019','020','027','030','032','034') then 1
   when p_scenario='013' and p_count>=6 then 1 when p_scenario='026' and p_count>=7 then 1 when p_scenario='028' and p_count>=8 then 1
   when p_scenario in ('029','031','033') and p_count>=7 then 1 else 0 end;
 elsif r='juge' then return case
   when p_scenario in ('019','020','030','033','034') then 1
   when p_scenario in ('032') and p_count>=7 then 1
   when p_scenario='014' and p_count>=6 then 1 when p_scenario='015' and p_count>=7 then 1 when p_scenario='016' and p_count>=8 then 1 else 0 end;
 elsif r='journaliste' then return case
   when p_scenario='019' then 1 when p_scenario='020' then case when p_count>=15 then 2 else 1 end
   when p_scenario='015' and p_count>=6 then 1 when p_scenario='016' and p_count>=7 then 1
   when p_scenario='030' and p_count>=9 then 1 when p_scenario='034' and p_count>=9 then 1 else 0 end;
 elsif r='maitre' then return case
   when p_scenario='019' then 1 when p_scenario='020' then case when p_count>=14 then 2 else 1 end when p_scenario='016' and p_count>=6 then 1
   when p_scenario='029' and p_count>=6 then 1 when p_scenario='030' and p_count>=8 then 1 when p_scenario='031' and p_count>=6 then 1 else 0 end;
 elsif r='inspecteur' then return case when p_scenario in ('018','020','027') then 1 when p_scenario='028' and p_count>=7 then 1 else 0 end;
 elsif r='expert' then return case when p_scenario in ('020','026','028') then 1 when p_scenario='027' and p_count>=8 then 1 else 0 end;
 elsif r='temoin' then return case
   when p_scenario='017' then case when p_count>=8 then 2 else 1 end
   when p_scenario='020' then case when p_count>=16 then 2 else 1 end
   when p_scenario='029' and p_count>=8 then 1 when p_scenario='031' and p_count>=8 then 1
   when p_scenario='032' and p_count>=8 then 1 when p_scenario='033' and p_count>=8 then 1 when p_scenario='034' and p_count>=8 then 1 else 0 end;
 end if;
 return 0;
end $function$;

create or replace function public.igr_owner_dlc_create_room(
  p_code text, p_scenario_id text, p_pseudo text, p_profile_id uuid, p_profile_token text
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare r public.igr_v4_rooms%rowtype; p public.igr_v4_players%rowtype; v_pseudo text;
begin
  perform public.igr_omerta_auth_profile(p_profile_id,p_profile_token);
  if not exists(
    select 1 from public.igr_omerta_entitlements e
    where e.profile_id=p_profile_id and e.access_level='owner' and e.status='active'
      and (e.expires_at is null or e.expires_at>now())
  ) then raise exception 'dlc_locked'; end if;
  if p_scenario_id not in ('026','027','028','029','030','031','032','033','034') then raise exception 'invalid_owner_dlc_scenario'; end if;
  perform igr_private.rate_limit('create_room_global','global',120,60);
  perform igr_private.rate_limit('create_room_code',upper(trim(p_code)),4,300);
  perform public.igr_v4_cleanup();
  if upper(trim(p_code))!~'^[A-Z2-9]{5}$' then raise exception 'invalid room code'; end if;
  if not exists(select 1 from public.igr_v4_scenario_packs where scenario_id=p_scenario_id) then raise exception 'invalid scenario'; end if;
  v_pseudo:=regexp_replace(trim(coalesce(p_pseudo,'')),'\s+',' ','g');
  perform igr_private.assert_ugc(v_pseudo,22,false);
  insert into public.igr_v4_rooms(code,scenario_id) values(upper(trim(p_code)),p_scenario_id) returning * into r;
  insert into public.igr_v4_players(room_code,pseudo,seat_index,is_host,profile_id) values(r.code,v_pseudo,0,true,p_profile_id) returning * into p;
  insert into public.igr_v4_events(room_code,event_type,payload) values(r.code,'room_created',jsonb_build_object('title','CELLULE DLC OUVERTE','text','Accès propriétaire vérifié.'));
  return jsonb_build_object('room_code',r.code,'player_id',p.id,'player_token',p.player_token,'host_token',r.host_token);
end
$function$;

revoke all on function public.igr_owner_dlc_create_room(text,text,text,uuid,text) from public;
grant execute on function public.igr_owner_dlc_create_room(text,text,text,uuid,text) to anon, authenticated;

create or replace function public.igr_v4_create_room(p_code text, p_scenario_id text, p_pseudo text)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare r public.igr_v4_rooms%rowtype; p public.igr_v4_players%rowtype; v_pseudo text;
begin
  perform igr_private.rate_limit('create_room_global','global',120,60);
  perform igr_private.rate_limit('create_room_code',upper(trim(p_code)),4,300);
  perform public.igr_v4_cleanup();
  if p_scenario_id between '021' and '034' then raise exception 'premium access required'; end if;
  if upper(trim(p_code))!~'^[A-Z2-9]{5}$' then raise exception 'invalid room code'; end if;
  if not exists(select 1 from public.igr_v4_scenario_packs where scenario_id=p_scenario_id) then raise exception 'invalid scenario'; end if;
  v_pseudo:=regexp_replace(trim(coalesce(p_pseudo,'')),'\s+',' ','g');
  perform igr_private.assert_ugc(v_pseudo,22,false);
  insert into public.igr_v4_rooms(code,scenario_id) values(upper(trim(p_code)),p_scenario_id) returning * into r;
  insert into public.igr_v4_players(room_code,pseudo,seat_index,is_host) values(r.code,v_pseudo,0,true) returning * into p;
  insert into public.igr_v4_events(room_code,event_type,payload) values(r.code,'room_created',jsonb_build_object('title','CELLULE OUVERTE','text','La cellule est prête.'));
  return jsonb_build_object('room_code',r.code,'player_id',p.id,'player_token',p.player_token,'host_token',r.host_token);
end
$function$;
