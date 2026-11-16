-- V723 | CARTEL 029 collective investigation verdict.
-- Future sessions only; ongoing 029 games retain the originally published rules.
-- Explicit per-person voting, sealed until reveal, strict majority on both axes.
-- The shared investigative report remains useful but cannot veto the team's win.

CREATE OR REPLACE FUNCTION igr_private.igr_v723_029_mark_new_game()
RETURNS trigger LANGUAGE plpgsql SET search_path TO '' AS $v723_mark$
BEGIN
 IF NEW.scenario_id='029' AND OLD.status='lobby' AND NEW.status='playing'
    AND igr_private.igr_v108_029_is_enabled() THEN
   NEW.state:=jsonb_set(coalesce(NEW.state,'{}'::jsonb),
      '{cartel029_collective_v723}','true'::jsonb,true);
   -- A rematch must never inherit a previous match's sealed votes.
   DELETE FROM public.igr_v4_actions
   WHERE room_code=NEW.code AND action_type='cartel029_final_opinion';
 END IF;
 RETURN NEW;
END $v723_mark$;

DROP TRIGGER IF EXISTS igr_v723_029_mark_new_game ON public.igr_v4_rooms;
CREATE TRIGGER igr_v723_029_mark_new_game
 BEFORE UPDATE OF status ON public.igr_v4_rooms
 FOR EACH ROW EXECUTE FUNCTION igr_private.igr_v723_029_mark_new_game();
REVOKE ALL ON FUNCTION igr_private.igr_v723_029_mark_new_game() FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.igr_v723_029_vote(
 p_code text,p_player_token uuid,p_responsibility text,p_witness4 text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $v723_vote$
DECLARE
 actor public.igr_v4_players%rowtype;
 room public.igr_v4_rooms%rowtype;
 earlier public.igr_v4_actions%rowtype;
 match_id integer;
BEGIN
 PERFORM igr_private.rate_limit('029_collective_vote',coalesce(p_player_token::text,'none'),8,60);
 SELECT * INTO actor FROM public.igr_v4_players
 WHERE room_code=upper(trim(p_code)) AND player_token=p_player_token;
 IF NOT FOUND OR actor.public_role NOT IN ('enqueteur','analyste','procureur','juge')
 THEN RAISE EXCEPTION 'forbidden'; END IF;
 SELECT * INTO room FROM public.igr_v4_rooms WHERE code=actor.room_code FOR UPDATE;
 IF NOT FOUND OR room.scenario_id<>'029' OR room.status<>'playing'
    OR room.phase<>'locking' OR room.cycle<>3
    OR NOT coalesce((room.state->>'cartel029_collective_v723')::boolean,false)
    OR NOT igr_private.igr_v108_029_is_enabled()
 THEN RAISE EXCEPTION 'vote_unavailable'; END IF;
 IF coalesce(room.state->'v59_absent','[]'::jsonb) ? actor.id::text
 THEN RAISE EXCEPTION 'absent_player_cannot_vote'; END IF;
 IF p_responsibility NOT IN ('local','execution','finance','unknown')
   OR p_witness4 NOT IN ('innocent','coerced','voluntary','operative','unknown')
 THEN RAISE EXCEPTION 'invalid_029_opinion'; END IF;
 match_id:=greatest(1,coalesce((room.state->>'match_no')::int,1));
 SELECT * INTO earlier FROM public.igr_v4_actions
 WHERE room_code=room.code AND player_id=actor.id AND cycle=room.cycle
   AND action_type='cartel029_final_opinion' ORDER BY id DESC LIMIT 1;
 IF FOUND THEN
   IF earlier.payload->>'responsibility'=p_responsibility
     AND earlier.payload->>'witness4'=p_witness4
     AND earlier.payload->>'match_no'=match_id::text
   THEN RETURN jsonb_build_object('ok',true,'already',true); END IF;
   RAISE EXCEPTION 'vote_already_locked';
 END IF;
 INSERT INTO public.igr_v4_actions(room_code,player_id,cycle,action_type,payload)
 VALUES(room.code,actor.id,room.cycle,'cartel029_final_opinion',
   jsonb_build_object('match_no',match_id,'responsibility',p_responsibility,
                      'witness4',p_witness4));
 RETURN jsonb_build_object('ok',true,'already',false);
END $v723_vote$;
REVOKE ALL ON FUNCTION public.igr_v723_029_vote(text,uuid,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.igr_v723_029_vote(text,uuid,text,text) TO anon,authenticated;

CREATE OR REPLACE FUNCTION igr_private.igr_v723_029_require_vote()
RETURNS trigger LANGUAGE plpgsql SET search_path TO '' AS $v723_guard$
DECLARE room public.igr_v4_rooms%rowtype; voter_role text; match_id integer;
BEGIN
 IF NEW.action_type<>'final_lock' THEN RETURN NEW; END IF;
 SELECT * INTO room FROM public.igr_v4_rooms WHERE code=NEW.room_code;
 IF NOT FOUND OR room.scenario_id<>'029'
   OR NOT coalesce((room.state->>'cartel029_collective_v723')::boolean,false)
 THEN RETURN NEW; END IF;
 SELECT public_role INTO voter_role FROM public.igr_v4_players
 WHERE id=NEW.player_id AND room_code=room.code;
 IF voter_role IN ('enqueteur','analyste','procureur','juge') THEN
   match_id:=greatest(1,coalesce((room.state->>'match_no')::int,1));
   IF NOT EXISTS(SELECT 1 FROM public.igr_v4_actions a
      WHERE a.room_code=room.code AND a.player_id=NEW.player_id
        AND a.action_type='cartel029_final_opinion' AND a.cycle=room.cycle
        AND a.payload->>'match_no'=match_id::text)
   THEN RAISE EXCEPTION '029_collective_vote_required'; END IF;
 END IF;
 RETURN NEW;
END $v723_guard$;
DROP TRIGGER IF EXISTS igr_v723_029_require_vote ON public.igr_v4_actions;
CREATE TRIGGER igr_v723_029_require_vote
 BEFORE INSERT ON public.igr_v4_actions FOR EACH ROW
 WHEN (NEW.action_type='final_lock')
 EXECUTE FUNCTION igr_private.igr_v723_029_require_vote();
REVOKE ALL ON FUNCTION igr_private.igr_v723_029_require_vote() FROM PUBLIC,anon,authenticated;

-- Only the private scorer changes, and only for newly marked rooms.
CREATE OR REPLACE FUNCTION igr_private.igr_v120_029_make_reveal(p_room text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare r public.igr_v4_rooms%rowtype; a igr_private.igr_v107_029_editorial_matrix%rowtype;
 pin igr_private.igr_v108_029_room_variants%rowtype;
 p public.igr_v4_players%rowtype; written jsonb:='{}'::jsonb;
 report_ok boolean:=false; branch_ok boolean:=false; witness_ok boolean:=false; shield_count int:=0;
 results jsonb:='[]'::jsonb; winners jsonb:='[]'::jsonb;
 protection_detail text; choice text; profile_real text;
 is_victim boolean; won boolean; explanation text; headline text;
 leader_choice text; news_count int; final_angle_len int;
 collective_v723 boolean:=false; electorate int:=0; votes_cast int:=0;
 branch_votes int:=0; witness_votes int:=0; match_id int;
begin
 select * into r from public.igr_v4_rooms where code=p_room;
 if not found or r.scenario_id<>'029' or not coalesce((r.state->>'cartel029_ready')::boolean,false)
    or not igr_private.igr_v108_029_is_enabled() then raise exception 'unavailable';end if;
 select * into pin from igr_private.igr_v108_029_room_variants
 where room_code=r.code and match_no=greatest(1,coalesce((r.state->>'match_no')::int,1));
 if not found then raise exception 'private ending missing';end if;
 select * into a from igr_private.igr_v107_029_editorial_matrix
 where branch=pin.branch and profile=pin.profile and editorial_status='approved' and public_enabled;
 if not found then raise exception 'unapproved outcome';end if;
 select fields, status='submitted' into written,report_ok from public.igr_v107_029_reports
 where room_code=r.code and match_no=pin.match_no;
 written:=coalesce(written,'{}'::jsonb); report_ok:=coalesce(report_ok,false)
  and length(trim(coalesce(written->>'santa_ceniza','')))>=12
  and length(trim(coalesce(written->>'activities','')))>=12
  and length(trim(coalesce(written->>'responsibilities','')))>=12;
 branch_ok:=report_ok and coalesce(written->>'responsibility_choice','unknown')=case pin.branch when 'A' then 'local' when 'B' then 'execution' else 'finance' end;
 witness_ok:=report_ok and coalesce(written->>'witness4_assessment','unknown')=case pin.profile when 'V1' then 'innocent' when 'V2' then 'innocent' when 'V3' then 'coerced' when 'V4' then 'voluntary' else 'operative' end;
 -- New 029 sessions use EACH active investigation member's sealed opinion.
 -- No investigator, judge, prosecutor or host has a casting vote. Strict
 -- absolute majority is required on BOTH axes; ties are inconclusive.
 collective_v723:=coalesce((r.state->>'cartel029_collective_v723')::boolean,false);
 IF collective_v723 THEN
   match_id:=greatest(1,coalesce((r.state->>'match_no')::int,1));
   SELECT count(*) INTO electorate FROM public.igr_v4_players voter
   WHERE voter.room_code=r.code
     AND voter.public_role IN ('enqueteur','analyste','procureur','juge')
     AND NOT (coalesce(r.state->'v59_absent','[]'::jsonb) ? voter.id::text);
   SELECT count(distinct a.player_id),
     count(distinct a.player_id) FILTER(WHERE a.payload->>'responsibility'=
       CASE pin.branch WHEN 'A' THEN 'local' WHEN 'B' THEN 'execution' ELSE 'finance' END),
     count(distinct a.player_id) FILTER(WHERE a.payload->>'witness4'=
       CASE pin.profile WHEN 'V1' THEN 'innocent' WHEN 'V2' THEN 'innocent'
        WHEN 'V3' THEN 'coerced' WHEN 'V4' THEN 'voluntary' ELSE 'operative' END)
   INTO votes_cast,branch_votes,witness_votes
   FROM public.igr_v4_actions a
   JOIN public.igr_v4_players voter ON voter.id=a.player_id AND voter.room_code=r.code
   WHERE a.room_code=r.code AND a.action_type='cartel029_final_opinion'
     AND a.cycle=r.cycle AND a.payload->>'match_no'=match_id::text
     AND voter.public_role IN ('enqueteur','analyste','procureur','juge')
     AND NOT(coalesce(r.state->'v59_absent','[]'::jsonb) ? voter.id::text);
   branch_ok:=electorate>0 AND votes_cast=electorate AND branch_votes*2>electorate;
   witness_ok:=electorate>0 AND votes_cast=electorate AND witness_votes*2>electorate;
 END IF;
 select count(distinct payload->>'target') into shield_count
 from public.igr_v4_actions where room_code=r.code and action_type='cartel029_protection';
 select payload->>'choice' into choice from public.igr_v4_actions
 where room_code=r.code and action_type='cartel029_position'
 order by cycle desc,id desc limit 1;
 protection_detail:=case when shield_count=3
  then 'Les trois mesures de protection ont été décidées. La libération des captifs doit encore être confirmée.'
  when shield_count>0 then 'Certaines protections ont été engagées, mais des personnes restent exposées.'
  else 'Aucune protection supplémentaire n’a été décidée. Le danger demeure, sans décès automatique.' end;
 profile_real:=coalesce(a.authoring->'witness4'->>'real','La situation du quatrième témoin reste à vérifier.');
 headline:='Santa Ceniza : sept morts, trois rescapés, vingt captifs au moment de la fuite. '
   ||coalesce(a.authoring->'branch'->>'responsibility','La chaîne de commandement doit être établie.')||' '
   ||'Quatrième témoin : '||profile_real||' '||protection_detail;
 for p in select * from public.igr_v4_players where room_code=r.code order by seat_index loop
  is_victim:=p.public_role='suspect';
  if p.public_role in ('enqueteur','analyste','procureur','juge') then
    won:=branch_ok and witness_ok and shield_count>=2;
    explanation:=case when collective_v723 then
        case when won then 'La majorité du camp d’enquête a établi les deux responsabilités et au moins deux protections ont été engagées.'
        else 'Les deux conclusions n’ont pas obtenu une majorité absolue correcte, ou les protections sont insuffisantes.' end
      when won then 'Le rapport a été remis et des protections ont été engagées.'
      else 'Le rapport ou les mesures de protection restent incomplets.' end;
  elsif p.public_role='maitre' then
    won:=not branch_ok and exists(
      select 1 from public.igr_v43_lawyer_representations rep
      where rep.room_code=r.code and rep.lawyer_id=p.id
    );
    explanation:=case when won then
      'Tu as obtenu un mandat officiel et la chaîne de responsabilité du cartel reste non établie.'
      else 'Ton objectif exigeait un mandat officiel et une chaîne de responsabilité du cartel restée non établie.' end;
  elsif p.public_role='journaliste' then
    -- A publication is not automatically verified merely because it was sent.
    -- Assess editorial process, not the factual truth of free-form player text.
    select count(*) into news_count from public.igr_v4_actions x
    where x.room_code=r.code and x.player_id=p.id and x.action_type='breaking_news_manual'
      and length(trim(coalesce(x.payload->>'text','')))>=40
      and x.payload->>'source_basis' in ('observation','declaration','document','public','investigation');
    select length(trim(coalesce(x.payload->>'note',''))) into final_angle_len
    from public.igr_v4_actions x
    where x.room_code=r.code and x.player_id=p.id and x.action_type='final_lock'
    order by x.id desc limit 1;
    won:=news_count>=1 and coalesce(final_angle_len,0)>=24;
    explanation:=case when won then
      'Tu as publié une information attribuée à une source et défendu ton angle final. La véracité des faits n’est pas certifiée automatiquement.'
      else 'Pour atteindre ton objectif : une publication personnelle d’au moins 40 caractères avec une source déclarée, puis un angle final argumenté d’au moins 24 caractères.' end;
  elsif p.public_role in ('don','bras_droit') then
    select x.payload->>'choice' into leader_choice from public.igr_v4_actions x
    where x.room_code=r.code and x.player_id=p.id and x.action_type='cartel029_leadership'
    order by x.cycle desc,x.id desc limit 1;
    if p.public_role='don' then
      won:=(leader_choice='contain' and not branch_ok)
         or (leader_choice='cooperate' and branch_ok and shield_count>=2);
      explanation:=case when leader_choice='contain' then
          'Tu as choisi de préserver tes secrets. Ton objectif dépend de la conclusion réelle de l’enquête.'
        when leader_choice='cooperate' then
          'Tu as privilégié une coopération limitée. Ton objectif dépend de la vérité établie et d’au moins deux mesures de protection.'
        else 'Tu n’as pas arrêté de stratégie de commandement pendant les cycles.' end;
    else
      won:=(leader_choice='loyal' and not branch_ok)
         or (leader_choice='cooperate' and branch_ok and shield_count>=1);
      explanation:=case when leader_choice='loyal' then
          'Tu as maintenu ta loyauté. La stratégie de secret n’est gagnante que si la chaîne de responsabilité reste non établie.'
        when leader_choice='cooperate' then
          'Tu as choisi de coopérer. Ta réussite dépend de la responsabilité établie et d’une protection engagée.'
        else 'Tu n’as pris aucune position durant les cycles.' end;
    end if;
  elsif is_victim then
    if p.internal_slot=4 and pin.profile in ('V3','V4','V5') then
      won:=(coalesce(choice,'loyal')='cooperate' AND
              (CASE WHEN collective_v723 THEN branch_ok AND witness_ok ELSE report_ok END))
         OR (coalesce(choice,'loyal')='loyal' AND NOT
              (CASE WHEN collective_v723 THEN branch_ok AND witness_ok ELSE report_ok END));
      explanation:=case when coalesce(choice,'loyal')='cooperate'
        then 'Tu as choisi de coopérer. Ta décision a pesé sur la conclusion.'
        else 'Tu as conservé ta loyauté. Les enquêteurs jugeront ce que prouvent les faits.' end;
    else
      won:=(CASE WHEN collective_v723 THEN branch_ok AND witness_ok ELSE report_ok END) AND shield_count>=1;
      explanation:=case when won then 'Ton témoignage a contribué au dossier et une protection a été engagée.'
        else 'Le danger reste important et l’enquête est incomplète.' end;
    end if;
  else won:=false; explanation:='Ton rôle a participé à la partie.';end if;
  if won then winners:=winners||jsonb_build_array(p.id);end if;
  results:=results||jsonb_build_array(jsonb_build_object(
     'player_id',p.id,'pseudo',p.pseudo,
     'role',case when p.public_role='suspect' then 'temoin' else p.public_role end,
     'public_role',p.public_role,'success',won,'achievements','[]'::jsonb,'text',explanation));
 end loop;
 return jsonb_build_object('title','LE CYCLE MORT · RÉVÉLATION',
 'summary',headline,'responsibilities','[]'::jsonb,
 'results',results,'winners',winners,'winner_count',jsonb_array_length(winners),
 '029_report_submitted',report_ok,'029_responsibility_correct',branch_ok,'029_fourth_witness_correct',witness_ok,'029_protection_count',shield_count,
 '029_branch_resolved',true,'029_witness4_resolved',true,
 '029_collective_v723',collective_v723,'029_votes_cast',votes_cast,
 '029_votes_required',electorate);
end $function$


-- Protect other cases and historical 029 sessions by default (flag absent).
DO $v723_assert$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_trigger
     WHERE tgname='igr_v723_029_mark_new_game' AND tgenabled='O')
  OR NOT EXISTS(SELECT 1 FROM pg_trigger
     WHERE tgname='igr_v723_029_require_vote' AND tgenabled='O')
 THEN RAISE EXCEPTION '029 collective verdict triggers missing'; END IF;
 IF position('votes_cast=electorate' in
     pg_get_functiondef('igr_private.igr_v120_029_make_reveal(text)'::regprocedure))=0
 THEN RAISE EXCEPTION '029 strict majority scorer missing'; END IF;
END $v723_assert$;
