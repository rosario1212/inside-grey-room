-- Transactionally rolled-back smoke tests for dossier 004.
-- No synthetic room, profile or action is preserved. Run with a privileged
-- QA connection, not with a player token or via a user-facing API.
DO $audit$
DECLARE n int;i int;c text;r public.igr_v4_rooms%rowtype;pk jsonb;data jsonb;
 ans jsonb; levels jsonb;player record;variant text;
 distribution jsonb:='{"A":0,"B":0,"C":0}'::jsonb;
 team_count int:=0;classic_count int:=0;
BEGIN
 FOR n IN 1..6 LOOP
  BEGIN
   c:='Y'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,7));
   INSERT INTO public.igr_v4_rooms(code,scenario_id) VALUES(c,'004') RETURNING * INTO r;
   FOR i IN 0..3 LOOP
    INSERT INTO public.igr_v4_players(room_code,pseudo,seat_index,is_host)
    VALUES(c,'004 smoke '||i,i,i=0);
   END LOOP;
   IF n%2=0 THEN
    PERFORM public.igr_v800_set_four_player_mode(c,r.host_token,'team');
    team_count:=team_count+1;
   ELSE classic_count:=classic_count+1;END IF;
   PERFORM public.igr_v4_start_game(c,r.host_token);

   IF n%2=0 THEN
    IF (SELECT count(*) FROM public.igr_v4_players WHERE room_code=c AND public_role='analyste')<>1
    OR (SELECT count(*) FROM public.igr_v4_players WHERE room_code=c AND public_role='suspect')<>2
    THEN RAISE EXCEPTION 'incorrect Team-4 roster'; END IF;
    IF (SELECT count(*) FROM public.igr_v4_events WHERE room_code=c AND payload->>'nonplayer'='true')<>1
    THEN RAISE EXCEPTION 'missing or duplicated archive';END IF;
    IF NOT EXISTS (
     SELECT 1 FROM public.igr_v4_players p,
      jsonb_array_elements(coalesce(p.private_state->'relations','[]'::jsonb)) rel
     WHERE p.room_code=c AND p.public_role='suspect'
       AND rel->>'pseudo'='Le proche de Sofia (non joueur)')
    THEN RAISE EXCEPTION 'lost private relationship with third person';END IF;
   ELSE
    IF (SELECT count(*) FROM public.igr_v4_players WHERE room_code=c AND public_role='analyste')<>0
    OR (SELECT count(*) FROM public.igr_v4_players WHERE room_code=c AND public_role='suspect')<>3
    THEN RAISE EXCEPTION 'classic 4 regression';END IF;
   END IF;

   SELECT variant_id INTO variant FROM igr_private.igr_v99_room_canons WHERE room_code=c;
   IF variant NOT IN ('A','B','C') THEN RAISE EXCEPTION 'variant not pinned';END IF;

   PERFORM public.igr_v4_start_cycle(c,1);
   IF n%2=0 THEN
    IF (SELECT (state->>'interrogation_limit')::int FROM public.igr_v4_rooms WHERE code=c)>2
    THEN RAISE EXCEPTION 'phantom third interrogation';END IF;
    IF (SELECT jsonb_array_length(public.igr_v700_psych_profiles(c,p.player_token)->'suspects')
       FROM public.igr_v4_players p WHERE p.room_code=c AND p.public_role='analyste')<>2
    THEN RAISE EXCEPTION 'analyst profiles ghost third suspect';END IF;
   END IF;

   SELECT pack INTO pk FROM public.igr_v4_scenario_packs WHERE scenario_id='004';
   pk:=coalesce(igr_private.igr_v230_004_pinned_pack(c),pk);
   data:=pk->'truth'->'reconstruction_004';
   ans:=jsonb_build_object('signal',data->>'signal','decision',data->>'decision','limit',data->>'limit');
   SELECT jsonb_object_agg(id::text,0) INTO levels FROM public.igr_v4_players WHERE room_code=c AND public_role='suspect';

   UPDATE public.igr_v4_rooms SET phase='locking',cycle=3,
      state=jsonb_set(state,'{v52_final_reassessment}','true'::jsonb,true) WHERE code=c;
   FOR player IN SELECT player_token FROM public.igr_v4_players
    WHERE room_code=c AND public_role IN ('enqueteur','analyste')
   LOOP
    PERFORM public.igr_v4_lock_final(c,player.player_token,
       jsonb_build_object('levels',levels,'reconstruction_004',ans));
   END LOOP;
   IF (SELECT status FROM public.igr_v4_rooms WHERE code=c)<>'finished'
      OR (SELECT count(*) FROM public.igr_v4_events WHERE room_code=c AND event_type='reveal')<>1
   THEN RAISE EXCEPTION 'final reveal never completed';END IF;
   RAISE EXCEPTION USING ERRCODE='PT001',MESSAGE=variant;
  EXCEPTION WHEN SQLSTATE 'PT001' THEN
   variant:=SQLERRM;
   distribution:=jsonb_set(distribution,ARRAY[variant],to_jsonb((distribution->>variant)::int+1),false);
  END;
 END LOOP;
 IF team_count<>3 OR classic_count<>3
 THEN RAISE EXCEPTION 'incomplete audit %',distribution; END IF;
END $audit$;