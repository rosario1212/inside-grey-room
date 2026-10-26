-- OMERTÀ · Avis final privé de l'Enquêteur.
-- Une réponse positive valide la DEUXIÈME condition, indépendamment des 3 cartes.
-- La condition personnelle et la survie sont contrôlées séparément lors du verdict.
create or replace function public.igr_omerta_indic_assess(
 p_code text,p_player_token uuid,p_useful boolean
) returns jsonb
language plpgsql security definer set search_path=''
as $assess$
declare
 enq public.igr_v4_players%rowtype;
 room public.igr_v4_rooms%rowtype;
 src public.igr_v4_players%rowtype;
 match_id integer;
begin
 if p_useful is null then raise exception 'invalid_assessment'; end if;
 select * into enq from public.igr_v4_players
 where room_code=upper(trim(p_code)) and player_token=p_player_token
 and public_role='enqueteur';
 if not found then raise exception 'unauthorized'; end if;
 select * into room from public.igr_v4_rooms where code=enq.room_code for update;
 if not found or room.scenario_id not in ('021','022','023','024','025')
 or room.status<>'playing' or room.phase<>'locking' then raise exception 'wrong_phase'; end if;
 if exists(select 1 from public.igr_v4_actions a where a.room_code=room.code
 and a.player_id=enq.id and a.action_type='final_lock')
 then raise exception 'final_already_locked'; end if;
 match_id:=greatest(1,coalesce((room.state->>'match_no')::int,1));
 select p.* into src from public.igr_v4_players p
 join public.igr_v4_actions a on a.player_id=p.id and a.room_code=room.code
 where p.room_code=room.code and p.public_role='suspect'
 and a.action_type='omerta_indic_response' and a.payload->>'accepted'='true'
 and coalesce((a.payload->>'match_no')::int,1)=match_id
 order by a.id desc limit 1;
 if not found then raise exception 'no_recruited_indic'; end if;
 if exists(select 1 from public.igr_v4_actions a where a.room_code=room.code
 and a.action_type='omerta_indic_final_assessment' and a.player_id=enq.id
 and coalesce((a.payload->>'match_no')::int,1)=match_id)
 then raise exception 'assessment_already_submitted'; end if;
 perform igr_private.rate_limit('omerta_indic_assess',enq.id::text,10,60);
 insert into public.igr_v4_actions(room_code,player_id,cycle,action_type,payload)
 values(room.code,enq.id,room.cycle,'omerta_indic_final_assessment',
 jsonb_build_object('source_id',src.id,'useful',p_useful,'match_no',match_id));
 return jsonb_build_object('ok',true,'useful',p_useful);
end;
$assess$;
revoke all on function public.igr_omerta_indic_assess(text,uuid,boolean) from public,anon,authenticated;
grant execute on function public.igr_omerta_indic_assess(text,uuid,boolean) to anon,authenticated;
