-- IGR v829: verified activity, not registration count, governs host absence recovery.
create table if not exists igr_private.igr_v829_player_presence (
 room_code text not null,
 player_id uuid not null references public.igr_v4_players(id) on delete cascade,
 last_seen_at timestamptz not null default now(),
 primary key(room_code,player_id)
);
alter table igr_private.igr_v829_player_presence enable row level security;
revoke all on igr_private.igr_v829_player_presence from public,anon,authenticated;

create or replace function igr_private.igr_v829_touch(p_code text,p_player_token uuid)
returns uuid language plpgsql security definer set search_path to '' as $$
declare pid uuid; code_ text;
begin
 code_:=upper(trim(p_code));
 if length(code_)<4 or length(code_)>64 or p_player_token is null
 then raise exception 'bad presence request';end if;
 select id into pid from public.igr_v4_players
 where room_code=code_ and player_token=p_player_token;
 if not found then raise exception 'unauthorized';end if;
 insert into igr_private.igr_v829_player_presence(room_code,player_id,last_seen_at)
 values(code_,pid,now()) on conflict(room_code,player_id)
 do update set last_seen_at=excluded.last_seen_at
 where igr_v829_player_presence.last_seen_at<now()-interval '8 seconds';
 return pid;
end;$$;
revoke all on function igr_private.igr_v829_touch(text,uuid) from public,anon,authenticated;

create or replace function public.igr_v829_presence_status(p_code text,p_player_token uuid)
returns jsonb language plpgsql security definer set search_path to '' as $$
declare me uuid; r public.igr_v4_rooms%rowtype; peers jsonb;
begin
 me:=igr_private.igr_v829_touch(p_code,p_player_token);
 select * into r from public.igr_v4_rooms where code=upper(trim(p_code));
 if not found then raise exception 'room not found';end if;
 select coalesce(jsonb_agg(jsonb_build_object(
    'id',p.id::text,
    'known',pr.last_seen_at is not null,
    'active',coalesce(pr.last_seen_at>=now()-interval '90 seconds',false),
    'eligible_to_recover',case when pr.last_seen_at is not null
       then pr.last_seen_at<now()-interval '135 seconds'
       else coalesce(r.phase_started_at,r.created_at)<now()-interval '180 seconds' end
  ) order by p.seat_index),'[]'::jsonb)
 into peers from public.igr_v4_players p
 left join igr_private.igr_v829_player_presence pr
    on pr.room_code=p.room_code and pr.player_id=p.id
 where p.room_code=r.code;
 return jsonb_build_object('ok',true,'room_code',r.code,
   'room_status',r.status,'peers',peers);
end;$$;
revoke all on function public.igr_v829_presence_status(text,uuid) from public;
grant execute on function public.igr_v829_presence_status(text,uuid) to anon,authenticated;

-- Legacy and new clients touch presence through ordinary room sync.
CREATE OR REPLACE FUNCTION public.igr_v4_sync(p_code text, p_player_token uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
 raw jsonb;
 room public.igr_v4_rooms%rowtype;
 pack jsonb;
 originals jsonb;
 extras jsonb;
begin
 perform igr_private.igr_v829_touch(p_code,p_player_token);
 raw:=public.igr_omerta_standalone_safe_sync(p_code,p_player_token);
 if raw->'player'->>'public_role'='suspect'
    and raw->'room'->>'status' in ('playing','finished')
    and pg_catalog.jsonb_typeof(raw#>'{player,private_state}')='object' then
  raw:=pg_catalog.jsonb_set(raw,'{player,private_state}',
    igr_private.igr_v769_authored_supplement(p_code,
      (raw#>>'{player,id}')::uuid,
      raw->'room'->>'scenario_id',
      raw#>'{player,private_state}'),true);
 end if;
 if raw->'room'->>'scenario_id' in ('021','022','023','024','025','030')
    and raw->'player'->>'public_role'='suspect'
    and raw->'room'->>'status' in ('playing','finished') then
  raw:=pg_catalog.jsonb_set(raw,'{player,private_state}',
    igr_private.igr_v765_alias_document(
      coalesce(raw#>'{player,private_state}','{}'::jsonb),
      igr_private.igr_v765_cast_aliases(p_code,
        raw->'room'->>'scenario_id')),true);
 end if;
 if raw->'room'->>'scenario_id' in ('005','006')
    and raw->'player'->>'public_role'='suspect'
    and raw->'room'->>'status' in ('playing','finished') then
  raw:=jsonb_set(raw,'{player,private_state}',
   igr_private.igr_v764_visible_suspect_card(p_code,
    raw->'room'->>'scenario_id',
    coalesce(raw#>'{player,private_state}','{}'::jsonb)),true);
 end if;
 if raw->'room'->>'scenario_id' in ('001','002','003','004','005') and
    raw->'player'->>'public_role' in ('enqueteur','analyste')
    and coalesce(igr_private.igr_v286_enabled(p_code),false)
 then return igr_private.igr_v286_sync_overlay(p_code,p_player_token,raw);end if;
 if raw->'room'->>'scenario_id'='007'
 and coalesce(igr_private.igr_v289_007_enabled(p_code),false)
 then return igr_private.igr_v289_007_sync_overlay(p_code,p_player_token,raw);end if;
 if raw->'room'->>'scenario_id'='008'
 and coalesce(igr_private.igr_v310_008_enabled(p_code),false)
 then return igr_private.igr_v310_008_sync_overlay(p_code,p_player_token,raw);end if;
 if raw->'room'->>'scenario_id'='010'
 and coalesce(igr_private.igr_v361_010_enabled(p_code),false)
 then return igr_private.igr_v361_010_sync_overlay(p_code,p_player_token,raw);end if;
 if raw->'room'->>'scenario_id'='009'
 and coalesce(igr_private.igr_v340_009_enabled(p_code),false)
 then return igr_private.igr_v340_009_sync_overlay(p_code,p_player_token,raw);end if;
 if raw->'room'->>'scenario_id'='017' AND raw->'room'->>'status'='playing' THEN
 return igr_private.igr_v546_017_sync_overlay(p_code,p_player_token,raw);END IF;
 if raw->'room'->>'scenario_id'='016' AND raw->'room'->>'status'='playing' THEN
 return igr_private.igr_v506_016_sync_overlay(p_code,p_player_token,raw);END IF;
 if raw->'room'->>'scenario_id'='015' AND raw->'room'->>'status'='playing' THEN
 return igr_private.igr_v466_015_sync_overlay(p_code,p_player_token,raw);END IF;
 if raw->'room'->>'scenario_id'='014' AND raw->'room'->>'status'='playing' THEN
 return igr_private.igr_v446_014_sync_overlay(p_code,p_player_token,raw);END IF;
 if raw->'room'->>'scenario_id'='013' AND raw->'room'->>'status'='playing' THEN
 return igr_private.igr_v423_013_sync_overlay(p_code,p_player_token,raw);END IF;
 if raw->'room'->>'scenario_id'='012' AND raw->'room'->>'status'='playing' THEN
 return igr_private.igr_v403_012_sync_overlay(p_code,p_player_token,raw);END IF;
 if raw->'room'->>'scenario_id'='011' AND raw->'room'->>'status'='playing' THEN
  return igr_private.igr_v391_011_sync_overlay(p_code,p_player_token,raw);END IF;

 if raw->'room'->>'scenario_id'='018' and raw->'room'->>'status'='playing'
    and raw->'player'->>'public_role' in ('enqueteur','analyste') then
  raw:=jsonb_set(raw,'{scenario,investigation_018}',igr_private.igr_v650_018_offered(p_code,(raw#>>'{room,cycle}')::int),true);
  raw:=jsonb_set(raw,'{scenario,investigation_018_used}',
    to_jsonb((select count(*)>=1 from public.igr_v4_actions a
      where a.room_code=upper(trim(p_code)) and a.cycle=(raw#>>'{room,cycle}')::int
      and a.action_type='investigation_018')),true);
  raw:=jsonb_set(raw,'{scenario,investigation_018_adaptive}','true'::jsonb,true);
  raw:=jsonb_set(raw,'{scenario,investigation_018_limit}',to_jsonb(1),true);
 end if;

 if raw->'room'->>'scenario_id'='018' AND raw->'room'->>'status'='playing' AND raw->'player'->>'public_role' NOT IN ('enqueteur','analyste') THEN
  raw:=jsonb_set(raw,'{scenario,investigation_018}','[]'::jsonb,true);
 end if;
 if raw->'room'->>'scenario_id'='019' and raw->'room'->>'status'='playing'
 and raw->'player'->>'public_role' in ('enqueteur','analyste') then
  raw:=jsonb_set(raw,'{scenario,investigation_019}',
    igr_private.igr_v665_019_offered(p_code,(raw#>>'{room,cycle}')::int),true);
  raw:=jsonb_set(raw,'{scenario,investigation_019_used}',
    to_jsonb((select count(*)>=1 from public.igr_v4_actions a
      where a.room_code=upper(trim(p_code)) and a.cycle=(raw#>>'{room,cycle}')::int
        and a.action_type='investigation_019')),true);
  raw:=jsonb_set(raw,'{scenario,investigation_019_adaptive}','true'::jsonb,true);
  raw:=jsonb_set(raw,'{scenario,investigation_019_limit}',to_jsonb(1),true);
 end if;

 if raw->'room'->>'scenario_id'='019' AND raw->'room'->>'status'='playing' AND raw->'player'->>'public_role' NOT IN ('enqueteur','analyste') THEN
  raw:=jsonb_set(raw,'{scenario,investigation_019}','[]'::jsonb,true);
 end if;
 if raw->'room'->>'scenario_id'='020' and raw->'room'->>'status'='playing'
 and raw->'player'->>'public_role' in ('enqueteur','analyste') then
  raw:=jsonb_set(raw,'{scenario,investigation_020}',
    igr_private.igr_v675_020_offered(p_code,(raw#>>'{room,cycle}')::int),true);
  raw:=jsonb_set(raw,'{scenario,investigation_020_used}',
    to_jsonb((select count(*)>=1 from public.igr_v4_actions a
      where a.room_code=upper(trim(p_code)) and a.cycle=(raw#>>'{room,cycle}')::int
       and a.action_type='investigation_020')),true);
  raw:=jsonb_set(raw,'{scenario,investigation_020_adaptive}','true'::jsonb,true);
  raw:=jsonb_set(raw,'{scenario,investigation_020_limit}',to_jsonb(1),true);
 end if;
 select * into room from public.igr_v4_rooms where code=upper(trim(p_code));
 if not found or room.scenario_id<>'006' or room.status<>'playing'
    or raw->'player'->>'public_role' not in ('enqueteur','analyste')
 then return raw;end if;
 pack:=igr_private.igr_v260_006_pinned_pack(room.code);
 if coalesce(pack->'truth'->'reconstruction_006'->>'mode','')<>'mountain_v1'
    or jsonb_array_length(coalesce(pack->'investigation_006','[]'::jsonb))<>20
 then return raw;end if;
 select coalesce(jsonb_agg(jsonb_set(e,'{id}',to_jsonb(regexp_replace(e->>'id','^006_[ABC]_','006_')),true) order by e->>'id'),'[]'::jsonb)
 into originals
 from jsonb_array_elements(coalesce(raw->'scenario'->'investigation_006','[]'::jsonb)) e
 where (e->>'id') ~ '^006_[ABC]_[1-9]$';
 extras:=igr_private.igr_v283_006_offered(room.code,room.cycle);
 raw:=jsonb_set(raw,'{scenario,investigation_006}',originals||extras,true);
 raw:=jsonb_set(raw,'{scenario,investigation_006_limit}',to_jsonb(1),true);
raw:=jsonb_set(raw,'{scenario,investigation_006_used}',to_jsonb(EXISTS(SELECT 1 FROM public.igr_v4_actions a WHERE a.room_code=room.code AND a.cycle=room.cycle AND a.action_type='investigation_006')),true);
 raw:=jsonb_set(raw,'{scenario,investigation_006_adaptive}','true'::jsonb,true);
if exists(select 1 from igr_private.igr_v99_room_canons c where c.room_code=room.code and c.scenario_id='006' and coalesce((c.manuscript->'v284_detailed_questionnaire'->>'enabled')::boolean,false)) then raw:=jsonb_set(raw,'{scenario,investigation_006_detailed}','true'::jsonb,true);end if;
 return raw;
end $function$;


CREATE OR REPLACE FUNCTION public.igr_omerta_standalone_safe_sync(p_code text, p_player_token uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
 raw jsonb;
 st jsonb;
 m jsonb;
 room public.igr_v4_rooms%rowtype;
 match_id integer;
 events_filtered jsonb;
 safe_private jsonb;
 card_result jsonb;
 game_role text;
begin
 perform igr_private.igr_v829_touch(p_code,p_player_token);
 raw:=public.igr_omerta_legacy_sync_core(p_code,p_player_token);
 select * into room from public.igr_v4_rooms
 where code=upper(trim(p_code));
 if not found then raise exception 'unauthorized';end if;
 if room.scenario_id not in ('021','022','023','024','025')
   or coalesce((room.state->>'omerta_standalone')::boolean,false) is not true
 then return raw;end if;

 match_id:=greatest(1,coalesce((room.state->>'match_no')::integer,1));
 select s.manuscript into m
 from igr_private.igr_omerta_room_variant_snapshots s
 where s.room_code=room.code and s.match_no=match_id
   and s.scenario_id=room.scenario_id;
 if m is null then raise exception 'standalone_snapshot_missing';end if;

 -- Pas de chronologie omnisciente, final_reveal, liste des rôles secrets,
 -- contexte Verri, trames Verri, ni arbre familial hérité.
 st:=coalesce(raw->'room'->'state','{}'::jsonb)
     - 'omerta_campaign' - 'omerta_campaign_id' - 'omerta_campaign_mode'
     - 'family_tree' - 'omerta_santoro_family';
 -- Internal hierarchy, real names and assigned ranks must never appear in
 -- the investigation-side synchronization payload. Only suspects receive it.
 if raw->'player'->>'public_role'='suspect' then
   st:=jsonb_set(st,'{omerta_santoro_family}',igr_private.igr_omerta_santoro_family(room.code,match_id),true);
 end if;
 raw:=jsonb_set(raw,'{room,state}',st,true);
 raw:=jsonb_set(raw,'{scenario}',jsonb_build_object(
   'context',m->>'public_briefing',
   -- La conclusion est invisible avant fermeture officielle mais le
   -- moteur d'affichage hérité doit pouvoir l'afficher une fois terminé.
   'truth',case when room.status='finished' then m->'final_reveal' else null end,
   'protected','[]'::jsonb,
   'field_actions','[]'::jsonb,
   'expert_actions','[]'::jsonb,
   'news','[]'::jsonb
 ),true);
 select coalesce(jsonb_agg(e.value order by (e.value->>'id')::bigint),'[]'::jsonb)
 into events_filtered
 from pg_catalog.jsonb_array_elements(
    coalesce(raw->'events','[]'::jsonb)) e(value)
 where (e.value->>'event_type'='context'
          and e.value->'payload'->>'text'=m->>'public_briefing'
          and coalesce((e.value->'payload'->>'match_no')::integer,-1)=match_id)
    or (e.value->>'event_type'='omerta_c3_crosscheck'
          and coalesce((e.value->'payload'->>'match_no')::integer,-1)=match_id);
 raw:=jsonb_set(raw,'{events}',events_filtered,true);
 -- Core v4 sync can still contain an old Verri private_state for
 -- non-suspects, or stale rematch action logs. Replace them at source.
 game_role:=raw->'player'->>'public_role';
 if room.status in ('playing','finished') then
   if game_role='suspect' then
     card_result:=public.igr_omerta_my_private_dossier(p_code,p_player_token);
     if card_result->>'available'<>'true'
     then raise exception 'standalone_private_cast_missing';end if;
     safe_private:=card_result->'card';
   elsif game_role in ('enqueteur','analyste') then
     safe_private:=jsonb_build_object(
       'identity',case when game_role='analyste' then 'Analyste' else 'Enquêteur' end,
       'objective','Reconstituer les faits sans inventer de preuve.',
       'what_you_know',m->>'public_briefing',
       'what_you_hide','',
       'your_chronology','',
       'conversation_hooks','[]'::jsonb
     );
   else
     safe_private:='{}'::jsonb;
   end if;
 else
   safe_private:='{}'::jsonb;
 end if;
 raw:=jsonb_set(raw,'{player,private_state}',safe_private,true);
 -- Older reveal/action records may encode historical case text.
 raw:=jsonb_set(raw,'{my_actions}','[]'::jsonb,true);
 return raw;
end;
$function$;


-- Host recovery is only possible after an actual inactivity grace period.
CREATE OR REPLACE FUNCTION public.igr_v59_host_recover(p_code text, p_host_token uuid, p_player_id uuid, p_reason text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare r public.igr_v4_rooms%rowtype;p public.igr_v4_players%rowtype;q jsonb;absent jsonb;note text;st jsonb;
begin
 select * into r from public.igr_v4_rooms where code=upper(trim(p_code)) and host_token=p_host_token for update;if not found then raise exception 'forbidden';end if;
 if r.status<>'playing' or r.phase not in ('final_audience','final_suspect_defenses','final_lawyer_opinions','locking') then raise exception 'wrong phase';end if;
 if coalesce((r.state->>'timer_paused')::boolean,false) then raise exception 'resume timer first';end if;
 if now()<coalesce(r.phase_started_at,now())+make_interval(secs=>case when r.phase='locking' then 120 else 60 end) then raise exception 'recovery delay not reached';end if;
 select * into p from public.igr_v4_players where id=p_player_id and room_code=r.code;if not found or p.is_host then raise exception 'invalid absent player';end if;
 -- A temporarily hidden Safari tab is NOT a confirmed absence.
 if exists(select 1 from igr_private.igr_v829_player_presence pr
  where pr.room_code=r.code and pr.player_id=p.id
  and pr.last_seen_at>=now()-interval '135 seconds')
 then raise exception 'player still active recently; cannot mark absent';end if;
 if not exists(select 1 from igr_private.igr_v829_player_presence pr
  where pr.room_code=r.code and pr.player_id=p.id)
  and coalesce(r.phase_started_at,r.created_at)>now()-interval '180 seconds'
 then raise exception 'presence unverified; wait before confirming absence';end if;
 note:=left(trim(coalesce(p_reason,'')),180);if length(note)<8 then raise exception 'absence reason required';end if;perform igr_private.assert_ugc(note,180,false);
 absent:=coalesce(r.state->'v59_absent','[]'::jsonb);if absent ? p.id::text then return jsonb_build_object('ok',true,'already_absent',true);end if;
 if r.phase<>'locking' then
  q:=r.state->'v52_queue'->coalesce((r.state->>'v52_index')::int,0);
  if r.phase='final_suspect_defenses' and r.state->>'v52_stage'='courtroom' then
    if p.public_role<>'suspect' then raise exception 'only an absent defendant can be marked in courtroom';end if;
  elsif r.state->>'v52_status'<>'waiting' or q->>'player_id'<>p.id::text then raise exception 'only waiting current player';end if;
 else
  if not (public.igr_v52_investigation_role(p.public_role) or p.public_role='journaliste') then raise exception 'not a final voter';end if;
  if exists(select 1 from public.igr_v4_actions where room_code=r.code and player_id=p.id and action_type='final_lock') and (p.public_role not in ('enqueteur','analyste','procureur') or exists(select 1 from public.igr_v4_actions where room_code=r.code and player_id=p.id and action_type='judge_integrity_vote') or not public.igr_v44_judge_present(r.code)) and not (r.scenario_id='027' and p.public_role='inspecteur' and nullif(r.state#>>'{terror_runtime,decision}','') is null) then raise exception 'player already completed';end if;
 end if;
 update public.igr_v4_rooms set state=jsonb_set(state,'{v59_absent}',absent||jsonb_build_array(p.id::text),true),updated_at=now() where code=r.code;
 insert into public.igr_v4_events(room_code,event_type,visibility,payload) values(r.code,'final_absence','public',jsonb_build_object('title','ABSENCE CONFIRMÉE','text',p.pseudo||' : absent. Aucune décision inventée. Motif : '||note,'player_id',p.id));
 if r.phase='locking' then st:=public.igr_v52_maybe_finish(r.code);
  elsif r.phase='final_suspect_defenses' and r.state->>'v52_stage'='courtroom' then st:='{}'::jsonb;
  else perform public.igr_v52_advance(r.code,'host_confirmed_absence');st:='{}'::jsonb;end if;
 return jsonb_build_object('ok',true)||st;
end$function$;
