-- IMPORTANT: run this rollback-only behavioral QA AFTER v696 migration has COMMITTED.
-- A CREATE OR REPLACE FUNCTION inside the same open transaction can leave a PL/pgSQL
-- call in this test bound to the previous function body.
-- v696 rollback-only smoke test: no early officer timer and no post-verdict initiative.
BEGIN;
INSERT INTO public.igr_v4_rooms(code,scenario_id,status,cycle,phase,phase_started_at,phase_ends_at,state)
VALUES('V696QA1','026','playing',1,'role_reading',clock_timestamp(),
 clock_timestamp()+interval '10 minutes','{}'::jsonb);
INSERT INTO public.igr_v4_players(room_code,pseudo,seat_index,public_role,secret_role)
VALUES('V696QA1','QA investigator',0,'enqueteur','enqueteur'),
 ('V696QA1','QA analyst',1,'analyste','analyste'),
 ('V696QA1','QA officer',2,'officier_liaison','officier_liaison'),
 ('V696QA1','QA suspect A',3,'suspect','suspect'),
 ('V696QA1','QA suspect B',4,'suspect','suspect'),
 ('V696QA1','QA suspect C',5,'suspect','suspect');
DO $qa$
DECLARE token_ uuid;analyst_ uuid;s jsonb;p text;raised_ boolean;
BEGIN
 SELECT player_token INTO token_ FROM public.igr_v4_players
  WHERE room_code='V696QA1' AND public_role='officier_liaison';
 SELECT player_token INTO analyst_ FROM public.igr_v4_players
  WHERE room_code='V696QA1' AND public_role='analyste';
 FOREACH p IN ARRAY ARRAY['role_reading','briefing','pre_investigation','investigation_assembly'] LOOP
  UPDATE public.igr_v4_rooms SET phase=p WHERE code='V696QA1';
  s:=public.igr_v694_terror_orders('V696QA1',token_);
  IF coalesce((s->>'preparation')::boolean,false) IS DISTINCT FROM true
  THEN RAISE EXCEPTION 'preparation incorrectly opens officer timer (%)',p;END IF;
  IF (SELECT state#>>'{terror_v694,started_at}' FROM public.igr_v4_rooms WHERE code='V696QA1') IS NOT NULL
  THEN RAISE EXCEPTION 'early military start in %',p;END IF;
 END LOOP;
 UPDATE public.igr_v4_rooms SET phase='interrogation_select' WHERE code='V696QA1';
 s:=public.igr_v694_terror_orders('V696QA1',token_);
 IF s->>'preparation' IS NOT NULL OR
   (SELECT state#>>'{terror_v694,started_at}' FROM public.igr_v4_rooms WHERE code='V696QA1') IS NULL
 THEN RAISE EXCEPTION 'officer timer did not begin after assembly';END IF;
 UPDATE public.igr_v4_rooms SET phase='final_audience' WHERE code='V696QA1';
 raised_:=false;
 BEGIN
  PERFORM public.igr_v694_role_initiative('V696QA1',analyst_,'recoupement',
    'Vérifier si les dates des témoignages sont vraiment compatibles.');
 EXCEPTION WHEN OTHERS THEN raised_:=(SQLERRM='initiative phase closed');
 END;
 IF NOT raised_ THEN RAISE EXCEPTION 'initiative not blocked during final hearing';END IF;
 IF EXISTS(SELECT 1 FROM public.igr_v4_events WHERE room_code='V696QA1'
  AND event_type='igr_v694_role_initiative')
 THEN RAISE EXCEPTION 'post-final false note published';END IF;
END;$qa$;
SELECT 'PASS v696: preparation protected; first officer alert after assembly; final notes blocked' AS result;
ROLLBACK;
