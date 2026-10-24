create or replace function igr_private.igr_v457_015_reveal_enrich(p_room text,p_base jsonb)
returns jsonb language plpgsql stable security definer set search_path=pg_catalog
as $f$
declare r public.igr_v4_rooms%rowtype; pack jsonb; truth_ jsonb;
  item jsonb; player_ public.igr_v4_players%rowtype; guess jsonb; correct_ boolean;
  out_results jsonb:='[]'::jsonb; winners jsonb:='[]'::jsonb; evaluation jsonb:='{}'::jsonb;
  newitem jsonb; all_correct boolean:=true; investigator_count int:=0;
begin
 select * into r from public.igr_v4_rooms where code=upper(trim(p_room));
 if not found or r.scenario_id<>'015' then return p_base;end if;
 pack=igr_private.igr_v451_015_pinned_pack(r.code);
 if pack is null then raise exception '015 reveal snapshot unavailable';end if;
 truth_=pack->'truth'->'reconstruction_015';
 if jsonb_typeof(truth_)<>'object' then raise exception '015 reveal truth missing';end if;
 for item in select value from jsonb_array_elements(coalesce(p_base->'results','[]'::jsonb)) loop
  newitem=item;
  select * into player_ from public.igr_v4_players
   where room_code=r.code and id=(item->>'player_id')::uuid;
  if found and player_.public_role in ('enqueteur','analyste') then
   investigator_count=investigator_count+1;
   select a.payload->'reconstruction_015' into guess
   from public.igr_v4_actions a where a.room_code=r.code and a.player_id=player_.id
     and a.action_type='final_lock' order by a.id desc limit 1;
   correct_=coalesce(guess=truth_,false);
   all_correct=all_correct and correct_;
   newitem=newitem||jsonb_build_object(
    'reconstruction_015_correct',correct_,
    'success',coalesce((item->>'success')::boolean,false) and correct_,
    'text',coalesce(item->>'text','') || case when correct_ then
      ' · Reconstitution sous serment exacte.' else ' · Reconstitution des faits erronée.' end);
   if not coalesce((newitem->>'success')::boolean,false) then
     newitem=jsonb_set(newitem,'{achievements}','[]'::jsonb,true);
   end if;
   evaluation=evaluation||jsonb_build_object(player_.public_role,
      jsonb_build_object('guess',guess,'correct',correct_));
  end if;
  out_results=out_results||jsonb_build_array(newitem);
  if coalesce((newitem->>'success')::boolean,false) then
    winners=winners||jsonb_build_array((newitem->>'player_id')::uuid);
  end if;
 end loop;
 return p_base || jsonb_build_object(
  'results',out_results,'winners',winners,'winner_count',jsonb_array_length(winners),
  'reconstruction_015',jsonb_build_object('truth',truth_,'investigators',evaluation,
      'camp_reconstruction_complete',all_correct and investigator_count=2));
end;
$f$;
revoke all on function igr_private.igr_v457_015_reveal_enrich(text,jsonb) from public,anon,authenticated;

do $m$
declare src text; a text; b text; tail_ text;
begin
 src=pg_get_functiondef('public.igr_v52_make_reveal(text)'::regprocedure);
 a='return igr_private.igr_v437_014_reveal_enrich(p_room, igr_private.igr_v417_013_reveal_enrich(p_room, igr_private.igr_v397_012_reveal_enrich(p_room, igr_private.igr_v377_011_reveal_enrich(p_room, igr_private.igr_v357_010_reveal_enrich(p_room, igr_private.igr_v337_009_reveal_enrich(p_room, igr_private.igr_v307_008_reveal_enrich(p_room, base||jsonb_build_object(';
 b='return igr_private.igr_v457_015_reveal_enrich(p_room, igr_private.igr_v437_014_reveal_enrich(p_room, igr_private.igr_v417_013_reveal_enrich(p_room, igr_private.igr_v397_012_reveal_enrich(p_room, igr_private.igr_v377_011_reveal_enrich(p_room, igr_private.igr_v357_010_reveal_enrich(p_room, igr_private.igr_v337_009_reveal_enrich(p_room, igr_private.igr_v307_008_reveal_enrich(p_room, base||jsonb_build_object(';
 if position(b in src)>0 then return;end if;
 if position(a in src)=0 then raise exception '015 final reveal wrapper anchor missing';end if;
 src=replace(src,a,b);
 tail_='''incomplete_decisions'',jsonb_array_length(absent)>0'||chr(10)||'  ))))))));'||chr(10)||'end';
 if position(tail_ in src)=0 then raise exception '015 final reveal closing bracket missing';end if;
 src=replace(src,tail_,'''incomplete_decisions'',jsonb_array_length(absent)>0'||chr(10)||'  )))))))));'||chr(10)||'end');
 execute src;
end $m$;