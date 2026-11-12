-- Scenario 007 v290, additive selection upgrade. No private truth, graded answer keys
-- or variant-specific clues may be committed in this public SQL file.
-- For rooms pinned to v290 manuscripts, prefer independent source document chains
-- when offering an otherwise neutral secondary clue. Older v289 rooms keep their
-- existing deterministic selection policy. All offers are served role-checked
-- and never carry results to the browser before an authorized investigation.

CREATE OR REPLACE FUNCTION igr_private.igr_v289_007_choices(p_room text, p_cycle integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare m jsonb;core jsonb;main jsonb;side jsonb;prev jsonb;
begin
 if p_cycle not between 1 and 3 or not coalesce(igr_private.igr_v289_007_enabled(p_room),false)
 then return '[]'::jsonb;end if;
 select manuscript into m from igr_private.igr_v99_room_canons where room_code=upper(btrim(p_room)) and scenario_id='007';
 core:=m->'v280_investigations';
 select coalesce(jsonb_agg(jsonb_build_object('id','007_'||ord::text,'title',e->>'title','cycle',p_cycle) order by ord),'[]'::jsonb)
 into main from jsonb_array_elements(core) with ordinality z(e,ord) where (e->>'cycle')::int=p_cycle;
 prev:=case when p_cycle>1 then igr_private.igr_v289_007_prior_alignment(p_room,p_cycle-1)
 else '{}'::jsonb end;
 with choices as (
 select i as item,
  case when coalesce((prev->>'ready')::boolean,false) then
   coalesce((select sum(-40*coalesce((prev->'wrong'->>ax.axis)::int,0)
       +9*coalesce((prev->'correct'->>ax.axis)::int,0))
       from jsonb_array_elements_text(i->'focus_axes') ax(axis)),0)
   else 0 end score,
  md5(upper(btrim(p_room))||':'||p_cycle::text||':target:'||(i->>'id')) tie
 from jsonb_array_elements(m->'v289_optional_investigations') i
 where (i->>'cycle')::int=p_cycle and coalesce((i->>'optional')::boolean,false)
 ),selected as (
 select * from choices order by score,tie limit 1
 ),independent as (
 select c.* from choices c where c.item->>'id'<>(select s.item->>'id' from selected s)
 order by case when m ? 'v290_editorial' and exists (
   select 1 from jsonb_array_elements_text(coalesce(c.item->'source_ids','[]'::jsonb)) x(src)
   join jsonb_array_elements_text(coalesce((select s.item->'source_ids' from selected s),'[]'::jsonb)) y(src)
   on x.src=y.src) then 1 else 0 end,
 case when exists (
   select 1 from jsonb_array_elements_text(c.item->'focus_axes') f(axis)
   join jsonb_array_elements_text((select s.item->'focus_axes' from selected s)) g(axis) on f.axis=g.axis
 ) then 1 else 0 end,
 md5(upper(btrim(p_room))||':'||p_cycle::text||':independent:'||(c.item->>'id'))
 limit 1
 ), offered as (select item from selected union all select item from independent)
 select coalesce(jsonb_agg(jsonb_build_object('id','007_'||right(item->>'id',2),
 'title',item->>'title','cycle',p_cycle)
 order by md5(upper(btrim(p_room))||':'||p_cycle::text||':mixed:'||(item->>'id'))),'[]'::jsonb)
 into side from offered;
 return main||side;
end $function$;

revoke all on function igr_private.igr_v289_007_choices(text,integer) from public,anon,authenticated;

-- Protected QA on private manuscripts:
-- select igr_private.igr_v290_007_candidate_smoke();
-- select igr_private.igr_v289_007_live_new_room_smoke();
