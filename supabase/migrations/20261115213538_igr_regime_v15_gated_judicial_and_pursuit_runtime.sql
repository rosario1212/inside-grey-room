-- supabase/candidates/igr_regime_v13_private_runtime.sql
-- INSIDE GREY ROOM — LE RÉGIME v13
-- Candidate only. Additive, isolated tables and RPCs. The actual release
-- flag defaults FALSE. Explicit owner release authorization is an alternative to human_review_approved; never claim a human playtest occurred. The existing 032–034 game flow is NOT replaced.
-- Do not deploy until final audience and transitions are integrated.

CREATE TABLE IF NOT EXISTS igr_private.igr_regime_v13_release (
  release_key text PRIMARY KEY CHECK (release_key='regime'),
  enabled boolean NOT NULL DEFAULT false,
  approved_by text,
  approved_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO igr_private.igr_regime_v13_release(release_key,enabled)
VALUES('regime',false) ON CONFLICT(release_key) DO NOTHING;
ALTER TABLE igr_private.igr_regime_v13_release ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON igr_private.igr_regime_v13_release FROM PUBLIC,anon,authenticated;

CREATE TABLE IF NOT EXISTS igr_private.igr_regime_v13_rooms (
  room_code text PRIMARY KEY REFERENCES public.igr_v4_rooms(code) ON DELETE CASCADE,
  scenario_id text NOT NULL CHECK(scenario_id IN ('032','033','034')),
  variant_id text NOT NULL CHECK(variant_id IN ('A','B','C')),
  alias_salt uuid NOT NULL DEFAULT gen_random_uuid(),
  private_pack jsonb NOT NULL,
  play_state jsonb NOT NULL DEFAULT '{}'::jsonb,
  pinned_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE igr_private.igr_regime_v13_rooms ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON igr_private.igr_regime_v13_rooms FROM PUBLIC,anon,authenticated;

CREATE TABLE IF NOT EXISTS igr_private.igr_regime_v13_ledger (
  room_code text NOT NULL REFERENCES igr_private.igr_regime_v13_rooms(room_code) ON DELETE CASCADE,
  request_id text NOT NULL,
  actor_player uuid NOT NULL,
  action_kind text NOT NULL,
  cycle integer NOT NULL,
  response jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(room_code,request_id)
);
ALTER TABLE igr_private.igr_regime_v13_ledger ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON igr_private.igr_regime_v13_ledger FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION igr_private.igr_regime_v13_release_eligible()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO ''
AS $$
 SELECT coalesce((SELECT enabled AND approved_by IS NOT NULL
   AND approved_at IS NOT NULL FROM igr_private.igr_regime_v13_release
   WHERE release_key='regime'),false)
 AND (SELECT count(*)=9 AND count(*) FILTER (
    WHERE editorial_status='ready'
      AND approved_by IS NOT NULL AND approved_at IS NOT NULL
      AND manuscript->'regime_vnext'->>'status'='ready'
      AND (manuscript->'regime_vnext'->>'human_review_approved'='true' OR manuscript->'regime_vnext'->>'author_release_authorized'='true'))=9
      FROM igr_private.igr_v99_variant_manuscripts
      WHERE scenario_id IN ('032','033','034'))
$$;
REVOKE EXECUTE ON FUNCTION igr_private.igr_regime_v13_release_eligible() FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION igr_private.igr_regime_v13_pin(p_code text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $$
DECLARE
  r public.igr_v4_rooms%rowtype;
  m igr_private.igr_v99_variant_manuscripts%rowtype;
BEGIN
  IF NOT igr_private.igr_regime_v13_release_eligible() THEN RETURN false; END IF;
  SELECT * INTO r FROM public.igr_v4_rooms WHERE code=upper(trim(p_code)) FOR UPDATE;
  IF NOT FOUND OR r.scenario_id NOT IN ('032','033','034') OR r.status<>'lobby' THEN RETURN false; END IF;
  IF EXISTS(SELECT 1 FROM igr_private.igr_regime_v13_rooms WHERE room_code=r.code) THEN RETURN true; END IF;
  SELECT * INTO m FROM igr_private.igr_v99_variant_manuscripts
    WHERE scenario_id=r.scenario_id AND variant_id IN ('A','B','C')
      AND editorial_status='ready'
      AND manuscript->'regime_vnext'->>'status'='ready'
      AND (manuscript->'regime_vnext'->>'human_review_approved'='true' OR manuscript->'regime_vnext'->>'author_release_authorized'='true')
    ORDER BY gen_random_uuid() LIMIT 1;
  IF NOT FOUND THEN RETURN false; END IF;
  INSERT INTO igr_private.igr_regime_v13_rooms(room_code,scenario_id,variant_id,private_pack,play_state)
  VALUES(r.code,r.scenario_id,m.variant_id,m.manuscript->'regime_vnext',
    jsonb_build_object('alliance','{}'::jsonb,'decisions','[]'::jsonb,
      'investigations','[]'::jsonb,'disclosed','[]'::jsonb,
      'strict_alias_only',true,
      'arrests','{}'::jsonb,'mandates','[]'::jsonb,'reconstructions','{}'::jsonb,
      'track_overrides','{}'::jsonb,'capture_clue_tracks','{}'::jsonb,
      'lead_delay','{}'::jsonb,'captured_responses','[]'::jsonb,
      'scheduled_disclosures','[]'::jsonb,'extra_capture_leads','[]'::jsonb,
      'third','{}'::jsonb,
      'court','{}'::jsonb));
  RETURN true;
END $$;
REVOKE EXECUTE ON FUNCTION igr_private.igr_regime_v13_pin(text) FROM PUBLIC,anon,authenticated;

-- Read only the player's private card and public facts that have actually been
-- released. The caller NEVER receives the candidate private_pack, canonical_truth,
-- non-public action outcomes, variant ID or other player's private choice.
CREATE OR REPLACE FUNCTION public.igr_regime_v13_state(p_code text,p_player_token uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $$
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
END $$;
REVOKE EXECUTE ON FUNCTION public.igr_regime_v13_state(text,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.igr_regime_v13_state(text,uuid) TO anon,authenticated;

-- First set of role-gated, replay-safe operations: alliance,
-- strategic choices, investigation and third-suspect submission.
-- Mandates and the courtroom require their own transactionally reviewed
-- functions before the release switch may be enabled.
CREATE OR REPLACE FUNCTION public.igr_regime_v13_action(
 p_code text,p_player_token uuid,p_kind text,p_request_id text,p_payload jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $$
DECLARE
  p public.igr_v4_players%rowtype;
  r public.igr_v4_rooms%rowtype;
  m igr_private.igr_regime_v13_rooms%rowtype;
  old jsonb; old_actor uuid; old_kind text; result jsonb;
  actor text; option_row jsonb; choice text; piece jsonb; future_lead jsonb; next_lead_cycle integer;
  claim text; statement_text text; captured_exhibit_id text;
  active_refuge text;fallback_refuge text;refuge_label text;clue_to_publish jsonb;
  new_state jsonb; disclosed jsonb;
BEGIN
  SELECT * INTO p FROM public.igr_v4_players
   WHERE room_code=upper(trim(p_code)) AND player_token=p_player_token;
  IF NOT FOUND THEN RAISE EXCEPTION 'unauthorized'; END IF;
  SELECT * INTO r FROM public.igr_v4_rooms WHERE code=p.room_code FOR UPDATE;
  SELECT * INTO m FROM igr_private.igr_regime_v13_rooms WHERE room_code=p.room_code FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'regime feature inactive'; END IF;
  IF length(coalesce(p_request_id,''))<8 OR length(p_request_id)>128 THEN RAISE EXCEPTION 'invalid request id'; END IF;
  SELECT response,actor_player,action_kind INTO old,old_actor,old_kind
   FROM igr_private.igr_regime_v13_ledger
   WHERE room_code=p.room_code AND request_id=p_request_id;
  IF FOUND THEN
   IF old_actor<>p.id OR old_kind<>p_kind THEN RAISE EXCEPTION 'request conflict';END IF;
   RETURN old;
  END IF;
  IF r.status<>'playing' THEN RAISE EXCEPTION 'game no longer active';END IF;
  actor:=CASE WHEN p.public_role='suspect'
    THEN m.private_pack->'private_cards'->(p.internal_slot-1)->>'actor_id'
    ELSE NULL END;
  new_state:=m.play_state;
  IF r.phase IN ('closed','final_audience','final_suspect_defenses','locking','reveal')
    OR (r.phase='regime_court' AND p_kind<>'captured_response')
    THEN RAISE EXCEPTION 'actions closed'; END IF;
  IF p_kind='alliance' THEN
    IF p.public_role<>'suspect' OR p.internal_slot NOT IN (1,2) OR r.cycle>1
      OR r.phase NOT IN ('role_reading','initial_debrief','investigation_assembly')
    THEN RAISE EXCEPTION 'not eligible for alliance choice'; END IF;
    IF m.play_state->'alliance' ? actor THEN RAISE EXCEPTION 'alliance choice already locked'; END IF;
    choice:=p_payload->>'choice';
    IF choice NOT IN ('together','apart') THEN RAISE EXCEPTION 'invalid alliance'; END IF;
    new_state:=jsonb_set(new_state,ARRAY['alliance',actor],to_jsonb(choice),true);
    result:=jsonb_build_object('ok',true,'kind',p_kind,'locked',true);
  ELSIF p_kind='fugitive_choice' THEN
    IF p.public_role<>'suspect' OR p.internal_slot NOT IN (1,2)
      OR r.cycle NOT BETWEEN 1 AND 3 THEN RAISE EXCEPTION 'not a fugitive'; END IF;
    IF m.play_state->'arrests' ? actor THEN RAISE EXCEPTION 'already captured'; END IF;
    IF EXISTS(SELECT 1 FROM jsonb_array_elements(coalesce(m.play_state->'decisions','[]'::jsonb)) d
      WHERE d->>'actor_id'=actor AND (d->>'cycle')::int=r.cycle)
    THEN RAISE EXCEPTION 'one decision per fugitive per cycle'; END IF;
    SELECT value INTO option_row FROM jsonb_array_elements(m.private_pack->'fugitive_actions') value
     WHERE igr_private.igr_regime_v14_matches_input(
         m.room_code,p_payload->>'option_id',value->>'id')
       AND value->>'actorId'=actor AND (value->>'cycle')::int=r.cycle;
    IF NOT FOUND THEN RAISE EXCEPTION 'invalid private option'; END IF;
    new_state:=jsonb_set(new_state,'{decisions}',
      coalesce(new_state->'decisions','[]'::jsonb)||
      jsonb_build_array(jsonb_build_object('actor_id',actor,'cycle',r.cycle,
         'option_id',option_row->>'id',
         'effect',option_row->'effect','cost',option_row->'cost')),true);
    active_refuge:=igr_private.igr_regime_v14_active_track(m.room_code,actor);
    fallback_refuge:=NULL;
    IF option_row->'effect'->>'kind'='shift_network' THEN
      fallback_refuge:=m.private_pack->'first_cycle'->'fallback_tracks'->>
        (CASE WHEN p.internal_slot=1 THEN 'first' ELSE 'second' END);
      SELECT net->>'label' INTO refuge_label FROM jsonb_array_elements(
         m.private_pack->'first_cycle'->'public_networks') net
         WHERE net->>'id'=fallback_refuge LIMIT 1;
      IF fallback_refuge IS NULL THEN RAISE EXCEPTION 'relocation network not authored';END IF;
      new_state:=jsonb_set(new_state,'{track_overrides}',
          coalesce(new_state->'track_overrides','{}'::jsonb)||
          jsonb_build_object(actor,fallback_refuge),true);
      clue_to_publish:=jsonb_build_object(
        'id','movement:'||p_request_id,'kind','capture',
        'cycle',r.cycle,'source','checkpoint_surveillance',
        'target_id',actor,'network_id',fallback_refuge,
        'network_label',refuge_label,'title','TRACE DE RELOCALISATION',
        'text','Une source indépendante a observé un changement de relais. La piste suit un refuge de repli; elle doit être recoupée avant un mandat.');
      new_state:=jsonb_set(new_state,'{extra_capture_leads}',
        coalesce(new_state->'extra_capture_leads','[]'::jsonb)||
          jsonb_build_array(clue_to_publish),true);
    ELSIF option_row->'effect'->>'kind'='delay_lead' THEN
      new_state:=jsonb_set(new_state,'{lead_delay}',
        coalesce(new_state->'lead_delay','{}'::jsonb)||
        jsonb_build_object(actor,jsonb_build_object('cycle',r.cycle,
          'until',now()+interval '60 seconds')),true);
    END IF;
    IF option_row ? 'reveals_capture_evidence_id' THEN
      SELECT value INTO clue_to_publish FROM jsonb_array_elements(
       m.private_pack->'capture_evidence') value
       WHERE value->>'id'=option_row->>'reveals_capture_evidence_id' LIMIT 1;
    ELSIF option_row->'cost'->>'kind' IN ('create_contradiction','expose_trace') THEN
      SELECT value INTO clue_to_publish FROM jsonb_array_elements(
       m.private_pack->'capture_evidence') value
       WHERE value->>'targetId'=actor AND (value->>'cycle')::integer=r.cycle
       ORDER BY value->>'id' DESC LIMIT 1;
    ELSE clue_to_publish:=NULL;
    END IF;
    IF clue_to_publish IS NOT NULL THEN
      disclosed:=coalesce(new_state->'disclosed','[]'::jsonb)||
        jsonb_build_array(clue_to_publish->>'id');
      new_state:=jsonb_set(new_state,'{disclosed}',disclosed,true);
      new_state:=jsonb_set(new_state,'{capture_clue_tracks}',
        coalesce(new_state->'capture_clue_tracks','{}'::jsonb)||
        jsonb_build_object(clue_to_publish->>'id',
          coalesce(fallback_refuge,active_refuge)),true);
    END IF;
    -- Protecting a contact now reduces immediate exposure, but costs a
    -- verified later lead. On C3, the cost is immediate (no imaginary C4).
    IF option_row->'cost'->>'kind'='lose_protection' THEN
      next_lead_cycle:=least(3,r.cycle+1);
      SELECT e.value INTO future_lead
      FROM jsonb_array_elements(m.private_pack->'capture_evidence') e
      WHERE e.value->>'targetId'=actor
        AND (e.value->>'cycle')::integer=next_lead_cycle LIMIT 1;
      IF FOUND THEN
        IF next_lead_cycle=r.cycle THEN
          new_state:=jsonb_set(new_state,'{disclosed}',
            coalesce(new_state->'disclosed','[]'::jsonb)||
            jsonb_build_array(future_lead->>'id'),true);
        ELSE
          new_state:=jsonb_set(new_state,'{scheduled_disclosures}',
            coalesce(new_state->'scheduled_disclosures','[]'::jsonb)||
            jsonb_build_array(jsonb_build_object(
            'id',future_lead->>'id','cycle',next_lead_cycle,
            'track_id',active_refuge)),true);
        END IF;
      END IF;
    END IF;
    new_state:=jsonb_set(new_state,'{events}',
      coalesce(new_state->'events','[]'::jsonb)||
      jsonb_build_array(jsonb_build_object('type','decision_confirmed','cycle',r.cycle,
        'actor',actor,'description','Un responsable prend une décision dont les conséquences deviennent vérifiables.')),true);
    result:=jsonb_build_object('ok',true,'kind',p_kind,'accepted',true);
  ELSIF p_kind='investigate' THEN
    IF p.public_role NOT IN ('enqueteur','analyste') OR r.cycle NOT BETWEEN 1 AND 3
      THEN RAISE EXCEPTION 'investigation reserved for enquiry'; END IF;
    IF EXISTS(SELECT 1 FROM jsonb_array_elements(coalesce(m.play_state->'investigations','[]'::jsonb)) x
      WHERE (x->>'cycle')::int=r.cycle)
      THEN RAISE EXCEPTION 'investigation already used in cycle'; END IF;
    SELECT x.value INTO option_row FROM
      jsonb_array_elements(m.private_pack->'investigation_choices'->(r.cycle-1)->'choices') x
    WHERE igr_private.igr_regime_v14_matches_input(
       m.room_code,p_payload->>'option_id',x.value->>'id');
    IF NOT FOUND THEN RAISE EXCEPTION 'investigation not offered'; END IF;
    SELECT value INTO piece FROM jsonb_array_elements(m.private_pack->'revelations') value
      WHERE value->>'id'=option_row->>'deliverable_id';
    IF NOT FOUND THEN RAISE EXCEPTION 'investigation outcome absent'; END IF;
    new_state:=jsonb_set(new_state,'{investigations}',
      coalesce(new_state->'investigations','[]'::jsonb)||
      jsonb_build_array(jsonb_build_object('cycle',r.cycle,'option_id',option_row->>'id')),true);
    new_state:=jsonb_set(new_state,'{disclosed}',
      coalesce(new_state->'disclosed','[]'::jsonb)||jsonb_build_array(piece->>'id'),true);
    -- If a capture clue has been specifically linked to a confirmed investigation,
    -- release that clue too. It remains distinct from the core crime evidence.
    SELECT x.value INTO piece FROM jsonb_array_elements(m.private_pack->'capture_evidence') x
     WHERE x.value->>'alternative_investigation_id'=option_row->>'id' LIMIT 1;
    IF FOUND THEN
      new_state:=jsonb_set(new_state,'{disclosed}',
       coalesce(new_state->'disclosed','[]'::jsonb)||jsonb_build_array(piece->>'id'),true);
      new_state:=jsonb_set(new_state,'{capture_clue_tracks}',
        coalesce(new_state->'capture_clue_tracks','{}'::jsonb)||
        jsonb_build_object(piece->>'id',
          igr_private.igr_regime_v14_active_track(m.room_code,piece->>'targetId')),true);
    END IF;
    result:=jsonb_build_object('ok',true,'kind',p_kind,'published',option_row->>'deliverable_id');
  ELSIF p_kind='captured_response' THEN
    IF p.public_role<>'suspect' OR p.internal_slot NOT IN (1,2)
      OR r.cycle NOT BETWEEN 1 AND 3
      OR NOT (m.play_state->'arrests' ? actor) THEN
      RAISE EXCEPTION 'only captured fugitive may present this defense';
    END IF;
    IF r.phase='regime_court' THEN
      IF m.play_state->'court'->>'started_at' IS NULL OR
       now()>=(m.play_state->'court'->>'started_at')::timestamptz+
        make_interval(secs=>CASE
          WHEN (m.play_state->'court'->>'duration_minutes')::integer=14 THEN 720
          ELSE 360 END)
      THEN RAISE EXCEPTION 'court defendant defense window closed';END IF;
    END IF;
    IF EXISTS(SELECT 1 FROM jsonb_array_elements(
         coalesce(new_state->'captured_responses','[]'::jsonb)) x
      WHERE x->>'actor_id'=actor AND (x->>'cycle')::integer=r.cycle)
      THEN RAISE EXCEPTION 'only one captured defense action per cycle';END IF;
    IF EXISTS(SELECT 1 FROM jsonb_array_elements(
         coalesce(new_state->'decisions','[]'::jsonb)) x
      WHERE x->>'actor_id'=actor AND (x->>'cycle')::integer=r.cycle)
      THEN RAISE EXCEPTION 'you already acted as a fugitive this cycle';END IF;
    option_row:=m.private_pack->'captured_defense_objectives'->actor;
    IF option_row IS NULL OR option_row->>'act_id' IS NULL THEN
      RAISE EXCEPTION 'no sealed captured defense objective';END IF;
    choice:=p_payload->>'mode';
    claim:=p_payload->>'claimed_orderer';
    statement_text:=btrim(coalesce(p_payload->>'statement',''));
    IF choice NOT IN ('authentic_exhibit','contested_declaration') OR
       length(statement_text) NOT BETWEEN 30 AND 350 THEN
      RAISE EXCEPTION 'a precise 30-350 character defense is required';END IF;
    IF claim NOT IN (SELECT x.value->>'actor_id' FROM
       jsonb_array_elements(m.private_pack->'private_cards') x) OR claim=actor
       THEN RAISE EXCEPTION 'choose another named potential author'; END IF;
    captured_exhibit_id:=NULL;
    IF choice='authentic_exhibit' THEN
      SELECT value INTO piece FROM jsonb_array_elements(m.private_pack->'revelations') value
       WHERE value->>'kind'='optional' AND
         value->'act_ids' ? (option_row->>'act_id')
         AND (value->>'min_cycle')::integer<=r.cycle
       ORDER BY (value->>'min_cycle')::integer,value->>'id' LIMIT 1;
      IF NOT FOUND THEN RAISE EXCEPTION 'authentic excerpt unavailable this cycle';END IF;
      captured_exhibit_id:=piece->>'id';
      new_state:=jsonb_set(new_state,'{disclosed}',
        coalesce(new_state->'disclosed','[]'::jsonb)||
        jsonb_build_array(captured_exhibit_id),true);
    END IF;
    new_state:=jsonb_set(new_state,'{captured_responses}',
      coalesce(new_state->'captured_responses','[]'::jsonb)||
      jsonb_build_array(jsonb_build_object(
        'actor_id',actor,'cycle',r.cycle,
        'act_id',option_row->>'act_id','mode',choice,
        'claimed_orderer',claim,'statement',statement_text,
        'published_evidence_id',captured_exhibit_id)),true);
    new_state:=jsonb_set(new_state,'{events}',
      coalesce(new_state->'events','[]'::jsonb)||
      jsonb_build_array(jsonb_build_object(
        'type','captured_defense','cycle',r.cycle,
        'id','captured-defense:'||p_request_id,
        'title','DÉCLARATION D’UN DIRIGEANT CAPTURÉ',
        'text',statement_text,'actor_id',actor,
        'challenged_act',option_row->>'act_title',
        'claim_ordered_by',claim,
        'authentic_document_id',captured_exhibit_id,
        'not_a_verdict',true)),true);
    result:=jsonb_build_object('ok',true,'kind',p_kind,
      'accepted',true,'document_published',captured_exhibit_id);
  ELSIF p_kind='third_submission' THEN
    IF p.public_role<>'suspect' OR p.internal_slot<>3 OR r.cycle>2
      THEN RAISE EXCEPTION 'third suspect submission unavailable'; END IF;
    IF new_state->'third' ? 'submitted' THEN RAISE EXCEPTION 'third suspect already submitted'; END IF;
    choice:=m.private_pack->'third_suspect_mission'->>'assigned_path';
    IF choice='protect' AND length(btrim(coalesce(p_payload->>'defense','')))<10
      THEN RAISE EXCEPTION 'defense requires at least ten characters'; END IF;
    new_state:=jsonb_set(new_state,'{third}',
      jsonb_build_object('submitted',true,'cycle',r.cycle,'path',choice,
      'defense',CASE WHEN choice='protect' THEN left(p_payload->>'defense',600) ELSE NULL END),true);
    IF choice='cooperate' THEN
      piece:=m.private_pack->'third_suspect_mission'->'public_on_submission';
      IF piece IS NULL THEN RAISE EXCEPTION 'authentic submission not authored'; END IF;
      new_state:=jsonb_set(new_state,'{disclosed}',
        coalesce(new_state->'disclosed','[]'::jsonb)||jsonb_build_array(piece->>'id'),true);
      new_state:=jsonb_set(new_state,'{events}',
        coalesce(new_state->'events','[]'::jsonb)||
        jsonb_build_array(jsonb_build_object('type','third_document','title',piece->>'title',
          'text',piece->>'text','cycle',r.cycle)),true);
    END IF;
    result:=jsonb_build_object('ok',true,'kind',p_kind,'accepted',true);
  ELSE
    RAISE EXCEPTION 'action not implemented; release gated';
  END IF;

  UPDATE igr_private.igr_regime_v13_rooms SET play_state=new_state WHERE room_code=p.room_code;
  INSERT INTO igr_private.igr_regime_v13_ledger
   (room_code,request_id,actor_player,action_kind,cycle,response)
  VALUES(p.room_code,p_request_id,p.id,p_kind,r.cycle,result);
  RETURN result;
END $$;
REVOKE EXECUTE ON FUNCTION public.igr_regime_v13_action(text,uuid,text,text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.igr_regime_v13_action(text,uuid,text,text,jsonb) TO anon,authenticated;


-- supabase/candidates/igr_regime_v14_private_aliases.sql
-- LE RÉGIME v14 — secret per-room ID aliases.
-- Never deliver raw 032A/033B/034C asset IDs or refuge IDs to a live client.
-- Two different sessions with the same variant receive unrelated IDs.
CREATE OR REPLACE FUNCTION igr_private.igr_regime_v14_public_id(
 p_code text,p_raw text)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO ''
AS $$
 SELECT CASE WHEN p_raw IS NULL THEN NULL ELSE
  'ref-'||substr(md5(m.alias_salt::text||':'||p_raw),1,18) END
 FROM igr_private.igr_regime_v13_rooms m
 WHERE m.room_code=upper(trim(p_code))
$$;
REVOKE EXECUTE ON FUNCTION igr_private.igr_regime_v14_public_id(text,text)
 FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION igr_private.igr_regime_v14_visible_id(
 p_code text,p_raw text)
RETURNS text LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO ''
AS $$
DECLARE m igr_private.igr_regime_v13_rooms%rowtype;
BEGIN
 SELECT * INTO m FROM igr_private.igr_regime_v13_rooms
 WHERE room_code=upper(trim(p_code));
 IF NOT FOUND THEN RETURN NULL;END IF;
 IF coalesce((m.play_state->>'strict_alias_only')::boolean,false) THEN
  RETURN igr_private.igr_regime_v14_public_id(p_code,p_raw);
 END IF;
 RETURN p_raw;
END $$;
REVOKE EXECUTE ON FUNCTION igr_private.igr_regime_v14_visible_id(text,text)
 FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION igr_private.igr_regime_v14_matches_input(
 p_code text,p_input text,p_real_id text)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO ''
AS $$
DECLARE m igr_private.igr_regime_v13_rooms%rowtype;
BEGIN
 SELECT * INTO m FROM igr_private.igr_regime_v13_rooms
 WHERE room_code=upper(trim(p_code));
 IF NOT FOUND OR p_input IS NULL OR p_real_id IS NULL THEN RETURN false;END IF;
 IF coalesce((m.play_state->>'strict_alias_only')::boolean,false) THEN
   RETURN p_input=igr_private.igr_regime_v14_public_id(p_code,p_real_id)
     OR (p_real_id !~ '(^|_)0[0-9]{2}[ABC]([-_]|$)' AND p_input=p_real_id);
 END IF;
 RETURN p_input=p_real_id OR
   p_input=igr_private.igr_regime_v14_public_id(p_code,p_real_id);
END $$;
REVOKE EXECUTE ON FUNCTION igr_private.igr_regime_v14_matches_input(text,text,text)
 FROM PUBLIC,anon,authenticated;

-- Recursively redact every variant-bearing technical identifier in an
-- authorized player's JSON response. Private scenario text remains intact.
CREATE OR REPLACE FUNCTION igr_private.igr_regime_v14_sanitize_json(
 p_code text,p_value jsonb)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO ''
AS $$
DECLARE
 strict_mode boolean;
 val jsonb;entry record;out_value jsonb;
 encoded text;
BEGIN
 SELECT coalesce((m.play_state->>'strict_alias_only')::boolean,false)
 INTO strict_mode FROM igr_private.igr_regime_v13_rooms m
 WHERE m.room_code=upper(trim(p_code));
 IF NOT coalesce(strict_mode,false) OR p_value IS NULL THEN RETURN p_value;END IF;
 IF jsonb_typeof(p_value)='string' THEN
   encoded:=p_value#>>'{}';
   IF encoded ~ '(^|_)0[0-9]{2}[ABC]([-_]|$)' THEN
     RETURN to_jsonb(igr_private.igr_regime_v14_public_id(p_code,encoded));
   END IF;
   RETURN p_value;
 ELSIF jsonb_typeof(p_value)='array' THEN
   out_value:='[]'::jsonb;
   FOR val IN SELECT jsonb_array_elements(p_value) LOOP
      out_value:=out_value||jsonb_build_array(
        igr_private.igr_regime_v14_sanitize_json(p_code,val));
   END LOOP;
   RETURN out_value;
 ELSIF jsonb_typeof(p_value)='object' THEN
   out_value:='{}'::jsonb;
   FOR entry IN SELECT key,value FROM jsonb_each(p_value) LOOP
      out_value:=out_value||jsonb_build_object(entry.key,
       igr_private.igr_regime_v14_sanitize_json(p_code,entry.value));
   END LOOP;
   RETURN out_value;
 END IF;
 RETURN p_value;
END $$;
REVOKE EXECUTE ON FUNCTION igr_private.igr_regime_v14_sanitize_json(text,jsonb)
 FROM PUBLIC,anon,authenticated;


-- supabase/candidates/igr_regime_v14_tracks.sql
-- LE RÉGIME v14 - sealed, actor-specific network locator.
-- This private helper is callable only by privileged Regime RPCs. It never
-- exposes which of the five publicly known refuges is currently occupied.
CREATE OR REPLACE FUNCTION igr_private.igr_regime_v14_active_track(
 p_code text,p_actor_id text)
RETURNS text LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO ''
AS $$
DECLARE
 m igr_private.igr_regime_v13_rooms%rowtype;
 actor1 text;actor2 text;choice1 text;choice2 text;
 t text;
BEGIN
 SELECT * INTO m FROM igr_private.igr_regime_v13_rooms
 WHERE room_code=upper(trim(p_code));
 IF NOT FOUND THEN RETURN NULL;END IF;
 actor1:=m.private_pack->'private_cards'->0->>'actor_id';
 actor2:=m.private_pack->'private_cards'->1->>'actor_id';
 IF p_actor_id NOT IN (actor1,actor2) THEN RETURN NULL;END IF;
 t:=m.play_state->'track_overrides'->>p_actor_id;
 IF t IS NOT NULL THEN RETURN t;END IF;
 choice1:=m.play_state->'alliance'->>actor1;
 choice2:=m.play_state->'alliance'->>actor2;
 IF choice1='together' AND choice2='together' THEN
    RETURN m.private_pack->'first_cycle'->'available_tracks_by_alliance'->
      'together'->>'joint';
 END IF;
 RETURN m.private_pack->'first_cycle'->'available_tracks_by_alliance'->
   'apart'->>(CASE WHEN p_actor_id=actor1 THEN 'first' ELSE 'second' END);
END $$;
REVOKE EXECUTE ON FUNCTION igr_private.igr_regime_v14_active_track(text,text)
 FROM PUBLIC,anon,authenticated;

-- C1 leads are an immutable snapshot of the initial network. Later fugitive
-- relocations do not silently rewrite a previously published contact.
CREATE OR REPLACE FUNCTION igr_private.igr_regime_v14_base_track(
 p_code text,p_actor_id text)
RETURNS text LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO ''
AS $$
DECLARE
 m igr_private.igr_regime_v13_rooms%rowtype;
 actor1 text;actor2 text;
BEGIN
 SELECT * INTO m FROM igr_private.igr_regime_v13_rooms
 WHERE room_code=upper(trim(p_code));
 IF NOT FOUND THEN RETURN NULL;END IF;
 actor1:=m.private_pack->'private_cards'->0->>'actor_id';
 actor2:=m.private_pack->'private_cards'->1->>'actor_id';
 IF p_actor_id NOT IN (actor1,actor2) THEN RETURN NULL;END IF;
 IF m.play_state->'alliance'->>actor1='together'
    AND m.play_state->'alliance'->>actor2='together' THEN
    RETURN m.private_pack->'first_cycle'->'available_tracks_by_alliance'->
      'together'->>'joint';
 END IF;
 RETURN m.private_pack->'first_cycle'->'available_tracks_by_alliance'->
   'apart'->>(CASE WHEN p_actor_id=actor1 THEN 'first' ELSE 'second' END);
END $$;
REVOKE EXECUTE ON FUNCTION igr_private.igr_regime_v14_base_track(text,text)
 FROM PUBLIC,anon,authenticated;


-- supabase/candidates/igr_regime_v13_judicial_runtime.sql
-- LE RÉGIME v13 - transaction-safe warrant, court and reconstruction
-- DEPENDS ON: supabase/candidates/igr_regime_v13_private_runtime.sql
-- STAGED CANDIDATE ONLY, gated by absent v13_room snapshots until release.

CREATE OR REPLACE FUNCTION public.igr_regime_v13_warrant(
 p_code text,p_player_token uuid,p_request_id text,p_target_id text,
 p_track_choice text,p_evidence_ids jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $$
DECLARE
 r public.igr_v4_rooms%rowtype; p public.igr_v4_players%rowtype;
 m igr_private.igr_regime_v13_rooms%rowtype;
 e jsonb; evidence jsonb; origins text[]:=ARRAY[]::text[];trace_id text;origin_name text;published boolean; from_extra boolean;
 eid text; ids text[]:=ARRAY[]::text[];
 old igr_private.igr_regime_v13_ledger%rowtype;
 warrants jsonb; result jsonb; target1 text;target2 text;
BEGIN
 SELECT * INTO p FROM public.igr_v4_players
 WHERE room_code=upper(trim(p_code)) AND player_token=p_player_token;
 IF NOT FOUND OR p.public_role<>'enqueteur' THEN RAISE EXCEPTION 'not authorized to request warrants';END IF;
 SELECT * INTO r FROM public.igr_v4_rooms WHERE code=p.room_code FOR UPDATE;
 SELECT * INTO m FROM igr_private.igr_regime_v13_rooms WHERE room_code=p.room_code FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'warrants unavailable';END IF;
 IF length(coalesce(p_request_id,''))<8 OR length(p_request_id)>128 THEN RAISE EXCEPTION 'invalid request';END IF;
 SELECT * INTO old FROM igr_private.igr_regime_v13_ledger
 WHERE room_code=p.room_code AND request_id=p_request_id;
 IF FOUND THEN
   IF old.actor_player<>p.id OR old.action_kind<>'mandate' THEN RAISE EXCEPTION 'request conflict';END IF;
   RETURN old.response;
 END IF;
 IF r.status<>'playing' OR r.cycle NOT BETWEEN 1 AND 3 OR
 r.phase IN ('closed','final_audience','final_suspect_defenses','locking','regime_court')
 THEN RAISE EXCEPTION 'warrants unavailable';END IF;
 target1:=m.private_pack->'private_cards'->0->>'actor_id';
 target2:=m.private_pack->'private_cards'->1->>'actor_id';
 IF p_target_id NOT IN (target1,target2) THEN RAISE EXCEPTION 'unknown fugitive';END IF;
 IF m.play_state->'arrests' ? p_target_id THEN RAISE EXCEPTION 'fugitive already captured';END IF;
 IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements(
   m.private_pack->'first_cycle'->'public_networks') loc
   WHERE igr_private.igr_regime_v14_matches_input(m.room_code,p_track_choice,loc->>'id'))
   THEN RAISE EXCEPTION 'unknown proposed refuge';END IF;
 IF r.cycle=1 AND r.phase='role_reading' AND
    (NOT (m.play_state->'alliance' ? target1) OR
     NOT (m.play_state->'alliance' ? target2)) THEN
   RAISE EXCEPTION 'initial alliance has not been locked';END IF;
 IF (m.play_state->'lead_delay'->p_target_id->>'cycle')::int=r.cycle
    AND now()<coalesce((m.play_state->'lead_delay'->p_target_id->>'until')::timestamptz,now()) THEN
    RAISE EXCEPTION 'this contact lead is under independent verification';END IF;
 IF jsonb_typeof(p_evidence_ids)<>'array' OR jsonb_array_length(p_evidence_ids)<>2
 THEN RAISE EXCEPTION 'two independent pieces required';END IF;
 SELECT ARRAY(SELECT jsonb_array_elements_text(p_evidence_ids)) INTO ids;
 IF ids[1]=ids[2] THEN RAISE EXCEPTION 'two distinct pieces required';END IF;
 FOREACH eid IN ARRAY ids LOOP
   e:=NULL;
   from_extra:=false;
   SELECT value INTO e FROM jsonb_array_elements(
     m.private_pack->'capture_evidence') value
     WHERE igr_private.igr_regime_v14_matches_input(m.room_code,eid,value->>'id') AND value->>'targetId'=p_target_id
       AND (value->>'cycle')::integer<=r.cycle LIMIT 1;
   IF e IS NULL THEN
     from_extra:=true;
     SELECT value INTO e FROM jsonb_array_elements(
       coalesce(m.play_state->'extra_capture_leads','[]'::jsonb)) value
       WHERE igr_private.igr_regime_v14_matches_input(m.room_code,eid,value->>'id') AND value->>'target_id'=p_target_id
         AND (value->>'cycle')::integer<=r.cycle LIMIT 1;
   END IF;
   IF e IS NULL THEN RAISE EXCEPTION 'unpublished or unrelated trace';END IF;
   IF from_extra THEN
      origin_name:=e->>'source';
      trace_id:=e->>'network_id';
   ELSE
     published:=
       ((e->>'revealed_at'='cycle_start'
         AND (e->>'cycle')::integer<=r.cycle)
        OR (coalesce(m.play_state->'disclosed','[]'::jsonb) ? (e->>'id'))
        OR EXISTS(SELECT 1 FROM jsonb_array_elements(
         coalesce(m.play_state->'scheduled_disclosures','[]'::jsonb)) sd
         WHERE sd->>'id'=e->>'id' AND (sd->>'cycle')::integer<=r.cycle));
     IF NOT published THEN RAISE EXCEPTION 'private trace not revealed';END IF;
     origin_name:=e->>'origin';
     trace_id:=coalesce(
       m.play_state->'capture_clue_tracks'->>(e->>'id'),
       (SELECT sd->>'track_id' FROM jsonb_array_elements(
         coalesce(m.play_state->'scheduled_disclosures','[]'::jsonb)) sd
         WHERE sd->>'id'=e->>'id' LIMIT 1),
       CASE WHEN (e->>'cycle')::integer=1
         THEN igr_private.igr_regime_v14_base_track(m.room_code,p_target_id)
         ELSE igr_private.igr_regime_v14_active_track(m.room_code,p_target_id) END);
   END IF;
   IF NOT igr_private.igr_regime_v14_matches_input(m.room_code,p_track_choice,trace_id) THEN
      RAISE EXCEPTION 'the two documents must point to the chosen refuge';END IF;
   origins:=origins||ARRAY[origin_name];
 END LOOP;
 IF origins[1] IS NULL OR origins[1]=origins[2] THEN RAISE EXCEPTION 'dependent sources';END IF;
 warrants:=coalesce(m.play_state->'mandates','[]'::jsonb);
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(warrants) j
   WHERE j->>'target_id'=p_target_id AND (j->>'cycle')::integer=r.cycle)
 THEN RAISE EXCEPTION 'one warrant per fugitive per cycle'; END IF;
 warrants:=warrants||jsonb_build_array(
   jsonb_build_object('id',p_request_id,'cycle',r.cycle,
      'target_id',p_target_id,'track_choice',p_track_choice,
      'evidence_ids',p_evidence_ids,'status','awaiting_judge','requested_at',now()));
 UPDATE igr_private.igr_regime_v13_rooms SET
 play_state=jsonb_set(m.play_state,'{mandates}',warrants,true) WHERE room_code=m.room_code;
 result:=jsonb_build_object('ok',true,'status','awaiting_judge','mandate_id',p_request_id);
 INSERT INTO igr_private.igr_regime_v13_ledger
 (room_code,request_id,actor_player,action_kind,cycle,response)
 VALUES(m.room_code,p_request_id,p.id,'mandate',r.cycle,result);
 RETURN result;
END $$;
REVOKE EXECUTE ON FUNCTION public.igr_regime_v13_warrant(text,uuid,text,text,text,jsonb)
 FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.igr_regime_v13_warrant(text,uuid,text,text,text,jsonb)
 TO anon,authenticated;

-- Judge can accept or lodge a bounded objection. Once a request has two
-- independent disclosed documents, the server applies a neutral evidentiary
-- check; no judge can change the sealed track or arbitrarily veto a capture.
-- Investigation roles can trigger recovery after 90 seconds of judge absence.
CREATE OR REPLACE FUNCTION public.igr_regime_v13_judge_review(
 p_code text,p_player_token uuid,p_request_id text,p_mandate_id text,p_decision text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $$
DECLARE
 r public.igr_v4_rooms%rowtype;p public.igr_v4_players%rowtype;
 m igr_private.igr_regime_v13_rooms%rowtype;
 old igr_private.igr_regime_v13_ledger%rowtype;
 warrants jsonb;w jsonb;idx integer:=0;i integer;
 party text;actual text;target text;outcome text;reviewed text;
 state jsonb;event jsonb;result jsonb;start_at timestamptz;
BEGIN
 SELECT * INTO p FROM public.igr_v4_players
 WHERE room_code=upper(trim(p_code)) AND player_token=p_player_token;
 IF NOT FOUND THEN RAISE EXCEPTION 'unauthorized';END IF;
 SELECT * INTO r FROM public.igr_v4_rooms WHERE code=p.room_code FOR UPDATE;
 SELECT * INTO m FROM igr_private.igr_regime_v13_rooms WHERE room_code=p.room_code FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'regime feature unavailable'; END IF;
 IF length(coalesce(p_request_id,''))<8 OR length(p_request_id)>128 THEN RAISE EXCEPTION 'invalid request';END IF;
 SELECT * INTO old FROM igr_private.igr_regime_v13_ledger
 WHERE room_code=p.room_code AND request_id=p_request_id;
 IF FOUND THEN
   IF old.actor_player<>p.id OR old.action_kind<>'judge_review' THEN RAISE EXCEPTION 'request conflict';END IF;
   RETURN old.response;
 END IF;
 IF r.status<>'playing' THEN RAISE EXCEPTION 'game has finished';END IF;
 warrants:=coalesce(m.play_state->'mandates','[]'::jsonb);
 FOR i IN 0..jsonb_array_length(warrants)-1 LOOP
  IF warrants->i->>'id'=p_mandate_id THEN w:=warrants->i;idx:=i;EXIT;END IF;
 END LOOP;
 IF w IS NULL OR w->>'status'<>'awaiting_judge' THEN RAISE EXCEPTION 'no pending warrant'; END IF;
 start_at:=(w->>'requested_at')::timestamptz;
 IF p.public_role='juge' THEN
  IF p_decision NOT IN ('allow','contest') THEN RAISE EXCEPTION 'judge decision invalid';END IF;
  reviewed:=p_decision;
 ELSIF p.public_role IN ('enqueteur','analyste') AND now()>=start_at+interval '90 seconds' THEN
  reviewed:='automatic_fallback';
 ELSE RAISE EXCEPTION 'judge review not permitted or too early'; END IF;
 target:=w->>'target_id';
 actual:=igr_private.igr_regime_v14_active_track(m.room_code,target);
 outcome:=CASE WHEN igr_private.igr_regime_v14_matches_input(m.room_code,w->>'track_choice',actual) THEN 'captured' ELSE 'not_found' END;
 IF m.play_state->'arrests' ? target THEN outcome:='already_captured';END IF;
 w:=jsonb_set(w,'{status}',to_jsonb(outcome),true);
 w:=jsonb_set(w,'{judge_review}',to_jsonb(reviewed),true);
 warrants:=jsonb_set(warrants,ARRAY[idx::text],w,true);
 state:=jsonb_set(m.play_state,'{mandates}',warrants,true);
 IF outcome='captured' THEN
   state:=jsonb_set(state,ARRAY['arrests',target],jsonb_build_object('cycle',r.cycle,'mandate',p_mandate_id),true);
   event:=jsonb_build_object('type','capture_confirmed','target_id',target,'cycle',r.cycle,'id','capture:'||p_mandate_id);
   state:=jsonb_set(state,'{events}',coalesce(state->'events','[]'::jsonb)||jsonb_build_array(event),true);
   IF m.scenario_id='034' AND target='fallen_president' THEN
     event:=jsonb_build_object('type','public_bulletin','id','bulletin:'||p_mandate_id,
       'title','LE PRÉSIDENT DÉCHU CAPTURÉ',
       'text','À Darsen, des habitants célèbrent la nouvelle. Les familles des disparus exigent un procès et la publication des archives; des fidèles du régime contestent l arrestation. La culpabilité individuelle reste à établir.');
     state:=jsonb_set(state,'{events}',coalesce(state->'events','[]'::jsonb)||jsonb_build_array(event),true);
   END IF;
 END IF;
 UPDATE igr_private.igr_regime_v13_rooms SET play_state=state WHERE room_code=m.room_code;
 result:=jsonb_build_object('ok',true,'status',outcome,'target_id',target,'judge_review',reviewed);
 INSERT INTO igr_private.igr_regime_v13_ledger
 (room_code,request_id,actor_player,action_kind,cycle,response)
 VALUES(m.room_code,p_request_id,p.id,'judge_review',r.cycle,result);
 RETURN result;
END $$;
REVOKE EXECUTE ON FUNCTION public.igr_regime_v13_judge_review(text,uuid,text,text,text)
 FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.igr_regime_v13_judge_review(text,uuid,text,text,text)
 TO anon,authenticated;

CREATE OR REPLACE FUNCTION igr_private.igr_regime_v13_begin_court(p_code text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $$
DECLARE
 r public.igr_v4_rooms%rowtype;m igr_private.igr_regime_v13_rooms%rowtype;
 t1 text;t2 text;c1 integer;c2 integer;minutes integer;
 st jsonb;
BEGIN
 SELECT * INTO r FROM public.igr_v4_rooms WHERE code=upper(trim(p_code)) FOR UPDATE;
 SELECT * INTO m FROM igr_private.igr_regime_v13_rooms WHERE room_code=upper(trim(p_code)) FOR UPDATE;
 IF NOT FOUND OR r.status<>'playing' OR r.cycle<>3 OR r.phase<>'closed' THEN RETURN false;END IF;
 IF m.play_state->'court' ? 'started' THEN RETURN false;END IF;
 t1:=m.private_pack->'private_cards'->0->>'actor_id';
 t2:=m.private_pack->'private_cards'->1->>'actor_id';
 c1:=(m.play_state->'arrests'->t1->>'cycle')::int;
 c2:=(m.play_state->'arrests'->t2->>'cycle')::int;
 minutes:=CASE WHEN c1 IS NOT NULL AND c2 IS NOT NULL AND greatest(c1,c2)=3 THEN 14 ELSE 8 END;
 st:=jsonb_set(m.play_state,'{court}',jsonb_build_object(
    'started',true,'started_at',now(),'duration_minutes',minutes,
    'stage','opening','called','[]'::jsonb,'current',NULL,'phase','tribunal'),true);
 UPDATE igr_private.igr_regime_v13_rooms SET play_state=st WHERE room_code=m.room_code;
 UPDATE public.igr_v4_rooms SET phase='regime_court',phase_started_at=now(),
   phase_ends_at=now()+make_interval(mins=>minutes),updated_at=now() WHERE code=r.code;
 INSERT INTO public.igr_v4_events(room_code,event_type,visibility,payload)
 VALUES(r.code,'phase','public',jsonb_build_object(
   'title','TRIBUNAL DE KARSANE',
   'text','Tous les joueurs rejoignent la salle commune. Le Juge appelle les personnes présentes à la barre. L audience finale ne sera pas rejouée.',
   'duration_minutes',minutes));
 RETURN true;
END $$;
REVOKE EXECUTE ON FUNCTION igr_private.igr_regime_v13_begin_court(text)
 FROM PUBLIC,anon,authenticated;

-- Judge starts each real confrontation by calling ONLY a captured player or
-- the third suspect, never a fugitive who is still on the run.
CREATE OR REPLACE FUNCTION public.igr_regime_v13_court_call(
 p_code text,p_player_token uuid,p_request_id text,p_actor_id text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $$
DECLARE
 p public.igr_v4_players%rowtype;r public.igr_v4_rooms%rowtype;
 m igr_private.igr_regime_v13_rooms%rowtype;
 called jsonb;count_seconds integer;st jsonb;res jsonb;allowed boolean;
 prev igr_private.igr_regime_v13_ledger%rowtype;
 elapsed_seconds integer;slot_no integer;last_called_slot integer;
BEGIN
 SELECT * INTO p FROM public.igr_v4_players WHERE room_code=upper(trim(p_code)) AND player_token=p_player_token;
 IF NOT FOUND OR p.public_role<>'juge' THEN RAISE EXCEPTION 'Judge required';END IF;
 SELECT * INTO r FROM public.igr_v4_rooms WHERE code=p.room_code FOR UPDATE;
 SELECT * INTO m FROM igr_private.igr_regime_v13_rooms WHERE room_code=p.room_code FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'courtroom unavailable';END IF;
 allowed:=p_actor_id=m.private_pack->'private_cards'->2->>'actor_id'
   OR (m.play_state->'arrests' ? p_actor_id);
 IF NOT allowed THEN RAISE EXCEPTION 'person not present before court';END IF;
 called:=coalesce(m.play_state->'court'->'called','[]'::jsonb);

 IF length(coalesce(p_request_id,''))<8 THEN RAISE EXCEPTION 'invalid request';END IF;
 SELECT * INTO prev FROM igr_private.igr_regime_v13_ledger
 WHERE room_code=p.room_code AND request_id=p_request_id;
 IF FOUND THEN
  IF prev.actor_player<>p.id OR prev.action_kind<>'court_call'
    THEN RAISE EXCEPTION 'court request conflict';END IF;
  RETURN prev.response;
 END IF;
 IF r.phase<>'regime_court' THEN RAISE EXCEPTION 'courtroom time has closed';END IF;
 IF called ? p_actor_id THEN RAISE EXCEPTION 'already called to the bar';END IF;
 count_seconds:=CASE WHEN (m.play_state->'court'->>'duration_minutes')::int=14 THEN 120 ELSE 60 END;
 elapsed_seconds:=floor(extract(epoch from (
   now()-(m.play_state->'court'->>'started_at')::timestamptz)))::integer;
 -- A judge may call only one accused in a guaranteed statement slot.
 -- Opening is 60s; then exactly three 120s/60s defence slots.
 IF elapsed_seconds<60 OR elapsed_seconds>=60+3*count_seconds THEN
   RAISE EXCEPTION 'the defense statement window is not active';
 END IF;
 slot_no:=(elapsed_seconds-60)/count_seconds;
 IF p_actor_id IS DISTINCT FROM
   (m.private_pack->'private_cards'->slot_no->>'actor_id') THEN
   RAISE EXCEPTION 'judge cannot replace the accused assigned to this time slot';
 END IF;
 last_called_slot:=coalesce((m.play_state->'court'->>'last_called_slot')::integer,-1);
 IF last_called_slot=slot_no THEN
   RAISE EXCEPTION 'only one speaker may be called per defense slot';
 END IF;
 st:=jsonb_set(m.play_state,ARRAY['court','called'],called||jsonb_build_array(p_actor_id),true);
 st:=jsonb_set(st,ARRAY['court','last_called_slot'],to_jsonb(slot_no),true);
 st:=jsonb_set(st,ARRAY['court','current'],jsonb_build_object(
   'actor_id',p_actor_id,'started_at',now(),'seconds',count_seconds),true);
 st:=jsonb_set(st,ARRAY['court','stage'],to_jsonb('defenses'::text),true);
 UPDATE igr_private.igr_regime_v13_rooms SET play_state=st WHERE room_code=m.room_code;
 res:=jsonb_build_object('ok',true,'actor_id',p_actor_id,'seconds',count_seconds);
 INSERT INTO igr_private.igr_regime_v13_ledger
 (room_code,request_id,actor_player,action_kind,cycle,response)
 VALUES(m.room_code,p_request_id,p.id,'court_call',r.cycle,res)
 ;
 RETURN res;
END $$;
REVOKE EXECUTE ON FUNCTION public.igr_regime_v13_court_call(text,uuid,text,text)
 FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.igr_regime_v13_court_call(text,uuid,text,text)
 TO anon,authenticated;

-- Private judgement of four acts. A source is credible only when revealed
-- in this room, authentic and independent of the second source. Returns no truth
-- or score until after the results phase.
CREATE OR REPLACE FUNCTION public.igr_regime_v13_reconstruct(
 p_code text,p_player_token uuid,p_request_id text,p_answers jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $$
DECLARE
 p public.igr_v4_players%rowtype;r public.igr_v4_rooms%rowtype;
 m igr_private.igr_regime_v13_rooms%rowtype;
 act jsonb;ans jsonb;eid text;piece jsonb;
 sources text[];i integer;accurate integer:=0;
 correct boolean;declared jsonb;res jsonb; source_supported boolean;act_scores jsonb:='{}'::jsonb;
 prior igr_private.igr_regime_v13_ledger%rowtype;
BEGIN
 SELECT * INTO p FROM public.igr_v4_players
 WHERE room_code=upper(trim(p_code)) AND player_token=p_player_token;
 IF NOT FOUND OR p.public_role NOT IN ('enqueteur','analyste') THEN RAISE EXCEPTION 'investigation only';END IF;
 SELECT * INTO r FROM public.igr_v4_rooms WHERE code=p.room_code FOR UPDATE;
 SELECT * INTO m FROM igr_private.igr_regime_v13_rooms WHERE room_code=p.room_code FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'private courtroom snapshot unavailable';END IF;
 IF length(coalesce(p_request_id,'')) NOT BETWEEN 8 AND 128 THEN
   RAISE EXCEPTION 'invalid request';END IF;
 SELECT * INTO prior FROM igr_private.igr_regime_v13_ledger
 WHERE room_code=p.room_code AND request_id=p_request_id;
 IF FOUND THEN
  IF prior.actor_player<>p.id OR prior.action_kind<>'judicial_reconstruction'
    THEN RAISE EXCEPTION 'request conflict';END IF;
  RETURN prior.response;
 END IF;
 IF r.phase<>'regime_court' THEN RAISE EXCEPTION 'not a courtroom phase';END IF;
 IF jsonb_typeof(p_answers)<>'array' OR jsonb_array_length(p_answers)<>4 THEN
   RAISE EXCEPTION 'four judicial attributions required';END IF;
 IF m.play_state->'reconstructions' ? (p.id::text) THEN RAISE EXCEPTION 'already submitted';END IF;
 FOR act IN SELECT value FROM jsonb_array_elements(m.private_pack->'acts') LOOP
   SELECT value INTO ans FROM jsonb_array_elements(p_answers) value WHERE igr_private.igr_regime_v14_matches_input(m.room_code,value->>'actId',act->>'id');
   IF NOT FOUND THEN RAISE EXCEPTION 'missing judicial act';END IF;
   sources:=ARRAY[]::text[];
   IF jsonb_typeof(ans->'evidenceIds')='array' THEN
     FOR eid IN SELECT jsonb_array_elements_text(ans->'evidenceIds') LOOP
       SELECT value INTO piece FROM jsonb_array_elements(m.private_pack->'revelations') value
       WHERE igr_private.igr_regime_v14_matches_input(m.room_code,eid,value->>'id') AND value->'act_ids' ? (act->>'id') LIMIT 1;
       IF NOT FOUND THEN
         piece:=m.private_pack->'third_suspect_mission'->'public_on_submission';
         IF NOT (igr_private.igr_regime_v14_matches_input(m.room_code,eid,piece->>'id') AND piece->'act_ids' ? (act->>'id'))
           THEN piece:=NULL;END IF;
       END IF;
       IF piece IS NOT NULL AND
         ((piece->>'kind'='guaranteed' AND (piece->>'min_cycle')::int<=r.cycle)
           OR (coalesce(m.play_state->'disclosed','[]'::jsonb) ? (piece->>'id')))
       THEN sources:=array_append(sources,piece->>'origin');END IF;
     END LOOP;
   END IF;
   SELECT count(distinct t) >= 2 INTO source_supported FROM unnest(sources) t;
   correct:=source_supported AND ans->>'orderedBy'=act->>'orderedBy'
     AND ans->>'transmittedBy'=act->>'transmittedBy'
     AND ans->>'executedBy'=act->>'executedBy'
     AND ans->>'knewAndControlledBy'=act->>'knewAndControlledBy';
   act_scores:=act_scores||jsonb_build_object(act->>'id',jsonb_build_object(
      'order_correct',coalesce(source_supported AND
        ans->>'orderedBy'=act->>'orderedBy',false),
      'supported',coalesce(source_supported,false),
      'act_correct',coalesce(correct,false)));
   IF correct THEN accurate:=accurate+1;END IF;
 END LOOP;
 declared:=jsonb_build_object('accurate',accurate,'passed',accurate>=3,'act_orders',act_scores,'submitted_at',now());
 UPDATE igr_private.igr_regime_v13_rooms SET
 play_state=jsonb_set(m.play_state,'{reconstructions}',
 coalesce(m.play_state->'reconstructions','{}'::jsonb)||
 jsonb_build_object(p.id::text,declared),true)
 WHERE room_code=m.room_code;
 res:=jsonb_build_object('ok',true,'received',true,'final_score_sealed',true);
 INSERT INTO igr_private.igr_regime_v13_ledger
 (room_code,request_id,actor_player,action_kind,cycle,response)
 VALUES(m.room_code,p_request_id,p.id,'judicial_reconstruction',r.cycle,res);
 RETURN res;
END $$;
REVOKE EXECUTE ON FUNCTION public.igr_regime_v13_reconstruct(text,uuid,text,jsonb)
 FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.igr_regime_v13_reconstruct(text,uuid,text,jsonb)
 TO anon,authenticated;

-- This is the one transition the v4 ticking flow must call for Regime only.
-- It skips duplicate speeches and retains the EXISTING v52 final 0/1/2 vote.
CREATE OR REPLACE FUNCTION igr_private.igr_regime_v13_finish_court(p_code text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $$
DECLARE r public.igr_v4_rooms%rowtype;
BEGIN
 SELECT * INTO r FROM public.igr_v4_rooms
 WHERE code=upper(trim(p_code)) FOR UPDATE;
 IF NOT FOUND OR r.phase<>'regime_court' THEN RETURN;END IF;
 IF now()<r.phase_ends_at THEN RETURN;END IF;
 PERFORM public.igr_v52_begin_stage(r.code,'locking');
END $$;
REVOKE EXECUTE ON FUNCTION igr_private.igr_regime_v13_finish_court(text)
 FROM PUBLIC,anon,authenticated;


-- supabase/candidates/igr_regime_v13_final_scoring.sql
-- LE RÉGIME v13 — private objective scoring and courtroom final declaration.
-- Depends on the two other v13 candidates. No active production release.

CREATE OR REPLACE FUNCTION public.igr_regime_v13_third_final(
  p_code text,p_player_token uuid,p_request_id text,p_ordered_by text,p_own_participation text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $$
DECLARE
 p public.igr_v4_players%rowtype;r public.igr_v4_rooms%rowtype;
 m igr_private.igr_regime_v13_rooms%rowtype;
 prior igr_private.igr_regime_v13_ledger%rowtype;
 mission jsonb;act jsonb;state jsonb;answer jsonb;response jsonb;
BEGIN
 SELECT * INTO p FROM public.igr_v4_players WHERE room_code=upper(trim(p_code))
   AND player_token=p_player_token AND public_role='suspect' AND internal_slot=3;
 IF NOT FOUND THEN RAISE EXCEPTION 'only the third suspect may give this declaration';END IF;
 SELECT * INTO r FROM public.igr_v4_rooms WHERE code=p.room_code FOR UPDATE;
 SELECT * INTO m FROM igr_private.igr_regime_v13_rooms WHERE room_code=p.room_code FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'tribunal not available';END IF;
 IF length(coalesce(p_request_id,'')) NOT BETWEEN 8 AND 128 THEN RAISE EXCEPTION 'invalid request';END IF;
 SELECT * INTO prior FROM igr_private.igr_regime_v13_ledger
 WHERE room_code=p.room_code AND request_id=p_request_id;
 IF FOUND THEN
   IF prior.actor_player<>p.id OR prior.action_kind<>'third_final'
     THEN RAISE EXCEPTION 'request conflict';END IF;
   RETURN prior.response;
 END IF;
 IF r.phase<>'regime_court' THEN RAISE EXCEPTION 'tribunal not active';END IF;
 IF m.play_state->'third' ? 'final_declaration' THEN RAISE EXCEPTION 'final declaration already filed';END IF;
 mission:=m.private_pack->'third_suspect_mission';
 IF mission->>'assigned_path'<>'cooperate'
   THEN RAISE EXCEPTION 'no declaration required for protection path';END IF;
 IF NOT coalesce((m.play_state->'third'->>'submitted')::boolean,false)
   OR (m.play_state->'third'->>'cycle')::int>2
   THEN RAISE EXCEPTION 'original document not submitted before C2';END IF;
 IF p_ordered_by NOT IN ('vahran_director','interior_minister','palace_secretary',
   'presidential_heir','defense_minister','clan_financier',
   'fallen_president','presidential_security','transmission_officer','unknown')
   THEN RAISE EXCEPTION 'invalid claimed authority';END IF;
 IF p_own_participation NOT IN ('order','transmission','execution','knowledge','none')
   THEN RAISE EXCEPTION 'invalid participation';END IF;
 answer:=jsonb_build_object('orderedBy',p_ordered_by,'ownParticipation',p_own_participation);
 state:=jsonb_set(m.play_state,ARRAY['third','final_declaration'],answer,true);
 UPDATE igr_private.igr_regime_v13_rooms SET play_state=state WHERE room_code=p.room_code;
 response:=jsonb_build_object('ok',true,'submitted',true);
 INSERT INTO igr_private.igr_regime_v13_ledger
 (room_code,request_id,actor_player,action_kind,cycle,response)
 VALUES(m.room_code,p_request_id,p.id,'third_final',r.cycle,response);
 RETURN response;
END $$;
REVOKE EXECUTE ON FUNCTION public.igr_regime_v13_third_final(text,uuid,text,text,text)
 FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.igr_regime_v13_third_final(text,uuid,text,text,text)
 TO anon,authenticated;

-- Keeps v52 results JSON shape. All results are only revealed once the
-- existing locking phase authorizes reveal to everybody.
CREATE OR REPLACE FUNCTION igr_private.igr_regime_v13_make_reveal(p_room text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $$
DECLARE
 r public.igr_v4_rooms%rowtype;m igr_private.igr_regime_v13_rooms%rowtype;
 a jsonb; levels jsonb; enq public.igr_v4_players%rowtype;
 third public.igr_v4_players%rowtype;
 player_row public.igr_v4_players%rowtype;
 e jsonb; result_rows jsonb:='[]'::jsonb;
 responsibilities jsonb:='[]'::jsonb;
 winners jsonb:='[]'::jsonb;
 levels_vote jsonb:='{}'::jsonb;
 own_vote jsonb; mission jsonb;act jsonb;
 own_actual text;actual_order text;
 captured integer:=0;accurate integer:=0;max_accurate integer:=0;
 truthful integer:=0;exact integer:=0; total integer:=0;true_level integer;guess_level integer;
 role_success boolean;third_success boolean:=false;is_accurate boolean;
 defense_obj jsonb;captured_partial boolean;judge_actions integer;
 tactical boolean;judicial boolean;whole boolean;
 text_out text; third_path text; own_actor text; response jsonb;
BEGIN
 SELECT * INTO r FROM public.igr_v4_rooms WHERE code=upper(trim(p_room));
 SELECT * INTO m FROM igr_private.igr_regime_v13_rooms WHERE room_code=r.code;
 IF NOT FOUND OR r.scenario_id NOT IN ('032','033','034') THEN
    RAISE EXCEPTION 'Regime private snapshot unavailable';END IF;
 IF r.phase NOT IN ('locking','reveal') THEN
    RAISE EXCEPTION 'regime results requested before final locking';END IF;
 SELECT * INTO enq FROM public.igr_v4_players WHERE room_code=r.code AND public_role='enqueteur' LIMIT 1;
 SELECT payload->'levels' INTO levels_vote FROM public.igr_v4_actions
  WHERE room_code=r.code AND player_id=enq.id AND action_type='final_lock'
  ORDER BY id DESC LIMIT 1;
 levels_vote:=coalesce(levels_vote,'{}'::jsonb);
 SELECT * INTO third FROM public.igr_v4_players
   WHERE room_code=r.code AND public_role='suspect' AND internal_slot=3 LIMIT 1;
 mission:=m.private_pack->'third_suspect_mission';
 third_path:=mission->>'assigned_path';
 own_actor:=m.private_pack->'private_cards'->2->>'actor_id';
 FOR player_row IN SELECT * FROM public.igr_v4_players
   WHERE room_code=r.code AND public_role='suspect' ORDER BY internal_slot LOOP
    true_level:=coalesce((m.private_pack->'canonical_truth'->'responsibility_by_slot'->>
      (player_row.internal_slot::text))::int,0);
    guess_level:=coalesce((levels_vote->>player_row.id::text)::int,-1);
    responsibilities:=responsibilities||jsonb_build_array(jsonb_build_object(
      'player_id',player_row.id,'pseudo',player_row.pseudo,
      'truth_level',true_level,'enqueteur_level',guess_level));
    total:=total+1;
    IF true_level=guess_level THEN exact:=exact+1;END IF;
 END LOOP;
 captured:=CASE WHEN m.play_state->'arrests' ?
   (m.private_pack->'private_cards'->0->>'actor_id') THEN 1 ELSE 0 END+
   CASE WHEN m.play_state->'arrests' ?
   (m.private_pack->'private_cards'->1->>'actor_id') THEN 1 ELSE 0 END;
 tactical:=captured=2;
 SELECT coalesce((m.play_state->'reconstructions'->enq.id::text->>'accurate')::int,0)
   INTO accurate;
 judicial:=accurate>=3;
 whole:=tactical AND judicial;
 IF third_path='cooperate' THEN
   SELECT x.value INTO act FROM jsonb_array_elements(m.private_pack->'acts') x
   WHERE x.value->>'id'=mission->>'target_act_id';
   actual_order:=act->>'orderedBy';
   own_actual:=CASE
       WHEN actual_order=own_actor THEN 'order'
       WHEN act->>'transmittedBy'=own_actor THEN 'transmission'
       WHEN act->>'executedBy'=own_actor THEN 'execution'
       WHEN act->>'knewAndControlledBy'=own_actor THEN 'knowledge'
       ELSE 'none' END;
   third_success:=coalesce((m.play_state->'third'->>'submitted')::boolean,false)
      AND coalesce((m.play_state->'third'->>'cycle')::int,99)<=2
      AND m.play_state->'third'->'final_declaration'->>'orderedBy'=actual_order
      AND m.play_state->'third'->'final_declaration'->>'ownParticipation'=own_actual;
 ELSE
   third_success:=coalesce((m.play_state->'third'->>'submitted')::boolean,false)
      AND coalesce((m.play_state->'third'->>'cycle')::int,99)<=2
      AND coalesce((levels_vote->>third.id::text)::int,-1) IN (0,1,2)
      AND (levels_vote->>third.id::text)::int <>
        (m.private_pack->'canonical_truth'->'responsibility_by_slot'->>'3')::int;
 END IF;
 FOR player_row IN SELECT * FROM public.igr_v4_players
   WHERE room_code=r.code ORDER BY seat_index LOOP
   role_success:=false;
   text_out:='Ta contribution à la reconstruction est évaluée sur les pièces.';
   IF player_row.public_role='suspect' AND player_row.internal_slot IN (1,2) THEN
     own_actor:=m.private_pack->'private_cards'->(player_row.internal_slot-1)->>'actor_id';
     defense_obj:=m.private_pack->'captured_defense_objectives'->own_actor;
     captured_partial:=false;
     IF m.play_state->'arrests' ? own_actor AND defense_obj IS NOT NULL THEN
       captured_partial:=EXISTS(SELECT 1 FROM
           jsonb_array_elements(coalesce(m.play_state->'captured_responses','[]'::jsonb)) x
           WHERE x->>'actor_id'=own_actor AND
             x->>'act_id'=defense_obj->>'act_id' AND
             x->>'claimed_orderer'=defense_obj->>'expected_ordered_by'
             AND (x->>'cycle')::integer BETWEEN 1 AND 3)
        AND coalesce((m.play_state->'reconstructions'->enq.id::text->
           'act_orders'->(defense_obj->>'act_id')->>'order_correct')::boolean,false)
        AND coalesce((m.play_state->'reconstructions'->enq.id::text->
           'act_orders'->(defense_obj->>'act_id')->>'supported')::boolean,false);
     END IF;
     role_success:=NOT (m.play_state->'arrests' ? own_actor) OR captured_partial;
     text_out:=CASE
       WHEN NOT (m.play_state->'arrests' ? own_actor) THEN
         'Tu as échappé à l arrestation. Cette réussite ne prouve pas ton innocence.'
       WHEN captured_partial THEN
         'Tu es capturé, mais le tribunal distingue correctement l auteur d un ordre précis que tu n as pas donné. C est une victoire personnelle limitée, pas un acquittement général.'
       ELSE
         'Tu es capturé et ta défense n a pas établi la non-attribution de l ordre visé. Tes autres responsabilités demeurent à examiner.' END;
   ELSIF player_row.public_role='suspect' AND player_row.internal_slot=3 THEN
     role_success:=third_success;
     text_out:=CASE WHEN role_success THEN
       'Tu as rempli les deux conditions de ta mission personnelle.'
       ELSE 'Tu n as pas rempli les deux conditions de ta mission personnelle.' END;
   ELSIF player_row.public_role IN ('enqueteur','analyste','procureur') THEN
     role_success:=whole;
     text_out:=CASE WHEN whole THEN
       'Les deux dirigeants sont capturés et au moins trois des quatre actes sont reconstitués correctement.'
       ELSE 'La victoire totale exige deux captures et au moins trois des quatre actes correctement reconstitués.' END;
   ELSIF player_row.public_role='juge' THEN
     SELECT count(*) INTO judge_actions FROM igr_private.igr_regime_v13_ledger ledger
       WHERE ledger.room_code=r.code AND ledger.actor_player=player_row.id
         AND ledger.action_kind IN ('judge_review','court_call','court_exchange');
     role_success:=coalesce((m.play_state->'court'->>'started')::boolean,false)
       AND judge_actions>0
       AND (SELECT count(*) FROM jsonb_array_elements(coalesce(m.play_state->'mandates','[]'::jsonb)) w
         WHERE w->>'status'='awaiting_judge')=0;
     text_out:=CASE WHEN role_success THEN
       'Tu as dirigé la procédure jusqu au tribunal, sans pouvoir modifier la vérité historique.'
       ELSE 'La procédure a laissé des décisions officielles sans résolution.' END;
   ELSIF player_row.public_role='temoin' THEN
     role_success:=true;text_out:='Ton témoignage reste vérifiable sans faire de toi un accusé.';
   ELSIF player_row.public_role='journaliste' THEN
     role_success:=true;text_out:='Le journal de Karsane a suivi les événements publics sans publier les secrets de l enquête.';
   END IF;
   IF role_success THEN winners:=winners||jsonb_build_array(player_row.id);END IF;
   result_rows:=result_rows||jsonb_build_array(jsonb_build_object(
    'player_id',player_row.id,'pseudo',player_row.pseudo,
    'role',player_row.public_role,'public_role',player_row.public_role,
    'success',role_success,'achievements','[]'::jsonb,'text',text_out));
 END LOOP;
 response:=jsonb_build_object(
  'title','RÉVÉLATION · LE RÉGIME',
  'summary',m.private_pack->'canonical_truth'->>'summary',
  'responsibilities',responsibilities,
  'results',result_rows,'winners',winners,
  'winner_count',jsonb_array_length(winners),
  'accuracy',jsonb_build_object('exact',exact,'total',total),
  'regime_verdict',jsonb_build_object(
    'captures',captured,'tactical',tactical,
    'judicial',judicial,'accurate_acts',accurate,
    'total_victory',whole,'third_suspect_win',third_success,
    'epilogue',CASE WHEN whole THEN
       m.private_pack->'canonical_truth'->'epilogue'->>'victory'
       ELSE m.private_pack->'canonical_truth'->'epilogue'->>'failure' END,
    'four_acts',m.private_pack->'acts')
 );
 RETURN response;
END $$;
REVOKE EXECUTE ON FUNCTION igr_private.igr_regime_v13_make_reveal(text)
 FROM PUBLIC,anon,authenticated;


-- supabase/candidates/igr_regime_v13_court_exchanges.sql
-- LE RÉGIME — v13 theatrical contradiction under Juge.
-- Trusted server controls 5-min confrontation stage, avoids unbounded chat
-- and does not let a procedural ruling change historical truths.

CREATE OR REPLACE FUNCTION public.igr_regime_v13_court_exchange(
 p_code text,p_player_token uuid,p_request_id text,
 p_kind text,p_message text,p_reply_to text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $$
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
 IF p_kind NOT IN ('question','objection','reply','ruling') THEN
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
 ELSE
  IF p.public_role NOT IN ('enqueteur','analyste','procureur','suspect')
   THEN RAISE EXCEPTION 'objection unavailable';END IF;
 END IF;
 IF p_kind<>'ruling' AND (length(btrim(coalesce(p_message,'')))<6
  OR length(p_message)>280) THEN RAISE EXCEPTION 'text must be 6 to 280 characters';END IF;
 exchanges:=coalesce(m.play_state->'court'->'exchanges','[]'::jsonb);
 SELECT count(*) INTO n FROM jsonb_array_elements(exchanges) e
 WHERE e->>'player_id'=p.id::text AND e->>'kind'<>'ruling';
 IF n>=5 AND p_kind<>'ruling' THEN RAISE EXCEPTION 'confrontation intervention quota exhausted';END IF;
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
END $$;
REVOKE EXECUTE ON FUNCTION public.igr_regime_v13_court_exchange(
 text,uuid,text,text,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.igr_regime_v13_court_exchange(
 text,uuid,text,text,text,text) TO anon,authenticated;


-- supabase/candidates/igr_regime_v14_court_pass.sql
-- LE RÉGIME v14 — opt-out of an automatically guaranteed defense turn.
-- Passing is never fabricated by the Judge; only the affected player can
-- submit it. The turn's time is fixed and the evidence remains intact.
CREATE OR REPLACE FUNCTION public.igr_regime_v14_pass_speech(
 p_code text,p_player_token uuid,p_request_id text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $$
DECLARE
 p public.igr_v4_players%rowtype;r public.igr_v4_rooms%rowtype;
 m igr_private.igr_regime_v13_rooms%rowtype;
 old igr_private.igr_regime_v13_ledger%rowtype;
 secs integer;slot_no integer;who text;elapsed integer;
 passes jsonb;result jsonb;state jsonb;
BEGIN
 SELECT * INTO p FROM public.igr_v4_players
 WHERE room_code=upper(trim(p_code)) AND player_token=p_player_token;
 IF NOT FOUND OR p.public_role<>'suspect' OR p.internal_slot NOT IN (1,2,3)
 THEN RAISE EXCEPTION 'suspect identity required';END IF;
 SELECT * INTO r FROM public.igr_v4_rooms WHERE code=p.room_code FOR UPDATE;
 SELECT * INTO m FROM igr_private.igr_regime_v13_rooms WHERE room_code=p.room_code FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'not in court';END IF;
 IF length(coalesce(p_request_id,'')) NOT BETWEEN 8 AND 128
 THEN RAISE EXCEPTION 'invalid request';END IF;
 SELECT * INTO old FROM igr_private.igr_regime_v13_ledger
 WHERE room_code=p.room_code AND request_id=p_request_id;
 IF FOUND THEN
  IF old.actor_player<>p.id OR old.action_kind<>'court_pass'
  THEN RAISE EXCEPTION 'request conflict';END IF;
  RETURN old.response;
 END IF;
 IF r.phase<>'regime_court' THEN RAISE EXCEPTION 'courtroom closed';END IF;
 secs:=CASE WHEN (m.play_state->'court'->>'duration_minutes')::integer=14
 THEN 120 ELSE 60 END;
 elapsed:=floor(extract(epoch FROM now()-
  (m.play_state->'court'->>'started_at')::timestamptz))::integer;
 IF elapsed<60 OR elapsed>=60+3*secs THEN
  RAISE EXCEPTION 'no active defense statement window';END IF;
 slot_no:=(elapsed-60)/secs;
 who:=m.private_pack->'private_cards'->slot_no->>'actor_id';
 IF who IS DISTINCT FROM
    m.private_pack->'private_cards'->(p.internal_slot-1)->>'actor_id'
 THEN RAISE EXCEPTION 'this is not your assigned statement slot';END IF;
 IF p.internal_slot IN (1,2) AND NOT (m.play_state->'arrests' ? who)
 THEN RAISE EXCEPTION 'a free fugitive cannot appear in court';END IF;
 passes:=coalesce(m.play_state->'court'->'passes','[]'::jsonb);
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(passes) e
   WHERE e->>'actor_id'=who AND (e->>'slot')::integer=slot_no)
 THEN RAISE EXCEPTION 'statement already passed';END IF;
 passes:=passes||jsonb_build_array(jsonb_build_object(
   'actor_id',who,'player_id',p.id::text,'slot',slot_no,'at',now()));
 state:=jsonb_set(m.play_state,ARRAY['court','passes'],passes,true);
 UPDATE igr_private.igr_regime_v13_rooms SET play_state=state WHERE room_code=m.room_code;
 result:=jsonb_build_object('ok',true,'passed',true,'actor_id',who);
 INSERT INTO igr_private.igr_regime_v13_ledger
 (room_code,request_id,actor_player,action_kind,cycle,response)
 VALUES(m.room_code,p_request_id,p.id,'court_pass',r.cycle,result);
 RETURN result;
END $$;
REVOKE EXECUTE ON FUNCTION public.igr_regime_v14_pass_speech(text,uuid,text)
 FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.igr_regime_v14_pass_speech(text,uuid,text)
 TO anon,authenticated;


-- supabase/candidates/igr_regime_v13_lifecycle_patch.sql
-- LE RÉGIME v13 — opt-in integration with the CURRENT v4/v52 runtime.
-- This candidate is a snapshot of the exact existing functions + tightly
-- scoped release-gated branches; all other scenarios follow legacy logic.
-- APPLY only after v13_private_runtime.sql, v13_judicial_runtime.sql,
-- v13_final_scoring.sql, private manuscripts approved and full QA.
-- DO NOT deploy while release flag is false/unreviewed.
-- PATCH igr_v4_min_players
CREATE OR REPLACE FUNCTION public.igr_v4_min_players(p_scenario text)
 RETURNS integer
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
 select case
 when p_scenario in ('032','033','034') and igr_private.igr_regime_v13_release_eligible() then 6
 when p_scenario='029' and igr_private.igr_v108_029_is_enabled() then 6
 when p_scenario between '035' and '039' then 5
 when p_scenario between '040' and '044' then 7
 when p_scenario in ('021','022','023','024','025') then 4
 when p_scenario in ('026','027','028') then 6 /* v703 terror six-person minimum */
 when p_scenario='029' then 5 when p_scenario='030' then 7 when p_scenario='031' then 6
 when p_scenario='032' then 6 when p_scenario='033' then 6 when p_scenario='034' then 7
 when p_scenario in ('001','003','004','005','006') then 4
 when p_scenario='002' then 5
 when p_scenario in ('007','008','009','010','011','012','013','014','015','016') then 5
 when p_scenario='017' then 7 when p_scenario='018' then 6 when p_scenario='019' then 9 when p_scenario='020' then 13 else 5 end
$function$
;

-- PATCH igr_v4_max_players
CREATE OR REPLACE FUNCTION public.igr_v4_max_players(p_scenario text)
 RETURNS integer
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
 select case
 when p_scenario IN ('032','033','034') AND igr_private.igr_regime_v13_release_eligible() THEN 7
 when p_scenario='029' and igr_private.igr_v108_029_is_enabled() then 11
 when p_scenario between '035' and '039' then 7
 when p_scenario between '040' and '044' then 7
 when p_scenario in ('021','022','023','024','025') then 8
 when p_scenario in ('026','027','028') then 6 /* v703 terror six-person maximum */
 when p_scenario='029' then 8 when p_scenario='030' then 9 when p_scenario='031' then 8
 when p_scenario='032' then 8 when p_scenario='033' then 8 when p_scenario='034' then 9
 when p_scenario in ('001','004','005','006') then 5
 when p_scenario in ('003','008','009','011') then 6
 when p_scenario='002' then 6
 when p_scenario in ('007','010','012') then 5
 when p_scenario in ('013','014') then 6 when p_scenario='015' then 7 when p_scenario='016' then 9
 when p_scenario='017' then 10 when p_scenario='018' then 9 when p_scenario='019' then 9 when p_scenario='020' then 16 else 5 end
$function$
;

-- PATCH igr_v4_role_for_seat
CREATE OR REPLACE FUNCTION public.igr_v4_role_for_seat(p_scenario text, p_seat integer, p_count integer)
 RETURNS text
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
begin
 if p_scenario in ('032','033','034') AND igr_private.igr_regime_v13_release_eligible() then
   if p_count<6 OR p_count>public.igr_v4_max_players(p_scenario)
     OR p_seat<0 OR p_seat>=p_count THEN
       raise exception 'Regime requires six players, or seven with prosecutor';
   end if;
   return (array['enqueteur','analyste','juge','suspect','suspect','suspect','procureur']::text[])[p_seat+1];
 end if;
 if p_scenario='029' and igr_private.igr_v108_029_is_enabled() then
   if p_count not between 6 and 11 then raise exception 'four witness roster requires 6 to 11 participants'; end if;
   return (array['enqueteur','analyste','suspect','suspect','suspect','suspect','procureur','juge','journaliste','don','bras_droit'])[p_seat+1];
 end if;
 if p_scenario between '035' and '039' then
   if p_count=5 then return (array['enqueteur','analyste','suspect','suspect','suspect'])[p_seat+1];
   elsif p_count=6 then return (array['enqueteur','analyste','expert','suspect','suspect','suspect'])[p_seat+1];
   else return (array['enqueteur','analyste','expert','procureur','suspect','suspect','suspect'])[p_seat+1]; end if;
 elsif p_scenario between '040' and '044' then
   return (array['enqueteur','analyste','maitre','suspect','suspect','suspect','suspect'])[p_seat+1];
 elsif p_scenario in ('026','027','028') then
   -- v703 terror six-person roster
   if p_count<>6 or p_seat not between 0 and 5 then raise exception 'TERREUR requires exactly six players'; end if;
   return (array['enqueteur','analyste','officier_liaison','suspect','suspect','suspect']::text[])[p_seat+1];
 elsif p_scenario='029' then
   if p_count=5 then return (array['enqueteur','analyste','suspect','suspect','suspect'])[p_seat+1];
   elsif p_count=6 then return (array['enqueteur','analyste','maitre','suspect','suspect','suspect'])[p_seat+1];
   elsif p_count=7 then return (array['enqueteur','analyste','maitre','procureur','suspect','suspect','suspect'])[p_seat+1];
   else return (array['enqueteur','analyste','maitre','procureur','maitre','suspect','suspect','suspect'])[p_seat+1]; end if;
 elsif p_scenario='030' then
   if p_count=7 then return (array['enqueteur','analyste','procureur','juge','suspect','suspect','suspect'])[p_seat+1]; elsif p_count=8 then return (array['enqueteur','analyste','procureur','juge','maitre','suspect','suspect','suspect'])[p_seat+1]; else return (array['enqueteur','analyste','procureur','juge','maitre','journaliste','suspect','suspect','suspect'])[p_seat+1]; end if;
 elsif p_scenario='031' then
   if p_count=6 then return (array['enqueteur','analyste','maitre','suspect','suspect','suspect'])[p_seat+1]; elsif p_count=7 then return (array['enqueteur','analyste','maitre','procureur','suspect','suspect','suspect'])[p_seat+1]; else return (array['enqueteur','analyste','maitre','procureur','temoin','suspect','suspect','suspect'])[p_seat+1]; end if;
 elsif p_scenario='032' then
   if p_count=6 then return (array['enqueteur','analyste','procureur','suspect','suspect','suspect'])[p_seat+1]; elsif p_count=7 then return (array['enqueteur','analyste','procureur','juge','suspect','suspect','suspect'])[p_seat+1]; else return (array['enqueteur','analyste','procureur','juge','temoin','suspect','suspect','suspect'])[p_seat+1]; end if;
 elsif p_scenario='033' then
   if p_count=6 then return (array['enqueteur','analyste','juge','suspect','suspect','suspect'])[p_seat+1]; elsif p_count=7 then return (array['enqueteur','analyste','juge','procureur','suspect','suspect','suspect'])[p_seat+1]; else return (array['enqueteur','analyste','juge','procureur','temoin','suspect','suspect','suspect'])[p_seat+1]; end if;
 elsif p_scenario='034' then
   if p_count=7 then return (array['enqueteur','analyste','procureur','juge','suspect','suspect','suspect'])[p_seat+1]; elsif p_count=8 then return (array['enqueteur','analyste','procureur','juge','temoin','suspect','suspect','suspect'])[p_seat+1]; else return (array['enqueteur','analyste','procureur','juge','temoin','journaliste','suspect','suspect','suspect'])[p_seat+1]; end if;
 
elsif p_scenario='003' then
   if p_count=6 then return (array['enqueteur','analyste','suspect','suspect','suspect','expert'])[p_seat+1];
   elsif p_count=5 then return (array['enqueteur','analyste','suspect','suspect','suspect'])[p_seat+1];
   else return (array['enqueteur','suspect','suspect','suspect'])[p_seat+1]; end if;
 elsif p_scenario in ('001','004','005','006') then
   if p_seat=0 then return 'enqueteur'; elsif p_count=5 and p_seat=1 then return 'analyste'; else return 'suspect'; end if;
 elsif p_scenario='002' then
   if p_seat=0 then return 'enqueteur'; elsif p_count=6 and p_seat=1 then return 'analyste'; else return 'suspect'; end if;
 
elsif p_scenario in ('007','010','012') then return (array['enqueteur','analyste','suspect','suspect','suspect'])[p_seat+1];
 elsif p_scenario='008' then return (array['enqueteur','analyste','suspect','suspect','suspect','juge'])[p_seat+1];
 elsif p_scenario='009' then return (array['enqueteur','analyste','suspect','suspect','suspect','expert'])[p_seat+1];
 elsif p_scenario='011' then return (array['enqueteur','analyste','suspect','suspect','suspect','procureur'])[p_seat+1];
 elsif p_scenario='013' then return (array['enqueteur','analyste','suspect','suspect','suspect','procureur'])[p_seat+1];
 elsif p_scenario='014' then return (array['enqueteur','analyste','suspect','suspect','suspect','juge'])[p_seat+1];
 elsif p_scenario='015' then return (array['enqueteur','analyste','suspect','suspect','suspect','journaliste','juge'])[p_seat+1];
 elsif p_scenario='016' then return (array['enqueteur','analyste','suspect','suspect','suspect','maitre','journaliste','juge','expert'])[p_seat+1];
 elsif p_scenario='017' then return (array['enqueteur','analyste','procureur','suspect','suspect','suspect','temoin','temoin','maitre','expert'])[p_seat+1];
 elsif p_scenario='018' then return (array['enqueteur','analyste','inspecteur','suspect','suspect','suspect','expert','maitre','journaliste'])[p_seat+1];
 elsif p_scenario='019' then return (array['enqueteur','analyste','procureur','juge','journaliste','maitre','suspect','suspect','suspect'])[p_seat+1];
 elsif p_scenario='020' then return (array['enqueteur','analyste','inspecteur','procureur','juge','expert','suspect','suspect','suspect','suspect','maitre','journaliste','temoin','maitre','journaliste','temoin'])[p_seat+1];
 end if;
 return 'suspect';
end
$function$
;

-- PATCH igr_v4_start_game
CREATE OR REPLACE FUNCTION public.igr_v4_start_game(p_code text, p_host_token uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  r public.igr_v4_rooms%rowtype;
  c int;
  p public.igr_v4_players%rowtype;
  spy_id uuid;
  idx int;
  roles text[] := array[]::text[];
  rr text;
  match_no int;
  auto_assigned int := 0;
begin
  select * into r
  from public.igr_v4_rooms
  where code = upper(trim(p_code)) and host_token = p_host_token
  for update;
  if not found then raise exception 'unauthorized'; end if;
  if r.status <> 'lobby' then raise exception 'already started'; end if;
  -- v170 relation reset
  delete from public.igr_v43_lawyer_representations where room_code=r.code;
  delete from public.igr_v43_lawyer_requests where room_code=r.code;
  delete from public.igr_v44_lawyer_consultations where room_code=r.code;
  delete from public.igr_v45_lawyer_dismissals where room_code=r.code;


  select count(*) into c
  from public.igr_v4_players
  where room_code = r.code;
  if c > public.igr_v4_max_players(r.scenario_id) then raise exception 'too many players'; end if;
  if c < public.igr_v4_min_players(r.scenario_id) then raise exception 'not enough players'; end if;

  /* IGR_V181_001_SNAPSHOT_igr_v4_start_game */ if r.scenario_id='001' then if coalesce((igr_private.igr_v183_001_release_status()->>'release_eligible')::boolean,false) is not true then raise exception '001 verified narrative release unavailable'; end if; if not igr_private.igr_v183_001_pin_room_canon(r.code) then raise exception '001 randomized snapshot not available'; end if; end if;
  /* IGR_V202_002_PIN_BEFORE_ROLES */ if r.scenario_id='002' then
    if coalesce((igr_private.igr_v202_002_release_status()->>'release_eligible')::boolean,false) is not true
      then raise exception '002 narrative release blocked'; end if;
    if not igr_private.igr_v202_002_pin_room(r.code)
      then raise exception '002 verified random snapshot unavailable'; end if;
   end if;
  /* IGR_003_V221_PIN_SNAPSHOT */
  if r.scenario_id='003' then
    if coalesce((igr_private.igr_v221_003_release_status()->>'release_eligible')::boolean,false) is not true
      then raise exception '003 editorial security gate rejected';end if;
    if not igr_private.igr_v221_003_pin_room(r.code) then raise exception '003 snapshot unavailable';end if;
  end if;
  if r.scenario_id='004' then
  if coalesce((igr_private.igr_v231_004_release_status()->>'release_eligible')::boolean,false) is not true then raise exception '004 unavailable';end if;
  if not igr_private.igr_v231_004_pin_room(r.code) then raise exception '004 snapshot unavailable';end if;
  end if;
  if r.scenario_id='005' then
   if coalesce((igr_private.igr_v251_005_release_status()->>'release_eligible')::boolean,false) is not true then raise exception '005 release unavailable';end if;
   if not igr_private.igr_v251_005_pin_room(r.code) then raise exception '005 immutable snapshot unavailable';end if;
  end if;
 if r.scenario_id='006' then
 if coalesce((igr_private.igr_v261_006_release_status()->>'release_eligible')::boolean,false) is not true then raise exception '006 unavailable';end if;
 if not igr_private.igr_v261_006_pin_room(r.code) then raise exception '006 snapshot unavailable';end if;
 end if;
  if r.scenario_id='007' then
    if coalesce((igr_private.igr_v281_007_release_status()->>'eligible')::boolean,false) is not true then raise exception '007 variants incomplete: game cannot start';end if;
    if not igr_private.igr_v281_007_pin_room(r.code) then raise exception '007 private canonical snapshot unavailable';end if;
  end if;
  if r.scenario_id='008' then
    if coalesce((igr_private.igr_v301_008_release_status()->>'eligible')::boolean,false) is not true then raise exception '008 gated';end if;
    if not igr_private.igr_v301_008_pin_room(r.code) then raise exception '008 snapshot unavailable';end if;
  end if;
  if r.scenario_id='009' then
    if coalesce((igr_private.igr_v331_009_release_status()->>'eligible')::boolean,false) is not true then raise exception '009 gated';end if;
    if not igr_private.igr_v331_009_pin_room(r.code) then raise exception '009 snapshot unavailable';end if;
  end if;
  if r.scenario_id='010' then
    if coalesce((igr_private.igr_v351_010_release_status()->>'eligible')::boolean,false) is not true then raise exception '010 gated';end if;
    if not igr_private.igr_v351_010_pin_room(r.code) then raise exception '010 snapshot unavailable';end if;
  end if;
  if r.scenario_id='011' then
    if coalesce((igr_private.igr_v371_011_release_status()->>'eligible')::boolean,false) is not true then raise exception '011 gated';end if;
    if not igr_private.igr_v371_011_pin_room(r.code) then raise exception '011 snapshot unavailable';end if;
  end if;
  if r.scenario_id='012' then
    if coalesce((igr_private.igr_v391_012_release_status()->>'eligible')::boolean,false) is not true then raise exception '012 gated';end if;
    if not igr_private.igr_v391_012_pin_room(r.code) then raise exception '012 snapshot unavailable';end if;
  end if;
  if r.scenario_id='013' then
    if coalesce((igr_private.igr_v411_013_release_status()->>'eligible')::boolean,false) is not true then raise exception '013 gated';end if;
    if not igr_private.igr_v411_013_pin_room(r.code) then raise exception '013 snapshot unavailable';end if;
  end if;
  if r.scenario_id='014' then
    if coalesce((igr_private.igr_v431_014_release_status()->>'eligible')::boolean,false) is not true then raise exception '014 gated';end if;
    if not igr_private.igr_v431_014_pin_room(r.code) then raise exception '014 snapshot unavailable';end if;
  end if;
  if r.scenario_id='015' then
    if coalesce((igr_private.igr_v451_015_release_status()->>'eligible')::boolean,false) is not true then raise exception '015 gated';end if;
    if not igr_private.igr_v451_015_pin_room(r.code) then raise exception '015 snapshot unavailable';end if;
  end if;
  if r.scenario_id='020' then if not igr_private.igr_v601_020_pin_room(r.code) then raise exception '020 private dossier unavailable';end if;end if; if r.scenario_id='019' then if not igr_private.igr_v571_019_pin_room(r.code) then raise exception '019 variant unavailable';end if;end if; if r.scenario_id='018' then if not igr_private.igr_v541_018_pin_room(r.code) then raise exception '018 sealed variant unavailable';end if;end if; if r.scenario_id='017' then if not igr_private.igr_v521_017_pin_room(r.code) then raise exception '017 unavailable'; end if; end if; if r.scenario_id='016' then
    if coalesce((igr_private.igr_v481_016_release_status()->>'eligible')::boolean,false) is not true then raise exception '016 gated';end if;
    if not igr_private.igr_v481_016_pin_room(r.code) then raise exception '016 snapshot unavailable';end if;
  end if;
  if r.scenario_id in ('026','027','028') then if not igr_private.igr_v695_pin_room(r.code) then raise exception 'TERREUR variants unavailable';end if;end if;
  IF r.scenario_id IN ('032','033','034')
      AND igr_private.igr_regime_v13_release_eligible() THEN
     IF NOT igr_private.igr_regime_v13_pin(r.code) THEN
       RAISE EXCEPTION 'Regime private candidate cannot be pinned';
     END IF;
  END IF;
  for idx in 0..c - 1 loop
    roles := array_append(roles, public.igr_v4_role_for_seat(r.scenario_id, idx, c));
  end loop;

  -- Keep every explicit choice, but remove it from the pool exactly once.
  for p in
    select * from public.igr_v4_players
    where room_code = r.code and preferred_role is not null
    order by seat_index
  loop
    idx := array_position(roles, p.preferred_role);
    if idx is null then
      raise exception 'chosen roles do not match scenario composition';
    end if;
    roles := coalesce(roles[1:idx - 1], array[]::text[])
          || coalesce(roles[idx + 1:array_length(roles, 1)], array[]::text[]);
  end loop;

  -- Players who did not choose receive one of the remaining valid public roles.
  -- Both the players and role slots are shuffled, so no seat has priority.
  for p in
    select * from public.igr_v4_players
    where room_code = r.code and preferred_role is null
    order by gen_random_uuid()
  loop
    if coalesce(array_length(roles, 1), 0) = 0 then
      raise exception 'role allocation failed';
    end if;
    idx := 1 + floor(random() * array_length(roles, 1))::int;
    rr := roles[idx];
    roles := coalesce(roles[1:idx - 1], array[]::text[])
          || coalesce(roles[idx + 1:array_length(roles, 1)], array[]::text[]);
    update public.igr_v4_players
    set preferred_role = rr
    where id = p.id;
    auto_assigned := auto_assigned + 1;
  end loop;

  if coalesce(array_length(roles, 1), 0) <> 0 then
    raise exception 'role allocation failed';
  end if;

  update public.igr_v4_players
  set public_role = preferred_role,
      secret_role = preferred_role,
      ready = false
  where room_code = r.code;

  with ranked as (
    select id, row_number() over (order by gen_random_uuid())::int as slot
    from public.igr_v4_players
    where room_code = r.code and public_role = 'suspect'
  )
  update public.igr_v4_players x
  set internal_slot = ranked.slot
  from ranked
  where x.id = ranked.id;

  if r.scenario_id in ('013','014','016','019','020') then
    select id into spy_id
    from public.igr_v4_players
    where room_code = r.code and public_role = 'suspect'
    order by gen_random_uuid()
    limit 1;
    if spy_id is not null then
      update public.igr_v4_players set secret_role = 'espion' where id = spy_id;
    end if;
  end if;

  for p in select * from public.igr_v4_players where room_code = r.code loop
    update public.igr_v4_players
    set private_state = public.igr_v4_build_private_card(r.code, p.id)
    where id = p.id;
  end loop;

  match_no := greatest(1, coalesce((r.state->>'match_no')::int, 1));
  update public.igr_v4_rooms
  set status = 'playing',
      cycle = 0,
      phase = 'briefing',
      phase_started_at = now(),
      phase_ends_at = now() + interval '28 seconds',
      state = jsonb_build_object(
        'match_no', match_no,
        'heard', '[]'::jsonb,
        'used_trames', '{}'::jsonb,
        'used_news', '{}'::jsonb,
        'annex_queue', '[]'::jsonb,
        'annex_index', 0,
        'video_active', false,
        'video_cut_until', null,
        'regime_v13_active', (r.scenario_id IN ('032','033','034')
         AND igr_private.igr_regime_v13_release_eligible()
         AND EXISTS(SELECT 1 FROM igr_private.igr_regime_v13_rooms WHERE room_code=r.code))
      ),
      updated_at = now()
  where code = r.code;

  insert into public.igr_v4_events(room_code, event_type, payload)
  select r.code, 'context', jsonb_build_object('title','CONTEXTE','text',case when r.scenario_id IN ('032','033','034')
   AND EXISTS(SELECT 1 FROM igr_private.igr_regime_v13_rooms WHERE room_code=r.code)
   THEN (SELECT private_pack->>'public_briefing' FROM igr_private.igr_regime_v13_rooms WHERE room_code=r.code)
   when r.scenario_id='003' then coalesce(igr_private.igr_v220_003_pinned_pack(r.code)->>'context',x.pack->>'context') else x.pack->>'context' end) /* IGR003_PUBLIC_BRIEFING_V232 */
  from public.igr_v4_scenario_packs x
  where x.scenario_id = r.scenario_id;
  insert into public.igr_v4_events(room_code, event_type, payload)
  values (
    r.code,
    'phase',
    jsonb_build_object(
      'title','BRIEFING DU DOSSIER',
      'text','La musique du lobby s’arrête. Le contexte public est affiché avant la lecture des cartes privées.',
      'auto_assigned_roles', auto_assigned
    )
  );

  perform igr_private.igr_v169_assign_cartel_lawyer(r.code);
  return jsonb_build_object('ok', true, 'auto_assigned_roles', auto_assigned);
end
$function$
;

-- PATCH igr_v4_build_private_card
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
 RETURN public.igr_v4_generic_role_card(p.public_role,pack->>'public_briefing')||
   jsonb_build_object('context',pack->>'public_briefing');
END IF;
 /* IGR_V181_001_SNAPSHOT_igr_v4_build_private_card */ if r.scenario_id='001' then pack:=coalesce(igr_private.igr_v181_001_pinned_game_pack(r.code),pack); end if; /* IGR_V202_002_PINNED_READ */ if r.scenario_id='002' then pack:=coalesce(igr_private.igr_v201_002_pinned_game_pack(r.code),pack); end if; /* IGR_003_V221_READER */ if r.scenario_id='003' then pack:=coalesce(igr_private.igr_v220_003_pinned_pack(r.code),pack);end if; if r.scenario_id='004' then pack:=coalesce(igr_private.igr_v230_004_pinned_pack(r.code),pack);end if; if r.scenario_id='005' then pack:=coalesce(igr_private.igr_v250_005_pinned_pack(r.code),pack);end if; if r.scenario_id='006' then pack:=coalesce(igr_private.igr_v260_006_pinned_pack(r.code),pack);end if; if r.scenario_id='007' then pack:=coalesce(igr_private.igr_v281_007_pinned_pack(r.code),pack);end if; if r.scenario_id='008' then pack:=igr_private.igr_v301_008_pinned_pack(r.code);if pack is null then raise exception '008 private snapshot missing';end if;end if; if r.scenario_id='009' then pack:=igr_private.igr_v331_009_pinned_pack(r.code);if pack is null then raise exception '009 private snapshot missing';end if;end if; if r.scenario_id='010' then pack:=igr_private.igr_v351_010_pinned_pack(r.code);if pack is null then raise exception '010 private snapshot missing';end if;end if; if r.scenario_id='011' then pack:=igr_private.igr_v371_011_pinned_pack(r.code);if pack is null then raise exception '011 private snapshot missing';end if;end if; if r.scenario_id='012' then pack:=igr_private.igr_v391_012_pinned_pack(r.code);if pack is null then raise exception '012 private snapshot missing';end if;end if; if r.scenario_id='013' then pack:=igr_private.igr_v411_013_pinned_pack(r.code);if pack is null then raise exception '013 private snapshot missing';end if;end if; if r.scenario_id='014' then pack:=igr_private.igr_v431_014_pinned_pack(r.code);if pack is null then raise exception '014 private snapshot missing';end if;end if; if r.scenario_id='015' then pack:=igr_private.igr_v451_015_pinned_pack(r.code);if pack is null then raise exception '015 private snapshot missing';end if;end if; if r.scenario_id='016' then pack:=igr_private.igr_v481_016_pinned_pack(r.code);if pack is null then raise exception '016 private snapshot missing';end if;end if; if r.scenario_id='017' then pack:=igr_private.igr_v521_017_pinned_pack(r.code);if pack is null then raise exception '017 private snapshot missing';end if;end if; if r.scenario_id='018' then pack:=igr_private.igr_v541_018_pinned_pack(r.code);if pack is null then raise exception '018 private snapshot missing';end if;end if; if r.scenario_id='019' then pack:=igr_private.igr_v571_019_pinned_pack(r.code);if pack is null then raise exception '019 private snapshot missing';end if;end if; if r.scenario_id='020' then pack:=igr_private.igr_v601_020_pinned_pack(r.code);if pack is null then raise exception '020 private snapshot missing';end if;end if; if r.scenario_id in ('026','027','028') then pack:=coalesce(igr_private.igr_v695_pinned_pack(r.code),pack);end if; if p.public_role='suspect' then base:=coalesce(pack->'suspects'->greatest(0,p.internal_slot-1),'{}'::jsonb); for rel in select value from jsonb_array_elements(coalesce(pack->'relations'->p.internal_slot::text,'[]'::jsonb)) loop select * into q from public.igr_v4_players where room_code=r.code and public_role='suspect' and internal_slot=(rel->>'slot')::int; if found then rels:=rels||jsonb_build_array(jsonb_build_object('pseudo',q.pseudo,'text',rel->>'text')); end if; end loop; base:=jsonb_set(base,'{relations}',rels,true); else base:=public.igr_v4_generic_role_card(p.public_role,pack->>'context'); role_note:=coalesce(pack->'role_notes'->p.public_role,'{}'::jsonb); base:=base||role_note; if p.public_role='temoin' then select count(*) into widx from public.igr_v4_players w where w.room_code=r.code and w.public_role='temoin' and w.seat_index<=p.seat_index; base:=base||coalesce(pack->'witnesses'->greatest(0,widx-1),'{}'::jsonb); end if; end if; if p.secret_role='espion' then base:=base||jsonb_build_object('secret_mission',coalesce(pack->>'espion_mission','Observe et détourne sans inventer de preuve.')); end if; return base; end $function$
;

-- PATCH igr_v4_emit_trame
CREATE OR REPLACE FUNCTION public.igr_v4_emit_trame(p_room text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_room public.igr_v4_rooms%rowtype;
  v_pack jsonb;
  v_used jsonb;
  v_wanted text := 'balanced';
  v_focus_axis text := '';
  v_prior_conv numeric := null;
  v_prior_conf numeric := null; v_prior_accuracy integer := null;
  v_trend text := 'stable';
  v_selected_trame jsonb := null;
  v_chosen_idx int := null;
  v_chosen_axis text := '';
  v_last_axis text := '';
  v_last_kind text := '';
  v_conv numeric := 1;
  v_conf numeric := 1;
  v_conv_min int := 1;
  v_conv_max int := 1;
  v_conf_min int := 1;
  v_conf_max int := 1;
  v_responders int := 0;
  v_strong int := 0;
  v_field_count int := 0;
  v_expert_count int := 0;
  v_judge_count int := 0;
  v_news_count int := 0;
begin
  select rr.* into v_room
  from public.igr_v4_rooms rr
  where rr.code = p_room
  for update;
  if not found then return; end if;
  IF v_room.scenario_id IN ('032','033','034')
   AND coalesce((v_room.state->>'regime_v13_active')::boolean,false) THEN
    INSERT INTO public.igr_v4_events(room_code,event_type,visibility,audience_roles,payload)
    SELECT v_room.code,'trame','roles',ARRAY['enqueteur','analyste','juge','procureur']::text[],
     jsonb_build_object('id',e.value->>'id','title',e.value->>'title',
       'text',e.value->>'text','cycle',v_room.cycle,'source','Registre de Karsane')
    FROM igr_private.igr_regime_v13_rooms rp,
         LATERAL jsonb_array_elements(rp.private_pack->'revelations') e
    WHERE rp.room_code=v_room.code AND e.value->>'kind'='guaranteed'
      AND (e.value->>'min_cycle')::integer=v_room.cycle
      AND NOT EXISTS(SELECT 1 FROM public.igr_v4_events old
       WHERE old.room_code=v_room.code AND old.event_type='trame'
         AND old.payload->>'id'=e.value->>'id');
    RETURN;
  END IF;
  -- v171 031 scheduled evidence
  if v_room.scenario_id='031' and exists(select 1 from igr_private.igr_v171_031_matches where room_code=p_room) then return; end if;
  if v_room.scenario_id='029' and igr_private.igr_v108_029_is_enabled() then return; end if;

  select sp.pack into v_pack
  from public.igr_v4_scenario_packs sp
  where sp.scenario_id = v_room.scenario_id; /* IGR_V181_001_SNAPSHOT_igr_v4_emit_trame */ if v_room.scenario_id='001' then v_pack:=coalesce(igr_private.igr_v181_001_pinned_game_pack(v_room.code),v_pack); end if; /* IGR_V202_002_PINNED_READ */ if v_room.scenario_id='002' then v_pack:=coalesce(igr_private.igr_v201_002_pinned_game_pack(v_room.code),v_pack); end if; /* IGR_003_V221_READER */ if v_room.scenario_id='003' then v_pack:=coalesce(igr_private.igr_v220_003_pinned_pack(v_room.code),v_pack);end if; if v_room.scenario_id='004' then v_pack:=coalesce(igr_private.igr_v230_004_pinned_pack(v_room.code),v_pack);end if; if v_room.scenario_id='005' then v_pack:=coalesce(igr_private.igr_v250_005_pinned_pack(v_room.code),v_pack);end if; if v_room.scenario_id='006' then v_pack:=coalesce(igr_private.igr_v260_006_pinned_pack(v_room.code),v_pack);end if; if v_room.scenario_id='007' then v_pack:=coalesce(igr_private.igr_v281_007_pinned_pack(v_room.code),v_pack);end if; if v_room.scenario_id='008' then v_pack:=igr_private.igr_v301_008_pinned_pack(v_room.code);if v_pack is null then raise exception '008 private snapshot missing';end if;end if; if v_room.scenario_id='009' then v_pack:=igr_private.igr_v331_009_pinned_pack(v_room.code);if v_pack is null then raise exception '009 private snapshot missing';end if;end if; if v_room.scenario_id='010' then v_pack:=igr_private.igr_v351_010_pinned_pack(v_room.code);if v_pack is null then raise exception '010 private snapshot missing';end if;end if; if v_room.scenario_id='011' then v_pack:=igr_private.igr_v371_011_pinned_pack(v_room.code);if v_pack is null then raise exception '011 private snapshot missing';end if;end if; if v_room.scenario_id='012' then v_pack:=igr_private.igr_v391_012_pinned_pack(v_room.code);if v_pack is null then raise exception '012 private snapshot missing';end if;end if; if v_room.scenario_id='013' then v_pack:=igr_private.igr_v411_013_pinned_pack(v_room.code);if v_pack is null then raise exception '013 private snapshot missing';end if;end if; if v_room.scenario_id='014' then v_pack:=igr_private.igr_v431_014_pinned_pack(v_room.code);if v_pack is null then raise exception '014 private snapshot missing';end if;end if; if v_room.scenario_id='015' then v_pack:=igr_private.igr_v451_015_pinned_pack(v_room.code);if v_pack is null then raise exception '015 private snapshot missing';end if;end if; if v_room.scenario_id='016' then v_pack:=igr_private.igr_v481_016_pinned_pack(v_room.code);if v_pack is null then raise exception '016 private snapshot missing';end if;end if; if v_room.scenario_id='017' then v_pack:=igr_private.igr_v521_017_pinned_pack(v_room.code);if v_pack is null then raise exception '017 private snapshot missing';end if;end if; if v_room.scenario_id='018' then v_pack:=igr_private.igr_v541_018_pinned_pack(v_room.code);if v_pack is null then raise exception '018 private snapshot missing';end if;end if; if v_room.scenario_id='019' then v_pack:=igr_private.igr_v571_019_pinned_pack(v_room.code);if v_pack is null then raise exception '019 private snapshot missing';end if;end if; if v_room.scenario_id='020' then v_pack:=igr_private.igr_v601_020_pinned_pack(v_room.code);if v_pack is null then raise exception '020 private snapshot missing';end if;end if; if v_room.scenario_id='020' then perform igr_private.igr_v620_020_emit_evidence(v_room.code);return;end if;

  if v_room.scenario_id in ('026','027','028') then v_pack:=coalesce(igr_private.igr_v695_pinned_pack(v_room.code),v_pack);perform igr_private.igr_v695_emit_guaranteed(v_room.code,v_room.cycle);end if;
  v_used := coalesce(v_room.state->'used_trames','{}'::jsonb);

  select
    coalesce(avg(coalesce((a.payload->>'convergence')::int,1)),1),
    coalesce(avg(coalesce((a.payload->>'confusion')::int,1)),1),
    coalesce(min(coalesce((a.payload->>'convergence')::int,1)),1),
    coalesce(max(coalesce((a.payload->>'convergence')::int,1)),1),
    coalesce(min(coalesce((a.payload->>'confusion')::int,1)),1),
    coalesce(max(coalesce((a.payload->>'confusion')::int,1)),1),
    count(*)::int
  into v_conv,v_conf,v_conv_min,v_conv_max,v_conf_min,v_conf_max,v_responders
  from public.igr_v4_actions a
  where a.room_code=v_room.code and a.cycle=v_room.cycle and a.action_type='debrief';

  -- End-cycle votes signal which prewritten revelation is helpful, not what is true.
  select coalesce(a.payload->>'axis','') into v_focus_axis
  from public.igr_v4_actions a
  where a.room_code=v_room.code and a.cycle=v_room.cycle and a.action_type='debrief'
    and a.payload->>'axis' in ('chronologie','acces','mobile','materiel','responsabilite')
  group by a.payload->>'axis'
  order by count(*) desc, a.payload->>'axis' asc limit 1;
  select avg((a.payload->>'convergence')::numeric),avg((a.payload->>'confusion')::numeric)
  into v_prior_conv,v_prior_conf
  from public.igr_v4_actions a
  where a.room_code=v_room.code and a.cycle=v_room.cycle-1 and a.action_type='debrief';
  if v_prior_conf is not null and v_conf-v_prior_conf >= .75 then v_trend:='confusion_up';
  elsif v_prior_conv is not null and v_conv-v_prior_conv >= .75 then v_trend:='convergence_up';
  elsif v_prior_conf is not null and v_conf-v_prior_conf <= -.75 then v_trend:='confusion_down';
  elsif v_prior_conv is not null and v_conv-v_prior_conv <= -.75 then v_trend:='convergence_down';
  end if;
  select
    count(*) filter (where a.action_type in ('field','expert','judge'))::int,
    count(*) filter (where a.action_type='field')::int,
    count(*) filter (where a.action_type='expert')::int,
    count(*) filter (where a.action_type='judge')::int,
    count(*) filter (where a.action_type='breaking_news')::int
  into v_strong,v_field_count,v_expert_count,v_judge_count,v_news_count
  from public.igr_v4_actions a
  where a.room_code=v_room.code and a.cycle=v_room.cycle;

  select coalesce(e.payload->>'adaptive_axis',''), coalesce(e.payload->>'adaptive_kind','')
  into v_last_axis,v_last_kind
  from public.igr_v4_events e
  where e.room_code=v_room.code and e.event_type='trame'
  order by e.id desc limit 1;

  v_last_axis:=coalesce(v_last_axis,'');
  v_last_kind:=coalesce(v_last_kind,'');

  if v_responders>=2 and ((v_conv_max-v_conv_min)>=2 or (v_conf_max-v_conf_min)>=2) then
    v_wanted:='balanced';
  elsif coalesce(v_conf,1)>=1.5 and coalesce(v_conv,1)<1.5 then
    v_wanted:='clarity';
  elsif coalesce(v_conv,1)>=1.5 and coalesce(v_conf,1)<1.5 then
    v_wanted:='ambiguity';
  else
    v_wanted:='balanced';
  end if;

  if v_strong>=2 and v_wanted='clarity' and v_conf<2 then v_wanted:='balanced'; end if;

  if v_room.scenario_id in ('026','027','028') and v_room.cycle>=2 then select (h->>'correct_answers')::int into v_prior_accuracy from jsonb_array_elements(coalesce(v_room.state#>'{terror_v681,history}','[]'::jsonb)) h where (h->>'cycle')::int=v_room.cycle-1 limit 1;v_wanted:=CASE WHEN v_prior_accuracy<=2 THEN 'clarity' WHEN v_prior_accuracy>=5 THEN 'ambiguity' ELSE 'balanced' END;end if;
  with raw as (
    select
      (jt.ord-1)::int as idx,
      jt.trame_json,
      coalesce(jt.trame_json->>'kind','balanced') as kind,
      coalesce((jt.trame_json->>'min_cycle')::int,1) as min_cycle,
      coalesce(jt.trame_json->'axes','[]'::jsonb) as axes
    from jsonb_array_elements(coalesce(v_pack->'trames','[]'::jsonb)) with ordinality as jt(trame_json,ord)
    where coalesce((jt.trame_json->>'min_cycle')::int,1)<=v_room.cycle
      and not (v_used ? ((jt.ord-1)::int)::text)
  ), scored as (
    select
      raw.*,
      case when jsonb_array_length(raw.axes)>0 then raw.axes->>0 else '' end as candidate_axis,
      (case when raw.kind=v_wanted then 8 when raw.kind='balanced' then 5 when v_wanted='balanced' then 2 else 0 end
       + case when v_room.cycle=1 and raw.kind='ambiguity' then 2 when v_room.cycle=1 and raw.kind='balanced' then 1 when v_room.cycle=2 and raw.kind='balanced' then 3 when v_room.cycle=2 and raw.kind='ambiguity' then 1 when v_room.cycle=3 and raw.kind='balanced' then 3 when v_room.cycle=3 and raw.kind='clarity' then 2 when v_room.cycle=3 and raw.kind='ambiguity' then -1 else 0 end
       + case when raw.min_cycle=v_room.cycle then 2 else 0 end
       + case when v_focus_axis<>'' and raw.axes ? v_focus_axis then 5 else 0 end
       + case when v_trend='confusion_up' and raw.kind='clarity' then 3
              when v_trend='convergence_up' and raw.kind='ambiguity' then 3 else 0 end
       - case when v_last_kind<>'' and raw.kind=v_last_kind then 1 else 0 end
       - case when v_last_axis<>'' and raw.axes ? v_last_axis then 2 else 0 end
       - case when v_expert_count>0 and raw.axes ? 'materiel' then 2 else 0 end
       - case when v_field_count>0 and raw.axes ? 'acces' then 2 else 0 end
       - case when v_judge_count>0 and raw.axes ? 'responsabilite' then 1 else 0 end
       - case when v_news_count>0 and raw.axes ? 'mobile' then 1 else 0 end
       - case when v_room.cycle=1 and lower(coalesce(raw.trame_json->>'text','')) ~ '(responsable principal|coupable|meurtrier|tueur|a tué|a tue)' then 12 else 0 end
       + random()*1.75) as score
    from raw
  )
  select s.trame_json,s.idx,s.candidate_axis
  into v_selected_trame,v_chosen_idx,v_chosen_axis
  from scored s
  order by s.score desc
  limit 1;

  if v_selected_trame is null or v_chosen_idx is null then return; end if;

  v_used:=v_used||jsonb_build_object(v_chosen_idx::text,true);
  update public.igr_v4_rooms rr
  set state=jsonb_set(rr.state,'{used_trames}',v_used,true),updated_at=now()
  where rr.code=v_room.code;

  insert into public.igr_v4_events(room_code,event_type,visibility,audience_roles,payload)
  values(
    v_room.code,'trame','roles',
    array['enqueteur','analyste','procureur','juge','inspecteur','expert']::text[],
    jsonb_build_object(
      'title',v_selected_trame->>'title','text',v_selected_trame->>'text','cycle',v_room.cycle,
      'adaptive_kind',v_wanted,'adaptive_axis',coalesce(v_chosen_axis,''),'director_focus',coalesce(v_focus_axis,''),'director_trend',v_trend,'director_version','v87-canonical-signal'
    )
  );
end
$function$
;

-- PATCH igr_v4_tick
CREATE OR REPLACE FUNCTION public.igr_v4_tick(p_room text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare r public.igr_v4_rooms%rowtype;status text;
begin
 select * into r from public.igr_v4_rooms where code=p_room for update;if not found or r.status<>'playing' then return;end if;
 perform public.igr_v44_maintain(r.code);
 select * into r from public.igr_v4_rooms where code=p_room for update;
 if coalesce((r.state->>'timer_paused')::boolean,false) and r.state->>'timer_paused_phase'=r.phase and (r.state->>'timer_paused_started_at')::timestamptz=r.phase_started_at then return;end if;
 if r.phase='role_reading' and r.phase_ends_at is not null and now()>=r.phase_ends_at then perform public.igr_v4_start_cycle(r.code,1);return;end if;
 if r.phase='initial_debrief' and (r.phase_ends_at is null or now()>=r.phase_ends_at) then perform public.igr_v4_start_cycle(r.code,greatest(1,r.cycle));return;end if;
 if r.phase='investigation_assembly' then
   if r.phase_ends_at is null or now()<r.phase_ends_at then return;end if;
   if r.cycle=1 then update public.igr_v4_rooms set phase='interrogation_select',phase_started_at=now(),phase_ends_at=null,updated_at=now() where code=r.code;else perform public.igr_v13_enter_event_select(r.code,3,true);end if;
   insert into public.igr_v4_events(room_code,event_type,visibility,payload) values(r.code,'free_investigation','public',jsonb_build_object('title','ENQUÊTE OUVERTE','text','Les interactions redeviennent libres. Seules les convocations officielles de la Grey Room sont prioritaires.','cycle',r.cycle));return;
 end if;
 if r.scenario_id IN ('032','033','034')
   AND coalesce((r.state->>'regime_v13_active')::boolean,false) THEN
   if r.phase='closed' and (r.phase_ends_at is null or now()>=r.phase_ends_at) then
     perform igr_private.igr_regime_v13_begin_court(r.code);return;
   end if;
   if r.phase='regime_court' then
     perform igr_private.igr_regime_v13_finish_court(r.code);return;
   end if;
 end if;
 if r.phase='closed' then if r.phase_ends_at is not null and now()>=r.phase_ends_at then perform public.igr_v52_begin_stage(r.code,case when public.igr_v44_judge_present(r.code) then 'courtroom' else 'audience' end);end if;return;end if;
 if r.phase in ('final_audience','final_suspect_defenses','final_lawyer_opinions') then status:=coalesce(r.state->>'v52_status','waiting');if r.phase_ends_at is not null and now()>=r.phase_ends_at then if status='active' then perform public.igr_v52_advance(r.code,'timeout'); elsif status='waiting' and public.igr_v44_judge_present(r.code) then
     if r.phase='final_audience' then perform public.igr_v52_advance(r.code,'waiting_timeout');
     else update public.igr_v4_rooms set phase_started_at=now(),phase_ends_at=now()+make_interval(secs=>coalesce((r.state->'v52_queue'->coalesce((r.state->>'v52_index')::int,0)->>'seconds')::int,180)),state=jsonb_set(jsonb_set(r.state,'{v52_status}',to_jsonb('active'::text),true),'{v705_defense_done}','false'::jsonb,true),updated_at=now() where code=r.code;
     end if;end if;end if;return;end if;
 if r.phase='locking' and coalesce((r.state->>'v52_final_reassessment')::boolean,false) then return;end if;
 perform public.igr_v50_tick_legacy(p_room);
 select * into r from public.igr_v4_rooms where code=p_room for update;
 if r.phase='cycle_debrief' then perform public.igr_v4_emit_trame(r.code);update public.igr_v4_rooms set phase='trame',phase_started_at=now(),phase_ends_at=now()+interval '22 seconds',updated_at=now() where code=r.code;
 elsif r.phase='final_debrief' then perform public.igr_v52_begin_stage(r.code,'locking');end if;
end$function$
;

-- PATCH igr_v4_advance_phase
CREATE OR REPLACE FUNCTION public.igr_v4_advance_phase(p_code text, p_host_token uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare r public.igr_v4_rooms%rowtype; reveal jsonb; next_phase text;
begin
  select * into r from public.igr_v4_rooms where code=upper(trim(p_code)) and host_token=p_host_token for update;
  if not found then raise exception 'unauthorized'; end if;
  if r.status<>'playing' then raise exception 'room is not playing'; end if;
  if r.scenario_id in ('032','033','034') and
    coalesce((r.state->>'regime_v13_active')::boolean,false) and
    r.phase='regime_court' then
    if r.phase_ends_at is null OR now()<r.phase_ends_at then
      raise exception 'courtroom time has not expired';
    end if;
    perform igr_private.igr_regime_v13_finish_court(r.code);
    return jsonb_build_object('ok',true,'phase','locking');
  end if;
  if r.phase='reveal' then return jsonb_build_object('ok',true,'phase','reveal'); end if;
  if r.phase='provisional_lock' then
    update public.igr_v4_rooms set phase='final_debrief',phase_started_at=now(),phase_ends_at=now()+interval '2 minutes',state=jsonb_set((coalesce(state,'{}'::jsonb)-'defense_current_id'-'defense_current_pseudo'),'{provisional}','{}'::jsonb,true),updated_at=now() where code=r.code;
  -- v171 final locks
  elsif r.phase='locking' and ((r.scenario_id='029' and coalesce((r.state->>'cartel029_ready')::boolean,false)) or (r.scenario_id='031' and exists(select 1 from igr_private.igr_v171_031_matches where room_code=r.code))) then
    perform public.igr_v52_maybe_finish(r.code);
  elsif r.phase='locking' then
    reveal:=public.igr_v4_make_reveal(r.code);
    update public.igr_v4_rooms set status='finished',phase='reveal',phase_started_at=now(),phase_ends_at=null,updated_at=now() where code=r.code;
    perform public.igr_v4_init_continuation(r.code,reveal);
    insert into public.igr_v4_events(room_code,event_type,payload) values(r.code,'reveal',reveal);
  elsif r.phase in ('event_select','interrogation_select') then
    raise exception 'choice required';
  else
    update public.igr_v4_rooms set phase_ends_at=now()-interval '1 second',updated_at=now() where code=r.code;
    perform public.igr_v4_tick(r.code);
  end if;
  select phase into next_phase from public.igr_v4_rooms where code=r.code;
  return jsonb_build_object('ok',true,'phase',next_phase);
end
$function$
;

-- PATCH igr_v4_make_reveal
CREATE OR REPLACE FUNCTION public.igr_v4_make_reveal(p_room text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  r public.igr_v4_rooms%rowtype;
  pack jsonb;
  s public.igr_v4_players%rowtype;
  p public.igr_v4_players%rowtype;
  q public.igr_v4_players%rowtype;
  enq public.igr_v4_players%rowtype;
  truth_levels jsonb;
  enq_payload jsonb := '{}'::jsonb;
  own_payload jsonb := '{}'::jsonb;
  own_levels jsonb := '{}'::jsonb;
  provisional_payload jsonb := '{}'::jsonb;
  resp jsonb := '[]'::jsonb;
  results jsonb := '[]'::jsonb;
  winners jsonb := '[]'::jsonb;
  achievements jsonb := '[]'::jsonb;
  truth int;
  guess int;
  exact int := 0;
  total int := 0;
  own_exact int;
  own_total int;
  client_count int;
  client_exact int;
  lawyer_count int;
  lawyer_rank int;
  action_count int;
  witness_flags int;
  judge_spent int;
  provisional_exact int;
  threshold int;
  max_cycle_success int;
  success boolean;
  result_role text;
  result_text text;
begin
  SELECT * INTO r FROM public.igr_v4_rooms WHERE code=upper(trim(p_room));
  IF r.scenario_id IN ('032','033','034') AND
    coalesce((r.state->>'regime_v13_active')::boolean,false) THEN
    RETURN igr_private.igr_regime_v13_make_reveal(r.code);
  END IF;
  -- v171 031 ending
  if exists(select 1 from igr_private.igr_v171_031_matches where room_code=p_room) then
    return igr_private.igr_v171_031_make_reveal(p_room);
  end if;
  select * into r from public.igr_v4_rooms where code=p_room;
  if not found then raise exception 'room not found'; end if;
  if r.scenario_id='029' and coalesce((r.state->>'cartel029_ready')::boolean,false)
   and igr_private.igr_v108_029_is_enabled() then
      return igr_private.igr_v120_029_make_reveal(r.code);
  end if;

  select x.pack into pack
  from public.igr_v4_scenario_packs x
  where x.scenario_id=r.scenario_id; /* IGR_V181_001_SNAPSHOT_igr_v4_make_reveal */ if r.scenario_id='001' then pack:=coalesce(igr_private.igr_v181_001_pinned_game_pack(r.code),pack); end if; /* IGR_V202_002_PINNED_READ */ if r.scenario_id='002' then pack:=coalesce(igr_private.igr_v201_002_pinned_game_pack(r.code),pack); end if; /* IGR_003_V221_READER */ if r.scenario_id='003' then pack:=coalesce(igr_private.igr_v220_003_pinned_pack(r.code),pack);end if; if r.scenario_id='004' then pack:=coalesce(igr_private.igr_v230_004_pinned_pack(r.code),pack);end if; if r.scenario_id='005' then pack:=coalesce(igr_private.igr_v250_005_pinned_pack(r.code),pack);end if; if r.scenario_id='006' then pack:=coalesce(igr_private.igr_v260_006_pinned_pack(r.code),pack);end if; if r.scenario_id='007' then pack:=coalesce(igr_private.igr_v281_007_pinned_pack(r.code),pack);end if; if r.scenario_id='008' then pack:=igr_private.igr_v301_008_pinned_pack(r.code);if pack is null then raise exception '008 private snapshot missing';end if;end if; if r.scenario_id='009' then pack:=igr_private.igr_v331_009_pinned_pack(r.code);if pack is null then raise exception '009 private snapshot missing';end if;end if; if r.scenario_id='010' then pack:=igr_private.igr_v351_010_pinned_pack(r.code);if pack is null then raise exception '010 private snapshot missing';end if;end if; if r.scenario_id='011' then pack:=igr_private.igr_v371_011_pinned_pack(r.code);if pack is null then raise exception '011 private snapshot missing';end if;end if; if r.scenario_id='012' then pack:=igr_private.igr_v391_012_pinned_pack(r.code);if pack is null then raise exception '012 private snapshot missing';end if;end if; if r.scenario_id='013' then pack:=igr_private.igr_v411_013_pinned_pack(r.code);if pack is null then raise exception '013 private snapshot missing';end if;end if; if r.scenario_id='014' then pack:=igr_private.igr_v431_014_pinned_pack(r.code);if pack is null then raise exception '014 private snapshot missing';end if;end if; if r.scenario_id='015' then pack:=igr_private.igr_v451_015_pinned_pack(r.code);if pack is null then raise exception '015 private snapshot missing';end if;end if; if r.scenario_id='016' then pack:=igr_private.igr_v481_016_pinned_pack(r.code);if pack is null then raise exception '016 private snapshot missing';end if;end if; if r.scenario_id='017' then pack:=igr_private.igr_v521_017_pinned_pack(r.code);if pack is null then raise exception '017 private snapshot missing';end if;end if; if r.scenario_id='018' then pack:=igr_private.igr_v541_018_pinned_pack(r.code);if pack is null then raise exception '018 private snapshot missing';end if;end if; if r.scenario_id='019' then pack:=igr_private.igr_v571_019_pinned_pack(r.code);if pack is null then raise exception '019 private snapshot missing';end if;end if; if r.scenario_id='020' then pack:=igr_private.igr_v601_020_pinned_pack(r.code);if pack is null then raise exception '020 private snapshot missing';end if;end if;

  if r.scenario_id in ('026','027','028') then pack:=coalesce(igr_private.igr_v695_pinned_pack(r.code),pack);end if;
  truth_levels := coalesce(pack->'truth'->'levels','[]'::jsonb);

  select * into enq
  from public.igr_v4_players
  where room_code=r.code and public_role='enqueteur'
  limit 1;

  select payload into enq_payload
  from public.igr_v4_actions
  where room_code=r.code and player_id=enq.id and action_type='final_lock'
  order by id desc limit 1;
  enq_payload := coalesce(enq_payload->'levels', enq_payload, '{}'::jsonb);

  for s in
    select * from public.igr_v4_players
    where room_code=r.code and public_role='suspect'
    order by internal_slot
  loop
    truth := coalesce((truth_levels->>(s.internal_slot-1))::int,0);
    guess := coalesce((enq_payload->>s.id::text)::int,-1);
    total := total+1;
    if guess=truth then exact:=exact+1; end if;
    resp := resp || jsonb_build_array(
      jsonb_build_object(
        'player_id',s.id,
        'pseudo',s.pseudo,
        'truth_level',truth,
        'enqueteur_level',guess
      )
    );
  end loop;

  threshold := greatest(1,ceil(total*2.0/3.0)::int);

  for p in
    select * from public.igr_v4_players
    where room_code=r.code
    order by seat_index
  loop
    achievements := '[]'::jsonb;
    success := false;
    result_role := p.public_role;
    result_text := 'Objectif non évalué.';

    if p.secret_role='espion' then
      result_role := 'espion';
      success := exact < total;
      result_text := case when success
        then 'L’enquête n’a pas reconstruit parfaitement les responsabilités : ta couverture a tenu.'
        else 'L’enquête a reconstruit toutes les responsabilités : ta mission d’ombre échoue.'
      end;
      if success and exact*2<=total then
        achievements := achievements || jsonb_build_array('espion_ombre');
      end if;

    elsif p.public_role='suspect' then
      truth := coalesce((truth_levels->>(p.internal_slot-1))::int,0);
      guess := coalesce((enq_payload->>p.id::text)::int,-1);
      success := guess=truth;
      result_text := case when success
        then 'La frontière exacte de ta responsabilité a été reconnue.'
        else 'Le verdict a déformé ou manqué ton degré réel de responsabilité.'
      end;
      if success and truth>=2 then
        achievements := achievements || jsonb_build_array('suspect_sous_pression');
      end if;

    elsif p.public_role='maitre' then
      select count(*) into lawyer_count
      from public.igr_v4_players a
      where a.room_code=r.code and a.public_role='maitre';

      select count(*) into lawyer_rank
      from public.igr_v4_players a
      where a.room_code=r.code and a.public_role='maitre' and a.seat_index<=p.seat_index;

      client_count:=0;
      client_exact:=0;
      for q in
        select * from public.igr_v4_players c
        where c.room_code=r.code
          and c.public_role='suspect'
          and (lawyer_count=1 or ((c.internal_slot-1)%lawyer_count)=(lawyer_rank-1))
        order by c.internal_slot
      loop
        client_count:=client_count+1;
        truth:=coalesce((truth_levels->>(q.internal_slot-1))::int,0);
        guess:=coalesce((enq_payload->>q.id::text)::int,-1);
        if truth=guess then client_exact:=client_exact+1; end if;
      end loop;
      success := client_count>0 and client_exact=client_count;
      result_text := case when success
        then client_exact||'/'||client_count||' client(s) défendu(s) dans la frontière exacte de leur responsabilité.'
        else client_exact||'/'||client_count||' client(s) correctement défendu(s) au verdict final.'
      end;
      if success and client_count>=2 then
        achievements := achievements || jsonb_build_array('avocat_double_defense');
      end if;

    elsif p.public_role in ('enqueteur','analyste','procureur','juge') then
      if p.public_role='enqueteur' then
        own_exact:=exact;
        own_total:=total;
      else
        select payload into own_payload
        from public.igr_v4_actions
        where room_code=r.code and player_id=p.id and action_type='final_lock'
        order by id desc limit 1;
        own_levels:=coalesce(own_payload->'levels',own_payload,'{}'::jsonb);
        own_exact:=0;
        own_total:=0;
        for s in
          select * from public.igr_v4_players
          where room_code=r.code and public_role='suspect'
          order by internal_slot
        loop
          own_total:=own_total+1;
          truth:=coalesce((truth_levels->>(s.internal_slot-1))::int,0);
          guess:=coalesce((own_levels->>s.id::text)::int,-1);
          if truth=guess then own_exact:=own_exact+1; end if;
        end loop;
      end if;

      success := own_total>0 and own_exact=own_total;

      if p.public_role='enqueteur' then
        result_text := own_exact||'/'||own_total||' responsabilités exactes.';
        select payload into provisional_payload
        from public.igr_v4_actions
        where room_code=r.code and player_id=p.id and action_type='provisional'
        order by id desc limit 1;
        if provisional_payload is not null then
          provisional_exact:=0;
          for s in
            select * from public.igr_v4_players
            where room_code=r.code and public_role='suspect'
          loop
            truth:=coalesce((truth_levels->>(s.internal_slot-1))::int,0);
            guess:=coalesce((provisional_payload->>s.id::text)::int,-1);
            if truth=guess then provisional_exact:=provisional_exact+1; end if;
          end loop;
          if success and provisional_exact=total then
            achievements:=achievements||jsonb_build_array('enq_sans_correction');
          end if;
        end if;

      elsif p.public_role='analyste' then
        result_text := own_exact||'/'||own_total||' responsabilités correctement lues dans ton verrouillage.';
        if success then achievements:=achievements||jsonb_build_array('analyste_parfait'); end if;

      elsif p.public_role='procureur' then
        select count(*) into action_count
        from public.igr_v4_actions
        where room_code=r.code and player_id=p.id and action_type='prosecutor_success';
        success := success and action_count>=1;
        result_text := own_exact||'/'||own_total||' responsabilités exactes · '||action_count||' entretien(s) accepté(s).';
        select coalesce(max(c),0) into max_cycle_success from (
          select cycle,count(*) c
          from public.igr_v4_actions
          where room_code=r.code and player_id=p.id and action_type='prosecutor_success'
          group by cycle
        ) z;
        if success and max_cycle_success>=2 then
          achievements:=achievements||jsonb_build_array('procureur_double_entretien');
        end if;

      elsif p.public_role='juge' then
        select coalesce(sum(coalesce((a.payload->>'cost')::int,0)),0) into judge_spent
        from public.igr_v4_actions a
        where a.room_code=r.code and a.player_id=p.id and a.action_type='judge';
        result_text := own_exact||'/'||own_total||' responsabilités exactes · '||judge_spent||'/5 points de confidentialité utilisés.';
        if success and judge_spent<=2 then
          achievements:=achievements||jsonb_build_array('juge_confidentiel');
        end if;
      end if;

    elsif p.public_role='journaliste' then
      select count(*) into action_count
      from public.igr_v4_actions
      where room_code=r.code and player_id=p.id and action_type='breaking_news';
      select payload into own_payload
      from public.igr_v4_actions
      where room_code=r.code and player_id=p.id and action_type='final_lock'
      order by id desc limit 1;
      success := action_count>=1 and length(trim(coalesce(own_payload->>'note','')))>=8;
      result_text := action_count||' Breaking News publiée(s) · angle final '||
        case when length(trim(coalesce(own_payload->>'note','')))>=8 then 'assumé.' else 'non verrouillé.' end;
      if success and action_count=3 then
        achievements:=achievements||jsonb_build_array('journaliste_trois_unes');
      end if;

    elsif p.public_role='inspecteur' then
      select count(*) into action_count
      from public.igr_v4_actions
      where room_code=r.code and player_id=p.id and action_type='field';
      success := action_count>=1 and exact>=threshold;
      result_text := action_count||' action(s) de terrain · enquête à '||exact||'/'||total||' responsabilités exactes.';
      if success and action_count>=3 then
        achievements:=achievements||jsonb_build_array('inspecteur_trois_pistes');
      end if;

    elsif p.public_role='expert' then
      select count(*) into action_count
      from public.igr_v4_actions
      where room_code=r.code and player_id=p.id and action_type='expert';
      success := action_count>=1 and exact>=threshold;
      result_text := action_count||' analyse(s) technique(s) · enquête à '||exact||'/'||total||' responsabilités exactes.';
      if success and action_count>=3 then
        achievements:=achievements||jsonb_build_array('expert_trois_analyses');
      end if;

    elsif p.public_role='temoin' then
      select count(*) into witness_flags
      from public.igr_v4_actions
      where room_code=r.code and action_type='witness_status'
        and payload->>'target'=p.id::text
        and payload->>'status'='suspect';
      success := witness_flags=0;
      result_text := case when success
        then 'Tu n’as jamais été formellement requalifié comme suspect.'
        else 'Tu as été requalifié comme suspect au cours de l’enquête.'
      end;
      select count(*) into action_count
      from public.igr_v4_actions
      where room_code=r.code and action_type='witness_status'
        and payload->>'target'=p.id::text;
      if success and action_count=0 then
        achievements:=achievements||jsonb_build_array('temoin_intouchable');
      end if;

    else
      success := false;
      result_text := 'Aucune condition de victoire n’est définie pour ce rôle.';
    end if;

    -- v170 cartel withdrawal result
    if p.public_role='maitre' and r.scenario_id in ('030','031')
      and coalesce((p.private_state->>'lawyer_cartel_forfeit')::boolean,false) then
      success:=false; achievements:='[]'::jsonb;
      result_text:='Tu as abandonné le mandat du cartel. Tu perds personnellement la partie. Le cartel a fait tuer ta famille.';
    end if;

    -- The Front reaches the Grey Room on a failed collective investigation.
    -- All occupants are executed after a terminal FDR victory, whatever their status.
    if r.scenario_id in ('026','027','028')
      and coalesce((r.state#>>'{terror_v681,controlled}')::int,0)=0
    then
      success:=false;
      achievements:='[]'::jsonb;
      result_text:='Le FDR prend la Grey Room de la dernière capitale libre d Almizia. Tu es capturé, maltraité et exécuté sommairement, sans distinction de rôle ni de fidélité au groupe.';
    end if;
    if p.public_role='officier_liaison' AND r.scenario_id in ('026','027','028') then
      select count(*) into action_count from public.igr_v4_actions cmd
       where cmd.room_code=r.code AND cmd.player_id=p.id
       AND cmd.action_type='terror_v694_military' AND coalesce((cmd.payload->>'auto')::boolean,false)=false;
      success:=exact>=threshold
       AND coalesce((r.state#>>'{terror_v681,controlled}')::int,0)>0
       AND action_count>=1;
      result_text:=CASE WHEN success THEN
        'Tu as personnellement confirmé la majorité des ordres décisifs et préservé la capitale. Le verdict judiciaire est évalué indépendamment.'
       WHEN action_count=0 THEN
        'Tu n as confirmé aucun ordre. Les procédures de sécurité ont limité les dégâts, sans remplacer ton commandement.'
       ELSE
        'Ta mission militaire échoue : le périmètre est perdu ou moins de sept décisions ont été confirmées personnellement.' END;
    end if;
    if success then
      winners := winners || jsonb_build_array(p.id);
    end if;

    results := results || jsonb_build_array(
      jsonb_build_object(
        'player_id',p.id,
        'pseudo',p.pseudo,
        'role',result_role,
        'public_role',p.public_role,
        'success',success,
        'achievements',achievements,
        'text',result_text
      )
    );
  end loop;

  return jsonb_build_object(
    'title','RÉVÉLATION',
    'terror_finale',case when r.scenario_id in ('026','027','028') then
      jsonb_build_object(
       'organization','Front de la Restauration',
       'city',coalesce(r.state#>>'{terror_v681,city}','la ville'),
       'status',case when false OR
          coalesce((r.state#>>'{terror_v681,controlled}')::int,0)=0
          then 'front_at_gates' else 'evidence_preserved' end,
       'message',case when false OR
          coalesce((r.state#>>'{terror_v681,controlled}')::int,0)=0
         then 'DÉFAITE. Le FDR a pris la Grey Room. Tous les occupants sont faits prisonniers, maltraités puis exécutés sommairement. Le contexte précis dépend du scénario.'
         else 'La Grey Room conserve ses preuves et tient encore un secteur de la capitale. Le FDR demeure une menace, mais sa progression peut être contenue.' end)
      else null end,
    'summary',pack->'truth'->>'summary',
    'responsibilities',resp,
    'results',results,
    'winners',winners,
    'winner_count',jsonb_array_length(winners),
    'accuracy',jsonb_build_object('exact',exact,'total',total)
  );
end
$function$
;
