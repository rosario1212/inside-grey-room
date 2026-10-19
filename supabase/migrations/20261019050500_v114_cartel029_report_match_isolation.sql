-- 029 report must be tied to match identity; never reuse prior match's secrets.
alter table public.igr_v107_029_reports
  add column if not exists match_no integer not null default 1;
alter table public.igr_v107_029_reports drop constraint if exists igr_v107_029_reports_pkey;
alter table public.igr_v107_029_reports add constraint igr_v107_029_reports_pkey primary key(room_code,match_no);
CREATE OR REPLACE FUNCTION public.igr_v107_029_report(p_code text, p_player_token uuid, p_patch jsonb DEFAULT NULL::jsonb, p_submit boolean DEFAULT false)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare actor public.igr_v4_players%rowtype; room public.igr_v4_rooms%rowtype;
  v_report public.igr_v107_029_reports%rowtype; ky text; val jsonb; content text;
  normalized jsonb:='{}'::jsonb;
  v_match integer; wanted constant text[] := array['santa_ceniza','activities','responsibilities','protection'];
begin
 perform igr_private.rate_limit('v107_029_report',coalesce(p_player_token::text,'none'),30,60);
 select * into actor from public.igr_v4_players where room_code=upper(trim(p_code)) and player_token=p_player_token;
 if not found or actor.public_role not in ('enqueteur','analyste') then raise exception 'forbidden'; end if;
 select * into room from public.igr_v4_rooms where code=actor.room_code for update;
 if not found or room.scenario_id<>'029' or room.status not in ('playing','finished') or not igr_private.igr_v108_029_is_enabled() then raise exception 'scenario not active'; end if;
 v_match:=greatest(1,coalesce((room.state->>'match_no')::integer,1));
 insert into public.igr_v107_029_reports(room_code,match_no) values(room.code,v_match) on conflict(room_code,match_no) do nothing;
 select * into v_report from public.igr_v107_029_reports where room_code=room.code and match_no=v_match for update;
 if p_patch is not null then
  if v_report.status='submitted' then raise exception 'report already submitted'; end if;
  if jsonb_typeof(p_patch)<>'object' then raise exception 'invalid patch'; end if;
  for ky,val in select key,value from jsonb_each(p_patch) loop
   if not ky=any(wanted) or jsonb_typeof(val)<>'string' then raise exception 'invalid report field'; end if;
   content:=trim(val#>>'{}');
   if char_length(content)>1200 then raise exception 'report field too long'; end if;
   if content<>'' then perform igr_private.assert_ugc(content,1200,false); end if;
   normalized:=normalized||jsonb_build_object(ky,content);
  end loop;
  update public.igr_v107_029_reports set fields=coalesce(v_report.fields,'{}'::jsonb)||normalized,
    editor_player=actor.id,updated_at=now() where room_code=room.code and match_no=v_match;
  select * into v_report from public.igr_v107_029_reports where room_code=room.code and match_no=v_match;
 end if;
 if p_submit then
  if actor.public_role<>'enqueteur' then raise exception 'only investigator may submit'; end if;
  if room.cycle<>3 then raise exception 'final cycle required'; end if;
  if v_report.status='submitted' then raise exception 'report already submitted'; end if;
  foreach ky in array array['santa_ceniza','activities','responsibilities'] loop
   if length(trim(coalesce(v_report.fields->>ky,'')))<12 then raise exception 'complete three conclusions'; end if;
  end loop;
  update public.igr_v107_029_reports set status='submitted',submitted_at=now(),editor_player=actor.id,updated_at=now() where room_code=room.code and match_no=v_match;
  select * into v_report from public.igr_v107_029_reports where room_code=room.code and match_no=v_match;
  insert into public.igr_v4_events(room_code,event_type,visibility,payload)
    values(room.code,'public_announcement','public',jsonb_build_object('title','RAPPORT REMIS','text','Le camp d’enquête a déposé son rapport final sur Los Salcedo. Son contenu demeure confidentiel.','source','grey_room','public_broadcast',true,'verified',true));
 end if;
 return jsonb_build_object('fields',v_report.fields,'status',v_report.status,'updated_at',v_report.updated_at,'submitted_at',v_report.submitted_at);
end $function$;
