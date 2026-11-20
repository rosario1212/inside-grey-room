-- v806 guarded database integration QA: case 009 classic and Team-4.
-- Six synthetic games, each rolled back at the end of its subtransaction.
-- No effect on existing production rooms.
DO $audit$
DECLARE n int;i int;c text;r public.igr_v4_rooms%rowtype;pk jsonb;data jsonb;
 ans jsonb; levels jsonb;player record;variant text;
 distribution jsonb:='{"A":0,"B":0,"C":0}'::jsonb;
 team_count int:=0;classic_count int:=0;
BEGIN
 IF public.igr_v4_min_players('009')<>4
   OR public.igr_v4_min_players('008')<>5
   OR public.igr_v4_min_players('010')<>5
 THEN RAISE EXCEPTION 'unqualified five-player scenario was accidentally enabled';END IF;
 FOR n IN 1..6 LOOP
  BEGIN
   c:='Y'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,7));
   INSERT INTO public.igr_v4_rooms(code,scenario_id) VALUES(c,'009') RETURNING * INTO r;
   FOR i IN 0..3 LOOP
    INSERT INTO public.igr_v4_players(room_code,pseudo,seat_index,is_host)
    VALUES(c,'009 smoke '||i,i,i=0);
   END LOOP;
   IF n%2=0 THEN
    PERFORM public.igr_v800_set_four_player_mode(c,r.host_token,'team');
    team_count:=team_count+1;
   ELSE classic_count:=classic_count+1; END IF;
   PERFORM public.igr_v4_start_game(c,r.host_token);

   IF n%2=0 THEN
    IF (SELECT count(*) FROM public.igr_v4_players WHERE room_code=c AND public_role='analyste')<>1
    OR (SELECT count(*) FROM public.igr_v4_players WHERE room_code=c AND public_role='suspect')<>2
    THEN RAISE EXCEPTION 'incorrect Team-4 roster'; END IF;
    IF (SELECT count(*) FROM public.igr_v4_events WHERE room_code=c AND payload->>'nonplayer'='true')<>1
    THEN RAISE EXCEPTION 'missing or duplicated offstage member statement';END IF;
    IF NOT EXISTS(
      SELECT 1 FROM public.igr_v4_players p,
       jsonb_array_elements(coalesce(p.private_state->'relations','[]'::jsonb)) rel
       WHERE p.room_code=c AND p.public_role='suspect'
         AND rel->>'pseudo'='Le membre de l’équipe ORPHÉE (non joueur)')
    THEN RAISE EXCEPTION 'private relation with third person absent';END IF;
   ELSE
    IF (SELECT count(*) FROM public.igr_v4_players WHERE room_code=c AND public_role='analyste')<>0
    OR (SELECT count(*) FROM public.igr_v4_players WHERE room_code=c AND public_role='suspect')<>3
    THEN RAISE EXCEPTION 'classic 4 roster wrong';END IF;
   END IF;

   SELECT variant_id INTO variant FROM igr_private.igr_v331_009_room_snapshots WHERE room_code=c;
   IF variant IS NULL OR variant NOT IN ('A','B','C') THEN RAISE EXCEPTION 'variant not pinned';END IF;

   PERFORM public.igr_v4_start_cycle(c,1);
   IF n%2=0 THEN
    IF (SELECT (state->>'interrogation_limit')::int FROM public.igr_v4_rooms WHERE code=c)>2
    THEN RAISE EXCEPTION 'interrogation phantom';END IF;
    IF (SELECT jsonb_array_length(public.igr_v700_psych_profiles(c,p.player_token)->'suspects')
        FROM public.igr_v4_players p WHERE p.room_code=c AND p.public_role='analyste')<>2
    THEN RAISE EXCEPTION 'analyst profile phantom';END IF;
   END IF;

   pk:=igr_private.igr_v331_009_pinned_pack(c);
   IF pk IS NULL THEN RAISE EXCEPTION '009 canonical pack missing';END IF;
   data:=pk->'truth'->'reconstruction_009';
   ans:=jsonb_build_object('withdrawal',data->>'withdrawal',
       'decision',data->>'decision','decoy',data->>'decoy');
   SELECT jsonb_object_agg(id::text,0) INTO levels
    FROM public.igr_v4_players WHERE room_code=c AND public_role='suspect';
   UPDATE public.igr_v4_rooms SET phase='locking',cycle=3,
     state=jsonb_set(state,'{v52_final_reassessment}','true'::jsonb,true)
     WHERE code=c;
   FOR player IN SELECT player_token FROM public.igr_v4_players WHERE room_code=c
      AND public_role IN ('enqueteur','analyste') LOOP
     PERFORM public.igr_v4_lock_final(c,player.player_token,
       jsonb_build_object('levels',levels,'reconstruction_009',ans));
   END LOOP;
   IF (SELECT status FROM public.igr_v4_rooms WHERE code=c)<>'finished'
      OR (SELECT count(*) FROM public.igr_v4_events WHERE room_code=c AND event_type='reveal')<>1
   THEN RAISE EXCEPTION '009 final reveal did not complete';END IF;

   RAISE EXCEPTION USING ERRCODE='PT001',MESSAGE=variant;
  EXCEPTION WHEN SQLSTATE 'PT001' THEN
    variant:=SQLERRM;
    distribution:=jsonb_set(distribution,ARRAY[variant],
      to_jsonb((distribution->>variant)::int+1),false);
  END;
 END LOOP;
 IF team_count<>3 OR classic_count<>3 THEN RAISE EXCEPTION 'wrong tested compositions';END IF;
END $audit$;