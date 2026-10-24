do $m$
declare src text;old_text text;
begin
 src=pg_get_functiondef('public.igr_v4_start_game(text,uuid)'::regprocedure);
 old_text=$old$  if r.scenario_id='014' then
    if coalesce((igr_private.igr_v431_014_release_status()->>'eligible')::boolean,false) is not true then raise exception '014 gated';end if;
    if not igr_private.igr_v431_014_pin_room(r.code) then raise exception '014 snapshot unavailable';end if;
  end if;$old$;
 if position('igr_v451_015_pin_room' in src)>0 then return;end if;
 if position(old_text in src)=0 then raise exception '015 start anchor missing';end if;
 src=replace(src,old_text,old_text||$new$
  if r.scenario_id='015' then
    if coalesce((igr_private.igr_v451_015_release_status()->>'eligible')::boolean,false) is not true then raise exception '015 gated';end if;
    if not igr_private.igr_v451_015_pin_room(r.code) then raise exception '015 snapshot unavailable';end if;
  end if;$new$);
 execute src;
end $m$;