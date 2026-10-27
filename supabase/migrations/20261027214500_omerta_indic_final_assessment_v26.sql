-- OMERTÀ · Évaluation finale de l'Indic : l'avis authentifié de l'Enquêteur
-- suffit pour la seconde condition, sans quota des trois fiches signalées.
-- Cette migration NE modifie pas les variantes Santoro, qui restent verrouillées.
create or replace function public.igr_omerta_indic_final_assess(
 p_code text, p_player_token uuid, p_source uuid,
 p_useful boolean, p_reduction_years integer default 0
) returns jsonb
language plpgsql security definer set search_path=''
as $final$
declare
 r public.igr_v4_rooms%rowtype;
 inv public.igr_v4_players%rowtype;
 src public.igr_v4_players%rowtype;
 match_id integer;
begin
 select * into inv from public.igr_v4_players
 where room_code=upper(trim(p_code)) and player_token=p_player_token
   and public_role='enqueteur';
 if not found then raise exception 'unauthorized'; end if;
 select * into r from public.igr_v4_rooms
 where code=inv.room_code for update;
 if not found or r.scenario_id not in ('021','022','023','024','025')
   or r.status<>'playing' or r.cycle<>3 or r.phase<>'cycle_debrief'
 then raise exception 'indic_final_assessment_closed'; end if;
 if coalesce((r.state->>'omerta_standalone')::boolean,false)
 then raise exception 'standalone_indic_facts_unapproved'; end if;
 if p_useful is null or p_reduction_years is null
   or p_reduction_years not in (0,3)
 then raise exception 'invalid_indic_final_assessment'; end if;
 select * into src from public.igr_v4_players
 where room_code=r.code and id=p_source and public_role='suspect';
 if not found then raise exception 'invalid_source'; end if;
 match_id:=greatest(1,coalesce((r.state->>'match_no')::integer,1));
 if not exists(
   select 1 from public.igr_v4_actions a
   where a.room_code=r.code and a.player_id=src.id
     and a.action_type='omerta_indic_response'
     and a.payload->>'accepted'='true'
     and coalesce((a.payload->>'match_no')::integer,1)=match_id
 ) then raise exception 'indic_not_recruited'; end if;
 if exists(
   select 1 from public.igr_v4_actions a
   where a.room_code=r.code and a.action_type='omerta_indic_final_assessment'
     and a.payload->>'target'=src.id::text
     and coalesce((a.payload->>'match_no')::integer,1)=match_id
 ) then raise exception 'indic_assessment_already_final'; end if;
 perform igr_private.rate_limit('omerta_indic_final_assess',inv.id::text,5,60);
 insert into public.igr_v4_actions(room_code,player_id,cycle,action_type,payload)
 values(r.code,inv.id,r.cycle,'omerta_indic_final_assessment',
  jsonb_build_object('target',src.id,'match_no',match_id,
    'useful',p_useful,'formal_reduction_years',p_reduction_years));
 insert into public.igr_v4_events(
   room_code,cycle,event_type,visibility,target_player_id,payload)
 values(r.code,r.cycle,'omerta_indic_final_review_submitted','private',inv.id,
    jsonb_build_object('title','BILAN INDIC ENREGISTRÉ',
       'text','Appréciation finale enregistrée. Verdict confidentiel.',
       'match_no',match_id));
 return jsonb_build_object('ok',true,'recorded',true);
end;
$final$;
revoke all on function public.igr_omerta_indic_final_assess(
 text,uuid,uuid,boolean,integer) from public,anon,authenticated;
grant execute on function public.igr_omerta_indic_final_assess(
 text,uuid,uuid,boolean,integer) to anon,authenticated;
