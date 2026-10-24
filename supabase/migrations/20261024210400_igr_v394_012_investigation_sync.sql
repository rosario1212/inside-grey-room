do $m$
declare src text;a text;b text;
begin
 src=pg_get_functiondef('public.igr_v4_sync(text,uuid)'::regprocedure);
 a=$old$'investigation_011_used',exists(select 1 from public.igr_v4_actions a where a.room_code=r.code and a.cycle=r.cycle and a.action_type='investigation_011'),$old$;
 b=$new$
'investigation_012',case when r.scenario_id='012' and p.public_role in ('enqueteur','analyste') and r.status='playing' and r.cycle between 1 and 3 then
 (select coalesce(jsonb_agg(jsonb_build_object('id',v->>'id','title',v->>'title','cycle',(v->>'cycle')::int) order by v->>'id'),'[]'::jsonb)
  from jsonb_array_elements(coalesce(pack->'investigation_012','[]'::jsonb)) v
  where (v->>'cycle')::int=r.cycle)
 else '[]'::jsonb end,
'investigation_012_used',exists(select 1 from public.igr_v4_actions a where a.room_code=r.code and a.cycle=r.cycle and a.action_type='investigation_012'),$new$;
 if position(b in src)>0 then return;end if;
 if position(a in src)=0 then raise exception '012 sync metadata anchor missing';end if;
 execute replace(src,a,a||b);
end $m$;