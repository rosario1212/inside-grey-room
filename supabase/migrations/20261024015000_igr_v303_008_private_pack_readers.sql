do $m$
declare src text; a text; b text; f text; sig text; rv text; pv text; records text[]=array[
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
 a=format('if %s.scenario_id=''007'' then %s:=coalesce(igr_private.igr_v281_007_pinned_pack(%s.code),%s);end if;',rv,pv,rv,pv);
 b=format(' if %s.scenario_id=''008'' then %s:=igr_private.igr_v301_008_pinned_pack(%s.code);if %s is null then raise exception ''008 private snapshot missing'';end if;end if;',rv,pv,rv,pv);
 if position(b in src)>0 then continue;end if;
 if position(a in src)=0 then raise exception '008 pack reader anchor missing in %',sig;end if;
 src=replace(src,a,a||b);
 execute src;
end loop;
end $m$;