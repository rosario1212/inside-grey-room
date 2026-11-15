-- INSIDE GREY ROOM — LE RÉGIME v13
-- Candidate only. Additive, isolated tables and RPCs. The actual release
-- flag defaults FALSE. The existing 032–034 game flow is NOT replaced.
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
      AND manuscript->'regime_vnext'->>'human_review_approved'='true')=9
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
      AND manuscript->'regime_vnext'->>'human_review_approved'='true'
    ORDER BY gen_random_uuid() LIMIT 1;
  IF NOT FOUND THEN RETURN false; END IF;
  INSERT INTO igr_private.igr_regime_v13_rooms(room_code,scenario_id,variant_id,private_pack,play_state)
  VALUES(r.code,r.scenario_id,m.variant_id,m.manuscript->'regime_vnext',
    jsonb_build_object('alliance','{}'::jsonb,'decisions','[]'::jsonb,
      'investigations','[]'::jsonb,'disclosed','[]'::jsonb,
      'arrests','{}'::jsonb,'mandates','[]'::jsonb,'third','{}'::jsonb,
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
  actor text; card jsonb; own_mission jsonb; offered jsonb; court_acts jsonb;cast_list jsonb; used_cycle boolean;used_move boolean;
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
  FOR clue IN SELECT value FROM jsonb_array_elements(m.private_pack->'capture_evidence') LOOP
    IF (clue->>'revealed_at'='cycle_start' AND (clue->>'cycle')::int<=r.cycle)
      OR (m.play_state->'disclosed' ? (clue->>'id'))
    THEN public_clues:=public_clues||jsonb_build_array(
      jsonb_build_object('id',clue->>'id','kind','capture','title','PISTE DE TRAQUE',
        'text',clue->>'description','cycle',clue->>'cycle','target_id',clue->>'targetId')); END IF;
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
  IF (m.play_state->'disclosed') ? (m.private_pack->'third_suspect_mission'->>'document_id') THEN
    clue:=m.private_pack->'third_suspect_mission'->'public_on_submission';
    IF clue IS NOT NULL THEN public_clues:=public_clues||jsonb_build_array(clue - 'authenticated_by_server' - 'initially_private');END IF;
  END IF;
  RETURN jsonb_build_object('enabled',true,
      'scenario_id',m.scenario_id,'cycle',r.cycle,'phase',r.phase,
      'role',p.public_role,'actor_id',actor,'my_card',card,'my_mission',own_mission,
      'my_alliance_choice',chosen,'offered_investigations',offered,
      'investigation_used_this_cycle',used_cycle,'my_fugitive_decision_used',used_move,
      'third_submitted',coalesce((m.play_state->'third'->>'submitted')::boolean,false),
      'cast',cast_list,'court_acts',court_acts,
      'pending_mandates',CASE WHEN p.public_role IN ('juge','enqueteur','analyste')
         THEN (SELECT coalesce(jsonb_agg(x),'[]'::jsonb)
             FROM jsonb_array_elements(coalesce(m.play_state->'mandates','[]'::jsonb)) x
             WHERE x->>'status'='awaiting_judge') ELSE '[]'::jsonb END,
      'my_fugitive_options',a,
      'public_evidence',public_clues,
      'arrests',m.play_state->'arrests','court',m.play_state->'court',
      'events',coalesce(m.play_state->'events','[]'::jsonb),
      'investigations_count',jsonb_array_length(coalesce(m.play_state->'investigations','[]'::jsonb)));
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
  actor text; option_row jsonb; choice text; piece jsonb;
  new_state jsonb; disclosed jsonb;
BEGIN
  SELECT * INTO p FROM public.igr_v4_players
   WHERE room_code=upper(trim(p_code)) AND player_token=p_player_token;
  IF NOT FOUND THEN RAISE EXCEPTION 'unauthorized'; END IF;
  SELECT * INTO r FROM public.igr_v4_rooms WHERE code=p.room_code FOR UPDATE;
  SELECT * INTO m FROM igr_private.igr_regime_v13_rooms WHERE room_code=p.room_code FOR UPDATE;
  IF NOT FOUND OR r.status<>'playing' THEN RAISE EXCEPTION 'regime feature inactive'; END IF;
  IF length(coalesce(p_request_id,''))<8 OR length(p_request_id)>128 THEN RAISE EXCEPTION 'invalid request id'; END IF;
  SELECT response,actor_player,action_kind INTO old,old_actor,old_kind
   FROM igr_private.igr_regime_v13_ledger
   WHERE room_code=p.room_code AND request_id=p_request_id;
  IF FOUND THEN
   IF old_actor<>p.id OR old_kind<>p_kind THEN RAISE EXCEPTION 'request conflict';END IF;
   RETURN old;
  END IF;
  actor:=CASE WHEN p.public_role='suspect'
    THEN m.private_pack->'private_cards'->(p.internal_slot-1)->>'actor_id'
    ELSE NULL END;
  new_state:=m.play_state;
  IF r.phase IN ('closed','regime_court','final_audience','final_suspect_defenses','locking','reveal')
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
     WHERE value->>'id'=p_payload->>'option_id'
       AND value->>'actorId'=actor AND (value->>'cycle')::int=r.cycle;
    IF NOT FOUND THEN RAISE EXCEPTION 'invalid private option'; END IF;
    new_state:=jsonb_set(new_state,'{decisions}',
      coalesce(new_state->'decisions','[]'::jsonb)||
      jsonb_build_array(jsonb_build_object('actor_id',actor,'cycle',r.cycle,
         'option_id',option_row->>'id',
         'effect',option_row->'effect','cost',option_row->'cost')),true);
    IF option_row ? 'reveals_capture_evidence_id' THEN
      disclosed:=coalesce(new_state->'disclosed','[]'::jsonb)||
          jsonb_build_array(option_row->>'reveals_capture_evidence_id');
      new_state:=jsonb_set(new_state,'{disclosed}',disclosed,true);
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
    WHERE x.value->>'id'=p_payload->>'option_id';
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
    IF FOUND THEN new_state:=jsonb_set(new_state,'{disclosed}',
       coalesce(new_state->'disclosed','[]'::jsonb)||jsonb_build_array(piece->>'id'),true); END IF;
    result:=jsonb_build_object('ok',true,'kind',p_kind,'published',option_row->>'deliverable_id');
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
