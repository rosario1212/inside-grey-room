-- Le Régime v16: witness and journalist dossiers and bounded actions.

-- Civil roles receive contextual knowledge without sealed variant answers.
CREATE OR REPLACE FUNCTION igr_private.igr_regime_v16_civic_card(p_scenario text,p_role text)
RETURNS jsonb LANGUAGE sql STABLE SET search_path TO ''
AS $body$
 SELECT CASE
 WHEN p_role='temoin' THEN jsonb_build_object(
  'identity',CASE p_scenario WHEN '032' THEN 'Ancien agent des registres de Vahran'
    WHEN '033' THEN 'Ancien secrétaire du Conseil de défense'
    ELSE 'Ancien agent de liaison de la présidence' END,
  'what_you_know',CASE p_scenario
    WHEN '032' THEN 'Tu connais les procédures de classement et de transfert des détenus. Un registre incomplet ne révèle pas à lui seul qui a donné un ordre.'
    WHEN '033' THEN 'Tu connais la circulation des communiqués militaires. Le signataire et le donneur d ordre ne sont pas toujours la même personne.'
    ELSE 'Tu connais les noms de code des messages officiels. Une appellation ne suffit pas à identifier avec certitude son porteur.' END,
  'what_you_hide','Tu n as pas assisté à chaque décision. Ne présente aucune déduction comme un fait directement observé.',
  'objective','Une fois par cycle, rattache ton témoignage à une pièce déjà publique. Au tribunal, témoigne sans modifier la vérité scellée ou participer au vote.'
 )
 WHEN p_role='journaliste' AND p_scenario='034' THEN jsonb_build_object(
  'identity','Correspondant indépendant à Karsane',
  'what_you_know','Tu suis la chute du pouvoir et les réactions publiques. Un document publié permet une question, pas une accusation démontrée.',
  'what_you_hide','Tu dois distinguer les faits établis des hypothèses et ne pas transformer une rumeur en preuve.',
  'objective','Une fois par cycle, publie un bulletin commentant une pièce publique. Questionne ensuite au tribunal sans influer sur le vote.'
 )
 ELSE NULL::jsonb END
$body$;

CREATE OR REPLACE FUNCTION public.igr_v4_build_private_card(p_room text, p_player_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare p public.igr_v4_players%rowtype; r public.igr_v4_rooms%rowtype; pack jsonb; base jsonb; rel jsonb; rels jsonb:='[]'::jsonb; q public.igr_v4_players%rowtype; widx int; role_note jsonb;
begin select * into p from public.igr_v4_players where id=p_player_id; select * into r from public.igr_v4_rooms where code=p.room_code; select x.pack into pack from public.igr_v4_scenario_packs x where x.scenario_id=r.scenario_id; IF r.scenario_id IN ('032','033','034') AND EXISTS(
 SELECT 1 FROM igr_private.igr_regime_v13_rooms rr WHERE rr.room_code=r.code) THEN
 SELECT private_pack INTO pack FROM igr_private.igr_regime_v13_rooms WHERE room_code=r.code;
 IF p.public_role='suspect' AND p.internal_slot BETWEEN 1 AND 3 THEN
   base:=pack->'private_cards'->(p.internal_slot-1);
   RETURN base||jsonb_build_object(
    'title',base->>'identity','context',pack->>'public_briefing',
    'goal',base->>'objective','secret',base->>'what_you_hide',
    'briefing',base->>'what_you_know');
 END IF;
 IF p.public_role IN ('temoin','journaliste') THEN
  base:=igr_private.igr_regime_v16_civic_card(r.scenario_id,p.public_role);
  IF base IS NULL THEN RAISE EXCEPTION 'unexpected Regime civic role';END IF;
  RETURN base||jsonb_build_object('title',base->>'identity',
     'context',pack->>'public_briefing','goal',base->>'objective',
     'briefing',base->>'what_you_know','secret',base->>'what_you_hide');
 END IF;
 RETURN public.igr_v4_generic_role_card(p.public_role,pack->>'public_briefing')||
   jsonb_build_object('context',pack->>'public_briefing');
END IF;
 /* IGR_V181_001_SNAPSHOT_igr_v4_build_private_card */ if r.scenario_id='001' then pack:=coalesce(igr_private.igr_v181_001_pinned_game_pack(r.code),pack); end if; /* IGR_V202_002_PINNED_READ */ if r.scenario_id='002' then pack:=coalesce(igr_private.igr_v201_002_pinned_game_pack(r.code),pack); end if; /* IGR_003_V221_READER */ if r.scenario_id='003' then pack:=coalesce(igr_private.igr_v220_003_pinned_pack(r.code),pack);end if; if r.scenario_id='004' then pack:=coalesce(igr_private.igr_v230_004_pinned_pack(r.code),pack);end if; if r.scenario_id='005' then pack:=coalesce(igr_private.igr_v250_005_pinned_pack(r.code),pack);end if; if r.scenario_id='006' then pack:=coalesce(igr_private.igr_v260_006_pinned_pack(r.code),pack);end if; if r.scenario_id='007' then pack:=coalesce(igr_private.igr_v281_007_pinned_pack(r.code),pack);end if; if r.scenario_id='008' then pack:=igr_private.igr_v301_008_pinned_pack(r.code);if pack is null then raise exception '008 private snapshot missing';end if;end if; if r.scenario_id='009' then pack:=igr_private.igr_v331_009_pinned_pack(r.code);if pack is null then raise exception '009 private snapshot missing';end if;end if; if r.scenario_id='010' then pack:=igr_private.igr_v351_010_pinned_pack(r.code);if pack is null then raise exception '010 private snapshot missing';end if;end if; if r.scenario_id='011' then pack:=igr_private.igr_v371_011_pinned_pack(r.code);if pack is null then raise exception '011 private snapshot missing';end if;end if; if r.scenario_id='012' then pack:=igr_private.igr_v391_012_pinned_pack(r.code);if pack is null then raise exception '012 private snapshot missing';end if;end if; if r.scenario_id='013' then pack:=igr_private.igr_v411_013_pinned_pack(r.code);if pack is null then raise exception '013 private snapshot missing';end if;end if; if r.scenario_id='014' then pack:=igr_private.igr_v431_014_pinned_pack(r.code);if pack is null then raise exception '014 private snapshot missing';end if;end if; if r.scenario_id='015' then pack:=igr_private.igr_v451_015_pinned_pack(r.code);if pack is null then raise exception '015 private snapshot missing';end if;end if; if r.scenario_id='016' then pack:=igr_private.igr_v481_016_pinned_pack(r.code);if pack is null then raise exception '016 private snapshot missing';end if;end if; if r.scenario_id='017' then pack:=igr_private.igr_v521_017_pinned_pack(r.code);if pack is null then raise exception '017 private snapshot missing';end if;end if; if r.scenario_id='018' then pack:=igr_private.igr_v541_018_pinned_pack(r.code);if pack is null then raise exception '018 private snapshot missing';end if;end if; if r.scenario_id='019' then pack:=igr_private.igr_v571_019_pinned_pack(r.code);if pack is null then raise exception '019 private snapshot missing';end if;end if; if r.scenario_id='020' then pack:=igr_private.igr_v601_020_pinned_pack(r.code);if pack is null then raise exception '020 private snapshot missing';end if;end if; if r.scenario_id in ('026','027','028') then pack:=coalesce(igr_private.igr_v695_pinned_pack(r.code),pack);end if; if p.public_role='suspect' then base:=coalesce(pack->'suspects'->greatest(0,p.internal_slot-1),'{}'::jsonb); for rel in select value from jsonb_array_elements(coalesce(pack->'relations'->p.internal_slot::text,'[]'::jsonb)) loop select * into q from public.igr_v4_players where room_code=r.code and public_role='suspect' and internal_slot=(rel->>'slot')::int; if found then rels:=rels||jsonb_build_array(jsonb_build_object('pseudo',q.pseudo,'text',rel->>'text')); end if; end loop; base:=jsonb_set(base,'{relations}',rels,true); else base:=public.igr_v4_generic_role_card(p.public_role,pack->>'context'); role_note:=coalesce(pack->'role_notes'->p.public_role,'{}'::jsonb); base:=base||role_note; if p.public_role='temoin' then select count(*) into widx from public.igr_v4_players w where w.room_code=r.code and w.public_role='temoin' and w.seat_index<=p.seat_index; base:=base||coalesce(pack->'witnesses'->greatest(0,widx-1),'{}'::jsonb); end if; end if; if p.secret_role='espion' then base:=base||jsonb_build_object('secret_mission',coalesce(pack->>'espion_mission','Observe et détourne sans inventer de preuve.')); end if; return base; end $function$


CREATE OR REPLACE FUNCTION public.igr_regime_v13_state(p_code text, p_player_token uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  p public.igr_v4_players%rowtype;
  r public.igr_v4_rooms%rowtype;
  m igr_private.igr_regime_v13_rooms%rowtype;
  actor text; card jsonb; own_mission jsonb; offered jsonb; court_acts jsonb;cast_list jsonb; used_cycle boolean;used_move boolean; court_view jsonb; court_elapsed integer; stage_end integer; current_stage text; long_court boolean; court_slot integer;court_speaker text;scene jsonb; defense_objective jsonb; defense_used boolean; trace_id text; trace_label text; public_trace_ready boolean;
  public_clues jsonb='[]'::jsonb; clue jsonb; saved jsonb;
  a jsonb='[]'::jsonb; item jsonb; chosen text;
BEGIN
  SELECT * INTO p FROM public.igr_v4_players
     WHERE room_code=upper(trim(p_code)) AND player_token=p_player_token;
  IF NOT FOUND THEN RAISE EXCEPTION 'unauthorized'; END IF;
  SELECT * INTO r FROM public.igr_v4_rooms WHERE code=p.room_code;
  SELECT * INTO m FROM igr_private.igr_regime_v13_rooms WHERE room_code=p.room_code;
  IF NOT FOUND OR r.status NOT IN ('playing','finished') THEN
    RETURN jsonb_build_object('enabled',false);
  END IF;
  actor:=CASE WHEN p.public_role='suspect'
    THEN m.private_pack->'private_cards'->(p.internal_slot-1)->>'actor_id'
    ELSE NULL END;
  IF p.public_role='suspect' AND actor IS NULL THEN RAISE EXCEPTION 'invalid role mapping'; END IF;
  IF p.public_role='suspect' THEN
    card:=m.private_pack->'private_cards'->(p.internal_slot-1);
    IF p.internal_slot=3 THEN own_mission:=m.private_pack->'third_suspect_mission'; END IF;
  ELSIF p.public_role IN ('temoin','journaliste') THEN
    card:=igr_private.igr_regime_v16_civic_card(r.scenario_id,p.public_role);
  END IF;
  -- Only already released pieces + always-public exhibits of previous cycles.
  FOR clue IN SELECT value FROM jsonb_array_elements(m.private_pack->'revelations') LOOP
    IF (clue->>'kind'='guaranteed' AND (clue->>'min_cycle')::int<=r.cycle)
       OR (m.play_state->'disclosed' ? (clue->>'id'))
    THEN public_clues:=public_clues||jsonb_build_array(
      clue - 'trigger_action' - 'editorial_provenance'); END IF;
  END LOOP;
  public_trace_ready:=NOT (
    r.phase='role_reading' AND r.cycle=1 AND
    (NOT (m.play_state->'alliance' ?
      (m.private_pack->'private_cards'->0->>'actor_id'))
     OR NOT (m.play_state->'alliance' ?
      (m.private_pack->'private_cards'->1->>'actor_id'))));
  FOR clue IN SELECT value FROM jsonb_array_elements(
      m.private_pack->'capture_evidence') LOOP
    IF public_trace_ready AND
      ((clue->>'revealed_at'='cycle_start' AND (clue->>'cycle')::int<=r.cycle)
      OR (coalesce(m.play_state->'disclosed','[]'::jsonb) ? (clue->>'id'))
      OR EXISTS(SELECT 1 FROM jsonb_array_elements(
        coalesce(m.play_state->'scheduled_disclosures','[]'::jsonb)) sd
        WHERE sd->>'id'=clue->>'id' AND (sd->>'cycle')::integer<=r.cycle))
    THEN
      trace_id:=coalesce(m.play_state->'capture_clue_tracks'->>(clue->>'id'),
        (SELECT sd->>'track_id' FROM jsonb_array_elements(
          coalesce(m.play_state->'scheduled_disclosures','[]'::jsonb)) sd
          WHERE sd->>'id'=clue->>'id' LIMIT 1),
        CASE WHEN (clue->>'cycle')::integer=1
          THEN igr_private.igr_regime_v14_base_track(m.room_code,clue->>'targetId')
          ELSE igr_private.igr_regime_v14_active_track(m.room_code,clue->>'targetId')
        END);
      SELECT net->>'label' INTO trace_label FROM jsonb_array_elements(
        m.private_pack->'first_cycle'->'public_networks') net
        WHERE net->>'id'=trace_id LIMIT 1;
      public_clues:=public_clues||jsonb_build_array(
       jsonb_build_object('id',clue->>'id','kind','capture',
         'title','PISTE DE TRAQUE','text',clue->>'description',
         'cycle',clue->>'cycle','source',clue->>'origin',
         'target_id',clue->>'targetId','network_id',trace_id,
         'network_label',trace_label));
    END IF;
  END LOOP;
  FOR clue IN SELECT value FROM jsonb_array_elements(
      coalesce(m.play_state->'extra_capture_leads','[]'::jsonb)) LOOP
    IF (clue->>'cycle')::integer<=r.cycle THEN
      public_clues:=public_clues||jsonb_build_array(clue);
    END IF;
  END LOOP;
  IF p.public_role IN ('enqueteur','analyste') AND r.cycle BETWEEN 1 AND 3 THEN
    offered:=m.private_pack->'investigation_choices'->(r.cycle-1)->'choices';
  ELSE offered:='[]'::jsonb; END IF;
  IF p.public_role='suspect' AND p.internal_slot IN (1,2) AND
    NOT (m.play_state->'arrests' ? actor) THEN
    SELECT coalesce(jsonb_agg(value),'[]'::jsonb) INTO a
    FROM jsonb_array_elements(m.private_pack->'fugitive_actions') value
    WHERE value->>'actorId'=actor AND (value->>'cycle')::int=r.cycle;
  END IF;
  chosen:=m.play_state->'alliance'->>actor;
  SELECT coalesce(jsonb_agg(jsonb_build_object('actor_id',
    m.private_pack->'private_cards'->(pl.internal_slot-1)->>'actor_id',
    'pseudo',pl.pseudo,'player_id',pl.id::text) ORDER BY pl.internal_slot),'[]'::jsonb)
  INTO cast_list FROM public.igr_v4_players pl WHERE pl.room_code=r.code
    AND pl.public_role='suspect' AND pl.internal_slot BETWEEN 1 AND 3;
  SELECT coalesce(jsonb_agg(jsonb_build_object('id',a.value->>'id',
    'title',a.value->>'title') ORDER BY a.ordinality),'[]'::jsonb)
  INTO court_acts FROM jsonb_array_elements(m.private_pack->'acts') WITH ORDINALITY a(value,ordinality);
  used_cycle:=EXISTS(SELECT 1 FROM jsonb_array_elements(coalesce(m.play_state->'investigations','[]'::jsonb)) x
    WHERE (x->>'cycle')::int=r.cycle);
  used_move:=EXISTS(SELECT 1 FROM jsonb_array_elements(coalesce(m.play_state->'decisions','[]'::jsonb)) x
    WHERE x->>'actor_id'=actor AND (x->>'cycle')::int=r.cycle);
  IF coalesce(m.play_state->'disclosed','[]'::jsonb) ?
    (m.private_pack->'third_suspect_mission'->'public_on_submission'->>'id') THEN
    clue:=m.private_pack->'third_suspect_mission'->'public_on_submission';
    IF clue IS NOT NULL THEN public_clues:=public_clues||jsonb_build_array(clue - 'authenticated_by_server' - 'initially_private');END IF;
  END IF;
  court_view:=coalesce(m.play_state->'court','{}'::jsonb);
  IF r.phase='regime_court' AND court_view->>'started_at' IS NOT NULL THEN
    court_elapsed:=greatest(0,floor(extract(epoch FROM
       now()-(court_view->>'started_at')::timestamptz))::integer);
    long_court:=coalesce((court_view->>'duration_minutes')::int,8)=14;
    IF court_elapsed<60 THEN current_stage:='opening';stage_end:=60;
    ELSIF court_elapsed<(CASE WHEN long_court THEN 420 ELSE 240 END)
      THEN current_stage:='defenses';stage_end:=CASE WHEN long_court THEN 420 ELSE 240 END;
    ELSIF court_elapsed<(CASE WHEN long_court THEN 720 ELSE 360 END)
      THEN current_stage:='confrontation';stage_end:=CASE WHEN long_court THEN 720 ELSE 360 END;
    ELSIF court_elapsed<(CASE WHEN long_court THEN 780 ELSE 420 END)
      THEN current_stage:='closing';stage_end:=CASE WHEN long_court THEN 780 ELSE 420 END;
    ELSE current_stage:='vote';stage_end:=CASE WHEN long_court THEN 840 ELSE 480 END;
    END IF;
    court_slot:=NULL;court_speaker:=NULL;
    IF current_stage='defenses' THEN
      court_slot:=least(2,(court_elapsed-60)/
        (CASE WHEN long_court THEN 120 ELSE 60 END));
      court_speaker:=m.private_pack->'private_cards'->court_slot->>'actor_id';
      IF court_slot IN (0,1) AND
        NOT coalesce(m.play_state->'arrests','{}'::jsonb) ? court_speaker
      THEN court_speaker:=NULL;END IF;
    END IF;
    court_view:=court_view||jsonb_build_object('stage_actual',current_stage,
       'stage_seconds_remaining',greatest(0,stage_end-court_elapsed),
       'slot_actor_id',court_speaker,'slot_number',court_slot);
  END IF;
  SELECT x.value INTO scene FROM jsonb_array_elements(
    coalesce(m.private_pack->'scene_beats','[]'::jsonb)) x
    WHERE (x.value->>'cycle')::integer=r.cycle LIMIT 1;
  IF p.public_role='suspect' AND p.internal_slot IN (1,2) AND
    m.play_state->'arrests' ? actor THEN
    defense_objective:=(m.private_pack->'captured_defense_objectives'->actor)
       - 'expected_ordered_by';
  END IF;
  defense_used:=EXISTS(SELECT 1 FROM jsonb_array_elements(
    coalesce(m.play_state->'captured_responses','[]'::jsonb)) x
    WHERE x->>'actor_id'=actor AND (x->>'cycle')::integer=r.cycle);
  RETURN igr_private.igr_regime_v14_sanitize_json(p.room_code,
   jsonb_build_object('enabled',true,
      'scenario_id',m.scenario_id,'cycle',r.cycle,'phase',r.phase,
      'role',p.public_role,'actor_id',actor,'my_card',card,'my_mission',own_mission,
      'civic_attendees',(
       SELECT coalesce(jsonb_agg(jsonb_build_object('role',q.public_role,'pseudo',q.pseudo)
          ORDER BY q.seat_index),'[]'::jsonb)
       FROM public.igr_v4_players q WHERE q.room_code=r.code
         AND q.public_role IN ('temoin','journaliste')),
      'my_civic_used_this_cycle',EXISTS(
       SELECT 1 FROM jsonb_array_elements(coalesce(m.play_state->'civic_statements','[]'::jsonb)) x
       WHERE x->>'player_id'=p.id::text AND (x->>'cycle')::int=r.cycle),
      'scene',scene,'my_captured_objective',defense_objective,
      'my_captured_response_used',defense_used,
      'my_alliance_choice',chosen,'offered_investigations',offered,
      'investigation_used_this_cycle',used_cycle,'my_fugitive_decision_used',used_move,
      'third_submitted',coalesce((m.play_state->'third'->>'submitted')::boolean,false),
      'cast',cast_list,'court_acts',court_acts,
      'public_networks',m.private_pack->'first_cycle'->'public_networks',
      'pending_mandates',CASE WHEN p.public_role IN ('juge','enqueteur','analyste')
         THEN (SELECT coalesce(jsonb_agg(x),'[]'::jsonb)
             FROM jsonb_array_elements(coalesce(m.play_state->'mandates','[]'::jsonb)) x
             WHERE x->>'status'='awaiting_judge') ELSE '[]'::jsonb END,
      'my_fugitive_options',a,
      'public_evidence',public_clues,
      'arrests',m.play_state->'arrests','court',court_view,
      'my_reconstruction_submitted',coalesce(
        m.play_state->'reconstructions' ? p.id::text,false),
      'my_third_final_submitted',coalesce(
        m.play_state->'third' ? 'final_declaration',false),
      'events',coalesce(
        (SELECT jsonb_agg(jsonb_build_object(
           'type','public_news','id','journal-c'||j.ord,
           'title','JOURNAL DE KARSANE','text',j.news,
           'cycle',j.ord) ORDER BY j.ord)
         FROM jsonb_array_elements_text(coalesce(
           m.private_pack->'journal'->'events','[]'::jsonb))
           WITH ORDINALITY j(news,ord)
         WHERE j.ord<=least(3,greatest(0,r.cycle))),'[]'::jsonb)||
         coalesce(m.play_state->'events','[]'::jsonb),
      'investigations_count',jsonb_array_length(coalesce(m.play_state->'investigations','[]'::jsonb))));
END $function$


CREATE OR REPLACE FUNCTION public.igr_regime_v13_court_exchange(p_code text, p_player_token uuid, p_request_id text, p_kind text, p_message text, p_reply_to text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
 r public.igr_v4_rooms%rowtype;
 p public.igr_v4_players%rowtype;
 m igr_private.igr_regime_v13_rooms%rowtype;
 prior igr_private.igr_regime_v13_ledger%rowtype;
 elapsed integer;confront_start integer;confront_end integer;
 actor text;chosen jsonb;exchanges jsonb;response jsonb;
 n integer;referred jsonb;record jsonb;published jsonb;
BEGIN
 SELECT * INTO p FROM public.igr_v4_players
 WHERE room_code=upper(trim(p_code)) AND player_token=p_player_token;
 IF NOT FOUND THEN RAISE EXCEPTION 'unauthorized';END IF;
 SELECT * INTO r FROM public.igr_v4_rooms WHERE code=p.room_code FOR UPDATE;
 SELECT * INTO m FROM igr_private.igr_regime_v13_rooms WHERE room_code=p.room_code FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'courtroom unavailable';END IF;
 IF length(coalesce(p_request_id,'')) NOT BETWEEN 8 AND 128 THEN
 RAISE EXCEPTION 'invalid request id';END IF;
 SELECT * INTO prior FROM igr_private.igr_regime_v13_ledger
 WHERE room_code=p.room_code AND request_id=p_request_id;
 IF FOUND THEN
  IF prior.actor_player<>p.id OR prior.action_kind<>'court_exchange'
   THEN RAISE EXCEPTION 'request collision';END IF;
  RETURN prior.response;
 END IF;
 IF r.status<>'playing' OR r.phase<>'regime_court' THEN RAISE EXCEPTION 'courtroom closed';END IF;
 elapsed:=floor(extract(epoch FROM
   now()-(m.play_state->'court'->>'started_at')::timestamptz))::integer;
 confront_start:=CASE WHEN
   (m.play_state->'court'->>'duration_minutes')::int=14 THEN 420 ELSE 240 END;
 confront_end:=CASE WHEN
   (m.play_state->'court'->>'duration_minutes')::int=14 THEN 720 ELSE 360 END;
 IF elapsed<confront_start OR elapsed>=confront_end THEN
   RAISE EXCEPTION 'confrontation window is not active';END IF;
 IF p_kind NOT IN ('question','objection','reply','ruling','testimony','press_question') THEN
   RAISE EXCEPTION 'unsupported court intervention';END IF;
 actor:=CASE WHEN p.public_role='suspect'
 THEN m.private_pack->'private_cards'->(p.internal_slot-1)->>'actor_id'
 ELSE NULL END;
 IF p.public_role='suspect' AND p.internal_slot IN (1,2)
   AND NOT m.play_state->'arrests' ? actor
 THEN RAISE EXCEPTION 'fugitive not present at court';END IF;
 IF p_kind='ruling' THEN
  IF p.public_role<>'juge' OR p_message NOT IN ('sustained','overruled')
   OR coalesce(length(p_reply_to),0)<8 THEN
    RAISE EXCEPTION 'invalid judicial ruling';END IF;
 ELSIF p_kind='question' THEN
  IF p.public_role NOT IN ('enqueteur','analyste','procureur')
   THEN RAISE EXCEPTION 'question reserved for accusation';END IF;
 ELSIF p_kind='reply' THEN
  IF p.public_role<>'suspect' THEN RAISE EXCEPTION 'reply reserved for suspects';END IF;
 ELSIF p_kind='testimony' THEN
  IF p.public_role<>'temoin' THEN RAISE EXCEPTION 'testimony reserved for witness';END IF;
 ELSIF p_kind='press_question' THEN
  IF p.public_role<>'journaliste' THEN RAISE EXCEPTION 'press reserved for journalist';END IF;
 ELSE
  IF p.public_role NOT IN ('enqueteur','analyste','procureur','suspect')
   THEN RAISE EXCEPTION 'objection unavailable';END IF;
 END IF;
 IF p_kind<>'ruling' AND (length(btrim(coalesce(p_message,'')))<6
  OR length(p_message)>280) THEN RAISE EXCEPTION 'text must be 6 to 280 characters';END IF;
 exchanges:=coalesce(m.play_state->'court'->'exchanges','[]'::jsonb);
 SELECT count(*) INTO n FROM jsonb_array_elements(exchanges) e
 WHERE e->>'player_id'=p.id::text AND e->>'kind'<>'ruling';
 IF n>=CASE WHEN p.public_role IN ('temoin','journaliste') THEN 2 ELSE 5 END
   AND p_kind<>'ruling' THEN RAISE EXCEPTION 'confrontation intervention quota exhausted';END IF;
 IF p_kind='ruling' THEN
  SELECT value INTO referred FROM jsonb_array_elements(exchanges) value
  WHERE value->>'id'=p_reply_to AND value->>'kind'='objection';
  IF NOT FOUND THEN RAISE EXCEPTION 'objection not found';END IF;
  IF EXISTS(SELECT 1 FROM jsonb_array_elements(exchanges) e
   WHERE e->>'kind'='ruling' AND e->>'reply_to'=p_reply_to)
  THEN RAISE EXCEPTION 'objection already resolved';END IF;
 END IF;
 record:=jsonb_build_object('id',p_request_id,'kind',p_kind,
 'text',CASE WHEN p_kind='ruling' THEN
  CASE WHEN p_message='sustained' THEN 'Objection accueillie' ELSE 'Objection rejetée' END
  ELSE btrim(p_message) END,
 'player_id',p.id::text,'pseudo',p.pseudo,
 'role',p.public_role,'actor_id',actor,'reply_to',p_reply_to,
 'at',now());
 exchanges:=exchanges||jsonb_build_array(record);
 UPDATE igr_private.igr_regime_v13_rooms
 SET play_state=jsonb_set(m.play_state,ARRAY['court','exchanges'],exchanges,true)
 WHERE room_code=m.room_code;
 response:=jsonb_build_object('ok',true,'accepted',true,'id',p_request_id,'type',p_kind);
 INSERT INTO igr_private.igr_regime_v13_ledger
 (room_code,request_id,actor_player,action_kind,cycle,response)
 VALUES(m.room_code,p_request_id,p.id,'court_exchange',r.cycle,response);
 RETURN response;
END $function$


-- Each optional civic participant can frame one already-published document per cycle.
-- Authored opinion is labelled as such, never scored as a new proof.
CREATE OR REPLACE FUNCTION public.igr_regime_v16_civic_statement(
 p_code text,p_player_token uuid,p_request_id text,
 p_kind text,p_evidence_id text,p_text text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $body$
DECLARE
 r public.igr_v4_rooms%rowtype;
 p public.igr_v4_players%rowtype;
 m igr_private.igr_regime_v13_rooms%rowtype;
 old igr_private.igr_regime_v13_ledger%rowtype;
 visible jsonb;chosen jsonb;new_state jsonb;entry jsonb;published jsonb;result jsonb;
BEGIN
 SELECT * INTO p FROM public.igr_v4_players
 WHERE room_code=upper(trim(p_code)) AND player_token=p_player_token;
 IF NOT FOUND THEN RAISE EXCEPTION 'unauthorized';END IF;
 SELECT * INTO r FROM public.igr_v4_rooms WHERE code=p.room_code FOR UPDATE;
 SELECT * INTO m FROM igr_private.igr_regime_v13_rooms WHERE room_code=p.room_code FOR UPDATE;
 IF NOT FOUND OR NOT coalesce((r.state->>'regime_v13_active')::boolean,false)
 THEN RAISE EXCEPTION 'Regime unavailable';END IF;
 IF length(coalesce(p_request_id,'')) NOT BETWEEN 8 AND 128 THEN
   RAISE EXCEPTION 'invalid request id';END IF;
 SELECT * INTO old FROM igr_private.igr_regime_v13_ledger
 WHERE room_code=p.room_code AND request_id=p_request_id;
 IF FOUND THEN
   IF old.actor_player<>p.id OR old.action_kind<>'v16_civic_statement'
   THEN RAISE EXCEPTION 'request conflict';END IF;
   RETURN old.response;
 END IF;
 IF NOT ((p.public_role='temoin' AND p_kind='testimony')
 OR (p.public_role='journaliste' AND p_kind='press'))
 THEN RAISE EXCEPTION 'wrong civic role'; END IF;
 IF r.status<>'playing' OR r.cycle NOT BETWEEN 1 AND 3
 OR r.phase IN ('regime_court','closed','final_audience','final_suspect_defenses','locking','reveal')
 THEN RAISE EXCEPTION 'civic statement window closed';END IF;
 IF length(btrim(coalesce(p_text,''))) NOT BETWEEN 20 AND 280
 THEN RAISE EXCEPTION 'statement must be between 20 and 280 characters';END IF;
 IF EXISTS(
  SELECT 1 FROM jsonb_array_elements(coalesce(m.play_state->'civic_statements','[]'::jsonb)) x
  WHERE x->>'player_id'=p.id::text AND (x->>'cycle')::int=r.cycle
 ) THEN RAISE EXCEPTION 'one civic statement per cycle'; END IF;
 visible:=public.igr_regime_v13_state(p.room_code,p_player_token)->'public_evidence';
 SELECT value INTO chosen
 FROM jsonb_array_elements(coalesce(visible,'[]'::jsonb)) value
 WHERE value->>'id'=p_evidence_id
   AND value->>'kind' IS DISTINCT FROM 'capture'
 LIMIT 1;
 IF NOT FOUND THEN RAISE EXCEPTION 'published non-capture document required';END IF;
 entry:=jsonb_build_object('player_id',p.id::text,'cycle',r.cycle,
    'kind',p_kind,'source_id',p_evidence_id,'text',btrim(p_text));
 published:=jsonb_build_object('id','civic:'||p_request_id,
    'type',CASE WHEN p_kind='press' THEN 'public_bulletin' ELSE 'public_testimony' END,
    'cycle',r.cycle,
    'title',CASE WHEN p_kind='press' THEN 'JOURNAL DE KARSANE · NOTE DE PRESSE'
                            ELSE 'TÉMOIGNAGE · AUDITION PUBLIQUE' END,
    'text',p.pseudo||' — Pièce publique : '||coalesce(chosen->>'title','Document')||
       '. '||btrim(p_text)||
       ' [Déclaration du joueur, pas une nouvelle preuve authentifiée]');
 new_state:=jsonb_set(m.play_state,'{civic_statements}',
     coalesce(m.play_state->'civic_statements','[]'::jsonb)||jsonb_build_array(entry),true);
 new_state:=jsonb_set(new_state,'{events}',
     coalesce(new_state->'events','[]'::jsonb)||jsonb_build_array(published),true);
 UPDATE igr_private.igr_regime_v13_rooms SET play_state=new_state WHERE room_code=m.room_code;
 result:=jsonb_build_object('ok',true,'published',true,'kind',p_kind,'cycle',r.cycle);
 INSERT INTO igr_private.igr_regime_v13_ledger
 (room_code,request_id,actor_player,action_kind,cycle,response)
 VALUES(m.room_code,p_request_id,p.id,'v16_civic_statement',r.cycle,result);
 RETURN result;
END $body$;
REVOKE EXECUTE ON FUNCTION public.igr_regime_v16_civic_statement(text,uuid,text,text,text,text)
 FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.igr_regime_v16_civic_statement(text,uuid,text,text,text,text)
 TO anon,authenticated;

