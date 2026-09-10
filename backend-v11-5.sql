-- Inside Grey Room V11.5 playtest backend additions
alter table public.igr_v4_players
  add column if not exists avatar_data text,
  add column if not exists avatar_rev integer not null default 0;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname='igr_v4_players_avatar_size_check'
  ) then
    alter table public.igr_v4_players
      add constraint igr_v4_players_avatar_size_check
      check (avatar_data is null or char_length(avatar_data) <= 120000);
  end if;
end $$;

create or replace function public.igr_v4_set_avatar(p_code text, p_player_token uuid, p_avatar text)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare p public.igr_v4_players%rowtype; r public.igr_v4_rooms%rowtype; v text;
begin
  select * into p from public.igr_v4_players where room_code=upper(trim(p_code)) and player_token=p_player_token;
  if not found then raise exception 'unauthorized'; end if;
  select * into r from public.igr_v4_rooms where code=p.room_code;
  if r.status<>'lobby' then raise exception 'profile locked after start'; end if;
  v:=nullif(trim(coalesce(p_avatar,'')),'');
  if v is not null then
    if char_length(v)>120000 then raise exception 'avatar too large'; end if;
    if v !~ '^data:image/(jpeg|jpg|png|webp);base64,' then raise exception 'invalid avatar'; end if;
  end if;
  update public.igr_v4_players
     set avatar_data=v, avatar_rev=avatar_rev+1
   where id=p.id;
  return jsonb_build_object('ok',true);
end $$;

create or replace function public.igr_v4_get_avatars(p_code text, p_player_token uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare p public.igr_v4_players%rowtype;
begin
  select * into p from public.igr_v4_players where room_code=upper(trim(p_code)) and player_token=p_player_token;
  if not found then raise exception 'unauthorized'; end if;
  return (
    select coalesce(jsonb_agg(jsonb_build_object('id',id,'avatar',avatar_data,'rev',avatar_rev) order by seat_index),'[]'::jsonb)
      from public.igr_v4_players
     where room_code=p.room_code
  );
end $$;

create or replace function public.igr_v4_start_game(p_code text, p_host_token uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare r public.igr_v4_rooms%rowtype; c int; p public.igr_v4_players%rowtype; role text; sus_ids uuid[]:=array[]::uuid[]; spy_pos int; spy_id uuid;
begin
 select * into r from public.igr_v4_rooms where code=upper(trim(p_code)) and host_token=p_host_token for update;
 if not found then raise exception 'unauthorized'; end if; if r.status<>'lobby' then raise exception 'already started'; end if;
 select count(*) into c from public.igr_v4_players where room_code=r.code;
 if c<public.igr_v4_min_players(r.scenario_id) then raise exception 'not enough players'; end if;
 for p in select * from public.igr_v4_players where room_code=r.code order by seat_index loop role:=public.igr_v4_role_for_seat(r.scenario_id,p.seat_index,c); update public.igr_v4_players set public_role=role,secret_role=role,ready=false where id=p.id; end loop;
 with ranked as (select id,row_number() over(order by md5(r.code||id::text))::int slot from public.igr_v4_players where room_code=r.code and public_role='suspect') update public.igr_v4_players x set internal_slot=ranked.slot from ranked where x.id=ranked.id;
 select array_agg(id order by internal_slot) into sus_ids from public.igr_v4_players where room_code=r.code and public_role='suspect';
 if r.scenario_id in ('013','014','016','019','020') and array_length(sus_ids,1)>0 then spy_pos:=1+(abs(hashtext(r.code))%array_length(sus_ids,1)); spy_id:=sus_ids[spy_pos]; update public.igr_v4_players set secret_role='espion' where id=spy_id; end if;
 for p in select * from public.igr_v4_players where room_code=r.code loop update public.igr_v4_players set private_state=public.igr_v4_build_private_card(r.code,p.id) where id=p.id; end loop;
 update public.igr_v4_rooms set status='playing',cycle=0,phase='briefing',phase_started_at=now(),phase_ends_at=now()+interval '28 seconds',state=jsonb_build_object('heard','[]'::jsonb,'used_trames','{}'::jsonb,'used_news','{}'::jsonb,'annex_queue','[]'::jsonb,'annex_index',0,'video_active',false,'video_cut_until',null),updated_at=now() where code=r.code;
 insert into public.igr_v4_events(room_code,event_type,payload) select r.code,'context',jsonb_build_object('title','CONTEXTE','text',x.pack->>'context') from public.igr_v4_scenario_packs x where x.scenario_id=r.scenario_id;
 insert into public.igr_v4_events(room_code,event_type,payload) values(r.code,'phase',jsonb_build_object('title','BRIEFING DU DOSSIER','text','La musique du lobby s’arrête. Le MJ présente le contexte public avant la distribution lisible des cartes.'));
 return jsonb_build_object('ok',true);
end $$;

create or replace function public.igr_v4_tick(p_room text)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare r public.igr_v4_rooms%rowtype; heard jsonb; target text; suspect_count int; q jsonb; idx int; item jsonb; next_idx int; defq jsonb;
begin
 select * into r from public.igr_v4_rooms where code=p_room for update;
 if not found or r.status<>'playing' then return; end if;
 if r.phase_ends_at is null or now()<r.phase_ends_at then return; end if;
 if r.phase='briefing' then
   update public.igr_v4_rooms set phase='role_reading',phase_started_at=now(),phase_ends_at=now()+interval '5 minutes',updated_at=now() where code=r.code;
   insert into public.igr_v4_events(room_code,event_type,payload) values(r.code,'roles_distributed',jsonb_build_object('title','OUVERTURE DU DOSSIER','text','Cartes privées distribuées. Lecture individuelle : 5 minutes.'));
 elsif r.phase='role_reading' then
   update public.igr_v4_rooms set phase='initial_debrief',phase_started_at=now(),phase_ends_at=now()+interval '3 minutes',updated_at=now() where code=r.code;
   insert into public.igr_v4_events(room_code,event_type,payload) values(r.code,'phase',jsonb_build_object('title','DÉBRIEF INITIAL','text','Enquêteur + Analyste : 3 minutes. Si aucun Analyste n’est présent, l’Enquêteur travaille seul.'));
 elsif r.phase='initial_debrief' then perform public.igr_v4_start_cycle(r.code,1);
 elsif r.phase='interrogation' then
   heard:=coalesce(r.state->'heard','[]'::jsonb); target:=r.state->>'current_target';
   if target is not null and not (heard ? target) then heard:=heard||to_jsonb(target); end if;
   select count(*) into suspect_count from public.igr_v4_players where room_code=r.code and public_role='suspect';
   if jsonb_array_length(heard)>=suspect_count then
     update public.igr_v4_rooms set phase='cycle_debrief',phase_started_at=now(),phase_ends_at=now()+interval '3 minutes',state=jsonb_set(state,'{heard}',heard,true),updated_at=now() where code=r.code;
     insert into public.igr_v4_events(room_code,event_type,payload) values(r.code,'phase',jsonb_build_object('title','DÉBRIEF','text','Enquêteur et Analyste répondent à trois questions très courtes. Le MJ choisira seul la trame.'));
   else update public.igr_v4_rooms set phase='interrogation_select',phase_started_at=now(),phase_ends_at=null,state=jsonb_set(state,'{heard}',heard,true),updated_at=now() where code=r.code; end if;
 elsif r.phase='cycle_debrief' then perform public.igr_v4_start_next_annex_or_trame(r.code);
 elsif r.phase like 'annex_%' then perform public.igr_v4_start_next_annex_or_trame(r.code);
 elsif r.phase='trame' then
   if r.cycle<3 then perform public.igr_v4_start_cycle(r.code,r.cycle+1);
   else
     update public.igr_v4_rooms set phase='closed',phase_started_at=now(),phase_ends_at=now()+interval '5 seconds',updated_at=now() where code=r.code;
     insert into public.igr_v4_events(room_code,event_type,payload) values(r.code,'phase',jsonb_build_object('title','ENQUÊTE CLOSE','text','Plus aucune trame, expertise, Breaking News ou action de terrain ne peut être déclenchée.'));
   end if;
 elsif r.phase='closed' then perform public.igr_v4_start_orals(r.code);
 elsif r.phase='provisional_orals' then
   q:=coalesce(r.state->'oral_queue','[]'::jsonb); idx:=coalesce((r.state->>'oral_index')::int,0); next_idx:=idx+1;
   if next_idx<jsonb_array_length(q) then item:=q->next_idx; update public.igr_v4_rooms set phase_started_at=now(),phase_ends_at=now()+make_interval(secs=>(item->>'seconds')::int),state=jsonb_set(state,'{oral_index}',to_jsonb(next_idx),true),updated_at=now() where code=r.code; insert into public.igr_v4_events(room_code,event_type,payload) values(r.code,'phase',jsonb_build_object('title','CONCLUSION PROVISOIRE','text',(item->>'pseudo')||' prend la parole.'));
   else update public.igr_v4_rooms set phase='provisional_lock',phase_started_at=now(),phase_ends_at=null,updated_at=now() where code=r.code; insert into public.igr_v4_events(room_code,event_type,payload) values(r.code,'phase',jsonb_build_object('title','ACCUSATIONS PROVISOIRES','text','L’Enquêteur verrouille maintenant le degré provisoire de responsabilité de chaque suspect.')); end if;
 elsif r.phase='defense' then
   defq:=coalesce(r.state->'defense_queue','[]'::jsonb); idx:=coalesce((r.state->>'defense_index')::int,0); next_idx:=idx+1;
   if next_idx<jsonb_array_length(defq) then item:=defq->next_idx; update public.igr_v4_rooms set phase_started_at=now(),phase_ends_at=now()+interval '5 minutes',state=jsonb_set(state,'{defense_index}',to_jsonb(next_idx),true),updated_at=now() where code=r.code; insert into public.igr_v4_events(room_code,event_type,payload) values(r.code,'phase',jsonb_build_object('title','DERNIÈRE DÉFENSE','text',(item->>'pseudo')||' dispose de 5 minutes. L’Avocat éventuel partage ce temps.'));
   else update public.igr_v4_rooms set phase='final_debrief',phase_started_at=now(),phase_ends_at=now()+interval '3 minutes',updated_at=now() where code=r.code; insert into public.igr_v4_events(room_code,event_type,payload) values(r.code,'phase',jsonb_build_object('title','DERNIER DÉBRIEF','text','Enquêteur + Analyste, avec Procureur si présent : 3 minutes. Le Juge reste à l’extérieur.')); end if;
 elsif r.phase='final_debrief' then
   update public.igr_v4_rooms set phase='locking',phase_started_at=now(),phase_ends_at=null,updated_at=now() where code=r.code;
   insert into public.igr_v4_events(room_code,event_type,payload) values(r.code,'phase',jsonb_build_object('title','FIN DES ÉCHANGES','text','Chaque rôle concerné verrouille son choix final sur son propre téléphone.'));
 end if;
end $$;

create or replace function public.igr_v4_sync(p_code text, p_player_token uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare p public.igr_v4_players%rowtype; r public.igr_v4_rooms%rowtype; players jsonb; ev jsonb; suspects jsonb; pack jsonb; my_actions jsonb; protected_meta jsonb; field_meta jsonb; expert_meta jsonb;
begin
 select * into p from public.igr_v4_players where room_code=upper(trim(p_code)) and player_token=p_player_token;
 if not found then raise exception 'unauthorized'; end if;
 perform public.igr_v4_tick(p.room_code);
 select * into r from public.igr_v4_rooms where code=p.room_code;
 select x.pack into pack from public.igr_v4_scenario_packs x where x.scenario_id=r.scenario_id;
 select coalesce(jsonb_agg(jsonb_build_object('id',id,'pseudo',pseudo,'seat_index',seat_index,'is_host',is_host,'public_role',public_role,'ready',ready,'avatar_rev',avatar_rev,'has_avatar',avatar_data is not null) order by seat_index),'[]'::jsonb) into players from public.igr_v4_players where room_code=r.code;
 ev:=public.igr_v4_visible_events(r.code,p);
 select coalesce(jsonb_agg(jsonb_build_object('id',id,'pseudo',pseudo) order by seat_index),'[]'::jsonb) into suspects from public.igr_v4_players where room_code=r.code and public_role='suspect';
 select coalesce(jsonb_agg(jsonb_build_object('id',id,'cycle',cycle,'action_type',action_type,'payload',payload,'created_at',created_at) order by id),'[]'::jsonb) into my_actions from public.igr_v4_actions where room_code=r.code and player_id=p.id;
 if p.public_role='juge' then select coalesce(jsonb_agg(jsonb_build_object('id',v->>'id','title',v->>'title','cost',coalesce((v->>'cost')::int,1))),'[]'::jsonb) into protected_meta from jsonb_array_elements(coalesce(pack->'protected','[]'::jsonb)) v; else protected_meta:='[]'::jsonb; end if;
 if p.public_role='inspecteur' then select coalesce(jsonb_agg(jsonb_build_object('id',v->>'id','title',v->>'title')),'[]'::jsonb) into field_meta from jsonb_array_elements(coalesce(pack->'field_actions','[]'::jsonb)) v; else field_meta:='[]'::jsonb; end if;
 if p.public_role='expert' then select coalesce(jsonb_agg(jsonb_build_object('id',v->>'id','title',v->>'title')),'[]'::jsonb) into expert_meta from jsonb_array_elements(coalesce(pack->'expert_actions','[]'::jsonb)) v; else expert_meta:='[]'::jsonb; end if;
 return jsonb_build_object(
  'room',jsonb_build_object('code',r.code,'scenario_id',r.scenario_id,'status',r.status,'cycle',r.cycle,'phase',r.phase,'phase_started_at',r.phase_started_at,'phase_ends_at',r.phase_ends_at,'state',r.state,'min_players',public.igr_v4_min_players(r.scenario_id),'max_players',public.igr_v4_max_players(r.scenario_id)),
  'player',jsonb_build_object('id',p.id,'pseudo',p.pseudo,'is_host',p.is_host,'public_role',p.public_role,'secret_role',case when r.status in ('playing','finished') and r.phase<>'briefing' then p.secret_role else null end,'private_state',case when r.status in ('playing','finished') and r.phase<>'briefing' then p.private_state else '{}'::jsonb end),
  'players',players,'suspects',suspects,'events',ev,'my_actions',my_actions,
  'scenario',jsonb_build_object('context',pack->>'context','news',case when p.public_role='journaliste' then pack->'news' else '[]'::jsonb end,'protected',protected_meta,'field_actions',field_meta,'expert_actions',expert_meta,'truth',case when r.status='finished' then pack->'truth' else null end)
 );
end $$;

revoke all on function public.igr_v4_set_avatar(text,uuid,text) from public;
revoke all on function public.igr_v4_get_avatars(text,uuid) from public;
grant execute on function public.igr_v4_set_avatar(text,uuid,text) to anon, authenticated;
grant execute on function public.igr_v4_get_avatars(text,uuid) to anon, authenticated;
