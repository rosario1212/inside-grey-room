do $m$
declare src text;anchor text;addition text;sig text;rv text;pv text; records text[]=array[
 'public.igr_v4_build_private_card(text,uuid)',
 'public.igr_v4_sync(text,uuid)',
 'public.igr_v4_emit_trame(text)',
 'public.igr_v4_make_reveal(text)',
 'public.igr_v52_make_reveal(text)'
];
begin
 foreach sig in array records loop
  src=pg_get_functiondef(sig::regprocedure);
  rv=case when sig='public.igr_v4_emit_trame(text)' then 'v_room' else 'r' end;
  pv=case when sig='public.igr_v4_emit_trame(text)' then 'v_pack' else 'pack' end;
  anchor=format('if %s.scenario_id=''008'' then %s:=igr_private.igr_v301_008_pinned_pack(%s.code);if %s is null then raise exception ''008 private snapshot missing'';end if;end if;',rv,pv,rv,pv);
  addition=format(' if %s.scenario_id=''009'' then %s:=igr_private.igr_v331_009_pinned_pack(%s.code);if %s is null then raise exception ''009 private snapshot missing'';end if;end if;',rv,pv,rv,pv);
  if position(addition in src)>0 then continue;end if;
  if position(anchor in src)=0 then raise exception '009 private reader anchor missing in %',sig;end if;
  execute replace(src,anchor,anchor||addition);
 end loop;
end $m$;