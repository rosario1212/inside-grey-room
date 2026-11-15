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
