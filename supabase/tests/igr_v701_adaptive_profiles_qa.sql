-- v701 rollback-only QA. Run after v701 migration was applied in a previous transaction.
BEGIN;
INSERT INTO public.igr_v4_rooms(code,scenario_id,status,cycle,phase,phase_started_at,phase_ends_at,state)
VALUES('V701QA1','006','playing',1,'interrogation_select',clock_timestamp(),
 clock_timestamp()+interval '10 minutes',jsonb_build_object('match_no',1));
INSERT INTO public.igr_v4_players(room_code,pseudo,seat_index,public_role,secret_role)
VALUES('V701QA1','Analyste QA',0,'analyste','analyste'),
 ('V701QA1','Enqueteur QA',1,'enqueteur','enqueteur'),
 ('V701QA1','Temoin QA',2,'temoin','temoin'),
 ('V701QA1','Suspect Alpha',3,'suspect','suspect'),
 ('V701QA1','Suspect Beta',4,'suspect','suspect'),
 ('V701QA1','Suspect Gamma',5,'suspect','suspect');
DO $qa$
DECLARE token_ uuid; other_ uuid; sid uuid; v jsonb;
 rejected boolean; count_ integer;
BEGIN
 SELECT player_token INTO token_ FROM public.igr_v4_players
 WHERE room_code='V701QA1' AND public_role='analyste';
 SELECT player_token INTO other_ FROM public.igr_v4_players
 WHERE room_code='V701QA1' AND public_role='temoin';
 SELECT id INTO sid FROM public.igr_v4_players
 WHERE room_code='V701QA1' AND pseudo='Suspect Alpha';

 -- Nine whitespace-delimited words are not enough.
 rejected:=false;
 BEGIN
  PERFORM public.igr_v701_submit_psych_profile('V701QA1',token_,sid,
   'Il protège son image lorsque son récit devient contesté.',
   'Ses réponses esquivent plusieurs détails mais aucune preuve ne démontre pourquoi.',
   'c1_base_1','c1_base_2');
 EXCEPTION WHEN OTHERS THEN rejected:=true;END;
 IF NOT rejected THEN RAISE EXCEPTION 'nine-word answer accepted';END IF;

 rejected:=false;
 BEGIN
  PERFORM public.igr_v701_submit_psych_profile('V701QA1',token_,sid,
   'Il semble protéger son image lorsque son récit devient contesté.',
   'Ses réponses esquivent plusieurs détails mais aucune preuve ne démontre pourquoi.',
   'c2_base_1','c2_base_2');
 EXCEPTION WHEN OTHERS THEN rejected:=true;END;
 IF NOT rejected THEN RAISE EXCEPTION 'wrong-cycle questions accepted';END IF;

 rejected:=false;
 BEGIN
  PERFORM public.igr_v701_submit_psych_profile('V701QA1',token_,sid,
   'Il semble protéger son image lorsque son récit devient contesté.',
   'Ses réponses esquivent plusieurs détails mais aucune preuve ne démontre pourquoi.',
   null,null);
 EXCEPTION WHEN OTHERS THEN rejected:=true;END;
 IF NOT rejected THEN RAISE EXCEPTION 'null question codes accepted';END IF;

 PERFORM public.igr_v701_submit_psych_profile('V701QA1',token_,sid,
  'Il semble protéger son image lorsque son récit devient contesté.',
  'Ses réponses esquivent plusieurs détails mais aucune preuve ne démontre pourquoi.',
  'c1_base_1','c1_base_2');
 v:=public.igr_v700_psych_profiles('V701QA1',token_);
 IF jsonb_array_length(v->'profiles')<>1 OR
  v#>>'{profiles,0,question_one_code}'<>'c1_base_1'
 THEN RAISE EXCEPTION 'submitted question codes not archived';END IF;

 v:=public.igr_v700_psych_profiles('V701QA1',other_);
 IF coalesce((v->>'enabled')::boolean,false) OR jsonb_array_length(v->'profiles')<>0
 THEN RAISE EXCEPTION 'profiles leaked before finish';END IF;

 rejected:=false;
 BEGIN
  PERFORM public.igr_v701_submit_psych_profile('V701QA1',other_,sid,
   'Il semble protéger son image lorsque son récit devient contesté.',
   'Ses réponses esquivent plusieurs détails mais aucune preuve ne démontre pourquoi.',
   'c1_base_1','c1_base_2');
 EXCEPTION WHEN OTHERS THEN rejected:=true;END;
 IF NOT rejected THEN RAISE EXCEPTION 'non analyst changed profiles';END IF;

 -- Cycle progression works without completing Beta/Gamma; no effect on progression.
 UPDATE public.igr_v4_rooms SET cycle=2 WHERE code='V701QA1';
 PERFORM public.igr_v701_submit_psych_profile('V701QA1',token_,sid,
  'Il semble vouloir convaincre autrui sans exposer vraiment ses motivations.',
  'Sa réaction aux questions paraît prudente, sans suffire à établir sa responsabilité.',
  'c2_interview_1','c2_interview_2');
 v:=public.igr_v700_psych_profiles('V701QA1',token_);
 IF jsonb_array_length(v->'profiles')<>2 OR
    v#>>'{profiles,1,question_two_code}'<>'c2_interview_2'
 THEN RAISE EXCEPTION 'cycle progression incorrect';END IF;

 UPDATE public.igr_v4_rooms SET status='finished',phase='reveal' WHERE code='V701QA1';
 v:=public.igr_v700_psych_profiles('V701QA1',other_);
 IF NOT coalesce((v->>'published')::boolean,false) OR
   jsonb_array_length(v->'profiles')<>2
 THEN RAISE EXCEPTION 'public postgame archive missing';END IF;
 SELECT count(*) INTO count_ FROM public.igr_v4_events
 WHERE room_code='V701QA1' AND event_type='igr_v700_psych_profile';
 IF count_<>0 THEN RAISE EXCEPTION 'psychological profile became public event';END IF;
END $qa$;
SELECT 'PASS v701: ten-word rule, fixed short questions, no premature disclosure, cycling, no verdict gate' AS result;
ROLLBACK;