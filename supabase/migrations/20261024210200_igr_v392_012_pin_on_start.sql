do $m$
declare src text;old_text text;
begin
 src=pg_get_functiondef('public.igr_v4_start_game(text,uuid)'::regprocedure);
 old_text=$old$  if r.scenario_id='011' then
    if coalesce((igr_private.igr_v371_011_release_status()->>'eligible')::boolean,false) is not true then raise exception '011 gated';end if;
    if not igr_private.igr_v371_011_pin_room(r.code) then raise exception '011 snapshot unavailable';end if;
  end if;$old$;
 if position('igr_v391_012_pin_room' in src)>0 then return;end if;
 if position(old_text in src)=0 then raise exception '012 start anchor missing';end if;
 src=replace(src,old_text,old_text||$new$
  if r.scenario_id='012' then
    if coalesce((igr_private.igr_v391_012_release_status()->>'eligible')::boolean,false) is not true then raise exception '012 gated';end if;
    if not igr_private.igr_v391_012_pin_room(r.code) then raise exception '012 snapshot unavailable';end if;
  end if;$new$);
 execute src;
end $m$;