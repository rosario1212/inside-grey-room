-- v711 QA. Execute inside BEGIN after the migration and ROLLBACK after.
-- Tests strict (>50%) per-suspect camp majority; no one-person authority.
DO $qa$
DECLARE rc text; r public.igr_v4_rooms%rowtype; s1 uuid; s2 uuid; s3 uuid;
 res jsonb; votes jsonb; suspect record; p record; auth jsonb;
BEGIN
 IF EXISTS (SELECT 1 FROM public.igr_v4_rooms WHERE code IN ('C711J','C711N')) THEN
  RAISE EXCEPTION 'QA room already exists';
 END IF;
 INSERT INTO public.igr_v4_rooms(code,scenario_id) VALUES ('C711J','001'),('C711N','001');
 INSERT INTO public.igr_v4_players(room_code,pseudo,seat_index,public_role,internal_slot)
 VALUES ('C711J','Enqueteur',0,'enqueteur',null),
 ('C711J','Analyste',1,'analyste',null),('C711J','Procureur',2,'procureur',null),
 ('C711J','Juge',3,'juge',null),('C711J','Suspect A',4,'suspect',1),
 ('C711J','Suspect B',5,'suspect',2),('C711J','Suspect C',6,'suspect',3),
 ('C711N','Enqueteur',0,'enqueteur',null),('C711N','Analyste',1,'analyste',null),
 ('C711N','Procureur',2,'procureur',null),('C711N','Suspect A',3,'suspect',1),
 ('C711N','Suspect B',4,'suspect',2),('C711N','Suspect C',5,'suspect',3);
 UPDATE public.igr_v4_rooms SET status='playing',cycle=3,phase='locking' WHERE code IN ('C711J','C711N');
 FOR rc IN SELECT unnest(array['C711J','C711N']) LOOP
   SELECT id INTO s1 FROM public.igr_v4_players WHERE room_code=rc AND public_role='suspect' AND internal_slot=1;
   SELECT id INTO s2 FROM public.igr_v4_players WHERE room_code=rc AND public_role='suspect' AND internal_slot=2;
   SELECT id INTO s3 FROM public.igr_v4_players WHERE room_code=rc AND public_role='suspect' AND internal_slot=3;
   FOR p IN SELECT * FROM public.igr_v4_players WHERE room_code=rc AND public_role in ('enqueteur','analyste','procureur','juge') LOOP
     votes:=jsonb_build_object(s1::text,case when p.public_role in ('juge','procureur') then 0 else 2 end,
       s2::text,case when p.public_role='juge' then 0 else 2 end,
       s3::text,2);
     INSERT INTO public.igr_v4_actions(room_code,player_id,cycle,action_type,payload)
       VALUES(rc,p.id,3,'final_lock',jsonb_build_object('levels',votes));
   END LOOP;
 END LOOP;
 -- Judge-only 0 vs enq 2, analyst 2, prosecutor 0 produces no absolute majority on A.
 SELECT id INTO s1 FROM public.igr_v4_players WHERE room_code='C711J' AND internal_slot=1;
 SELECT id INTO s2 FROM public.igr_v4_players WHERE room_code='C711J' AND internal_slot=2;
 SELECT id INTO s3 FROM public.igr_v4_players WHERE room_code='C711J' AND internal_slot=3;
 SELECT igr_private.igr_v711_majority_levels('C711J') INTO auth;
 IF (auth->>s1::text)::int<>-1 OR (auth->>s2::text)::int<>2 OR (auth->>s3::text)::int<>2
   THEN RAISE EXCEPTION 'Juge majority is incorrect %',auth;END IF;
 SELECT public.igr_v50_reveal_legacy('C711J') INTO res;
 IF res#>>'{camp_investigation,authority_role}'<>'camp_enquete' THEN RAISE EXCEPTION 'Judge still overrides camp majority';END IF;
 IF NOT EXISTS (SELECT 1 FROM jsonb_array_elements(res->'responsibilities') x WHERE x->>'player_id'=s1::text AND (x->>'authority_level')::int=-1)
 THEN RAISE EXCEPTION 'No-majority state lost in reveal';END IF;
 IF NOT EXISTS (SELECT 1 FROM jsonb_array_elements(res->'responsibilities') x WHERE x->>'player_id'=s2::text AND (x->>'authority_level')::int=2)
 THEN RAISE EXCEPTION 'Collective majority not used in reveal';END IF;

 -- Judge alone cannot change other players' votes, nor can Prosecutor alone.
 UPDATE public.igr_v4_actions a SET payload=jsonb_set(payload,'{levels}',jsonb_build_object(s1::text,2,s2::text,2,s3::text,2),true)
   FROM public.igr_v4_players p WHERE a.room_code='C711J' AND a.player_id=p.id AND p.public_role='procureur' AND a.action_type='final_lock';
 SELECT igr_private.igr_v711_majority_levels('C711J') INTO auth;
 IF (auth->>s1::text)::int<>2 THEN RAISE EXCEPTION 'Majority 3 vs 1 ignored';END IF;
 SELECT id INTO s1 FROM public.igr_v4_players WHERE room_code='C711N' AND internal_slot=1;
 SELECT igr_private.igr_v711_majority_levels('C711N') INTO auth;
 IF (auth->>s1::text)::int<>2 THEN RAISE EXCEPTION 'Prosecutor imposed a minority 0';END IF;
 SELECT public.igr_v50_reveal_legacy('C711N') INTO res;
 IF res#>>'{camp_investigation,authority_role}'<>'camp_enquete'
   THEN RAISE EXCEPTION 'Prosecutor remains authoritative without Judge';END IF;

 -- Abstaining by being absent does not manufacture a ballot, and a 1-1 tie is unresolved.
 UPDATE public.igr_v4_rooms SET state=jsonb_set(state,'{v59_absent}',
   (SELECT jsonb_agg(id::text) FROM public.igr_v4_players WHERE room_code='C711N' AND public_role='analyste'),true)
   WHERE code='C711N';
 SELECT igr_private.igr_v711_majority_levels('C711N') INTO auth;
 IF (auth->>s1::text)::int<>-1 THEN RAISE EXCEPTION 'Absent voter still counted or tied vote forced';END IF;
 RAISE NOTICE 'v711 majority: judge/prosecutor cannot decide alone, absolute-majority rules and unresolved ties verified';
END $qa$;
