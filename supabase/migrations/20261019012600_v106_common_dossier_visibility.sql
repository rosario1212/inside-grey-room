-- v106. Compatible with current clients: stamp event cycle, preserve role-filtered
-- sync, and expose ONLY deliberately public case-file entries to verified players.
alter table public.igr_v4_events add column if not exists cycle integer;

create or replace function igr_private.igr_v106_stamp_event_cycle()
returns trigger language plpgsql security definer set search_path='' as $body$
begin
  if new.cycle is null then
    select r.cycle into new.cycle from public.igr_v4_rooms r where r.code=new.room_code;
  end if;
  return new;
end $body$;
revoke all on function igr_private.igr_v106_stamp_event_cycle() from public,anon,authenticated;
drop trigger if exists igr_v106_stamp_event_cycle on public.igr_v4_events;
create trigger igr_v106_stamp_event_cycle before insert on public.igr_v4_events
for each row execute function igr_private.igr_v106_stamp_event_cycle();

-- Existing sync RPC depends on this helper. Keep the same shape and access
-- behavior, adding only event cycle / visibility metadata for authorized events.
create or replace function public.igr_v4_visible_events(p_room text, p_player public.igr_v4_players)
returns jsonb language sql security definer set search_path='public' as $body$
 select coalesce(jsonb_agg(jsonb_build_object(
  'id',e.id,'event_type',e.event_type,'payload',e.payload,
  'created_at',e.created_at,'cycle',e.cycle,'visibility',e.visibility
 ) order by e.id),'[]'::jsonb)
 from public.igr_v4_events e
 where e.room_code=p_room
   and (e.visibility='public'
     or (e.visibility='private' and e.target_player_id=p_player.id)
     or (e.visibility='roles' and p_player.public_role=any(e.audience_roles)))
   and not (e.event_type='message' and e.payload ? 'author_id'
     and exists (
       select 1 from igr_private.blocks b
       where b.room_code=p_room and b.blocker_player_id=p_player.id
         and b.blocked_player_id=(e.payload->>'author_id')::uuid
     ))
$body$;
revoke all on function public.igr_v4_visible_events(text,public.igr_v4_players) from public,anon,authenticated;

-- Authoritative public case-file retrieval. NEVER return private/roles events,
-- personal cards, room state, or investigative notebooks.
create or replace function public.igr_v106_common_dossier(p_code text,p_player_token uuid)
returns jsonb language plpgsql security definer set search_path='' as $body$
declare
  actor public.igr_v4_players%rowtype;
  current_room public.igr_v4_rooms%rowtype;
  shared jsonb;
begin
  perform igr_private.rate_limit('v106_common_dossier',p_player_token::text,90,60);
  select * into actor from public.igr_v4_players
    where room_code=upper(trim(p_code)) and player_token=p_player_token;
  if not found then raise exception 'forbidden'; end if;
  select * into current_room from public.igr_v4_rooms where code=actor.room_code;
  if not found then raise exception 'room not found'; end if;
  select coalesce(jsonb_agg(
    jsonb_build_object('id',e.id,'event_type',e.event_type,
      'title',left(coalesce(e.payload->>'title',''),160),
      'text',left(coalesce(e.payload->>'text',e.payload->>'summary',''),1200),
      'author',left(coalesce(e.payload->>'author',''),80),
      'source',left(coalesce(e.payload->>'source',''),50),
      'press_claim',e.payload->>'press_claim'='true',
      'verified',e.payload->>'verified'='true',
      'cycle',e.cycle,'created_at',e.created_at)
    order by e.id),'[]'::jsonb) into shared
  from public.igr_v4_events e
  where e.room_code=actor.room_code and e.visibility='public'
    and (e.event_type in (
      'breaking_news','context','public_announcement','public_notice',
      'public_evidence','public_statement','public_event','announcement'
    ) or e.payload->>'public_broadcast'='true'
       or (e.event_type='reveal' and current_room.status='finished'))
    and coalesce(e.payload->>'title',e.payload->>'text',e.payload->>'summary','')<>'';
  return jsonb_build_object('room_code',current_room.code,
    'context',(select left(coalesce(sp.pack->>'context',''),1800)
       from public.igr_v4_scenario_packs sp where sp.scenario_id=current_room.scenario_id),
    'events',shared);
end $body$;
revoke all on function public.igr_v106_common_dossier(text,uuid) from public,authenticated;
grant execute on function public.igr_v106_common_dossier(text,uuid) to anon;

-- Serialize manual publication count checks with the same room lock as scripted breaking news.
CREATE OR REPLACE FUNCTION public.igr_v50_publish_manual_breaking(p_code text, p_player_token uuid, p_title text, p_text text, p_source_basis text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare p public.igr_v4_players%rowtype; r public.igr_v4_rooms%rowtype; cyc int; total int; title_text text; body_text text; src text;
begin
 select * into p from public.igr_v4_players where room_code=upper(trim(p_code)) and player_token=p_player_token; if not found or p.public_role<>'journaliste' then raise exception 'forbidden'; end if; select * into r from public.igr_v4_rooms where code=p.room_code for update; if r.status<>'playing' or r.cycle not between 1 and 3 then raise exception 'closed'; end if; select count(*) into cyc from public.igr_v4_actions where room_code=r.code and player_id=p.id and cycle=r.cycle and action_type in ('breaking_news','breaking_news_manual'); select count(*) into total from public.igr_v4_actions where room_code=r.code and player_id=p.id and action_type in ('breaking_news','breaking_news_manual'); if cyc>=3 then raise exception 'three publications already used this cycle'; end if; if total>=6 then raise exception 'six publications already used'; end if;
 src:=lower(trim(coalesce(p_source_basis,''))); if src not in ('observation','declaration','document','public','investigation') then raise exception 'invalid source basis'; end if; title_text:=left(trim(coalesce(p_title,'')),90); body_text:=left(trim(coalesce(p_text,'')),360); if length(title_text)<4 or length(body_text)<8 then raise exception 'publication too short'; end if; perform igr_private.assert_ugc(title_text,90,false); perform igr_private.assert_ugc(body_text,360,false);
 insert into public.igr_v4_actions(room_code,player_id,cycle,action_type,payload) values(r.code,p.id,r.cycle,'breaking_news_manual',jsonb_build_object('title',title_text,'text',body_text,'source_basis',src,'scripted',false)); insert into public.igr_v4_events(room_code,event_type,visibility,payload) values(r.code,'breaking_news','public',jsonb_build_object('title','‼️ BREAKING NEWS — '||title_text,'text',body_text,'author',p.pseudo,'public_broadcast',true,'source','journaliste','source_basis',src,'verified',false,'press_claim',true)); return jsonb_build_object('ok',true,'visibility','public','cycle_count',cyc+1,'total_count',total+1);
end $function$

