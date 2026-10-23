do $m$
declare src text;a text;b text;
begin
src=pg_get_functiondef('public.igr_v4_sync(text,uuid)'::regprocedure);
a=$old$'investigation_007_used',exists(select 1 from public.igr_v4_actions a where a.room_code=r.code and a.cycle=r.cycle and a.action_type='investigation_007'),$old$;
b=$new$
'investigation_008',case when r.scenario_id='008' and p.public_role in ('enqueteur','analyste') and r.status='playing' and r.cycle between 1 and 3 then
 (select coalesce(jsonb_agg(jsonb_build_object('id',v->>'id','title',v->>'title','cycle',(v->>'cycle')::int) order by v->>'id'),'[]'::jsonb)
 from jsonb_array_elements(coalesce(pack->'investigation_008','[]'::jsonb)) v where (v->>'cycle')::int=r.cycle)
 else '[]'::jsonb end,
'investigation_008_used',exists(select 1 from public.igr_v4_actions a where a.room_code=r.code and a.cycle=r.cycle and a.action_type='investigation_008'),$new$;
if position(b in src)=0 then
 if position(a in src)=0 then raise exception '008 sync field anchor missing';end if;
 execute replace(src,a,a||b);
end if;
end $m$;