-- OMERTÀ 021 · pacte secret entre Enquêteur et Indic.
-- Aucun accusé/indice nouveau publiquement visible. Les événements de cette
-- mécanique sont privés et les données de vote ne valent PAS preuve de parole.
-- Fonctionnalité pilote, non appliquée à la base de production.

create or replace function public.igr_omerta_indic_offer(
 p_code text, p_player_token uuid, p_suspect uuid
) returns jsonb language plpgsql security definer set search_path=''
as $$
declare
 inv public.igr_v4_players%rowtype;
 sus public.igr_v4_players%rowtype;
 room public.igr_v4_rooms%rowtype;
 offer_id bigint;
 match_id int;
begin
 select * into inv from public.igr_v4_players
 where room_code=upper(trim(p_code)) and player_token=p_player_token and public_role='enqueteur';
 if not found then raise exception 'unauthorized'; end if;
 select * into room from public.igr_v4_rooms where code=inv.room_code for update;
 if room.scenario_id<>'021' or room.status<>'playing' or room.cycle<2
 or room.phase in ('briefing','provisional_lock','final_debrief','locking','reveal')
 then raise exception 'indic_closed'; end if;
 perform igr_private.rate_limit('omerta_indic_offer',inv.id::text,8,60);
 match_id:=greatest(1,coalesce((room.state->>'match_no')::int,1));
 select * into sus from public.igr_v4_players
 where room_code=room.code and id=p_suspect and public_role='suspect';
 if not found or sus.internal_slot not in (1,7)
 or coalesce((room.state->'omerta'->'dead') ? p_suspect::text,false)
 then raise exception 'invalid_source'; end if;
 if exists(
  select 1 from public.igr_v4_actions a where a.room_code=room.code
  and a.action_type='omerta_indic_response' and a.payload->>'accepted'='true'
  and coalesce((a.payload->>'match_no')::int,1)=match_id
 ) then raise exception 'indic_already_recruited'; end if;
 if exists(
  select 1 from public.igr_v4_actions a
  where a.room_code=room.code and a.action_type='omerta_indic_offer'
    and coalesce((a.payload->>'match_no')::int,1)=match_id
    and a.payload->>'target'=sus.id::text
 ) then raise exception 'offer_already_made'; end if;
 insert into public.igr_v4_actions(room_code,player_id,cycle,action_type,payload)
 values(room.code,inv.id,room.cycle,'omerta_indic_offer',jsonb_build_object(
  'target',sus.id,'match_no',match_id)) returning id into offer_id;
 insert into public.igr_v4_events(room_code,cycle,event_type,visibility,target_player_id,payload)
 values(room.code,room.cycle,'omerta_indic_offer','private',sus.id,
 jsonb_build_object('title','PROPOSITION CONFIDENTIELLE',
 'text','L’Enquêteur te propose de devenir sa source. Tu peux accepter ou refuser. Parlez librement avant de décider.',
 'offer_id',offer_id,'match_no',match_id));
 return jsonb_build_object('ok',true,'offer_id',offer_id);
end $$;

create or replace function public.igr_omerta_indic_respond(
 p_code text, p_player_token uuid, p_accept boolean
) returns jsonb language plpgsql security definer set search_path=''
as $$
declare
 suspect public.igr_v4_players%rowtype;
 inv public.igr_v4_players%rowtype;
 room public.igr_v4_rooms%rowtype;
 orig public.igr_v4_actions%rowtype;
 match_id int;
begin
 select * into suspect from public.igr_v4_players
 where room_code=upper(trim(p_code)) and player_token=p_player_token and public_role='suspect';
 if not found then raise exception 'unauthorized'; end if;
 select * into room from public.igr_v4_rooms where code=suspect.room_code for update;
 if room.scenario_id<>'021' or room.status<>'playing' or room.cycle<2
  or room.phase in ('briefing','provisional_lock','final_debrief','locking','reveal')
  or coalesce((room.state->'omerta'->'dead') ? suspect.id::text,false)
 then raise exception 'indic_closed'; end if;
 match_id:=greatest(1,coalesce((room.state->>'match_no')::int,1));
 select * into orig from public.igr_v4_actions a
 where a.room_code=room.code and a.action_type='omerta_indic_offer'
  and a.payload->>'target'=suspect.id::text
  and coalesce((a.payload->>'match_no')::int,1)=match_id
 order by a.id desc limit 1;
 if not found then raise exception 'offer_missing'; end if;
 if exists(select 1 from public.igr_v4_actions a
   where a.room_code=room.code and a.action_type='omerta_indic_response'
   and a.payload->>'offer_id'=orig.id::text
 ) then raise exception 'already_decided'; end if;
 if p_accept and exists(
  select 1 from public.igr_v4_actions a where a.room_code=room.code
  and a.action_type='omerta_indic_response' and a.payload->>'accepted'='true'
  and coalesce((a.payload->>'match_no')::int,1)=match_id
 ) then raise exception 'indic_already_recruited'; end if;
 select * into inv from public.igr_v4_players
 where id=orig.player_id and room_code=room.code and public_role='enqueteur';
 if not found then raise exception 'investigator_not_found'; end if;
 insert into public.igr_v4_actions(room_code,player_id,cycle,action_type,payload)
 values(room.code,suspect.id,room.cycle,'omerta_indic_response',jsonb_build_object(
   'offer_id',orig.id,'accepted',p_accept,'match_no',match_id));
 insert into public.igr_v4_events(room_code,cycle,event_type,visibility,target_player_id,payload)
 values(room.code,room.cycle,'omerta_indic_status','private',suspect.id,
   jsonb_build_object('title',case when p_accept then 'PACTE ACCEPTÉ' else 'PACTE REFUSÉ' end,
   'text',case when p_accept then 'Tu peux désormais signaler une piste ou consigner un renseignement après l’avoir évoqué oralement.' else 'Tu restes libre de ne pas coopérer.' end,
   'accepted',p_accept,'match_no',match_id));
 insert into public.igr_v4_events(room_code,cycle,event_type,visibility,target_player_id,payload)
 values(room.code,room.cycle,'omerta_indic_status','private',inv.id,
   jsonb_build_object('title',case when p_accept then 'SOURCE RECRUTÉE' else 'PROPOSITION REFUSÉE' end,
   'text',case when p_accept then suspect.pseudo||' accepte de coopérer.' else suspect.pseudo||' refuse de coopérer.' end,
   'accepted',p_accept,'source_id',suspect.id,'match_no',match_id));
 return jsonb_build_object('ok',true,'accepted',p_accept);
end $$;

revoke all on function public.igr_omerta_indic_offer(text,uuid,uuid) from public;
revoke all on function public.igr_omerta_indic_respond(text,uuid,boolean) from public;
grant execute on function public.igr_omerta_indic_offer(text,uuid,uuid) to anon,authenticated;
grant execute on function public.igr_omerta_indic_respond(text,uuid,boolean) to anon,authenticated;
