-- Pending editorial release: do not inject the new 029 story into legacy
-- three-suspect sessions until the gated four-witness engine passes QA.
CREATE OR REPLACE FUNCTION igr_private.igr_v107_029_public_pressure()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare title_text text; body_text text; origin_cycle int;
begin
 if new.scenario_id<>'029' or not igr_private.igr_v108_029_is_enabled() then return new; end if;
 if new.status='playing' and old.status='lobby' then
  title_text:='MESSAGE DE LOS SALCEDO · OUVERTURE';
  body_text:='Trois ont demandé protection, mais le quatrième n’aura plus besoin de sa voix. Vous êtes libres de continuer tandis qu’eux ne le sont pas.';
  origin_cycle:=1;
 elsif new.status='playing' and old.status='playing' and new.cycle=2 and old.cycle is distinct from 2 then
  title_text:='MESSAGE DE LOS SALCEDO · LA FUITE';
  body_text:='Vous cherchez qui nous a prévenus que les trois fugitifs étaient chez vous. Cherchez autant que vous voulez. Pendant ce temps, leurs familles crient à l’aide.';
  origin_cycle:=2;
 elsif new.status='playing' and old.status='playing' and new.cycle=3 and old.cycle is distinct from 3 then
  title_text:='MESSAGE DE LOS SALCEDO · LES VINGT CAPTIFS';
  body_text:='Vous avez trois rescapés sous votre protection. Nous avons encore vingt prisonniers à Santa Ceniza. Continuez votre enquête si vous voulez. Mais si ces vingt personnes meurent, ce sera de votre faute.';
  origin_cycle:=3;
 else return new; end if;
 insert into public.igr_v4_events(room_code,event_type,visibility,cycle,payload)
  values(new.code,'public_announcement','public',origin_cycle,
   jsonb_build_object('title',title_text,'text',body_text,'source','cartel','verified',false,'public_broadcast',true,'threat_not_confirmed',true));
 return new;
end $function$;
CREATE OR REPLACE FUNCTION public.igr_v107_029_report(p_code text, p_player_token uuid, p_patch jsonb DEFAULT NULL::jsonb, p_submit boolean DEFAULT false)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare actor public.igr_v4_players%rowtype; room public.igr_v4_rooms%rowtype;
  v_report public.igr_v107_029_reports%rowtype; ky text; val jsonb; content text;
  normalized jsonb:='{}'::jsonb;
  wanted constant text[] := array['santa_ceniza','activities','responsibilities','protection'];
begin
 perform igr_private.rate_limit('v107_029_report',coalesce(p_player_token::text,'none'),30,60);
 select * into actor from public.igr_v4_players where room_code=upper(trim(p_code)) and player_token=p_player_token;
 if not found or actor.public_role not in ('enqueteur','analyste') then raise exception 'forbidden'; end if;
 select * into room from public.igr_v4_rooms where code=actor.room_code for update;
 if not found or room.scenario_id<>'029' or room.status not in ('playing','finished') or not igr_private.igr_v108_029_is_enabled() then raise exception 'scenario not active'; end if;
 insert into public.igr_v107_029_reports(room_code) values(room.code) on conflict(room_code) do nothing;
 select * into v_report from public.igr_v107_029_reports where room_code=room.code for update;
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
    editor_player=actor.id,updated_at=now() where room_code=room.code;
  select * into v_report from public.igr_v107_029_reports where room_code=room.code;
 end if;
 if p_submit then
  if actor.public_role<>'enqueteur' then raise exception 'only investigator may submit'; end if;
  if room.cycle<>3 then raise exception 'final cycle required'; end if;
  if v_report.status='submitted' then raise exception 'report already submitted'; end if;
  foreach ky in array array['santa_ceniza','activities','responsibilities'] loop
   if length(trim(coalesce(v_report.fields->>ky,'')))<12 then raise exception 'complete three conclusions'; end if;
  end loop;
  update public.igr_v107_029_reports set status='submitted',submitted_at=now(),editor_player=actor.id,updated_at=now() where room_code=room.code;
  select * into v_report from public.igr_v107_029_reports where room_code=room.code;
  insert into public.igr_v4_events(room_code,event_type,visibility,payload)
    values(room.code,'public_announcement','public',jsonb_build_object('title','RAPPORT REMIS','text','Le camp d’enquête a déposé son rapport final sur Los Salcedo. Son contenu demeure confidentiel.','source','grey_room','public_broadcast',true,'verified',true));
 end if;
 return jsonb_build_object('fields',v_report.fields,'status',v_report.status,'updated_at',v_report.updated_at,'submitted_at',v_report.submitted_at);
end $function$;
