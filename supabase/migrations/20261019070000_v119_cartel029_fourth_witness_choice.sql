-- 029: fourth witness cooperation remains private, with full freedom to change position.
create or replace function public.igr_v119_029_position(p_code text,p_token uuid,p_choice text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare a public.igr_v4_players%rowtype;r public.igr_v4_rooms%rowtype;
 profile_id text;match_id integer;
begin
 perform igr_private.rate_limit('029_choice',p_token::text,8,60);
 select * into a from public.igr_v4_players where room_code=upper(trim(p_code)) and player_token=p_token;
 if not found or a.public_role<>'suspect' or a.internal_slot<>4 then raise exception 'forbidden';end if;
 select * into r from public.igr_v4_rooms where code=a.room_code for update;
 if r.scenario_id<>'029' or r.status<>'playing' or r.cycle not in (2,3)
 or not igr_private.igr_v108_029_is_enabled() then raise exception 'unavailable';end if;
 if p_choice not in ('cooperate','loyal') then raise exception 'invalid choice';end if;
 match_id:=greatest(1,coalesce((r.state->>'match_no')::int,1));
 select profile into profile_id from igr_private.igr_v108_029_room_variants
 where room_code=r.code and match_no=match_id;
 if profile_id not in ('V3','V4','V5') then raise exception 'unavailable';end if;
 if exists(select 1 from public.igr_v4_actions x
   where x.room_code=r.code and x.player_id=a.id and x.cycle=r.cycle and x.action_type='cartel029_position')
 then raise exception 'already chosen this cycle';end if;
 insert into public.igr_v4_actions(room_code,player_id,cycle,action_type,payload)
 values(r.code,a.id,r.cycle,'cartel029_position',jsonb_build_object('choice',p_choice));
 return jsonb_build_object('ok',true,'choice',p_choice);
end $$;
revoke all on function public.igr_v119_029_position(text,uuid,text) from public,authenticated;
grant execute on function public.igr_v119_029_position(text,uuid,text) to anon;
