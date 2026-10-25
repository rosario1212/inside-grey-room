-- Optional sixth participant in 003, 008, 009 and 011.
-- Existing 4/5-player play and private A/B/C narrative remain unchanged.
-- This migration deliberately fails closed if the current core roster contracts differ.
DO $optional_roles$
DECLARE source_sql text; expected text; replacement text; item record;
BEGIN
  SELECT pg_get_functiondef('public.igr_v4_max_players(text)'::regprocedure) INTO source_sql;
  expected := 'when p_scenario in (''001'',''003'',''004'',''005'',''006'') then 5';
  replacement := 'when p_scenario in (''001'',''004'',''005'',''006'') then 5'
    || E'\n ' || 'when p_scenario in (''003'',''008'',''009'',''011'') then 6';
  IF position(expected in source_sql)=0 AND position('when p_scenario in (''003'',''008'',''009'',''011'') then 6' in source_sql)=0 THEN RAISE EXCEPTION 'Unexpected legacy maximum-player roster'; END IF;
  source_sql := replace(source_sql,expected,replacement);
  expected := 'when p_scenario in (''007'',''008'',''009'',''010'',''011'',''012'') then 5';
  IF position(expected in source_sql)=0 AND position('when p_scenario in (''007'',''010'',''012'') then 5' in source_sql)=0 THEN RAISE EXCEPTION 'Unexpected five-player roster'; END IF;
  source_sql := replace(source_sql,expected,'when p_scenario in (''007'',''010'',''012'') then 5');
  EXECUTE source_sql;

  SELECT pg_get_functiondef('public.igr_v4_role_for_seat(text,integer,integer)'::regprocedure) INTO source_sql;
  expected := 'elsif p_scenario in (''001'',''003'',''004'',''005'',''006'') then';
  IF position(expected in source_sql)=0 AND position('elsif p_scenario=''003'' then' in source_sql)=0 THEN RAISE EXCEPTION 'Unexpected 003 role roster'; END IF;
  replacement := $roster$
elsif p_scenario='003' then
   if p_count=6 then return (array['enqueteur','analyste','suspect','suspect','suspect','expert'])[p_seat+1];
   elsif p_count=5 then return (array['enqueteur','analyste','suspect','suspect','suspect'])[p_seat+1];
   else return (array['enqueteur','suspect','suspect','suspect'])[p_seat+1]; end if;
 elsif p_scenario in ('001','004','005','006') then$roster$;
  source_sql := replace(source_sql,expected,replacement);
  expected := 'elsif p_scenario in (''007'',''008'',''009'',''010'',''011'',''012'') then return (array[''enqueteur'',''analyste'',''suspect'',''suspect'',''suspect''])[p_seat+1];';
  IF position(expected in source_sql)=0 AND position('elsif p_scenario=''008'' then' in source_sql)=0 THEN RAISE EXCEPTION 'Unexpected 008/009/011 role roster'; END IF;
  replacement := $roster$
elsif p_scenario in ('007','010','012') then return (array['enqueteur','analyste','suspect','suspect','suspect'])[p_seat+1];
 elsif p_scenario='008' then return (array['enqueteur','analyste','suspect','suspect','suspect','juge'])[p_seat+1];
 elsif p_scenario='009' then return (array['enqueteur','analyste','suspect','suspect','suspect','expert'])[p_seat+1];
 elsif p_scenario='011' then return (array['enqueteur','analyste','suspect','suspect','suspect','procureur'])[p_seat+1];$roster$;
  source_sql := replace(source_sql,expected,replacement);
  EXECUTE source_sql;

  -- Release gates would otherwise flip false as soon as max_players becomes 6.
  FOR item IN
    SELECT * FROM (VALUES
      ('003','igr_v221_003_release_status'),
      ('008','igr_v301_008_release_status'),
      ('009','igr_v331_009_release_status'),
      ('011','igr_v371_011_release_status')
    ) t(case_id,routine_name)
  LOOP
    SELECT pg_get_functiondef(p.oid) INTO source_sql
    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='igr_private' AND p.proname=item.routine_name;
    IF source_sql IS NULL THEN RAISE EXCEPTION 'Missing %',item.routine_name; END IF;
    expected := 'public.igr_v4_max_players('''||item.case_id||''')=5';
    IF position(expected in source_sql)=0 AND position('public.igr_v4_max_players('''||item.case_id||''')=6' in source_sql)=0 THEN RAISE EXCEPTION 'Unexpected release contract %',item.case_id; END IF;
    source_sql := replace(source_sql,expected,'public.igr_v4_max_players('''||item.case_id||''')=6');
    EXECUTE source_sql;
  END LOOP;

  -- 003 private pack previously reset expert_actions to [] for all variants.
  SELECT pg_get_functiondef(p.oid) INTO source_sql
  FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='igr_private' AND p.proname='igr_v220_003_build_pack';
  expected := '''expert_actions'',''[]''::jsonb';
  IF position(expected in source_sql)=0 AND position('''expert_actions'',coalesce(base->''expert_actions'',''[]''::jsonb)' in source_sql)=0 THEN RAISE EXCEPTION 'Unexpected 003 expert action builder'; END IF;
  source_sql := replace(source_sql,expected,'''expert_actions'',coalesce(base->''expert_actions'',''[]''::jsonb)');
  EXECUTE source_sql;
END;
$optional_roles$;

-- Mechanically useful but non-spoiler expertise: interpret evidence, never
-- assert which suspect is responsible or expose the private A/B/C solution.
UPDATE public.igr_v4_scenario_packs SET
  pack=jsonb_set(
    jsonb_set(pack,'{role_notes,expert}',
      coalesce(pack#>'{role_notes,expert}','{}'::jsonb)||
      jsonb_build_object(
        'objective_main','Aide la Grey Room à vérifier la portée technique des documents sans attribuer la culpabilité à partir d’une seule pièce.',
        'anchors','Tu distingues les alertes émises des alertes reçues, les autorisations d’accès des mouvements réels et les documents de validation des actes constatés. Une expertise active par cycle et une contre-expertise par partie.',
        'position','Reconstitue les liens vérifiables entre laboratoire, transfert et alerte. N’invente ni agent biologique, ni chaîne causale, ni coupable.'
      ),true),
    '{expert_actions}',
    jsonb_build_array(
      jsonb_build_object('id','e1','title','Fiabilité des alertes','result','Un signal d’alerte doit être distingué de sa réception attestée et de sa lecture effective. Les horodatages et destinataires doivent être rapprochés avant d’attribuer une omission.','counter_result','La contre-expertise confirme la nécessité de recouper les horodatages : une alerte émise ne prouve pas qu’un destinataire en a eu connaissance.'),
      jsonb_build_object('id','e2','title','Chaîne documentaire du transfert','result','Une habilitation d’accès, un transfert documenté et une utilisation réelle ne constituent pas la même preuve. Leur continuité doit être établie indépendamment.','counter_result','La contre-expertise interdit de transformer une simple possibilité d’accès en démonstration d’une participation.'),
      jsonb_build_object('id','e3','title','Portée d’une validation','result','Une procédure signée atteste une validation formelle, non son application complète ni une connaissance certaine du risque.','counter_result','La contre-expertise distingue la responsabilité de validation de la réalisation matérielle des actes.'),
      jsonb_build_object('id','e4','title','Hypothèses concurrentes','result','L’explication d’une défaillance doit être comparée aux traces d’action, aux lacunes du dossier et aux explications alternatives, sans combler les blancs.','counter_result','La contre-expertise conserve les hypothèses non départagées : un résultat technique ne suffit pas à désigner un auteur.')
    ),true),
  updated_at=now()
WHERE scenario_id='003';

UPDATE public.igr_v4_scenario_packs SET
  pack=jsonb_set(
    jsonb_set(pack,'{role_notes,expert}',
      coalesce(pack#>'{role_notes,expert}','{}'::jsonb)||
      jsonb_build_object(
        'objective_main','Évalue la chronologie du retrait de consentement et la portée des données neuropsychologiques, sans déduire la responsabilité de l’amnésie.',
        'anchors','Le retrait du consentement, les décisions institutionnelles et la mémoire après l’incident constituent des questions différentes. Une expertise active par cycle et une contre-expertise par partie.',
        'position','Explique ce qu’un examen ou un document peut montrer, et ce qu’il ne permet pas d’affirmer sur les événements antérieurs.'
      ),true),
    '{expert_actions}',
    jsonb_build_array(
      jsonb_build_object('id','e1','title','Consentement et chronologie','result','La date d’un refus exprimé et la chronologie des actes ultérieurs doivent être documentées séparément. Un consentement antérieur ne remplace pas le refus plus récent.','counter_result','La contre-expertise confirme que l’analyse porte sur des décisions documentées, non sur une intention déduite de l’état du patient.'),
      jsonb_build_object('id','e2','title','Portée de l’amnésie','result','Une amnésie authentique peut réduire l’accès conscient aux souvenirs sans permettre de reconstituer par elle-même qui a pris une décision antérieure.','counter_result','L’absence de souvenir n’est ni une preuve d’innocence, ni une preuve de mensonge. La conclusion doit s’appuyer sur d’autres traces.'),
      jsonb_build_object('id','e3','title','Traçabilité du protocole','result','Une signature, un ordre de poursuite et une action réellement effectuée doivent être distingués et replacés dans le temps.','counter_result','La contre-expertise recommande de vérifier les destinataires, délais et actes effectifs avant de conclure à une responsabilité.'),
      jsonb_build_object('id','e4','title','Limites de l’inférence clinique','result','Les symptômes cliniques ne permettent pas à eux seuls d’attribuer un acte ni de prouver une connaissance préalable des risques.','counter_result','La contre-expertise distingue constat clinique, interprétation et preuve factuelle.')
    ),true),
  updated_at=now()
WHERE scenario_id='009';

-- 008 Judge has concrete protected procedural exhibits without confidential
-- variant outcomes. The judge arbitrates access, not guilt.
UPDATE public.igr_v4_scenario_packs SET
  pack=jsonb_set(
    jsonb_set(pack,'{role_notes,juge}',
      coalesce(pack#>'{role_notes,juge}','{}'::jsonb)||
      jsonb_build_object(
        'objective_main','Arbitre l’accès aux pièces de procédure, protège les informations sensibles et distingue le mensonge de la responsabilité matérielle.',
        'anchors','Les déclarations sous serment ont des horaires incompatibles. Tu peux examiner les demandes d’accès aux éléments protégés et statuer sans supposer que le témoin le plus contradictoire est coupable.',
        'position','Motive les décisions de procédure à partir des pièces réellement accessibles. Un faux témoignage ne démontre pas à lui seul la participation au fait principal.'
      ),true),
    '{protected}',
    jsonb_build_array(
      jsonb_build_object('id','p1','cost',1,'title','Enregistrement des dépositions','text','La date d’enregistrement d’une déposition ne prouve pas l’heure de l’événement qu’elle raconte. Les deux chronologies doivent être comparées.'),
      jsonb_build_object('id','p2','cost',1,'title','Annotations confidentielles','text','Une correction apportée à une déclaration doit être analysée dans son contexte. Corriger un détail ne démontre pas que le fait principal a été inventé.'),
      jsonb_build_object('id','p3','cost',2,'title','Élément d’identité protégé','text','La protection d’une source n’atteste ni la fiabilité du témoignage ni la culpabilité de la personne mise en cause.')
    ),true),
  updated_at=now()
WHERE scenario_id='008';

UPDATE public.igr_v4_scenario_packs SET
  pack=jsonb_set(pack,'{role_notes,procureur}',
    coalesce(pack#>'{role_notes,procureur}','{}'::jsonb)||
    jsonb_build_object(
      'objective_main','Obtiens des coopérations vérifiables et reconstitue la chaîne de commandement sans confondre ordre, exécution et dissimulation.',
      'anchors','Les trois officiers peuvent avoir agi à des niveaux différents. Négocie des informations sur les ordres transmis, les changements de mission et la connaissance des conséquences ; aucune coopération ne gomme automatiquement une responsabilité.',
      'position','Ne promets aucune immunité factuelle. Une déclaration vaut par ses recoupements avec les ordres, les journaux et les décisions documentées.'
    ),true),
  updated_at=now()
WHERE scenario_id='011';

DO $check_roles$
DECLARE s text; cnt int; expected_role text; i int;
BEGIN
 FOR s,expected_role IN SELECT * FROM (VALUES
   ('003','expert'),('008','juge'),('009','expert'),('011','procureur')
 ) v(id,role) LOOP
   IF public.igr_v4_max_players(s)<>6 OR public.igr_v4_min_players(s) NOT IN (4,5)
      THEN RAISE EXCEPTION 'Optional capacity regression in %',s; END IF;
   IF public.igr_v4_role_for_seat(s,5,6)<>expected_role
      THEN RAISE EXCEPTION 'Optional role mismatch in %',s; END IF;
   FOR i IN 0..4 LOOP
      IF public.igr_v4_role_for_seat(s,i,6)<>public.igr_v4_role_for_seat(s,i,5)
      THEN RAISE EXCEPTION 'Five-player roster changed in %',s; END IF;
   END LOOP;
   IF (SELECT jsonb_array_length(pack->'suspects') FROM public.igr_v4_scenario_packs WHERE scenario_id=s)<>3
      THEN RAISE EXCEPTION 'Suspect pack changed in %',s; END IF;
 END LOOP;
 IF public.igr_v4_min_players('003')<>4 OR public.igr_v4_role_for_seat('003',1,4)<>'suspect'
    THEN RAISE EXCEPTION '003 four-player mode regressed'; END IF;
END;
$check_roles$;
