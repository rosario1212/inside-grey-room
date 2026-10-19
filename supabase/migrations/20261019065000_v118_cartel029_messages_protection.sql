-- 029: messages between Don and right hand, no gameplay commands.
create or replace function public.igr_v118_029_cartel_message(p_code text,p_token uuid,p_text text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare a public.igr_v4_players%rowtype;r public.igr_v4_rooms%rowtype;msg text;
begin
 perform igr_private.rate_limit('029_leader_chat',p_token::text,12,60);
 select * into a from public.igr_v4_players where room_code=upper(trim(p_code)) and player_token=p_token;
 if not found or a.public_role not in ('don','bras_droit') then raise exception 'forbidden'; end if;
 select * into r from public.igr_v4_rooms where code=a.room_code for update;
 if r.scenario_id<>'029' or r.status<>'playing' or not igr_private.igr_v108_029_is_enabled() then raise exception 'not active';end if;
 msg:=trim(coalesce(p_text,''));
 if length(msg)<1 or length(msg)>220 then raise exception 'invalid length';end if;
 perform igr_private.assert_ugc(msg,220,false);
 insert into public.igr_v4_events(room_code,event_type,visibility,audience_roles,cycle,payload)
 values(r.code,'cartel029_chat','roles',array['don','bras_droit'],r.cycle,
  jsonb_build_object('author',a.pseudo,'text',msg,'source','joueur','no_automatic_action',true));
 return jsonb_build_object('ok',true);
end $$;
revoke all on function public.igr_v118_029_cartel_message(text,uuid,text) from public,authenticated;
grant execute on function public.igr_v118_029_cartel_message(text,uuid,text) to anon;

create or replace function public.igr_v118_029_protection(p_code text,p_token uuid,p_target text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare a public.igr_v4_players%rowtype;r public.igr_v4_rooms%rowtype;caption text;
begin
 perform igr_private.rate_limit('029_protection',p_token::text,10,60);
 select * into a from public.igr_v4_players where room_code=upper(trim(p_code)) and player_token=p_token;
 if not found or a.public_role not in ('enqueteur','analyste') then raise exception 'forbidden';end if;
 select * into r from public.igr_v4_rooms where code=a.room_code for update;
 if r.scenario_id<>'029' or r.status<>'playing' or r.cycle not between 1 and 3
 or not igr_private.igr_v108_029_is_enabled() then raise exception 'not active';end if;
 if p_target not in ('survivors','relatives','captives') then raise exception 'invalid target';end if;
 if exists(select 1 from public.igr_v4_actions x where x.room_code=r.code and
 x.action_type='cartel029_protection' and (x.cycle=r.cycle or x.payload->>'target'=p_target))
 then raise exception 'protection already requested';end if;
 insert into public.igr_v4_actions(room_code,player_id,cycle,action_type,payload)
 values(r.code,a.id,r.cycle,'cartel029_protection',jsonb_build_object('target',p_target));
 caption:=case p_target when 'survivors' then 'La protection des trois rescapés est renforcée.'
 when 'relatives' then 'Les proches des rescapés sont placés à l’abri.'
 else 'Une demande urgente de libération des vingt captifs est transmise.' end;
 insert into public.igr_v4_events(room_code,event_type,visibility,cycle,payload)
 values(r.code,'public_notice','public',r.cycle,jsonb_build_object('title','PROTECTION',
 'text',caption,'verified',true,'source','Grey Room','public_broadcast',true));
 return jsonb_build_object('ok',true);
end $$;
revoke all on function public.igr_v118_029_protection(text,uuid,text) from public,authenticated;
grant execute on function public.igr_v118_029_protection(text,uuid,text) to anon;
