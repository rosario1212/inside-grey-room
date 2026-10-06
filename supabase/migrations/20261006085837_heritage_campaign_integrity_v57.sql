-- v57: public carry, Judge authority and safe completion. No hidden canon in carry.
alter table public.igr_heritage_online_rooms add column if not exists campaign_carry jsonb;

create or replace function public.igr_heritage_online_context_v57(p_code text,p_host_token uuid,p_context jsonb)
returns jsonb language plpgsql security definer set search_path to 'public'
as $function$
declare r public.igr_heritage_online_rooms%rowtype; c jsonb;
begin
 p_code:=upper(trim(coalesce(p_code,'')));
 select * into r from public.igr_heritage_online_rooms where code=p_code and host_token=p_host_token for update;
 if not found then raise exception 'unauthorized'; end if;
 if r.stage<>'lobby' then raise exception 'wrong stage'; end if;
 if jsonb_typeof(p_context)<>'object' or p_context->>'id' is distinct from r.campaign_id or octet_length(p_context::text)>64000 then raise exception 'invalid context'; end if;
 c:=jsonb_build_object('id',r.campaign_id,'completed',coalesce(p_context->'completed','[]'::jsonb));
 if r.campaign_id='cendres' then c:=c||jsonb_build_object('cendres',jsonb_build_object('flags',p_context#>'{cendres,flags}','crisis',p_context#>'{cendres,crisis}','network',p_context#>'{cendres,network}'));
 elsif r.campaign_id='kuroi' then c:=c||jsonb_build_object('kuroi',jsonb_build_object('flags',p_context#>'{kuroi,flags}','debts',coalesce((select jsonb_agg(x) from jsonb_array_elements(coalesce(p_context#>'{kuroi,debts}','[]'::jsonb)) x where coalesce(x->>'private','false')<>'true'),'[]'::jsonb),'chronicle',coalesce((select jsonb_agg(x) from jsonb_array_elements(coalesce(p_context#>'{kuroi,chronicle}','[]'::jsonb)) x where coalesce(x->>'visibility','public')<>'private'),'[]'::jsonb)));
 else c:=c||jsonb_build_object('summary',left(p_context->>'summary',6000),'maitre',jsonb_build_object('facts',p_context#>'{maitre,facts}','links',p_context#>'{maitre,links}','relationships',p_context#>'{maitre,relationships}','reputation',p_context#>'{maitre,reputation}','decisions',p_context#>'{maitre,decisions}'));
 end if;
 update public.igr_heritage_online_rooms set campaign_carry=c,updated_at=now() where code=p_code;
 return jsonb_build_object('ok',true);
end $function$;
revoke all on function public.igr_heritage_online_context_v57(text,uuid,jsonb) from public;
grant execute on function public.igr_heritage_online_context_v57(text,uuid,jsonb) to anon,authenticated;

create or replace function public.igr_heritage_online_sync(p_code text,p_player_token uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_room public.igr_heritage_online_rooms%rowtype;
  v_player public.igr_heritage_online_players%rowtype;
  v_players jsonb;
begin
  p_code:=upper(trim(coalesce(p_code,'')));
  select * into v_player from public.igr_heritage_online_players where room_code=p_code and player_token=p_player_token;
  if not found then raise exception 'unauthorized'; end if;
  select * into v_room from public.igr_heritage_online_rooms where code=p_code;
  if not found then raise exception 'room not found'; end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id',id,'pseudo',pseudo,'seat_index',seat_index,'is_host',is_host,'ready',ready,
    'role_id',case when v_room.status='playing' then role_id else null end
  ) order by seat_index),'[]'::jsonb)
  into v_players
  from public.igr_heritage_online_players
  where room_code=p_code;

  return jsonb_build_object(
    'room',jsonb_build_object(
      'code',v_room.code,'campaign_id',v_room.campaign_id,'chapter',v_room.chapter,
      'status',v_room.status,'stage',v_room.stage,'phase_index',v_room.phase_index,
      'decision_id',v_room.decision_id,'updated_at',v_room.updated_at,'campaign_carry',v_room.campaign_carry,
      'maitre_angle',case when v_room.campaign_id='maitre' and (v_player.role_id='avocat' or v_room.phase_index>=2 or v_room.stage in ('reveal','finished')) then v_room.maitre_angle else null end,
      'maitre_demonstration',case when v_room.campaign_id='maitre' and (v_player.role_id='avocat' or v_room.phase_index>=2 or v_room.stage in ('reveal','finished')) then v_room.maitre_demonstration else null end,
      'maitre_variant',case
        when v_room.campaign_id='maitre' and v_player.role_id in ('client','enqueteur','temoin')
          then v_room.maitre_variant
        else null
      end
    ),
    'player',jsonb_build_object(
      'id',v_player.id,'pseudo',v_player.pseudo,'is_host',v_player.is_host,'ready',v_player.ready,
      'role_id',case when v_room.status='playing' then v_player.role_id else null end
    ),
    'players',v_players
  );
end
$function$;


create or replace function public.igr_heritage_online_decide(p_code text,p_host_token uuid,p_option_id text)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_room public.igr_heritage_online_rooms%rowtype;
  v_allowed text[];
begin
  p_code:=upper(trim(coalesce(p_code,'')));
  select * into v_room from public.igr_heritage_online_rooms where code=p_code and host_token=p_host_token for update;
  if not found then raise exception 'unauthorized'; end if;
  if v_room.stage<>'decision' then raise exception 'wrong stage'; end if;
  if v_room.campaign_id='maitre' and exists(select 1 from public.igr_heritage_online_players where room_code=p_code and role_id='juge') then raise exception 'judge only'; end if;
  v_allowed:=public.igr_heritage_online_decisions(v_room.campaign_id,v_room.chapter);
  if not (trim(coalesce(p_option_id,''))=any(v_allowed)) then raise exception 'invalid option'; end if;
  update public.igr_heritage_online_rooms set decision_id=trim(p_option_id),stage='reveal',updated_at=now() where code=p_code;
  return jsonb_build_object('ok',true,'decision_id',trim(p_option_id));
end
$function$;


create or replace function public.igr_heritage_online_finish(p_code text,p_host_token uuid)
returns jsonb language plpgsql security definer set search_path to 'public'
as $function$
declare r public.igr_heritage_online_rooms%rowtype;
begin
 p_code:=upper(trim(coalesce(p_code,'')));
 select * into r from public.igr_heritage_online_rooms where code=p_code and host_token=p_host_token for update;
 if not found then raise exception 'unauthorized'; end if;
 if r.stage='finished' then return jsonb_build_object('ok',true); end if;
 if r.stage<>'reveal' or r.decision_id is null then raise exception 'decision required'; end if;
 update public.igr_heritage_online_rooms set status='finished',stage='finished',updated_at=now() where code=p_code;
 return jsonb_build_object('ok',true);
end $function$;
